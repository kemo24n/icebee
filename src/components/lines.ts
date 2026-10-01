import { useMemo } from "react";
import { toSpec, productSpec, isProd, type MenuT, type FlavorT, type ToppingT, type ProductT, type CartItemT } from "./spec";
import { scoopPrice, productPrice } from "@/lib/pricing";
import type { TreatSpec } from "./three/treat3d";

export type Maps = { fl: Map<string, FlavorT>; tp: Map<string, ToppingT>; pr: Map<string, ProductT> };
type Named = { nameAr: string; nameEn: string };
/** any order line, from the cart or from the server */
export type LineT = CartItemT | { productId?: string | null; size?: string | null; base: "CONE" | "CUP" | "WAFFLE"; scoops: string[]; toppings: string[]; qty: number; price?: number };

export function useMaps(m: Pick<MenuT, "flavors" | "toppings"> & { products?: ProductT[] }): Maps {
  return useMemo(() => ({
    fl: new Map(m.flavors.map((f) => [f.id, f])),
    tp: new Map(m.toppings.map((x) => [x.id, x])),
    pr: new Map((m.products ?? []).map((p) => [p.id, p])),
  }), [m]);
}
const asProd = (it: LineT) => (typeof it.productId === "string" ? it as { productId: string; size?: string | null; qty: number } : null);

export function linePrice(it: LineT, M: Maps): number {
  const p = asProd(it);
  if (p) return productPrice(p, M.pr.get(p.productId));
  const s = it as Exclude<LineT, { productId: string }> & { base: "CONE" | "CUP" | "WAFFLE"; scoops: string[]; toppings: string[] };
  return scoopPrice(s, (id) => M.fl.get(id)?.price ?? 0, (id) => M.tp.get(id)?.price ?? 0);
}
export function lineSpec(it: LineT, M: Maps): TreatSpec {
  const p = asProd(it);
  if (p) { const pr = M.pr.get(p.productId); return pr ? productSpec(pr) : { base: "CUP", scoops: [], toppings: [] }; }
  const s = it as { base: "CONE" | "CUP" | "WAFFLE"; scoops: string[]; toppings: string[] };
  return toSpec(s, M.fl, M.tp);
}
export function lineImage(it: LineT, M: Maps): string | null {
  const p = asProd(it);
  return p ? M.pr.get(p.productId)?.imageId ?? null : null;
}
export function lineTitle(it: LineT, M: Maps, n: (o: Named) => string): string {
  const p = asProd(it);
  if (p) { const pr = M.pr.get(p.productId); return pr ? n(pr) : "?"; }
  return (it as { scoops: string[] }).scoops.map((id) => (M.fl.get(id) ? n(M.fl.get(id)!) : "?")).join(" + ");
}
export function lineSub(it: LineT, M: Maps, n: (o: Named) => string, baseName: (b: "CONE" | "CUP" | "WAFFLE") => string): string {
  const p = asProd(it);
  if (p) { const pr = M.pr.get(p.productId); const sz = pr?.sizes.find((z) => z.key === p.size); return sz ? n(sz) : ""; }
  const s = it as { base: "CONE" | "CUP" | "WAFFLE"; toppings: string[] };
  return baseName(s.base) + (s.toppings.length ? " · " + s.toppings.map((id) => (M.tp.get(id) ? n(M.tp.get(id)!) : "")).join("، ") : "");
}
export { isProd };
