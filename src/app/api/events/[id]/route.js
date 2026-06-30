import { requireUser } from "@/server/auth/session";
import { ok, route } from "@/server/http/responses";
import { eventUpdateSchema, readJson } from "@/server/validation/schemas";
import { getEvent, updateEvent } from "@/server/events/event.service";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  return route(async () => {
    const user = await requireUser();
    const { id } = await params;
    const event = await getEvent({ eventId: id, user });
    return ok({ event });
  });
}

export async function PATCH(request, { params }) {
  return route(async (requestId) => {
    const user = await requireUser();
    const { id } = await params;
    const data = await readJson(request, eventUpdateSchema);
    const event = await updateEvent({ eventId: id, user, data, requestId });
    return ok({ event });
  });
}
