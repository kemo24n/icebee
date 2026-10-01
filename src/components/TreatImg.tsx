"use client";
import { useEffect, useState } from "react";
import type { TreatSpec } from "./three/treat3d";

/** Shows the owner's uploaded photo when there is one, otherwise a real-time 3D render. */
export default function TreatImg({ spec, imageId, alt, className = "", size = 384 }: { spec: TreatSpec; imageId?: string | null; alt: string; className?: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(imageId ? `/api/img/${imageId}` : null);
  const key = JSON.stringify(spec);
  useEffect(() => {
    if (imageId) { setSrc(`/api/img/${imageId}`); return; }
    let dead = false;
    import("./three/treat3d").then(({ renderThumb }) => renderThumb(JSON.parse(key), size)).then((u) => { if (!dead && u) setSrc(u); });
    return () => { dead = true; };
  }, [key, imageId, size]);
  if (!src) return <div className={`shimmer rounded-full ${className}`} aria-label={alt} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={`${imageId ? "object-cover" : "object-contain"} ${className}`} draggable={false} />;
}
