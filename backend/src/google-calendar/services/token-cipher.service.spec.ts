import * as crypto from 'crypto';
import { TokenCipherService } from './token-cipher.service';

describe('TokenCipherService', () => {
  const validKey = crypto.randomBytes(32).toString('base64');
  let originalKey: string | undefined;

  beforeAll(() => {
    originalKey = process.env.TOKEN_ENCRYPTION_KEY;
  });

  afterAll(() => {
    process.env.TOKEN_ENCRYPTION_KEY = originalKey;
  });

  beforeEach(() => {
    process.env.TOKEN_ENCRYPTION_KEY = validKey;
  });

  describe('constructor key validation', () => {
    it('throws when the key is missing', () => {
      delete process.env.TOKEN_ENCRYPTION_KEY;
      expect(() => new TokenCipherService()).toThrow(/TOKEN_ENCRYPTION_KEY/);
    });

    it('throws when the key is not 32 bytes', () => {
      process.env.TOKEN_ENCRYPTION_KEY = crypto
        .randomBytes(16)
        .toString('base64');
      expect(() => new TokenCipherService()).toThrow(/32 bytes/);
    });

    it('accepts a valid 32-byte base64 key', () => {
      expect(() => new TokenCipherService()).not.toThrow();
    });
  });

  describe('encrypt / decrypt round-trip', () => {
    let service: TokenCipherService;

    beforeEach(() => {
      service = new TokenCipherService();
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
      service = new TokenCipherService();
    });

    it('returns unprefixed legacy values unchanged', () => {
      const legacyPlaintext = 'ya29.legacy-plaintext-token';
      expect(service.isEncrypted(legacyPlaintext)).toBe(false);
      expect(service.decrypt(legacyPlaintext)).toBe(legacyPlaintext);
    });
  });

  describe('tamper detection', () => {
    it('throws when the ciphertext has been modified', () => {
      const service = new TokenCipherService();
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
      const service = new TokenCipherService();
      const encrypted = service.encrypt('secret');

      process.env.TOKEN_ENCRYPTION_KEY = crypto
        .randomBytes(32)
        .toString('base64');
      const otherService = new TokenCipherService();

      expect(() => otherService.decrypt(encrypted)).toThrow();
    });
  });
});
