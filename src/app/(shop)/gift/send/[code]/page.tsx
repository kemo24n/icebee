"use client";
import { use, useEffect, useState } from "react";
import QRCode from "qrcode";
import { useLang } from "@/components/LangProvider";
import { usePoll } from "@/components/usePoll";
import TreatImg from "@/components/TreatImg";
import { toast, confetti } from "@/components/Toast";
import { fmt } from "@/lib/format";

type G = { fromName: string; toName: string; message: string; status: string; price: number; base: "CONE" | "CUP" | "WAFFLE"; scoops: { slug: string; color: string }[]; toppings: { slug: string }[]; payCode: string; redeemCode: string | null };

export default function SendGift({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { t } = useLang();
  const { data: g } = usePoll<G>(`/api/gifts/pay/${code}`, 3000);
  const [qr, setQr] = useState("");
  const [was, setWas] = useState<string | null>(null);
  useEffect(() => { QRCode.toDataURL(code, { margin: 1, width: 300, color: { dark: "#060914", light: "#FFFFFF" } }).then(setQr); }, [code]);
  useEffect(() => { if (g) { if (was === "PENDING" && g.status === "ACTIVE") confetti(); setWas(g.status); } }, [g, was]);
  if (!g) return <div className="shimmer mx-auto mt-16 h-60 w-60 rounded-3xl" />;
  const link = g.redeemCode ? `${location.origin}/gift/${g.redeemCode}` : "";
  const wa = `https://wa.me/?text=${encodeURIComponent(`${t("giftWaMsg", { to: g.toName, from: g.fromName })} ${link}`)}`;
  const spec = { base: g.base, scoops: g.scoops.map((x) => ({ slug: x.slug, color: x.color })), toppings: g.toppings.map((x) => x.slug) };
  return (
    <div className="flex flex-col items-center gap-5 pt-5 text-center">
      <TreatImg spec={spec} alt="" className="floaty h-[150px] w-[130px]" />
      <div className="text-[14px] text-[var(--muted)]">{g.fromName} → <b className="text-[var(--ink)]">{g.toName}</b> · <span className="num">{fmt(g.price)} {t("currency")}</span></div>
      {g.status === "PENDING" ? (
        <div className="glass neon-border flex w-full flex-col items-center gap-3 p-5">
          <h1 className="display text-[24px]">{t("payGiftAt")}</h1>
          <p className="text-[14px] text-[var(--muted)]">{t("showCode")}</p>
          {qr && <img src={qr} alt={code} className="h-40 w-40 rounded-2xl" />}
          <b className="display num neon text-[40px] tracking-[0.2em]" dir="ltr">{code}</b>
          <span className="flex items-center gap-2 text-[13px] text-[var(--muted)]"><span className="live-dot" />{t("waitingPay")}</span>
        </div>
      ) : (
        <div className="glass neon-border flex w-full flex-col items-center gap-3 p-5">
          <h1 className="display text-[26px] text-[var(--mint)]">{t("giftReady")}</h1>
          <a href={wa} target="_blank" rel="noreferrer" className="btn w-full text-white" style={{ background: "#25D366" }}>{t("sendWhatsApp")}</a>
          <button className="btn btn-ghost w-full" onClick={() => { navigator.clipboard?.writeText(link).then(() => toast(t("copied"))).catch(() => {}); }}>{t("copyLink")}</button>
          <code className="w-full break-all rounded-xl bg-[rgba(120,60,20,.05)] p-2 text-[12px]" dir="ltr">{link}</code>
        </div>
      )}
    </div>
  );
}
