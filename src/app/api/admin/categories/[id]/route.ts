import { z } from "zod";
import { db, schema as s } from "@/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { json, bad } from "@/lib/api";
const Body = z.object({ nameAr: z.string().trim().min(1).max(40).optional(), nameEn: z.string().trim().min(1).max(40).optional(), icon: z.string().max(8).optional(), active: z.boolean().optional(), sort: z.number().int().optional() });
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if ((await getSession())?.role !== "OWNER") return bad("unauthorized", 401);
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("invalid");
  const [c] = await db.update(s.categories).set(p.data).where(eq(s.categories.id, (await params).id)).returning();
  return json(c);
}
