# CampusPulse: Extreme School Events & Notification Center Design

## 0. Project identity

**Application name:** CampusPulse

**Pitch:** CampusPulse is not a basic school event CRUD app. It is a live operating system for campus experiences. Students see a real-time event galaxy, transparent seat/waitlist status, personalized event recommendations, and in-app/email notifications. Organizers get a command center with draft previews, waitlist fairness, delivery logs, registration analytics, and async notification reliability.

**Core competition angle:** The app proves fairness and reliability. Every seat movement is written to a ledger, every important state change becomes a domain event, and every notification is processed by a separate worker with retries and idempotency. The result feels polished while still matching the assignment exactly.

**Primary stack:**

- Backend: Node.js, TypeScript, Express or Fastify.
- Database: PostgreSQL.
- ORM: Prisma.
- Auth: Email/password with Argon2id or bcrypt, JWT access token plus refresh token, preferably httpOnly cookies.
- Queue: PostgreSQL transactional outbox using `notification_jobs`.
- Worker: Separate Node.js process polling jobs with `FOR UPDATE SKIP LOCKED`.
- Frontend: Next.js or Vite React.
- Validation: Zod.
- Email: SMTP, Resend, SendGrid, Mailtrap, or log-only adapter in development.

---

## 1. Product concept

### 1.1 What the app does

CampusPulse lets school organizers publish events with limited capacity. Students register. If seats are available, they become confirmed. If the event is full, they join a FIFO waitlist. When a confirmed student cancels, the next waitlisted student is promoted automatically. Important changes produce domain events and queued notification jobs so the HTTP request stays fast.

### 1.2 What makes it novel

Most event systems only show a list of events. CampusPulse adds the following competition-grade features:

1. **FairSeat Ledger**
   - Every registration transition is stored.
   - Students can see their own waitlist position and movement history.
   - Organizers cannot secretly reorder the waitlist because the FIFO sequence is persisted.

2. **PulseScore**
   - Event cards show pressure: open seats, waitlist size, fill percentage, and fill velocity.
   - Example labels: `Fresh`, `Filling Fast`, `Almost Full`, `Waitlist Active`.
   - This is rule-based and easy to implement.

3. **Event Galaxy**
   - Tags, time, and popularity create a visual catalog.
   - Students can filter by club, lecture, workshop, sport, career, art, wellness, and date.

4. **Organizer Command Center**
   - Draft/published/cancelled event tabs.
   - Student-preview mode before publish.
   - Registration funnel and waitlist view.
   - Notification job status dashboard.

5. **Pulse Notifications**
   - Email plus in-app notification log.
   - Jobs show `pending`, `processing`, `sent`, and `failed`.
   - Retried safely with idempotency keys.

6. **Check-in and proof of attendance**
   - Optional QR check-in for confirmed students.
   - Students earn a simple attendance trail.
   - Organizers see who actually arrived.

7. **Campus Passport**
   - Optional gamification.
   - Students unlock badges for attending categories.
   - Example: `Workshop Explorer`, `Club Sampler`, `Career Sprint`.

These features are intentionally achievable. Do not build fake AI or huge infrastructure. The winning idea is a clean system with visible reliability.

---

## 2. Required scope mapping

| Requirement area | CampusPulse implementation |
|---|---|
| Auth and roles | `User.role` supports `STUDENT`, `ORGANIZER`, `ADMIN`. Middleware enforces role and ownership. |
| Event catalog | Organizers create/edit drafts. Students see only published events. Organizer owns events. |
| Publish flow | `DRAFT -> PUBLISHED`, creates `EVENT_PUBLISHED` domain event. |
| Cancel flow | `PUBLISHED/DRAFT/CLOSED -> CANCELLED`, blocks new registrations, cancels active registrations, queues notifications. |
| Registration | Student registers once per event. Confirmed if capacity exists, otherwise waitlisted. |
| No overbooking | Event row is locked inside a transaction. Confirmed count is checked while locked. |
| Waitlist FIFO | `waitlistSequence` is assigned under event lock. Promotion picks lowest sequence. |
| Student cancellation | Student may cancel until event start. If confirmed, next waitlisted student is promoted. |
| Organizer lists | Confirmed list and waitlist list for own events only. |
| Domain events | `DomainEvent` table stores facts that happened. |
| Queue | `NotificationJob` table acts as transactional outbox. |
| Worker | Separate process consumes jobs and sends/logs notifications. |
| Three event types | At minimum: `REGISTRATION_CONFIRMED`, `REGISTRATION_WAITLISTED`, `WAITLIST_PROMOTED`. |
| Reliability | Job status, attempts, max attempts, backoff, delivery logs, idempotency key. |
| Security | Password hash, Zod validation, Prisma parameterization, ownership checks. |
| Scalability | Indexes, pagination, queue polling with skip locked, denormalized event counts. |

---

## 3. User roles and permissions

### 3.1 Student

A student can:

- Register and log in.
- Browse published events.
- View event details.
- Register for a published event.
- Become confirmed or waitlisted.
- Cancel their own registration before event start.
- View only their own registrations.
- View own in-app notifications.
- Update own profile.
- Bookmark events.
- Follow organizers.
- Check in to events if confirmed.

A student cannot:

- Create events.
- Edit events.
- Publish or cancel events.
- View another student's registrations.
- View organizer job logs unless the job belongs to their own notification.
- See draft events unless using a public preview token generated by an organizer.

### 3.2 Organizer

An organizer can:

- Log in.
- Create draft events.
- Edit their own draft events.
- Preview their own drafts as students would see them.
- Publish their own events.
- Cancel or close their own events.
- View confirmed registrations for their own events.
- View ordered waitlists for their own events.
- View notification jobs for their own events.
- View event analytics.

An organizer cannot:

- Register as a student for events using the same organizer account.
- Edit another organizer's event.
- View another organizer's private event data.
- See unrelated users' registrations.

### 3.3 Admin

Optional. Useful for seeding and debugging.

An admin can:

- Create organizer accounts.
- View system health.
- View all notification jobs.
- Requeue failed jobs.
- Moderate events.

Keep admin out of the main demo unless it is polished.

---

## 4. State machines

### 4.1 Event status state machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> PUBLISHED: publish
    DRAFT --> CANCELLED: cancel draft
    PUBLISHED --> CLOSED: close registration
    PUBLISHED --> CANCELLED: cancel event
    CLOSED --> CANCELLED: cancel event
    CLOSED --> ARCHIVED: archive after event
    CANCELLED --> ARCHIVED: archive later
```

Rules:

- `DRAFT`: editable by owner. Not visible to students.
- `PUBLISHED`: visible to students. Registration is allowed until `startsAt` unless event is full, in which case waitlist applies.
- `CLOSED`: visible but no new registrations. Used when organizer wants to stop registration without cancelling.
- `CANCELLED`: visible with cancellation message. No new registration. Active registrations become `CANCELLED_BY_EVENT`.
- `ARCHIVED`: read-only historic state.

### 4.2 Registration status state machine

```mermaid
stateDiagram-v2
    [*] --> CONFIRMED: seat available
    [*] --> WAITLISTED: event full
    WAITLISTED --> CONFIRMED: automatic promotion
    CONFIRMED --> CANCELLED_BY_USER: student cancels
    WAITLISTED --> CANCELLED_BY_USER: student cancels
    CONFIRMED --> CANCELLED_BY_EVENT: event cancelled
    WAITLISTED --> CANCELLED_BY_EVENT: event cancelled
    CONFIRMED --> CHECKED_IN: student checks in
    CONFIRMED --> NO_SHOW: event passed, no check-in
```

Rules:

- `CONFIRMED` counts against capacity.
- `WAITLISTED` does not count against capacity.
- `CANCELLED_BY_USER` and `CANCELLED_BY_EVENT` are inactive.
- `CHECKED_IN` counts as confirmed attendance but event is already in progress or completed.
- `NO_SHOW` is optional and can be marked by a scheduled job after event end.

---

## 5. Architecture

### 5.1 High-level architecture

```mermaid
flowchart LR
    Web[React/Next.js Web App]
    API[HTTP API Process]
    DB[(PostgreSQL + Prisma)]
    Worker[Worker Process]
    Email[Email Provider or Log Adapter]
    Browser[Student/Organizer Browser]

    Browser --> Web
    Web --> API
    API --> DB
    API -->|insert domain events + jobs| DB
    Worker -->|poll pending jobs| DB
    Worker --> Email
    Worker -->|write delivery logs + in-app notifications| DB
```

### 5.2 Runtime processes

1. **API process**
   - Handles HTTP requests.
   - Validates input.
   - Enforces auth, roles, and ownership.
   - Executes business transactions.
   - Inserts domain events and notification jobs.
   - Does not send email directly.

2. **Worker process**
   - Runs separately from the API.
   - Polls `notification_jobs`.
   - Locks jobs with `FOR UPDATE SKIP LOCKED`.
   - Sends email or logs messages.
   - Creates in-app notifications.
   - Writes delivery records.
   - Retries failures.

3. **PostgreSQL**
   - Source of truth for users, events, registrations, jobs, and logs.
   - Also acts as the queue for this project.

4. **Frontend**
   - Role-based navigation.
   - Student event discovery.
   - Organizer command center.
   - Live-ish refresh using polling or Server-Sent Events.

### 5.3 Recommended repo structure

```txt
campuspulse/
  apps/
    api/
      src/
        app.ts
        server.ts
        routes/
          auth.routes.ts
          events.routes.ts
          registrations.routes.ts
          notifications.routes.ts
          users.routes.ts
          health.routes.ts
        controllers/
        services/
          auth.service.ts
          event.service.ts
          registration.service.ts
          notification.service.ts
          recommendation.service.ts
        middleware/
          requireAuth.ts
          requireRole.ts
          errorHandler.ts
          requestId.ts
          rateLimit.ts
        validators/
          auth.schemas.ts
          event.schemas.ts
          registration.schemas.ts
        lib/
          prisma.ts
          password.ts
          jwt.ts
          errors.ts
          pagination.ts
      package.json
    worker/
      src/
        worker.ts
        jobPoller.ts
        handlers/
          registrationConfirmed.handler.ts
          registrationWaitlisted.handler.ts
          waitlistPromoted.handler.ts
          eventCancelled.handler.ts
        notificationAdapters/
          email.adapter.ts
          log.adapter.ts
          inApp.adapter.ts
      package.json
    web/
      src/
        app/
        components/
        features/
          student/
          organizer/
          auth/
          notifications/
        lib/api.ts
      package.json
  packages/
    db/
      prisma/
        schema.prisma
        migrations/
      src/client.ts
    shared/
      src/
        types.ts
        constants.ts
        api-contracts.ts
  docker-compose.yml
  README.md
  .env.example
```

---

## 6. Database design overview

### 6.1 Design principles

1. **One registration row per student per event**
   - `@@unique([eventId, studentId])` prevents duplicate active registrations.
   - If a student cancels and registers again, update the same row instead of inserting a duplicate.
   - Transition history is stored in `RegistrationTransition`.

2. **Event row lock controls capacity**
   - Registration and cancellation transactions lock the event row.
   - This serializes capacity decisions per event.
   - No event can exceed confirmed capacity.

3. **FIFO waitlist is sequence-based**
   - `Event.waitlistCounter` increments under lock.
   - A waitlisted registration receives `waitlistSequence`.
   - Promotion always picks the smallest active `waitlistSequence`.

4. **Domain events are facts**
   - Example: `REGISTRATION_CONFIRMED` means the registration already became confirmed.
   - Events carry ids and structured metadata.
   - They do not contain untrusted email body text.

5. **Notification jobs are work items**
   - The API inserts jobs after business state changes.
   - The worker consumes jobs later.
   - Each job has a unique `idempotencyKey`.

6. **Delivery logs prove work happened**
   - `NotificationDelivery` records email/log/in-app attempts.
   - Useful for grading and demo.

7. **Denormalized counts are caches**
   - `Event.confirmedCount` and `Event.waitlistCount` make list pages fast.
   - Registration rows remain the source of truth.
   - Updates happen inside the same transaction as registration changes.

---

## 7. Entity relationship diagram

```mermaid
erDiagram
    User ||--o{ Event : organizes
    User ||--o{ Registration : creates
    User ||--o{ Session : owns
    User ||--|| UserPreference : configures
    User ||--o{ InAppNotification : receives
    User ||--o{ NotificationJob : receives
    User ||--o{ NotificationDelivery : receives
    User ||--o{ SavedEvent : bookmarks
    User ||--o{ OrganizerFollower : follows
    Venue ||--o{ Event : hosts
    Event ||--o{ Registration : has
    Event ||--o{ EventTag : tagged_by
    Tag ||--o{ EventTag : applied_to
    Event ||--o{ DomainEvent : emits
    Registration ||--o{ RegistrationTransition : changes
    DomainEvent ||--o{ NotificationJob : creates
    NotificationJob ||--o{ NotificationDelivery : produces
    Event ||--o{ CheckIn : has
    Registration ||--o| CheckIn : checked_in_by
    Event ||--o{ EventStatsSnapshot : measured_by
```

---

## 8. Prisma schema

Save this as `packages/db/prisma/schema.prisma`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  STUDENT
  ORGANIZER
  ADMIN
}

enum EventStatus {
  DRAFT
  PUBLISHED
  CLOSED
  CANCELLED
  ARCHIVED
}

enum EventVisibility {
  PUBLIC
  INVITE_ONLY
}

enum RegistrationStatus {
  CONFIRMED
  WAITLISTED
  CANCELLED_BY_USER
  CANCELLED_BY_EVENT
  CHECKED_IN
  NO_SHOW
}

enum DomainEventType {
  USER_REGISTERED
  EVENT_CREATED
  EVENT_PUBLISHED
  EVENT_UPDATED
  EVENT_CANCELLED
  CAPACITY_CHANGED
  REGISTRATION_CONFIRMED
  REGISTRATION_WAITLISTED
  REGISTRATION_CANCELLED
  WAITLIST_PROMOTED
  CHECK_IN_CREATED
  NOTIFICATION_DELIVERED
}

enum NotificationJobStatus {
  PENDING
  PROCESSING
  SENT
  FAILED
  CANCELLED
}

enum NotificationChannel {
  EMAIL
  IN_APP
  LOG
}

enum NotificationDeliveryStatus {
  SKIPPED
  SENT
  FAILED
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  PUBLISH
  CANCEL
  REGISTER
  CANCEL_REGISTRATION
  PROMOTE
  CHECK_IN
  LOGIN
  LOGOUT
}

enum CheckInSource {
  QR
  MANUAL
  SELF
}

model User {
  id           String    @id @default(uuid()) @db.Uuid
  email        String    @unique @db.VarChar(320)
  passwordHash String    @map("password_hash") @db.Text
  role         UserRole  @default(STUDENT)
  displayName  String    @map("display_name") @db.VarChar(100)
  bio          String?   @db.VarChar(280)
  avatarUrl    String?   @map("avatar_url") @db.Text
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  organizedEvents              Event[]                  @relation("EventOrganizer")
  registrations                Registration[]
  sessions                     Session[]
  preferences                  UserPreference?
  inAppNotifications           InAppNotification[]
  notificationJobs             NotificationJob[]         @relation("NotificationRecipient")
  notificationDeliveries       NotificationDelivery[]    @relation("NotificationDeliveryUser")
  checkIns                     CheckIn[]                 @relation("StudentCheckIns")
  checkInsPerformed            CheckIn[]                 @relation("CheckInBy")
  bookmarks                    SavedEvent[]              @relation("StudentSavedEvents")
  studentFollows               OrganizerFollower[]       @relation("StudentFollows")
  organizerFollowers           OrganizerFollower[]       @relation("OrganizerFollowed")
  actedRegistrationTransitions RegistrationTransition[]  @relation("TransitionActor")
  auditLogs                    AuditLog[]                @relation("AuditActor")
  domainEvents                 DomainEvent[]             @relation("DomainEventUser")

  @@index([role])
  @@index([createdAt])
  @@map("users")
}

model UserPreference {
  userId          String   @id @map("user_id") @db.Uuid
  emailEnabled    Boolean  @default(true) @map("email_enabled")
  inAppEnabled    Boolean  @default(true) @map("in_app_enabled")
  digestEnabled   Boolean  @default(false) @map("digest_enabled")
  preferredTags   String[] @default([]) @map("preferred_tags")
  quietHoursStart String?  @map("quiet_hours_start") @db.VarChar(5)
  quietHoursEnd   String?  @map("quiet_hours_end") @db.VarChar(5)
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_preferences")
}

model Session {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  tokenHash String    @unique @map("token_hash") @db.Text
  userAgent String?   @map("user_agent") @db.Text
  ipHash    String?   @map("ip_hash") @db.Text
  expiresAt DateTime  @map("expires_at")
  revokedAt DateTime? @map("revoked_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("sessions")
}

model Venue {
  id           String   @id @default(uuid()) @db.Uuid
  name         String   @db.VarChar(140)
  campusZone   String?  @map("campus_zone") @db.VarChar(80)
  building     String?  @db.VarChar(120)
  room         String?  @db.VarChar(80)
  capacityHint Int?     @map("capacity_hint")
  mapUrl       String?  @map("map_url") @db.Text
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  events Event[]

  @@index([campusZone])
  @@map("venues")
}

model Event {
  id                 String          @id @default(uuid()) @db.Uuid
  organizerId        String          @map("organizer_id") @db.Uuid
  venueId            String?         @map("venue_id") @db.Uuid
  title              String          @db.VarChar(140)
  slug               String          @unique @db.VarChar(180)
  description        String          @db.Text
  status             EventStatus     @default(DRAFT)
  visibility         EventVisibility @default(PUBLIC)
  startsAt           DateTime        @map("starts_at")
  endsAt             DateTime        @map("ends_at")
  capacity           Int
  locationText       String?         @map("location_text") @db.VarChar(240)
  meetingUrl         String?         @map("meeting_url") @db.Text
  coverImageUrl      String?         @map("cover_image_url") @db.Text
  previewToken       String?         @unique @map("preview_token") @db.VarChar(80)
  cancellationReason String?         @map("cancellation_reason") @db.Text
  publishedAt        DateTime?       @map("published_at")
  cancelledAt        DateTime?       @map("cancelled_at")
  closedAt           DateTime?       @map("closed_at")

  waitlistCounter Int @default(0) @map("waitlist_counter")
  confirmedCount  Int @default(0) @map("confirmed_count")
  waitlistCount   Int @default(0) @map("waitlist_count")
  viewCount       Int @default(0) @map("view_count")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  organizer           User                     @relation("EventOrganizer", fields: [organizerId], references: [id], onDelete: Cascade)
  venue               Venue?                   @relation(fields: [venueId], references: [id], onDelete: SetNull)
  registrations       Registration[]
  registrationChanges RegistrationTransition[]
  tags                EventTag[]
  domainEvents        DomainEvent[]
  notificationJobs    NotificationJob[]
  inAppNotifications  InAppNotification[]
  checkIns            CheckIn[]
  savedBy             SavedEvent[]
  auditLogs           AuditLog[]
  statsSnapshots      EventStatsSnapshot[]

  @@index([status, startsAt])
  @@index([organizerId, status])
  @@index([startsAt])
  @@index([createdAt])
  @@map("events")
}

model Tag {
  id        String   @id @default(uuid()) @db.Uuid
  name      String   @unique @db.VarChar(40)
  icon      String?  @db.VarChar(40)
  colorKey  String?  @map("color_key") @db.VarChar(40)
  createdAt DateTime @default(now()) @map("created_at")

  events EventTag[]

  @@map("tags")
}

model EventTag {
  eventId    String   @map("event_id") @db.Uuid
  tagId      String   @map("tag_id") @db.Uuid
  assignedAt DateTime @default(now()) @map("assigned_at")

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  tag   Tag   @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([eventId, tagId])
  @@index([tagId])
  @@map("event_tags")
}

model Registration {
  id                 String             @id @default(uuid()) @db.Uuid
  eventId            String             @map("event_id") @db.Uuid
  studentId          String             @map("student_id") @db.Uuid
  status             RegistrationStatus
  registeredAt       DateTime           @default(now()) @map("registered_at")
  confirmedAt        DateTime?          @map("confirmed_at")
  waitlistedAt       DateTime?          @map("waitlisted_at")
  waitlistSequence   Int?               @map("waitlist_sequence")
  promotedAt         DateTime?          @map("promoted_at")
  cancelledAt        DateTime?          @map("cancelled_at")
  cancellationReason String?            @map("cancellation_reason") @db.Text
  checkedInAt        DateTime?          @map("checked_in_at")
  idempotencyKey     String?            @unique @map("idempotency_key") @db.VarChar(160)
  createdAt          DateTime           @default(now()) @map("created_at")
  updatedAt          DateTime           @updatedAt @map("updated_at")

  event        Event                    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  student      User                     @relation(fields: [studentId], references: [id], onDelete: Cascade)
  transitions  RegistrationTransition[]
  domainEvents DomainEvent[]
  jobs         NotificationJob[]
  checkIn      CheckIn?

  @@unique([eventId, studentId])
  @@unique([eventId, waitlistSequence])
  @@index([studentId, status])
  @@index([eventId, status])
  @@index([eventId, status, waitlistSequence])
  @@map("registrations")
}

model RegistrationTransition {
  id             String              @id @default(uuid()) @db.Uuid
  registrationId String              @map("registration_id") @db.Uuid
  eventId        String              @map("event_id") @db.Uuid
  actorId        String?             @map("actor_id") @db.Uuid
  fromStatus     RegistrationStatus? @map("from_status")
  toStatus       RegistrationStatus  @map("to_status")
  reason         String?             @db.Text
  createdAt      DateTime            @default(now()) @map("created_at")

  registration Registration @relation(fields: [registrationId], references: [id], onDelete: Cascade)
  event        Event        @relation(fields: [eventId], references: [id], onDelete: Cascade)
  actor        User?        @relation("TransitionActor", fields: [actorId], references: [id], onDelete: SetNull)

  @@index([registrationId, createdAt])
  @@index([eventId, createdAt])
  @@index([actorId])
  @@map("registration_transitions")
}

model DomainEvent {
  id             String          @id @default(uuid()) @db.Uuid
  type           DomainEventType
  aggregateType  String          @map("aggregate_type") @db.VarChar(80)
  aggregateId    String          @map("aggregate_id") @db.Uuid
  eventId        String?         @map("event_id") @db.Uuid
  userId         String?         @map("user_id") @db.Uuid
  registrationId String?         @map("registration_id") @db.Uuid
  payload        Json            @default("{}")
  occurredAt     DateTime        @default(now()) @map("occurred_at")
  createdAt      DateTime        @default(now()) @map("created_at")

  event        Event?            @relation(fields: [eventId], references: [id], onDelete: SetNull)
  user         User?             @relation("DomainEventUser", fields: [userId], references: [id], onDelete: SetNull)
  registration Registration?     @relation(fields: [registrationId], references: [id], onDelete: SetNull)
  jobs         NotificationJob[]

  @@index([type, occurredAt])
  @@index([aggregateType, aggregateId])
  @@index([eventId])
  @@index([registrationId])
  @@map("domain_events")
}

model NotificationJob {
  id             String                @id @default(uuid()) @db.Uuid
  domainEventId  String?               @map("domain_event_id") @db.Uuid
  eventId        String?               @map("event_id") @db.Uuid
  registrationId String?               @map("registration_id") @db.Uuid
  recipientId    String?               @map("recipient_id") @db.Uuid
  type           DomainEventType
  channel        NotificationChannel
  status         NotificationJobStatus @default(PENDING)
  attempts       Int                   @default(0)
  maxAttempts    Int                   @default(5) @map("max_attempts")
  idempotencyKey String                @unique @map("idempotency_key") @db.VarChar(220)
  payload        Json                  @default("{}")
  runAt          DateTime              @default(now()) @map("run_at")
  lockedAt       DateTime?             @map("locked_at")
  lockedBy       String?               @map("locked_by") @db.VarChar(80)
  sentAt         DateTime?             @map("sent_at")
  failedAt       DateTime?             @map("failed_at")
  lastError      String?               @map("last_error") @db.Text
  createdAt      DateTime              @default(now()) @map("created_at")
  updatedAt      DateTime              @updatedAt @map("updated_at")

  domainEvent  DomainEvent?           @relation(fields: [domainEventId], references: [id], onDelete: SetNull)
  event        Event?                 @relation(fields: [eventId], references: [id], onDelete: SetNull)
  registration Registration?          @relation(fields: [registrationId], references: [id], onDelete: SetNull)
  recipient    User?                  @relation("NotificationRecipient", fields: [recipientId], references: [id], onDelete: SetNull)
  deliveries   NotificationDelivery[]

  @@index([status, runAt])
  @@index([eventId, status])
  @@index([recipientId, status])
  @@index([createdAt])
  @@map("notification_jobs")
}

model NotificationDelivery {
  id                String                     @id @default(uuid()) @db.Uuid
  jobId             String                     @map("job_id") @db.Uuid
  userId            String?                    @map("user_id") @db.Uuid
  channel           NotificationChannel
  status            NotificationDeliveryStatus
  provider          String?                    @db.VarChar(80)
  providerMessageId String?                    @map("provider_message_id") @db.VarChar(160)
  responseMeta      Json?                      @map("response_meta")
  error             String?                    @db.Text
  createdAt         DateTime                   @default(now()) @map("created_at")

  job  NotificationJob @relation(fields: [jobId], references: [id], onDelete: Cascade)
  user User?           @relation("NotificationDeliveryUser", fields: [userId], references: [id], onDelete: SetNull)

  @@unique([jobId, channel])
  @@index([userId, createdAt])
  @@map("notification_deliveries")
}

model InAppNotification {
  id             String          @id @default(uuid()) @db.Uuid
  userId         String          @map("user_id") @db.Uuid
  eventId        String?         @map("event_id") @db.Uuid
  registrationId String?         @map("registration_id") @db.Uuid
  type           DomainEventType
  title          String          @db.VarChar(160)
  body           String          @db.Text
  data           Json            @default("{}")
  readAt         DateTime?       @map("read_at")
  createdAt      DateTime        @default(now()) @map("created_at")

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  event Event? @relation(fields: [eventId], references: [id], onDelete: SetNull)

  @@index([userId, readAt, createdAt])
  @@index([eventId])
  @@map("in_app_notifications")
}

model SavedEvent {
  studentId String   @map("student_id") @db.Uuid
  eventId   String   @map("event_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  student User  @relation("StudentSavedEvents", fields: [studentId], references: [id], onDelete: Cascade)
  event   Event @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@id([studentId, eventId])
  @@index([eventId])
  @@map("saved_events")
}

model OrganizerFollower {
  id          String   @id @default(uuid()) @db.Uuid
  studentId   String   @map("student_id") @db.Uuid
  organizerId String   @map("organizer_id") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")

  student   User @relation("StudentFollows", fields: [studentId], references: [id], onDelete: Cascade)
  organizer User @relation("OrganizerFollowed", fields: [organizerId], references: [id], onDelete: Cascade)

  @@unique([studentId, organizerId])
  @@index([organizerId])
  @@map("organizer_followers")
}

model CheckIn {
  id             String        @id @default(uuid()) @db.Uuid
  eventId        String        @map("event_id") @db.Uuid
  registrationId String        @unique @map("registration_id") @db.Uuid
  studentId      String        @map("student_id") @db.Uuid
  checkedInById  String?       @map("checked_in_by_id") @db.Uuid
  source         CheckInSource @default(QR)
  qrNonceHash    String?       @map("qr_nonce_hash") @db.Text
  createdAt      DateTime      @default(now()) @map("created_at")

  event        Event        @relation(fields: [eventId], references: [id], onDelete: Cascade)
  registration Registration @relation(fields: [registrationId], references: [id], onDelete: Cascade)
  student      User         @relation("StudentCheckIns", fields: [studentId], references: [id], onDelete: Cascade)
  checkedInBy  User?        @relation("CheckInBy", fields: [checkedInById], references: [id], onDelete: SetNull)

  @@index([eventId, createdAt])
  @@index([studentId, createdAt])
  @@map("check_ins")
}

model EventStatsSnapshot {
  id                    String   @id @default(uuid()) @db.Uuid
  eventId               String   @map("event_id") @db.Uuid
  capturedAt            DateTime @default(now()) @map("captured_at")
  confirmedCount         Int      @map("confirmed_count")
  waitlistCount          Int      @map("waitlist_count")
  viewCount              Int      @map("view_count")
  registrationsLastHour  Int      @default(0) @map("registrations_last_hour")
  fillRateScore          Int      @default(0) @map("fill_rate_score")

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@index([eventId, capturedAt])
  @@map("event_stats_snapshots")
}

model AuditLog {
  id           String      @id @default(uuid()) @db.Uuid
  actorId      String?     @map("actor_id") @db.Uuid
  action       AuditAction
  resourceType String      @map("resource_type") @db.VarChar(80)
  resourceId   String?     @map("resource_id") @db.Uuid
  eventId      String?     @map("event_id") @db.Uuid
  before       Json?
  after        Json?
  ipHash       String?     @map("ip_hash") @db.Text
  userAgent    String?     @map("user_agent") @db.Text
  createdAt    DateTime    @default(now()) @map("created_at")

  actor User?  @relation("AuditActor", fields: [actorId], references: [id], onDelete: SetNull)
  event Event? @relation(fields: [eventId], references: [id], onDelete: SetNull)

  @@index([actorId, createdAt])
  @@index([eventId, createdAt])
  @@index([resourceType, resourceId])
  @@map("audit_logs")
}
```

---

## 9. Extra SQL migration required after Prisma migration

Prisma schema is not enough for every Postgres constraint or partial index. Add a migration file after the generated Prisma migration.

```sql
-- Capacity and time correctness.
ALTER TABLE events
  ADD CONSTRAINT events_capacity_positive CHECK (capacity >= 1);

ALTER TABLE events
  ADD CONSTRAINT events_time_order CHECK (ends_at > starts_at);

-- A waitlisted row must have a FIFO sequence.
ALTER TABLE registrations
  ADD CONSTRAINT registrations_waitlisted_sequence_required
  CHECK (status <> 'WAITLISTED' OR waitlist_sequence IS NOT NULL);

-- Fast capacity checks.
CREATE INDEX IF NOT EXISTS registrations_confirmed_by_event_idx
  ON registrations(event_id)
  WHERE status IN ('CONFIRMED', 'CHECKED_IN');

-- Fast FIFO promotion.
CREATE INDEX IF NOT EXISTS registrations_waitlist_fifo_idx
  ON registrations(event_id, waitlist_sequence, registered_at)
  WHERE status = 'WAITLISTED';

-- Fast student dashboard.
CREATE INDEX IF NOT EXISTS registrations_student_active_idx
  ON registrations(student_id, event_id)
  WHERE status IN ('CONFIRMED', 'WAITLISTED', 'CHECKED_IN');

-- Fast job polling.
CREATE INDEX IF NOT EXISTS notification_jobs_pending_dequeue_idx
  ON notification_jobs(status, run_at, created_at)
  WHERE status = 'PENDING';

-- Fast failed job dashboard.
CREATE INDEX IF NOT EXISTS notification_jobs_failed_idx
  ON notification_jobs(created_at DESC)
  WHERE status = 'FAILED';

-- Optional text search for event discovery.
CREATE INDEX IF NOT EXISTS events_title_description_search_idx
  ON events USING GIN (to_tsvector('english', title || ' ' || description));
```

---

## 10. Database table details

### 10.1 `users`

Purpose: authentication, identity, role control.

Important columns:

| Column | Purpose |
|---|---|
| `id` | Primary key. UUID. |
| `email` | Login identifier. Unique. |
| `password_hash` | Slow hash only. Never store plaintext or reversible encrypted password. |
| `role` | `STUDENT`, `ORGANIZER`, or `ADMIN`. |
| `display_name` | Shown in organizer registration lists. |
| `deleted_at` | Soft delete support. |

Security rule:

- The API never returns `passwordHash`.
- Students cannot query other students directly.

### 10.2 `events`

Purpose: event catalog and capacity source.

Important columns:

| Column | Purpose |
|---|---|
| `organizer_id` | Ownership. Every sensitive organizer route checks this. |
| `status` | Draft/published/closed/cancelled lifecycle. |
| `capacity` | Confirmed seat limit. Must be at least 1. |
| `waitlist_counter` | Monotonic FIFO sequence source. Incremented under lock. |
| `confirmed_count` | Denormalized list-page count. Source of truth remains registration rows. |
| `waitlist_count` | Denormalized list-page count. Source of truth remains registration rows. |
| `preview_token` | Lets organizer preview draft without making it public. |

Critical invariant:

```txt
count(registrations where event_id = X and status in CONFIRMED/CHECKED_IN) <= events.capacity
```

### 10.3 `registrations`

Purpose: one current registration state per student/event.

Important columns:

| Column | Purpose |
|---|---|
| `event_id`, `student_id` | Unique pair. Prevents duplicate registration rows. |
| `status` | Current state. |
| `waitlist_sequence` | FIFO order. Assigned only when waitlisted. |
| `registered_at` | Current registration attempt time. Updated on re-register. |
| `confirmed_at` | When a seat was granted. |
| `promoted_at` | When waitlist promotion happened. |
| `cancelled_at` | When registration became inactive. |

Why this design is better than multiple active rows:

- The assignment requires at most one active registration per event.
- A unique row per student/event enforces that simply.
- History still exists in `registration_transitions`.

### 10.4 `registration_transitions`

Purpose: FairSeat Ledger.

Examples:

| from | to | reason |
|---|---|---|
| null | CONFIRMED | seat_available |
| null | WAITLISTED | event_full |
| WAITLISTED | CONFIRMED | promoted_after_cancellation |
| CONFIRMED | CANCELLED_BY_USER | student_cancelled |

Use this table in the demo. It visually proves the fairness system.

### 10.5 `domain_events`

Purpose: facts that happened.

Example row:

```json
{
  "type": "REGISTRATION_CONFIRMED",
  "aggregateType": "Registration",
  "aggregateId": "registration_uuid",
  "eventId": "event_uuid",
  "userId": "student_uuid",
  "registrationId": "registration_uuid",
  "payload": {
    "source": "direct_registration"
  }
}
```

Domain events should not contain email bodies supplied by clients.

### 10.6 `notification_jobs`

Purpose: queue.

Each row says: worker, do this later.

Important columns:

| Column | Purpose |
|---|---|
| `type` | What happened. |
| `channel` | `EMAIL`, `IN_APP`, or `LOG`. |
| `status` | Queue state. |
| `attempts` | Retry count. |
| `max_attempts` | Stop after this many tries. |
| `idempotency_key` | Unique dedupe key. |
| `run_at` | Backoff scheduling. |
| `locked_at`, `locked_by` | Worker lock ownership. |
| `last_error` | Visible failure reason. |

Example idempotency keys:

```txt
registration:{registrationId}:confirmed:email
registration:{registrationId}:waitlisted:email
registration:{registrationId}:promoted:email
registration:{registrationId}:cancelled:email
registration:{registrationId}:confirmed:in_app
```

### 10.7 `notification_deliveries`

Purpose: proof that worker attempted delivery.

Use this for grading and demo. Show delivery rows after registration.

### 10.8 `in_app_notifications`

Purpose: second notification channel.

This makes the project look much more complete than email-only logging.

### 10.9 `event_stats_snapshots`

Purpose: PulseScore and analytics.

Optional. Can be generated by a scheduled job every minute or whenever event list is requested.

---

## 11. Business rules

### 11.1 Registration rule

A student can register if:

- They are authenticated.
- Their role is `STUDENT`.
- Event exists.
- Event status is `PUBLISHED`.
- Current time is before `startsAt`.
- Their registration is not already active.

Result:

- If confirmed seats are below capacity: status becomes `CONFIRMED`.
- Otherwise: status becomes `WAITLISTED` and receives a FIFO sequence.

### 11.2 One active registration rule

Active statuses:

```txt
CONFIRMED
WAITLISTED
CHECKED_IN
```

Inactive statuses:

```txt
CANCELLED_BY_USER
CANCELLED_BY_EVENT
NO_SHOW
```

Because `Registration` has `@@unique([eventId, studentId])`, a student cannot create duplicate rows. If re-registration is allowed after cancellation, update the existing row.

### 11.3 Cancellation rule

A student can cancel if:

- They own the registration.
- Registration is `CONFIRMED` or `WAITLISTED`.
- Current time is before event start.

If they cancel a confirmed registration:

1. Lock event row.
2. Mark registration `CANCELLED_BY_USER`.
3. Decrement confirmed count.
4. Select next `WAITLISTED` registration by lowest `waitlistSequence`.
5. Promote it to `CONFIRMED`.
6. Create domain events and jobs.
7. Commit.

If they cancel a waitlisted registration:

1. Lock event row.
2. Mark registration `CANCELLED_BY_USER`.
3. Decrement waitlist count.
4. Do not promote anyone.
5. Create domain event and jobs.
6. Commit.

### 11.4 Event cancellation rule

An organizer can cancel their own event if:

- Event is `DRAFT`, `PUBLISHED`, or `CLOSED`.
- Event has not been archived.

When cancelled:

- Set event status to `CANCELLED`.
- Store `cancellationReason`.
- Mark active registrations as `CANCELLED_BY_EVENT`.
- Set `confirmedCount = 0` and `waitlistCount = 0`.
- Create `EVENT_CANCELLED` domain event.
- Queue one email and one in-app notification per affected user, or queue one bulk job. For this project, one job per affected user is clearer for grading.

### 11.5 Capacity change rule

Organizer can change capacity while event is `DRAFT` freely.

After publish:

- Increasing capacity is allowed.
- Decreasing capacity below current confirmed count is not allowed.
- If capacity increases and waitlist exists, automatically promote students until capacity is full.

This is a strong demo feature because it proves the same promotion algorithm works outside cancellation.

### 11.6 Full event rule

An event is full when:

```txt
confirmedCount >= capacity
```

The API should return both raw counts and a display helper:

```json
{
  "capacity": 30,
  "confirmedCount": 30,
  "waitlistCount": 8,
  "isFull": true,
  "pulseLabel": "Waitlist Active"
}
```

---

## 12. Critical transaction algorithms

### 12.1 Register for event

Use a serial transaction per event by locking the event row.

```ts
async function registerForEvent(eventId: string, studentId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT id FROM events
      WHERE id = ${eventId}::uuid
      FOR UPDATE
    `;

    const event = await tx.event.findUniqueOrThrow({ where: { id: eventId } });

    if (event.status !== 'PUBLISHED') {
      throw conflict('EVENT_NOT_OPEN', 'This event is not open for registration.');
    }

    if (event.startsAt <= new Date()) {
      throw conflict('EVENT_ALREADY_STARTED', 'Registration is closed.');
    }

    const existing = await tx.registration.findUnique({
      where: { eventId_studentId: { eventId, studentId } },
    });

    if (existing && ['CONFIRMED', 'WAITLISTED', 'CHECKED_IN'].includes(existing.status)) {
      throw conflict('ALREADY_REGISTERED', 'You already have an active registration.');
    }

    const confirmedCount = await tx.registration.count({
      where: { eventId, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
    });

    const willConfirm = confirmedCount < event.capacity;

    if (willConfirm) {
      const registration = await tx.registration.upsert({
        where: { eventId_studentId: { eventId, studentId } },
        create: {
          eventId,
          studentId,
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
        update: {
          status: 'CONFIRMED',
          registeredAt: new Date(),
          confirmedAt: new Date(),
          waitlistedAt: null,
          promotedAt: null,
          cancelledAt: null,
          cancellationReason: null,
        },
      });

      await tx.event.update({
        where: { id: eventId },
        data: { confirmedCount: { increment: 1 } },
      });

      await createDomainEventAndJobs(tx, {
        type: 'REGISTRATION_CONFIRMED',
        eventId,
        userId: studentId,
        registrationId: registration.id,
      });

      return { status: 'CONFIRMED', registration };
    }

    const updatedEvent = await tx.event.update({
      where: { id: eventId },
      data: {
        waitlistCounter: { increment: 1 },
        waitlistCount: { increment: 1 },
      },
    });

    const registration = await tx.registration.upsert({
      where: { eventId_studentId: { eventId, studentId } },
      create: {
        eventId,
        studentId,
        status: 'WAITLISTED',
        waitlistedAt: new Date(),
        waitlistSequence: updatedEvent.waitlistCounter,
      },
      update: {
        status: 'WAITLISTED',
        registeredAt: new Date(),
        waitlistedAt: new Date(),
        waitlistSequence: updatedEvent.waitlistCounter,
        confirmedAt: null,
        promotedAt: null,
        cancelledAt: null,
        cancellationReason: null,
      },
    });

    await createDomainEventAndJobs(tx, {
      type: 'REGISTRATION_WAITLISTED',
      eventId,
      userId: studentId,
      registrationId: registration.id,
    });

    const position = await tx.registration.count({
      where: {
        eventId,
        status: 'WAITLISTED',
        waitlistSequence: { lte: updatedEvent.waitlistCounter },
      },
    });

    return { status: 'WAITLISTED', position, registration };
  });
}
```

### 12.2 Cancel registration and promote next

```ts
async function cancelRegistration(registrationId: string, studentId: string) {
  return prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findUniqueOrThrow({
      where: { id: registrationId },
      include: { event: true },
    });

    if (registration.studentId !== studentId) {
      throw forbidden('You can only cancel your own registration.');
    }

    if (!['CONFIRMED', 'WAITLISTED'].includes(registration.status)) {
      throw conflict('REGISTRATION_NOT_ACTIVE', 'This registration is not active.');
    }

    if (registration.event.startsAt <= new Date()) {
      throw conflict('EVENT_ALREADY_STARTED', 'Cancellation is closed.');
    }

    await tx.$queryRaw`
      SELECT id FROM events
      WHERE id = ${registration.eventId}::uuid
      FOR UPDATE
    `;

    await tx.registration.update({
      where: { id: registrationId },
      data: {
        status: 'CANCELLED_BY_USER',
        cancelledAt: new Date(),
        cancellationReason: 'student_cancelled',
      },
    });

    await createDomainEventAndJobs(tx, {
      type: 'REGISTRATION_CANCELLED',
      eventId: registration.eventId,
      userId: studentId,
      registrationId,
    });

    if (registration.status === 'WAITLISTED') {
      await tx.event.update({
        where: { id: registration.eventId },
        data: { waitlistCount: { decrement: 1 } },
      });
      return { cancelled: true, promoted: null };
    }

    await tx.event.update({
      where: { id: registration.eventId },
      data: { confirmedCount: { decrement: 1 } },
    });

    const next = await tx.registration.findFirst({
      where: {
        eventId: registration.eventId,
        status: 'WAITLISTED',
      },
      orderBy: [
        { waitlistSequence: 'asc' },
        { registeredAt: 'asc' },
      ],
    });

    if (!next) {
      return { cancelled: true, promoted: null };
    }

    const promoted = await tx.registration.update({
      where: { id: next.id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        promotedAt: new Date(),
      },
    });

    await tx.event.update({
      where: { id: registration.eventId },
      data: {
        confirmedCount: { increment: 1 },
        waitlistCount: { decrement: 1 },
      },
    });

    await createDomainEventAndJobs(tx, {
      type: 'WAITLIST_PROMOTED',
      eventId: registration.eventId,
      userId: promoted.studentId,
      registrationId: promoted.id,
    });

    return { cancelled: true, promoted };
  });
}
```

### 12.3 Why event locking is enough

The risky case is many students registering at the same time for the last seat.

Without locking:

```txt
Request A counts 29 confirmed seats.
Request B counts 29 confirmed seats.
Both insert CONFIRMED.
Capacity 30 becomes 31 confirmed. Bad.
```

With event row lock:

```txt
Request A locks event.
Request B waits.
Request A confirms seat and commits.
Request B locks event after A commits.
Request B now sees 30 confirmed seats and becomes WAITLISTED.
```

This is the core backend point. It must be implemented, not just documented.

---

## 13. Domain events and jobs

### 13.1 Required event types

Minimum for grading:

1. `REGISTRATION_CONFIRMED`
2. `REGISTRATION_WAITLISTED`
3. `WAITLIST_PROMOTED`

Recommended full set:

| Type | Trigger | Jobs |
|---|---|---|
| `USER_REGISTERED` | User signs up | In-app welcome, optional email. |
| `EVENT_CREATED` | Organizer creates draft | Log only. |
| `EVENT_PUBLISHED` | Organizer publishes event | Notify followers, log. |
| `EVENT_CANCELLED` | Organizer cancels event | Email and in-app to affected students. |
| `CAPACITY_CHANGED` | Organizer increases/decreases capacity | Promote waitlist if needed. |
| `REGISTRATION_CONFIRMED` | Student gets seat | Email, in-app, log. |
| `REGISTRATION_WAITLISTED` | Student joins waitlist | Email, in-app, log. |
| `REGISTRATION_CANCELLED` | Student cancels | Email confirmation, log. |
| `WAITLIST_PROMOTED` | Waitlisted student gets seat | Email, in-app, log. |
| `CHECK_IN_CREATED` | Student checks in | In-app, log. |

### 13.2 Event payload style

Good payload:

```json
{
  "type": "WAITLIST_PROMOTED",
  "eventId": "uuid",
  "userId": "uuid",
  "registrationId": "uuid",
  "occurredAt": "2026-04-29T12:00:00.000Z",
  "metadata": {
    "reason": "confirmed_student_cancelled"
  }
}
```

Bad payload:

```json
{
  "emailTo": "someone@example.com",
  "subject": "Anything the client wanted",
  "body": "Untrusted client content"
}
```

The worker should load users and events from the database.

### 13.3 Job creation helper

Pseudo-code:

```ts
async function createDomainEventAndJobs(tx, input) {
  const domainEvent = await tx.domainEvent.create({
    data: {
      type: input.type,
      aggregateType: 'Registration',
      aggregateId: input.registrationId,
      eventId: input.eventId,
      userId: input.userId,
      registrationId: input.registrationId,
      payload: input.payload ?? {},
    },
  });

  const channels = ['EMAIL', 'IN_APP', 'LOG'];

  for (const channel of channels) {
    await tx.notificationJob.create({
      data: {
        domainEventId: domainEvent.id,
        type: input.type,
        channel,
        eventId: input.eventId,
        registrationId: input.registrationId,
        recipientId: input.userId,
        idempotencyKey: `${input.type}:${input.registrationId}:${channel}`,
        payload: {},
      },
    });
  }

  return domainEvent;
}
```

### 13.4 Worker polling SQL

```sql
WITH picked AS (
  SELECT id
  FROM notification_jobs
  WHERE status = 'PENDING'
    AND run_at <= now()
  ORDER BY created_at ASC
  LIMIT 10
  FOR UPDATE SKIP LOCKED
)
UPDATE notification_jobs
SET status = 'PROCESSING',
    locked_at = now(),
    locked_by = $1,
    attempts = attempts + 1,
    updated_at = now()
WHERE id IN (SELECT id FROM picked)
RETURNING *;
```

### 13.5 Worker processing logic

```ts
while (true) {
  const jobs = await claimJobs(workerId, 10);

  for (const job of jobs) {
    try {
      await processJob(job);
      await markSent(job.id);
    } catch (error) {
      await markFailedOrRetry(job, error);
    }
  }

  await sleep(jobs.length ? 100 : 1000);
}
```

### 13.6 Retry policy

Recommended:

| Attempt | Next retry delay |
|---|---:|
| 1 | 30 seconds |
| 2 | 2 minutes |
| 3 | 10 minutes |
| 4 | 30 minutes |
| 5 | Stop, mark failed |

Backoff formula:

```ts
const retryDelaySeconds = Math.min(1800, 30 * 2 ** (attempts - 1));
```

### 13.7 Idempotency rules

Worker must avoid duplicate visible notifications.

Do both:

1. `NotificationJob.idempotencyKey` is unique.
2. `NotificationDelivery` has `@@unique([jobId, channel])`.

Before sending:

```ts
const existingDelivery = await prisma.notificationDelivery.findUnique({
  where: { jobId_channel: { jobId: job.id, channel: job.channel } },
});

if (existingDelivery?.status === 'SENT') {
  await markSent(job.id);
  return;
}
```

---

## 14. REST API conventions

### 14.1 Base URL

```txt
/api/v1
```

### 14.2 Authentication

Use one of these:

Preferred:

```txt
httpOnly Secure SameSite=Lax cookies
```

Acceptable:

```txt
Authorization: Bearer <access_token>
```

### 14.3 Standard success envelope

For simple resources:

```json
{
  "data": {
    "id": "uuid"
  }
}
```

For lists:

```json
{
  "data": [],
  "page": {
    "limit": 20,
    "cursor": "next_cursor_or_null",
    "hasMore": true
  }
}
```

### 14.4 Standard error envelope

```json
{
  "error": {
    "code": "EVENT_NOT_FOUND",
    "message": "Event was not found.",
    "details": {},
    "requestId": "req_abc123"
  }
}
```

### 14.5 Common status codes

| Status | Meaning |
|---:|---|
| `200` | Read/update success. |
| `201` | Created. |
| `202` | Accepted async action. |
| `204` | Success with no body. |
| `400` | Bad JSON or malformed request. |
| `401` | Not authenticated. |
| `403` | Authenticated but forbidden. |
| `404` | Not found, or hidden because user lacks visibility. |
| `409` | Conflict with current state. |
| `422` | Validation error. |
| `429` | Rate limited. |
| `500` | Unexpected server error. |

### 14.6 Pagination

Use cursor pagination for large lists.

Query:

```txt
?limit=20&cursor=eyJpZCI6IiJ9
```

Response:

```json
{
  "data": [],
  "page": {
    "limit": 20,
    "cursor": "next_cursor",
    "hasMore": true
  }
}
```

---

## 15. Complete endpoint plan

### 15.1 Authentication endpoints

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/auth/register` | No | Public | Create student account only. |
| `POST` | `/auth/login` | No | Public | Log in and return/session token. |
| `POST` | `/auth/logout` | Yes | Any | Revoke current session. |
| `POST` | `/auth/refresh` | Cookie/session | Any | Refresh access token. |
| `GET` | `/auth/session` | Yes | Any | Return current auth state. |

#### POST `/auth/register`

Creates a student account. Organizer creation should be seeded or admin-only.

Request:

```json
{
  "email": "student@example.edu",
  "password": "CorrectHorseBatteryStaple!123",
  "displayName": "Maya Chen"
}
```

Validation:

- `email`: valid email, max 320 chars.
- `password`: min 10 chars, max 128 chars.
- `displayName`: 2 to 100 chars.
- `role`: ignored if supplied by client.

Response `201`:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.edu",
      "displayName": "Maya Chen",
      "role": "STUDENT"
    }
  }
}
```

Errors:

- `409 EMAIL_ALREADY_EXISTS`
- `422 VALIDATION_ERROR`

#### POST `/auth/login`

Request:

```json
{
  "email": "student@example.edu",
  "password": "CorrectHorseBatteryStaple!123"
}
```

Response `200`:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.edu",
      "displayName": "Maya Chen",
      "role": "STUDENT"
    },
    "accessToken": "jwt_if_not_using_cookie"
  }
}
```

Errors:

- `401 INVALID_CREDENTIALS`

#### POST `/auth/logout`

Response `204`.

---

### 15.2 User profile endpoints

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/users/me` | Yes | Any | Current profile. |
| `PUT` | `/users/me` | Yes | Any | Update display name, bio, preferences. |
| `GET` | `/users/me/registrations` | Yes | Student | Alias for `/registrations/me`. |
| `GET` | `/users/me/notifications` | Yes | Any | In-app notifications. |
| `PATCH` | `/users/me/notifications/:id/read` | Yes | Any | Mark notification read. |

#### GET `/users/me`

Response:

```json
{
  "data": {
    "id": "uuid",
    "email": "student@example.edu",
    "displayName": "Maya Chen",
    "role": "STUDENT",
    "preferences": {
      "emailEnabled": true,
      "inAppEnabled": true,
      "digestEnabled": false,
      "preferredTags": ["AI", "Career", "Workshop"]
    }
  }
}
```

#### PUT `/users/me`

Request:

```json
{
  "displayName": "Maya C.",
  "bio": "Interested in robotics and design.",
  "preferences": {
    "emailEnabled": true,
    "inAppEnabled": true,
    "digestEnabled": true,
    "preferredTags": ["Robotics", "Design"]
  }
}
```

---

### 15.3 Event endpoints

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/events` | Yes | Organizer | Create draft event. |
| `GET` | `/events` | Optional/Yes | Student/Organizer | Students see published only. Organizers see own events. |
| `GET` | `/events/:id` | Optional/Yes | Visibility-based | Event details with counts. |
| `PUT` | `/events/:id` | Yes | Organizer owner | Edit own editable event. |
| `POST` | `/events/:id/publish` | Yes | Organizer owner | Publish draft. |
| `POST` | `/events/:id/close` | Yes | Organizer owner | Close registration. |
| `POST` | `/events/:id/cancel` | Yes | Organizer owner | Cancel event and notify affected students. |
| `GET` | `/events/:id/preview` | Yes or token | Organizer owner/token | Preview draft as student. |
| `POST` | `/events/:id/capacity` | Yes | Organizer owner | Change capacity and promote waitlist if increased. |
| `GET` | `/events/:id/analytics` | Yes | Organizer owner | Counts, funnel, jobs, check-ins. |

#### POST `/events`

Creates a draft. Students must receive `403`.

Request:

```json
{
  "title": "Build an AI Study Buddy in 90 Minutes",
  "description": "Hands-on workshop where students build a tiny AI-powered study tool.",
  "startsAt": "2026-04-29T16:00:00.000Z",
  "endsAt": "2026-04-29T17:30:00.000Z",
  "capacity": 30,
  "locationText": "Innovation Lab 2B",
  "meetingUrl": null,
  "tagNames": ["AI", "Workshop", "Career"]
}
```

Response `201`:

```json
{
  "data": {
    "id": "uuid",
    "status": "DRAFT",
    "title": "Build an AI Study Buddy in 90 Minutes",
    "capacity": 30,
    "confirmedCount": 0,
    "waitlistCount": 0,
    "previewUrl": "/events/uuid/preview?token=abc"
  }
}
```

Validation:

- `title`: 4 to 140 chars.
- `description`: 20 to 5000 chars.
- `startsAt`: future datetime.
- `endsAt`: after `startsAt`.
- `capacity`: integer >= 1.
- `locationText`: required if `meetingUrl` missing.
- `tagNames`: max 8 tags.

#### GET `/events`

Student behavior:

- Return only `PUBLISHED` events.
- Hide drafts and cancelled events unless `includeCancelled=true` is allowed.

Organizer behavior:

- Return only events where `organizerId = currentUser.id`.
- Include drafts, published, closed, cancelled.

Query parameters:

| Param | Example | Description |
|---|---|---|
| `q` | `robotics` | Search title/description. |
| `tag` | `Workshop` | Filter by tag. |
| `from` | `2026-04-01` | Start date lower bound. |
| `to` | `2026-04-30` | Start date upper bound. |
| `status` | `PUBLISHED` | Organizer only, unless public statuses allowed. |
| `onlyOpen` | `true` | Published events not started and not closed. |
| `limit` | `20` | Page size. |
| `cursor` | `...` | Cursor. |

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Build an AI Study Buddy in 90 Minutes",
      "status": "PUBLISHED",
      "startsAt": "2026-04-29T16:00:00.000Z",
      "endsAt": "2026-04-29T17:30:00.000Z",
      "locationText": "Innovation Lab 2B",
      "capacity": 30,
      "confirmedCount": 28,
      "waitlistCount": 0,
      "isFull": false,
      "spotsLeft": 2,
      "pulseLabel": "Almost Full",
      "tags": ["AI", "Workshop", "Career"]
    }
  ],
  "page": {
    "limit": 20,
    "cursor": null,
    "hasMore": false
  }
}
```

#### GET `/events/:id`

Visibility:

- Student/public can see only published, closed, or cancelled events.
- Organizer can see own draft.
- If unauthorized draft access, return `404`, not `403`, to avoid leaking existence.

Response:

```json
{
  "data": {
    "id": "uuid",
    "title": "Build an AI Study Buddy in 90 Minutes",
    "description": "Hands-on workshop...",
    "status": "PUBLISHED",
    "startsAt": "2026-04-29T16:00:00.000Z",
    "endsAt": "2026-04-29T17:30:00.000Z",
    "locationText": "Innovation Lab 2B",
    "meetingUrl": null,
    "capacity": 30,
    "confirmedCount": 30,
    "waitlistCount": 4,
    "isFull": true,
    "pulseLabel": "Waitlist Active",
    "organizer": {
      "id": "uuid",
      "displayName": "Robotics Club"
    },
    "tags": ["AI", "Workshop", "Career"],
    "myRegistration": {
      "id": "uuid",
      "status": "WAITLISTED",
      "waitlistPosition": 2
    }
  }
}
```

#### PUT `/events/:id`

Rules:

- Organizer owner only.
- Draft events can edit all fields.
- Published events can edit description, location, meeting URL, and increase capacity.
- Published start/end changes should be restricted or notify registered students.
- Cannot edit cancelled or archived events.

Request:

```json
{
  "title": "Build an AI Study Buddy in 90 Minutes",
  "description": "Updated description.",
  "startsAt": "2026-04-29T16:00:00.000Z",
  "endsAt": "2026-04-29T17:30:00.000Z",
  "capacity": 40,
  "locationText": "Innovation Lab 2B",
  "tagNames": ["AI", "Workshop"]
}
```

Errors:

- `403 NOT_EVENT_OWNER`
- `409 EVENT_NOT_EDITABLE`
- `409 CAPACITY_BELOW_CONFIRMED_COUNT`

#### POST `/events/:id/publish`

Rules:

- Organizer owner only.
- Event must be `DRAFT`.
- Required fields must be valid.
- Set status `PUBLISHED` and `publishedAt`.
- Queue `EVENT_PUBLISHED` log job.
- Optionally notify followers.

Response:

```json
{
  "data": {
    "id": "uuid",
    "status": "PUBLISHED",
    "publishedAt": "2026-04-20T12:00:00.000Z"
  }
}
```

#### POST `/events/:id/close`

Rules:

- Organizer owner only.
- Event must be `PUBLISHED`.
- No new registration after closing.
- Existing confirmed and waitlisted registrations remain.

Response:

```json
{
  "data": {
    "id": "uuid",
    "status": "CLOSED",
    "closedAt": "2026-04-20T12:00:00.000Z"
  }
}
```

#### POST `/events/:id/cancel`

Request:

```json
{
  "reason": "Speaker is unavailable. We will reschedule soon."
}
```

Response:

```json
{
  "data": {
    "id": "uuid",
    "status": "CANCELLED",
    "affectedRegistrations": 34,
    "queuedJobs": 68
  }
}
```

Why 68 jobs? 34 users times email plus in-app.

#### POST `/events/:id/capacity`

Request:

```json
{
  "capacity": 35
}
```

Response:

```json
{
  "data": {
    "id": "uuid",
    "capacity": 35,
    "promotedCount": 5,
    "confirmedCount": 35,
    "waitlistCount": 3
  }
}
```

This endpoint is optional but impressive. It exercises promotion logic clearly.

---

### 15.4 Registration endpoints

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/events/:id/registrations` | Yes | Student | Register for event. |
| `DELETE` | `/registrations/:id` | Yes | Student owner | Cancel own registration. |
| `GET` | `/registrations/me` | Yes | Student | Student's own registrations. |
| `GET` | `/events/:id/registrations` | Yes | Organizer owner | Confirmed registrations. |
| `GET` | `/events/:id/waitlist` | Yes | Organizer owner | FIFO waitlist. |
| `GET` | `/registrations/:id/ledger` | Yes | Owner/organizer owner | Registration transition history. |

#### POST `/events/:id/registrations`

Request:

```json
{}
```

Optional idempotency header:

```txt
Idempotency-Key: register-event-uuid-user-uuid-client-random
```

Response when confirmed `201`:

```json
{
  "data": {
    "registration": {
      "id": "uuid",
      "eventId": "uuid",
      "status": "CONFIRMED",
      "confirmedAt": "2026-04-20T12:00:00.000Z"
    },
    "message": "You have a confirmed seat."
  }
}
```

Response when waitlisted `201`:

```json
{
  "data": {
    "registration": {
      "id": "uuid",
      "eventId": "uuid",
      "status": "WAITLISTED",
      "waitlistPosition": 1,
      "waitlistedAt": "2026-04-20T12:00:00.000Z"
    },
    "message": "The event is full. You are #1 on the waitlist."
  }
}
```

Errors:

- `401 UNAUTHENTICATED`
- `403 STUDENTS_ONLY`
- `404 EVENT_NOT_FOUND`
- `409 EVENT_NOT_OPEN`
- `409 ALREADY_REGISTERED`
- `409 EVENT_ALREADY_STARTED`

#### DELETE `/registrations/:id`

Response when no promotion:

```json
{
  "data": {
    "cancelled": true,
    "promoted": null
  }
}
```

Response when promotion occurs:

```json
{
  "data": {
    "cancelled": true,
    "promoted": {
      "registrationId": "uuid",
      "studentId": "uuid",
      "status": "CONFIRMED"
    }
  }
}
```

Do not expose promoted student's email/name to the cancelling student. The organizer can see that separately.

#### GET `/registrations/me`

Query:

| Param | Values |
|---|---|
| `status` | `CONFIRMED`, `WAITLISTED`, `CANCELLED_BY_USER`, `CANCELLED_BY_EVENT`, `CHECKED_IN` |
| `upcoming` | `true`, `false` |
| `limit` | number |
| `cursor` | cursor |

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "status": "WAITLISTED",
      "waitlistPosition": 2,
      "registeredAt": "2026-04-20T12:00:00.000Z",
      "event": {
        "id": "uuid",
        "title": "Build an AI Study Buddy in 90 Minutes",
        "startsAt": "2026-04-29T16:00:00.000Z",
        "locationText": "Innovation Lab 2B"
      }
    }
  ],
  "page": {
    "limit": 20,
    "cursor": null,
    "hasMore": false
  }
}
```

#### GET `/events/:id/registrations`

Organizer owner only. Returns confirmed students.

Response:

```json
{
  "data": [
    {
      "registrationId": "uuid",
      "student": {
        "id": "uuid",
        "displayName": "Maya Chen",
        "email": "student@example.edu"
      },
      "status": "CONFIRMED",
      "registeredAt": "2026-04-20T12:00:00.000Z",
      "confirmedAt": "2026-04-20T12:00:00.000Z",
      "checkedInAt": null
    }
  ]
}
```

#### GET `/events/:id/waitlist`

Organizer owner only. Returns deterministic FIFO order.

Response:

```json
{
  "data": [
    {
      "position": 1,
      "registrationId": "uuid",
      "student": {
        "id": "uuid",
        "displayName": "Luis Patel",
        "email": "luis@example.edu"
      },
      "waitlistSequence": 18,
      "waitlistedAt": "2026-04-20T12:05:00.000Z"
    }
  ]
}
```

#### GET `/registrations/:id/ledger`

Student owner or event organizer owner only.

Response:

```json
{
  "data": [
    {
      "fromStatus": null,
      "toStatus": "WAITLISTED",
      "reason": "event_full",
      "createdAt": "2026-04-20T12:05:00.000Z"
    },
    {
      "fromStatus": "WAITLISTED",
      "toStatus": "CONFIRMED",
      "reason": "promoted_after_cancellation",
      "createdAt": "2026-04-21T09:00:00.000Z"
    }
  ]
}
```

This endpoint is not required, but it makes the fairness story strong.

---

### 15.5 Notification endpoints

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/notifications` | Yes | Any | My in-app notifications. |
| `PATCH` | `/notifications/:id/read` | Yes | Owner | Mark one notification read. |
| `PATCH` | `/notifications/read-all` | Yes | Any | Mark all read. |
| `GET` | `/notification-jobs` | Yes | Organizer/Admin | Job list. Organizer restricted to own events. |
| `GET` | `/notification-jobs/:id` | Yes | Organizer/Admin/student recipient | Job detail if allowed. |
| `POST` | `/notification-jobs/:id/retry` | Yes | Admin or organizer owner | Requeue failed job. Optional. |

#### GET `/notifications`

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "WAITLIST_PROMOTED",
      "title": "You got a seat!",
      "body": "You were promoted from the waitlist for Build an AI Study Buddy.",
      "readAt": null,
      "createdAt": "2026-04-21T09:00:00.000Z",
      "eventId": "uuid"
    }
  ]
}
```

#### GET `/notification-jobs`

Organizer can filter only own event jobs.

Query:

```txt
?eventId=uuid&status=FAILED&type=WAITLIST_PROMOTED
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "WAITLIST_PROMOTED",
      "channel": "EMAIL",
      "status": "SENT",
      "attempts": 1,
      "recipientId": "uuid",
      "eventId": "uuid",
      "createdAt": "2026-04-21T09:00:00.000Z",
      "sentAt": "2026-04-21T09:00:02.000Z"
    }
  ]
}
```

---

### 15.6 Tags, discovery, and recommendation endpoints

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/tags` | Optional | Any | List tags. |
| `GET` | `/events/recommended` | Yes | Student | Personalized event recommendations. |
| `POST` | `/events/:id/bookmark` | Yes | Student | Save event. |
| `DELETE` | `/events/:id/bookmark` | Yes | Student | Remove bookmark. |
| `POST` | `/organizers/:id/follow` | Yes | Student | Follow organizer. |
| `DELETE` | `/organizers/:id/follow` | Yes | Student | Unfollow organizer. |

#### GET `/events/recommended`

Simple scoring formula:

```txt
score =
  + 40 if event tag is in user's preferred tags
  + 20 if student follows organizer
  + 15 if event starts within next 7 days
  + 10 if seats are available
  - 20 if already registered
  - 10 if event is full and waitlist is large
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Portfolio Night",
      "score": 85,
      "reason": ["Matches Design", "Organizer followed", "Seats open"]
    }
  ]
}
```

This looks smart but is deterministic and easy to explain.

---

### 15.7 Check-in endpoints

Optional but high-impact for demo.

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/events/:id/check-ins` | Yes | Organizer owner | Manual check-in student. |
| `POST` | `/events/:id/check-ins/self` | Yes | Student | Student QR/self check-in. |
| `GET` | `/events/:id/check-ins` | Yes | Organizer owner | List check-ins. |

#### POST `/events/:id/check-ins/self`

Request:

```json
{
  "qrCode": "signed-qr-token"
}
```

Rules:

- Student must be confirmed.
- Event must be within allowed check-in window, for example 30 minutes before start until event end.
- One check-in per registration.

Response:

```json
{
  "data": {
    "checkedIn": true,
    "checkedInAt": "2026-04-29T15:45:00.000Z"
  }
}
```

---

### 15.8 Health endpoints

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/health` | No | Public | API process alive. |
| `GET` | `/ready` | No | Public | DB reachable and migrations current. |
| `GET` | `/worker/health` | Internal | Internal | Worker heartbeat. Optional. |

Response:

```json
{
  "data": {
    "status": "ok",
    "timestamp": "2026-04-20T12:00:00.000Z"
  }
}
```

---

## 16. Authorization matrix

| Action | Student | Organizer | Admin |
|---|---:|---:|---:|
| Register account | Yes | No, seeded/admin-created | Yes |
| Create event | No | Yes | Yes |
| Edit event | No | Own only | Any |
| Publish event | No | Own only | Any |
| Cancel event | No | Own only | Any |
| View published event | Yes | Yes | Yes |
| View draft event | No | Own only | Any |
| Register for event | Yes | No | No |
| Cancel registration | Own only | No | Any |
| View own registrations | Yes | No | Yes |
| View event confirmed list | No | Own event only | Any |
| View event waitlist | No | Own event only | Any |
| View notification jobs | Own recipient jobs only | Own event jobs only | Any |
| Retry failed jobs | No | Own event jobs only | Any |

Middleware pattern:

```ts
requireAuth()
requireRole('ORGANIZER')
requireEventOwner(':id')
```

For student registration owner:

```ts
requireRegistrationOwner(':id')
```

---

## 17. Validation schemas

Use Zod.

### 17.1 Create event schema

```ts
const createEventSchema = z.object({
  title: z.string().trim().min(4).max(140),
  description: z.string().trim().min(20).max(5000),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  capacity: z.number().int().min(1).max(10000),
  locationText: z.string().trim().max(240).optional().nullable(),
  meetingUrl: z.string().url().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  tagNames: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
}).refine((data) => data.endsAt > data.startsAt, {
  message: 'endsAt must be after startsAt',
  path: ['endsAt'],
}).refine((data) => data.locationText || data.meetingUrl, {
  message: 'locationText or meetingUrl is required',
  path: ['locationText'],
});
```

### 17.2 Register schema

No body required. Accept idempotency header.

```ts
const idempotencyKeySchema = z.string().min(8).max(160).optional();
```

### 17.3 Cancel event schema

```ts
const cancelEventSchema = z.object({
  reason: z.string().trim().min(5).max(1000),
});
```

---

## 18. Service layer plan

### 18.1 `AuthService`

Methods:

```ts
registerStudent(input)
login(input)
logout(sessionId)
refresh(refreshToken)
getSession(userId)
```

Responsibilities:

- Normalize email.
- Hash password.
- Verify password.
- Create sessions.
- Revoke sessions.
- Never expose password hash.

### 18.2 `EventService`

Methods:

```ts
createDraft(organizerId, input)
listEvents(user, filters)
getEvent(user, eventId)
updateEvent(organizerId, eventId, input)
publishEvent(organizerId, eventId)
closeEvent(organizerId, eventId)
cancelEvent(organizerId, eventId, reason)
changeCapacity(organizerId, eventId, capacity)
getAnalytics(organizerId, eventId)
```

Responsibilities:

- Ownership checks.
- Event state machine.
- Tag attachment.
- Domain events for publish/cancel/capacity.

### 18.3 `RegistrationService`

Methods:

```ts
register(eventId, studentId, idempotencyKey?)
cancel(registrationId, studentId)
listMine(studentId, filters)
listConfirmedForOrganizer(organizerId, eventId)
listWaitlistForOrganizer(organizerId, eventId)
getLedger(user, registrationId)
promoteNext(tx, eventId)
promoteUntilFull(tx, eventId)
```

Responsibilities:

- Capacity locking.
- No-overbooking invariant.
- FIFO promotion.
- Transition ledger.
- Domain events and jobs.

### 18.4 `NotificationService`

Methods:

```ts
createDomainEventAndJobs(tx, input)
listJobs(user, filters)
retryJob(user, jobId)
renderNotification(job)
markInAppRead(userId, notificationId)
```

Responsibilities:

- Job idempotency.
- Job visibility rules.
- Templates.

### 18.5 `WorkerService`

Methods:

```ts
claimJobs(workerId, limit)
processJob(job)
markSent(jobId)
markRetry(jobId, error)
markFailed(jobId, error)
```

Responsibilities:

- Polling.
- Sending.
- Retrying.
- Logging delivery.

---

## 19. Notification templates

### 19.1 `REGISTRATION_CONFIRMED`

Subject:

```txt
You're confirmed: {{event.title}}
```

Body:

```txt
Hi {{user.displayName}},

You have a confirmed seat for {{event.title}}.

Time: {{event.startsAt}}
Location: {{event.locationText or meetingUrl}}

See you there.
```

In-app:

```txt
You have a confirmed seat for {{event.title}}.
```

### 19.2 `REGISTRATION_WAITLISTED`

Subject:

```txt
You're on the waitlist: {{event.title}}
```

Body:

```txt
Hi {{user.displayName}},

{{event.title}} is currently full. You are on the waitlist.

Current position: {{waitlistPosition}}
We will notify you automatically if a seat opens.
```

### 19.3 `WAITLIST_PROMOTED`

Subject:

```txt
You got a seat: {{event.title}}
```

Body:

```txt
Good news, {{user.displayName}}.

You were promoted from the waitlist and now have a confirmed seat for {{event.title}}.
```

This should be part of the demo.

### 19.4 `REGISTRATION_CANCELLED`

Subject:

```txt
Registration cancelled: {{event.title}}
```

Body:

```txt
Your registration for {{event.title}} was cancelled.
```

### 19.5 `EVENT_CANCELLED`

Subject:

```txt
Event cancelled: {{event.title}}
```

Body:

```txt
{{event.title}} has been cancelled.

Reason: {{event.cancellationReason}}
```

---

## 20. Frontend design

### 20.1 Student pages

| Page | Route | Purpose |
|---|---|---|
| Login | `/login` | Sign in. |
| Register | `/register` | Student account creation. |
| Event Galaxy | `/events` | Published event discovery. |
| Event Detail | `/events/:id` | Full event info and register button. |
| My Pulse | `/me/registrations` | Confirmed and waitlisted events. |
| Notifications | `/notifications` | In-app notification feed. |
| Campus Passport | `/passport` | Optional check-in badges. |

Student UX details:

- Event cards show pulse label and capacity ring.
- Register button changes based on state:
  - `Register`
  - `Join waitlist`
  - `You're confirmed`
  - `You're #2 on waitlist`
  - `Registration closed`
- My registrations page clearly separates confirmed, waitlisted, cancelled.

### 20.2 Organizer pages

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/organizer` | Summary of own events and job failures. |
| New Event | `/organizer/events/new` | Create draft. |
| Event Editor | `/organizer/events/:id/edit` | Edit draft/published event. |
| Student Preview | `/organizer/events/:id/preview` | Preview before publish. |
| Registrations | `/organizer/events/:id/registrations` | Confirmed students. |
| Waitlist | `/organizer/events/:id/waitlist` | FIFO waitlist. |
| Jobs | `/organizer/events/:id/jobs` | Notification jobs and delivery logs. |
| Analytics | `/organizer/events/:id/analytics` | Funnel and PulseScore. |

Organizer UX details:

- Show event status badge.
- Show publish checklist:
  - title valid
  - description valid
  - time valid
  - capacity valid
  - location/URL set
- Show preview before publish.
- Show waitlist in sequence order.
- Show a warning if failed jobs exist.

### 20.3 Visual components

1. `PulseCapacityRing`
   - Shows confirmed/capacity.

2. `WaitlistBadge`
   - Shows `Open`, `Full`, or `Waitlist Active`.

3. `FairSeatTimeline`
   - Shows transition ledger.

4. `OrganizerJobConsole`
   - Shows worker job states.

5. `EventGalaxyGrid`
   - Tag-colored event grid.

6. `StudentPreviewFrame`
   - Renders organizer draft as student card.

---

## 21. PulseScore design

### 21.1 Purpose

PulseScore makes event cards feel dynamic without building complicated machine learning.

### 21.2 Formula

```ts
function computePulse(event) {
  const fillRatio = event.capacity === 0 ? 1 : event.confirmedCount / event.capacity;

  if (event.status === 'CANCELLED') return { label: 'Cancelled', score: 0 };
  if (event.status === 'CLOSED') return { label: 'Closed', score: 20 };
  if (event.waitlistCount > 0) return { label: 'Waitlist Active', score: 100 };
  if (fillRatio >= 0.9) return { label: 'Almost Full', score: 90 };
  if (fillRatio >= 0.65) return { label: 'Filling Fast', score: 70 };
  return { label: 'Fresh', score: 40 };
}
```

### 21.3 Display examples

| Confirmed | Capacity | Waitlist | Label |
|---:|---:|---:|---|
| 5 | 30 | 0 | Fresh |
| 22 | 30 | 0 | Filling Fast |
| 28 | 30 | 0 | Almost Full |
| 30 | 30 | 4 | Waitlist Active |

---

## 22. Search and recommendation

### 22.1 Basic search

Use Postgres text search or Prisma `contains` for simpler implementation.

Prisma simple version:

```ts
where: {
  status: 'PUBLISHED',
  OR: [
    { title: { contains: q, mode: 'insensitive' } },
    { description: { contains: q, mode: 'insensitive' } },
  ],
}
```

Postgres stronger version:

```sql
SELECT *
FROM events
WHERE status = 'PUBLISHED'
  AND to_tsvector('english', title || ' ' || description) @@ plainto_tsquery('english', $1)
ORDER BY starts_at ASC;
```

### 22.2 Recommendation MVP

Inputs:

- User preferred tags.
- Followed organizers.
- Event start date.
- Seats available.
- Already registered status.

Output:

- Sorted list with reasons.

This is enough to look personalized and remain easy to debug.

---

## 23. Security design

### 23.1 Passwords

Use Argon2id if possible.

```ts
import argon2 from 'argon2';

const hash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
});
```

Bcrypt is acceptable if Argon2id setup is painful.

Rules:

- Never store plaintext passwords.
- Never log passwords.
- Never return password hash.
- Add rate limiting to login.

### 23.2 Auth tokens

Recommended:

- Access token expires in 15 minutes.
- Refresh token/session expires in 7 to 30 days.
- Store refresh token hash in `sessions.tokenHash`.
- Revoke on logout.

### 23.3 Authorization checks

Every sensitive route must check role and ownership.

Bad:

```ts
app.put('/events/:id', requireAuth, updateEvent);
```

Good:

```ts
app.put('/events/:id', requireAuth, requireRole('ORGANIZER'), requireEventOwner, updateEvent);
```

### 23.4 Input validation

Use Zod at every boundary:

- Body.
- Params.
- Query.
- Headers like idempotency key.

### 23.5 SQL injection safety

- Use Prisma query builder for normal queries.
- For raw SQL, use tagged template `$queryRaw`, not string concatenation.

Good:

```ts
await tx.$queryRaw`SELECT id FROM events WHERE id = ${eventId}::uuid FOR UPDATE`;
```

Bad:

```ts
await tx.$queryRawUnsafe(`SELECT id FROM events WHERE id = '${eventId}' FOR UPDATE`);
```

### 23.6 XSS safety

- Store descriptions as plain text or sanitized markdown.
- Do not render raw HTML from event descriptions.
- Escape user content in frontend.

### 23.7 Privacy rules

- Students see only their own registration details.
- Students do not see full waitlist names.
- Organizers see emails only for their own event registrations.
- Job logs shown to organizers must be scoped to their own events.

---

## 24. Scalability design

### 24.1 Database scaling

Indexes already included:

- `events(status, starts_at)` for public event catalog.
- `events(organizer_id, status)` for organizer dashboard.
- `registrations(event_id, status)` for capacity counts.
- Partial FIFO index for waitlist promotion.
- `notification_jobs(status, run_at)` for worker polling.

### 24.2 Avoid N+1 queries

For event list, do not query tags/counts one event at a time.

Use:

```ts
prisma.event.findMany({
  include: {
    tags: { include: { tag: true } },
  },
});
```

Counts are denormalized on `Event`, so list pages are cheap.

### 24.3 Queue scaling

Start with one worker.

Scale by running more worker processes. `FOR UPDATE SKIP LOCKED` prevents workers from claiming the same job.

### 24.4 High-traffic events

The event row lock serializes registration per event. This is safe and simple.

If traffic becomes huge, options:

1. Short transaction body.
2. Do not render templates inside the transaction.
3. Keep email work in worker.
4. Use Redis queue later.
5. Use Postgres advisory locks if needed.

For this assignment, event-row locking is the right tradeoff.

### 24.5 Caching

Optional:

- Cache `GET /events` for anonymous users for 15 seconds.
- Do not cache personalized registration status.
- Invalidate on publish/cancel/register/cancel registration.

### 24.6 Readiness and monitoring

Expose:

- `/health` process alive.
- `/ready` DB reachable.
- Worker heartbeat row or log.
- Failed job count on organizer dashboard.

---

## 25. Testing plan

### 25.1 Unit tests

Test pure logic:

- PulseScore labels.
- Recommendation scoring.
- Waitlist position calculation.
- Permission helper functions.
- Zod validation.

### 25.2 Integration tests

Use test database.

Required tests:

1. Student cannot create event.
2. Organizer can create draft.
3. Student cannot see draft.
4. Publish makes event visible.
5. Student registers and becomes confirmed.
6. Student registers when full and becomes waitlisted.
7. Student cannot register twice.
8. Student cannot view another student's registration.
9. Organizer cannot view another organizer's registrations.
10. Confirmed cancellation promotes next waitlisted user.
11. Queue jobs are created after registration.
12. Worker marks jobs sent and writes delivery logs.
13. Failed worker job retries then fails after max attempts.
14. Event cancellation queues notifications for affected users.

### 25.3 Concurrency test

This is important for grading.

Scenario:

- Event capacity = 3.
- Create 20 students.
- Fire 20 concurrent `POST /events/:id/registrations` requests.
- Assert exactly 3 confirmed.
- Assert 17 waitlisted.
- Assert no duplicate waitlist sequence.
- Assert waitlist positions are 1 through 17.

Pseudo-test:

```ts
const results = await Promise.allSettled(
  students.map((student) => apiAs(student).post(`/events/${event.id}/registrations`))
);

const registrations = await prisma.registration.findMany({ where: { eventId: event.id } });

expect(registrations.filter(r => r.status === 'CONFIRMED')).toHaveLength(3);
expect(registrations.filter(r => r.status === 'WAITLISTED')).toHaveLength(17);
expect(new Set(registrations.map(r => r.waitlistSequence).filter(Boolean)).size).toBe(17);
```

### 25.4 Worker test

- Insert pending job.
- Run worker once.
- Assert status `SENT`.
- Assert `NotificationDelivery` row created.
- Run worker again.
- Assert no duplicate delivery row.

---

## 26. Demo script for competition

### 26.1 Demo flow

1. **Organizer creates draft**
   - Show form.
   - Capacity set to 2.
   - Add tags.

2. **Organizer previews event**
   - Show student-preview mode.
   - Explain this satisfies UX polish.

3. **Organizer publishes event**
   - Status changes to `PUBLISHED`.
   - Student catalog now shows it.

4. **Student A registers**
   - Gets `CONFIRMED`.
   - Notification job appears.
   - Worker sends/logs notification.

5. **Student B registers**
   - Gets `CONFIRMED`.

6. **Student C registers**
   - Event is full.
   - Gets `WAITLISTED`, position 1.

7. **Show organizer waitlist**
   - Student C is first.
   - FIFO sequence visible.

8. **Student A cancels**
   - Student C auto-promotes.
   - Show transition ledger.
   - Show `WAITLIST_PROMOTED` notification job.

9. **Show worker proof**
   - Job becomes `SENT`.
   - Delivery log exists.
   - In-app notification appears for Student C.

10. **Run concurrency test result**
   - Show terminal: capacity 3, 20 concurrent registrations, exactly 3 confirmed.

### 26.2 Presentation talking points

Say this:

```txt
Our main design goal was correctness under pressure. The most dangerous bug in this project is overbooking. We prevent it by locking the event row inside the registration transaction. We also separate domain events from notification jobs, so user-facing requests stay fast and retries are safe.
```

Do not say this:

```txt
We used Prisma so overbooking cannot happen automatically.
```

That would be false. Prisma alone does not solve concurrency. The transaction and lock do.

---

## 27. Implementation milestones

### Milestone 1: Foundation

- Create repo.
- Add PostgreSQL Docker Compose.
- Add Prisma schema.
- Run migration.
- Add seed script:
  - 1 organizer.
  - 5 students.
  - 5 tags.
  - 3 draft events.

### Milestone 2: Auth

- Register student.
- Login.
- Logout.
- `GET /users/me`.
- Password hashing.
- Session table.

### Milestone 3: Events

- Organizer create draft.
- Organizer edit own draft.
- Publish.
- Student list published.
- Event details with counts.
- Ownership checks.

### Milestone 4: Registration correctness

- Register confirmed.
- Register waitlisted.
- Prevent duplicate active registration.
- Cancel own registration.
- Auto-promote waitlist.
- Concurrency test.

### Milestone 5: Domain events and worker

- Insert domain events in transactions.
- Insert notification jobs.
- Worker polls jobs.
- Log adapter.
- In-app notifications.
- Email adapter.
- Delivery logs.
- Retry policy.

### Milestone 6: Organizer command center

- Confirmed list.
- Waitlist list.
- Job list.
- Event analytics.
- Preview mode.

### Milestone 7: Competition polish

- PulseScore labels.
- Event Galaxy UI.
- FairSeat Ledger UI.
- QR check-in optional.
- Demo seed script.
- Presentation screenshots.

---

## 28. Seed data plan

### 28.1 Users

```txt
organizer@school.edu / password123 / ORGANIZER
maya@school.edu / password123 / STUDENT
luis@school.edu / password123 / STUDENT
nora@school.edu / password123 / STUDENT
kai@school.edu / password123 / STUDENT
zara@school.edu / password123 / STUDENT
```

### 28.2 Tags

```txt
AI
Workshop
Career
Music
Sports
Wellness
Design
Robotics
```

### 28.3 Events

1. `Build an AI Study Buddy in 90 Minutes`
   - Capacity 2.
   - Published.
   - Used for waitlist demo.

2. `Campus Jazz Night`
   - Capacity 80.
   - Published.

3. `Robotics Club: Sumo Bot Challenge`
   - Capacity 20.
   - Draft.
   - Used for preview demo.

4. `Finals Week Wellness Lab`
   - Capacity 25.
   - Published.

---

## 29. Environment variables

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/campuspulse?schema=public"
NODE_ENV="development"
PORT="4000"
JWT_ACCESS_SECRET="replace-me"
JWT_REFRESH_SECRET="replace-me"
ACCESS_TOKEN_TTL_MINUTES="15"
REFRESH_TOKEN_TTL_DAYS="14"
PASSWORD_HASHER="argon2id"
EMAIL_PROVIDER="log"
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
WORKER_ID="worker-local-1"
WORKER_POLL_INTERVAL_MS="1000"
WORKER_BATCH_SIZE="10"
APP_URL="http://localhost:3000"
```

---

## 30. API implementation details

### 30.1 Route registration order

```ts
app.use(requestId());
app.use(json());
app.use(rateLimit());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/events', eventsRoutes);
app.use('/api/v1/registrations', registrationsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/notification-jobs', notificationJobRoutes);
app.use('/api/v1/health', healthRoutes);
app.use(errorHandler());
```

### 30.2 Error class

```ts
class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: unknown = {}
  ) {
    super(message);
  }
}
```

### 30.3 Error handler

```ts
function errorHandler() {
  return (err, req, res, next) => {
    if (err instanceof AppError) {
      return res.status(err.status).json({
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
          requestId: req.id,
        },
      });
    }

    console.error(err);

    return res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unexpected server error.',
        details: {},
        requestId: req.id,
      },
    });
  };
}
```

---

## 31. Worker implementation details

### 31.1 Job handler routing

```ts
const handlers = {
  REGISTRATION_CONFIRMED: handleRegistrationConfirmed,
  REGISTRATION_WAITLISTED: handleRegistrationWaitlisted,
  WAITLIST_PROMOTED: handleWaitlistPromoted,
  REGISTRATION_CANCELLED: handleRegistrationCancelled,
  EVENT_CANCELLED: handleEventCancelled,
  EVENT_PUBLISHED: handleEventPublished,
};
```

### 31.2 Handler shape

```ts
async function handleRegistrationConfirmed(job: NotificationJob) {
  const fullJob = await prisma.notificationJob.findUniqueOrThrow({
    where: { id: job.id },
    include: {
      event: true,
      recipient: true,
      registration: true,
    },
  });

  if (!fullJob.recipient || !fullJob.event) {
    throw new Error('Missing recipient or event');
  }

  const rendered = renderTemplate(fullJob.type, {
    user: fullJob.recipient,
    event: fullJob.event,
    registration: fullJob.registration,
  });

  if (job.channel === 'EMAIL') {
    await emailAdapter.send({
      to: fullJob.recipient.email,
      subject: rendered.subject,
      text: rendered.text,
    });
  }

  if (job.channel === 'IN_APP') {
    await prisma.inAppNotification.create({
      data: {
        userId: fullJob.recipient.id,
        eventId: fullJob.event.id,
        registrationId: fullJob.registrationId,
        type: fullJob.type,
        title: rendered.title,
        body: rendered.shortBody,
      },
    });
  }

  await prisma.notificationDelivery.create({
    data: {
      jobId: job.id,
      userId: fullJob.recipient.id,
      channel: job.channel,
      status: 'SENT',
      provider: process.env.EMAIL_PROVIDER ?? 'log',
    },
  });
}
```

### 31.3 Failed job update

```ts
async function markFailedOrRetry(job, error) {
  const attempts = job.attempts;
  const shouldRetry = attempts < job.maxAttempts;

  await prisma.notificationJob.update({
    where: { id: job.id },
    data: shouldRetry
      ? {
          status: 'PENDING',
          runAt: new Date(Date.now() + retryDelayMs(attempts)),
          lastError: String(error.message ?? error),
          lockedAt: null,
          lockedBy: null,
        }
      : {
          status: 'FAILED',
          failedAt: new Date(),
          lastError: String(error.message ?? error),
          lockedAt: null,
          lockedBy: null,
        },
  });
}
```

---

## 32. Competition-grade UI ideas

### 32.1 Student Event Galaxy

Event cards:

```txt
[AI Workshop]
Build an AI Study Buddy
Apr 29, 4:00 PM
Innovation Lab 2B
28/30 seats
Pulse: Almost Full
[Register]
```

When full:

```txt
30/30 seats
Waitlist: 4
Pulse: Waitlist Active
[Join Waitlist]
```

### 32.2 FairSeat Ledger display

```txt
Maya's registration timeline
12:05 Joined waitlist, position #1
09:00 Promoted to confirmed after a seat opened
09:00 Notification sent
```

### 32.3 Organizer Command Center

Cards:

```txt
Confirmed: 30 / 30
Waitlist: 4
Notifications sent: 33
Failed jobs: 0
Check-ins: 0
```

Tabs:

```txt
Details | Confirmed | Waitlist | Notifications | Analytics | Preview
```

### 32.4 Notification job console

```txt
SENT      EMAIL   WAITLIST_PROMOTED          attempts 1
SENT      IN_APP  WAITLIST_PROMOTED          attempts 1
FAILED    EMAIL   EVENT_CANCELLED            attempts 5
PENDING   EMAIL   REGISTRATION_CONFIRMED     attempts 0
```

This visually proves the async requirement.

---

## 33. Edge cases

### 33.1 Student tries to register for draft

Return `404` or `409`. Prefer `404` if student should not know draft exists.

### 33.2 Student registers twice

Return `409 ALREADY_REGISTERED`.

### 33.3 Student cancels after event starts

Return `409 EVENT_ALREADY_STARTED`.

### 33.4 Organizer decreases capacity below confirmed count

Return `409 CAPACITY_BELOW_CONFIRMED_COUNT`.

### 33.5 Waitlisted student cancels

No promotion. Only remove them from active waitlist.

### 33.6 Confirmed student cancels and waitlist empty

Seat becomes open. No promotion job.

### 33.7 Promoted student had email disabled

Still create in-app notification if enabled. Email job can be marked `SENT` with delivery `SKIPPED`, or mark job `CANCELLED`. Prefer `SENT` plus delivery `SKIPPED` for clear audit.

### 33.8 Email provider fails

Worker retries. API request is not affected.

### 33.9 Event cancelled while users register concurrently

Both cancel and register lock the same event row. One wins first. If cancellation commits first, registration sees `CANCELLED` and fails.

---

## 34. Grading maximization checklist

### Functionality

- [ ] Student and organizer auth works.
- [ ] 403 for forbidden role actions.
- [ ] Students cannot see other registrations.
- [ ] Organizer owns events.
- [ ] Draft creation works.
- [ ] Publish works.
- [ ] Students see only published events.
- [ ] Event cancel behavior documented and implemented.
- [ ] Confirmed vs waitlisted works.
- [ ] FIFO waitlist works.
- [ ] No overbooking under concurrency test.
- [ ] Student cancellation works.
- [ ] Automatic promotion works.
- [ ] Organizer confirmed list works.
- [ ] Organizer waitlist order works.

### Backend

- [ ] Relational DB schema exists.
- [ ] Prisma migrations exist.
- [ ] Constraints and indexes exist.
- [ ] API and worker are separate runnable processes.
- [ ] Transactional outbox exists.
- [ ] REST API coverage matches spec.
- [ ] Error shape is consistent.

### Additional features

- [ ] At least 3 job types flow API to worker.
- [ ] Email or log adapter works.
- [ ] In-app notification log works.
- [ ] Job states visible.
- [ ] Retries work.
- [ ] Idempotency key prevents duplicates.

### Frontend

- [ ] Student event browsing.
- [ ] Student register/cancel.
- [ ] Student own registrations.
- [ ] Organizer create/edit/publish.
- [ ] Organizer registrations/waitlist.
- [ ] Preview mode or clear role navigation.
- [ ] Empty states.
- [ ] Basic responsiveness.

### Security

- [ ] Slow password hashing.
- [ ] Input validation.
- [ ] No raw SQL concatenation.
- [ ] Sensitive authorization checks.
- [ ] No password hash leakage.

### Scalability

- [ ] Important indexes.
- [ ] Pagination.
- [ ] Worker batch polling.
- [ ] Short transactions.
- [ ] Denormalized counts updated safely.

### Presentation

- [ ] Demo publish to registration.
- [ ] Demo waitlist.
- [ ] Demo cancellation and promotion.
- [ ] Demo async notification visible.
- [ ] Demo concurrency test.

---

## 35. Final build recommendation

Build the reliable core first. Do not start with animations, AI, or badges. The order should be:

1. Prisma schema and migrations.
2. Auth and roles.
3. Event CRUD and publish.
4. Registration with transaction lock.
5. Cancellation and promotion.
6. Domain events and worker.
7. Organizer lists.
8. Frontend.
9. PulseScore, ledger UI, notification console.
10. Optional check-in and passport.

The project wins if the demo shows this exact chain:

```txt
publish -> register -> full -> waitlist -> cancel -> promote -> worker sends notification -> logs prove it
```

That chain directly proves correctness, async architecture, REST coverage, security, and UX polish.
