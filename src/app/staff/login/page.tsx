"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang, LangToggle } from "@/components/LangProvider";
import { Wordmark } from "@/components/Logo";

export default function Login() {
  const { t } = useLang();
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (p = pin) => {
    setBusy(true); setErr(false);
    const r = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify({ pin: p }) });
    setBusy(false);
    if (!r.ok) { setErr(true); setPin(""); navigator.vibrate?.(200); return; }
    const j = await r.json();
    const next = new URLSearchParams(location.search).get("next");
    router.replace(next || (j.role === "OWNER" ? "/admin" : "/staff"));
  };
  const press = (d: string) => { if (busy) return; const p = (pin + d).slice(0, 8); setPin(p); setErr(false); if (p.length === 4) submit(p); };
  return (
    <main className="mx-auto flex min-h-dvh max-w-[380px] flex-col items-center justify-center gap-7 px-4 py-10">
      <div className="flex w-full items-center justify-between"><Wordmark /><LangToggle /></div>
      <div className="text-center">
        <h1 className="display text-[28px]">{t("staffLogin")}</h1>
        <p className="mt-1 text-[var(--muted)]">{t("pin")}</p>
      </div>
      <div className={`flex gap-3 ${err ? "animate-[shake_.3s]" : ""}`} dir="ltr">
        {[0, 1, 2, 3].map((i) => <span key={i} className="h-4 w-4 rounded-full transition" style={{ background: i < pin.length ? "var(--honey)" : "rgba(120,60,20,.15)", boxShadow: i < pin.length ? "0 0 12px var(--honey)" : undefined }} />)}
      </div>
      <p className="h-5 text-[14px] text-[var(--danger)]" aria-live="polite">{err ? t("wrongPin") : ""}</p>
      <div className="grid w-full grid-cols-3 gap-3" dir="ltr">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) => k === "" ? <span key={i} /> : (
          <button key={i} onClick={() => (k === "⌫" ? setPin(pin.slice(0, -1)) : press(k))} className="glass display num h-[72px] text-[26px] active:scale-95">{k}</button>
        ))}
      </div>
    </main>
  );
}
