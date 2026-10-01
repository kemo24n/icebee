"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang, LangToggle } from "@/components/LangProvider";
import { usePoll } from "@/components/usePoll";
import TreatImg from "@/components/TreatImg";
import { Wordmark } from "@/components/Logo";
import { flavorSpec, productSpec, type FlavorT, type CategoryT, type ProductT } from "@/components/spec";
import MenuEditor from "./MenuEditor";
import { EVENT_KINDS, EVENT_PKGS } from "@/lib/events";
import { fmt, clock } from "@/lib/format";

type Stats = {
  sales: number; orders: number; ySales: number; yOrders: number; avgPrep: number; appShare: number; members: number; hours: number[]; nowHour: number;
  byBranch: { id: string; nameAr: string; nameEn: string; sales: number; orders: number; open: number }[];
  top: { id: string; kind: "flavor" | "product"; slug: string; look: string; accent: string; imageId: string | null; nameAr: string; nameEn: string; color: string; n: number }[];
  live: { id: string; number: number; status: string; source: string; total: number; createdAt: string; branchAr: string; branchEn: string; scoops: { ar: string; en: string; c: string }[] }[];
  lowStock: { branchAr: string; branchEn: string; flavorAr: string; flavorEn: string; color: string; level: number; soldOut: boolean }[];
};
type Alert = { id: string; kind: string; textAr: string; textEn: string; sent: boolean; createdAt: string };
type B = { id: string; slug: string; nameAr: string; nameEn: string };

export default function Dashboard({ branches, flavors, categories, products }: { branches: B[]; flavors: FlavorT[]; categories: (CategoryT & { active: boolean })[]; products: ProductT[] }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "products" | "events" | "screens">("overview");
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/staff/login"); };
  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-16">
      <header className="sticky top-0 z-20 -mx-4 mb-5 flex flex-wrap items-center gap-3 px-4 py-3 backdrop-blur-xl" style={{ background: "rgba(255,248,240,.85)" }}>
        <Wordmark />
        <span className="display text-[18px] text-[var(--muted)]">· {t("dashboard")}</span>
        <nav className="flex gap-1.5">
          {(["overview", "products", "events", "screens"] as const).map((k) => (
            <button key={k} className="chip" aria-pressed={tab === k} onClick={() => setTab(k)}>{k === "overview" ? t("liveOrders") : k === "products" ? t("products") : k === "events" ? (lang === "ar" ? "المناسبات" : "Events") : t("screens")}</button>
          ))}
        </nav>
        <span className="flex-1" />
        <Link href="/staff" className="chip">{lang === "ar" ? "شاشة الفروع" : "Branch screens"}</Link>
        <LangToggle />
        <button className="chip" onClick={logout}>{t("signOut")}</button>
      </header>
      {tab === "overview" && <Overview />}
      {tab === "products" && <MenuEditor categories={categories} products={products} flavorsEditor={<Products initial={flavors} />} />}
      {tab === "events" && <EventsTab />}
      {tab === "screens" && <Screens branches={branches} />}
    </div>
  );
}

function Delta({ now, before }: { now: number; before: number }) {
  if (!before) return <span className="text-[12px] text-[var(--muted)]">—</span>;
  const d = ((now - before) / before) * 100;
  return <span className={`num text-[12.5px] font-semibold ${d >= 0 ? "text-[var(--mint)]" : "text-[var(--danger)]"}`}>{d >= 0 ? "▲" : "▼"} {Math.abs(d).toFixed(0)}%</span>;
}

function Overview() {
  const { t, n, lang } = useLang();
  const { data: s } = usePoll<Stats>("/api/admin/stats", 4000);
  const { data: alerts } = usePoll<Alert[]>("/api/admin/alerts", 6000);
  if (!s) return <div className="grid gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="shimmer h-28 rounded-3xl" />)}</div>;

  // hour chart (10:00 → 02:00 window, ice cream hours)
  const H = [...Array(17)].map((_, i) => (10 + i) % 24);
  const vals = H.map((h) => s.hours[h] / 1000);
  const cur = H.indexOf(s.nowHour);
  const W = 720, Ht = 220, pl = 44, pr = 12, pt = 16, pb = 28;
  const mx = Math.max(500, Math.ceil(Math.max(...vals) / 500) * 500);
  const X = (i: number) => pl + ((W - pl - pr) * i) / (H.length - 1), Y = (v: number) => pt + (Ht - pt - pb) * (1 - v / mx);
  const upto = cur >= 0 ? cur : H.length - 1;
  const line = vals.slice(0, upto + 1).map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${X(upto)} ${Y(0)} L${X(0)} ${Y(0)} Z`;
  const bm = Math.max(1, ...s.byBranch.map((b) => b.sales));
  const tm = Math.max(1, ...s.top.map((x) => x.n));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="glass neon-border col-span-2 p-4 lg:col-span-1">
          <div className="text-[13px] text-[var(--muted)]">{t("salesToday")}</div>
          <div className="display num neon mt-1 text-[30px]">{fmt(s.sales)}</div>
          <div className="flex items-center gap-2"><span className="text-[12px] text-[var(--muted)]">{t("currency")}</span><Delta now={s.sales} before={s.ySales} /></div>
        </div>
        {[
          [t("ordersToday"), fmt(s.orders), <Delta key="d" now={s.orders} before={s.yOrders} />],
          [t("avgPrep"), `${(s.avgPrep / 60).toFixed(1)} ${t("min")}`, null],
          [t("appShare"), `${Math.round(s.appShare * 100)}%`, null],
          [t("members"), fmt(s.members), null],
        ].map(([l, v, d], i) => (
          <div key={i} className="glass p-4">
            <div className="text-[13px] text-[var(--muted)]">{l}</div>
            <div className="display num mt-1 text-[28px]">{v}</div>
            {d}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="glass p-4">
            <h2 className="mb-2 flex items-center gap-2 font-bold">{t("byHour")} <span className="text-[12px] font-medium text-[var(--muted)]">({lang === "ar" ? "ألف ل.س" : "k SYP"})</span><span className="live-dot ms-auto" /></h2>
            <svg viewBox={`0 0 ${W} ${Ht}`} className="w-full" direction="ltr" role="img" aria-label={t("byHour")}>
              <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF6B1A" stopOpacity=".45" /><stop offset="1" stopColor="#FF6B1A" stopOpacity="0" /></linearGradient></defs>
              {[0, 1, 2, 3, 4].map((k) => { const v = (mx * k) / 4; return <g key={k}><line x1={pl} x2={W - pr} y1={Y(v)} y2={Y(v)} stroke="rgba(120,60,20,.07)" /><text x={pl - 8} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="#8E97B6">{fmt(v)}</text></g>; })}
              {H.map((h, i) => i % 2 === 0 && <text key={i} x={X(i)} y={Ht - 8} textAnchor="middle" fontSize="11" fill="#8E97B6">{String(h).padStart(2, "0")}:00</text>)}
              <path d={area} fill="url(#ag)" />
              <path d={line} fill="none" stroke="#FF6B1A" strokeWidth="3" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 6px rgba(255,107,26,.6))" }} />
              <circle cx={X(upto)} cy={Y(vals[upto])} r="6" fill="#FF6B1A" stroke="#FFFFFF" strokeWidth="3" />
            </svg>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="glass p-4">
              <h2 className="mb-3 font-bold">{t("byBranch")}</h2>
              {s.byBranch.map((b) => (
                <div key={b.id} className="mb-3 last:mb-0">
                  <div className="mb-1 flex items-center gap-2 text-[13.5px]"><b>{n(b)}</b><span className="text-[12px] text-[var(--muted)]">{fmt(b.orders)} · {b.open > 0 ? `${b.open} ⏳` : ""}</span><b className="num ms-auto">{(b.sales / 1e6).toFixed(2)}M</b></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[rgba(120,60,20,.07)]"><i className="block h-full rounded-full transition-all duration-700" style={{ width: `${(b.sales / bm) * 100}%`, background: "linear-gradient(90deg,#E53935,#FF6B1A)" }} /></div>
                </div>
              ))}
            </section>
            <section className="glass p-4">
              <h2 className="mb-2 font-bold">{t("topFlavors")}</h2>
              {s.top.map((f, i) => (
                <div key={f.id} className="flex items-center gap-2.5 py-1">
                  <span className="num w-4 text-[13px] font-bold text-[var(--muted)]">{i + 1}</span>
                  <TreatImg spec={f.kind === "flavor" ? flavorSpec({ slug: f.slug, color: f.color }) : productSpec({ look: f.look, color: f.color, accent: f.accent })} imageId={f.imageId} alt="" className="h-9 w-9 rounded-md" size={120} />
                  <span className="flex-1 text-[13.5px] font-semibold">{n(f)}</span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[rgba(120,60,20,.07)]"><i className="block h-full rounded-full" style={{ width: `${(f.n / tm) * 100}%`, background: f.color }} /></div>
                  <span className="num w-10 text-end text-[13px]">{fmt(f.n)}</span>
                </div>
              ))}
            </section>
          </div>

          <section className="glass p-4">
            <h2 className="mb-3 flex items-center gap-2 font-bold">{t("liveOrders")}<span className="live-dot" /></h2>
            <div className="flex flex-col gap-2">
              {s.live.map((o) => (
                <div key={o.id} className="rise flex items-center gap-3 rounded-2xl bg-[rgba(120,60,20,.04)] p-2.5 text-[13.5px]">
                  <b className="display num w-14 text-[18px] text-[var(--honey)]">#{o.number}</b>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{lang === "ar" ? o.branchAr : o.branchEn} · {o.scoops.map((x) => (lang === "ar" ? x.ar : x.en)).join(" + ")}</div>
                    <div className="flex items-center gap-2 text-[12px] text-[var(--muted)]"><span className="flex gap-0.5">{o.scoops.map((x, i) => <i key={i} className="h-2 w-2 rounded-full" style={{ background: x.c }} />)}</span>{clock(o.createdAt)} · {t(`src_${o.source}` as "src_APP")} · {t(`st_${o.status}` as "st_NEW").split("!")[0]}</div>
                  </div>
                  <b className="num">{fmt(o.total)}</b>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          {s.lowStock.length > 0 && (
            <section className="glass p-4">
              <h2 className="mb-2 font-bold">{t("stock")} ⚠️</h2>
              {s.lowStock.map((x, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 text-[13.5px]">
                  <i className="h-2.5 w-2.5 rounded-full" style={{ background: x.color }} />
                  <span className="flex-1">{lang === "ar" ? `${x.flavorAr} · ${x.branchAr}` : `${x.flavorEn} · ${x.branchEn}`}</span>
                  <span className={`pill ${x.soldOut ? "pill-danger" : "pill-honey"}`}>{x.soldOut ? t("markOut") : `${x.level}%`}</span>
                </div>
              ))}
            </section>
          )}
          <section className="overflow-hidden rounded-[28px] border-[6px] border-[#03050B]" style={{ background: "#0B141A" }}>
            <div className="flex items-center gap-3 bg-[#1F2C34] px-4 py-3 text-white">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--honey)] text-[15px] font-black text-white">IB</span>
              <div><b className="block text-[14px]">Ice Bee · {t("alerts")}</b><span className="text-[12px] text-[#8696A0]">WhatsApp</span></div>
            </div>
            <div className="flex max-h-[520px] flex-col-reverse gap-2 overflow-auto p-3" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.035) 1px, transparent 1px)", backgroundSize: "14px 14px" }}>
              {(alerts ?? []).map((a) => (
                <div key={a.id} className="max-w-[92%] self-start whitespace-pre-line rounded-xl bg-[#202C33] px-3 py-2 text-[13px] leading-relaxed text-[#E9EDEF]">
                  {lang === "ar" ? a.textAr : a.textEn}
                  <span className="mt-0.5 block text-end text-[10.5px] text-[#8696A0]">{clock(a.createdAt)} {a.sent ? "✓✓" : "✓"}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Products({ initial }: { initial: FlavorT[] }) {
  const { t, n } = useLang();
  const [list, setList] = useState(initial);
  const [saving, setSaving] = useState<string | null>(null);
  const patch = async (id: string, body: Partial<FlavorT>) => {
    setSaving(id);
    const r = await fetch(`/api/admin/flavors/${id}`, { method: "POST", body: JSON.stringify(body) });
    if (r.ok) { const f = await r.json(); setList((l) => l.map((x) => (x.id === id ? { ...x, ...f, dropEndsAt: x.dropEndsAt } : x))); }
    setSaving(null);
  };
  const upload = async (id: string, file: File) => {
    setSaving(id);
    const fd = new FormData(); fd.append("file", file); fd.append("flavorId", id);
    const r = await fetch("/api/admin/images", { method: "POST", body: fd });
    if (r.ok) { const { id: imageId } = await r.json(); setList((l) => l.map((x) => (x.id === id ? { ...x, imageId } : x))); }
    setSaving(null);
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((f) => (
        <div key={f.id} className={`glass flex gap-3 p-3 ${f.active ? "" : "opacity-55"}`}>
          <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-2xl bg-[rgba(120,60,20,.04)]">
            <TreatImg spec={flavorSpec(f)} imageId={f.imageId} alt={n(f)} className="h-full w-full" size={260} />
            <label className="absolute inset-x-1 bottom-1 cursor-pointer rounded-lg bg-[rgba(255,248,240,.75)] py-1 text-center text-[11px] font-semibold">
              {t("upload")}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(f.id, e.target.files[0])} />
            </label>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><b className="truncate">{n(f)}</b>{saving === f.id && <span className="live-dot" />}</div>
            <label className="mt-2 block text-[12px] text-[var(--muted)]" htmlFor={`p-${f.id}`}>{t("price")} ({t("currency")})</label>
            <input id={`p-${f.id}`} className="input num mt-1 py-2 text-[15px]" dir="ltr" inputMode="numeric" defaultValue={f.price}
              onBlur={(e) => { const v = parseInt(e.target.value.replace(/\D/g, ""), 10); if (v >= 0 && v !== f.price) patch(f.id, { price: v }); }} />
            <div className="mt-2 flex items-center gap-2">
              <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={f.active !== false} onChange={(e) => patch(f.id, { active: e.target.checked })} className="h-4 w-4 accent-[var(--honey)]" />{t("active")}</label>
              <input type="color" value={f.color} aria-label="color" className="ms-auto h-7 w-9 cursor-pointer rounded border-0 bg-transparent" onChange={(e) => setList((l) => l.map((x) => (x.id === f.id ? { ...x, color: e.target.value } : x)))} onBlur={(e) => patch(f.id, { color: e.target.value })} />
              {f.imageId && <button className="chip px-2 py-1 text-[11px]" onClick={() => patch(f.id, { imageId: null })}>3D</button>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Screens({ branches }: { branches: B[] }) {
  const { n, lang } = useLang();
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {branches.map((b) => (
        <div key={b.id} className="glass flex flex-col gap-3 p-4">
          <b className="display text-[20px]">{n(b)}</b>
          <div className="flex flex-wrap gap-2">
            <Link href={`/screen/${b.slug}/menu`} target="_blank" className="btn btn-ghost">{lang === "ar" ? "شاشة المنيو" : "Menu screen"} ↗</Link>
            <Link href={`/screen/${b.slug}/orders`} target="_blank" className="btn btn-ghost">{lang === "ar" ? "شاشة الطلبات" : "Order screen"} ↗</Link>
            <Link href={`/kiosk/${b.slug}`} target="_blank" className="btn btn-ghost">{lang === "ar" ? "الكشك" : "Kiosk"} ↗</Link>
            <Link href={`/staff?b=${b.slug}`} className="btn btn-ghost">{lang === "ar" ? "شاشة الموظفين" : "Staff screen"}</Link>
          </div>
        </div>
      ))}
    </div>
  );
}

type Ev = { id: string; name: string; phone: string; kind: string; pkg: string; date: string; guests: number; location: string; notes: string; status: "NEW" | "CONFIRMED" | "DONE" | "DECLINED" };
function EventsTab() {
  const { lang } = useLang(); const ar = lang === "ar";
  const { data, reload } = usePoll<Ev[]>("/api/admin/events", 8000);
  const set = async (id: string, status: Ev["status"]) => { await fetch(`/api/admin/events/${id}`, { method: "POST", body: JSON.stringify({ status }) }); reload(); };
  const K = Object.fromEntries(EVENT_KINDS.map((k) => [k.key, k])), P = Object.fromEntries(EVENT_PKGS.map((k) => [k.key, k]));
  const label = { NEW: ar ? "جديد" : "New", CONFIRMED: ar ? "مؤكد" : "Confirmed", DONE: ar ? "تم" : "Done", DECLINED: ar ? "مرفوض" : "Declined" };
  const pill = { NEW: "pill-pink", CONFIRMED: "pill-honey", DONE: "pill-mint", DECLINED: "pill-danger" };
  if (!data) return <div className="shimmer h-40 rounded-3xl" />;
  if (!data.length) return <p className="text-[var(--muted)]">{ar ? "ما في طلبات مناسبات بعد. شارك رابط /events مع الزبائن." : "No event requests yet. Share the /events link with customers."}</p>;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {data.map((e) => (
        <div key={e.id} className="glass flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <span className="text-[26px]">{K[e.kind]?.icon}</span>
            <b className="flex-1">{ar ? K[e.kind]?.ar : K[e.kind]?.en} · {ar ? P[e.pkg]?.ar : P[e.pkg]?.en}</b>
            <span className={`pill ${pill[e.status]}`}>{label[e.status]}</span>
          </div>
          <div className="num text-[14px]">📅 {new Date(e.date).toLocaleDateString(ar ? "ar-SY" : "en-GB", { weekday: "long", day: "numeric", month: "long" })} · 👥 {e.guests}</div>
          <div className="text-[14px]">{e.name} · <span className="num" dir="ltr">+{e.phone}</span>{e.location && <> · 📍 {e.location}</>}</div>
          {e.notes && <div className="rounded-xl bg-[var(--glass2)] p-2 text-[13px]">{e.notes}</div>}
          <div className="mt-1 flex flex-wrap gap-2">
            <a className="btn py-2 text-[13px] text-white" style={{ background: "#25D366" }} href={`https://wa.me/${e.phone}`} target="_blank" rel="noreferrer">WhatsApp</a>
            {e.status === "NEW" && <button className="btn btn-honey py-2 text-[13px]" onClick={() => set(e.id, "CONFIRMED")}>{ar ? "تأكيد" : "Confirm"}</button>}
            {e.status === "CONFIRMED" && <button className="btn btn-ghost py-2 text-[13px]" onClick={() => set(e.id, "DONE")}>{ar ? "تمت" : "Mark done"}</button>}
            {e.status === "NEW" && <button className="btn btn-ghost py-2 text-[13px]" onClick={() => set(e.id, "DECLINED")}>{ar ? "رفض" : "Decline"}</button>}
          </div>
        </div>
      ))}
    </div>
  );
}
