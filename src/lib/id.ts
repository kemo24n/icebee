import { randomBytes } from "crypto";
export function createId(): string {
  return randomBytes(12).toString("base64url");
}
export function shortCode(): string {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const b = randomBytes(6);
  let s = "";
  for (let i = 0; i < 6; i++) s += a[b[i] % a.length];
  return s;
}
