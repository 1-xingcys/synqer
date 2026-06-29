import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * 對敏感欄位（如 Google OAuth token）做欄位層級加密。
 *
 * 演算法：AES-256-GCM（具驗證性，能偵測密文遭竄改）。
 * 儲存格式：`v1:<iv>:<authTag>:<ciphertext>`，三段皆為 base64。
 *   - `v1` 版本前綴讓未來能輪替金鑰/演算法，
 *     也讓 decrypt 能分辨「尚未加密的舊明文」與「密文」。
 *
 * 金鑰來自環境變數 `TOKEN_ENCRYPTION_KEY`（base64 編碼的 32 bytes）。
 * 啟動時即驗證，缺少或長度錯誤會直接拋錯（fail-fast）。
 */
@Injectable()
export class TokenCipherService {
  private static readonly VERSION = 'v1';
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12; // GCM 建議的 nonce 長度
  private static readonly KEY_LENGTH = 32; // AES-256

  private readonly logger = new Logger(TokenCipherService.name);
  private readonly key: Buffer;

  constructor() {
    const rawKey = process.env.TOKEN_ENCRYPTION_KEY;
    if (!rawKey) {
      throw new Error(
        'TOKEN_ENCRYPTION_KEY is not set. Generate one with: ' +
          "node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"",
      );
    }

    const key = Buffer.from(rawKey, 'base64');
    if (key.length !== TokenCipherService.KEY_LENGTH) {
      throw new Error(
        `TOKEN_ENCRYPTION_KEY must decode to ${TokenCipherService.KEY_LENGTH} bytes ` +
          `(got ${key.length}). Provide a base64-encoded 256-bit key.`,
      );
    }

    this.key = key;
  }

  /**
   * 加密明文，回傳 `v1:iv:tag:ciphertext` 格式字串。
   */
  encrypt(plainText: string): string {
    const iv = crypto.randomBytes(TokenCipherService.IV_LENGTH);
    const cipher = crypto.createCipheriv(
      TokenCipherService.ALGORITHM,
      this.key,
      iv,
    );

    const ciphertext = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [
      TokenCipherService.VERSION,
      iv.toString('base64'),
      authTag.toString('base64'),
      ciphertext.toString('base64'),
    ].join(':');
  }

  /**
   * 解密 `encrypt()` 產生的字串。
   *
   * 為了支援零停機遷移：若輸入沒有 `v1:` 版本前綴，視為尚未加密的
   * 舊明文，原樣回傳（下次寫入時即會被加密覆蓋）。
   */
  decrypt(value: string): string {
    if (!this.isEncrypted(value)) {
      return value;
    }

    const [, ivB64, tagB64, ciphertextB64] = value.split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(tagB64, 'base64');
    const ciphertext = Buffer.from(ciphertextB64, 'base64');

    const decipher = crypto.createDecipheriv(
      TokenCipherService.ALGORITHM,
      this.key,
      iv,
    );
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  }

  /**
   * 判斷字串是否為本服務加密過的密文。
   */
  isEncrypted(value: string): boolean {
    return value.startsWith(`${TokenCipherService.VERSION}:`);
  }
}
