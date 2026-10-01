import { z } from "zod";
import { db, schema as s } from "@/db";
import { notifyOwner } from "@/lib/notify";
import { normPhone } from "@/lib/orders";
import { EVENT_KINDS, EVENT_PKGS } from "@/lib/events";
import { json, bad } from "@/lib/api";
const Body = z.object({
  name: z.string().trim().min(2).max(60), phone: z.string().min(8).max(20),
  kind: z.enum(EVENT_KINDS.map((k) => k.key) as [string, ...string[]]),
  pkg: z.enum(EVENT_PKGS.map((k) => k.key) as [string, ...string[]]),
  date: z.string().refine((d) => !isNaN(Date.parse(d)) && Date.parse(d) > Date.now() - 864e5),
  guests: z.number().int().min(10).max(5000), location: z.string().max(120).default(""), notes: z.string().max(400).default(""),
});
export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("invalid");
  const phone = normPhone(p.data.phone);
  if (!phone) return bad("phone");
  const [e] = await db.insert(s.events).values({ ...p.data, phone, date: new Date(p.data.date) }).returning();
  const k = EVENT_KINDS.find((x) => x.key === e.kind)!, pk = EVENT_PKGS.find((x) => x.key === e.pkg)!;
  const d = e.date.toISOString().slice(0, 10);
  await notifyOwner("event", `🎉 طلب مناسبة جديد\n${k.ar} · ${pk.ar}\n${d} · ${e.guests} ضيف\n${e.name} – ${phone}${e.location ? "\n📍 " + e.location : ""}`, `🎉 New event request\n${k.en} · ${pk.en}\n${d} · ${e.guests} guests\n${e.name} – ${phone}${e.location ? "\n📍 " + e.location : ""}`);
  return json({ id: e.id });
}
