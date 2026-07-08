/** 判定使用者是否為活動主辦者（容忍 string/number 型別差異）。 */
export function isEventHost(
  userId?: string | number | null,
  ownerId?: string | number | null,
): boolean {
  if (userId == null || ownerId == null) return false;
  return userId.toString() === ownerId.toString();
}
