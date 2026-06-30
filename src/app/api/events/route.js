import { requireUser } from "@/server/auth/session";
import { created, ok, route } from "@/server/http/responses";
import { eventCreateSchema, eventListQuerySchema, readJson, readSearchParams } from "@/server/validation/schemas";
import { createEvent, listEvents } from "@/server/events/event.service";

export const runtime = "nodejs";

export async function GET(request) {
  return route(async () => {
    const user = await requireUser();
    const filters = readSearchParams(request, eventListQuerySchema);
    const events = await listEvents({ user, filters });
    return ok({ events });
  });
}

export async function POST(request) {
  return route(async (requestId) => {
    const user = await requireUser();
    const data = await readJson(request, eventCreateSchema);
    const event = await createEvent({ user, data, requestId });
    return created({ event });
  });
}
