"use client";
import { createContext, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";
import { tr, type Lang, type Key, nameOf } from "@/lib/i18n";

type Ctx = { lang: Lang; t: (k: Key, v?: Record<string, string | number>) => string; n: (o: { nameAr: string; nameEn: string }) => string; toggle: () => void };
const C = createContext<Ctx | null>(null);

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const router = useRouter();
  const toggle = useCallback(async () => {
    const next = lang === "ar" ? "en" : "ar";
    await fetch("/api/lang", { method: "POST", body: JSON.stringify({ lang: next }) });
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    router.refresh();
  }, [lang, router]);
  return <C.Provider value={{ lang, t: (k, v) => tr(lang, k, v), n: (o) => nameOf(lang, o), toggle }}>{children}</C.Provider>;
}
export function useLang() {
  const c = useContext(C);
  if (!c) throw new Error("LangProvider missing");
  return c;
}
export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, toggle } = useLang();
  return (
    <button onClick={toggle} className={`chip ${className}`} aria-label="Change language">
      {lang === "ar" ? "EN" : "ع"}
    </button>
  );
}
