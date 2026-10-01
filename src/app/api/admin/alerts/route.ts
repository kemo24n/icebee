import { db, schema as s } from "@/db";
import { desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { json, bad } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() {
  if ((await getSession())?.role !== "OWNER") return bad("unauthorized", 401);
  return json(await db.select().from(s.notifications).orderBy(desc(s.notifications.createdAt)).limit(40));
}
