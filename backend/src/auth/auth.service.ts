import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
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
}

@Injectable()
export class AuthService {
  private pkceStore = new Map<string, PKCEData>();

  constructor(private usersService: UsersService) {}

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

    // TODO: Verify id_token
    // Decode and verify id_token
    const decoded = jwt.decode(id_token, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      throw new UnauthorizedException('Invalid ID token');
    }

    const payload = decoded.payload as OAuthTokenPayload;

    // Verify claims
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      throw new UnauthorizedException('Invalid audience');
    }
    if (
      payload.iss !== 'https://accounts.google.com' &&
      payload.iss !== 'accounts.google.com'
    ) {
      throw new UnauthorizedException('Invalid issuer');
    }
    if (payload.exp * 1000 < Date.now()) {
      throw new UnauthorizedException('Token expired');
    }

    // Extract user info
    const { sub, email, name } = payload;

    // Upsert user
    const user = await this.usersService.upsertUserFromIdentity(
      'google',
      sub,
      email,
      name,
    );

    return { user, redirect: pkceData.redirect };
  }

  // LINE OAuth
  getLineAuthUrl(redirect?: string): string {
    const state = this.generateState();
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    this.storePKCE(state, { codeVerifier, codeChallenge, redirect });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.LINE_CHANNEL_ID!,
      redirect_uri: process.env.LINE_REDIRECT_URI!,
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

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      'https://api.line.me/oauth2/v2.1/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINE_REDIRECT_URI!,
        client_id: process.env.LINE_CHANNEL_ID!,
        client_secret: process.env.LINE_CHANNEL_SECRET!,
        code_verifier: pkceData.codeVerifier,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const { id_token } = tokenResponse.data as { id_token: string };

    // Decode and verify id_token
    const decoded = jwt.decode(id_token, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      throw new UnauthorizedException('Invalid ID token');
    }

    const payload = decoded.payload as OAuthTokenPayload;

    // Verify claims
    if (payload.aud !== process.env.LINE_CHANNEL_ID) {
      throw new UnauthorizedException('Invalid audience');
    }
    if (!payload.iss.includes('line.me')) {
      throw new UnauthorizedException('Invalid issuer');
    }
    if (payload.exp * 1000 < Date.now()) {
      throw new UnauthorizedException('Token expired');
    }

    // Extract user info
    const { sub, email, name } = payload;

    // Upsert user
    const user = await this.usersService.upsertUserFromIdentity(
      'line',
      sub,
      email,
      name,
    );

    return { user, redirect: pkceData.redirect };
  }
}
