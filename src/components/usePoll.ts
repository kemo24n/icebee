"use client";
import { useEffect, useRef, useState, useCallback } from "react";
export function usePoll<T>(url: string | null, ms = 3000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<number | null>(null);
  const alive = useRef(true);
  const load = useCallback(async () => {
    if (!url) return;
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) { setError(r.status); return; }
      const j = (await r.json()) as T;
      if (alive.current) { setData(j); setError(null); }
    } catch { /* offline: keep last data */ }
  }, [url]);
  useEffect(() => {
    alive.current = true;
    load();
    const id = setInterval(() => { if (document.visibilityState === "visible") load(); }, ms);
    return () => { alive.current = false; clearInterval(id); };
  }, [load, ms]);
  return { data, error, reload: load };
}
