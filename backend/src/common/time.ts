/**
 * 應用程式的預設時區。
 *
 * event 牆上時間一律以 naive 儲存（grid = date + minute-of-day；votingDeadline
 * 以「牆上數字放進 UTC 欄位」儲存）。實際時區由 `event.timeZone` 承載，只有在需要
 * 真實時間點時才用本檔的換算把 naive 解析成 instant。此常數僅作為「建立活動時的預設值」。
 */
export const DEFAULT_TIME_ZONE = 'Asia/Taipei';

/** 回傳 `timeZone` 在 `instant` 當下相對 UTC 的偏移（毫秒，東為正）。 */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);

  const map: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = Number(part.value);
  }

  const asUTC = Date.UTC(
    map.year,
    map.month - 1,
    map.day,
    map.hour % 24, // h23 可能吐 "24"，正規化成 0
    map.minute,
    map.second,
  );
  return asUTC - instant.getTime();
}

/**
 * 把「UTC 欄位承載牆上數字的 `wallClock`，視為 `timeZone` 的牆上時間」解析成真實 UTC instant。
 * 兩段式修正涵蓋 DST 轉換邊界。
 */
export function zonedWallClockToInstant(
  wallClock: Date,
  timeZone: string,
): Date {
  const wall = wallClock.getTime();
  const offset1 = zoneOffsetMs(new Date(wall), timeZone);
  let instant = wall - offset1;
  const offset2 = zoneOffsetMs(new Date(instant), timeZone);
  if (offset2 !== offset1) instant = wall - offset2;
  return new Date(instant);
}

/**
 * 反向：把真實 instant 轉成一個「UTC 欄位承載 `timeZone` 牆上數字」的 `Date`。
 * 例如把 `new Date()` 投影成「該時區的牆上現在」。
 */
export function instantToZonedWallClock(instant: Date, timeZone: string): Date {
  return new Date(instant.getTime() + zoneOffsetMs(instant, timeZone));
}
