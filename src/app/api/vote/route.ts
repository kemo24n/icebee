import { cookies } from "next/headers";
import { db, schema as s } from "@/db";
import { and, eq, gt, asc, sql } from "drizzle-orm";
import { createId } from "@/lib/id";
import { json, bad } from "@/lib/api";
export const dynamic = "force-dynamic";

async function active() {
  const [p] = await db.select().from(s.polls).where(and(eq(s.polls.active, true), gt(s.polls.endsAt, new Date()))).limit(1);
  return p ?? null;
}
async function view(voter?: string) {
  const p = await active();
  if (!p) return { poll: null };
  const opts = await db.select().from(s.pollOptions).where(eq(s.pollOptions.pollId, p.id)).orderBy(asc(s.pollOptions.sort));
  const counts = await db.select({ o: s.votes.optionId, n: sql<number>`count(*)::int` }).from(s.votes).where(eq(s.votes.pollId, p.id)).groupBy(s.votes.optionId);
  const cm = new Map(counts.map((c) => [c.o, c.n]));
  let mine: string | null = null;
  if (voter) { const [v] = await db.select().from(s.votes).where(and(eq(s.votes.pollId, p.id), eq(s.votes.voter, voter))); mine = v?.optionId ?? null; }
  return { poll: { id: p.id, titleAr: p.titleAr, titleEn: p.titleEn, endsAt: p.endsAt }, options: opts.map((o) => ({ ...o, n: cm.get(o.id) ?? 0 })), mine };
}
export async function GET() { return json(await view((await cookies()).get("ib_vid")?.value)); }
export async function POST(req: Request) {
  const { optionId } = await req.json().catch(() => ({}));
  const p = await active();
  if (!p || typeof optionId !== "string") return bad("invalid");
  const [o] = await db.select().from(s.pollOptions).where(and(eq(s.pollOptions.id, optionId), eq(s.pollOptions.pollId, p.id)));
  if (!o) return bad("invalid");
  const jar = await cookies();
  let vid = jar.get("ib_vid")?.value;
  if (!vid) { vid = createId(); jar.set("ib_vid", vid, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365, path: "/" }); }
  await db.insert(s.votes).values({ pollId: p.id, voter: vid, optionId }).onConflictDoUpdate({ target: [s.votes.pollId, s.votes.voter], set: { optionId } });
  return json(await view(vid));
}
