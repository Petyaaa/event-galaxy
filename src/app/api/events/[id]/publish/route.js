import { requireUser } from "@/server/auth/session";
import { ok, route } from "@/server/http/responses";
import { publishEvent } from "@/server/events/event.service";

export const runtime = "nodejs";

export async function POST(_request, { params }) {
  return route(async (requestId) => {
    const user = await requireUser();
    const { id } = await params;
    const event = await publishEvent({ eventId: id, user, requestId });
    return ok({ event });
  });
}
