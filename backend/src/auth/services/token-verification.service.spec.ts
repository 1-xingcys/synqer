import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { TokenVerificationService } from './token-verification.service';

jest.mock('jsonwebtoken', () => ({
  decode: jest.fn(),
  verify: jest.fn(),
}));

describe('TokenVerificationService', () => {
  let service: TokenVerificationService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenVerificationService],
    }).compile();

    service = module.get<TokenVerificationService>(TokenVerificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('refreshes JWKS once on kid cache miss and verifies token with refreshed key', async () => {
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
    } as never);

    const result = await service.verifyIdToken({
      token: 'test-id-token',
      audience: 'google-client-id',
      issuers: ['https://accounts.google.com', 'accounts.google.com'],
      jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
    });

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(jwt.verify).toHaveBeenCalledWith(
      'test-id-token',
      'new-public-key',
      expect.objectContaining({
        algorithms: ['RS256'],
        audience: 'google-client-id',
      }),
    );
    expect(result.sub).toBe('google-sub-id');
  });

  it('throws UnauthorizedException when LINE verify response claims are invalid', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      data: {
        sub: 'line-sub',
        aud: 'wrong-channel-id',
        iss: 'https://access.line.me',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
    } as never);

    await expect(
      service.verifyLineIdToken('line-id-token', 'line-channel-id'),
    ).rejects.toThrow(new UnauthorizedException('Invalid ID token claims'));
  });
});
