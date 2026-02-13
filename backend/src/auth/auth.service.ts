import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';

interface PKCEData {
  codeVerifier: string;
  codeChallenge: string;
  redirect?: string;
}

interface OAuthTokenPayload {
  aud: string;
  iss: string;
  exp: number;
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

interface Jwk {
  kty: string;
  kid: string;
  use?: string;
  alg?: string;
  n?: string;
  e?: string;
  x5c?: string[];
}

interface JwksResponse {
  keys: Jwk[];
}

interface JwksCacheEntry {
  expiresAt: number;
  keysByKid: Map<string, string>;
}

interface VerifyIdTokenOptions {
  token: string;
  audience: string;
  issuers: [string, ...string[]];
  jwksUrl: string;
}

interface LineVerifyIdTokenResponse extends OAuthTokenPayload {
  iat?: number;
  nonce?: string;
}

interface JwksFetchOptions {
  forceRefresh?: boolean;
}

@Injectable()
export class AuthService {
  private pkceStore = new Map<string, PKCEData>();
  private readonly jwksCache = new Map<string, JwksCacheEntry>();
  private readonly jwksFetchInFlight = new Map<
    string,
    Promise<Map<string, string>>
  >();
  private static readonly JWKS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
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
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
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
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
        code_verifier: pkceData.codeVerifier,
      },
    );

    const { id_token } = tokenResponse.data as { id_token: string };

    const payload = await this.verifyIdToken({
      token: id_token,
      audience: process.env.GOOGLE_CLIENT_ID!,
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
      client_id: process.env.LINE_LOGIN_CHANNEL_ID!,
      redirect_uri: process.env.LINE_LOGIN_REDIRECT_URI!,
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
        redirect_uri: process.env.LINE_LOGIN_REDIRECT_URI!,
        client_id: process.env.LINE_LOGIN_CHANNEL_ID!,
        client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET!,
        code_verifier: pkceData.codeVerifier,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const { id_token } = tokenResponse.data as { id_token: string };

    const payload = await this.verifyLineIdToken(id_token);

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
    if (client_id !== process.env.LINE_LOGIN_CHANNEL_ID) {
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

  private async verifyIdToken({
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

  private async verifyLineIdToken(
    idToken: string,
  ): Promise<LineVerifyIdTokenResponse> {
    try {
      const response = await axios.post<LineVerifyIdTokenResponse>(
        'https://api.line.me/oauth2/v2.1/verify',
        new URLSearchParams({
          id_token: idToken,
          client_id: process.env.LINE_LOGIN_CHANNEL_ID!,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const payload = response.data;
      if (
        payload.aud !== process.env.LINE_LOGIN_CHANNEL_ID ||
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
      return AuthService.JWKS_CACHE_TTL_MS;
    }

    const maxAgeMatch = rawHeader.match(/max-age=(\d+)/i);
    if (!maxAgeMatch) {
      return AuthService.JWKS_CACHE_TTL_MS;
    }

    const maxAgeSeconds = Number(maxAgeMatch[1]);
    if (!Number.isFinite(maxAgeSeconds) || maxAgeSeconds <= 0) {
      return AuthService.JWKS_CACHE_TTL_MS;
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
