import { db, schema as s } from "@/db";
import { sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { ProductBody } from "@/lib/productBody";
import { json, bad } from "@/lib/api";
export async function POST(req: Request) {
  if ((await getSession())?.role !== "OWNER") return bad("unauthorized", 401);
  const p = ProductBody.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("invalid");
  const [{ mx }] = await db.select({ mx: sql<number>`coalesce(max(${s.products.sort}),0)::int` }).from(s.products);
  const [pr] = await db.insert(s.products).values({ ...p.data, sort: mx + 1 }).returning();
  const br = await db.select({ id: s.branches.id }).from(s.branches);
  if (br.length) await db.insert(s.productStock).values(br.map((b) => ({ branchId: b.id, productId: pr.id }))).onConflictDoNothing();
  return json(pr);
}
