import { prisma } from "@/server/db/prisma";
import { lockEvent } from "@/server/db/locks";
import { conflict, forbidden, notFound, validationError } from "@/server/http/errors";
import { recordDomainEvent, writeAudit } from "@/server/notifications/outbox.service";
import { serializeEvent, serializeRegistration } from "./serializers";

const eventSelect = {
  organizer: {
    select: {
      id: true,
      displayName: true,
      email: true,
      role: true,
    },
  },
};

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(tx, title, eventId = null) {
  const base = slugify(title) || `event-${crypto.randomUUID().slice(0, 8)}`;
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await tx.event.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === eventId) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function assertOrganizerAccess(event, user) {
  if (!event) throw notFound("Event not found.");
  if (user.role === "ADMIN") return;
  if (event.organizerId !== user.id) throw forbidden("You do not own this event.");
}

function validateEventWindow(data) {
  if (data.endsAt && data.startsAt && data.endsAt <= data.startsAt) {
    throw validationError({ endsAt: ["End time must be after start time."] });
  }
}

async function viewerRegistration(eventId, user) {
  if (!user || user.role !== "STUDENT") return null;
  return prisma.registration.findFirst({
    where: {
      eventId,
      userId: user.id,
      status: { in: ["CONFIRMED", "WAITLISTED", "CHECKED_IN"] },
    },
  });
}

export async function listEvents({ user, filters = {} }) {
  const where = {};
  if (user.role === "STUDENT") {
    where.status = "PUBLISHED";
  } else if (filters.mine === "true" || user.role === "ORGANIZER") {
    where.organizerId = user.id;
    if (filters.status) where.status = filters.status;
  } else if (filters.status) {
    where.status = filters.status;
  }

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { locationText: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  if (filters.tag) {
    where.tags = { has: filters.tag };
  }

  const events = await prisma.event.findMany({
    where,
    include: eventSelect,
    orderBy: [{ startsAt: "asc" }],
    take: filters.limit ?? 50,
  });

  return events.map((event) => serializeEvent(event));
}

export async function getEvent({ eventId, user }) {
  const event = await prisma.event.findFirst({
    where: { OR: [{ id: eventId }, { slug: eventId }] },
    include: eventSelect,
  });

  if (!event) throw notFound("Event not found.");
  if (user.role === "STUDENT" && event.status !== "PUBLISHED") {
    throw notFound("Event not found.");
  }
  if (user.role === "ORGANIZER" && event.organizerId !== user.id && event.status !== "PUBLISHED") {
    throw forbidden("You do not own this event.");
  }

  return serializeEvent(event, { viewerRegistration: await viewerRegistration(event.id, user) });
}

export async function createEvent({ user, data, requestId }) {
  validateEventWindow(data);
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
    throw forbidden("Only organizers can create events.");
  }

  const event = await prisma.$transaction(async (tx) => {
    const created = await tx.event.create({
      data: {
        ...data,
        slug: await uniqueSlug(tx, data.title),
        organizerId: user.id,
        endsAt: data.endsAt ?? null,
      },
      include: eventSelect,
    });

    await writeAudit(tx, {
      actorUserId: user.id,
      action: "EVENT_CREATED",
      resourceType: "Event",
      resourceId: created.id,
      requestId,
    });

    return created;
  });

  return serializeEvent(event);
}

export async function updateEvent({ eventId, user, data, requestId }) {
  validateEventWindow(data);

  const event = await prisma.$transaction(async (tx) => {
    const current = await tx.event.findUnique({ where: { id: eventId } });
    assertOrganizerAccess(current, user);
    if (current.status === "CANCELLED" || current.status === "ARCHIVED") {
      throw conflict("EVENT_LOCKED", "Cancelled or archived events cannot be edited.");
    }
    if (data.capacity !== undefined && data.capacity < current.confirmedCount) {
      throw conflict("CAPACITY_BELOW_CONFIRMED", "Capacity cannot be below the confirmed registration count.");
    }

    const updated = await tx.event.update({
      where: { id: current.id },
      data: {
        ...data,
        slug: data.title ? await uniqueSlug(tx, data.title, current.id) : undefined,
        endsAt: data.endsAt === undefined ? undefined : data.endsAt,
        version: { increment: 1 },
      },
      include: eventSelect,
    });

    await writeAudit(tx, {
      actorUserId: user.id,
      action: "EVENT_UPDATED",
      resourceType: "Event",
      resourceId: updated.id,
      metadata: { fields: Object.keys(data) },
      requestId,
    });

    return updated;
  });

  return serializeEvent(event);
}

export async function publishEvent({ eventId, user, requestId }) {
  const event = await prisma.$transaction(async (tx) => {
    const current = await lockEvent(tx, eventId);
    assertOrganizerAccess(current, user);
    if (current.status !== "DRAFT") {
      throw conflict("EVENT_NOT_DRAFT", "Only draft events can be published.");
    }
    if (current.startsAt <= new Date()) {
      throw conflict("EVENT_IN_PAST", "Events must start in the future before publishing.");
    }

    const updated = await tx.event.update({
      where: { id: current.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        version: { increment: 1 },
      },
      include: eventSelect,
    });

    await recordDomainEvent(tx, {
      type: "EVENT_PUBLISHED",
      aggregateType: "Event",
      aggregateId: updated.id,
      eventId: updated.id,
      userId: user.id,
      payload: {
        eventId: updated.id,
        title: updated.title,
        startsAt: updated.startsAt.toISOString(),
      },
      recipients: [user.id],
    });

    await writeAudit(tx, {
      actorUserId: user.id,
      action: "EVENT_PUBLISHED",
      resourceType: "Event",
      resourceId: updated.id,
      requestId,
    });

    return updated;
  });

  return serializeEvent(event);
}

export async function cancelEvent({ eventId, user, reason, requestId }) {
  const event = await prisma.$transaction(async (tx) => {
    const current = await lockEvent(tx, eventId);
    assertOrganizerAccess(current, user);
    if (current.status === "CANCELLED") {
      throw conflict("EVENT_ALREADY_CANCELLED", "Event is already cancelled.");
    }
    if (current.status === "ARCHIVED") {
      throw conflict("EVENT_ARCHIVED", "Archived events cannot be cancelled.");
    }

    const activeRegistrations = await tx.registration.findMany({
      where: {
        eventId: current.id,
        status: { in: ["CONFIRMED", "WAITLISTED", "CHECKED_IN"] },
      },
      select: { id: true, userId: true, status: true },
    });

    if (activeRegistrations.length > 0) {
      await tx.registration.updateMany({
        where: { id: { in: activeRegistrations.map((registration) => registration.id) } },
        data: {
          status: "CANCELLED_BY_EVENT",
          cancelledAt: new Date(),
          cancelReason: reason,
        },
      });
    }

    const updated = await tx.event.update({
      where: { id: current.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: reason,
        confirmedCount: 0,
        waitlistCount: 0,
        version: { increment: 1 },
      },
      include: eventSelect,
    });

    await recordDomainEvent(tx, {
      type: "EVENT_CANCELLED",
      aggregateType: "Event",
      aggregateId: updated.id,
      eventId: updated.id,
      userId: user.id,
      payload: {
        eventId: updated.id,
        title: updated.title,
        reason,
        affectedRegistrationIds: activeRegistrations.map((registration) => registration.id),
      },
      recipients: activeRegistrations.map((registration) => registration.userId),
    });

    await writeAudit(tx, {
      actorUserId: user.id,
      action: "EVENT_CANCELLED",
      resourceType: "Event",
      resourceId: updated.id,
      metadata: { reason, affected: activeRegistrations.length },
      requestId,
    });

    return updated;
  });

  return serializeEvent(event);
}

export async function listEventRegistrations({ eventId, user, status }) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  assertOrganizerAccess(event, user);

  const registrations = await prisma.registration.findMany({
    where: { eventId, status: { in: status } },
    include: {
      user: { select: { id: true, displayName: true, email: true, role: true } },
    },
    orderBy:
      status.length === 1 && status[0] === "WAITLISTED"
        ? [{ waitlistSequence: "asc" }, { createdAt: "asc" }]
        : [{ confirmedAt: "asc" }, { createdAt: "asc" }],
  });

  return registrations.map(serializeRegistration);
}
