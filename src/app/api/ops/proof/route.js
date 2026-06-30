import { requireUser } from "@/server/auth/session";
import { ok, route } from "@/server/http/responses";
import { proofSnapshot } from "@/server/notifications/notification.service";

export const runtime = "nodejs";

export async function GET() {
  return route(async () => {
    const user = await requireUser();
    const proof = await proofSnapshot({ user });
    return ok({ proof });
  });
}
