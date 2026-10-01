import { giftBy, giftView } from "@/lib/gifts";
import { json, bad } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const g = await giftBy("payCode", (await params).code);
  if (!g) return bad("notfound", 404);
  return json({ ...(await giftView(g)), payCode: g.payCode, redeemCode: g.status === "PENDING" ? null : g.redeemCode });
}
