import { requireUser } from "@/server/auth/session";
import { ok, route } from "@/server/http/responses";
import { listNotificationJobs } from "@/server/notifications/notification.service";
import { notificationJobQuerySchema, readSearchParams } from "@/server/validation/schemas";

export const runtime = "nodejs";

export async function GET(request) {
  return route(async () => {
    const user = await requireUser();
    const filters = readSearchParams(request, notificationJobQuerySchema);
    const jobs = await listNotificationJobs({ user, filters });
    return ok({ jobs });
  });
}
