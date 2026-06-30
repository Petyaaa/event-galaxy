import { requireUser } from "@/server/auth/session";
import { ok, route } from "@/server/http/responses";
import { listEventRegistrations } from "@/server/events/event.service";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  return route(async () => {
    const user = await requireUser();
    const { id } = await params;
    const registrations = await listEventRegistrations({ eventId: id, user, status: ["WAITLISTED"] });
    return ok({ registrations });
  });
}
