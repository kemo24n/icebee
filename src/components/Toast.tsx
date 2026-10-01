"use client";
import { useEffect, useState } from "react";
let push: ((m: string) => void) | null = null;
export function toast(m: string) { push?.(m); }
export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { let t: ReturnType<typeof setTimeout>; push = (m) => { setMsg(m); clearTimeout(t); t = setTimeout(() => setMsg(null), 2600); }; return () => { push = null; }; }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),12px)] z-[60] flex justify-center px-4">
      {msg && <div className="pop rounded-full bg-[var(--honey)] px-5 py-2.5 text-[14px] font-bold text-[#FFFFFF] shadow-[0_10px_40px_-10px_rgba(255,107,26,.8)]">{msg}</div>}
    </div>
  );
}
export function confetti(el?: HTMLElement | null) {
  if (typeof window === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const host = el ?? document.body;
  const box = document.createElement("div");
  box.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:70;overflow:hidden";
  const cols = ["#FF6B1A", "#FF4FA3", "#93C25E", "#6D4BD0", "#E53935", "#F7F2E8"];
  for (let i = 0; i < 70; i++) {
    const p = document.createElement("i");
    const x = Math.random() * 100, d = 900 + Math.random() * 900, r = Math.random() * 720;
    p.style.cssText = `position:absolute;top:-12px;left:${x}%;width:${6 + Math.random() * 6}px;height:${10 + Math.random() * 8}px;background:${cols[i % cols.length]};border-radius:2px;`;
    p.animate([{ transform: "translateY(0) rotate(0)" }, { transform: `translateY(${innerHeight + 40}px) translateX(${(Math.random() - 0.5) * 160}px) rotate(${r}deg)` }], { duration: d, delay: Math.random() * 250, easing: "cubic-bezier(.2,.6,.4,1)", fill: "forwards" });
    box.appendChild(p);
  }
  host.appendChild(box);
  setTimeout(() => box.remove(), 2200);
}
