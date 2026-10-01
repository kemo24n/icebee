import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type Session = { uid: string; role: "OWNER" | "STAFF"; branchId: string | null; name: string };
const COOKIE = "ib_session";
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me-dev-secret-change-me");

export async function signSession(s: Session): Promise<string> {
  return new SignJWT(s as unknown as Record<string, unknown>).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("14d").sign(key());
}
export async function verifySession(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload as unknown as Session;
  } catch {
    return null;
  }
}
export async function getSession(): Promise<Session | null> {
  const c = await cookies();
  return verifySession(c.get(COOKIE)?.value);
}
export const SESSION_COOKIE = COOKIE;

/** staff may act on their own branch; owner on all */
export function canUseBranch(s: Session | null, branchId: string): boolean {
  return !!s && (s.role === "OWNER" || s.branchId === branchId);
}
