import { z } from "zod";
import { db, schema as s } from "@/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { json, bad } from "@/lib/api";
const Body = z.object({ status: z.enum(["NEW", "CONFIRMED", "DONE", "DECLINED"]) });
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if ((await getSession())?.role !== "OWNER") return bad("unauthorized", 401);
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("invalid");
  const [e] = await db.update(s.events).set(p.data).where(eq(s.events.id, (await params).id)).returning();
  return json(e);
}
