import { cookies } from "next/headers";
import type { Lang } from "./i18n";
export async function getLang(): Promise<Lang> {
  const c = await cookies();
  return c.get("lang")?.value === "en" ? "en" : "ar";
}
