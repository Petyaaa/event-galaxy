import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/password";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/server/auth/session";
import { publicUser } from "@/server/auth/serializers";
import { conflict } from "@/server/http/errors";
import { created, route } from "@/server/http/responses";
import { readJson, registerSchema } from "@/server/validation/schemas";

export const runtime = "nodejs";

export async function POST(request) {
  return route(async () => {
    const input = await readJson(request, registerSchema);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw conflict("EMAIL_ALREADY_REGISTERED", "An account with this email already exists.");
    }

    const user = await prisma.user.create({
      data: {
        email: input.email,
        displayName: input.displayName,
        passwordHash: await hashPassword(input.password),
        role: "STUDENT",
      },
    });

    const response = created({ user: publicUser(user) });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(user), sessionCookieOptions());
    return response;
  });
}
