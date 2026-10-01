import type { TreatSpec } from "./three/treat3d";
export type FlavorT = { id: string; slug: string; nameAr: string; nameEn: string; descAr: string; descEn: string; color: string; tag: string | null; price: number; imageId: string | null; soldOut?: boolean; active?: boolean; dropEndsAt?: string | null };
export type ToppingT = { id: string; slug: string; nameAr: string; nameEn: string; price: number };
export type ItemT = { base: "CONE" | "CUP" | "WAFFLE"; scoops: string[]; toppings: string[]; qty: number; productId?: undefined };
export type ProductItemT = { productId: string; size?: string | null; qty: number };
export type CartItemT = ItemT | ProductItemT;
export const isProd = (i: CartItemT | { productId?: string | null }): i is ProductItemT => typeof i.productId === "string";
export type SizeT = { key: string; nameAr: string; nameEn: string; delta: number };
export type CategoryT = { id: string; slug: string; nameAr: string; nameEn: string; icon: string; isBuilder: boolean };
export type ProductT = { id: string; categoryId: string; nameAr: string; nameEn: string; descAr: string; descEn: string; price: number; sizes: SizeT[]; look: string; color: string; accent: string; tag: string | null; imageId: string | null; soldOut?: boolean; active?: boolean };
export type MenuT = { flavors: FlavorT[]; toppings: ToppingT[]; categories: CategoryT[]; products: ProductT[] };
export function productSpec(p: { look: string; color: string; accent: string }): TreatSpec {
  return { base: "PRODUCT", scoops: [], toppings: [], product: { look: p.look, color: p.color, accent: p.accent } };
}

export function toSpec(it: { base: TreatSpec["base"]; scoops: string[]; toppings: string[] }, fl: Map<string, FlavorT>, tp: Map<string, ToppingT>): TreatSpec {
  return {
    base: it.base,
    scoops: it.scoops.map((id) => fl.get(id)).filter(Boolean).map((f) => ({ slug: f!.slug, color: f!.color })),
    toppings: it.toppings.map((id) => tp.get(id)?.slug).filter(Boolean) as string[],
  };
}
export function flavorSpec(f: { slug: string; color: string }): TreatSpec {
  return { base: "NONE", scoops: [{ slug: f.slug, color: f.color }], toppings: [] };
}
