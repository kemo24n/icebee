import { orderView } from "@/lib/orders";
import { db, schema as s } from "@/db";
import { eq } from "drizzle-orm";
import { json, bad } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const o = await orderView({ code: code.toUpperCase() });
  if (!o) return bad("notfound", 404);
  const [b] = await db.select().from(s.branches).where(eq(s.branches.id, o.branchId));
  return json({ code: o.code, number: o.number, status: o.status, total: o.total, usedReward: o.usedReward, createdAt: o.createdAt, readyAt: o.readyAt, items: o.items, branch: { nameAr: b.nameAr, nameEn: b.nameEn, addressAr: b.addressAr, addressEn: b.addressEn } });
}
