"use client";
import { useLang } from "./LangProvider";
import { useCart } from "./Cart";
import { usePoll } from "./usePoll";
import { useEffect } from "react";

export type BranchS = { id: string; slug: string; nameAr: string; nameEn: string; addressAr: string; addressEn: string; isOpen: boolean; queue: number; wait: number };

export function BranchPicker({ initial }: { initial: BranchS[] }) {
  const { t, n, lang } = useLang();
  const { branchId, setBranch } = useCart();
  const { data } = usePoll<BranchS[]>("/api/branches", 10000);
  const list = data ?? initial;
  useEffect(() => {
    if (!branchId && list.length) {
      const q = new URLSearchParams(location.search).get("b");
      const fromQr = q && list.find((b) => b.slug === q);
      setBranch((fromQr || list[0]).id);
    }
  }, [branchId, list, setBranch]);
  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1">
      {list.map((b) => {
        const on = b.id === branchId;
        const level = !b.isOpen ? 0 : b.queue <= 2 ? 1 : b.queue <= 5 ? 2 : 3;
        const label = !b.isOpen ? t("closed") : level === 1 ? t("calm") : level === 2 ? t("medium") : t("busy");
        const col = level === 1 ? "var(--mint)" : level === 2 ? "var(--honey)" : "var(--pink)";
        return (
          <button key={b.id} onClick={() => setBranch(b.id)} aria-pressed={on}
            className={`glass min-w-[168px] snap-start p-3.5 text-start transition ${on ? "neon-border" : "opacity-80"}`}
            style={on ? { background: "linear-gradient(160deg, rgba(255,107,26,.14), rgba(229,57,53,.06))" } : undefined}>
            <div className="flex items-center justify-between gap-2">
              <b className="text-[15px]">{n(b)}</b>
              {on && <span className="h-2.5 w-2.5 rounded-full bg-[var(--honey)] shadow-[0_0_10px_var(--honey)]" />}
            </div>
            <div className="truncate text-[12px] text-[var(--muted)]">{lang === "ar" ? b.addressAr : b.addressEn}&nbsp;</div>
            <div className="mt-2.5 flex items-center gap-2 text-[12px] font-semibold">
              <span className="flex gap-[3px]">{[1, 2, 3].map((k) => <i key={k} className="h-[6px] w-4 rounded-full" style={{ background: k <= level ? col : "rgba(120,60,20,.12)" }} />)}</span>
              <span style={{ color: col }}>{label}</span>
              {b.isOpen && <span className="num ms-auto text-[var(--muted)]">{t("waitMin", { n: b.wait })}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
