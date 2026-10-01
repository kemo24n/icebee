"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useLang } from "./LangProvider";
import { useCart } from "./Cart";
import { toast } from "./Toast";
import { productSpec, type ProductT } from "./spec";
import { fmt } from "@/lib/format";

const Treat3D = dynamic(() => import("./Treat3D"), { ssr: false, loading: () => <div className="shimmer h-full w-full rounded-3xl" /> });

export function ProductSheet({ p, onClose }: { p: ProductT; onClose: () => void }) {
  const { t, n, lang } = useLang();
  const { add } = useCart();
  const [size, setSize] = useState(p.sizes[0]?.key ?? null);
  const [qty, setQty] = useState(1);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [onClose]);
  const unit = p.price + (p.sizes.find((s) => s.key === size)?.delta ?? 0);
  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center bg-[rgba(0,0,0,.55)] backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={n(p)}>
      <div className="glass rise w-full max-w-[560px] rounded-b-none p-5 pb-[max(env(safe-area-inset-bottom),20px)]" style={{ background: "linear-gradient(180deg, rgba(255,240,226,.98), rgba(255,248,240,.98))" }} onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--stroke)]" />
        <div className="relative h-[280px]">
          <div className="pointer-events-none absolute inset-0 m-auto h-48 w-48 rounded-full blur-3xl" style={{ background: p.color, opacity: 0.35 }} />
          {p.imageId
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={`/api/img/${p.imageId}`} alt={n(p)} className="h-full w-full rounded-3xl object-cover" />
            : <Treat3D spec={productSpec(p)} className="relative h-full w-full" />}
        </div>
        <div className="mt-3 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="display text-[26px]">{n(p)}</h2>
            {(lang === "ar" ? p.descAr : p.descEn) && <p className="mt-1 text-[14px] text-[var(--muted)]">{lang === "ar" ? p.descAr : p.descEn}</p>}
          </div>
          <button className="chip" onClick={onClose} aria-label="close">✕</button>
        </div>
        {p.sizes.length > 0 && (
          <div className="mt-4 flex gap-2">
            {p.sizes.map((s) => (
              <button key={s.key} className="chip flex-1 justify-center py-2.5" aria-pressed={size === s.key} onClick={() => setSize(s.key)}>
                {n(s)} {s.delta > 0 && <span className="num opacity-70">+{fmt(s.delta)}</span>}
              </button>
            ))}
          </div>
        )}
        <div className="mt-5 flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-[var(--glass2)] p-1">
            <button className="grid h-9 w-9 place-items-center rounded-full text-lg" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="-">−</button>
            <b className="num w-6 text-center">{qty}</b>
            <button className="grid h-9 w-9 place-items-center rounded-full text-lg" onClick={() => setQty(Math.min(20, qty + 1))} aria-label="+">+</button>
          </div>
          <button className="btn btn-honey flex-1" disabled={p.soldOut} onClick={() => { add({ productId: p.id, size, qty }); toast(`${n(p)} ✓`); navigator.vibrate?.(15); onClose(); }}>
            {p.soldOut ? t("soldOut") : <>{t("addToOrder")} · <span className="num">{fmt(unit * qty)}</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}
