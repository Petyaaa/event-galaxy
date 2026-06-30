import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const args = new Set(process.argv.slice(2));
const once = args.has("--once");
const workerId = process.env.WORKER_ID || `worker-${process.pid}`;
const batchSize = Number(process.env.WORKER_BATCH_SIZE || 10);
const intervalMs = Number(process.env.WORKER_INTERVAL_MS || 3000);

function backoffMs(attempts) {
  return Math.min(60000, 1000 * 2 ** Math.max(attempts - 1, 0));
}

async function heartbeat(status, meta = {}) {
  await prisma.workerHeartbeat.upsert({
    where: { workerId },
    update: { status, seenAt: new Date(), metaJson: meta },
    create: { workerId, status, metaJson: meta },
  });
}

async function claimJobs() {
  return prisma.$transaction(async (tx) => {
    return tx.$queryRaw`
      UPDATE "NotificationJob"
      SET
        "status" = 'PROCESSING',
        "lockedAt" = NOW(),
        "lockedBy" = ${workerId},
        "attempts" = "attempts" + 1,
        "updatedAt" = NOW()
      WHERE "id" IN (
        SELECT "id"
        FROM "NotificationJob"
        WHERE (
          "status" = 'PENDING'
          AND "availableAt" <= NOW()
        )
        OR (
          "status" = 'PROCESSING'
          AND "lockedAt" < NOW() - interval '2 minutes'
        )
        ORDER BY "availableAt" ASC, "createdAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${batchSize}
      )
      RETURNING *
    `;
  });
}

async function loadDeliveryContext(job) {
  const [event, user, registration] = await Promise.all([
    job.eventId
      ? prisma.event.findUnique({
          where: { id: job.eventId },
          select: { id: true, title: true, startsAt: true, locationText: true, status: true },
        })
      : null,
    job.userId
      ? prisma.user.findUnique({
          where: { id: job.userId },
          select: { id: true, email: true, displayName: true },
        })
      : null,
    job.registrationId
      ? prisma.registration.findUnique({
          where: { id: job.registrationId },
          select: { id: true, status: true, waitlistSequence: true },
        })
      : null,
  ]);
  return { event, user, registration };
}

async function upsertDelivery(job, channel, recipient, responseJson) {
  return prisma.notificationDelivery.upsert({
    where: { dedupeKey: `${job.id}:${channel}` },
    update: {},
    create: {
      jobId: job.id,
      channel,
      recipient,
      status: "SENT",
      providerMessageId: `${channel.toLowerCase()}-${job.id}`,
      dedupeKey: `${job.id}:${channel}`,
      attempt: job.attempts,
      responseJson,
    },
  });
}

async function processJob(job) {
  const context = await loadDeliveryContext(job);
  const recipient = context.user?.email ?? job.payloadJson?.recipientUserId ?? "system";
  const responseJson = {
    type: job.type,
    eventTitle: context.event?.title ?? null,
    registrationStatus: context.registration?.status ?? null,
    deliveredAt: new Date().toISOString(),
  };

  if (job.payloadJson?.forceFailure) {
    throw new Error("Forced delivery failure requested by payload.");
  }

  await upsertDelivery(job, "LOG", recipient, responseJson);
  await upsertDelivery(job, "IN_APP", recipient, responseJson);
  await prisma.notificationJob.update({
    where: { id: job.id },
    data: {
      status: "SENT",
      sentAt: new Date(),
      lockedAt: null,
      lockedBy: null,
      lastError: null,
    },
  });
}

async function failJob(job, error) {
  const attempts = Number(job.attempts);
  const finalFailure = attempts >= job.maxAttempts;
  await prisma.notificationJob.update({
    where: { id: job.id },
    data: {
      status: finalFailure ? "FAILED" : "PENDING",
      availableAt: finalFailure ? job.availableAt : new Date(Date.now() + backoffMs(attempts)),
      lockedAt: null,
      lockedBy: null,
      lastError: error instanceof Error ? error.message : String(error),
    },
  });
}

async function tick() {
  const jobs = await claimJobs();
  await heartbeat("RUNNING", { claimed: jobs.length });
  for (const job of jobs) {
    try {
      await processJob(job);
    } catch (error) {
      await failJob(job, error);
    }
  }
  return jobs.length;
}

async function main() {
  await heartbeat("STARTING");
  do {
    const claimed = await tick();
    if (once) {
      await heartbeat("IDLE", { claimed });
      break;
    }
    if (claimed === 0) await new Promise((resolve) => setTimeout(resolve, intervalMs));
  } while (true);
}

main()
  .catch(async (error) => {
    console.error(error);
    await heartbeat("ERROR", { error: error instanceof Error ? error.message : String(error) }).catch(() => {});
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
