export type BaseT = "CONE" | "CUP" | "WAFFLE";
export const WAFFLE_EXTRA = 5000;
export type ScoopItem = { productId?: undefined; base: BaseT; scoops: string[]; toppings: string[]; qty: number };
export type ProductItem = { productId: string; size?: string | null; qty: number };
export type ItemInput = ScoopItem | ProductItem;
export type SizeT = { key: string; nameAr: string; nameEn: string; delta: number };
export const isProduct = (i: ItemInput): i is ProductItem => typeof (i as ProductItem).productId === "string";

export function scoopPrice(it: Omit<ScoopItem, "productId">, flavorPrice: (id: string) => number, toppingPrice: (id: string) => number): number {
  const unit = it.scoops.reduce((a, id) => a + flavorPrice(id), 0) + it.toppings.reduce((a, id) => a + toppingPrice(id), 0) + (it.base === "WAFFLE" ? WAFFLE_EXTRA : 0);
  return unit * it.qty;
}
export function productPrice(it: ProductItem, p: { price: number; sizes: SizeT[] } | undefined): number {
  if (!p) return 0;
  const sz = p.sizes.find((s) => s.key === it.size);
  return (p.price + (sz?.delta ?? 0)) * it.qty;
}
/** back-compat name used by scoop-only callers */
export const itemPrice = scoopPrice;
