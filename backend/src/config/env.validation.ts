import * as Joi from 'joi';

/**
 * 驗證後的環境變數型別。搭配 `ConfigService<EnvVars, true>` 注入，即可獲得
 * key 名稱檢查與非空的回傳型別（因為已於啟動時驗證過）。
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
 * 集中定義所有 Runtime 必要的環境變數，並在應用啟動時一次驗證。
 *
 * 設計重點：
 *  - fail-fast：缺少或格式錯誤的變數會在 boot 時拋錯，而非 runtime 才用
 *    `undefined` 靜默壞掉。
 *  - 一次列出所有問題：`abortEarly: false`，方便一次補齊。
 *  - 旁路：`SKIP_ENV_VALIDATION=true` 時跳過驗證。這讓「不需要真實密鑰」
 *    的場景使用——例如 CI 產生 OpenAPI 契約時會啟動整個 AppModule，但環境
 *    中沒有 .env（見 scripts/generate-openapi.js）。
 */
export const envValidationSchema = Joi.object({
  // 執行環境
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(8080),

  // 資料庫（Prisma 使用）
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),

  // Session / 前端來源
  SESSION_SECRET: Joi.string().min(1).required(),
  WEB_ORIGIN: Joi.string().uri().required(),

  // 儲存 Google OAuth token 的欄位層級加密金鑰（base64 編碼的 32 bytes）
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

  // Google OAuth2 / Calendar
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_REDIRECT_URI: Joi.string().uri().required(),
  GOOGLE_CALENDAR_REDIRECT_URI: Joi.string().uri().required(),

  // LINE Login
  LINE_LOGIN_CHANNEL_ID: Joi.string().required(),
  LINE_LOGIN_CHANNEL_SECRET: Joi.string().required(),
  LINE_LOGIN_REDIRECT_URI: Joi.string().uri().required(),
  LINE_LIFF_URL: Joi.string().uri().required(),

  // LINE Bot / Messaging API
  LINE_BOT_CHANNEL_SECRET: Joi.string().required(),
  LINE_CHANNEL_ACCESS_TOKEN: Joi.string().required(),
});

/**
 * 供 `ConfigModule.forRoot({ validate })` 使用的驗證函式。
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
