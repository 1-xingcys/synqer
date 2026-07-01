import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  OAuthTokenPayload,
  TokenVerificationService,
} from './services/token-verification.service';

describe('AuthService', () => {
  let service: AuthService;
  const originalEnv = process.env;

  const mockUsersService = {
    upsertUserFromIdentity: jest.fn(),
    findUserById: jest.fn(),
  };

  const mockPrismaService = {
    lineGroupMember: {
      updateMany: jest.fn(),
    },
    eventExpectedParticipant: {
      updateMany: jest.fn(),
    },
  };

  const mockTokenVerificationService = {
    verifyIdToken: jest.fn(),
    verifyLineIdToken: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      GOOGLE_CLIENT_ID: 'google-client-id',
      GOOGLE_CLIENT_SECRET: 'google-client-secret',
      GOOGLE_REDIRECT_URI: 'http://localhost:8080/auth/google/callback',
      LINE_LOGIN_CHANNEL_ID: 'line-channel-id',
      LINE_LOGIN_CHANNEL_SECRET: 'line-channel-secret',
      LINE_LOGIN_REDIRECT_URI: 'http://localhost:8080/auth/line/callback',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: TokenVerificationService,
          useValue: mockTokenVerificationService,
        },
        {
          provide: ConfigService,
          useValue: { get: (key: string) => process.env[key] },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('delegates Google token verification to TokenVerificationService', async () => {
    const state = 'test-state';
    jest.spyOn(service, 'getPKCE').mockReturnValue({
      codeVerifier: 'test-code-verifier',
      codeChallenge: 'test-code-challenge',
    });

    jest.spyOn(axios, 'post').mockResolvedValueOnce({
      data: { id_token: 'test-id-token' },
    } as never);

    const verifiedPayload: OAuthTokenPayload = {
      sub: 'google-sub-id',
      aud: 'google-client-id',
      iss: 'https://accounts.google.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
      email: 'user@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.png',
    };
    mockTokenVerificationService.verifyIdToken.mockResolvedValue(verifiedPayload);

    mockUsersService.upsertUserFromIdentity.mockResolvedValue({
      id: 'user-id-1',
    });

    const result = await service.handleGoogleCallback('auth-code', state);

    expect(mockTokenVerificationService.verifyIdToken).toHaveBeenCalledWith({
      token: 'test-id-token',
      audience: 'google-client-id',
      issuers: ['https://accounts.google.com', 'accounts.google.com'],
      jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
    });
    expect(mockUsersService.upsertUserFromIdentity).toHaveBeenCalledWith(
      'google',
      'google-sub-id',
      'user@example.com',
      'Test User',
      'https://example.com/avatar.png',
    );
    expect(result).toEqual({
      user: { id: 'user-id-1' },
      redirect: undefined,
    });
  });

  it('handles LINE callback and links matched members', async () => {
    const state = 'line-state';
    jest.spyOn(service, 'getPKCE').mockReturnValue({
      codeVerifier: 'line-code-verifier',
      codeChallenge: 'line-code-challenge',
      redirect: '/joined',
    });

    jest.spyOn(axios, 'post').mockResolvedValueOnce({
      data: { id_token: 'line-id-token' },
    } as never);

    mockTokenVerificationService.verifyLineIdToken.mockResolvedValue({
      sub: 'line-user-sub',
      aud: 'line-channel-id',
      iss: 'https://access.line.me',
      exp: Math.floor(Date.now() / 1000) + 3600,
      email: 'line-user@example.com',
      name: 'LINE User',
      picture: 'https://example.com/line-avatar.png',
    });

    mockUsersService.upsertUserFromIdentity.mockResolvedValue({
      id: 'line-user-id',
    });

    const result = await service.handleLineCallback('line-auth-code', state);

    expect(mockTokenVerificationService.verifyLineIdToken).toHaveBeenCalledWith(
      'line-id-token',
      'line-channel-id',
    );
    expect(mockUsersService.upsertUserFromIdentity).toHaveBeenCalledWith(
      'line',
      'line-user-sub',
      'line-user@example.com',
      'LINE User',
      'https://example.com/line-avatar.png',
    );
    expect(mockPrismaService.lineGroupMember.updateMany).toHaveBeenCalledWith({
      where: { lineUserId: 'line-user-sub' },
      data: { userId: 'line-user-id' },
    });
    expect(
      mockPrismaService.eventExpectedParticipant.updateMany,
    ).toHaveBeenCalledWith({
      where: { lineUserId: 'line-user-sub' },
      data: { userId: 'line-user-id' },
    });
    expect(result).toEqual({
      user: { id: 'line-user-id' },
      redirect: '/joined',
    });
  });

  it('throws when LINE callback state is missing or expired', async () => {
    jest.spyOn(service, 'getPKCE').mockReturnValue(undefined);

    await expect(
      service.handleLineCallback('line-auth-code', 'missing-state'),
    ).rejects.toThrow(new UnauthorizedException('Invalid or expired state'));
  });

  it('rejects LIFF login when access token belongs to another channel', async () => {
    jest.spyOn(axios, 'get').mockResolvedValueOnce({
      data: {
        client_id: 'other-channel-id',
        expires_in: 3600,
      },
    } as never);

    await expect(service.handleLiffLogin('liff-access-token')).rejects.toThrow(
      new UnauthorizedException('Invalid LIFF access token'),
    );
  });

  it('rejects LIFF login when access token is expired', async () => {
    jest.spyOn(axios, 'get').mockResolvedValueOnce({
      data: {
        client_id: 'line-channel-id',
        expires_in: 0,
      },
    } as never);

    await expect(service.handleLiffLogin('liff-access-token')).rejects.toThrow(
      new UnauthorizedException('LIFF access token expired'),
    );
  });

  it('handles LIFF login success path', async () => {
    jest
      .spyOn(axios, 'get')
      .mockResolvedValueOnce({
        data: {
          client_id: 'line-channel-id',
          expires_in: 3600,
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          userId: 'line-user-sub',
          displayName: 'LIFF User',
          pictureUrl: 'https://example.com/liff-avatar.png',
        },
      } as never);

    mockUsersService.upsertUserFromIdentity.mockResolvedValue({
      id: 'line-user-id',
    });

    const result = await service.handleLiffLogin('liff-access-token');

    expect(mockUsersService.upsertUserFromIdentity).toHaveBeenCalledWith(
      'line',
      'line-user-sub',
      undefined,
      'LIFF User',
      'https://example.com/liff-avatar.png',
    );
    expect(mockPrismaService.lineGroupMember.updateMany).toHaveBeenCalledWith({
      where: { lineUserId: 'line-user-sub' },
      data: { userId: 'line-user-id' },
    });
    expect(
      mockPrismaService.eventExpectedParticipant.updateMany,
    ).toHaveBeenCalledWith({
      where: { lineUserId: 'line-user-sub' },
      data: { userId: 'line-user-id' },
    });
    expect(result).toEqual({ user: { id: 'line-user-id' } });
  });
});
