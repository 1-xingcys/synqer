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

  it('throws UnauthorizedException when jwt.decode returns invalid payload', async () => {
    (jwt.decode as jest.Mock).mockReturnValue(null);

    await expect(
      service.verifyIdToken({
        token: 'test-id-token',
        audience: 'google-client-id',
        issuers: ['https://accounts.google.com', 'accounts.google.com'],
        jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
      }),
    ).rejects.toThrow(new UnauthorizedException('Invalid ID token'));
  });

  it('uses cached JWKS on kid cache hit without refreshing', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue({
      data: {
        keys: [{ kty: 'RSA', kid: 'cached-kid', n: 'cached-n', e: 'AQAB' }],
      },
      headers: { 'cache-control': 'public, max-age=3600' },
    } as never);

    (jwt.decode as jest.Mock).mockReturnValue({
      header: { alg: 'RS256', kid: 'cached-kid' },
      payload: {},
    } as never);

    jest.spyOn(service as any, 'jwkToPem').mockReturnValue('cached-public-key');

    (jwt.verify as jest.Mock).mockReturnValue({
      sub: 'cached-user',
      aud: 'google-client-id',
      iss: 'https://accounts.google.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
    } as never);

    await service.verifyIdToken({
      token: 'first-token',
      audience: 'google-client-id',
      issuers: ['https://accounts.google.com', 'accounts.google.com'],
      jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
    });

    await service.verifyIdToken({
      token: 'second-token',
      audience: 'google-client-id',
      issuers: ['https://accounts.google.com', 'accounts.google.com'],
      jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
    });

    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('tries all keys when token header has no kid and succeeds on later key', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue({
      data: {
        keys: [
          { kty: 'RSA', kid: 'kid-1', n: 'n-1', e: 'AQAB' },
          { kty: 'RSA', kid: 'kid-2', n: 'n-2', e: 'AQAB' },
        ],
      },
      headers: { 'cache-control': 'public, max-age=3600' },
    } as never);

    (jwt.decode as jest.Mock).mockReturnValue({
      header: { alg: 'RS256' },
      payload: {},
    } as never);

    jest
      .spyOn(service as any, 'jwkToPem')
      .mockReturnValueOnce('public-key-1')
      .mockReturnValueOnce('public-key-2');

    (jwt.verify as jest.Mock)
      .mockImplementationOnce(() => {
        throw new Error('invalid signature');
      })
      .mockReturnValueOnce({
        sub: 'fallback-user',
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

    expect(jwt.verify).toHaveBeenCalledTimes(2);
    expect(result.sub).toBe('fallback-user');
  });

  it('throws UnauthorizedException when all candidate keys fail verification', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue({
      data: {
        keys: [{ kty: 'RSA', kid: 'kid-1', n: 'n-1', e: 'AQAB' }],
      },
      headers: { 'cache-control': 'public, max-age=3600' },
    } as never);

    (jwt.decode as jest.Mock).mockReturnValue({
      header: { alg: 'RS256', kid: 'kid-1' },
      payload: {},
    } as never);

    jest.spyOn(service as any, 'jwkToPem').mockReturnValue('public-key-1');

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid signature');
    });

    await expect(
      service.verifyIdToken({
        token: 'test-id-token',
        audience: 'google-client-id',
        issuers: ['https://accounts.google.com', 'accounts.google.com'],
        jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
      }),
    ).rejects.toThrow(
      new UnauthorizedException('Invalid ID token signature or claims'),
    );
  });

  it('deduplicates concurrent JWKS fetch requests for same URL', async () => {
    let resolveGet: ((value: unknown) => void) | undefined;
    const getPromise = new Promise((resolve) => {
      resolveGet = resolve;
    });

    jest.spyOn(axios, 'get').mockReturnValue(getPromise as never);

    (jwt.decode as jest.Mock).mockReturnValue({
      header: { alg: 'RS256', kid: 'shared-kid' },
      payload: {},
    } as never);

    jest.spyOn(service as any, 'jwkToPem').mockReturnValue('shared-public-key');
    (jwt.verify as jest.Mock).mockReturnValue({
      sub: 'parallel-user',
      aud: 'google-client-id',
      iss: 'https://accounts.google.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
    } as never);

    const first = service.verifyIdToken({
      token: 'token-1',
      audience: 'google-client-id',
      issuers: ['https://accounts.google.com', 'accounts.google.com'],
      jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
    });
    const second = service.verifyIdToken({
      token: 'token-2',
      audience: 'google-client-id',
      issuers: ['https://accounts.google.com', 'accounts.google.com'],
      jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
    });

    resolveGet?.({
      data: {
        keys: [{ kty: 'RSA', kid: 'shared-kid', n: 'shared-n', e: 'AQAB' }],
      },
      headers: { 'cache-control': 'public, max-age=3600' },
    });

    await Promise.all([first, second]);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('includes LINE error_description in UnauthorizedException message', async () => {
    jest.spyOn(axios, 'post').mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          error: 'invalid_request',
          error_description: 'The ID token is expired',
        },
      },
    });

    await expect(
      service.verifyLineIdToken('line-id-token', 'line-channel-id'),
    ).rejects.toThrow(
      new UnauthorizedException(
        'Invalid LINE ID token: The ID token is expired',
      ),
    );
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
