import { requireUser } from "@/server/auth/session";
import { ok, route } from "@/server/http/responses";
import { getNotificationJob } from "@/server/notifications/notification.service";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  return route(async () => {
    const user = await requireUser();
    const { id } = await params;
    const job = await getNotificationJob({ user, jobId: id });
    return ok({ job });
  });
}
