"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang, LangToggle } from "./LangProvider";
import { Wordmark } from "./Logo";
import { useCart } from "./Cart";

const I = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  build: <><circle cx="12" cy="8" r="5" /><path d="M7.5 11 12 22l4.5-11" /></>,
  hive: <><path d="M12 2l8.5 5v10L12 22l-8.5-5V7z" /><path d="M12 8l3.5 2v4L12 16l-3.5-2v-4z" /></>,
  cart: <><path d="M5 7h14l-1.5 12h-11z" /><path d="M9 7a3 3 0 0 1 6 0" /></>,
};

export function ShopHeader() {
  const { t } = useLang();
  return (
    <header className="sticky top-0 z-30 px-4 pt-[max(env(safe-area-inset-top),10px)] pb-2.5 backdrop-blur-xl" style={{ background: "linear-gradient(to bottom, rgba(255,248,240,.92), rgba(255,248,240,.6))" }}>
      <div className="mx-auto flex max-w-[560px] items-center gap-3">
        <Link href="/" aria-label={t("brand")}><Wordmark /></Link>
        <span className="flex-1" />
        <LangToggle />
      </div>
    </header>
  );
}

export function BottomNav() {
  const { t } = useLang();
  const path = usePathname();
  const { count } = useCart();
  const tabs = [
    { href: "/", k: "home" as const, label: t("home") },
    { href: "/build", k: "build" as const, label: t("build") },
    { href: "/cart", k: "cart" as const, label: t("yourOrder") },
    { href: "/hive", k: "hive" as const, label: t("hive") },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),10px)]">
      <div className="glass mx-auto grid max-w-[520px] grid-cols-4 rounded-[26px] p-1.5" style={{ background: "rgba(255,255,255,.82)" }}>
        {tabs.map((x) => {
          const on = x.href === "/" ? path === "/" : path.startsWith(x.href);
          return (
            <Link key={x.href} href={x.href} className={`relative flex flex-col items-center gap-0.5 rounded-[20px] py-2 text-[11.5px] font-semibold transition ${on ? "bg-[var(--honey)] text-[#FFFFFF]" : "text-[var(--muted)]"}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{I[x.k]}</svg>
              {x.label}
              {x.k === "cart" && count > 0 && <span className="pop absolute top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--pink)] px-1 text-[11px] text-white" style={{ insetInlineEnd: "22%" }}>{count}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
