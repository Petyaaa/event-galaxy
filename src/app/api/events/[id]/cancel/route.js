import { requireUser } from "@/server/auth/session";
import { ok, route } from "@/server/http/responses";
import { cancelEvent } from "@/server/events/event.service";
import { eventCancelSchema, readJson } from "@/server/validation/schemas";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  return route(async (requestId) => {
    const user = await requireUser();
    const { id } = await params;
    const { reason } = await readJson(request, eventCancelSchema);
    const event = await cancelEvent({ eventId: id, user, reason, requestId });
    return ok({ event });
  });
}
