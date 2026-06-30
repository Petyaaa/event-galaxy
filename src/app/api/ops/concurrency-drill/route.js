import { requireUser } from "@/server/auth/session";
import { created, route } from "@/server/http/responses";
import { runConcurrencyDrill } from "@/server/notifications/notification.service";
import { concurrencyDrillSchema, readJson } from "@/server/validation/schemas";

export const runtime = "nodejs";

export async function POST(request) {
  return route(async (requestId) => {
    const user = await requireUser();
    const data = await readJson(request, concurrencyDrillSchema);
    const result = await runConcurrencyDrill({ user, data, requestId });
    return created({ result });
  });
}
