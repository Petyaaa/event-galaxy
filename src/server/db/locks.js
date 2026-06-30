export async function lockEvent(tx, eventId) {
  const rows = await tx.$queryRaw`
    SELECT *
    FROM "Event"
    WHERE "id" = ${eventId}
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

export async function lockRegistration(tx, registrationId) {
  const rows = await tx.$queryRaw`
    SELECT *
    FROM "Registration"
    WHERE "id" = ${registrationId}
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

export async function lockNextWaitlisted(tx, eventId) {
  const rows = await tx.$queryRaw`
    SELECT *
    FROM "Registration"
    WHERE "eventId" = ${eventId}
      AND "status" = 'WAITLISTED'
    ORDER BY "waitlistSequence" ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  `;
  return rows[0] ?? null;
}
