import { ok } from "@/server/http/responses";

export const runtime = "nodejs";

export async function GET() {
  return ok({
    status: "ok",
    app: "CampusPulse Enterprise",
    timestamp: new Date().toISOString(),
  });
}
