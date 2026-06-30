import { prisma } from "@/server/db/prisma";
import { ok, route } from "@/server/http/responses";

export const runtime = "nodejs";

export async function GET() {
  return route(async () => {
    await prisma.$queryRaw`SELECT 1`;
    const latestWorker = await prisma.workerHeartbeat.findFirst({
      orderBy: { seenAt: "desc" },
      select: { workerId: true, status: true, seenAt: true },
    });

    return ok({
      status: "ready",
      database: "reachable",
      latestWorker,
      timestamp: new Date().toISOString(),
    });
  });
}
