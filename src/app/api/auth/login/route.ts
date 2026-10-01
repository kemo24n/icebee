import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db, schema as s } from "@/db";
import { signSession, SESSION_COOKIE } from "@/lib/auth";
import { json, bad } from "@/lib/api";
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const pin = String(body?.pin ?? "");
  if (!/^\d{4,8}$/.test(pin)) return bad("invalid");
  const users = await db.select().from(s.users);
  const u = users.find((x) => bcrypt.compareSync(pin, x.pinHash));
  if (!u) { await new Promise((r) => setTimeout(r, 600)); return bad("wrong", 401); }
  const token = await signSession({ uid: u.id, role: u.role, branchId: u.branchId, name: u.name });
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 14, path: "/" });
  return json({ role: u.role, branchId: u.branchId });
}
