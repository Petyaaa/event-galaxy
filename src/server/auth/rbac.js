import { forbidden, notFound } from "@/server/http/errors";
import { prisma } from "@/server/db/prisma";
import { requireUser } from "./session";

export async function requireRole(role) {
  const user = await requireUser();
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) {
    throw forbidden("This action is not available for your role.");
  }
  return user;
}

export async function requireEventOwner(eventId, user) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, organizerId: true },
  });

  if (!event) throw notFound("Event not found.");
  if (event.organizerId !== user.id && user.role !== "ADMIN") {
    throw forbidden("You do not own this event.");
  }
  return event;
}
