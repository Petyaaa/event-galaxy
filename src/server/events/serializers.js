export function serializeUserSummary(user) {
  if (!user) return null;
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
  };
}

export function serializeRegistration(registration) {
  if (!registration) return null;
  return {
    id: registration.id,
    eventId: registration.eventId,
    userId: registration.userId,
    status: registration.status,
    waitlistSequence: registration.waitlistSequence,
    registeredAt: registration.registeredAt,
    confirmedAt: registration.confirmedAt,
    waitlistedAt: registration.waitlistedAt,
    cancelledAt: registration.cancelledAt,
    cancelReason: registration.cancelReason,
    promotedAt: registration.promotedAt,
    checkedInAt: registration.checkedInAt,
    user: serializeUserSummary(registration.user),
  };
}

export function serializeEvent(event, options = {}) {
  if (!event) return null;
  const seatsRemaining = Math.max(event.capacity - event.confirmedCount, 0);
  return {
    id: event.id,
    organizerId: event.organizerId,
    organizer: serializeUserSummary(event.organizer),
    status: event.status,
    title: event.title,
    slug: event.slug,
    description: event.description,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    capacity: event.capacity,
    confirmedCount: event.confirmedCount,
    waitlistCount: event.waitlistCount,
    seatsRemaining,
    locationText: event.locationText,
    meetingUrl: event.meetingUrl,
    tags: event.tags,
    terminal: event.terminal,
    prepNote: event.prepNote,
    publishedAt: event.publishedAt,
    closedAt: event.closedAt,
    cancelledAt: event.cancelledAt,
    cancellationReason: event.cancellationReason,
    version: event.version,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    viewerRegistration: serializeRegistration(options.viewerRegistration),
  };
}
