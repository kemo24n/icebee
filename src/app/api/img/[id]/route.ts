import { db, schema as s } from "@/db";
import { eq } from "drizzle-orm";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [img] = await db.select().from(s.images).where(eq(s.images.id, id));
  if (!img) return new Response("not found", { status: 404 });
  return new Response(new Uint8Array(img.data), { headers: { "Content-Type": img.mime, "Cache-Control": "public, max-age=31536000, immutable" } });
}
