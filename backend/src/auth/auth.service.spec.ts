import { Test, TestingModule } from '@nestjs/testing';
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
});
