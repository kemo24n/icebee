"use client";
import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";
import TreatImg from "@/components/TreatImg";
import { Countdown } from "@/components/Countdown";
import { confetti } from "@/components/Toast";

type V = { poll: null | { id: string; titleAr: string; titleEn: string; endsAt: string }; options?: { id: string; nameAr: string; nameEn: string; descAr: string; descEn: string; look: string; color: string; n: number }[]; mine?: string | null };

export default function Vote() {
  const { t, n, lang } = useLang();
  const [v, setV] = useState<V | null>(null);
  useEffect(() => { fetch("/api/vote", { cache: "no-store" }).then((r) => r.json()).then(setV); }, []);
  const cast = async (id: string) => {
    const r = await fetch("/api/vote", { method: "POST", body: JSON.stringify({ optionId: id }) });
    if (r.ok) { setV(await r.json()); confetti(); navigator.vibrate?.(30); }
  };
  if (!v) return <div className="shimmer mt-10 h-60 rounded-3xl" />;
  if (!v.poll) return <p className="pt-20 text-center text-[var(--muted)]">—</p>;
  const total = v.options!.reduce((a, o) => a + o.n, 0) || 1;
  const voted = !!v.mine;
  return (
    <div className="flex flex-col gap-5 pt-3">
      <div>
        <span className="pill pill-honey">🗳 {t("vote")}</span>
        <h1 className="display mt-2 text-[30px]">{lang === "ar" ? v.poll.titleAr : v.poll.titleEn}</h1>
        <p className="mt-1 text-[14px] text-[var(--muted)]">{t("voteSub")}</p>
        <div className="mt-3"><Countdown to={v.poll.endsAt} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {v.options!.map((o) => {
          const pct = Math.round((o.n / total) * 100), mine = v.mine === o.id;
          return (
            <button key={o.id} onClick={() => cast(o.id)} className={`glass relative flex flex-col items-center overflow-hidden p-3 text-center transition active:scale-95 ${mine ? "neon-border" : ""}`}>
              {voted && <span className="absolute inset-x-0 bottom-0 transition-all duration-700" style={{ height: `${pct}%`, background: `linear-gradient(to top, ${o.color}55, transparent)` }} />}
              <div className="relative grid h-[110px] w-full place-items-center">
                <div className="absolute h-16 w-16 rounded-full blur-2xl" style={{ background: o.color, opacity: 0.45 }} />
                <TreatImg spec={{ base: "NONE", scoops: [{ slug: o.look, color: o.color }], toppings: [] }} alt={n(o)} className="relative h-[110px] w-[110px]" size={260} />
              </div>
              <b className="relative text-[15px]">{n(o)}</b>
              <span className="relative text-[12px] text-[var(--muted)]">{lang === "ar" ? o.descAr : o.descEn}</span>
              {voted && <span className="display num relative mt-1.5 text-[22px]" style={{ color: mine ? "var(--honey)" : undefined }}>{pct}%</span>}
              {mine && <span className="pill pill-honey relative mt-1">✓ {t("yourVote")}</span>}
            </button>
          );
        })}
      </div>
      {voted && <p className="text-center text-[13px] text-[var(--muted)]"><span className="num">{total}</span> {t("votes")}</p>}
    </div>
  );
}
