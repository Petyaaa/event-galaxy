import { requireUser } from "@/server/auth/session";
import { ok, route } from "@/server/http/responses";
import { listMyRegistrations } from "@/server/registrations/registration.service";

export const runtime = "nodejs";

export async function GET() {
  return route(async () => {
    const user = await requireUser();
    const registrations = await listMyRegistrations({ user });
    return ok({ registrations });
  });
}
