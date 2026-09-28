"use client";

import { useEffect, useState } from "react";

/** Fetches `/api/config` once. `null` means "still loading" — callers should
 * treat that the same as `false` so a slow/failed check never blocks the UI. */
export function useOnlineEnabled(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/config")
      .then((res) => (res.ok ? res.json() : { onlineEnabled: false }))
      .then((data) => {
        if (!cancelled) setEnabled(Boolean(data.onlineEnabled));
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return enabled;
}
