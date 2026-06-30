CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'ORGANIZER', 'ADMIN');
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED', 'ARCHIVED');
CREATE TYPE "RegistrationStatus" AS ENUM ('CONFIRMED', 'WAITLISTED', 'CANCELLED_BY_USER', 'CANCELLED_BY_EVENT', 'CHECKED_IN');
CREATE TYPE "DomainEventType" AS ENUM ('EVENT_PUBLISHED', 'EVENT_CANCELLED', 'EVENT_TIME_CHANGED', 'EVENT_LOCATION_CHANGED', 'REGISTRATION_CONFIRMED', 'REGISTRATION_WAITLISTED', 'REGISTRATION_CANCELLED', 'WAITLIST_PROMOTED', 'SEAT_STEWARD_REMINDER', 'CHECK_IN_COMPLETED');
CREATE TYPE "NotificationJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'SKIPPED');
CREATE TYPE "NotificationChannel" AS ENUM ('LOG', 'EMAIL', 'IN_APP');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "interests" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Event" (
  "id" TEXT NOT NULL,
  "organizerId" TEXT NOT NULL,
  "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "capacity" INTEGER NOT NULL,
  "locationText" TEXT,
  "meetingUrl" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "terminal" TEXT,
  "prepNote" TEXT,
  "publishedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "cancellationReason" TEXT,
  "confirmedCount" INTEGER NOT NULL DEFAULT 0,
  "waitlistCount" INTEGER NOT NULL DEFAULT 0,
  "nextWaitlistSequence" INTEGER NOT NULL DEFAULT 1,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Registration" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "crewCode" TEXT,
  "status" "RegistrationStatus" NOT NULL,
  "waitlistSequence" INTEGER,
  "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedAt" TIMESTAMP(3),
  "waitlistedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "cancelReason" TEXT,
  "promotedAt" TIMESTAMP(3),
  "checkedInAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DomainEvent" (
  "id" TEXT NOT NULL,
  "type" "DomainEventType" NOT NULL,
  "aggregateType" TEXT NOT NULL,
  "aggregateId" TEXT NOT NULL,
  "eventId" TEXT,
  "userId" TEXT,
  "registrationId" TEXT,
  "payloadJson" JSONB NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DomainEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationJob" (
  "id" TEXT NOT NULL,
  "type" "DomainEventType" NOT NULL,
  "status" "NotificationJobStatus" NOT NULL DEFAULT 'PENDING',
  "domainEventId" TEXT NOT NULL,
  "eventId" TEXT,
  "userId" TEXT,
  "registrationId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "payloadJson" JSONB NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  "lockedBy" TEXT,
  "lastError" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationDelivery" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "recipient" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "providerMessageId" TEXT,
  "dedupeKey" TEXT NOT NULL,
  "attempt" INTEGER NOT NULL,
  "responseJson" JSONB,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT,
  "action" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "metadataJson" JSONB,
  "requestId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventBookmark" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventBookmark_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventCrew" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventCrew_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventCrewMember" (
  "id" TEXT NOT NULL,
  "crewId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "visibility" TEXT NOT NULL DEFAULT 'CREW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventCrewMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Trail" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Trail_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrailEvent" (
  "id" TEXT NOT NULL,
  "trailId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "TrailEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrailFollower" (
  "id" TEXT NOT NULL,
  "trailId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrailFollower_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventFeedback" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventFeedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "urgency" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CheckIn" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "registrationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DemoDrillResult" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "capacity" INTEGER NOT NULL,
  "attempts" INTEGER NOT NULL,
  "confirmed" INTEGER NOT NULL,
  "waitlisted" INTEGER NOT NULL,
  "overbooked" INTEGER NOT NULL,
  "duplicates" INTEGER NOT NULL,
  "payloadJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DemoDrillResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkerHeartbeat" (
  "id" TEXT NOT NULL,
  "workerId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metaJson" JSONB,
  CONSTRAINT "WorkerHeartbeat_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
CREATE INDEX "Event_status_startsAt_idx" ON "Event"("status", "startsAt");
CREATE INDEX "Event_organizerId_status_startsAt_idx" ON "Event"("organizerId", "status", "startsAt");
CREATE INDEX "Event_startsAt_idx" ON "Event"("startsAt");
CREATE INDEX "Registration_eventId_status_idx" ON "Registration"("eventId", "status");
CREATE INDEX "Registration_eventId_status_waitlistSequence_idx" ON "Registration"("eventId", "status", "waitlistSequence");
CREATE INDEX "Registration_userId_status_idx" ON "Registration"("userId", "status");
CREATE INDEX "Registration_userId_eventId_idx" ON "Registration"("userId", "eventId");
CREATE INDEX "Registration_crewCode_idx" ON "Registration"("crewCode");
CREATE INDEX "DomainEvent_type_occurredAt_idx" ON "DomainEvent"("type", "occurredAt");
CREATE INDEX "DomainEvent_aggregateType_aggregateId_occurredAt_idx" ON "DomainEvent"("aggregateType", "aggregateId", "occurredAt");
CREATE INDEX "DomainEvent_eventId_occurredAt_idx" ON "DomainEvent"("eventId", "occurredAt");
CREATE UNIQUE INDEX "NotificationJob_idempotencyKey_key" ON "NotificationJob"("idempotencyKey");
CREATE INDEX "NotificationJob_status_availableAt_idx" ON "NotificationJob"("status", "availableAt");
CREATE INDEX "NotificationJob_eventId_createdAt_idx" ON "NotificationJob"("eventId", "createdAt");
CREATE INDEX "NotificationJob_userId_createdAt_idx" ON "NotificationJob"("userId", "createdAt");
CREATE UNIQUE INDEX "NotificationDelivery_dedupeKey_key" ON "NotificationDelivery"("dedupeKey");
CREATE INDEX "NotificationDelivery_jobId_createdAt_idx" ON "NotificationDelivery"("jobId", "createdAt");
CREATE INDEX "AuditLog_resourceType_resourceId_createdAt_idx" ON "AuditLog"("resourceType", "resourceId", "createdAt");
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");
CREATE UNIQUE INDEX "EventBookmark_eventId_userId_key" ON "EventBookmark"("eventId", "userId");
CREATE INDEX "EventBookmark_userId_createdAt_idx" ON "EventBookmark"("userId", "createdAt");
CREATE UNIQUE INDEX "EventCrew_code_key" ON "EventCrew"("code");
CREATE INDEX "EventCrew_eventId_idx" ON "EventCrew"("eventId");
CREATE UNIQUE INDEX "EventCrewMember_crewId_userId_key" ON "EventCrewMember"("crewId", "userId");
CREATE INDEX "EventCrewMember_userId_idx" ON "EventCrewMember"("userId");
CREATE UNIQUE INDEX "Trail_slug_key" ON "Trail"("slug");
CREATE UNIQUE INDEX "TrailEvent_trailId_eventId_key" ON "TrailEvent"("trailId", "eventId");
CREATE INDEX "TrailEvent_eventId_idx" ON "TrailEvent"("eventId");
CREATE UNIQUE INDEX "TrailFollower_trailId_userId_key" ON "TrailFollower"("trailId", "userId");
CREATE INDEX "TrailFollower_userId_idx" ON "TrailFollower"("userId");
CREATE UNIQUE INDEX "EventFeedback_eventId_userId_key" ON "EventFeedback"("eventId", "userId");
CREATE INDEX "EventFeedback_eventId_createdAt_idx" ON "EventFeedback"("eventId", "createdAt");
CREATE UNIQUE INDEX "NotificationPreference_userId_channel_urgency_key" ON "NotificationPreference"("userId", "channel", "urgency");
CREATE UNIQUE INDEX "CheckIn_eventId_userId_key" ON "CheckIn"("eventId", "userId");
CREATE UNIQUE INDEX "CheckIn_code_key" ON "CheckIn"("code");
CREATE UNIQUE INDEX "WorkerHeartbeat_workerId_key" ON "WorkerHeartbeat"("workerId");

CREATE UNIQUE INDEX registration_one_active_per_event_user
ON "Registration" ("eventId", "userId")
WHERE "status" IN ('CONFIRMED', 'WAITLISTED');

CREATE UNIQUE INDEX registration_waitlist_sequence_unique
ON "Registration" ("eventId", "waitlistSequence")
WHERE "waitlistSequence" IS NOT NULL;

ALTER TABLE "Event" ADD CONSTRAINT "Event_capacity_positive" CHECK ("capacity" >= 1);
ALTER TABLE "Event" ADD CONSTRAINT "Event_counts_non_negative" CHECK ("confirmedCount" >= 0 AND "waitlistCount" >= 0);
ALTER TABLE "Event" ADD CONSTRAINT "Event_confirmed_not_above_capacity" CHECK ("confirmedCount" <= "capacity");

ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DomainEvent" ADD CONSTRAINT "DomainEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DomainEvent" ADD CONSTRAINT "DomainEvent_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NotificationJob" ADD CONSTRAINT "NotificationJob_domainEventId_fkey" FOREIGN KEY ("domainEventId") REFERENCES "DomainEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotificationJob" ADD CONSTRAINT "NotificationJob_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NotificationJob" ADD CONSTRAINT "NotificationJob_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "NotificationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventBookmark" ADD CONSTRAINT "EventBookmark_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventBookmark" ADD CONSTRAINT "EventBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventCrew" ADD CONSTRAINT "EventCrew_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventCrewMember" ADD CONSTRAINT "EventCrewMember_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "EventCrew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventCrewMember" ADD CONSTRAINT "EventCrewMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrailEvent" ADD CONSTRAINT "TrailEvent_trailId_fkey" FOREIGN KEY ("trailId") REFERENCES "Trail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrailEvent" ADD CONSTRAINT "TrailEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrailFollower" ADD CONSTRAINT "TrailFollower_trailId_fkey" FOREIGN KEY ("trailId") REFERENCES "Trail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrailFollower" ADD CONSTRAINT "TrailFollower_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventFeedback" ADD CONSTRAINT "EventFeedback_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventFeedback" ADD CONSTRAINT "EventFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
