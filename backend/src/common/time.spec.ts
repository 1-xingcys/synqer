import {
  DEFAULT_TIME_ZONE,
  zonedWallClockToInstant,
  instantToZonedWallClock,
} from './time';

describe('time util', () => {
  it('DEFAULT_TIME_ZONE is Asia/Taipei', () => {
    expect(DEFAULT_TIME_ZONE).toBe('Asia/Taipei');
  });

  it('resolves Asia/Taipei wall-clock 20:00 to 12:00Z', () => {
    const wall = new Date('2026-07-13T20:00:00Z'); // 牆上 20:00
    const instant = zonedWallClockToInstant(wall, 'Asia/Taipei');
    expect(instant.toISOString()).toBe('2026-07-13T12:00:00.000Z');
  });

  it('resolves Asia/Tokyo wall-clock 20:00 to 11:00Z', () => {
    const wall = new Date('2026-07-13T20:00:00Z');
    const instant = zonedWallClockToInstant(wall, 'Asia/Tokyo');
    expect(instant.toISOString()).toBe('2026-07-13T11:00:00.000Z');
  });

  it('handles half-hour offset (Asia/Kolkata +5:30)', () => {
    const wall = new Date('2026-07-13T20:00:00Z');
    const instant = zonedWallClockToInstant(wall, 'Asia/Kolkata');
    expect(instant.toISOString()).toBe('2026-07-13T14:30:00.000Z');
  });

  it('handles a negative-offset zone across the day boundary', () => {
    const wall = new Date('2026-07-13T02:00:00Z'); // 牆上 02:00
    const instant = zonedWallClockToInstant(wall, 'America/New_York'); // EDT -4
    expect(instant.toISOString()).toBe('2026-07-13T06:00:00.000Z');
  });

  it('round-trips instant -> wall-clock -> instant', () => {
    const instant = new Date('2026-07-13T12:00:00Z');
    const wall = instantToZonedWallClock(instant, 'Asia/Taipei');
    expect(wall.toISOString()).toBe('2026-07-13T20:00:00.000Z');
    expect(
      zonedWallClockToInstant(wall, 'Asia/Taipei').toISOString(),
    ).toBe(instant.toISOString());
  });
});
