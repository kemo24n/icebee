"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useLang } from "@/components/LangProvider";
import { confetti } from "@/components/Toast";
import { EVENT_KINDS, EVENT_PKGS } from "@/lib/events";

const Treat3D = dynamic(() => import("@/components/Treat3D"), { ssr: false });

export default function Events() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const [f, setF] = useState({ name: "", phone: "", kind: "school", pkg: "station", date: "", guests: 100, location: "", notes: "" });
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const send = async () => {
    setState("busy");
    const r = await fetch("/api/events", { method: "POST", body: JSON.stringify({ ...f, guests: Number(f.guests) }) });
    if (r.ok) { setState("done"); confetti(); } else setState("error");
  };
  if (state === "done") return (
    <div className="flex flex-col items-center gap-4 pt-16 text-center">
      <div className="text-[64px]">🎉</div>
      <h1 className="display text-[30px]">{ar ? "وصلنا طلبك!" : "We got your request!"}</h1>
      <p className="max-w-[34ch] text-[var(--muted)]">{ar ? "فريق آيس بي رح يتواصل معك على الواتساب خلال ساعات ليأكد التفاصيل والسعر." : "The Ice Bee team will contact you on WhatsApp within hours to confirm details and price."}</p>
    </div>
  );
  return (
    <div className="flex flex-col gap-6 pt-3">
      <section className="glass relative overflow-hidden p-5" style={{ background: "linear-gradient(135deg, #FF6B1A, #E53935)" }}>
        <div className="relative z-10 max-w-[62%] text-white">
          <span className="rounded-full bg-white/20 px-3 py-1 text-[12px] font-bold">{ar ? "آيس بي للمناسبات" : "Ice Bee events"}</span>
          <h1 className="display mt-2 text-[30px] leading-tight">{ar ? "خلّي آيس بي يجي لعندك" : "Bring Ice Bee to your party"}</h1>
          <p className="mt-1 text-[13.5px] opacity-90">{ar ? "مدارس، أعراس، أعياد ميلاد وافتتاحات. احجز بدقيقة." : "Schools, weddings, birthdays and openings. Book in a minute."}</p>
        </div>
        <div className="absolute -bottom-4 end-0 h-[200px] w-[46%]"><Treat3D spec={{ base: "PRODUCT", scoops: [], toppings: [], product: { look: "softserve", color: "#FFFDF6", accent: "#E53935" } }} className="h-full w-full" /></div>
      </section>

      <section>
        <h2 className="display mb-2.5 text-[20px]">{ar ? "شو المناسبة؟" : "What's the occasion?"}</h2>
        <div className="grid grid-cols-3 gap-2">
          {EVENT_KINDS.map((k) => (
            <button key={k.key} onClick={() => setF({ ...f, kind: k.key })} aria-pressed={f.kind === k.key} className={`glass flex flex-col items-center gap-1 p-3 text-[13px] font-bold ${f.kind === k.key ? "neon-border" : ""}`}>
              <span className="text-[26px]">{k.icon}</span>{ar ? k.ar : k.en}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="display mb-2.5 text-[20px]">{ar ? "الباقة" : "Package"}</h2>
        <div className="flex flex-col gap-2">
          {EVENT_PKGS.map((p) => (
            <button key={p.key} onClick={() => setF({ ...f, pkg: p.key })} aria-pressed={f.pkg === p.key} className={`glass flex items-center gap-3 p-4 text-start ${f.pkg === p.key ? "neon-border" : ""}`}>
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${f.pkg === p.key ? "border-[var(--honey)] bg-[var(--honey)]" : "border-[var(--stroke)]"}`}>{f.pkg === p.key && <i className="h-2 w-2 rounded-full bg-white" />}</span>
              <span className="flex-1"><b className="block text-[16px]">{ar ? p.ar : p.en}</b><span className="text-[13px] text-[var(--muted)]">{ar ? p.descAr : p.descEn}</span></span>
              <span className="pill pill-honey">{ar ? `من ${p.from} ضيف` : `${p.from}+ guests`}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="glass flex flex-col gap-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[13px] font-semibold">{ar ? "التاريخ" : "Date"}<input type="date" className="input mt-1" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
          <label className="text-[13px] font-semibold">{ar ? "عدد الضيوف" : "Guests"}<input type="number" min={10} className="input num mt-1" value={f.guests} onChange={(e) => setF({ ...f, guests: Number(e.target.value) })} /></label>
        </div>
        <label className="text-[13px] font-semibold">{ar ? "المكان" : "Location"}<input className="input mt-1" placeholder={ar ? "مثلاً: مدرسة الجيل العربي، الحمدانية" : "e.g. school name, area"} value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[13px] font-semibold">{ar ? "اسمك" : "Your name"}<input className="input mt-1" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label className="text-[13px] font-semibold">{ar ? "رقم الواتساب" : "WhatsApp number"}<input className="input num mt-1" dir="ltr" inputMode="tel" placeholder="09XX XXX XXX" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
        </div>
        <label className="text-[13px] font-semibold">{ar ? "ملاحظات" : "Notes"}<textarea className="input mt-1 min-h-[80px]" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></label>
        {state === "error" && <p className="text-[13px] text-[var(--danger)]">{ar ? "تأكد من التاريخ والرقم وعدد الضيوف (10 أو أكتر)." : "Check the date, number and guests (10 or more)."}</p>}
        <button className="btn btn-honey" disabled={state === "busy" || !f.name || !f.phone || !f.date} onClick={send}>{ar ? "اطلب عرض سعر" : "Request a quote"}</button>
      </section>
    </div>
  );
}
