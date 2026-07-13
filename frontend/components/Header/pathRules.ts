const EVENTS_OVERVIEW_STATIC_SEGMENTS = new Set([
  "info",
  "completed",
  "confirmed",
  "voting-ended",
  "voting",
]);

export function isEventDetailPagePath(pathname?: string | null): boolean {
  const pathSegments = (pathname || "").split("/").filter(Boolean);

  return (
    (pathSegments[0] === "joined" ||
      pathSegments[0] === "hosted" ||
      pathSegments[0] === "events") &&
    pathSegments.length >= 2 &&
    !EVENTS_OVERVIEW_STATIC_SEGMENTS.has(pathSegments[1])
  );
}
