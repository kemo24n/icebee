import { cookies } from "next/headers";
import { db, schema as s } from "@/db";
import { eq, desc } from "drizzle-orm";
import { normPhone } from "@/lib/orders";
import { json, bad } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() {
  const phone = (await cookies()).get("ib_phone")?.value;
  if (!phone) return json({ phone: null, points: 0, orders: [] });
  const [c] = await db.select().from(s.customers).where(eq(s.customers.phone, phone));
  if (!c) return json({ phone, points: 0, orders: [] });
  const os = await db.select({ code: s.orders.code, number: s.orders.number, status: s.orders.status, total: s.orders.total, createdAt: s.orders.createdAt })
    .from(s.orders).where(eq(s.orders.customerId, c.id)).orderBy(desc(s.orders.createdAt)).limit(8);
  return json({ phone, points: c.points, orders: os });
}
export async function POST(req: Request) {
  const { phone } = await req.json().catch(() => ({}));
  const p = normPhone(phone);
  if (!p) return bad("invalid");
  (await cookies()).set("ib_phone", p, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return json({ phone: p });
}
