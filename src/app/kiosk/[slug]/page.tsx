import { notFound } from "next/navigation";
import { branchBySlug, getMenu } from "@/lib/menu";
import Kiosk from "./Kiosk";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const b = await branchBySlug((await params).slug);
  if (!b) notFound();
  return <Kiosk branch={{ id: b.id, slug: b.slug, nameAr: b.nameAr, nameEn: b.nameEn }} menu={await getMenu(b.id)} />;
}
