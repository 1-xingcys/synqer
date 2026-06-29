import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { EventType } from '@prisma/client';
import { GoogleCalendarService } from './google-calendar.service';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { EventCapabilitiesService } from '../events/shared/services/event-capabilities.service';
import { EventScheduleService } from '../events/shared/services/event-schedule.service';
import { TokenCipherService } from './services/token-cipher.service';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  decode: jest.fn(),
}));
import * as jwt from 'jsonwebtoken';
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('GoogleCalendarService', () => {
  let service: GoogleCalendarService;
  let prismaService: PrismaService;
  let eventCapabilitiesService: jest.Mocked<EventCapabilitiesService>;
  let eventScheduleService: jest.Mocked<EventScheduleService>;

  const mockPrismaService = {
    googleCalendarConnection: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
  };

  const mockEventCapabilitiesService = {
    buildCapabilities: jest.fn(),
  };

  const mockEventScheduleService = {
    getCalendarRange: jest.fn(),
  };

  // Identity cipher: keeps token-flow assertions readable while the real
  // encryption is covered by token-cipher.service.spec.ts.
  const mockTokenCipher = {
    encrypt: jest.fn((value: string) => value),
    decrypt: jest.fn((value: string) => value),
    isEncrypted: jest.fn((value: string) => value.startsWith('v1:')),
  };

  // Use fake timers to prevent setTimeout from keeping Jest open
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    // Set environment variables
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_CALENDAR_REDIRECT_URI = 'http://localhost:3000/callback';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleCalendarService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventCapabilitiesService,
          useValue: mockEventCapabilitiesService,
        },
        {
          provide: EventScheduleService,
          useValue: mockEventScheduleService,
        },
        {
          provide: TokenCipherService,
          useValue: mockTokenCipher,
        },
      ],
    }).compile();

    service = module.get<GoogleCalendarService>(GoogleCalendarService);
    prismaService = module.get<PrismaService>(PrismaService);
    eventCapabilitiesService = module.get(EventCapabilitiesService);
    eventScheduleService = module.get(EventScheduleService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConnectUrl', () => {
    it('should generate a valid OAuth URL', () => {
      const url = service.getConnectUrl();

      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('response_type=code');
      expect(url).toContain('code_challenge_method=S256');
      expect(url).toContain('access_type=offline');
      expect(url).toContain('prompt=consent');
    });

    it('should include redirect parameter in state when provided', () => {
      const url = service.getConnectUrl('/events/123');

      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain('state=');
    });
  });

  describe('getConnectionStatus', () => {
    it('should return connected: false when no connection exists', async () => {
      mockPrismaService.googleCalendarConnection.findUnique.mockResolvedValue(
        null,
      );

      const result = await service.getConnectionStatus('user-123');

      expect(result).toEqual({ connected: false });
      expect(
        mockPrismaService.googleCalendarConnection.findUnique,
      ).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should return connection details when connection exists', async () => {
      const mockConnection = {
        googleEmail: 'test@gmail.com',
        createdAt: new Date('2024-01-01'),
      };
      mockPrismaService.googleCalendarConnection.findUnique.mockResolvedValue(
        mockConnection,
      );

      const result = await service.getConnectionStatus('user-123');

      expect(result).toEqual({
        connected: true,
        googleEmail: 'test@gmail.com',
        connectedAt: mockConnection.createdAt,
      });
    });

    it('should handle null googleEmail', async () => {
      const mockConnection = {
        googleEmail: null,
        createdAt: new Date('2024-01-01'),
      };
      mockPrismaService.googleCalendarConnection.findUnique.mockResolvedValue(
        mockConnection,
      );

      const result = await service.getConnectionStatus('user-123');

      expect(result).toEqual({
        connected: true,
        googleEmail: undefined,
        connectedAt: mockConnection.createdAt,
      });
    });
  });

  describe('disconnect', () => {
    it('should throw BadRequestException when no connection exists', async () => {
      mockPrismaService.googleCalendarConnection.findUnique.mockResolvedValue(
        null,
      );

      await expect(service.disconnect('user-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should revoke token and delete connection', async () => {
      const mockConnection = {
        accessToken: 'test-access-token',
      };
      mockPrismaService.googleCalendarConnection.findUnique.mockResolvedValue(
        mockConnection,
      );
      mockedAxios.post.mockResolvedValue({});
      mockPrismaService.googleCalendarConnection.delete.mockResolvedValue({});

      const result = await service.disconnect('user-123');

      expect(result).toEqual({ success: true });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/revoke?token=test-access-token',
      );
      expect(
        mockPrismaService.googleCalendarConnection.delete,
      ).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should still delete connection even if revoke fails', async () => {
      const mockConnection = {
        accessToken: 'test-access-token',
      };
      mockPrismaService.googleCalendarConnection.findUnique.mockResolvedValue(
        mockConnection,
      );
      mockedAxios.post.mockRejectedValue(new Error('Revoke failed'));
      mockPrismaService.googleCalendarConnection.delete.mockResolvedValue({});

      const result = await service.disconnect('user-123');

      expect(result).toEqual({ success: true });
      expect(
        mockPrismaService.googleCalendarConnection.delete,
      ).toHaveBeenCalled();
    });
  });

  describe('handleCallback', () => {
    it('should throw UnauthorizedException for invalid state', async () => {
      await expect(
        service.handleCallback('code', 'invalid-state', 'user-123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should successfully handle callback with valid state', async () => {
      // First, get a valid state by calling getConnectUrl
      const url = service.getConnectUrl('/redirect-path');
      const stateMatch = url.match(/state=([^&]+)/);
      const state = stateMatch ? decodeURIComponent(stateMatch[1]) : '';

      // Mock token response
      mockedAxios.post.mockResolvedValue({
        data: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          scope: 'openid email profile',
          id_token: 'test-id-token',
        },
      });

      // Mock JWT decode
      (mockedJwt.decode as jest.Mock).mockReturnValue({
        payload: {
          aud: 'test-client-id',
          iss: 'https://accounts.google.com',
          sub: 'google-user-123',
          email: 'test@gmail.com',
        },
      });

      mockPrismaService.googleCalendarConnection.upsert.mockResolvedValue({});

      const result = await service.handleCallback(
        'auth-code',
        state,
        'user-123',
      );

      expect(result).toEqual({
        success: true,
        googleEmail: 'test@gmail.com',
        redirect: '/redirect-path',
      });
      expect(
        mockPrismaService.googleCalendarConnection.upsert,
      ).toHaveBeenCalled();
    });

    it('should throw BadRequestException when no id_token received', async () => {
      const url = service.getConnectUrl();
      const stateMatch = url.match(/state=([^&]+)/);
      const state = stateMatch ? decodeURIComponent(stateMatch[1]) : '';

      mockedAxios.post.mockResolvedValue({
        data: {
          access_token: 'test-access-token',
          expires_in: 3600,
          scope: 'openid email profile',
          // No id_token
        },
      });

      await expect(
        service.handleCallback('auth-code', state, 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException for invalid audience', async () => {
      const url = service.getConnectUrl();
      const stateMatch = url.match(/state=([^&]+)/);
      const state = stateMatch ? decodeURIComponent(stateMatch[1]) : '';

      mockedAxios.post.mockResolvedValue({
        data: {
          access_token: 'test-access-token',
          expires_in: 3600,
          scope: 'openid email profile',
          id_token: 'test-id-token',
        },
      });

      (mockedJwt.decode as jest.Mock).mockReturnValue({
        payload: {
          aud: 'wrong-client-id',
          iss: 'https://accounts.google.com',
          sub: 'google-user-123',
        },
      });

      await expect(
        service.handleCallback('auth-code', state, 'user-123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid issuer', async () => {
      const url = service.getConnectUrl();
      const stateMatch = url.match(/state=([^&]+)/);
      const state = stateMatch ? decodeURIComponent(stateMatch[1]) : '';

      mockedAxios.post.mockResolvedValue({
        data: {
          access_token: 'test-access-token',
          expires_in: 3600,
          scope: 'openid email profile',
          id_token: 'test-id-token',
        },
      });

      (mockedJwt.decode as jest.Mock).mockReturnValue({
        payload: {
          aud: 'test-client-id',
          iss: 'https://malicious.com',
          sub: 'google-user-123',
        },
      });

      await expect(
        service.handleCallback('auth-code', state, 'user-123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getCalendarEvents', () => {
    it('should throw UnauthorizedException when not connected', async () => {
      mockPrismaService.googleCalendarConnection.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.getCalendarEvents(
          'user-123',
          new Date('2024-01-01'),
          new Date('2024-01-31'),
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return formatted calendar events', async () => {
      const mockConnection = {
        accessToken: 'test-access-token',
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000), // Not expired
        refreshToken: 'test-refresh-token',
      };
      mockPrismaService.googleCalendarConnection.findUnique.mockResolvedValue(
        mockConnection,
      );

      mockedAxios.get.mockResolvedValue({
        data: {
          items: [
            {
              id: 'event-1',
              summary: 'Meeting',
              description: 'Team meeting',
              start: { dateTime: '2024-01-15T10:00:00+08:00' },
              end: { dateTime: '2024-01-15T11:00:00+08:00' },
              status: 'confirmed',
            },
            {
              id: 'event-2',
              summary: 'Holiday',
              start: { date: '2024-01-20' },
              end: { date: '2024-01-21' },
              status: 'confirmed',
            },
            {
              id: 'event-3',
              summary: 'Cancelled Event',
              start: { dateTime: '2024-01-25T14:00:00+08:00' },
              end: { dateTime: '2024-01-25T15:00:00+08:00' },
              status: 'cancelled',
            },
          ],
        },
      });

      const result = await service.getCalendarEvents(
        'user-123',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result).toHaveLength(2); // Cancelled event should be filtered out
      expect(result[0]).toMatchObject({
        id: 'event-1',
        summary: 'Meeting',
        description: 'Team meeting',
        isAllDay: false,
      });
      expect(result[1]).toMatchObject({
        id: 'event-2',
        summary: 'Holiday',
        isAllDay: true,
      });
    });

    it('should refresh token when expired', async () => {
      const mockConnection = {
        accessToken: 'old-access-token',
        tokenExpiresAt: new Date(Date.now() - 1000), // Expired
        refreshToken: 'test-refresh-token',
      };
      mockPrismaService.googleCalendarConnection.findUnique.mockResolvedValue(
        mockConnection,
      );

      // Mock token refresh
      mockedAxios.post.mockResolvedValue({
        data: {
          access_token: 'new-access-token',
          expires_in: 3600,
        },
      });

      mockPrismaService.googleCalendarConnection.update.mockResolvedValue({});

      // Mock calendar events
      mockedAxios.get.mockResolvedValue({
        data: { items: [] },
      });

      await service.getCalendarEvents(
        'user-123',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          grant_type: 'refresh_token',
          refresh_token: 'test-refresh-token',
        }),
      );
      expect(
        mockPrismaService.googleCalendarConnection.update,
      ).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when no refresh token available', async () => {
      const mockConnection = {
        accessToken: 'old-access-token',
        tokenExpiresAt: new Date(Date.now() - 1000), // Expired
        refreshToken: null,
      };
      mockPrismaService.googleCalendarConnection.findUnique.mockResolvedValue(
        mockConnection,
      );

      await expect(
        service.getCalendarEvents(
          'user-123',
          new Date('2024-01-01'),
          new Date('2024-01-31'),
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle events without title', async () => {
      const mockConnection = {
        accessToken: 'test-access-token',
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
        refreshToken: 'test-refresh-token',
      };
      mockPrismaService.googleCalendarConnection.findUnique.mockResolvedValue(
        mockConnection,
      );

      mockedAxios.get.mockResolvedValue({
        data: {
          items: [
            {
              id: 'event-1',
              summary: undefined,
              start: { dateTime: '2024-01-15T10:00:00+08:00' },
              end: { dateTime: '2024-01-15T11:00:00+08:00' },
              status: 'confirmed',
            },
          ],
        },
      });

      const result = await service.getCalendarEvents(
        'user-123',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result[0].summary).toBe('(No title)');
    });
  });

  describe('getConflictingSlots', () => {
    it('should throw BadRequestException when event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(
        service.getConflictingSlots('user-123', 'event-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return conflicting slot IDs', async () => {
      const mockEvent = {
        id: 'event-123',
        type: EventType.ONE_TIME,
        timeZone: 'Asia/Taipei',
        oneTimeSchedule: {
          startDate: new Date('2024-01-15T00:00:00.000Z'),
          endDate: new Date('2024-01-15T00:00:00.000Z'),
          startMinuteOfDay: 540,
          endMinuteOfDay: 855,
          slotDurationMin: 15,
        },
        recurringSchedule: null,
        slots: [
          {
            id: 'slot-1',
            axisType: 'DATE',
            axisDate: new Date('2024-01-15T00:00:00.000Z'),
            startMinute: 540, // 09:00
            endMinute: 555, // 09:15
          },
          {
            id: 'slot-2',
            axisType: 'DATE',
            axisDate: new Date('2024-01-15T00:00:00.000Z'),
            startMinute: 600, // 10:00
            endMinute: 615, // 10:15
          },
          {
            id: 'slot-3',
            axisType: 'DATE',
            axisDate: new Date('2024-01-15T00:00:00.000Z'),
            startMinute: 840, // 14:00
            endMinute: 855, // 14:15
          },
        ],
      };
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockEventCapabilitiesService.buildCapabilities.mockReturnValue({
        supportsCompletion: true,
        supportsCalendarConflict: true,
        supportsAddToCalendar: true,
      });
      mockEventScheduleService.getCalendarRange.mockReturnValue({
        timeMin: new Date('2024-01-15T00:00:00.000Z'),
        timeMax: new Date('2024-01-16T00:00:00.000Z'),
      });

      const mockConnection = {
        accessToken: 'test-access-token',
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
        refreshToken: 'test-refresh-token',
      };
      mockPrismaService.googleCalendarConnection.findUnique.mockResolvedValue(
        mockConnection,
      );

      // Calendar event that conflicts with slot-2 (10:00-10:15)
      mockedAxios.get.mockResolvedValue({
        data: {
          items: [
            {
              id: 'cal-event-1',
              summary: 'Meeting',
              start: { dateTime: '2024-01-15T09:30:00.000Z' }, // UTC 09:30
              end: { dateTime: '2024-01-15T10:30:00.000Z' }, // UTC 10:30
              status: 'confirmed',
            },
          ],
        },
      });

      const result = await service.getConflictingSlots('user-123', 'event-123');

      expect(result.calendarEvents).toHaveLength(1);
      expect(result.conflictingSlotIds).toContain('slot-2');
      // slot-1 (09:00-09:15) should not conflict with meeting (09:30-10:30)
      expect(result.conflictingSlotIds).not.toContain('slot-1');
      // slot-3 (14:00-14:15) should not conflict
      expect(result.conflictingSlotIds).not.toContain('slot-3');
    });

    it('should reject calendar conflict checks for recurring events', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: 'event-123',
        type: EventType.RECURRING,
        isDeleted: false,
        timeZone: 'Asia/Taipei',
        oneTimeSchedule: null,
        recurringSchedule: {
          weekdays: ['MONDAY'],
          startMinuteOfDay: 540,
          endMinuteOfDay: 600,
          slotDurationMin: 15,
        },
        slots: [],
      });
      mockEventCapabilitiesService.buildCapabilities.mockReturnValue({
        supportsCompletion: false,
        supportsCalendarConflict: false,
        supportsAddToCalendar: false,
      });

      await expect(
        service.getConflictingSlots('user-123', 'event-123'),
      ).rejects.toThrow(
        new BadRequestException(
          'Google Calendar conflict check is not supported for this event type',
        ),
      );

      expect(eventScheduleService.getCalendarRange).not.toHaveBeenCalled();
    });
  });
});
