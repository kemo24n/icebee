import { z } from "zod";
import { db, schema as s } from "@/db";
import { eq } from "drizzle-orm";
import { getSession, canUseBranch } from "@/lib/auth";
import { notifyOwner } from "@/lib/notify";
import { json, bad } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const branchId = new URL(req.url).searchParams.get("branch") ?? "";
  if (!canUseBranch(await getSession(), branchId)) return bad("unauthorized", 401);
  return json(await db.select({ productId: s.productStock.productId, soldOut: s.productStock.soldOut }).from(s.productStock).where(eq(s.productStock.branchId, branchId)));
}
const Body = z.object({ branchId: z.string(), productId: z.string(), soldOut: z.boolean() });
export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("invalid");
  const { branchId, productId, soldOut } = p.data;
  if (!canUseBranch(await getSession(), branchId)) return bad("unauthorized", 401);
  await db.insert(s.productStock).values({ branchId, productId, soldOut }).onConflictDoUpdate({ target: [s.productStock.branchId, s.productStock.productId], set: { soldOut } });
  if (soldOut) {
    const [[b], [pr]] = await Promise.all([db.select().from(s.branches).where(eq(s.branches.id, branchId)), db.select().from(s.products).where(eq(s.products.id, productId))]);
    await notifyOwner("soldout", `🚫 فرع ${b.nameAr}: ${pr.nameAr} خلص. انشال من التطبيق والشاشات.`, `🚫 ${b.nameEn}: ${pr.nameEn} sold out. Hidden from the app and screens.`);
  }
  return json({ ok: true });
}
