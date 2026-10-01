"use client";
import dynamic from "next/dynamic";
import { use, useEffect, useState } from "react";
import QRCode from "qrcode";
import { useLang } from "@/components/LangProvider";
import { usePoll } from "@/components/usePoll";
import { confetti } from "@/components/Toast";

const Treat3D = dynamic(() => import("@/components/Treat3D"), { ssr: false });
type G = { fromName: string; toName: string; message: string; status: string; base: "CONE" | "CUP" | "WAFFLE"; scoops: { slug: string; color: string; nameAr: string; nameEn: string }[]; toppings: { slug: string }[]; redeemCode: string };

export default function Gift({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { t, n } = useLang();
  const { data: g, error } = usePoll<G>(`/api/gifts/r/${code}`, 5000);
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState("");
  useEffect(() => { QRCode.toDataURL(code, { margin: 1, width: 300, color: { dark: "#060914", light: "#FFFFFF" } }).then(setQr); }, [code]);
  if (error === 404) return <p className="pt-24 text-center text-[var(--muted)]">{t("notFound")}</p>;
  if (!g) return <div className="shimmer mx-auto mt-16 h-60 w-60 rounded-3xl" />;
  const spec = { base: g.base, scoops: g.scoops.map((x) => ({ slug: x.slug, color: x.color })), toppings: g.toppings.map((x) => x.slug) };

  if (!open) return (
    <div className="flex flex-col items-center gap-6 pt-14 text-center">
      <span className="pill pill-pink">🎁 {g.fromName}</span>
      <h1 className="display text-[34px]">{g.toName}، <span className="neon">{t("youGotGift")}</span></h1>
      <button onClick={() => { setOpen(true); setTimeout(() => confetti(), 350); navigator.vibrate?.(60); }} className="floaty relative mt-4 h-[200px] w-[200px]" aria-label={t("openGift")}>
        <svg viewBox="0 0 200 200" className="h-full w-full drop-shadow-[0_20px_40px_rgba(229,57,53,.45)]">
          <defs><linearGradient id="bx" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF7BBC" /><stop offset="1" stopColor="#D1306B" /></linearGradient></defs>
          <rect x="30" y="80" width="140" height="105" rx="12" fill="url(#bx)" />
          <rect x="20" y="58" width="160" height="34" rx="10" fill="#FF4FA3" />
          <rect x="88" y="58" width="24" height="127" fill="#FF6B1A" />
          <path d="M100 58c-20-34-56-30-48-8 6 14 36 10 48 8zm0 0c20-34 56-30 48-8-6 14-36 10-48 8z" fill="#FF6B1A" />
        </svg>
      </button>
      <p className="font-semibold text-[var(--muted)]">{t("openGift")} 👆</p>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4 pt-2 text-center">
      <div className="pointer-events-none absolute inset-x-0 top-20 mx-auto h-[320px] w-[320px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(229,57,53,.35), rgba(255,107,26,.18) 60%, transparent 70%)" }} />
      <div className="pop relative h-[340px] w-full"><Treat3D spec={spec} className="h-full w-full" /></div>
      <b className="display text-[22px]">{g.scoops.map((x) => n(x)).join(" + ")}</b>
      {g.message && <blockquote className="glass w-full p-4 text-[16px] leading-relaxed">“{g.message}”<div className="mt-2 text-[13px] text-[var(--pink)]">— {g.fromName}</div></blockquote>}
      {g.status === "REDEEMED" ? <p className="glass w-full p-4 font-semibold text-[var(--mint)]">{t("giftUsed")}</p> : (
        <div className="glass neon-border flex w-full flex-col items-center gap-2 p-4">
          <p className="font-semibold">{t("redeemAt")}</p>
          {qr && <img src={qr} alt={code} className="h-36 w-36 rounded-2xl" />}
          <b className="display num neon text-[34px] tracking-[0.2em]" dir="ltr">{g.redeemCode}</b>
        </div>
      )}
    </div>
  );
}
