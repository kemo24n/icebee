import { z } from "zod";
import { db, schema as s } from "@/db";
import { sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { createId } from "@/lib/id";
import { json, bad } from "@/lib/api";
const Body = z.object({ nameAr: z.string().trim().min(1).max(40), nameEn: z.string().trim().min(1).max(40), icon: z.string().max(8).default("🍽") });
export async function POST(req: Request) {
  if ((await getSession())?.role !== "OWNER") return bad("unauthorized", 401);
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("invalid");
  const [{ mx }] = await db.select({ mx: sql<number>`coalesce(max(${s.categories.sort}),0)::int` }).from(s.categories);
  const [c] = await db.insert(s.categories).values({ ...p.data, slug: createId().slice(0, 8).toLowerCase(), sort: mx + 1 }).returning();
  return json(c);
}
