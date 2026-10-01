import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getBranches } from "@/lib/menu";
import { db, schema as s } from "@/db";
import { asc } from "drizzle-orm";
import Dashboard from "./Dashboard";
export const dynamic = "force-dynamic";
export default async function Page() {
  const ses = await getSession();
  if (ses?.role !== "OWNER") redirect("/staff/login?next=/admin");
  const [branches, flavors, categories, products] = await Promise.all([getBranches(), db.select().from(s.flavors).orderBy(asc(s.flavors.sort)), db.select().from(s.categories).orderBy(asc(s.categories.sort)), db.select().from(s.products).orderBy(asc(s.products.sort))]);
  return <Dashboard branches={branches} flavors={flavors.map((f) => ({ ...f, dropEndsAt: f.dropEndsAt?.toISOString() ?? null }))} categories={categories} products={products} />;
}
