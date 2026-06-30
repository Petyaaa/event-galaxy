import { prisma } from "@/server/db/prisma";
import { forbidden, notFound } from "@/server/http/errors";
import { createEvent, publishEvent } from "@/server/events/event.service";
import { registerForEvent } from "@/server/registrations/registration.service";

function serializeDelivery(delivery) {
  return {
    id: delivery.id,
    jobId: delivery.jobId,
    channel: delivery.channel,
    recipient: delivery.recipient,
    status: delivery.status,
    providerMessageId: delivery.providerMessageId,
    dedupeKey: delivery.dedupeKey,
    attempt: delivery.attempt,
    responseJson: delivery.responseJson,
    error: delivery.error,
    createdAt: delivery.createdAt,
  };
}

export function serializeJob(job) {
  return {
    id: job.id,
    type: job.type,
    status: job.status,
    domainEventId: job.domainEventId,
    eventId: job.eventId,
    userId: job.userId,
    registrationId: job.registrationId,
    idempotencyKey: job.idempotencyKey,
    payloadJson: job.payloadJson,
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
    availableAt: job.availableAt,
    lockedAt: job.lockedAt,
    lockedBy: job.lockedBy,
    lastError: job.lastError,
    sentAt: job.sentAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    event: job.event
      ? {
          id: job.event.id,
          title: job.event.title,
          organizerId: job.event.organizerId,
          status: job.event.status,
        }
      : null,
    domainEvent: job.domainEvent
      ? {
          id: job.domainEvent.id,
          type: job.domainEvent.type,
          occurredAt: job.domainEvent.occurredAt,
        }
      : null,
    deliveries: (job.deliveries ?? []).map(serializeDelivery),
  };
}

function canSeeJob(user, job) {
  if (user.role === "ADMIN") return true;
  if (job.userId === user.id) return true;
  if (user.role === "ORGANIZER" && job.event?.organizerId === user.id) return true;
  return false;
}

export async function listNotificationJobs({ user, filters }) {
  const where = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.eventId ? { eventId: filters.eventId } : {}),
  };

  if (user.role === "STUDENT") {
    where.userId = user.id;
  } else if (user.role === "ORGANIZER") {
    where.event = { organizerId: user.id };
  }

  const jobs = await prisma.notificationJob.findMany({
    where,
    include: {
      event: { select: { id: true, title: true, organizerId: true, status: true } },
      domainEvent: { select: { id: true, type: true, occurredAt: true } },
      deliveries: { orderBy: { createdAt: "desc" } },
    },
    orderBy: [{ createdAt: "desc" }],
    take: filters.limit ?? 50,
  });

  return jobs.map(serializeJob);
}

export async function getNotificationJob({ user, jobId }) {
  const job = await prisma.notificationJob.findUnique({
    where: { id: jobId },
    include: {
      event: { select: { id: true, title: true, organizerId: true, status: true } },
      domainEvent: { select: { id: true, type: true, occurredAt: true } },
      deliveries: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!job) throw notFound("Notification job not found.");
  if (!canSeeJob(user, job)) throw forbidden("You cannot view this notification job.");
  return serializeJob(job);
}

export async function retryNotificationJob({ user, jobId }) {
  const job = await prisma.notificationJob.findUnique({
    where: { id: jobId },
    include: { event: { select: { id: true, organizerId: true } } },
  });
  if (!job) throw notFound("Notification job not found.");
  if (user.role !== "ADMIN" && !(user.role === "ORGANIZER" && job.event?.organizerId === user.id)) {
    throw forbidden("Only event owners can retry notification jobs.");
  }

  const updated = await prisma.notificationJob.update({
    where: { id: jobId },
    data: {
      status: "PENDING",
      availableAt: new Date(),
      lockedAt: null,
      lockedBy: null,
      lastError: null,
    },
    include: {
      event: { select: { id: true, title: true, organizerId: true, status: true } },
      domainEvent: { select: { id: true, type: true, occurredAt: true } },
      deliveries: { orderBy: { createdAt: "desc" } },
    },
  });

  return serializeJob(updated);
}

export async function listMyNotifications({ user }) {
  const deliveries = await prisma.notificationDelivery.findMany({
    where: {
      channel: "IN_APP",
      job: { userId: user.id },
    },
    include: {
      job: {
        include: {
          event: { select: { id: true, title: true, slug: true, startsAt: true, status: true } },
          domainEvent: { select: { id: true, type: true, occurredAt: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return deliveries.map((delivery) => ({
    ...serializeDelivery(delivery),
    job: serializeJob(delivery.job),
  }));
}

export async function proofSnapshot({ user }) {
  if (user.role === "STUDENT") throw forbidden("Proof mode is only available to staff roles.");

  const eventWhere = user.role === "ORGANIZER" ? { organizerId: user.id } : {};
  const jobWhere = user.role === "ORGANIZER" ? { event: { organizerId: user.id } } : {};

  const [eventsByStatus, registrationCounts, jobCounts, domainEvents, jobs, deliveries, heartbeats, drillResults] =
    await Promise.all([
      prisma.event.groupBy({ by: ["status"], where: eventWhere, _count: { _all: true } }),
      prisma.registration.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.notificationJob.groupBy({ by: ["type", "status"], where: jobWhere, _count: { _all: true } }),
      prisma.domainEvent.findMany({
        where: user.role === "ORGANIZER" ? { event: { organizerId: user.id } } : {},
        orderBy: { occurredAt: "desc" },
        take: 20,
      }),
      prisma.notificationJob.findMany({
        where: jobWhere,
        include: {
          event: { select: { id: true, title: true, organizerId: true, status: true } },
          domainEvent: { select: { id: true, type: true, occurredAt: true } },
          deliveries: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.notificationDelivery.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.workerHeartbeat.findMany({ orderBy: { seenAt: "desc" }, take: 5 }),
      prisma.demoDrillResult.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

  const sentJobs = jobCounts.filter((row) => row.status === "SENT").reduce((sum, row) => sum + row._count._all, 0);
  const pendingJobs = jobCounts.filter((row) => row.status === "PENDING").reduce((sum, row) => sum + row._count._all, 0);
  const failedJobs = jobCounts.filter((row) => row.status === "FAILED").reduce((sum, row) => sum + row._count._all, 0);

  return {
    checks: {
      hasPublishedEvents: eventsByStatus.some((row) => row.status === "PUBLISHED" && row._count._all > 0),
      hasWaitlistEvidence: registrationCounts.some((row) => row.status === "WAITLISTED" && row._count._all > 0),
      hasSentDeliveries: deliveries.length > 0 || sentJobs > 0,
      hasWorkerHeartbeat: heartbeats.length > 0,
      hasNoFailedJobs: failedJobs === 0,
    },
    eventsByStatus,
    registrationCounts,
    jobCounts,
    queueSummary: { sentJobs, pendingJobs, failedJobs },
    domainEvents,
    jobs: jobs.map(serializeJob),
    deliveries: deliveries.map(serializeDelivery),
    heartbeats,
    drillResults,
  };
}

async function ensureDemoStudents(count) {
  const existing = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { createdAt: "asc" },
    take: count,
  });
  if (existing.length >= count) return existing;

  const created = [];
  for (let index = existing.length; index < count; index += 1) {
    created.push(
      await prisma.user.create({
        data: {
          email: `drill.student.${crypto.randomUUID().slice(0, 8)}@campuspulse.test`,
          displayName: `Drill Student ${index + 1}`,
          passwordHash: "not-login-enabled",
          role: "STUDENT",
          interests: ["Proof"],
        },
      }),
    );
  }
  return [...existing, ...created];
}

export async function runConcurrencyDrill({ user, data, requestId }) {
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
    throw forbidden("Only staff roles can run concurrency drills.");
  }

  const startsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const event = await createEvent({
    user,
    requestId,
    data: {
      title: `${data.label} ${crypto.randomUUID().slice(0, 6)}`,
      description: "Automated proof event for concurrent registration and waitlist integrity.",
      startsAt,
      capacity: data.capacity,
      locationText: "Concurrency Arena",
      tags: ["Proof", "Reliability"],
      terminal: "Ops",
      prepNote: "Generated by Proof Mode.",
    },
  });
  await publishEvent({ eventId: event.id, user, requestId });

  const students = await ensureDemoStudents(data.attempts);
  const attempts = await Promise.allSettled(
    students.slice(0, data.attempts).map((student) =>
      registerForEvent({ eventId: event.id, user: student, data: {}, requestId }),
    ),
  );

  const registrations = await prisma.registration.findMany({ where: { eventId: event.id } });
  const confirmed = registrations.filter((registration) => registration.status === "CONFIRMED").length;
  const waitlisted = registrations.filter((registration) => registration.status === "WAITLISTED").length;
  const duplicates = attempts.filter(
    (attempt) => attempt.status === "rejected" && attempt.reason?.code === "ALREADY_REGISTERED",
  ).length;
  const overbooked = Math.max(confirmed - data.capacity, 0);
  const payload = {
    eventId: event.id,
    attempts: attempts.map((attempt, index) => ({
      studentId: students[index].id,
      ok: attempt.status === "fulfilled",
      status: attempt.status === "fulfilled" ? attempt.value.status : null,
      error: attempt.status === "rejected" ? attempt.reason?.code ?? attempt.reason?.message : null,
    })),
    registrations,
  };

  const result = await prisma.demoDrillResult.create({
    data: {
      label: data.label,
      capacity: data.capacity,
      attempts: data.attempts,
      confirmed,
      waitlisted,
      overbooked,
      duplicates,
      payloadJson: payload,
    },
  });

  return result;
}
