import { requireUser } from "@/server/auth/session";
import { created, ok, route } from "@/server/http/responses";
import { listEventRegistrations } from "@/server/events/event.service";
import { registerForEvent } from "@/server/registrations/registration.service";
import { readJson, registrationCreateSchema } from "@/server/validation/schemas";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  return route(async () => {
    const user = await requireUser();
    const { id } = await params;
    const registrations = await listEventRegistrations({
      eventId: id,
      user,
      status: ["CONFIRMED", "CHECKED_IN"],
    });
    return ok({ registrations });
  });
}

export async function POST(request, { params }) {
  return route(async (requestId) => {
    const user = await requireUser();
    const { id } = await params;
    const data = await readJson(request, registrationCreateSchema);
    const registration = await registerForEvent({ eventId: id, user, data, requestId });
    return created({ registration });
  });
}
