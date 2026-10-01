import { db, schema as s } from "@/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { json, bad } from "@/lib/api";
const OK = ["image/jpeg", "image/png", "image/webp"];
export async function POST(req: Request) {
  const ses = await getSession();
  if (ses?.role !== "OWNER") return bad("unauthorized", 401);
  const fd = await req.formData();
  const file = fd.get("file"), flavorId = String(fd.get("flavorId") ?? ""), productId = String(fd.get("productId") ?? "");
  if (!(file instanceof File) || !OK.includes(file.type)) return bad("type");
  if (file.size > 3 * 1024 * 1024) return bad("size");
  const [img] = await db.insert(s.images).values({ mime: file.type, data: Buffer.from(await file.arrayBuffer()) }).returning({ id: s.images.id });
  if (flavorId) await db.update(s.flavors).set({ imageId: img.id }).where(eq(s.flavors.id, flavorId));
  if (productId) await db.update(s.products).set({ imageId: img.id }).where(eq(s.products.id, productId));
  return json({ id: img.id });
}
