import { cookies } from "next/headers";
import { json } from "@/lib/api";
export async function POST(req: Request) {
  const { lang } = await req.json().catch(() => ({ lang: "ar" }));
  (await cookies()).set("lang", lang === "en" ? "en" : "ar", { maxAge: 60 * 60 * 24 * 365, path: "/" });
  return json({ ok: true });
}
