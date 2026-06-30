import { SESSION_COOKIE } from "@/server/auth/session";
import { noContent, route } from "@/server/http/responses";

export const runtime = "nodejs";

export async function POST() {
  return route(async () => {
    const response = noContent();
    response.cookies.delete(SESSION_COOKIE);
    return response;
  });
}
