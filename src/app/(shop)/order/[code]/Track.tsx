"use client";
import { useEffect, useRef } from "react";
import { useLang } from "@/components/LangProvider";
import { usePoll } from "@/components/usePoll";
import TreatImg from "@/components/TreatImg";
import { confetti } from "@/components/Toast";
import type { MenuT } from "@/components/spec";
import { useMaps, lineSpec, lineTitle, lineSub, lineImage } from "@/components/lines";
import { fmt, clock } from "@/lib/format";

type O = { code: string; number: number; status: "NEW" | "PREPARING" | "READY" | "DONE" | "CANCELLED"; total: number; createdAt: string; usedReward: boolean;
  items: { productId: string | null; size: string | null; base: "CONE" | "CUP" | "WAFFLE"; scoops: string[]; toppings: string[]; qty: number; price: number }[];
  branch: { nameAr: string; nameEn: string; addressAr: string; addressEn: string } };
const STEPS = ["NEW", "PREPARING", "READY", "DONE"] as const;

export default function Track({ code, menu }: { code: string; menu: MenuT }) {
  const { t, n, lang } = useLang();
  const { data: o, error } = usePoll<O>(`/api/orders/${code}`, 3000);
  const M = useMaps(menu);
  const prev = useRef<string | null>(null);
  useEffect(() => {
    if (!o) return;
    if (prev.current && prev.current !== "READY" && o.status === "READY") { confetti(); navigator.vibrate?.([200, 100, 200]); }
    prev.current = o.status;
  }, [o]);

  if (error === 404) return <p className="pt-20 text-center text-[var(--muted)]">404</p>;
  if (!o) return <div className="shimmer mx-auto mt-16 h-64 w-64 rounded-full" />;
  const idx = STEPS.indexOf(o.status as (typeof STEPS)[number]);
  const ready = o.status === "READY";
  const pct = o.status === "CANCELLED" ? 0 : ((idx + 1) / STEPS.length) * 100;
  const C = 2 * Math.PI * 110;

  return (
    <div className="flex flex-col items-center gap-6 pt-6 text-center">
      <div className="relative grid h-[260px] w-[260px] place-items-center">
        <div className="absolute inset-6 rounded-full blur-3xl" style={{ background: ready ? "rgba(61,220,151,.35)" : "rgba(255,107,26,.25)" }} />
        <svg viewBox="0 0 240 240" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="120" cy="120" r="110" fill="none" stroke="rgba(120,60,20,.08)" strokeWidth="10" />
          <circle cx="120" cy="120" r="110" fill="none" stroke={ready ? "var(--mint)" : "var(--honey)"} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} style={{ transition: "stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)", filter: `drop-shadow(0 0 8px ${ready ? "var(--mint)" : "var(--honey)"})` }} />
        </svg>
        <div className="relative">
          <div className="eyebrow">{t("orderNo")}</div>
          <div className={`display num text-[78px] ${ready ? "text-[var(--mint)]" : "neon"}`}>{o.number}</div>
          <div className="text-[13px] font-semibold text-[var(--muted)]">{n(o.branch)}</div>
        </div>
      </div>

      <div className={`glass w-full p-4 ${ready ? "neon-border" : ""}`}>
        <h1 className={`display text-[26px] ${ready ? "text-[var(--mint)]" : ""}`}>{t(`st_${o.status}`)}</h1>
        <p className="mt-1 text-[14px] text-[var(--muted)]">{ready || o.status === "NEW" || o.status === "PREPARING" ? t("showAtCounter") : ""}</p>
        <div className="mt-4 grid grid-cols-4 gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-1.5">
              <span className="h-1.5 w-full rounded-full transition" style={{ background: i <= idx ? (ready ? "var(--mint)" : "var(--honey)") : "rgba(120,60,20,.12)" }} />
              <span className={`text-[11px] font-semibold ${i <= idx ? "" : "text-[var(--muted)]"}`}>{t(`st_${s}`).split("!")[0]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass w-full p-3 text-start">
        {o.items.map((it, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-[var(--stroke)] py-2 last:border-0">
            <TreatImg spec={lineSpec(it, M)} imageId={lineImage(it, M)} alt="" className="h-16 w-14 rounded-xl" size={200} />
            <div className="min-w-0 flex-1">
              <b className="block truncate text-[14px]">{it.qty > 1 ? `${it.qty}× ` : ""}{lineTitle(it, M, n)}</b>
              <span className="text-[12px] text-[var(--muted)]">{lineSub(it, M, n, (b) => t(b))}</span>
            </div>
            <span className="num text-[13px] font-semibold">{fmt(it.price)}</span>
          </div>
        ))}
        <div className="mt-2 flex items-center justify-between px-1">
          <span className="text-[13px] text-[var(--muted)]">{clock(o.createdAt)} · {lang === "ar" ? o.branch.addressAr : o.branch.addressEn}</span>
          <b className="num text-[var(--honey)]">{fmt(o.total)} {t("currency")}</b>
        </div>
      </div>
    </div>
  );
}
