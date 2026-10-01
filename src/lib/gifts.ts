import { db, schema as s } from "@/db";
import { eq, inArray } from "drizzle-orm";
export async function giftView(g: typeof s.gifts.$inferSelect) {
  const fl = await db.select({ id: s.flavors.id, slug: s.flavors.slug, color: s.flavors.color, nameAr: s.flavors.nameAr, nameEn: s.flavors.nameEn }).from(s.flavors).where(inArray(s.flavors.id, g.scoops));
  const tp = g.toppings.length ? await db.select({ id: s.toppings.id, slug: s.toppings.slug, nameAr: s.toppings.nameAr, nameEn: s.toppings.nameEn }).from(s.toppings).where(inArray(s.toppings.id, g.toppings)) : [];
  const fm = new Map(fl.map((f) => [f.id, f])), tm = new Map(tp.map((t) => [t.id, t]));
  return {
    fromName: g.fromName, toName: g.toName, message: g.message, status: g.status, price: g.price, createdAt: g.createdAt,
    base: g.base, scoops: g.scoops.map((id) => fm.get(id)).filter(Boolean), toppings: g.toppings.map((id) => tm.get(id)).filter(Boolean),
  };
}
export async function giftBy(col: "payCode" | "redeemCode", code: string) {
  const [g] = await db.select().from(s.gifts).where(eq(s.gifts[col], code.toUpperCase().trim()));
  return g ?? null;
}
