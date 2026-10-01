import { db, schema as s } from "@/db";
import { and, gte, lt, ne, inArray, desc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { dayStart, hourIn } from "@/lib/format";
import { json, bad } from "@/lib/api";
export const dynamic = "force-dynamic";

export async function GET() {
  if ((await getSession())?.role !== "OWNER") return bad("unauthorized", 401);
  const today = dayStart(), now = new Date();
  const yStart = new Date(today.getTime() - 864e5), yNow = new Date(now.getTime() - 864e5);
  const os = await db.select().from(s.orders).where(and(gte(s.orders.createdAt, today), ne(s.orders.status, "CANCELLED")));
  const [y] = await db.select({ total: sql<number>`coalesce(sum(${s.orders.total}),0)::int`, n: sql<number>`count(*)::int` }).from(s.orders)
    .where(and(gte(s.orders.createdAt, yStart), lt(s.orders.createdAt, yNow), ne(s.orders.status, "CANCELLED")));
  const items = os.length ? await db.select().from(s.orderItems).where(inArray(s.orderItems.orderId, os.map((o) => o.id))) : [];
  const [branches, flavors, products, [{ members }]] = await Promise.all([
    db.select().from(s.branches), db.select().from(s.flavors), db.select().from(s.products),
    db.select({ members: sql<number>`count(*)::int` }).from(s.customers),
  ]);
  const sales = os.reduce((a, o) => a + o.total, 0);
  const prep = os.filter((o) => o.readyAt).map((o) => (o.readyAt!.getTime() - o.createdAt.getTime()) / 1000);
  const hours = Array.from({ length: 24 }, () => 0);
  for (const o of os) hours[hourIn(o.createdAt)] += o.total;
  const byBranch = branches.sort((a, b) => a.sort - b.sort).map((b) => {
    const bo = os.filter((o) => o.branchId === b.id);
    return { id: b.id, nameAr: b.nameAr, nameEn: b.nameEn, sales: bo.reduce((a, o) => a + o.total, 0), orders: bo.length, open: bo.filter((o) => o.status === "NEW" || o.status === "PREPARING").length };
  });
  const fc = new Map<string, number>();
  for (const it of items) for (const id of it.scoops) fc.set(id, (fc.get(id) ?? 0) + it.qty);
  for (const it of items) if (it.productId) fc.set(it.productId, (fc.get(it.productId) ?? 0) + it.qty);
  const top = [
    ...flavors.map((f) => ({ id: f.id, kind: "flavor" as const, slug: f.slug, look: "", accent: "", imageId: f.imageId, nameAr: f.nameAr, nameEn: f.nameEn, color: f.color, n: fc.get(f.id) ?? 0 })),
    ...products.map((p) => ({ id: p.id, kind: "product" as const, slug: "", look: p.look, accent: p.accent, imageId: p.imageId, nameAr: p.nameAr, nameEn: p.nameEn, color: p.color, n: fc.get(p.id) ?? 0 })),
  ].sort((a, b) => b.n - a.n).slice(0, 8);
  const pname = new Map(products.map((p) => [p.id, p]));
  const bname = new Map(branches.map((b) => [b.id, b]));
  const fname = new Map(flavors.map((f) => [f.id, f]));
  const live = [...os].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 12).map((o) => ({
    id: o.id, number: o.number, status: o.status, source: o.source, total: o.total, createdAt: o.createdAt,
    branchAr: bname.get(o.branchId)!.nameAr, branchEn: bname.get(o.branchId)!.nameEn,
    scoops: items.filter((i) => i.orderId === o.id).flatMap((i) => i.productId
      ? [{ ar: pname.get(i.productId)?.nameAr ?? "", en: pname.get(i.productId)?.nameEn ?? "", c: pname.get(i.productId)?.color ?? "#ccc" }]
      : i.scoops.map((id) => ({ ar: fname.get(id)?.nameAr ?? "", en: fname.get(id)?.nameEn ?? "", c: fname.get(id)?.color ?? "#ccc" }))),
  }));
  const lowStock = await db.select({ branchId: s.stock.branchId, flavorId: s.stock.flavorId, level: s.stock.level, soldOut: s.stock.soldOut }).from(s.stock)
    .where(sql`${s.stock.level} < 20 or ${s.stock.soldOut}`).orderBy(s.stock.level);
  return json({
    sales, orders: os.length, ySales: y.total, yOrders: y.n,
    avgPrep: prep.length ? prep.reduce((a, b) => a + b, 0) / prep.length : 0,
    appShare: os.length ? os.filter((o) => o.source !== "COUNTER").length / os.length : 0,
    members, hours, nowHour: hourIn(now), byBranch, top, live,
    lowStock: lowStock.slice(0, 8).map((x) => ({ ...x, branchAr: bname.get(x.branchId)?.nameAr, branchEn: bname.get(x.branchId)?.nameEn, flavorAr: fname.get(x.flavorId)?.nameAr, flavorEn: fname.get(x.flavorId)?.nameEn, color: fname.get(x.flavorId)?.color })),
  });
}
