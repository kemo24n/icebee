"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LangProvider";
import { useCart } from "@/components/Cart";
import TreatImg from "@/components/TreatImg";
import { BranchPicker, type BranchS } from "@/components/BranchPicker";
import { toast, confetti } from "@/components/Toast";
import { type MenuT } from "@/components/spec";
import { useMaps, linePrice, lineSpec, lineTitle, lineSub, lineImage } from "@/components/lines";
import { fmt } from "@/lib/format";

export default function CartView({ menu, branches }: { menu: MenuT; branches: BranchS[] }) {
  const { t, n, lang } = useLang();
  const router = useRouter();
  const cart = useCart();
  const M = useMaps(menu);
  const [phone, setPhone] = useState("");
  const [points, setPoints] = useState(0);
  const [useReward, setUseReward] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { fetch("/api/customer").then((r) => r.json()).then((c) => { if (c.phone) setPhone("0" + String(c.phone).replace(/^963/, "")); setPoints(c.points ?? 0); }).catch(() => {}); }, []);

  const items = cart.items.filter((i) => (typeof i.productId === "string" ? M.pr.has(i.productId) : i.scoops.every((id) => M.fl.has(id))));
  const price = (i: (typeof items)[number]) => linePrice(i, M);
  let total = items.reduce((a, i) => a + price(i), 0);
  if (useReward && items.length) total -= Math.min(...items.map((i) => price(i) / i.qty));

  const place = async () => {
    setErr(null);
    if (!cart.branchId) return;
    setBusy(true);
    const r = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ branchId: cart.branchId, source: "APP", phone: phone ? phone.replace(/\s/g, "") : null, useReward, note: note.trim() || null, items }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      setErr(String(j.error ?? "").startsWith("soldout") ? (lang === "ar" ? "نكهة من طلبك خلصت بهالفرع، غيّرها أو اختار فرع تاني." : "A flavor in your order just sold out at this branch. Change it or pick another branch.")
        : j.error === "invalid" ? (lang === "ar" ? "تأكد من رقم الموبايل (مثال: 0944123456)" : "Check the mobile number (e.g. 0944123456)")
        : (lang === "ar" ? "ما زبط، جرّب مرة تانية." : "That didn’t work, try again."));
      return;
    }
    cart.clear();
    confetti();
    toast(`#${j.number}`);
    router.push(`/order/${j.code}`);
  };

  if (!cart.items.length) {
    return (
      <div className="flex flex-col items-center gap-4 pt-16 text-center">
        <TreatImg spec={{ base: "CUP", scoops: [], toppings: [] }} alt="" className="floaty h-40 w-40" />
        <h1 className="display text-[26px]">{t("yourOrder")}</h1>
        <p className="text-[var(--muted)]">{t("empty")}</p>
        <Link href="/build" className="btn btn-honey">{t("startBuilding")}</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-3">
      <h1 className="display text-[30px]">{t("yourOrder")}</h1>
      <div className="flex flex-col gap-2.5">
        {items.map((it, i) => (
          <div key={i} className="glass rise flex items-center gap-3 p-2.5">
            <TreatImg spec={lineSpec(it, M)} imageId={lineImage(it, M)} alt="" className="h-[78px] w-[70px] shrink-0 rounded-xl" size={240} />
            <div className="min-w-0 flex-1">
              <b className="block truncate text-[14px]">{lineTitle(it, M, n)}</b>
              <span className="block truncate text-[12px] text-[var(--muted)]">{lineSub(it, M, n, (b) => t(b))}</span>
              <span className="num text-[13px] font-bold text-[var(--honey)]">{fmt(price(it))}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center rounded-full bg-[var(--glass2)]">
                <button className="h-8 w-8" onClick={() => cart.setQty(i, it.qty - 1)} aria-label="-">−</button>
                <b className="num w-5 text-center text-[14px]">{it.qty}</b>
                <button className="h-8 w-8" onClick={() => cart.setQty(i, it.qty + 1)} aria-label="+">+</button>
              </div>
              <button className="text-[11.5px] text-[var(--muted)] underline" onClick={() => cart.remove(i)}>{lang === "ar" ? "شيل" : "Remove"}</button>
            </div>
          </div>
        ))}
        <Link href="/build" className="btn btn-ghost">+ {t("startBuilding")}</Link>
      </div>

      <section>
        <h2 className="display mb-2.5 text-[18px]">{t("pickupAt")}</h2>
        <BranchPicker initial={branches} />
      </section>

      <section className="glass p-4">
        <label htmlFor="phone" className="mb-1 block font-semibold">{t("phone")}</label>
        <p className="mb-2.5 text-[12.5px] text-[var(--muted)]">{t("phoneHint")}</p>
        <input id="phone" className="input num" dir="ltr" inputMode="tel" placeholder="09XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <label htmlFor="note" className="mb-1 mt-4 block font-semibold">{lang === "ar" ? "ملاحظة للطلب" : "Note for the order"}</label>
        <input id="note" className="input" maxLength={200} placeholder={lang === "ar" ? "مثلاً: نكهات العلبة، بدون سكر…" : "e.g. tub flavors, no sugar…"} value={note} onChange={(e) => setNote(e.target.value)} />
        {points >= 10 && (
          <label className="mt-3 flex items-center gap-3 rounded-2xl bg-[rgba(255,107,26,.12)] p-3 text-[14px] font-semibold text-[var(--honey)]">
            <input type="checkbox" checked={useReward} onChange={(e) => setUseReward(e.target.checked)} className="h-5 w-5 accent-[var(--honey)]" />
            {t("useReward")}
          </label>
        )}
      </section>

      <div className="glass neon-border p-4">
        <div className="flex items-center justify-between">
          <span className="text-[var(--muted)]">{t("total")}</span>
          <b className="display num text-[28px] text-[var(--honey)]">{fmt(total)} <span className="text-[14px]">{t("currency")}</span></b>
        </div>
        <p className="mt-1 flex items-center gap-2 text-[13px] text-[var(--muted)]">💵 {t("payAtCounter")}</p>
        {err && <p className="mt-3 rounded-xl bg-[rgba(255,90,110,.12)] p-3 text-[13.5px] text-[var(--danger)]">{err}</p>}
        <button className="btn btn-honey mt-4 w-full text-[17px]" disabled={busy || !cart.branchId} onClick={place}>{busy ? t("placing") : t("placeOrder")}</button>
      </div>
    </div>
  );
}
