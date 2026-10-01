import { giftBy, giftView } from "@/lib/gifts";
import { json, bad } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const g = await giftBy("redeemCode", (await params).code);
  if (!g || g.status === "PENDING" || g.status === "CANCELLED") return bad("notfound", 404);
  return json({ ...(await giftView(g)), redeemCode: g.redeemCode });
}
