import { getMenu } from "@/lib/menu";
import { json } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const b = new URL(req.url).searchParams.get("branch") ?? undefined;
  return json(await getMenu(b));
}
