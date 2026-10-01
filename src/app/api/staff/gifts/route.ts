import { z } from "zod";
import { db, schema as s } from "@/db";
import { eq, and } from "drizzle-orm";
import { getSession, canUseBranch } from "@/lib/auth";
import { giftBy, giftView } from "@/lib/gifts";
import { createOrder, OrderError } from "@/lib/orders";
import { notifyOwner } from "@/lib/notify";
import { fmt } from "@/lib/format";
import { json, bad } from "@/lib/api";
export const dynamic = "force-dynamic";

async function find(code: string) {
  const pay = await giftBy("payCode", code);
  if (pay && pay.status === "PENDING") return { kind: "pay" as const, g: pay };
  const red = await giftBy("redeemCode", code);
  if (red && red.status === "ACTIVE") return { kind: "redeem" as const, g: red };
  if (red && red.status === "REDEEMED") return { kind: "used" as const, g: red };
  return null;
}
export async function GET(req: Request) {
  const u = new URL(req.url);
  if (!canUseBranch(await getSession(), u.searchParams.get("branch") ?? "")) return bad("unauthorized", 401);
  const f = await find(u.searchParams.get("code") ?? "");
  if (!f) return json({ kind: "none" });
  return json({ kind: f.kind, gift: await giftView(f.g) });
}
const Body = z.object({ code: z.string().min(4), branchId: z.string() });
export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("invalid");
  const { code, branchId } = p.data;
  if (!canUseBranch(await getSession(), branchId)) return bad("unauthorized", 401);
  const f = await find(code);
  if (!f || f.kind === "used") return bad("notfound", 404);
  const [b] = await db.select().from(s.branches).where(eq(s.branches.id, branchId));
  if (f.kind === "pay") {
    await db.update(s.gifts).set({ status: "ACTIVE", paidAt: new Date(), paidBranchId: branchId }).where(and(eq(s.gifts.id, f.g.id), eq(s.gifts.status, "PENDING")));
    await notifyOwner("gift", `🎁 هدية مدفوعة بفرع ${b.nameAr} – ${fmt(f.g.price)} ل.س (من ${f.g.fromName} إلى ${f.g.toName})`, `🎁 Gift paid at ${b.nameEn} – ${fmt(f.g.price)} SYP (${f.g.fromName} → ${f.g.toName})`);
    return json({ ok: true, kind: "pay" });
  }
  try {
    const o = await createOrder({ branchId, source: "COUNTER", items: [{ base: f.g.base, scoops: f.g.scoops, toppings: f.g.toppings, qty: 1 }] });
    await db.update(s.orders).set({ total: 0, note: `🎁 ${f.g.fromName} → ${f.g.toName}` }).where(eq(s.orders.id, o.id));
    await db.update(s.gifts).set({ status: "REDEEMED", redeemedAt: new Date(), redeemedOrderId: o.id }).where(eq(s.gifts.id, f.g.id));
    return json({ ok: true, kind: "redeem", number: o.number });
  } catch (e) {
    return bad(e instanceof OrderError ? e.message : "server", 409);
  }
}
