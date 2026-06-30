import { requireUser } from "@/server/auth/session";
import { ok, route } from "@/server/http/responses";
import { listMyNotifications } from "@/server/notifications/notification.service";

export const runtime = "nodejs";

export async function GET() {
  return route(async () => {
    const user = await requireUser();
    const notifications = await listMyNotifications({ user });
    return ok({ notifications });
  });
}
