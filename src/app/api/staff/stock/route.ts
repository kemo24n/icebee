import { z } from "zod";
import { db, schema as s } from "@/db";
import { and, eq } from "drizzle-orm";
import { getSession, canUseBranch } from "@/lib/auth";
import { notifyOwner } from "@/lib/notify";
import { json, bad } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const branchId = new URL(req.url).searchParams.get("branch") ?? "";
  if (!canUseBranch(await getSession(), branchId)) return bad("unauthorized", 401);
  return json(await db.select().from(s.stock).where(eq(s.stock.branchId, branchId)));
}
const Body = z.object({ branchId: z.string(), flavorId: z.string(), soldOut: z.boolean().optional(), level: z.number().int().min(0).max(100).optional() });
export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("invalid");
  const { branchId, flavorId, soldOut, level } = p.data;
  if (!canUseBranch(await getSession(), branchId)) return bad("unauthorized", 401);
  const patch: { soldOut?: boolean; level?: number } = {};
  if (soldOut !== undefined) patch.soldOut = soldOut;
  if (level !== undefined) patch.level = level;
  if (soldOut === false && level === undefined) patch.level = 100;
  const [row] = await db.update(s.stock).set(patch).where(and(eq(s.stock.branchId, branchId), eq(s.stock.flavorId, flavorId))).returning();
  if (soldOut) {
    const [[b], [f]] = await Promise.all([db.select().from(s.branches).where(eq(s.branches.id, branchId)), db.select().from(s.flavors).where(eq(s.flavors.id, flavorId))]);
    await notifyOwner("soldout", `🚫 فرع ${b.nameAr}: ${f.nameAr} خلصت. انشالت من التطبيق والشاشات تلقائياً.`, `🚫 ${b.nameEn}: ${f.nameEn} sold out. Hidden from the app and screens automatically.`);
  }
  return json(row);
}
