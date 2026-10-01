// Change a PIN:  npm run pin -- owner 482913      or     npm run pin -- aziziyah 7731
import { db, schema as s } from "./index";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
async function main() {
  const [who, pin] = process.argv.slice(2);
  if (!who || !/^\d{4}$/.test(pin ?? "")) { console.error("Usage: npm run pin -- <owner|branch-slug> <4-digit PIN>"); process.exit(1); }
  const hash = bcrypt.hashSync(pin, 10);
  if (who === "owner") await db.update(s.users).set({ pinHash: hash }).where(eq(s.users.role, "OWNER"));
  else {
    const [b] = await db.select().from(s.branches).where(eq(s.branches.slug, who));
    if (!b) { console.error("Unknown branch slug"); process.exit(1); }
    await db.update(s.users).set({ pinHash: hash }).where(eq(s.users.branchId, b.id));
  }
  console.log("PIN updated for", who);
  process.exit(0);
}
main();
