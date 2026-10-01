"use client";
import { useEffect, useState } from "react";
import { useLang } from "./LangProvider";
export function Countdown({ to }: { to: string }) {
  const { t } = useLang();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  if (now === null) return <span className="num">--</span>;
  let s = Math.max(0, Math.floor((new Date(to).getTime() - now) / 1000));
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  const cell = (v: number, u: string) => (
    <span className="glass flex min-w-[52px] flex-col items-center rounded-2xl px-2 py-1.5">
      <b className="display num text-[22px]">{String(v).padStart(2, "0")}</b>
      <span className="text-[11px] text-[var(--muted)]">{u}</span>
    </span>
  );
  return <span className="flex gap-1.5" dir="ltr">{cell(d, t("d"))}{cell(h, t("h"))}{cell(m, t("m"))}{cell(s, t("s"))}</span>;
}
