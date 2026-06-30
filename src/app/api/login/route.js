import { prisma } from "@/server/db/prisma";
import { verifyPassword } from "@/server/auth/password";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/server/auth/session";
import { publicUser } from "@/server/auth/serializers";
import { unauthenticated } from "@/server/http/errors";
import { ok, route } from "@/server/http/responses";
import { loginSchema, readJson } from "@/server/validation/schemas";

export const runtime = "nodejs";

export async function POST(request) {
  return route(async () => {
    const input = await readJson(request, loginSchema);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw unauthenticated("Invalid email or password.");
    }

    const response = ok({ user: publicUser(user) });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(user), sessionCookieOptions());
    return response;
  });
}
