import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken', () => ({
  decode: jest.fn(),
  verify: jest.fn(),
}));

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

  it('refreshes JWKS once on kid cache miss and verifies token with refreshed key', async () => {
    const state = 'test-state';
    jest.spyOn(service, 'getPKCE').mockReturnValue({
      codeVerifier: 'test-code-verifier',
      codeChallenge: 'test-code-challenge',
    });

    jest.spyOn(axios, 'post').mockResolvedValueOnce({
      data: { id_token: 'test-id-token' },
    } as never);

    jest
      .spyOn(axios, 'get')
      .mockResolvedValueOnce({
        data: {
          keys: [{ kty: 'RSA', kid: 'old-kid', n: 'old-n', e: 'AQAB' }],
        },
        headers: { 'cache-control': 'public, max-age=3600' },
      } as never)
      .mockResolvedValueOnce({
        data: {
          keys: [{ kty: 'RSA', kid: 'new-kid', n: 'new-n', e: 'AQAB' }],
        },
        headers: { 'cache-control': 'public, max-age=3600' },
      } as never);

    (jwt.decode as jest.Mock).mockReturnValue({
      header: { alg: 'RS256', kid: 'new-kid' },
      payload: {},
    } as never);

    jest
      .spyOn(service as any, 'jwkToPem')
      .mockReturnValueOnce('old-public-key')
      .mockReturnValueOnce('new-public-key');

    (jwt.verify as jest.Mock).mockReturnValue({
      sub: 'google-sub-id',
      aud: 'google-client-id',
      iss: 'https://accounts.google.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
      email: 'user@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.png',
    } as never);

    mockUsersService.upsertUserFromIdentity.mockResolvedValue({
      id: 'user-id-1',
    });

    const result = await service.handleGoogleCallback('auth-code', state);

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(jwt.verify).toHaveBeenCalledWith(
      'test-id-token',
      'new-public-key',
      expect.objectContaining({
        algorithms: ['RS256'],
        audience: 'google-client-id',
      }),
    );
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
