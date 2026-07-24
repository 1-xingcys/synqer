import { Logger } from '@nestjs/common';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import type { SessionData, Store } from 'express-session';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Minimum gap between expired-session cleanups within a single process.
 * Cleanup rides along with session writes instead of running on a timer.
 */
export const SESSION_PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000;

type StoreSet = (
  sid: string,
  session: SessionData,
  callback?: (err?: unknown) => void,
) => void;

/**
 * Builds the Prisma-backed store for express-session.
 *
 * Compared to using PrismaSessionStore directly, this does two things to
 * keep Neon's CU-hrs down:
 *
 * 1. Turns off the checkPeriod polling. The built-in prune() periodically
 *    reads the whole Session table and deletes row by row; any interval
 *    shorter than Neon's autosuspend threshold keeps the compute awake
 *    forever. Cleanup now happens inside set() as a single deleteMany, at a
 *    point where the compute is already serving a request. Sessions that
 *    expire in between are still safe: PrismaSessionStore.get() deletes an
 *    expired row as it reads it and reports the user as signed out.
 *
 * 2. Removes touch(). express-session only performs sliding expiration when
 *    the store exposes touch(), and each call is a SELECT plus an UPDATE.
 *    Since rolling is off, Set-Cookie only goes out when the session is
 *    created, so the cookie's lifetime never gets extended anyway. Pushing
 *    expiresAt forward server-side changed nothing for the user and only
 *    produced writes.
 */
export function createSessionStore(prisma: PrismaService): Store {
  const logger = new Logger('SessionStore');

  const store = new PrismaSessionStore(prisma, {
    checkPeriod: 0, // no background interval, see above
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
      // A failed cleanup must not break sign-in; retry on the next window.
      logger.error('Failed to prune expired sessions', error);
    }
  };

  // PrismaSessionStore attaches set/touch as readonly instance properties,
  // so a single cast is needed to swap them out.
  const mutableStore = store as unknown as {
    set: StoreSet;
    touch?: StoreSet;
  };

  const setSession = mutableStore.set;
  mutableStore.set = (sid, session, callback) => {
    void pruneIfDue();
    setSession(sid, session, callback);
  };

  delete mutableStore.touch;

  return store;
}
