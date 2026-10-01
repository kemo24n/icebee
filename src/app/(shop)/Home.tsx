"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useLang } from "@/components/LangProvider";
import { useCart } from "@/components/Cart";
import { usePoll } from "@/components/usePoll";
import TreatImg from "@/components/TreatImg";
import { Countdown } from "@/components/Countdown";
import { BranchPicker, type BranchS } from "@/components/BranchPicker";
import { flavorSpec, productSpec, type FlavorT, type MenuT, type ProductT } from "@/components/spec";
import { ProductSheet } from "@/components/ProductSheet";
import { fmt } from "@/lib/format";

const Treat3D = dynamic(() => import("@/components/Treat3D"), { ssr: false, loading: () => <div className="h-full w-full" /> });

export default function Home({ menu, branches }: { menu: MenuT; branches: BranchS[] }) {
  const { t, n, lang } = useLang();
  const { branchId } = useCart();
  const { data } = usePoll<MenuT>(branchId ? `/api/menu?branch=${branchId}` : null, 15000);
  const m = data ?? menu;
  const flavors = m.flavors;
  const [cat, setCat] = useState<string | null>(null);
  const [sheet, setSheet] = useState<ProductT | null>(null);
  const activeCat = cat ?? m.categories[0]?.id;
  const drop = flavors.find((f) => f.tag === "drop" && f.dropEndsAt);
  const hero = useMemo(() => {
    const by = (s: string) => flavors.find((f) => f.slug === s);
    const sc = ["vanilla", "chocolate", "cherry"].map(by).filter(Boolean) as FlavorT[];
    return { base: "CONE" as const, scoops: sc.map((f) => ({ slug: f.slug, color: f.color })), toppings: ["honey-drizzle"] };
  }, [flavors]);

  return (
    <div className="flex flex-col gap-7 pt-2">
      {/* HERO */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-6 mx-auto h-[300px] w-[300px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(255,107,26,.38), rgba(229,57,53,.18) 55%, transparent 70%)" }} />
        <div className="relative h-[360px] cursor-grab active:cursor-grabbing">
          <Treat3D spec={hero} className="h-full w-full" />
          <span className="chip pointer-events-none absolute bottom-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 text-[12px]" style={{ background: "rgba(255,248,240,.6)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" /><path d="M18 3v4h-4M6 21v-4h4" /></svg>
            {t("dragToSpin")}
          </span>
        </div>
        <h1 className="display mt-1 whitespace-pre-line text-[44px]">
          {t("heroTitle").split("\n").map((l, i) => <span key={i} className={i ? "neon block" : "block"}>{l}</span>)}
        </h1>
        <p className="mt-3 max-w-[40ch] text-[15px] text-[var(--muted)]">{t("heroSub")}</p>
        <div className="mt-5 flex gap-2.5">
          <Link href="/build" className="btn btn-honey flex-1">{t("startBuilding")}</Link>
          <Link href="#menu" className="btn btn-ghost">{t("menu")}</Link>
        </div>
      </section>

      {/* DROP */}
      {drop && (
        <section className="glass neon-border relative overflow-hidden p-4" style={{ background: "linear-gradient(135deg, rgba(229,57,53,.2), rgba(255,107,26,.08) 60%, rgba(255,255,255,.6))" }}>
          <div className="flex items-center gap-4">
            <TreatImg spec={{ base: "CUP", scoops: [{ slug: drop.slug, color: drop.color }, { slug: drop.slug, color: drop.color }], toppings: ["honey-drizzle"] }} imageId={drop.imageId} alt={n(drop)} className="floaty h-[120px] w-[110px] shrink-0" />
            <div className="min-w-0">
              <span className="pill pill-pink">● {t("dropTitle")}</span>
              <h2 className="display neon-pink mt-1.5 text-[28px]">{n(drop)}</h2>
              <p className="text-[13px] text-[var(--muted)]">{lang === "ar" ? drop.descAr : drop.descEn}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div><div className="eyebrow mb-1.5">{t("endsIn")}</div><Countdown to={drop.dropEndsAt!} /></div>
            <Link href={`/build?f=${drop.id}`} className="btn btn-pink">{t("startBuilding")}</Link>
          </div>
        </section>
      )}

      {/* VOTE + GIFT */}
      <section className="grid grid-cols-2 gap-3">
        <Link href="/vote" className="glass relative flex min-h-[150px] flex-col justify-end overflow-hidden p-4" style={{ background: "linear-gradient(160deg, rgba(255,107,26,.22), rgba(255,255,255,.4))" }}>
          <span className="absolute top-3 end-3 text-[34px]">🗳</span>
          <b className="display text-[19px] leading-tight">{t("voteTitle")}</b>
          <span className="mt-1 text-[12px] text-[var(--muted)]">{t("vote")} →</span>
        </Link>
        <Link href="/gift/new" className="glass relative flex min-h-[150px] flex-col justify-end overflow-hidden p-4" style={{ background: "linear-gradient(160deg, rgba(229,57,53,.25), rgba(255,255,255,.4))" }}>
          <span className="absolute top-3 end-3 text-[34px]">🎁</span>
          <b className="display text-[19px] leading-tight">{t("sendGift")}</b>
          <span className="mt-1 text-[12px] text-[var(--muted)]">WhatsApp →</span>
        </Link>
      </section>

      <Link href="/events" className="glass flex items-center gap-4 overflow-hidden p-4" style={{ background: "linear-gradient(120deg, rgba(255,107,26,.16), rgba(255,199,44,.18))" }}>
        <span className="text-[40px]">🎉</span>
        <span className="flex-1"><b className="display block text-[19px]">{lang === "ar" ? "آيس بي لمناسبتك" : "Ice Bee at your event"}</b><span className="text-[13px] text-[var(--muted)]">{lang === "ar" ? "مدارس، أعراس، افتتاحات… احجز عربة السوفت آيس" : "Schools, weddings, openings… book the soft ice cart"}</span></span>
        <span className="text-[22px] text-[var(--honey)]">{lang === "ar" ? "←" : "→"}</span>
      </Link>

      {/* BRANCHES */}
      <section>
        <div className="mb-3 flex items-center gap-2"><h2 className="display text-[22px]">{t("branches")}</h2><span className="live-dot ms-1" /><span className="text-[12px] font-semibold text-[var(--mint)]">{t("liveOrders")}</span></div>
        <BranchPicker initial={branches} />
      </section>

      {/* MENU */}
      <section id="menu" className="scroll-mt-20">
        <h2 className="display mb-3 text-[22px]">{t("menu")}</h2>
        <div className="no-scrollbar sticky top-[60px] z-20 -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 py-2 backdrop-blur-xl" style={{ background: "rgba(255,248,240,.7)" }}>
          {m.categories.map((c) => (
            <button key={c.id} className="chip shrink-0 py-2 text-[14px]" aria-pressed={c.id === activeCat} onClick={() => setCat(c.id)}>
              <span aria-hidden>{c.icon}</span>{n(c)}
            </button>
          ))}
        </div>
        {m.categories.filter((c) => c.id === activeCat).map((c) => c.isBuilder ? (
          <div key={c.id} className="grid grid-cols-2 gap-3">
            {flavors.filter((f) => f.tag !== "drop").map((f, i) => (
              <Link key={f.id} href={f.soldOut ? "#menu" : `/build?f=${f.id}`} aria-disabled={f.soldOut}
                className={`glass rise group relative flex flex-col overflow-hidden p-3 ${f.soldOut ? "opacity-45 grayscale" : ""}`} style={{ animationDelay: `${i * 40}ms` }}>
                <div className="relative mx-auto mb-2 grid h-[118px] w-full place-items-center">
                  <div className="absolute h-[96px] w-[96px] rounded-full blur-2xl transition group-hover:scale-110" style={{ background: f.color, opacity: 0.35 }} />
                  <TreatImg spec={flavorSpec(f)} imageId={f.imageId} alt={n(f)} className="relative h-[118px] w-[118px] transition duration-300 group-hover:-translate-y-1 group-hover:scale-105" size={300} />
                </div>
                {f.tag === "signature" && <span className="pill pill-honey absolute top-2.5 start-2.5">{t("signature")}</span>}
                {f.tag === "new" && <span className="pill pill-pink absolute top-2.5 start-2.5">{t("newTag")}</span>}
                <b className="text-[15px] leading-tight">{n(f)}</b>
                <span className="mt-0.5 line-clamp-1 text-[12px] text-[var(--muted)]">{f.soldOut ? t("soldOut") : lang === "ar" ? f.descAr : f.descEn}</span>
                <span className="num mt-2 text-[13px] font-bold text-[var(--honey)]">{fmt(f.price)} <span className="text-[11px] font-medium text-[var(--muted)]">{t("currency")} · {t("perScoop")}</span></span>
              </Link>
            ))}
          </div>
        ) : (
          <div key={c.id} className="grid grid-cols-2 gap-3">
            {m.products.filter((p) => p.categoryId === c.id).map((p, i) => (
              <button key={p.id} onClick={() => setSheet(p)} disabled={p.soldOut}
                className={`glass rise group relative flex flex-col overflow-hidden p-3 text-start ${p.soldOut ? "opacity-45 grayscale" : ""}`} style={{ animationDelay: `${i * 40}ms` }}>
                <div className="relative mx-auto mb-2 grid h-[130px] w-full place-items-center">
                  <div className="absolute h-[96px] w-[96px] rounded-full blur-2xl transition group-hover:scale-110" style={{ background: p.color, opacity: 0.32 }} />
                  <TreatImg spec={productSpec(p)} imageId={p.imageId} alt={n(p)} className={`relative h-[130px] ${p.imageId ? "w-full rounded-2xl" : "w-[130px]"} transition duration-300 group-hover:-translate-y-1 group-hover:scale-105`} size={300} />
                </div>
                {p.tag === "signature" && <span className="pill pill-honey absolute top-2.5 start-2.5">{t("signature")}</span>}
                {p.tag === "new" && <span className="pill pill-pink absolute top-2.5 start-2.5">{t("newTag")}</span>}
                <b className="text-[15px] leading-tight">{n(p)}</b>
                <span className="mt-0.5 line-clamp-1 text-[12px] text-[var(--muted)]">{p.soldOut ? t("soldOut") : (lang === "ar" ? p.descAr : p.descEn) || "\u00a0"}</span>
                <span className="mt-2 flex items-center justify-between">
                  <span className="num text-[13px] font-bold text-[var(--honey)]">{fmt(p.price)} <span className="text-[11px] font-medium text-[var(--muted)]">{t("currency")}</span></span>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--honey)] text-[18px] font-bold text-[#FFFFFF]">+</span>
                </span>
              </button>
            ))}
          </div>
        ))}
      </section>
      {sheet && <ProductSheet p={sheet} onClose={() => setSheet(null)} />}
    </div>
  );
}
