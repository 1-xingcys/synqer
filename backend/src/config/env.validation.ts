import * as Joi from 'joi';

/**
 * The shape of the validated environment. Injected as
 * `ConfigService<EnvVars, true>`, it gives both key-name checking and
 * non-nullable return types, since validation already ran at startup.
 */
export interface EnvVars {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  SESSION_SECRET: string;
  WEB_ORIGIN: string;
  TOKEN_ENCRYPTION_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  GOOGLE_CALENDAR_REDIRECT_URI: string;
  LINE_LOGIN_CHANNEL_ID: string;
  LINE_LOGIN_CHANNEL_SECRET: string;
  LINE_LOGIN_REDIRECT_URI: string;
  LINE_LIFF_URL: string;
  LINE_BOT_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
}

/**
 * Every environment variable the runtime needs, validated once at startup.
 *
 * The design:
 *  - Fail fast. A missing or malformed variable throws during boot instead of
 *    failing silently as `undefined` somewhere at runtime.
 *  - Report everything at once. `abortEarly: false`, so one run lists every
 *    problem and they can all be fixed together.
 *  - Escape hatch. `SKIP_ENV_VALIDATION=true` skips validation, for the cases
 *    that need no real secrets — generating the OpenAPI contract in CI boots
 *    the whole AppModule without a .env (see scripts/generate-openapi.js).
 */
export const envValidationSchema = Joi.object({
  // Runtime environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(8080),

  // Database, read by Prisma
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),

  // Session, and the single accepted frontend origin
  SESSION_SECRET: Joi.string().min(1).required(),
  WEB_ORIGIN: Joi.string().uri().required(),

  // Field-level encryption key for stored Google OAuth tokens
  // (32 bytes, base64 encoded)
  TOKEN_ENCRYPTION_KEY: Joi.string()
    .base64()
    .custom((value: string, helpers) => {
      if (Buffer.from(value, 'base64').length !== 32) {
        return helpers.error('any.invalid');
      }
      return value;
    }, 'base64 32-byte key')
    .required()
    .messages({
      'any.invalid':
        'TOKEN_ENCRYPTION_KEY must decode to 32 bytes (a base64-encoded 256-bit key).',
    }),

  // Google OAuth2 and Calendar
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_REDIRECT_URI: Joi.string().uri().required(),
  GOOGLE_CALENDAR_REDIRECT_URI: Joi.string().uri().required(),

  // LINE Login
  LINE_LOGIN_CHANNEL_ID: Joi.string().required(),
  LINE_LOGIN_CHANNEL_SECRET: Joi.string().required(),
  LINE_LOGIN_REDIRECT_URI: Joi.string().uri().required(),
  LINE_LIFF_URL: Joi.string().uri().required(),

  // LINE Bot, Messaging API
  LINE_BOT_CHANNEL_SECRET: Joi.string().required(),
  LINE_CHANNEL_ACCESS_TOKEN: Joi.string().required(),
});

/**
 * The validation function handed to `ConfigModule.forRoot({ validate })`.
 */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    return config;
  }

  const result: Joi.ValidationResult<Record<string, unknown>> =
    envValidationSchema.validate(config, {
      abortEarly: false,
      allowUnknown: true,
    });

  if (result.error) {
    const details = result.error.details
      .map((d) => `  - ${d.message}`)
      .join('\n');
    throw new Error(
      `Environment variable validation failed:\n${details}\n` +
        'Check backend/.env against backend/.env.example.',
    );
  }

  return result.value;
}
