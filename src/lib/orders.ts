import { z } from "zod";
import { db, schema as s } from "@/db";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { scoopPrice, productPrice, isProduct, type ScoopItem, type ProductItem } from "./pricing";
import { shortCode } from "./id";
import { dayStart, fmt } from "./format";
import { notifyOwner } from "./notify";

export const OrderInput = z.object({
  branchId: z.string().min(1),
  source: z.enum(["APP", "KIOSK", "COUNTER"]).default("APP"),
  phone: z.string().regex(/^\+?\d{8,15}$/).optional().nullable(),
  useReward: z.boolean().optional(),
  note: z.string().max(200).optional().nullable(),
  items: z.array(z.union([
    z.object({ productId: z.string().min(1), size: z.string().nullable().optional(), qty: z.number().int().min(1).max(20) }),
    z.object({
      base: z.enum(["CONE", "CUP", "WAFFLE"]),
      scoops: z.array(z.string()).min(1).max(3),
      toppings: z.array(z.string()).max(5),
      qty: z.number().int().min(1).max(20),
    }),
  ])).min(1).max(30),
});
export type OrderInputT = z.infer<typeof OrderInput>;

export class OrderError extends Error {}

export function normPhone(p?: string | null): string | null {
  if (!p) return null;
  let d = p.replace(/[^\d]/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("09")) d = "963" + d.slice(1);
  if (d.startsWith("9") && d.length === 9) d = "963" + d;
  return d.length >= 10 ? d : null;
}

export async function createOrder(input: OrderInputT) {
  const [branch] = await db.select().from(s.branches).where(eq(s.branches.id, input.branchId));
  if (!branch) throw new OrderError("branch");
  if (!branch.isOpen) throw new OrderError("closed");

  const scoopItems = input.items.filter((i) => !isProduct(i)) as ScoopItem[];
  const prodItems = input.items.filter(isProduct) as ProductItem[];
  const flavorIds = [...new Set(scoopItems.flatMap((i) => i.scoops))];
  const toppingIds = [...new Set(scoopItems.flatMap((i) => i.toppings))];
  const productIds = [...new Set(prodItems.map((i) => i.productId))];
  const fl = flavorIds.length ? await db.select().from(s.flavors).where(inArray(s.flavors.id, flavorIds)) : [];
  const pr = productIds.length ? await db.select().from(s.products).where(inArray(s.products.id, productIds)) : [];
  const pm = new Map(pr.map((p) => [p.id, p]));
  for (const id of productIds) { const p = pm.get(id); if (!p || !p.active) throw new OrderError("product"); }
  for (const it of prodItems) { const p = pm.get(it.productId)!; if (p.sizes.length && !p.sizes.some((z) => z.key === it.size)) it.size = p.sizes[0].key; if (!p.sizes.length) it.size = null; }
  if (productIds.length) {
    const ps = await db.select().from(s.productStock).where(and(eq(s.productStock.branchId, branch.id), inArray(s.productStock.productId, productIds)));
    const out = ps.filter((x) => x.soldOut).map((x) => x.productId);
    if (out.length) throw new OrderError("soldout:" + out.join(","));
  }
  const tp = toppingIds.length ? await db.select().from(s.toppings).where(inArray(s.toppings.id, toppingIds)) : [];
  const fm = new Map(fl.map((f) => [f.id, f])), tm = new Map(tp.map((t) => [t.id, t]));
  for (const id of flavorIds) { const f = fm.get(id); if (!f || !f.active) throw new OrderError("flavor"); }
  for (const id of toppingIds) if (!tm.get(id)) throw new OrderError("topping");

  const st = flavorIds.length ? await db.select().from(s.stock).where(and(eq(s.stock.branchId, branch.id), inArray(s.stock.flavorId, flavorIds))) : [];
  const sold = st.filter((x) => x.soldOut || x.level <= 0).map((x) => x.flavorId);
  if (sold.length) throw new OrderError("soldout:" + sold.join(","));

  const priced = [
    ...scoopItems.map((it) => ({ productId: null as string | null, size: null as string | null, base: it.base, scoops: it.scoops, toppings: it.toppings, qty: it.qty, price: scoopPrice(it, (id) => fm.get(id)!.price, (id) => tm.get(id)!.price) })),
    ...prodItems.map((it) => ({ productId: it.productId, size: it.size ?? null, base: "CONE" as const, scoops: [] as string[], toppings: [] as string[], qty: it.qty, price: productPrice(it, pm.get(it.productId)) })),
  ];
  let total = priced.reduce((a, b) => a + b.price, 0);

  const phone = normPhone(input.phone);
  let customerId: string | null = null, usedReward = false;
  if (phone) {
    const [c] = await db.insert(s.customers).values({ phone }).onConflictDoUpdate({ target: s.customers.phone, set: { phone } }).returning();
    customerId = c.id;
    if (input.useReward && c.points >= 10) {
      const cheapest = Math.min(...priced.map((p) => p.price / p.qty));
      total -= cheapest; usedReward = true;
      await db.update(s.customers).set({ points: sql`${s.customers.points} - 10` }).where(eq(s.customers.id, c.id));
    }
  }

  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.orders).where(and(eq(s.orders.branchId, branch.id), gte(s.orders.createdAt, dayStart())));
  const [order] = await db.insert(s.orders).values({
    code: shortCode(), number: 100 + n + 1, branchId: branch.id, customerId, source: input.source,
    total, note: input.note ?? null, usedReward,
  }).returning();
  await db.insert(s.orderItems).values(priced.map((p) => ({ orderId: order.id, productId: p.productId, size: p.size, base: p.base, scoops: p.scoops, toppings: p.toppings, qty: p.qty, price: p.price })));

  // stock: ~2% of a tub per scoop
  const use = new Map<string, number>();
  for (const it of scoopItems) for (const id of it.scoops) use.set(id, (use.get(id) ?? 0) + 2 * it.qty);
  for (const [fid, amt] of use) {
    const [row] = await db.update(s.stock).set({ level: sql`greatest(${s.stock.level} - ${amt}, 0)` })
      .where(and(eq(s.stock.branchId, branch.id), eq(s.stock.flavorId, fid))).returning();
    if (row && row.level < 15 && row.level + amt >= 15) {
      const f = fm.get(fid)!;
      await notifyOwner("stock", `⚠️ مخزون ${f.nameAr} بفرع ${branch.nameAr} تحت 15%`, `⚠️ ${f.nameEn} at ${branch.nameEn} is under 15%`);
    }
  }
  if (input.source !== "COUNTER") {
    await notifyOwner("order", `🧾 طلب جديد #${order.number} (${input.source === "APP" ? "تطبيق" : "كشك"}) – ${branch.nameAr} – ${fmt(total)} ل.س`, `🧾 New order #${order.number} (${input.source}) – ${branch.nameEn} – ${fmt(total)} SYP`);
  }
  return order;
}

const NEXT: Record<string, string[]> = { NEW: ["PREPARING", "CANCELLED"], PREPARING: ["READY", "CANCELLED"], READY: ["DONE", "CANCELLED"] };

export async function setStatus(orderId: string, to: "PREPARING" | "READY" | "DONE" | "CANCELLED") {
  const [o] = await db.select().from(s.orders).where(eq(s.orders.id, orderId));
  if (!o) throw new OrderError("notfound");
  if (!NEXT[o.status]?.includes(to)) throw new OrderError("transition");
  const now = new Date();
  const patch: Partial<typeof s.orders.$inferInsert> = { status: to };
  if (to === "PREPARING") patch.startedAt = now;
  if (to === "READY") patch.readyAt = now;
  if (to === "DONE") patch.doneAt = now;
  const [u] = await db.update(s.orders).set(patch).where(eq(s.orders.id, orderId)).returning();
  if (to === "DONE" && o.customerId && !o.usedReward) {
    await db.update(s.customers).set({ points: sql`${s.customers.points} + 1` }).where(eq(s.customers.id, o.customerId));
  }
  return u;
}

export async function orderView(where: { code?: string; id?: string }) {
  const [o] = await db.select().from(s.orders).where(where.code ? eq(s.orders.code, where.code) : eq(s.orders.id, where.id!));
  if (!o) return null;
  const items = await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, o.id));
  return { ...o, items };
}
