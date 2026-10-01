import { NextResponse } from "next/server";
export const json = (d: unknown, init?: number) => NextResponse.json(d, { status: init ?? 200, headers: { "Cache-Control": "no-store" } });
export const bad = (msg: string, code = 400) => json({ error: msg }, code);
