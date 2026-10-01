"use client";
import { useEffect, useRef } from "react";
import type { TreatSpec, TreatStage } from "./three/treat3d";

export default function Treat3D({ spec, className = "", autoRotate = true }: { spec: TreatSpec; className?: string; autoRotate?: boolean }) {
  const el = useRef<HTMLDivElement>(null);
  const stage = useRef<TreatStage | null>(null);
  const key = JSON.stringify(spec);
  useEffect(() => {
    let dead = false;
    import("./three/treat3d").then(({ TreatStage }) => {
      if (dead || !el.current) return;
      stage.current = new TreatStage(el.current);
      stage.current.controls.autoRotate = autoRotate;
      stage.current.set(JSON.parse(key));
    });
    return () => { dead = true; stage.current?.destroy(); stage.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { stage.current?.set(JSON.parse(key)); }, [key]);
  return <div ref={el} className={className} />;
}
