import { getMenu } from "@/lib/menu";
import NewGift from "./NewGift";
export const dynamic = "force-dynamic";
export default async function Page() { return <NewGift menu={await getMenu()} />; }
