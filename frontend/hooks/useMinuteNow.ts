import { useEffect, useState } from "react";

const ONE_MINUTE_MS = 60_000;

export function getDelayUntilNextMinute(now: Date): number {
  const elapsedMsInCurrentMinute =
    now.getSeconds() * 1000 + now.getMilliseconds();

  return elapsedMsInCurrentMinute === 0
    ? ONE_MINUTE_MS
    : ONE_MINUTE_MS - elapsedMsInCurrentMinute;
}

export function useMinuteNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let intervalId: number | null = null;
    let timeoutId: number | null = null;

    const syncNow = () => {
      setNow(new Date());
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncNow();
      }
    };

    const startMinuteInterval = () => {
      intervalId = window.setInterval(syncNow, ONE_MINUTE_MS);
    };

    timeoutId = window.setTimeout(() => {
      syncNow();
      startMinuteInterval();
    }, getDelayUntilNextMinute(new Date()));

    window.addEventListener("focus", syncNow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      window.removeEventListener("focus", syncNow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return now;
}
