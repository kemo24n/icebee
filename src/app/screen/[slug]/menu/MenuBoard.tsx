"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useLang } from "@/components/LangProvider";
import { usePoll } from "@/components/usePoll";
import { Wordmark } from "@/components/Logo";
import { productSpec, type MenuT } from "@/components/spec";
import { fmt } from "@/lib/format";

const Treat3D = dynamic(() => import("@/components/Treat3D"), { ssr: false });
type D = { branch: { nameAr: string; nameEn: string }; menu: MenuT };

export default function MenuBoard({ slug, appUrl }: { slug: string; appUrl: string }) {
  const { t, n, lang } = useLang();
  const { data } = usePoll<D>(`/api/screen/${slug}`, 10000);
  const [i, setI] = useState(0);
  const [qr, setQr] = useState("");
  useEffect(() => { const id = setInterval(() => setI((x) => x + 1), 5000); return () => clearInterval(id); }, []);
  useEffect(() => { QRCode.toDataURL(appUrl, { margin: 1, width: 360, color: { dark: "#2B1A10", light: "#FFFFFF" } }).then(setQr); }, [appUrl]);
  if (!data) return <div className="h-dvh" />;
  const cats = data.menu.categories;
  const page = cats[Math.floor(i / 3) % Math.max(1, cats.length)];
  const rows = page?.isBuilder
    ? data.menu.flavors.map((x) => ({ id: x.id, name: n(x), color: x.color, price: x.price, soldOut: !!x.soldOut, tag: x.tag, desc: lang === "ar" ? x.descAr : x.descEn, spec: { base: "CONE" as const, scoops: [{ slug: x.slug, color: x.color }, { slug: x.slug, color: x.color }], toppings: x.slug === "pistachio" ? ["crushed-pistachio"] : x.slug === "dark-chocolate" ? ["chocolate-drizzle"] : ["honey-drizzle"] } }))
    : data.menu.products.filter((p) => p.categoryId === page?.id).map((x) => ({ id: x.id, name: n(x), color: x.color, price: x.price, soldOut: !!x.soldOut, tag: x.tag, desc: lang === "ar" ? x.descAr : x.descEn, spec: productSpec(x) }));
  const avail = rows.filter((r) => !r.soldOut);
  const f = avail[i % Math.max(1, avail.length)];
  const spec = f?.spec ?? null;

  return (
    <div className="relative grid h-dvh grid-cols-[1.1fr_1fr] overflow-hidden" style={{ background: "radial-gradient(60% 70% at 25% 50%, rgba(255,107,26,.22), transparent 60%), radial-gradient(40% 50% at 90% 10%, rgba(229,57,53,.18), transparent 60%), #FFF6EC" }}>
      <div className="relative flex flex-col items-center justify-center px-[4vw] pt-[8vh] pb-[9vh]">
        <div className="absolute top-[4vh] start-[3vw] scale-125"><Wordmark /></div>
        <div className="eyebrow text-[1.4vw] !text-[var(--honey)]">{t("flavorOfMoment")}</div>
        <div className="h-[46vh] w-full">{spec && <Treat3D key={f!.id} spec={spec} className="h-full w-full" />}</div>
        {f && <h1 className="display text-center text-[4.2vw]">{f.name}</h1>}
        {f && <p className="text-[1.5vw] text-[var(--muted)]">{f.desc}</p>}
        <div className="mt-[2.5vh] flex items-center gap-[1vw]">
          {qr && <img src={qr} alt="QR" className="h-[14vh] w-[14vh] rounded-xl" />}
          <div className="text-[1.3vw] font-semibold">{t("scanToOrder")}<div className="text-[1vw] text-[var(--muted)]">{n(data.branch)}</div></div>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-[1vh] pt-[4vh] pb-[9vh] pe-[4vw]">
        <h2 className="display neon text-[3.2vw]">{page?.icon} {page ? n(page) : t("menu")}</h2>
        <div className="mb-[1vh] flex gap-[0.6vw]">{cats.map((c) => <i key={c.id} className="h-[0.6vh] flex-1 rounded-full" style={{ background: c.id === page?.id ? "var(--honey)" : "rgba(120,60,20,.12)" }} />)}</div>
        {rows.map((x) => (
          <div key={x.id} className={`flex items-center gap-[1vw] border-b border-dashed border-[var(--stroke)] pb-[0.6vh] text-[1.55vw] font-semibold transition ${x.soldOut ? "line-through opacity-35" : ""} ${f?.id === x.id ? "text-[var(--honey)]" : ""}`}>
            <i className="h-[1.3vw] w-[1.3vw] rounded-full" style={{ background: x.color, boxShadow: f?.id === x.id ? `0 0 16px ${x.color}` : undefined }} />
            {x.name}
            {x.tag === "drop" && <span className="pill pill-pink text-[1vw]">{t("dropTitle")}</span>}
            <span className="num ms-auto">{x.soldOut ? t("soldOut") : fmt(x.price)}</span>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 overflow-hidden bg-[var(--honey)] py-[1vh] text-[1.5vw] font-bold whitespace-nowrap text-[#FFFFFF]">
        <div className="inline-block" style={{ animation: `${lang === "ar" ? "marquee-rtl" : "marquee"} 40s linear infinite` }}>
          {Array.from({ length: 4 }).map((_, k) => <span key={k} className="px-[3vw]">{t("ticker")}</span>)}
        </div>
      </div>
    </div>
  );
}
