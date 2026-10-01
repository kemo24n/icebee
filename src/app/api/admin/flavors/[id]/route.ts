import { z } from "zod";
import { db, schema as s } from "@/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { json, bad } from "@/lib/api";
const Body = z.object({
  price: z.number().int().min(0).optional(), active: z.boolean().optional(),
  nameAr: z.string().min(1).optional(), nameEn: z.string().min(1).optional(),
  descAr: z.string().optional(), descEn: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(), tag: z.string().nullable().optional(),
  imageId: z.string().nullable().optional(),
});
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if ((await getSession())?.role !== "OWNER") return bad("unauthorized", 401);
  const { id } = await params;
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("invalid");
  const [f] = await db.update(s.flavors).set(p.data).where(eq(s.flavors.id, id)).returning();
  return json(f);
}
