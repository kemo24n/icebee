import { getMenu } from "@/lib/menu";
import Track from "./Track";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <Track code={code} menu={await getMenu()} />;
}
