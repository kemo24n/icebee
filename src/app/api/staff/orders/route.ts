import { db, schema as s } from "@/db";
import { and, eq, inArray, or, gte, asc } from "drizzle-orm";
import { getSession, canUseBranch } from "@/lib/auth";
import { json, bad } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const branchId = new URL(req.url).searchParams.get("branch") ?? "";
  if (!canUseBranch(await getSession(), branchId)) return bad("unauthorized", 401);
  const recent = new Date(Date.now() - 10 * 60e3);
  const os = await db.select().from(s.orders).where(and(eq(s.orders.branchId, branchId),
    or(inArray(s.orders.status, ["NEW", "PREPARING", "READY"]), and(eq(s.orders.status, "DONE"), gte(s.orders.doneAt, recent))))).orderBy(asc(s.orders.createdAt));
  const items = os.length ? await db.select().from(s.orderItems).where(inArray(s.orderItems.orderId, os.map((o) => o.id))) : [];
  return json(os.map((o) => ({ ...o, items: items.filter((i) => i.orderId === o.id) })));
}
