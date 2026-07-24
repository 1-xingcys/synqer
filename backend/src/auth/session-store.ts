import { Logger } from '@nestjs/common';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import type { SessionData, Store } from 'express-session';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 同一個 process 內清理過期 session 的最小間隔。
 * 清理是搭著既有的 session 寫入一起做，不另外開 timer。
 */
export const SESSION_PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000;

type StoreSet = (
  sid: string,
  session: SessionData,
  callback?: (err?: unknown) => void,
) => void;

/**
 * 建立 express-session 用的 Prisma store。
 *
 * 相對於直接 new PrismaSessionStore()，這裡關掉了 checkPeriod 的背景輪詢。
 * 原本的 prune() 會定期 findMany 整張 Session 表再逐筆刪除，只要間隔小於
 * Neon 的 autosuspend 門檻，compute 就永遠不會休眠。改成在 set() 時順便用
 * 一次 deleteMany 清掉過期資料 —— 那個當下 compute 本來就是醒著的，等於
 * 不用多付錢。過期但沒被清掉的 session 也不會被誤用，
 * PrismaSessionStore.get() 讀到過期資料時會自己刪掉並視為未登入。
 */
export function createSessionStore(prisma: PrismaService): Store {
  const logger = new Logger('SessionStore');

  const store = new PrismaSessionStore(prisma, {
    checkPeriod: 0, // 不開背景 interval，見上方說明
    dbRecordIdIsSessionId: true,
  });

  let lastPrunedAt = 0;

  const pruneIfDue = async (): Promise<void> => {
    const now = Date.now();
    if (lastPrunedAt !== 0 && now - lastPrunedAt < SESSION_PRUNE_INTERVAL_MS) {
      return;
    }
    lastPrunedAt = now;

    try {
      const { count } = await prisma.session.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      if (count > 0) {
        logger.log(`Pruned ${count} expired session(s)`);
      }
    } catch (error) {
      // 清理失敗不影響登入流程，等下一個間隔再試。
      logger.error('Failed to prune expired sessions', error);
    }
  };

  // PrismaSessionStore 把 set 掛成唯讀的 instance property，
  // 這裡透過一次轉型改寫它。
  const mutableStore = store as unknown as { set: StoreSet };

  const setSession = mutableStore.set;
  mutableStore.set = (sid, session, callback) => {
    void pruneIfDue();
    setSession(sid, session, callback);
  };

  return store;
}
