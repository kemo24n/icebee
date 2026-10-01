import { db, schema as s } from "@/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { ProductBody } from "@/lib/productBody";
import { json, bad } from "@/lib/api";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if ((await getSession())?.role !== "OWNER") return bad("unauthorized", 401);
  const p = ProductBody.partial().safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("invalid");
  const [pr] = await db.update(s.products).set(p.data).where(eq(s.products.id, (await params).id)).returning();
  return json(pr);
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if ((await getSession())?.role !== "OWNER") return bad("unauthorized", 401);
  // keep order history intact: hide instead of hard delete when the product was ever ordered
  const id = (await params).id;
  const used = await db.select({ id: s.orderItems.id }).from(s.orderItems).where(eq(s.orderItems.productId, id)).limit(1);
  if (used.length) await db.update(s.products).set({ active: false }).where(eq(s.products.id, id));
  else await db.delete(s.products).where(eq(s.products.id, id));
  return json({ ok: true, hidden: used.length > 0 });
}
