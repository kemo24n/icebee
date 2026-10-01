import { db, schema as s } from "@/db";
import { asc, eq, and, inArray, sql } from "drizzle-orm";

export async function getBranches() {
  return db.select().from(s.branches).orderBy(asc(s.branches.sort));
}

export async function getMenu(branchId?: string) {
  const [flavors, toppings, categories, products] = await Promise.all([
    db.select().from(s.flavors).where(eq(s.flavors.active, true)).orderBy(asc(s.flavors.sort)),
    db.select().from(s.toppings).where(eq(s.toppings.active, true)).orderBy(asc(s.toppings.sort)),
    db.select().from(s.categories).where(eq(s.categories.active, true)).orderBy(asc(s.categories.sort)),
    db.select().from(s.products).where(eq(s.products.active, true)).orderBy(asc(s.products.sort)),
  ]);
  let out: Record<string, boolean> = {};
  let pout: Record<string, boolean> = {};
  if (branchId) {
    const [st, ps] = await Promise.all([
      db.select().from(s.stock).where(eq(s.stock.branchId, branchId)),
      db.select().from(s.productStock).where(eq(s.productStock.branchId, branchId)),
    ]);
    out = Object.fromEntries(st.map((x) => [x.flavorId, x.soldOut || x.level <= 0]));
    pout = Object.fromEntries(ps.map((x) => [x.productId, x.soldOut]));
  }
  return {
    categories,
    products: products.map((p) => ({ ...p, soldOut: !!pout[p.id] })),
    flavors: flavors
      .filter((f) => !f.dropEndsAt || f.dropEndsAt.getTime() > Date.now())
      .map((f) => ({ ...f, soldOut: !!out[f.id], dropEndsAt: f.dropEndsAt?.toISOString() ?? null })),
    toppings,
  };
}

/** live wait estimate per branch: 1.5 min per open order, min 2 */
export async function branchStatus() {
  const rows = await db
    .select({ branchId: s.orders.branchId, n: sql<number>`count(*)::int` })
    .from(s.orders)
    .where(inArray(s.orders.status, ["NEW", "PREPARING"]))
    .groupBy(s.orders.branchId);
  const m = Object.fromEntries(rows.map((r) => [r.branchId, r.n]));
  const br = await getBranches();
  return br.map((b) => {
    const q = m[b.id] ?? 0;
    return { id: b.id, slug: b.slug, nameAr: b.nameAr, nameEn: b.nameEn, addressAr: b.addressAr, addressEn: b.addressEn, isOpen: b.isOpen, queue: q, wait: Math.max(2, Math.round(q * 1.5)) };
  });
}

export async function branchBySlug(slug: string) {
  const [b] = await db.select().from(s.branches).where(eq(s.branches.slug, slug));
  return b ?? null;
}

export { and };
