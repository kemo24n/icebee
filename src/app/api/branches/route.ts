import { branchStatus } from "@/lib/menu";
import { json } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() { return json(await branchStatus()); }
