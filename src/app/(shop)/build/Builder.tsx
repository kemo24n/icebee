"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LangProvider";
import { useCart } from "@/components/Cart";
import { usePoll } from "@/components/usePoll";
import TreatImg from "@/components/TreatImg";
import { toast } from "@/components/Toast";
import { flavorSpec, toSpec, type FlavorT, type ToppingT, type ItemT } from "@/components/spec";
import { fmt } from "@/lib/format";
import { WAFFLE_EXTRA } from "@/lib/pricing";

const Treat3D = dynamic(() => import("@/components/Treat3D"), { ssr: false, loading: () => <div className="shimmer h-full w-full rounded-[28px]" /> });
type Menu = { flavors: FlavorT[]; toppings: ToppingT[] };

export default function Builder({ menu }: { menu: Menu }) {
  const { t, n } = useLang();
  const router = useRouter();
  const { branchId, add } = useCart();
  const { data } = usePoll<Menu>(branchId ? `/api/menu?branch=${branchId}` : null, 12000);
  const m = data ?? menu;
  const fl = useMemo(() => new Map(m.flavors.map((f) => [f.id, f])), [m]);
  const tp = useMemo(() => new Map(m.toppings.map((x) => [x.id, x])), [m]);
  const [it, setIt] = useState<ItemT>({ base: "CONE", scoops: [], toppings: [], qty: 1 });

  useEffect(() => {
    const f = new URLSearchParams(location.search).get("f");
    if (f) setIt((x) => (x.scoops.length ? x : { ...x, scoops: [f] }));
  }, []);
  // drop scoops that became sold out
  useEffect(() => { setIt((x) => ({ ...x, scoops: x.scoops.filter((id) => fl.get(id) && !fl.get(id)!.soldOut) })); }, [fl]);

  const spec = toSpec(it, fl, tp);
  const unit = it.scoops.reduce((a, id) => a + (fl.get(id)?.price ?? 0), 0) + it.toppings.reduce((a, id) => a + (tp.get(id)?.price ?? 0), 0) + (it.base === "WAFFLE" ? WAFFLE_EXTRA : 0);
  const full = it.scoops.length >= 3;

  const addScoop = (id: string) => { if (!full) { setIt((x) => ({ ...x, scoops: [...x.scoops, id] })); navigator.vibrate?.(12); } };
  const toggleTop = (id: string) => setIt((x) => ({ ...x, toppings: x.toppings.includes(id) ? x.toppings.filter((k) => k !== id) : [...x.toppings, id] }));

  const onAdd = () => {
    if (!it.scoops.length) return;
    add(it);
    toast(t("addToOrder") + " ✓");
    router.push("/cart");
  };

  const onGift = () => {
    if (!it.scoops.length) return;
    try { sessionStorage.setItem("ib_gift_item", JSON.stringify({ base: it.base, scoops: it.scoops, toppings: it.toppings })); } catch {}
    router.push("/gift/new");
  };

  return (
    <div className="pt-1">
      {/* stage */}
      <div className="glass neon-border sticky top-[64px] z-20 overflow-hidden" style={{ background: "radial-gradient(circle at 50% 45%, rgba(255,107,26,.22), rgba(229,57,53,.08) 45%, rgba(255,255,255,0) 75%), #FFF3E6" }}>
        <div className="relative h-[min(38vh,330px)]">
          <Treat3D spec={spec} className="h-full w-full" />
          <div className="absolute top-3 start-3 flex items-center gap-1.5">
            {[0, 1, 2].map((k) => <span key={k} className="h-2 w-6 rounded-full transition" style={{ background: k < it.scoops.length ? fl.get(it.scoops[k])?.color : "rgba(120,60,20,.15)" }} />)}
          </div>
          <div className="num absolute top-2.5 end-3 rounded-full bg-[rgba(255,248,240,.7)] px-3 py-1.5 text-[14px] font-bold text-[var(--honey)]">{fmt(unit * it.qty)} {t("currency")}</div>
          {!it.scoops.length && <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[14px] font-semibold text-[var(--muted)]">{t("pickFirst")}</div>}
          {it.scoops.length > 0 && (
            <button onClick={() => setIt((x) => ({ ...x, scoops: x.scoops.slice(0, -1) }))} className="chip absolute bottom-3 end-3 text-[12px]" style={{ background: "rgba(255,248,240,.7)" }}>↶ {t("removeScoop")}</button>
          )}
        </div>
      </div>

      {/* base */}
      <h3 className="display mb-2.5 mt-6 text-[18px]">{t("base")}</h3>
      <div className="grid grid-cols-3 gap-2">
        {(["CONE", "CUP", "WAFFLE"] as const).map((b) => (
          <button key={b} onClick={() => setIt((x) => ({ ...x, base: b }))} aria-pressed={it.base === b}
            className={`glass flex flex-col items-center gap-1 p-2 transition ${it.base === b ? "neon-border" : "opacity-70"}`}>
            <TreatImg spec={{ base: b, scoops: [], toppings: [] }} alt={t(b)} className="h-[70px] w-[70px]" size={200} />
            <span className="text-[13px] font-semibold">{t(b)}</span>
            <span className="num text-[11px] text-[var(--muted)]">{b === "WAFFLE" ? `+${fmt(WAFFLE_EXTRA)}` : "—"}</span>
          </button>
        ))}
      </div>

      {/* flavors */}
      <h3 className="display mb-2.5 mt-6 text-[18px]">{t("flavors")} <span className="text-[13px] font-medium text-[var(--muted)]">· {t("upTo3")}</span></h3>
      <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2">
        {m.flavors.map((f) => {
          const c = it.scoops.filter((x) => x === f.id).length;
          const dis = f.soldOut || (full && !c);
          return (
            <button key={f.id} disabled={dis} onClick={() => addScoop(f.id)}
              className={`glass relative flex w-[112px] shrink-0 flex-col items-center p-2.5 text-center transition active:scale-95 ${dis ? "opacity-40" : ""} ${c ? "neon-border" : ""}`}>
              <div className="relative grid h-[80px] w-full place-items-center">
                <div className="absolute h-14 w-14 rounded-full blur-xl" style={{ background: f.color, opacity: 0.4 }} />
                <TreatImg spec={flavorSpec(f)} imageId={f.imageId} alt={n(f)} className="relative h-[80px] w-[80px]" size={220} />
              </div>
              <b className="mt-1 text-[12.5px] leading-tight">{n(f)}</b>
              <span className="num text-[11px] text-[var(--muted)]">{f.soldOut ? t("soldOut") : `+${fmt(f.price)}`}</span>
              {c > 0 && <span className="pop absolute top-1.5 end-1.5 grid h-6 w-6 place-items-center rounded-full bg-[var(--honey)] text-[12px] font-extrabold text-[#FFFFFF]">{c}</span>}
              {f.tag === "drop" && !c && <span className="pill pill-pink absolute top-1.5 start-1.5">★</span>}
            </button>
          );
        })}
      </div>

      {/* toppings */}
      <h3 className="display mb-2.5 mt-5 text-[18px]">{t("toppings")}</h3>
      <div className="flex flex-wrap gap-2">
        {m.toppings.map((x) => (
          <button key={x.id} onClick={() => toggleTop(x.id)} aria-pressed={it.toppings.includes(x.id)} className="chip">
            {n(x)} <span className="num opacity-70">+{fmt(x.price)}</span>
          </button>
        ))}
      </div>

      <div className="h-24" />
      {/* bar */}
      <div className="fixed inset-x-0 bottom-[86px] z-30 px-3">
        <div className="glass mx-auto flex max-w-[520px] items-center gap-3 p-2.5 ps-4" style={{ background: "rgba(255,255,255,.9)" }}>
          <div className="flex items-center gap-1 rounded-full bg-[var(--glass2)] p-1">
            <button className="grid h-8 w-8 place-items-center rounded-full text-lg" onClick={() => setIt((x) => ({ ...x, qty: Math.max(1, x.qty - 1) }))} aria-label="-">−</button>
            <b className="num w-5 text-center">{it.qty}</b>
            <button className="grid h-8 w-8 place-items-center rounded-full text-lg" onClick={() => setIt((x) => ({ ...x, qty: Math.min(20, x.qty + 1) }))} aria-label="+">+</button>
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-[11.5px] text-[var(--muted)]">{t("total")}</div>
            <b className="num text-[17px] text-[var(--honey)]">{fmt(unit * it.qty)}</b>
          </div>
          <button className="btn btn-ghost px-3.5" disabled={!it.scoops.length} onClick={onGift} aria-label={t("sendGift")} title={t("sendGift")}>🎁</button>
          <button className="btn btn-honey" disabled={!it.scoops.length} onClick={onAdd}>{t("addToOrder")}</button>
        </div>
      </div>
    </div>
  );
}
