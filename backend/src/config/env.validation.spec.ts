import * as crypto from 'crypto';
import { validateEnv } from './env.validation';

const validKey = crypto.randomBytes(32).toString('base64');

function buildValidEnv(): Record<string, string> {
  return {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    SESSION_SECRET: 'a-secret',
    WEB_ORIGIN: 'https://example.com',
    TOKEN_ENCRYPTION_KEY: validKey,
    GOOGLE_CLIENT_ID: 'gid',
    GOOGLE_CLIENT_SECRET: 'gsecret',
    GOOGLE_REDIRECT_URI: 'https://example.com/api/auth/google/callback',
    GOOGLE_CALENDAR_REDIRECT_URI: 'https://example.com/api/google-calendar/callback',
    LINE_LOGIN_CHANNEL_ID: 'lid',
    LINE_LOGIN_CHANNEL_SECRET: 'lsecret',
    LINE_LOGIN_REDIRECT_URI: 'https://example.com/api/auth/line/callback',
    LINE_LIFF_URL: 'https://liff.line.me/123',
    LINE_BOT_CHANNEL_SECRET: 'bsecret',
    LINE_CHANNEL_ACCESS_TOKEN: 'token',
  };
}

describe('validateEnv', () => {
  const originalSkip = process.env.SKIP_ENV_VALIDATION;

  afterEach(() => {
    if (originalSkip === undefined) {
      delete process.env.SKIP_ENV_VALIDATION;
    } else {
      process.env.SKIP_ENV_VALIDATION = originalSkip;
    }
  });

  it('returns the config when all required vars are present', () => {
    delete process.env.SKIP_ENV_VALIDATION;
    const result = validateEnv(buildValidEnv());
    expect(result.SESSION_SECRET).toBe('a-secret');
  });

  it('applies defaults for optional vars', () => {
    delete process.env.SKIP_ENV_VALIDATION;
    const env = buildValidEnv();
    delete env.NODE_ENV;
    const result = validateEnv(env);
    expect(result.NODE_ENV).toBe('development');
    expect(result.PORT).toBe(8080);
  });

  it('throws and lists every missing required var', () => {
    delete process.env.SKIP_ENV_VALIDATION;
    const env = buildValidEnv();
    delete env.SESSION_SECRET;
    delete env.GOOGLE_CLIENT_ID;
    expect(() => validateEnv(env)).toThrow(/SESSION_SECRET/);
    expect(() => validateEnv(env)).toThrow(/GOOGLE_CLIENT_ID/);
  });

  it('rejects a TOKEN_ENCRYPTION_KEY that does not decode to 32 bytes', () => {
    delete process.env.SKIP_ENV_VALIDATION;
    const env = buildValidEnv();
    env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(16).toString('base64');
    expect(() => validateEnv(env)).toThrow(/TOKEN_ENCRYPTION_KEY/);
  });

  it('skips validation when SKIP_ENV_VALIDATION is true', () => {
    process.env.SKIP_ENV_VALIDATION = 'true';
    expect(() => validateEnv({})).not.toThrow();
  });
});
