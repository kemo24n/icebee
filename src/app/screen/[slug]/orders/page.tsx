"use client";
import { use, useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LangProvider";
import { usePoll } from "@/components/usePoll";
import { Wordmark } from "@/components/Logo";

type D = { branch: { nameAr: string; nameEn: string }; preparing: number[]; ready: { n: number; at: string }[] };

function chime() {
  try {
    const a = new AudioContext();
    [523, 659, 784].forEach((f, i) => { const o = a.createOscillator(), g = a.createGain(); o.type = "triangle"; o.frequency.value = f; const t0 = a.currentTime + i * 0.14; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5); o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + 0.55); });
  } catch {}
}

export default function Orders({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t, n } = useLang();
  const { data } = usePoll<D>(`/api/screen/${slug}`, 2500);
  const [armed, setArmed] = useState(false);
  const prev = useRef<Set<number> | null>(null);
  const [fresh, setFresh] = useState<number[]>([]);
  useEffect(() => {
    if (!data) return;
    const cur = new Set(data.ready.map((r) => r.n));
    if (prev.current) {
      const nw = [...cur].filter((x) => !prev.current!.has(x));
      if (nw.length) { setFresh(nw); if (armed) chime(); setTimeout(() => setFresh([]), 6000); }
    }
    prev.current = cur;
  }, [data, armed]);
  return (
    <div className="relative grid h-dvh grid-cols-2" onClick={() => setArmed(true)}>
      <section className="flex flex-col p-[4vw]">
        <h1 className="display neon mb-[4vh] text-[4vw]">{t("preparing")}</h1>
        <div className="flex flex-wrap content-start gap-x-[4vw] gap-y-[3vh]">
          {data?.preparing.map((x) => <b key={x} className="display num text-[6vw] leading-none">{x}</b>)}
        </div>
      </section>
      <section className="flex flex-col p-[4vw]" style={{ background: "linear-gradient(160deg, rgba(61,220,151,.18), rgba(61,220,151,.04))" }}>
        <h1 className="display mb-[4vh] text-[4vw] text-[var(--mint)]" style={{ textShadow: "0 0 18px rgba(61,220,151,.6)" }}>{t("readyPickup")} ✓</h1>
        <div className="flex flex-wrap content-start gap-x-[4vw] gap-y-[3vh]">
          {data?.ready.map((x) => <b key={x.n} className={`display num text-[7vw] leading-none text-[var(--mint)] ${fresh.includes(x.n) ? "pop" : ""}`} style={fresh.includes(x.n) ? { textShadow: "0 0 30px rgba(61,220,151,.9)" } : undefined}>{x.n}</b>)}
        </div>
      </section>
      <div className="absolute inset-x-0 bottom-[3vh] flex items-center justify-center gap-4 text-[1.4vw] text-[var(--muted)]">
        <Wordmark /> · {data ? n(data.branch) : ""}
        {!armed && <span className="chip">🔔 {t("liveOrders")} – tap</span>}
      </div>
    </div>
  );
}
