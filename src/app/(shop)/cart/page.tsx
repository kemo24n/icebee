import { getMenu, branchStatus } from "@/lib/menu";
import CartView from "./CartView";
export const dynamic = "force-dynamic";
export default async function Page() {
  const [menu, branches] = await Promise.all([getMenu(), branchStatus()]);
  return <CartView menu={menu} branches={branches} />;
}
