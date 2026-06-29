import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import axios from 'axios';
import { TokenVerificationService } from './services/token-verification.service';
import { EnvVars } from '../config/env.validation';

interface PKCEData {
  codeVerifier: string;
  codeChallenge: string;
  redirect?: string;
}

@Injectable()
export class AuthService {
  private pkceStore = new Map<string, PKCEData>();

  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private tokenVerificationService: TokenVerificationService,
    private config: ConfigService<EnvVars, true>,
  ) {}

  // PKCE helpers
  generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  generateState(): string {
    return crypto.randomBytes(16).toString('base64url');
  }

  // Store PKCE data
  storePKCE(state: string, data: PKCEData): void {
    this.pkceStore.set(state, data);
    // Auto-cleanup after 10 minutes
    setTimeout(() => this.pkceStore.delete(state), 10 * 60 * 1000);
  }

  // Retrieve and remove PKCE data
  getPKCE(state: string): PKCEData | undefined {
    const data = this.pkceStore.get(state);
    if (data) {
      this.pkceStore.delete(state);
    }
    return data;
  }

  // Google OAuth
  getGoogleAuthUrl(redirect?: string): string {
    const state = this.generateState();
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    this.storePKCE(state, { codeVerifier, codeChallenge, redirect });

    const params = new URLSearchParams({
      client_id: this.config.get('GOOGLE_CLIENT_ID', { infer: true }),
      redirect_uri: this.config.get('GOOGLE_REDIRECT_URI', { infer: true }),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async handleGoogleCallback(code: string, state: string) {
    const pkceData = this.getPKCE(state);
    if (!pkceData) {
      throw new UnauthorizedException('Invalid or expired state');
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        code,
        client_id: this.config.get('GOOGLE_CLIENT_ID', { infer: true }),
        client_secret: this.config.get('GOOGLE_CLIENT_SECRET', { infer: true }),
        redirect_uri: this.config.get('GOOGLE_REDIRECT_URI', { infer: true }),
        grant_type: 'authorization_code',
        code_verifier: pkceData.codeVerifier,
      },
    );

    const { id_token } = tokenResponse.data as { id_token: string };

    const payload = await this.tokenVerificationService.verifyIdToken({
      token: id_token,
      audience: this.config.get('GOOGLE_CLIENT_ID', { infer: true }),
      issuers: ['https://accounts.google.com', 'accounts.google.com'],
      jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
    });

    // Extract user info
    const { sub, email, name, picture } = payload;

    // Upsert user
    const user = await this.usersService.upsertUserFromIdentity(
      'google',
      sub,
      email,
      name,
      picture,
    );

    return { user, redirect: pkceData.redirect };
  }

  // LINE OAuth (使用 LINE Login Channel)
  getLineAuthUrl(redirect?: string): string {
    const state = this.generateState();
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    this.storePKCE(state, { codeVerifier, codeChallenge, redirect });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.get('LINE_LOGIN_CHANNEL_ID', { infer: true }),
      redirect_uri: this.config.get('LINE_LOGIN_REDIRECT_URI', { infer: true }),
      state,
      scope: 'openid email profile',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `https://access.line.me/oauth2/v2.1/authorize?${params}`;
  }

  async handleLineCallback(code: string, state: string) {
    const pkceData = this.getPKCE(state);
    if (!pkceData) {
      throw new UnauthorizedException('Invalid or expired state');
    }

    // Exchange code for tokens (使用 LINE Login Channel)
    const tokenResponse = await axios.post(
      'https://api.line.me/oauth2/v2.1/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.get('LINE_LOGIN_REDIRECT_URI', {
          infer: true,
        }),
        client_id: this.config.get('LINE_LOGIN_CHANNEL_ID', { infer: true }),
        client_secret: this.config.get('LINE_LOGIN_CHANNEL_SECRET', {
          infer: true,
        }),
        code_verifier: pkceData.codeVerifier,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const { id_token } = tokenResponse.data as { id_token: string };

    const payload = await this.tokenVerificationService.verifyLineIdToken(
      id_token,
      this.config.get('LINE_LOGIN_CHANNEL_ID', { infer: true }),
    );

    // Extract user info
    const { sub, email, name, picture } = payload;

    // Upsert user
    const user = await this.usersService.upsertUserFromIdentity(
      'line',
      sub,
      email,
      name,
      picture,
    );

    // 關聯 LINE userId 到所有群組成員記錄
    await this.linkUserToGroupMembers(user.id, sub);

    return { user, redirect: pkceData.redirect };
  }

  /**
   * 當使用者 OAuth 登入後，關聯其 LINE 身份到群組成員
   */
  private async linkUserToGroupMembers(userId: string, lineUserId: string) {
    // 更新所有該 LINE userId 的群組成員記錄
    await this.prisma.lineGroupMember.updateMany({
      where: { lineUserId },
      data: { userId },
    });

    // 同時更新 EventExpectedParticipant
    await this.prisma.eventExpectedParticipant.updateMany({
      where: { lineUserId },
      data: { userId },
    });
  }

  /**
   * LIFF Token 登入
   * 使用 LIFF Access Token 驗證並登入使用者
   *
   * @param accessToken - LIFF Access Token
   * @returns User 資訊
   */
  async handleLiffLogin(accessToken: string) {
    // 1. 使用 LINE API 驗證 access token 並取得使用者資訊
    const verifyResponse = await axios.get(
      'https://api.line.me/oauth2/v2.1/verify',
      {
        params: { access_token: accessToken },
      },
    );

    const { client_id, expires_in } = verifyResponse.data as {
      client_id: string;
      expires_in: number;
    };

    // 驗證 client_id 是否為我們的 LIFF App 所屬的 Channel
    // LIFF 使用的是 LINE Login Channel
    if (
      client_id !== this.config.get('LINE_LOGIN_CHANNEL_ID', { infer: true })
    ) {
      throw new UnauthorizedException('Invalid LIFF access token');
    }

    if (expires_in <= 0) {
      throw new UnauthorizedException('LIFF access token expired');
    }

    // 2. 取得使用者 Profile
    const profileResponse = await axios.get('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const { userId, displayName, pictureUrl } = profileResponse.data as {
      userId: string;
      displayName: string;
      pictureUrl?: string;
    };

    // 3. Upsert user（與 LINE OAuth 登入相同邏輯）
    const user = await this.usersService.upsertUserFromIdentity(
      'line',
      userId,
      undefined, // LIFF 無法取得 email
      displayName,
      pictureUrl,
    );

    // 4. 關聯 LINE userId 到所有群組成員記錄
    await this.linkUserToGroupMembers(user.id, userId);

    return { user };
  }
}
