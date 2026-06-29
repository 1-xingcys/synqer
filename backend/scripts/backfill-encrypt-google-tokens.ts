/**
 * 將 GoogleCalendarConnection 中既有的明文 token 加密。
 *
 * 用法：
 *   npm run backfill:encrypt-google-tokens
 *
 * 需要環境變數：DATABASE_URL、TOKEN_ENCRYPTION_KEY
 *
 * 本腳本是冪等的：已經是密文（v1: 前綴）的欄位會被略過，
 * 因此重複執行是安全的。
 */

import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { TokenCipherService } from '../src/google-calendar/services/token-cipher.service';

dotenv.config();

async function main() {
  const prisma = new PrismaClient();
  const cipher = new TokenCipherService(); // 缺少/無效金鑰時會在此直接拋錯

  let scanned = 0;
  let updated = 0;

  try {
    const connections = await prisma.googleCalendarConnection.findMany();

    for (const connection of connections) {
      scanned += 1;

      const data: { accessToken?: string; refreshToken?: string } = {};

      if (!cipher.isEncrypted(connection.accessToken)) {
        data.accessToken = cipher.encrypt(connection.accessToken);
      }
      if (
        connection.refreshToken &&
        !cipher.isEncrypted(connection.refreshToken)
      ) {
        data.refreshToken = cipher.encrypt(connection.refreshToken);
      }

      if (Object.keys(data).length === 0) {
        continue; // 已加密，略過
      }

      await prisma.googleCalendarConnection.update({
        where: { id: connection.id },
        data,
      });
      updated += 1;
    }

    console.log(
      `Backfill complete: scanned ${scanned}, encrypted ${updated}, ` +
        `already-encrypted ${scanned - updated}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
