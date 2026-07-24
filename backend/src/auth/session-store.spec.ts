import { Logger } from '@nestjs/common';
import type { SessionData, Store } from 'express-session';
import { PrismaService } from '../prisma/prisma.service';
import { createSessionStore, SESSION_PRUNE_INTERVAL_MS } from './session-store';

type PrismaMock = {
  $connect: jest.Mock;
  session: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    deleteMany: jest.Mock;
  };
};

const createPrismaMock = (): PrismaMock => ({
  $connect: jest.fn().mockResolvedValue(undefined),
  session: {
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
});

const asPrismaService = (mock: PrismaMock) =>
  mock as unknown as PrismaService;

const sessionData = () =>
  ({
    cookie: {
      originalMaxAge: 60_000,
      maxAge: 60_000,
    },
  }) as unknown as SessionData;

/** Calls store.set() and waits for its callback. */
const setSession = (store: Store, sid: string) =>
  new Promise<void>((resolve, reject) => {
    store.set(sid, sessionData(), (err?: unknown) => {
      if (err) reject(err instanceof Error ? err : new Error(String(err)));
      else resolve();
    });
  });

/** Gives the fire-and-forget cleanup a chance to finish. */
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('createSessionStore', () => {
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should not start a background polling interval', async () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');

    createSessionStore(asPrismaService(prisma));
    await flush();

    expect(setIntervalSpy).not.toHaveBeenCalled();
  });

  it('should not expose touch(), so express-session skips per-request writes', () => {
    const store = createSessionStore(asPrismaService(prisma));

    expect(store.touch).toBeUndefined();
  });

  it('should delete expired sessions while writing a session', async () => {
    const store = createSessionStore(asPrismaService(prisma));

    await setSession(store, 'sid-1');
    await flush();

    expect(prisma.session.deleteMany).toHaveBeenCalledTimes(1);
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: expect.any(Date) as Date } },
    });
  });

  it('should still persist the session', async () => {
    const store = createSessionStore(asPrismaService(prisma));

    await setSession(store, 'sid-1');

    expect(prisma.session.create).toHaveBeenCalledTimes(1);
  });

  it('should not clean up twice within the same interval', async () => {
    const store = createSessionStore(asPrismaService(prisma));

    await setSession(store, 'sid-1');
    await flush();
    await setSession(store, 'sid-2');
    await flush();

    expect(prisma.session.deleteMany).toHaveBeenCalledTimes(1);
  });

  it('should clean up again once the interval has elapsed', async () => {
    const store = createSessionStore(asPrismaService(prisma));
    const startedAt = Date.now();
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(startedAt);

    await setSession(store, 'sid-1');
    await flush();

    nowSpy.mockReturnValue(startedAt + SESSION_PRUNE_INTERVAL_MS + 1);
    await setSession(store, 'sid-2');
    await flush();

    expect(prisma.session.deleteMany).toHaveBeenCalledTimes(2);
  });

  it('should persist the session even when cleanup fails', async () => {
    prisma.session.deleteMany.mockRejectedValue(new Error('db is down'));
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const store = createSessionStore(asPrismaService(prisma));

    await expect(setSession(store, 'sid-1')).resolves.toBeUndefined();
    await flush();

    expect(prisma.session.create).toHaveBeenCalledTimes(1);
  });
});
