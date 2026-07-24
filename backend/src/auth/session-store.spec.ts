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

/** 呼叫 store.set() 並等待它的 callback。 */
const setSession = (store: Store, sid: string) =>
  new Promise<void>((resolve, reject) => {
    store.set(sid, sessionData(), (err?: unknown) => {
      if (err) reject(err instanceof Error ? err : new Error(String(err)));
      else resolve();
    });
  });

/** 讓 fire-and-forget 的清理有機會跑完。 */
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('createSessionStore', () => {
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('不啟動背景輪詢的 interval（避免 Neon compute 無法 autosuspend）', async () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');

    createSessionStore(asPrismaService(prisma));
    await flush();

    expect(setIntervalSpy).not.toHaveBeenCalled();
  });

  it('不提供 touch()，讓 express-session 不會對每個 request 寫 Session', () => {
    const store = createSessionStore(asPrismaService(prisma));

    expect(store.touch).toBeUndefined();
  });

  it('寫入 session 時順便刪除已過期的資料', async () => {
    const store = createSessionStore(asPrismaService(prisma));

    await setSession(store, 'sid-1');
    await flush();

    expect(prisma.session.deleteMany).toHaveBeenCalledTimes(1);
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: expect.any(Date) as Date } },
    });
  });

  it('仍然把 session 寫進資料庫', async () => {
    const store = createSessionStore(asPrismaService(prisma));

    await setSession(store, 'sid-1');

    expect(prisma.session.create).toHaveBeenCalledTimes(1);
  });

  it('清理間隔內不重複清理', async () => {
    const store = createSessionStore(asPrismaService(prisma));

    await setSession(store, 'sid-1');
    await flush();
    await setSession(store, 'sid-2');
    await flush();

    expect(prisma.session.deleteMany).toHaveBeenCalledTimes(1);
  });

  it('超過清理間隔後會再次清理', async () => {
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

  it('清理失敗不影響 session 寫入', async () => {
    prisma.session.deleteMany.mockRejectedValue(new Error('db is down'));
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const store = createSessionStore(asPrismaService(prisma));

    await expect(setSession(store, 'sid-1')).resolves.toBeUndefined();
    await flush();

    expect(prisma.session.create).toHaveBeenCalledTimes(1);
  });
});
