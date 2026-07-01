import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { TokenCipherService } from './token-cipher.service';
import { EnvVars } from '../../config/env.validation';

/**
 * 以指定金鑰建立一個回傳固定 TOKEN_ENCRYPTION_KEY 的 ConfigService stub。
 * 金鑰的存在性與長度驗證由 env.validation schema 負責（見 env.validation.spec.ts），
 * 這裡只需提供一把有效金鑰來測試加解密行為。
 */
function cipherWithKey(key: string): TokenCipherService {
  const config = {
    get: () => key,
  } as unknown as ConfigService<EnvVars, true>;
  return new TokenCipherService(config);
}

describe('TokenCipherService', () => {
  const validKey = crypto.randomBytes(32).toString('base64');

  describe('encrypt / decrypt round-trip', () => {
    let service: TokenCipherService;

    beforeEach(() => {
      service = cipherWithKey(validKey);
    });

    it('decrypts back to the original plaintext', () => {
      const plain = 'ya29.a0AfH6SMexample-access-token';
      const encrypted = service.encrypt(plain);

      expect(encrypted).not.toContain(plain);
      expect(service.decrypt(encrypted)).toBe(plain);
    });

    it('produces a versioned, recognizable format', () => {
      const encrypted = service.encrypt('secret');
      expect(encrypted).toMatch(/^v1:[^:]+:[^:]+:[^:]+$/);
      expect(service.isEncrypted(encrypted)).toBe(true);
    });

    it('uses a fresh IV so identical inputs yield different ciphertext', () => {
      const a = service.encrypt('same-token');
      const b = service.encrypt('same-token');

      expect(a).not.toBe(b);
      expect(service.decrypt(a)).toBe('same-token');
      expect(service.decrypt(b)).toBe('same-token');
    });

    it('handles empty strings', () => {
      const encrypted = service.encrypt('');
      expect(service.decrypt(encrypted)).toBe('');
    });
  });

  describe('legacy plaintext compatibility', () => {
    let service: TokenCipherService;

    beforeEach(() => {
      service = cipherWithKey(validKey);
    });

    it('returns unprefixed legacy values unchanged', () => {
      const legacyPlaintext = 'ya29.legacy-plaintext-token';
      expect(service.isEncrypted(legacyPlaintext)).toBe(false);
      expect(service.decrypt(legacyPlaintext)).toBe(legacyPlaintext);
    });
  });

  describe('tamper detection', () => {
    it('throws when the ciphertext has been modified', () => {
      const service = cipherWithKey(validKey);
      const encrypted = service.encrypt('secret');
      const [version, iv, tag, ct] = encrypted.split(':');

      // Flip the last base64 char of the ciphertext.
      const tamperedChar = ct.endsWith('A') ? 'B' : 'A';
      const tampered = [
        version,
        iv,
        tag,
        ct.slice(0, -1) + tamperedChar,
      ].join(':');

      expect(() => service.decrypt(tampered)).toThrow();
    });

    it('throws when decrypted with a different key', () => {
      const service = cipherWithKey(validKey);
      const encrypted = service.encrypt('secret');

      const otherKey = crypto.randomBytes(32).toString('base64');
      const otherService = cipherWithKey(otherKey);

      expect(() => otherService.decrypt(encrypted)).toThrow();
    });
  });
});
