import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getBranches, getMenu } from "@/lib/menu";
import KDS from "./KDS";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ b?: string }> }) {
  const s = await getSession();
  if (!s) redirect("/staff/login");
  const branches = await getBranches();
  const { b } = await searchParams;
  const branch = s.role === "OWNER" ? branches.find((x) => x.slug === b) ?? branches[0] : branches.find((x) => x.id === s.branchId);
  if (!branch) redirect("/staff/login");
  return <KDS branch={branch} branches={s.role === "OWNER" ? branches : []} menu={await getMenu()} isOwner={s.role === "OWNER"} />;
}
