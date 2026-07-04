import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventSlotAxisType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EnvVars } from '../config/env.validation';
import * as crypto from 'crypto';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import {
  PKCEData,
  GoogleTokenResponse,
  GoogleIdTokenPayload,
  GoogleCalendarEventsResponse,
  GoogleCalendarCalenderResponse,
  CalendarEventDto,
  CalendarConnectionStatus,
  CalendarConflictResult,
} from './google-api.types';
import { EventCapabilitiesService } from '../events/shared/services/event-capabilities.service';
import { EventScheduleService } from '../events/shared/services/event-schedule.service';
import { TokenCipherService } from './services/token-cipher.service';
import { zonedWallClockToInstant } from '../common/time';

@Injectable()
export class GoogleCalendarService {
  private pkceStore = new Map<string, PKCEData>();

  // Google Calendar API scopes
  private readonly CALENDAR_SCOPES = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/calendar.readonly',
  ].join(' ');

  constructor(
    private prisma: PrismaService,
    private eventCapabilitiesService: EventCapabilitiesService,
    private eventScheduleService: EventScheduleService,
    private tokenCipher: TokenCipherService,
    private config: ConfigService<EnvVars, true>,
  ) {}

  // PKCE helpers
  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  private generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  private generateState(): string {
    return crypto.randomBytes(16).toString('base64url');
  }

  // Store PKCE data with userId
  private storePKCE(state: string, data: PKCEData): void {
    this.pkceStore.set(state, data);
    // Auto-cleanup after 10 minutes
    setTimeout(() => this.pkceStore.delete(state), 10 * 60 * 1000);
  }

  // Retrieve and remove PKCE data
  private getPKCE(state: string): PKCEData | undefined {
    const data = this.pkceStore.get(state);
    if (data) {
      this.pkceStore.delete(state);
    }
    return data;
  }

  /**
   * 取得 Google Calendar OAuth URL
   * 這會要求用戶授權 Calendar 存取權限
   */
  getConnectUrl(redirect?: string): string {
    const state = this.generateState();
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    this.storePKCE(state, { codeVerifier, codeChallenge, redirect });

    const params = new URLSearchParams({
      client_id: this.config.get('GOOGLE_CLIENT_ID', { infer: true }),
      redirect_uri: this.config.get('GOOGLE_CALENDAR_REDIRECT_URI', {
        infer: true,
      }),
      response_type: 'code',
      scope: this.CALENDAR_SCOPES,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      access_type: 'offline', // 取得 refresh_token
      prompt: 'consent', // 強制顯示同意畫面，確保取得 refresh_token
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  /**
   * 處理 Google Calendar OAuth callback
   */
  async handleCallback(
    code: string,
    state: string,
    userId: string,
  ): Promise<{ success: boolean; googleEmail?: string; redirect?: string }> {
    const pkceData = this.getPKCE(state);
    if (!pkceData) {
      throw new UnauthorizedException('Invalid or expired state');
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post<GoogleTokenResponse>(
      'https://oauth2.googleapis.com/token',
      {
        code,
        client_id: this.config.get('GOOGLE_CLIENT_ID', { infer: true }),
        client_secret: this.config.get('GOOGLE_CLIENT_SECRET', { infer: true }),
        redirect_uri: this.config.get('GOOGLE_CALENDAR_REDIRECT_URI', {
          infer: true,
        }),
        grant_type: 'authorization_code',
        code_verifier: pkceData.codeVerifier,
      },
    );

    const { access_token, refresh_token, expires_in, scope, id_token } =
      tokenResponse.data;

    // Decode and verify id_token to get Google account info
    if (!id_token) {
      throw new BadRequestException('No ID token received from Google');
    }

    const decoded = jwt.decode(id_token, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      throw new UnauthorizedException('Invalid ID token');
    }

    const payload = decoded.payload as GoogleIdTokenPayload;

    // Verify claims
    if (payload.aud !== this.config.get('GOOGLE_CLIENT_ID', { infer: true })) {
      throw new UnauthorizedException('Invalid audience');
    }
    if (
      payload.iss !== 'https://accounts.google.com' &&
      payload.iss !== 'accounts.google.com'
    ) {
      throw new UnauthorizedException('Invalid issuer');
    }

    const googleAccountId = payload.sub;
    const googleEmail = payload.email;

    // Calculate token expiry time
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

    // 加密 token 後再儲存
    const encryptedAccessToken = this.tokenCipher.encrypt(access_token);
    const encryptedRefreshToken = refresh_token
      ? this.tokenCipher.encrypt(refresh_token)
      : undefined;

    // Upsert Google Calendar connection

    await this.prisma.googleCalendarConnection.upsert({
      where: { userId },
      create: {
        userId,
        googleAccountId,
        googleEmail,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt,
        scope,
      },
      update: {
        googleAccountId,
        googleEmail,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken, // 保留舊的 refresh_token 如果沒有新的
        tokenExpiresAt,
        scope,
      },
    });

    return { success: true, googleEmail, redirect: pkceData.redirect };
  }

  /**
   * 取得當前用戶的 Google Calendar 連結狀態
   */
  async getConnectionStatus(userId: string): Promise<CalendarConnectionStatus> {
    const connection = await this.prisma.googleCalendarConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      return { connected: false };
    }

    return {
      connected: true,

      googleEmail: connection.googleEmail || undefined,

      connectedAt: connection.createdAt,
    };
  }

  /**
   * 斷開 Google Calendar 連結
   */
  async disconnect(userId: string): Promise<{ success: boolean }> {
    const connection = await this.prisma.googleCalendarConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      throw new BadRequestException('No Google Calendar connection found');
    }

    // Optionally revoke the token
    try {
      const accessToken = this.tokenCipher.decrypt(connection.accessToken);
      await axios.post(
        `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
      );
    } catch {
      // Ignore revoke errors
    }

    await this.prisma.googleCalendarConnection.delete({
      where: { userId },
    });

    return { success: true };
  }

  /**
   * 取得有效的 access token（自動刷新如果過期）
   */
  private async getValidAccessToken(userId: string): Promise<string> {
    const connection = await this.prisma.googleCalendarConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      throw new UnauthorizedException('Google Calendar not connected');
    }

    // Check if token is expired (with 5 minute buffer)

    const isExpired =
      new Date(connection.tokenExpiresAt).getTime() <
      Date.now() + 5 * 60 * 1000;

    if (!isExpired) {
      try {
        return this.tokenCipher.decrypt(connection.accessToken);
      } catch {
        // Decrypt can fail if the encryption key was rotated or the stored
        // ciphertext is corrupted. Treat it as a reconnect-required state
        // rather than leaking a raw 500.
        throw new UnauthorizedException(
          'Stored access token could not be decrypted. Please reconnect Google Calendar.',
        );
      }
    }

    // Refresh the token

    if (!connection.refreshToken) {
      throw new UnauthorizedException(
        'Refresh token not available. Please reconnect Google Calendar.',
      );
    }

    try {
      const tokenResponse = await axios.post<GoogleTokenResponse>(
        'https://oauth2.googleapis.com/token',
        {
          client_id: this.config.get('GOOGLE_CLIENT_ID', { infer: true }),
          client_secret: this.config.get('GOOGLE_CLIENT_SECRET', {
            infer: true,
          }),

          refresh_token: this.tokenCipher.decrypt(connection.refreshToken),
          grant_type: 'refresh_token',
        },
      );

      const { access_token, expires_in } = tokenResponse.data;
      const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

      // Update the stored token

      await this.prisma.googleCalendarConnection.update({
        where: { userId },
        data: {
          accessToken: this.tokenCipher.encrypt(access_token),
          tokenExpiresAt,
        },
      });

      return access_token;
    } catch {
      // If refresh fails, user needs to reconnect
      throw new UnauthorizedException(
        'Failed to refresh token. Please reconnect Google Calendar.',
      );
    }
  }

  /**
   * 取得指定時間範圍內的 Calendar 事件
   */
  async getCalendarEvents(
    userId: string,
    timeMin: Date,
    timeMax: Date,
  ): Promise<CalendarEventDto[]> {
    const accessToken = await this.getValidAccessToken(userId);

    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: 'true', // 展開重複事件
      orderBy: 'startTime',
      maxResults: '250',
    });

    try {
      const [eventResponse, calendarResponse] = await Promise.all([
        axios.get<GoogleCalendarEventsResponse>(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
        axios.get<GoogleCalendarCalenderResponse>(
          `https://www.googleapis.com/calendar/v3/calendars/primary`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      ]);
      const calendarTimeZone = calendarResponse.data.timeZone;

      return eventResponse.data.items
        .filter((event) => event.status !== 'cancelled')
        .map((event) => {
          const isAllDay = !event.start.dateTime;
          let startTime: Date, endTime: Date;
          if (isAllDay) {
            startTime = zonedWallClockToInstant(
              new Date(event.start.date + 'T00:00:00Z'),
              calendarTimeZone,
            );
            endTime = zonedWallClockToInstant(
              new Date(event.end.date + 'T23:59:59Z'),
              calendarTimeZone,
            );
            endTime.setDate(endTime.getDate() - 1);
          } else {
            startTime = new Date(event.start.dateTime!);
            endTime = new Date(event.end.dateTime!);
          }

          return {
            id: event.id,
            summary: event.summary || '(No title)',
            description: event.description,
            startTime,
            endTime,
            isAllDay,
          };
        });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new UnauthorizedException(
          'Calendar access denied. Please reconnect Google Calendar.',
        );
      }
      throw error;
    }
  }

  /**
   * 取得活動時間範圍內與 Calendar 事件衝突的時段
   * 這會返回與活動時間格子衝突的 slot IDs
   */
  async getConflictingSlots(
    userId: string,
    eventId: string,
  ): Promise<CalendarConflictResult> {
    // Get the event details
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        slots: true,
        oneTimeSchedule: true,
        recurringSchedule: true,
      },
    });

    if (!event || event.isDeleted) {
      throw new BadRequestException('Event not found');
    }

    const capabilities = this.eventCapabilitiesService.buildCapabilities(
      event.type,
    );
    if (!capabilities.supportsCalendarConflict) {
      throw new BadRequestException(
        'Google Calendar conflict check is not supported for this event type',
      );
    }

    const calendarRange = this.eventScheduleService.getCalendarRange(event);
    if (!calendarRange) {
      throw new BadRequestException(
        'Google Calendar conflict check is not supported for this event type',
      );
    }

    // Get calendar events for the event's date range
    const calendarEvents = await this.getCalendarEvents(
      userId,
      calendarRange.timeMin,
      calendarRange.timeMax,
    );

    // Find conflicting slots
    const conflictingSlotIds: string[] = [];

    for (const slot of event.slots) {
      if (slot.axisType !== EventSlotAxisType.DATE || slot.axisDate == null) {
        continue;
      }

      // Convert slot wall-clock to a real instant using the event's time zone,
      // so it can be compared against calendar events (which are real instants).
      const wallStart = new Date(slot.axisDate);
      wallStart.setUTCHours(0, 0, 0, 0);
      wallStart.setUTCMinutes(slot.startMinute);
      const slotStart = zonedWallClockToInstant(wallStart, event.timeZone);

      const wallEnd = new Date(slot.axisDate);
      wallEnd.setUTCHours(0, 0, 0, 0);
      wallEnd.setUTCMinutes(slot.endMinute);
      const slotEnd = zonedWallClockToInstant(wallEnd, event.timeZone);

      // Check if any calendar event conflicts with this slot
      for (const calEvent of calendarEvents) {
        // Check for overlap
        if (slotStart < calEvent.endTime && slotEnd > calEvent.startTime) {
          conflictingSlotIds.push(slot.id);
          break; // No need to check other calendar events for this slot
        }
      }
    }

    return {
      calendarEvents,
      conflictingSlotIds,
    };
  }
}
