import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';

interface Jwk {
  kty: string;
  kid: string;
  use?: string;
  alg?: string;
  n?: string;
  e?: string;
}

interface JwksResponse {
  keys: Jwk[];
}

interface JwksCacheEntry {
  expiresAt: number;
  keysByKid: Map<string, string>;
}

interface JwksFetchOptions {
  forceRefresh?: boolean;
}

export interface OAuthTokenPayload {
  aud: string;
  iss: string;
  exp: number;
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

export interface VerifyIdTokenOptions {
  token: string;
  audience: string;
  issuers: [string, ...string[]];
  jwksUrl: string;
}

export interface LineVerifyIdTokenResponse extends OAuthTokenPayload {
  iat?: number;
  nonce?: string;
}

@Injectable()
export class TokenVerificationService {
  private readonly jwksCache = new Map<string, JwksCacheEntry>();
  private readonly jwksFetchInFlight = new Map<
    string,
    Promise<Map<string, string>>
  >();
  private static readonly JWKS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  async verifyIdToken({
    token,
    audience,
    issuers,
    jwksUrl,
  }: VerifyIdTokenOptions): Promise<OAuthTokenPayload> {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      throw new UnauthorizedException('Invalid ID token');
    }

    try {
      const header = decoded.header;
      let keys = await this.getJwksKeys(jwksUrl);

      // If provider rotates signing keys, refresh once on kid cache miss.
      if (header.kid && !keys.has(header.kid)) {
        keys = await this.getJwksKeys(jwksUrl, { forceRefresh: true });
      }

      const candidateKeys = header.kid
        ? [keys.get(header.kid)].filter((k): k is string => !!k)
        : Array.from(keys.values());

      if (candidateKeys.length === 0) {
        throw new UnauthorizedException('Signing key not found');
      }

      for (const publicKey of candidateKeys) {
        try {
          const verified = jwt.verify(token, publicKey, {
            algorithms: ['RS256'],
            audience,
            issuer: issuers,
          });

          if (!verified || typeof verified === 'string') {
            continue;
          }

          return verified as OAuthTokenPayload;
        } catch {
          continue;
        }
      }

      throw new UnauthorizedException('Invalid ID token signature or claims');
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid ID token signature or claims');
    }
  }

  async verifyLineIdToken(
    idToken: string,
    lineChannelId: string,
  ): Promise<LineVerifyIdTokenResponse> {
    try {
      const response = await axios.post<LineVerifyIdTokenResponse>(
        'https://api.line.me/oauth2/v2.1/verify',
        new URLSearchParams({
          id_token: idToken,
          client_id: lineChannelId,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const payload = response.data;
      if (
        payload.aud !== lineChannelId ||
        payload.iss !== 'https://access.line.me'
      ) {
        throw new UnauthorizedException('Invalid ID token claims');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        const data = error.response?.data as
          | { error?: string; error_description?: string }
          | undefined;
        const reason = data?.error_description || data?.error;

        throw new UnauthorizedException(
          reason
            ? `Invalid LINE ID token: ${reason}`
            : 'Invalid ID token signature or claims',
        );
      }

      throw new UnauthorizedException('Invalid ID token signature or claims');
    }
  }

  private async getJwksKeys(
    jwksUrl: string,
    options?: JwksFetchOptions,
  ): Promise<Map<string, string>> {
    const now = Date.now();
    const cached = this.jwksCache.get(jwksUrl);
    if (!options?.forceRefresh && cached && cached.expiresAt > now) {
      return cached.keysByKid;
    }

    if (!options?.forceRefresh) {
      const inFlight = this.jwksFetchInFlight.get(jwksUrl);
      if (inFlight) {
        return inFlight;
      }
    }

    const fetchPromise = this.fetchAndCacheJwksKeys(jwksUrl, now);
    if (!options?.forceRefresh) {
      this.jwksFetchInFlight.set(
        jwksUrl,
        fetchPromise.finally(() => this.jwksFetchInFlight.delete(jwksUrl)),
      );
      return this.jwksFetchInFlight.get(jwksUrl)!;
    }

    return fetchPromise;
  }

  private async fetchAndCacheJwksKeys(
    jwksUrl: string,
    now: number,
  ): Promise<Map<string, string>> {
    try {
      const response = await axios.get<JwksResponse>(jwksUrl);
      const keysByKid = new Map<string, string>();

      for (const jwk of response.data.keys ?? []) {
        if (!jwk.kid?.trim() || !jwk.n?.trim() || !jwk.e?.trim()) continue;

        const pem = this.jwkToPem(jwk as Jwk & { n: string; e: string });
        keysByKid.set(jwk.kid, pem);
      }

      const rawCacheControl = response.headers['cache-control'] as unknown;
      const cacheControlHeader =
        typeof rawCacheControl === 'string'
          ? rawCacheControl
          : Array.isArray(rawCacheControl)
            ? rawCacheControl.filter(
                (value): value is string => typeof value === 'string',
              )
            : undefined;
      const cacheTtlMs = this.getJwksCacheTtlMs(cacheControlHeader);
      this.jwksCache.set(jwksUrl, {
        keysByKid,
        expiresAt: now + cacheTtlMs,
      });
      return keysByKid;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Failed to fetch JWKS keys');
    }
  }

  private getJwksCacheTtlMs(cacheControlHeader?: string | string[]): number {
    const rawHeader = Array.isArray(cacheControlHeader)
      ? cacheControlHeader.join(',')
      : cacheControlHeader;
    if (!rawHeader) {
      return TokenVerificationService.JWKS_CACHE_TTL_MS;
    }

    const maxAgeMatch = rawHeader.match(/max-age=(\d+)/i);
    if (!maxAgeMatch) {
      return TokenVerificationService.JWKS_CACHE_TTL_MS;
    }

    const maxAgeSeconds = Number(maxAgeMatch[1]);
    if (!Number.isFinite(maxAgeSeconds) || maxAgeSeconds <= 0) {
      return TokenVerificationService.JWKS_CACHE_TTL_MS;
    }

    return maxAgeSeconds * 1000;
  }

  private jwkToPem(jwk: Jwk & { n: string; e: string }): string {
    try {
      const keyObject = crypto.createPublicKey({
        key: {
          kty: jwk.kty,
          n: jwk.n,
          e: jwk.e,
        },
        format: 'jwk',
      });

      return keyObject.export({ format: 'pem', type: 'spki' }).toString();
    } catch {
      throw new UnauthorizedException('Invalid JWK key format');
    }
  }
}
