"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";
import { fmt, clock } from "@/lib/format";

type C = { phone: string | null; points: number; orders: { code: string; number: number; status: string; total: number; createdAt: string }[] };

export default function Hive() {
  const { t } = useLang();
  const [c, setC] = useState<C | null>(null);
  const [phone, setPhone] = useState("");
  const load = () => fetch("/api/customer", { cache: "no-store" }).then((r) => r.json()).then(setC);
  useEffect(() => { load(); }, []);
  const save = async () => { const r = await fetch("/api/customer", { method: "POST", body: JSON.stringify({ phone }) }); if (r.ok) load(); };
  const p = Math.min(10, c?.points ?? 0);
  const rows = [[0, 1, 2], [3, 4, 5, 6], [7, 8, 9]];

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div>
        <div className="eyebrow">{t("honeyPoints")}</div>
        <h1 className="display mt-1 text-[34px]"><span className="neon num">{p}</span><span className="text-[var(--muted)]"> / 10</span></h1>
      </div>
      <div className="glass neon-border flex flex-col items-center gap-1 px-3 py-6" style={{ background: "radial-gradient(circle at 50% 40%, rgba(255,107,26,.16), transparent 65%), rgba(255,255,255,.6)" }}>
        {rows.map((r, ri) => (
          <div key={ri} className="flex gap-1.5" style={{ marginTop: ri ? -14 : 0 }}>
            {r.map((i) => {
              const on = i < p, last = i === 9;
              return (
                <svg key={i} viewBox="0 0 60 68" className={`h-[68px] w-[60px] ${on ? "pop" : ""}`} style={{ animationDelay: `${i * 60}ms`, filter: on ? "drop-shadow(0 0 10px rgba(255,107,26,.55))" : undefined }}>
                  <path d="M30 2l26 15v34L30 66 4 51V17z" fill={on ? "url(#hg)" : "rgba(120,60,20,.05)"} stroke={on ? "#FFD84D" : "rgba(120,60,20,.15)"} strokeWidth="2" />
                  <defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD84D" /><stop offset="1" stopColor="#E53935" /></linearGradient></defs>
                  {last && <text x="30" y="42" textAnchor="middle" fontSize="22">🍦</text>}
                </svg>
              );
            })}
          </div>
        ))}
        <p className="mt-4 text-center font-semibold">{p >= 10 ? <span className="neon">{t("rewardReady")}</span> : t("freeAfter", { n: 10 - p })}</p>
      </div>

      {c && !c.phone && (
        <div className="glass p-4">
          <label htmlFor="hp" className="mb-2 block font-semibold">{t("enterPhone")}</label>
          <div className="flex gap-2">
            <input id="hp" className="input num" dir="ltr" inputMode="tel" placeholder="09XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button className="btn btn-honey" onClick={save}>{t("save")}</button>
          </div>
        </div>
      )}

      {!!c?.orders.length && (
        <section>
          <h2 className="display mb-2.5 text-[18px]">{t("recentOrders")}</h2>
          <div className="flex flex-col gap-2">
            {c.orders.map((o) => (
              <Link key={o.code} href={`/order/${o.code}`} className="glass flex items-center gap-3 p-3">
                <b className="display num text-[22px] text-[var(--honey)]">#{o.number}</b>
                <span className="flex-1 text-[13px] text-[var(--muted)]">{clock(o.createdAt)} · {t(`st_${o.status}` as "st_NEW")}</span>
                <span className="num text-[13px] font-semibold">{fmt(o.total)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
