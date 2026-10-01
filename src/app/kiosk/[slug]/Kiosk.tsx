"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLang, LangToggle } from "@/components/LangProvider";
import { usePoll } from "@/components/usePoll";
import TreatImg from "@/components/TreatImg";
import { Wordmark } from "@/components/Logo";
import { confetti } from "@/components/Toast";
import { flavorSpec, toSpec, productSpec, type FlavorT, type ItemT, type MenuT, type CartItemT } from "@/components/spec";
import { useMaps, linePrice, lineSpec, lineImage } from "@/components/lines";
import { fmt } from "@/lib/format";
import { WAFFLE_EXTRA } from "@/lib/pricing";

const Treat3D = dynamic(() => import("@/components/Treat3D"), { ssr: false });
type Menu = MenuT;
const EMPTY: ItemT = { base: "CONE", scoops: [], toppings: [], qty: 1 };

export default function Kiosk({ branch, menu }: { branch: { id: string; slug: string; nameAr: string; nameEn: string }; menu: Menu }) {
  const { t, n } = useLang();
  const { data } = usePoll<Menu>(`/api/menu?branch=${branch.id}`, 10000);
  const m = data ?? menu;
  const M = useMaps(m);
  const { fl, tp } = M;
  const [cat, setCat] = useState<string | null>(null);
  const activeCat = m.categories.find((c) => c.id === cat) ?? m.categories[0];
  const [mode, setMode] = useState<"attract" | "build" | "done">("attract");
  const [it, setIt] = useState<ItemT>(EMPTY);
  const [items, setItems] = useState<CartItemT[]>([]);
  const [num, setNum] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => { setMode("attract"); setIt(EMPTY); setItems([]); setNum(null); setCat(null); }, []);
  const poke = useCallback(() => { if (idle.current) clearTimeout(idle.current); idle.current = setTimeout(reset, mode === "done" ? 12000 : 75000); }, [reset, mode]);
  useEffect(() => { if (mode !== "attract") poke(); return () => { if (idle.current) clearTimeout(idle.current); }; }, [mode, poke]);

  const price = (x: CartItemT) => linePrice(x, M);
  const all: CartItemT[] = it.scoops.length ? [...items, it] : items;
  const [focus, setFocus] = useState<string | null>(null);
  const addProduct = (id: string) => {
    const p = M.pr.get(id); if (!p) return;
    setFocus(id);
    const i = items.findIndex((x) => x.productId === id);
    if (i >= 0) setItems(items.map((x, k) => (k === i ? { ...x, qty: x.qty + 1 } : x)));
    else setItems([...items, { productId: id, size: p.sizes[0]?.key ?? null, qty: 1 }]);
  };
  const total = all.reduce((a, x) => a + price(x), 0);
  const attractSpec = useMemo(() => {
    const pick = ["cherry", "vanilla", "pistachio"].map((s) => m.flavors.find((f) => f.slug === s)).filter(Boolean) as FlavorT[];
    return { base: "CONE" as const, scoops: pick.map((f) => ({ slug: f.slug, color: f.color })), toppings: ["chocolate-drizzle"] };
  }, [m.flavors]);

  const checkout = async () => {
    if (!all.length) return;
    setBusy(true);
    const r = await fetch("/api/orders", { method: "POST", body: JSON.stringify({ branchId: branch.id, source: "KIOSK", items: all }) });
    setBusy(false);
    if (r.ok) { const j = await r.json(); setNum(j.number); setMode("done"); confetti(); }
  };

  if (mode === "attract") return (
    <div role="button" tabIndex={0} onClick={() => setMode("build")} onKeyDown={(e) => e.key === "Enter" && setMode("build")} className="relative grid h-dvh w-full cursor-pointer place-items-center overflow-hidden text-center" style={{ background: "radial-gradient(50% 50% at 50% 45%, rgba(255,107,26,.3), rgba(229,57,53,.12) 55%, #FFF6EC 80%)" }}>
      <div className="absolute top-8 start-10 scale-150"><Wordmark /></div>
      <div className="absolute top-8 end-10" onClick={(e) => e.stopPropagation()}><LangToggle className="text-[18px]" /></div>
      <div className="flex flex-col items-center">
        <div className="h-[62vh] w-[60vh]"><Treat3D spec={attractSpec} className="h-full w-full" /></div>
        <h1 className="display text-[7vh]">{t("heroTitle").replace("\n", " ")}</h1>
        <span className="neon display mt-3 animate-pulse text-[4.5vh]">{t("tapToOrder")} 👆</span>
      </div>
    </div>
  );

  if (mode === "done") return (
    <div onClick={reset} className="grid h-dvh place-items-center text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="eyebrow text-[2.4vh]">{t("orderNo")}</div>
        <div className="display num neon pop text-[26vh] leading-none">{num}</div>
        <h1 className="display text-[5vh]">{t("kioskDone")} 💵</h1>
        <p className="text-[2.4vh] text-[var(--muted)]">{n(branch)}</p>
        <button className="btn btn-honey mt-6 px-10 py-5 text-[2.6vh]">{t("newOrder")}</button>
      </div>
    </div>
  );

  const full = it.scoops.length >= 3;
  const fp = !activeCat?.isBuilder ? (M.pr.get(focus ?? "")?.categoryId === activeCat?.id ? M.pr.get(focus!) : m.products.find((p) => p.categoryId === activeCat?.id)) : undefined;
  const stageSpec = fp ? productSpec(fp) : toSpec(it, fl, tp);
  return (
    <div className="grid h-dvh grid-cols-[1fr_1.1fr] gap-6 p-6" onPointerDown={poke}>
      <section className="glass neon-border relative flex flex-col overflow-hidden" style={{ background: "radial-gradient(circle at 50% 45%, rgba(255,107,26,.22), rgba(229,57,53,.08) 45%, rgba(255,255,255,.9) 75%)" }}>
        <div className="flex items-center justify-between p-5"><Wordmark /><div className="flex gap-2"><LangToggle /><button className="chip" onClick={reset}>✕</button></div></div>
        <div className="relative flex-1"><Treat3D spec={stageSpec} className="absolute inset-0" />
          {activeCat?.isBuilder && !it.scoops.length && <p className="absolute inset-x-0 bottom-6 text-center text-[2.4vh] text-[var(--muted)]">{t("pickFirst")}</p>}
        </div>
        <div className="flex items-center gap-3 p-5">
          {activeCat?.isBuilder && it.scoops.length > 0 && <button className="btn btn-ghost text-[2vh]" onClick={() => setIt({ ...it, scoops: it.scoops.slice(0, -1) })}>↶ {t("removeScoop")}</button>}
          <span className="flex-1" />
          <b className="display num text-[4vh] text-[var(--honey)]">{fp ? <span className="text-[2.6vh] text-[var(--ink)]">{n(fp)} · </span> : null}{fmt(fp ? fp.price : price(it))}</b>
        </div>
      </section>

      <section className="flex min-h-0 flex-col gap-4">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {m.categories.map((c) => <button key={c.id} className="chip shrink-0 px-5 py-3 text-[2vh]" aria-pressed={c.id === activeCat?.id} onClick={() => setCat(c.id)}>{c.icon} {n(c)}</button>)}
        </div>
        {activeCat?.isBuilder ? <>
        <div className="grid grid-cols-3 gap-3">
          {(["CONE", "CUP", "WAFFLE"] as const).map((b) => (
            <button key={b} aria-pressed={it.base === b} onClick={() => setIt({ ...it, base: b })} className={`glass flex items-center justify-center gap-3 py-2 text-[2.1vh] font-bold ${it.base === b ? "neon-border" : "opacity-70"}`}>
              <TreatImg spec={{ base: b, scoops: [], toppings: [] }} alt="" className="h-[6vh] w-[6vh]" size={200} />{t(b)}{b === "WAFFLE" && <span className="num text-[1.6vh] text-[var(--muted)]">+{fmt(WAFFLE_EXTRA)}</span>}
            </button>
          ))}
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-4 content-start gap-3 overflow-auto">
          {m.flavors.map((f) => {
            const c = it.scoops.filter((x) => x === f.id).length;
            return (
              <button key={f.id} disabled={f.soldOut || (full && !c)} onClick={() => !full && setIt({ ...it, scoops: [...it.scoops, f.id] })}
                className={`glass relative flex flex-col items-center p-3 text-center transition active:scale-95 disabled:opacity-35 ${c ? "neon-border" : ""}`}>
                <TreatImg spec={flavorSpec(f)} imageId={f.imageId} alt={n(f)} className="h-[10vh] w-[10vh]" size={260} />
                <b className="text-[1.9vh] leading-tight">{n(f)}</b>
                <span className="num text-[1.6vh] text-[var(--muted)]">{f.soldOut ? t("soldOut") : fmt(f.price)}</span>
                {c > 0 && <span className="pop absolute top-2 end-2 grid h-[3.6vh] w-[3.6vh] place-items-center rounded-full bg-[var(--honey)] text-[1.8vh] font-extrabold text-white">{c}</span>}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {m.toppings.map((x) => <button key={x.id} className="chip px-4 py-2.5 text-[1.8vh]" aria-pressed={it.toppings.includes(x.id)} onClick={() => setIt({ ...it, toppings: it.toppings.includes(x.id) ? it.toppings.filter((k) => k !== x.id) : [...it.toppings, x.id] })}>{n(x)} +{fmt(x.price)}</button>)}
        </div>
        </> : (
        <div className="grid min-h-0 flex-1 grid-cols-3 content-start gap-3 overflow-auto">
          {m.products.filter((p) => p.categoryId === activeCat?.id).map((p) => {
            const q = items.find((x) => x.productId === p.id)?.qty ?? 0;
            return (
              <button key={p.id} disabled={p.soldOut} onClick={() => addProduct(p.id)} className={`glass relative flex flex-col items-center p-3 text-center transition active:scale-95 disabled:opacity-35 ${q ? "neon-border" : ""}`}>
                <TreatImg spec={productSpec(p)} imageId={p.imageId} alt={n(p)} className="h-[15vh] w-[15vh] rounded-2xl" size={300} />
                <b className="mt-1 text-[2vh] leading-tight">{n(p)}</b>
                <span className="num text-[1.7vh] text-[var(--honey)]">{p.soldOut ? t("soldOut") : fmt(p.price)}</span>
                {q > 0 && <span className="pop absolute top-2 end-2 grid h-[3.6vh] w-[3.6vh] place-items-center rounded-full bg-[var(--honey)] text-[1.8vh] font-extrabold text-white">{q}</span>}
              </button>
            );
          })}
        </div>)}
        <div className="glass flex items-center gap-3 p-3">
          <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
            {items.map((x, i) => (
              <button key={i} onClick={() => setItems(items.filter((_, k) => k !== i))} className="relative shrink-0 rounded-2xl bg-[rgba(120,60,20,.05)] p-1" aria-label="remove">
                <TreatImg spec={lineSpec(x, M)} imageId={lineImage(x, M)} alt="" className="h-[8vh] w-[7vh] rounded-lg" size={200} /><span className="absolute top-0 end-0 text-[1.6vh]">✕</span>{x.qty > 1 && <span className="absolute bottom-0 start-0 rounded-full bg-[var(--honey)] px-1.5 text-[1.4vh] font-bold text-white">{x.qty}</span>}
              </button>
            ))}
            {activeCat?.isBuilder && <button disabled={!it.scoops.length} onClick={() => { setItems([...items, it]); setIt(EMPTY); }} className="btn btn-ghost shrink-0 text-[2vh]">+ {t("addToOrder")}</button>}
          </div>
          <div className="text-end"><div className="text-[1.6vh] text-[var(--muted)]">{t("total")}</div><b className="display num text-[3.4vh] text-[var(--honey)]">{fmt(total)}</b></div>
          <button className="btn btn-honey px-8 py-5 text-[2.4vh]" disabled={busy || !all.length} onClick={checkout}>{t("checkout")}</button>
        </div>
      </section>
    </div>
  );
}
