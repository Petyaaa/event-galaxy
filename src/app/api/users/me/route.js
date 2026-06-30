import { prisma } from "@/server/db/prisma";
import { requireUser } from "@/server/auth/session";
import { publicUser } from "@/server/auth/serializers";
import { ok, route } from "@/server/http/responses";
import { readJson, updateMeSchema } from "@/server/validation/schemas";

export const runtime = "nodejs";

export async function GET() {
  return route(async () => {
    const user = await requireUser();
    return ok({ user: publicUser(user) });
  });
}

export async function PUT(request) {
  return route(async () => {
    const user = await requireUser();
    const input = await readJson(request, updateMeSchema);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: input.displayName,
        interests: input.interests,
      },
    });
    return ok({ user: publicUser(updated) });
  });
}
