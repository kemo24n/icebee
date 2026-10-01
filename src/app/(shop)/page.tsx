import { getMenu, branchStatus } from "@/lib/menu";
import Home from "./Home";
export const dynamic = "force-dynamic";
export default async function Page() {
  const [menu, branches] = await Promise.all([getMenu(), branchStatus()]);
  return <Home menu={menu} branches={branches} />;
}
