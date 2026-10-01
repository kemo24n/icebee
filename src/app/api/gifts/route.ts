import { z } from "zod";
import { db, schema as s } from "@/db";
import { inArray } from "drizzle-orm";
import { shortCode } from "@/lib/id";
import { itemPrice } from "@/lib/pricing";
import { json, bad } from "@/lib/api";
const Body = z.object({
  fromName: z.string().trim().min(1).max(40), toName: z.string().trim().min(1).max(40), message: z.string().max(240).default(""),
  item: z.object({ base: z.enum(["CONE", "CUP", "WAFFLE"]), scoops: z.array(z.string()).min(1).max(3), toppings: z.array(z.string()).max(5) }),
});
export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("invalid");
  const { item } = p.data;
  const fl = await db.select().from(s.flavors).where(inArray(s.flavors.id, item.scoops));
  const tp = item.toppings.length ? await db.select().from(s.toppings).where(inArray(s.toppings.id, item.toppings)) : [];
  const fm = new Map(fl.map((f) => [f.id, f.price])), tm = new Map(tp.map((t) => [t.id, t.price]));
  if (item.scoops.some((id) => !fm.has(id)) || item.toppings.some((id) => !tm.has(id))) return bad("invalid");
  const price = itemPrice({ ...item, qty: 1 }, (id) => fm.get(id)!, (id) => tm.get(id)!);
  const [g] = await db.insert(s.gifts).values({ ...p.data, ...item, price, payCode: shortCode(), redeemCode: shortCode() }).returning();
  return json({ payCode: g.payCode });
}
