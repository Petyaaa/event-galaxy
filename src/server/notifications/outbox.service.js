export async function writeAudit(tx, { actorUserId, action, resourceType, resourceId, metadata = {}, requestId }) {
  return tx.auditLog.create({
    data: {
      actorUserId,
      action,
      resourceType,
      resourceId,
      metadataJson: metadata,
      requestId,
    },
  });
}

function normalizeRecipients(recipients, fallbackUserId) {
  if (!recipients?.length && fallbackUserId) return [{ userId: fallbackUserId }];
  return (recipients ?? []).map((recipient) =>
    typeof recipient === "string" ? { userId: recipient } : recipient,
  );
}

export async function recordDomainEvent(
  tx,
  {
    type,
    aggregateType,
    aggregateId,
    eventId = null,
    userId = null,
    registrationId = null,
    payload = {},
    recipients = [],
  },
) {
  const domainEvent = await tx.domainEvent.create({
    data: {
      type,
      aggregateType,
      aggregateId,
      eventId,
      userId,
      registrationId,
      payloadJson: payload,
    },
  });

  const jobs = normalizeRecipients(recipients, userId).map((recipient, index) => {
    const recipientKey = recipient.userId ?? recipient.email ?? recipient.key ?? `recipient-${index}`;
    return {
      type,
      domainEventId: domainEvent.id,
      eventId,
      userId: recipient.userId ?? null,
      registrationId,
      idempotencyKey: `${type}:${domainEvent.id}:${recipientKey}`,
      payloadJson: {
        ...payload,
        recipientUserId: recipient.userId ?? null,
        channelHint: recipient.channel ?? "IN_APP",
      },
    };
  });

  if (jobs.length > 0) {
    await tx.notificationJob.createMany({ data: jobs, skipDuplicates: true });
  }

  return domainEvent;
}
