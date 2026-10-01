import { db, schema as s } from "@/db";
import { and, eq, inArray, gte, asc } from "drizzle-orm";
import { branchBySlug, getMenu } from "@/lib/menu";
import { json, bad } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = await branchBySlug(slug);
  if (!b) return bad("notfound", 404);
  const since = new Date(Date.now() - 3 * 3600e3);
  const os = await db.select({ number: s.orders.number, status: s.orders.status, readyAt: s.orders.readyAt }).from(s.orders)
    .where(and(eq(s.orders.branchId, b.id), inArray(s.orders.status, ["NEW", "PREPARING", "READY"]), gte(s.orders.createdAt, since))).orderBy(asc(s.orders.createdAt));
  const menu = await getMenu(b.id);
  return json({ branch: { nameAr: b.nameAr, nameEn: b.nameEn, slug: b.slug }, preparing: os.filter((o) => o.status !== "READY").map((o) => o.number), ready: os.filter((o) => o.status === "READY").map((o) => ({ n: o.number, at: o.readyAt })), menu });
}
