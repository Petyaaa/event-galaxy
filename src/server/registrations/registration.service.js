import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { lockEvent, lockNextWaitlisted, lockRegistration } from "@/server/db/locks";
import { conflict, forbidden, notFound } from "@/server/http/errors";
import { recordDomainEvent, writeAudit } from "@/server/notifications/outbox.service";
import { serializeEvent, serializeRegistration } from "@/server/events/serializers";

const activeStatuses = ["CONFIRMED", "WAITLISTED", "CHECKED_IN"];

function uniqueConflict(error) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function assertStudent(user) {
  if (user.role !== "STUDENT") throw forbidden("Only students can register for events.");
}

async function loadRegistrationWithUser(tx, registrationId) {
  return tx.registration.findUnique({
    where: { id: registrationId },
    include: {
      user: { select: { id: true, displayName: true, email: true, role: true } },
    },
  });
}

export async function registerForEvent({ eventId, user, data = {}, requestId }) {
  assertStudent(user);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const event = await lockEvent(tx, eventId);
      if (!event) throw notFound("Event not found.");
      if (event.status !== "PUBLISHED") {
        throw conflict("EVENT_NOT_OPEN", "This event is not open for registration.");
      }
      if (event.startsAt <= new Date()) {
        throw conflict("EVENT_ALREADY_STARTED", "Registration is closed after the event starts.");
      }

      const existing = await tx.registration.findFirst({
        where: { eventId, userId: user.id, status: { in: activeStatuses } },
      });
      if (existing) {
        throw conflict("ALREADY_REGISTERED", "You already have an active registration for this event.", {
          registrationId: existing.id,
          status: existing.status,
          waitlistSequence: existing.waitlistSequence,
        });
      }

      const hasSeat = event.confirmedCount < event.capacity;
      const status = hasSeat ? "CONFIRMED" : "WAITLISTED";
      const now = new Date();
      const registration = await tx.registration.create({
        data: {
          eventId,
          userId: user.id,
          crewCode: data.crewCode ?? null,
          status,
          confirmedAt: hasSeat ? now : null,
          waitlistedAt: hasSeat ? null : now,
          waitlistSequence: hasSeat ? null : event.nextWaitlistSequence,
        },
      });

      await tx.event.update({
        where: { id: eventId },
        data: hasSeat
          ? { confirmedCount: { increment: 1 }, version: { increment: 1 } }
          : {
              waitlistCount: { increment: 1 },
              nextWaitlistSequence: { increment: 1 },
              version: { increment: 1 },
            },
      });

      await recordDomainEvent(tx, {
        type: hasSeat ? "REGISTRATION_CONFIRMED" : "REGISTRATION_WAITLISTED",
        aggregateType: "Registration",
        aggregateId: registration.id,
        eventId,
        userId: user.id,
        registrationId: registration.id,
        payload: {
          eventId,
          registrationId: registration.id,
          status,
          waitlistSequence: registration.waitlistSequence,
        },
        recipients: [user.id],
      });

      await writeAudit(tx, {
        actorUserId: user.id,
        action: status === "CONFIRMED" ? "REGISTRATION_CONFIRMED" : "REGISTRATION_WAITLISTED",
        resourceType: "Registration",
        resourceId: registration.id,
        requestId,
      });

      return loadRegistrationWithUser(tx, registration.id);
    });

    return serializeRegistration(result);
  } catch (error) {
    if (uniqueConflict(error)) {
      throw conflict("ALREADY_REGISTERED", "You already have an active registration for this event.");
    }
    throw error;
  }
}

export async function cancelRegistration({ registrationId, user, reason = "Cancelled by student", requestId }) {
  const result = await prisma.$transaction(async (tx) => {
    const registration = await lockRegistration(tx, registrationId);
    if (!registration) throw notFound("Registration not found.");

    const event = await lockEvent(tx, registration.eventId);
    if (!event) throw notFound("Event not found.");
    const canManage = user.role === "ADMIN" || (user.role === "ORGANIZER" && event.organizerId === user.id);
    if (registration.userId !== user.id && !canManage) {
      throw forbidden("You cannot cancel this registration.");
    }
    if (!activeStatuses.includes(registration.status)) {
      throw conflict("REGISTRATION_NOT_ACTIVE", "Only active registrations can be cancelled.");
    }
    if (event.startsAt <= new Date() && user.role === "STUDENT") {
      throw conflict("EVENT_ALREADY_STARTED", "Registrations cannot be cancelled after the event starts.");
    }

    const now = new Date();
    const cancelledStatus = canManage && registration.userId !== user.id ? "CANCELLED_BY_EVENT" : "CANCELLED_BY_USER";
    await tx.registration.update({
      where: { id: registration.id },
      data: {
        status: cancelledStatus,
        cancelledAt: now,
        cancelReason: reason,
      },
    });

    let promoted = null;
    let promotedFromSequence = null;
    if (registration.status === "CONFIRMED" || registration.status === "CHECKED_IN") {
      await tx.event.update({
        where: { id: event.id },
        data: { confirmedCount: { decrement: 1 }, version: { increment: 1 } },
      });

      if (event.status === "PUBLISHED") {
        // Lock the first waitlisted row inside the same transaction so promotion is FIFO under concurrency.
        const nextWaitlisted = await lockNextWaitlisted(tx, event.id);
        if (nextWaitlisted) {
          promotedFromSequence = nextWaitlisted.waitlistSequence;
          promoted = await tx.registration.update({
            where: { id: nextWaitlisted.id },
            data: {
              status: "CONFIRMED",
              waitlistSequence: null,
              confirmedAt: now,
              promotedAt: now,
            },
          });
          await tx.event.update({
            where: { id: event.id },
            data: {
              confirmedCount: { increment: 1 },
              waitlistCount: { decrement: 1 },
              version: { increment: 1 },
            },
          });
        }
      }
    } else if (registration.status === "WAITLISTED") {
      await tx.event.update({
        where: { id: event.id },
        data: { waitlistCount: { decrement: 1 }, version: { increment: 1 } },
      });
    }

    await recordDomainEvent(tx, {
      type: "REGISTRATION_CANCELLED",
      aggregateType: "Registration",
      aggregateId: registration.id,
      eventId: event.id,
      userId: registration.userId,
      registrationId: registration.id,
      payload: {
        eventId: event.id,
        registrationId: registration.id,
        previousStatus: registration.status,
        reason,
      },
      recipients: [registration.userId],
    });

    if (promoted) {
      await recordDomainEvent(tx, {
        type: "WAITLIST_PROMOTED",
        aggregateType: "Registration",
        aggregateId: promoted.id,
        eventId: event.id,
        userId: promoted.userId,
        registrationId: promoted.id,
        payload: {
          eventId: event.id,
          registrationId: promoted.id,
          promotedFromSequence,
        },
        recipients: [promoted.userId],
      });
    }

    await writeAudit(tx, {
      actorUserId: user.id,
      action: "REGISTRATION_CANCELLED",
      resourceType: "Registration",
      resourceId: registration.id,
      metadata: { reason, promotedRegistrationId: promoted?.id ?? null },
      requestId,
    });

    return {
      cancelled: await loadRegistrationWithUser(tx, registration.id),
      promoted: promoted ? await loadRegistrationWithUser(tx, promoted.id) : null,
      event: await tx.event.findUnique({ where: { id: event.id }, include: { organizer: true } }),
    };
  });

  return {
    registration: serializeRegistration(result.cancelled),
    promoted: serializeRegistration(result.promoted),
    event: serializeEvent(result.event),
  };
}

export async function listMyRegistrations({ user }) {
  const registrations = await prisma.registration.findMany({
    where: { userId: user.id },
    include: {
      event: {
        include: {
          organizer: { select: { id: true, displayName: true, email: true, role: true } },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return registrations.map((registration) => ({
    ...serializeRegistration(registration),
    event: serializeEvent(registration.event),
  }));
}
