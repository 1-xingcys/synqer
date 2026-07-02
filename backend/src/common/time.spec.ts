import { appWallClockNow, DEFAULT_TIME_ZONE } from './time';

describe('DEFAULT_TIME_ZONE', () => {
  it('is the application canonical time zone', () => {
    expect(DEFAULT_TIME_ZONE).toBe('Asia/Taipei');
  });
});

describe('appWallClockNow', () => {
  it('encodes the current Asia/Taipei wall-clock into the UTC fields', () => {
    // 2025-01-01T02:00:00Z is 2025-01-01 10:00 in Asia/Taipei (UTC+8).
    const result = appWallClockNow(new Date('2025-01-01T02:00:00.000Z'));
    expect(result.toISOString()).toBe('2025-01-01T10:00:00.000Z');
  });

  it('rolls the calendar date forward when Taipei is already the next day', () => {
    // 2025-01-01T20:00:00Z is 2025-01-02 04:00 in Asia/Taipei.
    const result = appWallClockNow(new Date('2025-01-01T20:00:00.000Z'));
    expect(result.toISOString()).toBe('2025-01-02T04:00:00.000Z');
  });

  it('normalizes midnight Taipei to hour 0 in the UTC fields', () => {
    // 2025-01-01T16:00:00Z is 2025-01-02 00:00 in Asia/Taipei.
    const result = appWallClockNow(new Date('2025-01-01T16:00:00.000Z'));
    expect(result.toISOString()).toBe('2025-01-02T00:00:00.000Z');
  });
});
