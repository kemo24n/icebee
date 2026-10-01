"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang, LangToggle } from "@/components/LangProvider";
import { usePoll } from "@/components/usePoll";
import TreatImg from "@/components/TreatImg";
import { Wordmark } from "@/components/Logo";
import { flavorSpec, productSpec, type FlavorT, type ToppingT, type ItemT, type MenuT } from "@/components/spec";
import { useMaps, lineSpec, lineTitle, lineSub, lineImage } from "@/components/lines";
import { fmt } from "@/lib/format";

type B = { id: string; slug: string; nameAr: string; nameEn: string };
type Item = { productId: string | null; size: string | null; base: "CONE" | "CUP" | "WAFFLE"; scoops: string[]; toppings: string[]; qty: number; price: number };
type O = { id: string; number: number; status: "NEW" | "PREPARING" | "READY" | "DONE"; source: "APP" | "KIOSK" | "COUNTER"; total: number; createdAt: string; note: string | null; usedReward: boolean; items: Item[] };
type St = { flavorId: string; level: number; soldOut: boolean };

function beep() {
  try {
    const a = new AudioContext();
    [0, 0.18].forEach((d, i) => { const o = a.createOscillator(), g = a.createGain(); o.frequency.value = i ? 1320 : 880; g.gain.setValueAtTime(0.0001, a.currentTime + d); g.gain.exponentialRampToValueAtTime(0.3, a.currentTime + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + d + 0.16); o.connect(g).connect(a.destination); o.start(a.currentTime + d); o.stop(a.currentTime + d + 0.2); });
  } catch {}
}

export default function KDS({ branch, branches, menu, isOwner }: { branch: B; branches: B[]; menu: MenuT; isOwner: boolean }) {
  const { t, n } = useLang();
  const router = useRouter();
  const { data: orders, reload } = usePoll<O[]>(`/api/staff/orders?branch=${branch.id}`, 2500);
  const { data: stock, reload: reloadStock } = usePoll<St[]>(`/api/staff/stock?branch=${branch.id}`, 8000);
  const M = useMaps(menu);
  const { fl } = M;
  const { data: pstock, reload: reloadP } = usePoll<{ productId: string; soldOut: boolean }[]>(`/api/staff/pstock?branch=${branch.id}`, 10000);
  const pOut = new Set((pstock ?? []).filter((x) => x.soldOut).map((x) => x.productId));
  const toggleP = async (productId: string, soldOut: boolean) => { await fetch("/api/staff/pstock", { method: "POST", body: JSON.stringify({ branchId: branch.id, productId, soldOut }) }); reloadP(); };
  const [now, setNow] = useState(Date.now());
  const [sound, setSound] = useState(false);
  const [counter, setCounter] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => {
    if (!orders) return;
    const ids = new Set(orders.map((o) => o.id));
    if (seen.current && sound && orders.some((o) => o.status === "NEW" && !seen.current!.has(o.id))) beep();
    seen.current = ids;
  }, [orders, sound]);

  const act = async (id: string, to: string) => { await fetch(`/api/staff/orders/${id}`, { method: "POST", body: JSON.stringify({ to }) }); reload(); };
  const toggleOut = async (flavorId: string, soldOut: boolean) => { await fetch("/api/staff/stock", { method: "POST", body: JSON.stringify({ branchId: branch.id, flavorId, soldOut }) }); reloadStock(); };
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/staff/login"); };

  const cols = [
    { st: "NEW", label: t("colNew"), color: "var(--pink)", next: "PREPARING", btn: t("start") },
    { st: "PREPARING", label: t("colPrep"), color: "var(--honey)", next: "READY", btn: t("markReady") },
    { st: "READY", label: t("colReady"), color: "var(--mint)", next: "DONE", btn: t("handOver") },
  ] as const;
  const sm = new Map((stock ?? []).map((s) => [s.flavorId, s]));

  return (
    <div className="min-h-dvh px-4 pb-10">
      <header className="sticky top-0 z-20 -mx-4 mb-4 flex flex-wrap items-center gap-3 px-4 py-3 backdrop-blur-xl" style={{ background: "rgba(255,248,240,.85)" }}>
        <Wordmark />
        <span className="display text-[20px]">· {n(branch)}</span>
        <span className="live-dot" />
        {branches.length > 0 && (
          <div className="flex gap-1.5">{branches.map((b) => <Link key={b.id} href={`/staff?b=${b.slug}`} className="chip" aria-pressed={b.id === branch.id}>{n(b)}</Link>)}</div>
        )}
        <span className="flex-1" />
        <button className="btn btn-ghost py-2.5" onClick={() => setGiftOpen(true)}>🎁 {t("staffGift")}</button>
        <button className="btn btn-pink py-2.5" onClick={() => setCounter(true)}>+ {t("newCounter")}</button>
        <button className="chip" aria-pressed={sound} onClick={() => { setSound(!sound); if (!sound) beep(); }}>{sound ? "🔔" : "🔕"}</button>
        {isOwner && <Link href="/admin" className="chip">{t("dashboard")}</Link>}
        <LangToggle />
        <button className="chip" onClick={logout}>{t("signOut")}</button>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_300px] md:grid-cols-3">
        {cols.map((c) => {
          const list = (orders ?? []).filter((o) => o.status === c.st);
          return (
            <section key={c.st} className="min-w-0">
              <h2 className="mb-3 flex items-center gap-2 text-[16px] font-bold" style={{ color: c.color }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color, boxShadow: `0 0 10px ${c.color}` }} />
                {c.label}<span className="num rounded-full bg-[var(--glass2)] px-2.5 text-[13px] text-[var(--ink)]">{list.length}</span>
              </h2>
              <div className="flex flex-col gap-3">
                {list.length === 0 && <div className="rounded-2xl border border-dashed border-[var(--stroke)] p-6 text-center text-[13px] text-[var(--muted)]">{t("noOrders")}</div>}
                {list.map((o) => {
                  const sec = Math.max(0, Math.floor((now - new Date(o.createdAt).getTime()) / 1000));
                  const late = sec > 300;
                  return (
                    <article key={o.id} className="glass pop overflow-hidden p-3.5" style={{ borderInlineStart: `4px solid ${c.color}` }}>
                      <div className="flex items-center gap-2">
                        <b className="display num text-[30px] leading-none">#{o.number}</b>
                        <span className={`pill ${o.source === "COUNTER" ? "pill-honey" : "pill-pink"}`}>{t(`src_${o.source}`)}</span>
                        {o.usedReward && <span className="pill pill-mint">🎁</span>}
                        <span className={`num ms-auto text-[14px] font-bold ${late ? "text-[var(--danger)]" : "text-[var(--muted)]"}`}>{Math.floor(sec / 60)}:{String(sec % 60).padStart(2, "0")}</span>
                      </div>
                      <div className="mt-2.5 flex flex-col gap-2">
                        {o.items.map((it, i) => (
                          <div key={i} className="flex items-center gap-2.5 rounded-xl bg-[rgba(120,60,20,.04)] p-1.5">
                            <TreatImg spec={lineSpec(it, M)} imageId={lineImage(it, M)} alt="" className="h-14 w-12 shrink-0 rounded-lg" size={160} />
                            <div className="min-w-0 text-[13.5px] leading-snug">
                              <b>{it.qty > 1 ? `${it.qty}× ` : ""}{it.productId ? lineTitle(it, M, n) : t(it.base)}</b>
                              {it.productId ? <div className="text-[12px] text-[var(--muted)]">{lineSub(it, M, n, (b) => t(b))}</div> : <>
                                <div className="flex flex-wrap gap-x-2">{it.scoops.map((id, k) => <span key={k} className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: fl.get(id)?.color }} />{fl.get(id) ? n(fl.get(id)!) : "?"}</span>)}</div>
                                {it.toppings.length > 0 && <div className="text-[12px] text-[var(--muted)]">+ {it.toppings.map((id) => (M.tp.get(id) ? n(M.tp.get(id)!) : "")).join("، ")}</div>}
                              </>}
                            </div>
                          </div>
                        ))}
                        {o.note && <div className="rounded-xl bg-[rgba(255,107,26,.1)] px-2.5 py-1.5 text-[13px] text-[var(--honey)]">📝 {o.note}</div>}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[13px]"><span className="text-[var(--muted)]">💵</span><b className="num">{fmt(o.total)} {t("currency")}</b></div>
                      <div className="mt-3 flex gap-2">
                        <button className="btn flex-1 py-3 text-[#0B1020]" style={{ background: c.color }} onClick={() => act(o.id, c.next)}>{c.btn}</button>
                        <button className="btn btn-ghost px-3 py-3 text-[12px]" onClick={() => act(o.id, "CANCELLED")} aria-label={t("cancel")}>✕</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}

        <aside className="glass h-fit p-4 md:col-span-3 xl:col-span-1">
          <h2 className="mb-2 font-bold">{t("stock")}</h2>
          <div className="grid gap-x-6 md:grid-cols-2 xl:grid-cols-1">
            {menu.flavors.map((f) => {
              const s = sm.get(f.id); const lvl = s?.level ?? 100, out = !!s?.soldOut || lvl <= 0;
              const col = out ? "var(--danger)" : lvl < 20 ? "var(--honey2)" : "var(--mint)";
              return (
                <div key={f.id} className="border-b border-[var(--stroke)] py-2.5 last:border-0">
                  <div className="flex items-center gap-2">
                    <i className="h-3 w-3 rounded-full" style={{ background: f.color }} />
                    <span className={`flex-1 text-[14px] font-semibold ${out ? "text-[var(--muted)] line-through" : ""}`}>{n(f)}</span>
                    {!out && lvl < 20 && <span className="pill pill-honey">{t("low")}</span>}
                    <button className={`chip px-3 py-1 text-[12px] ${out ? "!border-[var(--mint)] !text-[var(--mint)]" : ""}`} onClick={() => toggleOut(f.id, !out)}>{out ? t("restock") : t("markOut")}</button>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(120,60,20,.08)]"><i className="block h-full rounded-full transition-all" style={{ width: `${out ? 0 : lvl}%`, background: col }} /></div>
                </div>
              );
            })}
          </div>
          <h2 className="mb-1 mt-5 font-bold">{t("menu")}</h2>
          <div className="grid gap-x-6 md:grid-cols-2 xl:grid-cols-1">
            {menu.products.map((p) => {
              const out = pOut.has(p.id);
              return (
                <div key={p.id} className="flex items-center gap-2 border-b border-[var(--stroke)] py-2 last:border-0">
                  <TreatImg spec={productSpec(p)} imageId={p.imageId} alt="" className="h-8 w-8 rounded-md" size={100} />
                  <span className={`flex-1 text-[13.5px] font-semibold ${out ? "text-[var(--muted)] line-through" : ""}`}>{n(p)}</span>
                  <button className={`chip px-3 py-1 text-[12px] ${out ? "!border-[var(--mint)] !text-[var(--mint)]" : ""}`} onClick={() => toggleP(p.id, !out)}>{out ? t("restock") : t("markOut")}</button>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {giftOpen && <GiftDesk branchId={branch.id} onClose={() => { setGiftOpen(false); reload(); }} />}
      {counter && <CounterOrder branchId={branch.id} menu={menu} stock={sm} pOut={pOut} onClose={() => { setCounter(false); reload(); }} />}
    </div>
  );
}

function CounterOrder({ branchId, menu, stock, pOut, onClose }: { branchId: string; menu: MenuT; stock: Map<string, St>; pOut: Set<string>; onClose: () => void }) {
  const { t, n } = useLang();
  const [it, setIt] = useState<ItemT>({ base: "CONE", scoops: [], toppings: [], qty: 1 });
  const [items, setItems] = useState<ItemT[]>([]);
  const [prods, setProds] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const all = [...(it.scoops.length ? [...items, it] : items), ...Object.entries(prods).filter(([, q]) => q > 0).map(([productId, qty]) => ({ productId, size: menu.products.find((p) => p.id === productId)?.sizes[0]?.key ?? null, qty }))];
  const send = async () => {
    if (!all.length) return;
    setBusy(true);
    await fetch("/api/orders", { method: "POST", body: JSON.stringify({ branchId, source: "COUNTER", items: all }) });
    setBusy(false); onClose();
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(0,0,0,.6)] p-4" role="dialog" aria-modal="true">
      <div className="glass max-h-[92dvh] w-full max-w-[720px] overflow-auto p-5" style={{ background: "rgba(255,255,255,.97)" }}>
        <div className="mb-4 flex items-center justify-between"><h2 className="display text-[22px]">{t("newCounter")}</h2><button className="chip" onClick={onClose}>✕</button></div>
        <div className="mb-3 flex gap-2">{(["CONE", "CUP", "WAFFLE"] as const).map((b) => <button key={b} className="chip" aria-pressed={it.base === b} onClick={() => setIt({ ...it, base: b })}>{t(b)}</button>)}</div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {menu.flavors.map((f) => {
            const s = stock.get(f.id); const out = !!s?.soldOut || (s?.level ?? 100) <= 0;
            const c = it.scoops.filter((x) => x === f.id).length;
            return (
              <button key={f.id} disabled={out || (it.scoops.length >= 3 && !c)} onClick={() => setIt({ ...it, scoops: [...it.scoops, f.id] })}
                className={`glass relative flex flex-col items-center p-2 text-[12.5px] font-semibold disabled:opacity-35 ${c ? "neon-border" : ""}`}>
                <TreatImg spec={flavorSpec(f)} alt="" className="h-14 w-14" size={160} />{n(f)}
                {c > 0 && <span className="absolute top-1 end-1 grid h-5 w-5 place-items-center rounded-full bg-[var(--honey)] text-[11px] text-white">{c}</span>}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">{menu.toppings.map((x) => <button key={x.id} className="chip" aria-pressed={it.toppings.includes(x.id)} onClick={() => setIt({ ...it, toppings: it.toppings.includes(x.id) ? it.toppings.filter((k) => k !== x.id) : [...it.toppings, x.id] })}>{n(x)}</button>)}</div>
        <h3 className="mb-2 mt-5 font-bold">{t("menu")}</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {menu.products.map((p) => {
            const q = prods[p.id] ?? 0;
            return (
              <div key={p.id} className={`glass flex items-center gap-2 p-2 ${pOut.has(p.id) ? "opacity-35" : ""} ${q ? "neon-border" : ""}`}>
                <TreatImg spec={productSpec(p)} imageId={p.imageId} alt="" className="h-10 w-10 rounded-md" size={120} />
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">{n(p)}</span>
                <button className="h-7 w-7 rounded-full bg-[var(--glass2)]" disabled={!q} onClick={() => setProds({ ...prods, [p.id]: q - 1 })}>−</button>
                <b className="num w-4 text-center text-[13px]">{q}</b>
                <button className="h-7 w-7 rounded-full bg-[var(--honey)] text-white" disabled={pOut.has(p.id)} onClick={() => setProds({ ...prods, [p.id]: q + 1 })}>+</button>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button className="btn btn-ghost" disabled={!it.scoops.length} onClick={() => { setItems([...items, it]); setIt({ base: "CONE", scoops: [], toppings: [], qty: 1 }); }}>+ {t("addToOrder")}</button>
          <button className="chip" onClick={() => setIt({ ...it, scoops: [] })}>↶</button>
          <span className="text-[13px] text-[var(--muted)]">{all.length} ×</span>
          <span className="flex-1" />
          <button className="btn btn-honey" disabled={busy || !all.length} onClick={send}>{t("placeOrder")}</button>
        </div>
      </div>
    </div>
  );
}

type GiftLookup = { kind: "pay" | "redeem" | "used" | "none"; gift?: { fromName: string; toName: string; price: number; base: "CONE" | "CUP" | "WAFFLE"; scoops: { slug: string; color: string; nameAr: string; nameEn: string }[]; toppings: { slug: string }[] } };
function GiftDesk({ branchId, onClose }: { branchId: string; onClose: () => void }) {
  const { t, n } = useLang();
  const [code, setCode] = useState("");
  const [r, setR] = useState<GiftLookup | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const look = async () => { setDone(null); const x = await fetch(`/api/staff/gifts?branch=${branchId}&code=${encodeURIComponent(code.trim().toUpperCase())}`); setR(await x.json()); };
  const go = async () => {
    const x = await fetch("/api/staff/gifts", { method: "POST", body: JSON.stringify({ code: code.trim().toUpperCase(), branchId }) });
    const j = await x.json();
    setDone(x.ok ? (j.kind === "pay" ? "✓ " + t("confirmPay") : `✓ #${j.number}`) : t("notFound")); setR(null);
  };
  const g = r?.gift;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(0,0,0,.6)] p-4" role="dialog" aria-modal="true">
      <div className="glass w-full max-w-[460px] p-5" style={{ background: "rgba(255,255,255,.97)" }}>
        <div className="mb-4 flex items-center justify-between"><h2 className="display text-[22px]">🎁 {t("staffGift")}</h2><button className="chip" onClick={onClose}>✕</button></div>
        <label className="text-[13px] font-semibold" htmlFor="gc">{t("giftCode")}</label>
        <div className="mt-1 flex gap-2">
          <input id="gc" className="input num uppercase tracking-[0.2em]" dir="ltr" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && look()} />
          <button className="btn btn-honey" onClick={look} disabled={code.trim().length < 6}>{t("find")}</button>
        </div>
        {r?.kind === "none" && <p className="mt-3 text-[var(--danger)]">{t("notFound")}</p>}
        {r?.kind === "used" && <p className="mt-3 text-[var(--muted)]">{t("giftUsed")}</p>}
        {g && (r?.kind === "pay" || r?.kind === "redeem") && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[rgba(120,60,20,.05)] p-3">
            <TreatImg spec={{ base: g.base, scoops: g.scoops.map((x) => ({ slug: x.slug, color: x.color })), toppings: g.toppings.map((x) => x.slug) }} alt="" className="h-20 w-16" size={200} />
            <div className="min-w-0 flex-1 text-[14px]">
              <b>{g.scoops.map((x) => n(x)).join(" + ")}</b>
              <div className="text-[12.5px] text-[var(--muted)]">{t(g.base)} · {g.fromName} → {g.toName}</div>
              {r.kind === "pay" && <div className="num font-bold text-[var(--honey)]">💵 {fmt(g.price)} {t("currency")}</div>}
            </div>
          </div>
        )}
        {(r?.kind === "pay" || r?.kind === "redeem") && <button className="btn btn-honey mt-3 w-full" onClick={go}>{r.kind === "pay" ? t("confirmPay") : t("redeemNow")}</button>}
        {done && <p className="mt-3 text-center text-[18px] font-bold text-[var(--mint)]">{done}</p>}
      </div>
    </div>
  );
}
