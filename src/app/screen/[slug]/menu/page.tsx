import MenuBoard from "./MenuBoard";
import { headers } from "next/headers";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const h = await headers();
  const origin = process.env.PUBLIC_URL || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  return <MenuBoard slug={slug} appUrl={`${origin}/?b=${slug}`} />;
}
