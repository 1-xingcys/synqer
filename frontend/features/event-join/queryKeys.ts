/**
 * Shared by both join hooks: useEventJoin reads the participation key,
 * useAutoJoinEvent invalidates it. Keeping it here rather than in either hook
 * avoids an import cycle between them.
 */
export const eventJoinKeys = {
  all: ["eventJoin"] as const,
  public: (eventId: string) =>
    [...eventJoinKeys.all, "public", eventId] as const,
  participation: (eventId: string) =>
    [...eventJoinKeys.all, "participation", eventId] as const,
};
