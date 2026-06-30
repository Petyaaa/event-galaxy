import { requireUser } from "@/server/auth/session";
import { ok, route } from "@/server/http/responses";
import { retryNotificationJob } from "@/server/notifications/notification.service";

export const runtime = "nodejs";

export async function POST(_request, { params }) {
  return route(async () => {
    const user = await requireUser();
    const { id } = await params;
    const job = await retryNotificationJob({ user, jobId: id });
    return ok({ job });
  });
}
