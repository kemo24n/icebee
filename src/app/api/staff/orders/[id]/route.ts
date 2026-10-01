import { z } from "zod";
import { db, schema as s } from "@/db";
import { eq } from "drizzle-orm";
import { getSession, canUseBranch } from "@/lib/auth";
import { setStatus, OrderError } from "@/lib/orders";
import { json, bad } from "@/lib/api";
const Body = z.object({ to: z.enum(["PREPARING", "READY", "DONE", "CANCELLED"]) });
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("invalid");
  const [o] = await db.select().from(s.orders).where(eq(s.orders.id, id));
  if (!o) return bad("notfound", 404);
  if (!canUseBranch(await getSession(), o.branchId)) return bad("unauthorized", 401);
  try { return json(await setStatus(id, p.data.to)); }
  catch (e) { return bad(e instanceof OrderError ? e.message : "server", 409); }
}
