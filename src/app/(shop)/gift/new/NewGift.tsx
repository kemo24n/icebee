"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LangProvider";
import TreatImg from "@/components/TreatImg";
import { toSpec, type FlavorT, type ToppingT } from "@/components/spec";
import { fmt } from "@/lib/format";
import { itemPrice } from "@/lib/pricing";

type It = { base: "CONE" | "CUP" | "WAFFLE"; scoops: string[]; toppings: string[] };
export default function NewGift({ menu }: { menu: { flavors: FlavorT[]; toppings: ToppingT[] } }) {
  const { t, n } = useLang();
  const router = useRouter();
  const fl = useMemo(() => new Map(menu.flavors.map((f) => [f.id, f])), [menu]);
  const tp = useMemo(() => new Map(menu.toppings.map((x) => [x.id, x])), [menu]);
  const [it, setIt] = useState<It | null>(null);
  const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    try { const v = sessionStorage.getItem("ib_gift_item"); if (v) { setIt(JSON.parse(v)); return; } } catch {}
    const p = fl.get(menu.flavors.find((f) => f.slug === "pistachio")?.id ?? "")!;
    setIt({ base: "CUP", scoops: p ? [p.id, p.id] : [], toppings: [] });
  }, [fl, menu.flavors]);
  if (!it) return null;
  const price = itemPrice({ ...it, qty: 1 }, (id) => fl.get(id)?.price ?? 0, (id) => tp.get(id)?.price ?? 0);
  const submit = async () => {
    setBusy(true);
    const r = await fetch("/api/gifts", { method: "POST", body: JSON.stringify({ fromName: from, toName: to, message: msg, item: it }) });
    setBusy(false);
    if (r.ok) { const j = await r.json(); router.push(`/gift/send/${j.payCode}`); }
  };
  return (
    <div className="flex flex-col gap-5 pt-3">
      <div>
        <span className="pill pill-pink">🎁 {t("gift")}</span>
        <h1 className="display mt-2 text-[30px]">{t("giftTitle")}</h1>
        <p className="mt-1 text-[14px] text-[var(--muted)]">{t("giftSub")}</p>
      </div>
      <div className="glass neon-border relative flex items-center gap-4 overflow-hidden p-4" style={{ background: "linear-gradient(135deg, rgba(229,57,53,.18), rgba(255,107,26,.08))" }}>
        <TreatImg spec={toSpec(it, fl, tp)} alt="" className="floaty h-[130px] w-[110px] shrink-0" />
        <div className="min-w-0">
          <b className="block">{it.scoops.map((id) => (fl.get(id) ? n(fl.get(id)!) : "")).join(" + ")}</b>
          <span className="text-[13px] text-[var(--muted)]">{t(it.base)}</span>
          <div className="num mt-1 font-bold text-[var(--honey)]">{fmt(price)} {t("currency")}</div>
          <Link href="/build" className="mt-2 inline-block text-[13px] underline">{t("build")}</Link>
        </div>
      </div>
      <div className="glass flex flex-col gap-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[13px] font-semibold">{t("fromName")}<input className="input mt-1" value={from} maxLength={40} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="text-[13px] font-semibold">{t("toName")}<input className="input mt-1" value={to} maxLength={40} onChange={(e) => setTo(e.target.value)} /></label>
        </div>
        <label className="text-[13px] font-semibold">{t("giftMsg")}<textarea className="input mt-1 min-h-[96px]" maxLength={240} value={msg} onChange={(e) => setMsg(e.target.value)} /></label>
        <button className="btn btn-pink mt-1" disabled={busy || !from.trim() || !to.trim()} onClick={submit}>{t("createGift")}</button>
      </div>
    </div>
  );
}
