import { getMenu } from "@/lib/menu";
import Builder from "./Builder";
export const dynamic = "force-dynamic";
export default async function Page() {
  return <Builder menu={await getMenu()} />;
}
