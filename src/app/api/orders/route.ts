import { cookies } from "next/headers";
import { OrderInput, createOrder, OrderError, normPhone } from "@/lib/orders";
import { getSession, canUseBranch } from "@/lib/auth";
import { json, bad } from "@/lib/api";

export async function POST(req: Request) {
  const parsed = OrderInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("invalid");
  const input = parsed.data;
  if (input.source === "COUNTER") {
    const s = await getSession();
    if (!canUseBranch(s, input.branchId)) return bad("unauthorized", 401);
  }
  try {
    const o = await createOrder(input);
    const phone = normPhone(input.phone);
    if (phone && input.source === "APP") (await cookies()).set("ib_phone", phone, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365, path: "/" });
    return json({ code: o.code, number: o.number });
  } catch (e) {
    if (e instanceof OrderError) return bad(e.message, 409);
    console.error(e);
    return bad("server", 500);
  }
}
