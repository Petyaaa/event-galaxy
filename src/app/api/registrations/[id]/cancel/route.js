import { requireUser } from "@/server/auth/session";
import { ok, route } from "@/server/http/responses";
import { cancelRegistration } from "@/server/registrations/registration.service";
import { readJson, registrationCancelSchema } from "@/server/validation/schemas";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  return route(async (requestId) => {
    const user = await requireUser();
    const { id } = await params;
    const data = await readJson(request, registrationCancelSchema);
    const result = await cancelRegistration({ registrationId: id, user, reason: data.reason, requestId });
    return ok(result);
  });
}
