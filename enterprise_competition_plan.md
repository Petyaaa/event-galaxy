# CampusPulse Enterprise: Competition-Winning Application Plan

## 1. Executive thesis

CampusPulse Enterprise should not feel like a student CRUD assignment. It should feel like a calm, reliable campus operations platform that happens to satisfy every point in the School Events & Notification Center brief.

The winning angle is simple:

1. Make the required backend correctness visible.
2. Make the frontend feel enterprise-grade, dense, fast, and trustworthy.
3. Turn the demo into proof: publish an event, fill it, waitlist a student, cancel a confirmed registration, promote the next student, process async notifications, and show the audit trail.

The project PDFs reward reliability more than novelty. The novelty should therefore be wrapped around the required mechanisms rather than added as unrelated features. The app should expose waitlist fairness, notification delivery, job retries, idempotency, and role security as first-class product experiences.

## 2. PDF-grounded objective

Source documents:

- `School Events & Notification Center.pdf`
- `School Events - Grading Criteria.pdf`

The objective from the project brief is to build a school events and notification system:

- Organizers create draft events.
- Organizers publish events with capacity.
- Students browse only published events.
- Students register for events.
- If capacity exists, registration becomes `CONFIRMED`.
- If capacity is full, registration becomes `WAITLISTED` with FIFO ordering.
- When a confirmed student cancels, the next waitlisted student is promoted automatically.
- Registration-related changes produce domain events.
- Domain events enqueue notification work.
- A separate worker process processes queued jobs so HTTP requests stay fast.

The grading criteria total 170 points. The largest scoring surfaces are:

- Functionality: 40 points.
- Backend: 30 points.
- Additional async/reliability features: 25 points.
- Frontend: 15 points.
- Security: 15 points.
- Scalability and design: 15 points.
- REST endpoints: 10 points.
- Code quality: 10 points.
- Presentation: 10 points.

The plan below is optimized to score all required points and create a stronger impression than the rubric asks for.

### 2.1 Complete PDF reading summary

The project specification is six pages. The grading rubric is three pages. Together they define a backend-heavy competition task with an optional but score-bearing frontend. The real objective is not "make an event app"; the objective is to prove correct role separation, event lifecycle control, concurrency-safe seat allocation, deterministic FIFO waitlisting, event-driven notification processing, and clear presentation.

Spec page 1 establishes the core product:

- School events include lectures, clubs, workshops, and similar campus activities.
- Organizers create and publish events with capacity.
- Students register.
- Full events move students to a FIFO waitlist.
- A confirmed cancellation can promote the next waitlisted student.
- Important state changes must be recorded as domain events.
- Async work must be enqueued so HTTP requests stay fast.
- A separate worker sends notifications.

Spec page 1 also defines the two main users:

- Students can see published events, register, receive `CONFIRMED` or `WAITLISTED`, cancel their own registration if the team allows it, and see only their own registrations.
- Organizers can create/edit drafts, publish, set capacity and event metadata, cancel events, and list registrations/waitlists only for their own events.

Spec page 2 is the highest-risk requirements page:

- Students must only list/read `PUBLISHED` events.
- Organizers must support cancel or close.
- Registration must be confirmed if capacity exists and waitlisted otherwise.
- Waitlist ordering must be FIFO.
- Confirmed seats must never overbook, including concurrent POST requests.
- A user may have at most one active registration per event.
- Student cancellation must follow a documented rule.
- Confirmed-seat cancellation must promote the next waitlisted student.
- Organizer registration and waitlist views are scoped to owned events.
- Async notification jobs must be created after successful persistence.
- At least three event/job types must run end-to-end through API, queue, worker, and email/log delivery.
- REST coverage, status codes, JSON validation errors, and protected routes matter.

Spec page 2 optional features should be treated as competition differentiators:

- `GET / PUT /users/me`.
- Retries and idempotency.
- Health/readiness endpoints.
- Event cancellation notification.
- In-app notifications.
- Search/filter.

Spec page 3 defines architecture expectations:

- Relational database is mandatory.
- REST API must align with the document.
- Sensitive operations need authorization checks.
- API and worker must be separate runnable processes.
- A monolithic codebase is acceptable; microservices are not required.
- Frontend, while called optional in the spec, is explicitly graded in the rubric and must be built.
- Role-based views and organizer preview mode are expected polish opportunities.

Spec page 4 lists the core REST surface:

- Auth: register, login, logout.
- Events: create, list, detail, update, publish, cancel.
- Registrations: register, cancel, `me`, organizer confirmed list, organizer waitlist.
- Profile: current user and update.
- Notification jobs: job detail and optional filtered list.

Spec pages 5 and 6 explain the intended event-driven design:

- Domain events are facts that already happened.
- Events should carry ids and type, not arbitrary client-supplied email content.
- The worker should load names/emails from the database.
- A DB table as queue/outbox is explicitly recommended as the simplest approach.
- The best flow is validate, authorize, start transaction, change business state, insert queue rows inside the same transaction, commit, and return quickly.
- The PDF names enough event types: `RegistrationConfirmed`, `RegistrationWaitlisted`, `RegistrationCancelled`, `WaitlistPromoted`, `EventPublished`, `EventCancelled`.
- Idempotency can be handled by unique job keys or by checking existing delivery records.

Rubric page 1 makes the backend the scoring center:

- 40 points for functionality.
- 30 points for backend.
- The two biggest individual criteria are registration correctness at 15 points and event-driven worker processing at 10 points.
- Database schema, migrations, constraints, REST correctness, status codes, and protected routes are all separately scored.

Rubric page 2 turns optional reliability into scored work:

- Three queued job/event types are worth 10 points.
- Delivery proof is worth 5 points.
- Job states/retries/failure visibility are worth 5 points.
- Idempotency is worth 5 points.
- Frontend is worth 15 points and specifically includes student browse/register/cancel, organizer manage/view lists, preview or role navigation, empty states, and responsiveness.
- Security is worth 15 points.
- Scalability/design is worth 15 points.

Rubric page 3 rewards execution quality:

- Clean repo layout separating API, worker, config, and migrations.
- Consistent naming and formatting.
- Comments/docs for non-obvious waitlist transactions.
- Shared modules/types.
- Presentation must clearly demonstrate publish -> register/waitlist -> cancel -> promotion -> async notification visible.

### 2.2 Requirement traceability matrix

| PDF requirement | Source | Enterprise implementation | Judge-visible proof |
|---|---:|---|---|
| Student and organizer registration/login | Spec p.1, Rubric p.1 | Auth service with slow password hash, seeded organizers, public student registration | Login/register UI, API tests, README account policy |
| Role-based access control with forbidden actions | Spec p.1, Rubric p.1 | Central `requireRole` and ownership guards on every API route | 403 proof cards in Proof Mode, Playwright tests |
| Students see only own registrations | Spec p.1, Rubric p.1 | `/api/registrations/me` filters by session user id; no arbitrary user id accepted | Student registration page and negative API test |
| Organizers create/edit drafts | Spec p.1, Rubric p.1 | Draft editor, event service, `DRAFT` validation | Organizer dashboard, event lifecycle test |
| Publish `DRAFT -> PUBLISHED` | Spec pp.1,4, Rubric p.1 | Publish endpoint validates owner and draft readiness | Status transition timeline, published event appears for students |
| Students see/read only published events | Spec pp.1-2, Rubric p.1 | Event list query depends on role; students get published only | Student UI excludes drafts; direct draft URL returns 404/403 |
| Cancel or close event with documented behavior | Spec pp.1-2, Rubric p.1 | `CANCELLED` blocks new registrations and cancels active rows; `CLOSED` blocks new rows only | README policy, cancellation demo, event status tests |
| Organizer ownership enforced | Spec pp.1,3, Rubric pp.1-2 | Every event mutation/read joins on `organizerId` | Negative test using second organizer |
| Confirm if capacity exists | Spec p.2, Rubric p.1 | Transaction locks event row and compares `confirmedCount < capacity` | Registration demo and DB counters |
| Waitlist if full | Spec p.2, Rubric p.1 | Registration creates `WAITLISTED` with sequence | Student sees position; organizer sees FIFO table |
| FIFO waitlist | Spec p.2, Rubric p.1 | Monotonic `nextWaitlistSequence`; promotion orders by sequence | FairSeat Ledger and waitlist table |
| No overbooking under concurrency | Spec p.2, Rubric p.1 | `SELECT ... FOR UPDATE` on event row plus partial unique index | Concurrency Playwright/API drill |
| One active registration per event | Spec p.2, Rubric p.1 | Partial unique index on `(eventId, userId)` for active statuses | Duplicate registration returns 409 |
| Student cancellation rule | Spec p.2, Rubric p.1 | Allowed until event start; active registration only | README policy and UI disabled state after start |
| Automatic waitlist promotion | Spec p.2, Rubric p.1 | Cancel transaction locks event and next waitlisted row, then promotes | Demo flow and ledger event |
| Organizer confirmed list | Spec p.2, Rubric p.1 | Owned event endpoint returns confirmed registrations | Organizer table |
| Organizer ordered waitlist | Spec p.2, Rubric p.1 | Owned event endpoint returns waitlist ordered by sequence | Organizer waitlist table |
| Domain events plus queue | Spec pp.2,5, Rubric pp.1-2 | `DomainEvent` and `NotificationJob` inserted transactionally | Proof Mode rows |
| Separate worker process | Spec pp.2-3, Rubric p.1 | `npm run worker` starts standalone consumer | Terminal command and worker heartbeat |
| At least three event/job types | Spec pp.2,6, Rubric p.2 | Confirmed, Waitlisted, Promoted, Cancelled, EventCancelled | Job type distribution panel |
| Email/log delivery proof | Spec pp.2,6, Rubric p.2 | Log adapter and `NotificationDelivery` table; optional SMTP | Delivery attempts table |
| Job states and retries | Spec p.2 optional, Rubric p.2 | `PENDING`, `PROCESSING`, `SENT`, `FAILED`, attempts, backoff | Queue Operations panel |
| Idempotency | Spec p.6, Rubric p.2 | Unique `idempotencyKey` and delivery dedupe | Idempotency column and retry test |
| REST endpoints | Spec pp.3-4, Rubric p.2 | Route handlers for every listed resource | API contract table, Playwright request tests |
| `GET/PUT /users/me` | Spec p.2 optional, p.4 | Profile route and settings screen | Profile page |
| Health/readiness | Spec p.2 optional | `/api/health`, `/api/ready`, optional worker heartbeat | Ops panel |
| Event cancellation notification | Spec p.2 optional, p.6 | `EventCancelled` bulk job or per-user jobs | Cancellation demo |
| In-app notifications | Spec p.2 optional | `NotificationDelivery` or `InAppNotification` feed | Student notification inbox |
| Search/filter | Spec p.2 optional | Query/date/tag/status filters | Student event catalog |
| Responsive student UI | Spec p.3, Rubric p.2 | Mobile/desktop layouts, sticky action on mobile | Playwright screenshots |
| Organizer preview mode | Spec p.3, Rubric p.2 | Draft preview route with disabled student actions | Preview tab before publish |
| Slow password hashing | Rubric p.2 | Argon2id or bcrypt | Auth implementation and README |
| Input validation and XSS/SQL safety | Rubric p.2 | Zod schemas, Prisma params, text rendering only | Error UI and validation tests |
| Scalability design | Rubric p.2 | Indexes, counters, pagination, worker batching, SKIP LOCKED | README architecture and DB indexes |
| Clean layout | Rubric p.3 | `src/server`, `src/worker`, `prisma`, role-based UI dirs | Repo tree |
| Non-obvious logic docs | Rubric p.3 | Comments around seat allocation transaction | Code comments and README diagram |
| Presentation flow | Rubric p.3 | Seeded scenario and Proof Mode checklist | 5-minute demo |

### 2.3 Scoring attack plan

The plan must aim beyond "works on happy path." The target is to make every scorer check a box without searching.

| Category | Points | Winning proof asset |
|---|---:|---|
| Functionality | 40 | Live lifecycle demo, role tests, concurrency drill, FIFO ledger |
| Backend | 30 | Prisma migrations, separate worker, route contract, README architecture |
| Additional features | 25 | Job states, retries, idempotency keys, delivery logs, at least five job types |
| Frontend | 15 | Real student/organizer portals, preview mode, empty states, responsive screenshots |
| REST endpoints | 10 | Complete API surface and request tests |
| Security | 15 | Slow hashes, Zod, ownership guards, negative tests |
| Scalability/design | 15 | Indexes, pagination, outbox batching, `SKIP LOCKED`, documented scale path |
| Code quality | 10 | Modular services, shared DTOs, focused transaction comments |
| Presentation | 10 | Proof Mode plus scripted publish/register/waitlist/cancel/promote/worker demo |

The highest-leverage work is:

1. Transaction-safe registration and promotion.
2. Separate worker with persistent job state.
3. UI surfaces that expose the above instead of hiding them.
4. Tests and Proof Mode that make edge cases undeniable.

### 2.4 Market-difference snapshot

This plan should not imitate a generic school calendar, Eventbrite clone, or notification inbox. Common products already cover fragments of the space:

- Event platforms commonly provide event creation, booking, ticketing, and waitlist support.
- Calendar products commonly provide availability, booking pages, and event notifications.
- School communication products commonly provide messaging, translation, reminders, and engagement tracking.
- Learning-management calendars commonly provide school/course/group event calendars and notification preferences.

CampusPulse Enterprise should be different by combining five things in one school-native product:

1. **Provable fairness:** students and organizers can see why a seat moved, not just that it moved.
2. **Operational transparency:** async notification jobs, retries, idempotency, and delivery proof are part of the UI.
3. **Live proof tools:** concurrency and worker behavior can be demonstrated, not merely described.
4. **Discovery mechanics:** events are organized into trails, crews, maps, and student goals instead of a flat list.
5. **Respectful notifications:** the system optimizes for useful communication, not more noise.

Reference points used for differentiation:

- Google Calendar appointment schedules focus on availability and booking pages: https://support.google.com/calendar/answer/10729749
- Google Calendar supports email, desktop, and alert notifications for calendar changes: https://support.google.com/calendar/answer/37242
- Remind emphasizes school communication, device reach, and translation: https://www.remind.com/
- Schoology Calendar supports school/course/group event calendars and RSVP-style event details: https://uc.powerschool-docs.com/en/schoology/latest/calendar
- Schoology notifications allow email/text preferences for school activity: https://uc.powerschool-docs.com/en/schoology/latest/personal-account-notifications

Differentiation claim:

> CampusPulse Enterprise is not just event management. It is a fairness-visible, worker-observable, student-delight campus operating layer for events.

## 3. Product identity

Product name: `CampusPulse Enterprise`

Short pitch:

> CampusPulse Enterprise is a school event operations command center. Students discover campus experiences, reserve seats, track waitlist position, and receive reliable updates. Organizers publish events, monitor capacity pressure, view a transparent FIFO ledger, and inspect every async notification job from creation to delivery.

Positioning:

- Not just an event list.
- Not just a registration form.
- A proof-driven system for fair seating, role-safe access, and observable notifications.

Core promise:

> Every seat movement is explainable. Every notification is traceable. Every role sees exactly what it should.

## 4. Competition strategy

The judges will likely test boring but critical things:

- Can a student access organizer routes?
- Can an organizer see another organizer's event?
- Can a student see another student's registrations?
- Can two simultaneous requests overbook a capacity-limited event?
- Does waitlist promotion respect FIFO order?
- Does async work really happen outside the HTTP request path?
- Are retries/idempotency visible or only claimed?
- Are REST errors consistent?

CampusPulse Enterprise should treat those tests as product features.

Instead of hiding backend machinery, the UI should show:

- Seat ledger.
- Waitlist order.
- Notification jobs.
- Delivery attempts.
- Idempotency keys.
- Retry state.
- Role-scoped navigation.
- Empty states that explain the current role's next action.

This turns the grading rubric into a live demo.

## 5. Non-negotiable technical constraints

1. Use Next.js with Prisma.
2. Use PostgreSQL, but do not use the existing Postgres instance for the other project.
3. Run this project's Postgres on a different host port.
4. Keep API and worker as separate runnable processes.
5. Use a relational schema with migrations and constraints.
6. Use slow password hashing.
7. Use server-side role and ownership checks for every sensitive operation.
8. Use transaction-safe registration logic that prevents overbooking under concurrency.
9. Use queue/outbox rows and a separate worker for notifications.
10. Before implementation, install dependencies and read the relevant local Next.js guide under `node_modules/next/dist/docs/` as required by `AGENTS.md`. The current checkout has no `node_modules`, so the local guide is not available yet.

## 6. Port and infrastructure plan

There is already an active Postgres for another project. This application should use its own isolated Postgres container and host port.

Recommended ports:

- Existing external Postgres: leave untouched.
- CampusPulse Postgres container internal port: `5432`.
- CampusPulse Postgres host port: `55434` in this workspace because `55432` and `55433` are already allocated.
- CampusPulse Next.js dev server: `3010`.
- Optional worker metrics/readiness port: `3011`.

Recommended database URL:

```bash
DATABASE_URL="postgresql://campuspulse:campuspulse_dev_password@localhost:55434/campuspulse_enterprise?schema=public"
```

Recommended Docker Compose service:

```yaml
services:
  campuspulse-db:
    image: postgres:16
    container_name: campuspulse-enterprise-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: campuspulse
      POSTGRES_PASSWORD: campuspulse_dev_password
      POSTGRES_DB: campuspulse_enterprise
    ports:
      - "127.0.0.1:55434:5432"
    volumes:
      - campuspulse_enterprise_pgdata:/var/lib/postgresql/data

volumes:
  campuspulse_enterprise_pgdata:
```

Recommended scripts:

```json
{
  "dev": "next dev -p 3010",
  "db:up": "docker compose -f docker-compose.campuspulse.yml up -d",
  "db:down": "docker compose -f docker-compose.campuspulse.yml down",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:studio": "prisma studio",
  "worker": "tsx src/worker/notification-worker.ts",
  "worker:once": "tsx src/worker/notification-worker.ts --once",
  "seed": "tsx prisma/seed.ts",
  "validate": "next build && playwright test"
}
```

## 7. Recommended stack

Frontend:

- Next.js `16.2.9` already pinned in `package.json`.
- React `19.2.4` already pinned.
- TypeScript for new server/domain code.
- CSS variables and a small local design system.
- `lucide-react` for icon buttons and role/status iconography.
- `framer-motion` only for subtle state transitions, never for distracting decoration.
- Playwright for end-to-end and API workflow tests.

Backend:

- Next.js route handlers for REST endpoints.
- Prisma ORM.
- PostgreSQL on port `55434`.
- Zod for request validation.
- `argon2` preferred for password hashing, or `bcrypt` if install constraints make Argon2 difficult.
- Signed httpOnly session cookie or JWT in httpOnly cookie.
- Domain service modules for event lifecycle, registration, and notification outbox.

Worker:

- Separate Node process.
- Prisma-backed transactional outbox table.
- Polling with row locking.
- `FOR UPDATE SKIP LOCKED` to safely process jobs.
- Log-only notification adapter in development.
- Optional SMTP/Resend adapter if time allows.

Testing:

- Playwright UI flows.
- Playwright API request tests for REST contract.
- A concurrency test that fires simultaneous registrations at a low-capacity event.
- Worker tests with `worker:once`.

## 7.1 Enterprise system model

CampusPulse Enterprise should be built as one deployable application with four explicit runtime responsibilities. This keeps the implementation feasible while still looking like a real enterprise system.

Runtime responsibilities:

```text
Browser
  -> Next.js web UI
  -> Next.js REST route handlers
  -> PostgreSQL source of truth
  -> Notification worker
  -> Notification adapter
```

Logical bounded contexts:

| Context | Ownership | Main tables | Main routes | Enterprise concern |
|---|---|---|---|---|
| Identity and access | Sessions, roles, ownership policy | `User`, `Session`, `AuditLog` | `/register`, `/login`, `/logout`, `/users/me` | Prevent data leakage and role bypass |
| Event lifecycle | Draft, publish, close, cancel | `Event`, `DomainEvent` | `/events`, `/events/:id/publish`, `/events/:id/cancel` | State machine correctness |
| Seat allocation | Confirmed seats, waitlist, cancellation, promotion | `Registration`, `Event`, `DomainEvent` | `/events/:id/registrations`, `/registrations/:id`, `/registrations/me` | No overbooking and FIFO fairness |
| Notification operations | Jobs, retries, delivery logs, idempotency | `NotificationJob`, `NotificationDelivery` | `/notification-jobs`, `/notifications/me` | Async reliability proof |
| Experience layer | Role-specific application UI | Reads all contexts through REST | Student and organizer routes | Make backend truth visible |

Architecture principles:

1. The database is the source of truth. Browser state never decides capacity, role access, waitlist position, or job state.
2. Route handlers are thin. They authenticate, validate, call server services, and format responses.
3. Business invariants live in server-side services.
4. The registration service owns seat allocation and promotion. No other module updates registration state directly.
5. Domain events describe facts that already happened. They never contain arbitrary client-provided email bodies.
6. Notification jobs are created transactionally with the business change that caused them.
7. The worker is a separate process and can be scaled horizontally later.
8. UI pages display real database evidence, not mocked proof.

Enterprise invariants:

| Invariant | Enforcement layer | Test/proof |
|---|---|---|
| Confirmed registrations never exceed capacity | Transaction row lock and event counters | Concurrency storm test |
| One active registration per user/event | Partial unique DB index plus service check | Duplicate registration test |
| Waitlist order is deterministic | `waitlistSequence` assigned under event lock | FIFO promotion test |
| Students cannot see others' registrations | Route policy filters by session user id | Cross-user access test |
| Organizers cannot see other organizers' events | Ownership guard checks `organizerId` | Cross-organizer access test |
| Jobs are not created for failed writes | Same transaction outbox insert | Rollback test |
| Retries do not duplicate notifications | Unique idempotency key and delivery dedupe | Worker retry test |
| Email body is not trusted from client | Worker builds content from DB ids | Payload validation test |
| Event cancellation has documented consequences | State transition service and README policy | Cancel event test |
| All sensitive routes require auth | Route middleware/helpers | Endpoint auth matrix test |

## 7.2 Enterprise-grade implementation posture

The judges should be able to infer engineering maturity from the repo without a long verbal explanation.

Required engineering artifacts:

- `.env.example` with isolated Postgres port `55434`.
- Docker Compose file for this project database only.
- Prisma schema and migrations.
- Seed script with deterministic demo users/events.
- Separate worker script.
- README with setup, architecture, state machines, endpoint table, and demo script.
- Playwright tests for UI and API.
- Concurrency test.
- Clear route/service/component organization.
- Short comments around the registration transaction.

Recommended non-code docs:

```text
docs/
  architecture.md
  api-contract.md
  state-machines.md
  reliability-and-idempotency.md
  demo-script.md
```

If time is tight, these docs can be README sections instead. The critical point is that the transaction, worker, and idempotency decisions are visible and defensible.

## 7.3 C4-style architecture view

System context:

```text
Student
  uses CampusPulse Web to browse, register, cancel, view own registrations

Organizer
  uses CampusPulse Web to create drafts, publish, cancel, view registrations and waitlist

CampusPulse Web/API
  stores truth in CampusPulse PostgreSQL
  enqueues notification jobs into PostgreSQL outbox

CampusPulse Worker
  consumes PostgreSQL outbox
  sends/logs notifications
  records delivery attempts
```

Container view:

```text
+-------------------+       +----------------------+       +-------------------+
| Browser           | HTTP  | Next.js web/API      | SQL   | PostgreSQL 55434  |
| Student/Organizer | ----> | route handlers       | ----> | source of truth   |
+-------------------+       +----------------------+       +-------------------+
                                      |                            ^
                                      | jobs in notification_jobs  |
                                      v                            |
                              +----------------------+             |
                              | Worker process       | SQL poll    |
                              | npm run worker       | ------------+
                              +----------------------+
                                      |
                                      v
                              +----------------------+
                              | Log/SMTP adapter     |
                              +----------------------+
```

Component view:

```text
src/server/auth
  session, password hashing, role guards

src/server/events
  event state machine, publish/cancel policy

src/server/registrations
  transaction-safe allocation, waitlist, promotion

src/server/notifications
  domain events, job creation, idempotency keys

src/worker
  polling, locking, retries, delivery adapters

src/components
  role-specific UI backed by REST responses
```

## 7.4 Enterprise readiness and observability

Readiness should not be decorative. It should prove the app can actually operate.

API health:

- `GET /api/health` returns process status, app version, uptime.
- `GET /api/ready` checks database connectivity and migration readiness.

Worker health:

- Worker writes heartbeat rows or updates a lightweight `WorkerHeartbeat` record.
- Proof Mode reads the latest heartbeat.
- If no worker heartbeat exists in the last configured interval, the UI shows "worker offline".

Structured logging:

- Every request receives a `requestId`.
- Error responses include `requestId`.
- Worker logs include `workerId`, `jobId`, `jobType`, `attempt`, `idempotencyKey`.

Audit logging:

- Publish event.
- Cancel event.
- Register.
- Cancel registration.
- Promote waitlist.
- Requeue job.

Production-style metrics to display in Proof Mode:

- Published events.
- Active registrations.
- Waitlisted registrations.
- Pending jobs.
- Failed jobs.
- Average attempts per sent job.
- Last worker heartbeat.
- Last domain event.

These metrics do not need Prometheus. They can be computed from PostgreSQL for the competition.

## 7.5 Failure-mode design

Enterprise systems are judged by how they behave under failure. CampusPulse should have designed answers for predictable failures.

| Failure | Expected behavior | Visible proof |
|---|---|---|
| Email provider fails | Job attempt is recorded, job returns to pending with backoff or fails after max attempts | Job details show attempts and last error |
| Worker crashes mid-job | Stale `PROCESSING` jobs are reclaimed after lock timeout | Worker recovery test or README explanation |
| Duplicate worker run | Idempotency prevents duplicate delivery | Re-run worker demo |
| User double-clicks register | Unique active registration prevents duplicates | UI disables and API returns existing/409 |
| Organizer cancels event during registration storm | Event row lock serializes outcome | Cancellation/concurrency test |
| Draft event direct URL by student | Returns 404 or 403, no draft data leak | Negative API/UI test |
| Transaction fails after registration insert | Whole transaction rolls back, no job remains | Rollback unit/integration test |
| Waitlisted user cancels | Waitlist count decrements; no promotion needed | Registration test |
| Confirmed user cancels with empty waitlist | Confirmed count decrements; no promotion event | Registration test |


## 8. Application concept

CampusPulse Enterprise has three product surfaces.

### 8.1 Student Portal

Purpose:

- Discover published events.
- Understand seat pressure.
- Register or join waitlist.
- Cancel own registration.
- Track own upcoming events.
- See notification history.
- See waitlist position without seeing other students' private data.

Primary student features:

- Published event catalog.
- Search and filters by time, tag, format, location, and availability.
- Event detail drawer with capacity, waitlist size, organizer, schedule, and policy.
- Register button with immediate status result.
- Waitlist position indicator.
- My Registrations page.
- Notification inbox.
- Optional bookmarks.
- Optional attendance/check-in history.

Novel student feature:

`Pulse Passport`

This is a lightweight, nonessential layer that makes the product memorable:

- Students see categories they have participated in: workshops, clubs, lectures, wellness, career, arts.
- It does not affect scoring logic.
- It is derived from confirmed/check-in history.
- It gives the demo a polished user outcome without adding risky backend complexity.

### 8.2 Organizer Command Center

Purpose:

- Create and manage events.
- Publish only when the event is ready.
- See capacity and waitlist state.
- Verify fairness.
- Track notification delivery.

Primary organizer features:

- Own event list segmented by `DRAFT`, `PUBLISHED`, `CLOSED`, and `CANCELLED`.
- Draft editor.
- Student preview before publish.
- Publish checklist.
- Cancel event flow with documented behavior.
- Confirmed registrations list.
- Ordered waitlist list.
- Seat ledger timeline.
- Notification jobs panel.
- Delivery attempts panel.
- Capacity and waitlist analytics.

Novel organizer feature:

`FairSeat Ledger`

Every registration state transition becomes an auditable timeline:

- `REGISTRATION_CONFIRMED`
- `REGISTRATION_WAITLISTED`
- `REGISTRATION_CANCELLED`
- `WAITLIST_PROMOTED`
- `EVENT_CANCELLED`

The organizer can view:

- Actor.
- Event.
- Previous state.
- New state.
- Timestamp.
- Waitlist sequence.
- Domain event id.
- Linked notification job ids.

This makes FIFO waitlist fairness visible and memorable.

### 8.3 Judge Proof Mode

Purpose:

- Make the grading rubric easy to verify during presentation.

Proof Mode is an internal/demo-only overlay or page that shows:

- Auth and role checks.
- Event lifecycle evidence.
- Capacity and waitlist counters.
- Last five domain events.
- Last five notification jobs.
- Worker status.
- Idempotency keys.
- Retry counts.
- Demo scenario checklist.

Recommended route:

```text
/ops/proof
```

This should be protected to organizer/admin/demo accounts only.

Proof Mode should not fake results. It should read real database rows.

### 8.4 The wow layer

The app should not only satisfy the rules. It should make the judges feel like they are looking at a serious product with original thinking. The strongest wow features should reuse the exact same system facts the rubric already requires: capacity, waitlist order, domain events, notification jobs, delivery attempts, retries, and role-scoped views.

Do not add novelty that competes with the core. Add novelty that makes the core unforgettable.

#### Wow feature 1: Event Galaxy Map

What it is:

- A live, interactive event map on the student dashboard.
- Events appear as orbiting nodes grouped by time, category, and capacity pressure.
- Node size reflects demand.
- Node ring color reflects status:
  - Open seats.
  - Almost full.
  - Waitlist active.
  - Registered by me.
- Clicking a node opens the same event detail panel used by list view.

Why it wows:

- It makes the app name real.
- It turns a basic event catalog into an exploratory campus surface.
- It is visual without being fake. Every node is backed by real event rows and counts.

Implementation:

- Build with SVG or Canvas in a client leaf component.
- Use deterministic layout from event metadata, not random motion.
- Respect reduced motion.
- Keep a table/list view beside it for accessibility and scanning.
- Mobile fallback becomes a horizontal timeline plus event cards.

Demo moment:

- Show capacity pressure changing after registrations.
- The event node changes from open to full to waitlist active.
- After promotion, the student's node state updates.

#### Wow feature 2: FairSeat Replay

What it is:

- A replayable timeline of seat allocation for a single event.
- The organizer can drag a time scrubber or press play.
- The UI reconstructs the event's registration history from `DomainEvent` rows.
- Confirmed seats and waitlist positions animate from one state to the next.

Why it wows:

- It makes FIFO fairness visible.
- It proves the system has durable domain events.
- It turns the hardest backend requirement into the most memorable UI moment.

Implementation:

- Source data: `DomainEvent` rows for the selected event.
- Render states:
  - Confirmed seats.
  - Waitlist queue.
  - Cancellations.
  - Promotions.
- Use short, purposeful motion:
  - Waitlisted row slides into confirmed list when promoted.
  - Cancelled registration fades to history.
- Reduced motion mode uses instant state changes.

Demo moment:

- After a confirmed student cancels, open FairSeat Replay.
- Press play and show the first waitlisted student moving into the seat.
- Point to the domain event ids below the visualization.

#### Wow feature 3: Queue Flight Recorder

What it is:

- A notification operations panel that looks like a flight recorder for async work.
- It shows every job from creation to delivery.
- It includes type, status, attempts, idempotency key, payload ids, delivery channel, and error history.

Why it wows:

- It proves the worker is real.
- It gives judges visible evidence for the entire Additional Features category.
- It feels enterprise because failures and retries are treated as normal operations, not hidden bugs.

Implementation:

- Source data:
  - `NotificationJob`
  - `NotificationDelivery`
  - `DomainEvent`
- Job detail drawer sections:
  - Triggering domain event.
  - Job payload ids.
  - Attempts.
  - Delivery log.
  - Idempotency check result.
  - Requeue action for admin/demo mode.

Demo moment:

- Run the worker once.
- Show jobs moving from `PENDING` to `PROCESSING` to `SENT`.
- Re-run the worker and show no duplicate delivery because idempotency catches it.

#### Wow feature 4: Concurrency Arena

What it is:

- A dev-only judge/proof tool that stress-tests registration.
- It creates or resets a small event, then fires many simultaneous registration requests.
- It displays the result as a scoreboard:
  - Capacity.
  - Attempted registrations.
  - Confirmed rows.
  - Waitlisted rows.
  - Duplicate active registrations.
  - Overbooked seats.
  - Waitlist sequence gaps or duplicates.

Why it wows:

- Most teams will claim no overbooking. This app can prove it live.
- It converts a hidden backend edge case into a dramatic demonstration.

Implementation:

- Available only when `DEMO_MODE=true`.
- Uses seeded demo students.
- Calls the real registration endpoint.
- Does not bypass service logic.
- Stores the drill result in Proof Mode for later inspection.

Demo moment:

- Run "25 simultaneous registrations against capacity 3."
- Show exactly 3 confirmed and 22 waitlisted.
- Show overbooked seats: 0.
- Show duplicate waitlist sequences: 0.

#### Wow feature 5: Split-Screen Judge Mode

What it is:

- A demo-only layout that shows multiple real role perspectives at once:
  - Organizer command center.
  - Student Maya.
  - Student Jordan.
  - Worker/job panel.
- Each pane is backed by a real session/persona in demo mode or a scoped API preview token.

Why it wows:

- It makes role isolation obvious.
- It avoids slow manual account switching.
- It lets judges see cause and effect instantly.

Implementation:

- `DEMO_MODE=true` only.
- Never ship as a production security bypass.
- Each pane must still call scoped APIs.
- Add a visible "Demo Mode" banner so it is not confused with production behavior.

Demo moment:

- Organizer publishes event in left pane.
- Student pane sees it appear.
- Student registers.
- Organizer pane sees confirmed count update.
- Worker pane shows pending job.

#### Wow feature 6: Publish Control Tower

What it is:

- A polished organizer publishing workflow.
- It feels like a launch checklist:
  - Required details.
  - Capacity policy.
  - Time validity.
  - Student preview.
  - Notification policy.
  - Cancellation policy.
- Publish is disabled until critical checks pass.

Why it wows:

- It turns a simple status transition into a professional workflow.
- It directly supports the preview-mode rubric point.

Implementation:

- Validation is shared with API schemas.
- Preview uses the same event card/detail components as the student view.
- Checklist results are generated from actual draft data.

Demo moment:

- Create an incomplete draft and show clear missing checks.
- Complete fields, preview as student, publish.
- The event appears in the student catalog.

#### Wow feature 7: Notification Composer Preview

What it is:

- Organizers can preview the notification templates that will be sent for each event state.
- Preview is read-only and generated server-side from ids/template data.
- The client cannot send arbitrary email body content.

Why it wows:

- It looks polished.
- It reinforces the PDF guidance that worker should load names/emails from DB rather than trusting client-provided email body.

Implementation:

- Templates:
  - Registration confirmed.
  - Registration waitlisted.
  - Waitlist promoted.
  - Event cancelled.
- Preview endpoint returns rendered subject/body for the current organizer's event only.
- Sending still happens through the worker.

Demo moment:

- Open event notification previews before publishing.
- Later show the worker used those templates to log delivery attempts.

#### Wow feature 8: Campus Calendar Intelligence

What it is:

- A student calendar-aware view that detects schedule conflicts between the student's registered events.
- It does not require external calendar integration.
- It uses existing event start/end times.

Why it wows:

- It feels useful and product-minded.
- It stays low-risk because it uses local event data.

Implementation:

- On `/registrations/me`, group confirmed/waitlisted events by date.
- Flag overlap between confirmed events.
- Show "No conflicts" or conflict warnings.
- Optional `.ics` download for confirmed events.

Demo moment:

- Register for two overlapping events.
- Student dashboard flags the conflict.
- Download `.ics` optional if implemented.

#### Wow feature 9: Campus Passport

What it is:

- A lightweight student achievement layer based on event categories and attendance/check-in history.
- It must be optional and should never distract from required flows.

Why it wows:

- It gives the student side personality.
- It makes the app feel like a real campus product.

Implementation:

- Rule-based badges:
  - Workshop Explorer.
  - Club Sampler.
  - Lecture Regular.
  - Career Sprint.
  - Wellness Week.
- Derived from confirmed/check-in history.
- No fake AI or invented precision.

Demo moment:

- Show a student profile with progress across categories.
- Keep it as a post-demo polish feature, not the main presentation.

#### Wow feature 10: Operations Runbook Drawer

What it is:

- Every failed job, forbidden action, or event cancellation has a small runbook drawer.
- It explains what happened, why the system behaved that way, and what action is allowed next.

Why it wows:

- It feels mature and enterprise-ready.
- It helps judges understand intentional behavior, especially cancellations and retries.

Implementation:

- Static runbook content mapped to error/job codes.
- Link from Proof Mode, failed job rows, and important error states.
- Keep copy concise and factual.

Demo moment:

- Simulate a notification failure.
- Open the runbook drawer.
- Show retry policy and idempotency explanation.

### 8.5 Wow feature priority

Build these first:

1. Queue Flight Recorder.
2. FairSeat Replay.
3. Concurrency Arena.
4. Publish Control Tower.
5. Split-Screen Judge Mode.

Build these if time remains:

6. Event Galaxy Map.
7. Notification Composer Preview.
8. Campus Calendar Intelligence.
9. Campus Passport.
10. Operations Runbook Drawer.

Rationale:

- The first five features directly amplify the rubric's highest-value scoring areas.
- The remaining five add product depth and memorability without risking the core system.

### 8.6 Wow without scope creep

Every wow feature must pass this filter:

1. Does it reuse required data or required flows?
2. Does it help prove a rubric item?
3. Can it be demoed in under 30 seconds?
4. Does it still work if real email is replaced by log-only delivery?
5. Does it avoid weakening security or transaction correctness?

If the answer is no, cut it.

### 8.7 Product thesis: not a calendar, a campus participation layer

To feel different from products available today, CampusPulse should not try to out-calendar Google Calendar, out-ticket Eventbrite, or out-message school communication platforms. Those products are broad. CampusPulse should be narrow, opinionated, and school-native.

The unique thesis:

> CampusPulse turns campus events into a living participation system: fair seats, visible demand, social discovery, respectful notifications, and post-event memory all connected by one source of truth.

Most event tools answer:

- What is happening?
- Can I register?
- Did I get a reminder?

CampusPulse should answer more interesting questions:

- Why did I get this seat?
- What is worth discovering this week?
- Can I go with my friends without breaking fairness?
- What should I do between classes?
- How alive is campus right now?
- Did notifications actually reach people?
- How can organizers improve the next event?

This is the difference between an event list and a campus operating product.

### 8.8 Signature differentiators

These are the features that should make the product feel unlike a standard school portal.

#### 1. Living Campus Graph

Concept:

- Events, students, organizers, tags, trails, waitlists, and notifications form a graph.
- The UI lets students explore this graph through the Event Galaxy Map, trails, filters, and recommendations.
- The graph is explainable and rule-based. No fake AI needed.

Data used:

- Event tags.
- Registration status.
- Followed tags/organizers.
- Time availability.
- Prior registrations/check-ins.
- Capacity pressure.

Student experience:

- "Show me events near my interests."
- "Show me events I can still get into."
- "Show me something low-commitment between classes."
- "Show me what people in my trail are attending."

Organizer experience:

- "Which tags are filling fastest?"
- "Which event types generate waitlists?"
- "Which trails need more capacity?"

Why it is different:

- Generic calendars organize by time.
- Generic event apps organize by event.
- CampusPulse organizes by participation paths.

#### 2. Crew Mode with fair-seat rules

Concept:

- Students can create a small "crew intent" for an event and invite friends.
- Crew Mode does not reserve unfair hidden capacity.
- Each student still registers individually through the same transaction-safe endpoint.
- The UI shows whether the crew is fully confirmed, partly confirmed, or partly waitlisted.

QoL details:

- "Invite 3 friends" link.
- Crew status chip:
  - `All confirmed`
  - `2 confirmed, 1 waitlisted`
  - `Waiting together`
- If one crew member is promoted, the crew timeline explains it.
- Students can turn off crew visibility per event.

Fairness rule:

- Crew Mode never jumps the FIFO waitlist.
- It is a social coordination layer, not a capacity override.

Why it wows:

- Students actually attend events socially.
- The app supports that reality without compromising the rubric's fairness requirement.

Implementation:

- Optional tables:
  - `EventCrew`
  - `EventCrewMember`
- Or simpler MVP:
  - Invite link with `crewCode` stored on registrations.
- Crew status is computed from registrations with the same `crewCode`.

#### 3. Serendipity Spin

Concept:

- A playful discovery control: "Spin the Galaxy."
- It recommends one event the student can realistically attend.
- It feels fun but remains deterministic and explainable.

Inputs:

- Published events.
- Time window.
- Capacity status.
- Student's tags/history.
- Exclude already registered events.
- Optional "surprise me" category.

Output:

- One event card with a short reason:
  - "Open seats, starts after your last class, and matches Robotics."
  - "Waitlist active, but you are early enough to try."
  - "Low-commitment workshop between 2 PM and 4 PM."

Why it wows:

- It turns browsing into discovery.
- It gives the student side personality without risky AI.

Implementation:

- Use a rule-based scoring function.
- Store no private inferred profile beyond selected interests.
- Add "Why this?" explanation to avoid black-box behavior.

#### 4. Campus Trails

Concept:

- Organizers or admins can bundle events into themed trails:
  - First-Year Starter Trail.
  - Career Launch Trail.
  - Wellness Week Trail.
  - Maker Sprint Trail.
  - Research Curious Trail.
- Students can follow a trail and see progress.

QoL details:

- Trail page shows upcoming events, completed events, and next recommended event.
- Trail progress creates lightweight Passport stamps.
- Trail completion can be purely visual, not a grading/credit system.

Why it wows:

- It makes events feel curated and purposeful.
- It gives students a reason to return.
- It helps organizers think beyond single events.

Implementation:

- Optional tables:
  - `Trail`
  - `TrailEvent`
  - `TrailFollower`
- MVP can use tags and a `trailName` field if time is short.

#### 5. Seat Steward

Concept:

- A respectful reminder system that helps reduce wasted seats.
- If an event is full or has a waitlist, confirmed students receive a pre-event nudge:
  - "Still going?"
  - "Release your seat if plans changed."
- Cancelling triggers normal promotion.

QoL details:

- One-tap "Still going" or "Cancel registration."
- The message explains the fairness impact:
  - "Jordan is next on the waitlist."
- No guilt language. Keep it calm and useful.

Why it wows:

- It uses notifications for fairness, not spam.
- It makes waitlist promotion more likely to happen before the event.

Implementation:

- New job type:
  - `SeatStewardReminder`
- Generated only for full/waitlisted events inside a safe reminder window.
- Uses same worker/retry/idempotency system.

#### 6. Waitlist What-If

Concept:

- A student can understand their waitlist situation without seeing private data.
- The UI says:
  - "You are 2nd in line."
  - "If 2 confirmed students cancel, you are next."
  - "Last movement: 14 minutes ago."

Privacy:

- Do not show names of students ahead.
- Do not show private registration details.

Why it wows:

- It makes waitlisting less frustrating.
- It reinforces FIFO fairness.

Implementation:

- Compute from `waitlistSequence` and active waitlisted rows.
- Use `DomainEvent` for last movement timestamp.

#### 7. Vibe Tags after events

Concept:

- After an event, students can leave quick non-rating tags:
  - Beginner-friendly.
  - Hands-on.
  - Quiet.
  - Social.
  - Career-focused.
  - Good for first-years.
- This is not a 1-5 star popularity contest.

Why it wows:

- It helps future students discover the right event.
- It avoids toxic ranking dynamics.
- It feels more campus-native than generic reviews.

Implementation:

- Optional `EventFeedback` table.
- Only confirmed/check-in students can submit.
- Aggregate counts only.
- Organizer sees constructive summary.

#### 8. Arrival Companion

Concept:

- Once confirmed, the event detail changes from "Should I register?" to "Help me show up."
- It provides:
  - Add to calendar.
  - Location/link.
  - What to bring.
  - Arrival time.
  - Organizer note.
  - Cancellation cutoff.
  - Notification history.

Why it wows:

- It is practical.
- It makes confirmed registration feel like a useful state, not just a badge.

Implementation:

- Use existing event fields plus optional `prepNote`.
- Add `.ics` export.
- Add one-tap copy location/link.

#### 9. Quiet Digest

Concept:

- Students can choose immediate notifications for seat-critical changes and a digest for everything else.
- The system distinguishes urgent from non-urgent:
  - Urgent: confirmed, promoted, event cancelled.
  - Digest: event published in followed tag, reminders, weekly trail suggestions.

Why it wows:

- It treats attention as a product surface.
- It differentiates from basic notification settings.

Implementation:

- `NotificationPreference` table.
- Worker can create immediate delivery or digest delivery.
- Digest can be generated by a daily/weekly worker command if time allows.

#### 10. Organizer Demand Lab

Concept:

- Before publishing, organizers can preview expected capacity pressure.
- The app simulates scenarios:
  - "If 40 students register for 20 seats..."
  - "What waitlist looks like..."
  - "What notifications will be created..."

Why it wows:

- It makes organizers feel in control.
- It uses the same waitlist and job rules as the live system.
- It helps explain the architecture during judging.

Implementation:

- Pure simulation service.
- Does not write real registrations.
- Uses the same state-machine rules to produce a mock outcome.

#### 11. Event Afterglow

Concept:

- After an event ends, the event detail becomes a recap surface:
  - Attendance/check-in count.
  - Materials link.
  - Follow-up events.
  - Vibe tags.
  - Student's Passport stamp.

Why it wows:

- Most event systems stop at registration.
- CampusPulse continues through the event lifecycle.

Implementation:

- Optional check-in.
- Optional material links.
- Related events by tag/trail.

#### 12. Hidden but useful keyboard command palette

Concept:

- Press `Cmd/Ctrl + K`.
- Students can search events, registrations, trails, and notifications.
- Organizers can jump to drafts, waitlists, jobs, and Proof Mode.

Why it wows:

- It feels like a serious enterprise app.
- It is fun to discover.
- It improves speed for power users.

Implementation:

- Local client command palette backed by current route data and lightweight search endpoints.
- Respect role permissions.
- Never reveal unauthorized records in command results.

### 8.9 Tiny QoL features that make the app fun

These are small features that students and judges will notice. They should be sprinkled into the product after the core flows are stable.

Student QoL:

- One-tap calendar export for confirmed events.
- "I have 30 minutes" quick filter.
- "Open seats only" quick filter.
- "Beginner-friendly" quick filter based on organizer tags or vibe tags.
- Saved searches, such as "career events after 3 PM."
- Follow tags and organizers.
- Bookmark events without registering.
- Waitlist position shown directly on event cards.
- "Why am I seeing this?" on recommendations.
- "Explain my status" drawer for confirmed, waitlisted, cancelled, or promoted.
- Copy event link.
- Share invite link for Crew Mode.
- Low-bandwidth list mode.
- Reduced-motion Galaxy mode.
- Conflict warning against own confirmed events.
- Smart empty states that suggest one next event.
- "Surprise me" Serendipity Spin.
- Passport stamps after attendance or confirmation.
- Friendly microcopy after registration that says exactly what happened.

Organizer QoL:

- Draft autosave.
- Duplicate event.
- Publish checklist.
- Student preview.
- Capacity safety warning when reducing seats.
- Cancellation impact preview before cancelling.
- Waitlist export CSV.
- Copy attendee emails only for confirmed owned event.
- Quick filters for full events, waitlist active, failed jobs, drafts missing fields.
- Job requeue action with reason capture.
- Notification template preview.
- Timeline of event changes.
- "What changed since yesterday?" organizer digest.
- Demand Lab simulation.
- "Copy demo link" for the event preview.

Judge/demo QoL:

- Reset demo data button in development.
- Run worker once button in development.
- Concurrency Arena preset buttons:
  - Capacity 1, 10 students.
  - Capacity 3, 25 students.
  - Capacity 10, 100 students.
- Proof Mode checklist with pass/fail evidence.
- One-click "open as Maya/Jordan/Organizer" demo personas.
- Database evidence links in Proof Mode.
- "Copy architecture summary" button for presentation.

Micro-interactions:

- Seat fills animate as small ticks, not oversized confetti.
- Waitlist promotion moves a row from waitlist to confirmed in FairSeat Replay.
- Worker job status uses crisp state transitions.
- Event Galaxy nodes gently settle after filters change.
- Passport stamp appears after confirmed attendance.
- Command palette opens instantly and feels tactile.

Do not overdo celebration. The product should feel delightful because it is responsive, useful, and discoverable, not because it throws animations at every click.

### 8.10 Discovery loops

The app should create reasons to come back without becoming manipulative.

Loop 1: Followed tags

```text
Student follows Robotics -> new Robotics event publishes -> digest or notification -> student registers -> Passport progress updates
```

Loop 2: Trails

```text
Student joins Career Launch Trail -> attends resume workshop -> app suggests alumni panel -> student adds calendar reminder
```

Loop 3: Crew Mode

```text
Student shares event with crew -> friends register -> crew status updates -> they attend together
```

Loop 4: Waitlist fairness

```text
Student joins waitlist -> sees position -> Seat Steward reminder frees seat -> student promoted -> notification delivery visible
```

Loop 5: Organizer improvement

```text
Organizer sees waitlist pressure -> duplicates event for another time -> publishes -> waitlisted students receive useful next option
```

### 8.11 Novelty guardrails

Novelty should not damage the assignment.

Hard rules:

- No social feature can reveal another student's private registration unless the student explicitly joined a crew or the organizer owns the event.
- No recommendation can override role visibility.
- No Crew Mode behavior can jump FIFO.
- No animation can be required to understand seat status.
- No digest can delay seat-critical notifications such as promotion or cancellation.
- No demo-only action can be enabled outside `DEMO_MODE=true`.
- No gamification can imply academic credit unless the school explicitly supports it.
- No public popularity ranking should shame small events or organizers.

This is how the product stays fun without becoming unserious.

### 8.12 Signature moonshot: Campus Terminal

This is the coolest differentiator to add if the team wants the product to feel unlike anything in a normal school portal.

Real-life model:

> Airports and transit terminals.

Why this model works:

- Airports manage scheduled departures.
- Events have limited capacity.
- Passengers have boarding passes.
- Students have registrations.
- Flights have standby queues.
- Full events have waitlists.
- Gates change.
- Event locations change.
- Flights are delayed or cancelled.
- Events are closed or cancelled.
- Control towers coordinate operations.
- Organizers coordinate event state.
- Departure boards make complex movement easy to understand.

Campus Terminal turns school events into a living campus departures system.

#### Terminal home

The student dashboard becomes a departures board for campus life.

Rows:

- Event title.
- Departure time.
- Gate, meaning room/location/link.
- Status:
  - `Boarding soon`
  - `Open seats`
  - `Almost full`
  - `Standby active`
  - `Closed`
  - `Cancelled`
- Seat state:
  - `Confirmed`
  - `Standby #2`
  - `Not booked`
- Crew state if Crew Mode exists.

Interactions:

- Filter by terminal:
  - Academic.
  - Clubs.
  - Wellness.
  - Career.
  - Arts.
  - Sports.
- Toggle between board, map, and galaxy.
- Press `Cmd/Ctrl + K` to jump like an operations terminal.

Why it wows:

- Judges instantly understand it.
- It transforms a list of events into an operational interface.
- It is visually memorable but still practical.

#### Campus Boarding Pass

When a student is confirmed, they receive a beautiful digital boarding pass.

Boarding pass fields:

- Event title.
- Student name.
- Status: `CONFIRMED`.
- Time.
- Gate/location/link.
- Organizer.
- Cancellation cutoff.
- QR/check-in code if check-in is implemented.
- Add to calendar.
- Share with crew.
- Notification history.

If waitlisted, the pass becomes a standby pass:

- Status: `STANDBY`.
- Position.
- Last movement time.
- What needs to happen:
  - "Two seats must open before you are cleared."
- Seat Steward reminder explanation:
  - "Confirmed students may release seats before start."

Why it wows:

- Students understand their status at a glance.
- It makes registration feel tangible.
- It gives the UI a signature artifact.

Important:

- A boarding pass is not a ticketing/payment feature.
- It does not alter FIFO.
- It is just a polished representation of `Registration`.

#### Standby Board

Organizer view includes a standby board modeled after airport gate displays.

Columns:

- Position.
- Student.
- Waitlisted at.
- Sequence.
- Status.
- Promotion eligibility.

Student-safe public version:

- Shows only the current student's position and anonymous queue size.
- Never reveals other student names.

Why it wows:

- It makes FIFO feel real.
- It provides a familiar real-world model for waitlists.

Implementation:

- Organizer board reads `/api/events/:id/waitlist`.
- Student board reads `/api/registrations/me`.
- FairSeat Replay can use the same visual language.

#### Control Tower

Organizer command center becomes a control tower.

Panels:

- Event departures.
- Drafts waiting for clearance.
- Events boarding soon.
- Events at capacity.
- Standby active.
- Cancelled/closed events.
- Notification jobs in flight.
- Failed jobs needing attention.

Actions:

- Clear event for publishing.
- Close registration.
- Cancel event.
- Open waitlist.
- Run notification worker in demo mode.
- Requeue failed notification.

Why it wows:

- It makes enterprise operations understandable.
- It creates a cohesive product language across event lifecycle, waitlist, and worker.

#### Dispatch Log

The notification job system becomes a dispatch log.

Rows:

- Dispatch id.
- Triggering domain event.
- Recipient.
- Channel.
- Status.
- Attempt count.
- Idempotency key.
- Last error.
- Delivery proof.

Status language:

- `Queued`
- `Dispatched`
- `Delivered`
- `Retry scheduled`
- `Grounded`, meaning failed after max attempts.

Important:

- Store canonical statuses as simple enums like `PENDING`, `PROCESSING`, `SENT`, `FAILED`.
- UI labels can be more flavorful, but the database should remain clear and rubric-friendly.

#### Connection Planner

Students often attend events between classes. Campus Terminal can include a connection planner.

Features:

- "Can I make it?" between two confirmed events.
- Warn if events overlap.
- Show buffer time.
- Show location/link transition:
  - "10 minutes between Library 201 and Science Hall."
- For remote links, show copy/open link.

Why it wows:

- It is practical.
- It extends the real-world transit metaphor.
- It uses only local event time/location data.

Implementation:

- No maps required for MVP.
- Use time difference and plain-text location.
- If locations are structured later, add walking-time estimates.

#### Gate Change and Delay Notices

If an organizer edits location/time for a published event, the app treats it like a gate change or delay.

Rules:

- Only allow limited published edits.
- Time/location changes create domain events:
  - `EVENT_TIME_CHANGED`
  - `EVENT_LOCATION_CHANGED`
- Worker sends notifications to confirmed and waitlisted students.
- Student boarding pass updates.

Why it wows:

- It mirrors real-world operations.
- It adds useful notification types beyond registration.
- It shows domain events are not just a technical checkbox.

Implementation note:

- This is optional after required event types are complete.
- Keep the original PDF-required job types first.

#### Rush Hour Heatmap

The organizer or Proof Mode dashboard can show campus demand by time block.

Visual:

- Week grid.
- Cells show event count, confirmed seats, waitlist pressure.
- Darker cells mean higher demand.

Use cases:

- Organizers choose better event times.
- Judges see the app thinking like an operations system.

Implementation:

- Aggregate events and registrations by hour/day.
- No personal student data exposed.

#### Standby Clearance Moment

When a waitlisted student is promoted, the UI should make it feel special but still calm.

Interaction:

- Student receives notification: "Cleared for boarding."
- Their standby pass flips to confirmed pass.
- FairSeat Replay shows the row moving into a confirmed seat.

Why it wows:

- It makes the required automatic promotion memorable.
- It gives the presentation a signature moment.

Guardrail:

- Do not use excessive celebration.
- The event is still a school workflow.

#### Terminal Display Mode

A public display route can show a read-only campus board for hallways or presentation mode.

Route:

```text
/terminal
```

Display:

- Published upcoming events.
- Status.
- Location.
- Capacity pressure.
- No private student data.
- No registration controls.

Why it wows:

- It feels like a real installed campus system.
- It can be used during the competition as a polished opening screen.

Implementation:

- Public or kiosk-safe route.
- Cache/poll published event summaries.
- Accessible high-contrast display.

#### Campus Terminal data impact

Required new data:

- None for the core boarding-pass metaphor. It can use existing `Event`, `Registration`, and `NotificationJob`.

Optional data:

- `CheckIn` for QR boarding.
- `EventChange` or `DomainEvent` types for time/location changes.
- `TerminalDisplayConfig` if a kiosk display is needed.

New optional domain event types:

- `EVENT_TIME_CHANGED`
- `EVENT_LOCATION_CHANGED`
- `CHECK_IN_COMPLETED`
- `SEAT_STEWARD_REMINDER`

New optional notification job types:

- `EventTimeChanged`
- `EventLocationChanged`
- `SeatStewardReminder`
- `CheckInReminder`

#### Campus Terminal demo script

This can become the competition's most memorable flow:

1. Open `/terminal` as a live campus departures board.
2. Switch to organizer Control Tower.
3. Create a draft event and clear it for publishing.
4. Student opens Terminal home and books a seat.
5. Student receives Campus Boarding Pass.
6. Other students fill the event.
7. Next student receives Standby Pass.
8. Organizer opens Standby Board.
9. Confirmed student releases seat.
10. Standby student is cleared and pass flips to confirmed.
11. Dispatch Log shows notification jobs and delivery proof.
12. FairSeat Replay shows the exact sequence.
13. Concurrency Arena proves the same mechanism works under load.

This ties together product magic and every high-value rubric requirement.

#### Why this is better than generic "cool"

This feature is not random decoration. It is modeled after a real system that already solves similar problems:

- Capacity.
- Queues.
- Time.
- Location.
- Cancellation.
- Status changes.
- Notifications.
- Public displays.
- Operations teams.

That makes the novelty easy to understand, easy to demo, and strongly connected to the required backend.

## 9. Design direction: Anthropic-grade enterprise frontend

The frontend should feel thoughtful, quiet, and precise. Avoid a generic startup landing page. The first screen after login should be the application itself.

Design keywords:

- Calm.
- Dense.
- Trustworthy.
- Warm.
- Legible.
- Operational.
- Evidence-driven.

Visual language:

- Warm off-white canvas.
- Ink-like text.
- Restrained amber/coral accent.
- Soft green for confirmed.
- Steel blue for waitlist/information.
- Red only for destructive or failed states.
- 8px border radius maximum for cards and panels.
- Fine 1px borders.
- No floating decorative orbs.
- No giant gradient hero.
- No card-inside-card layouts.
- No marketing copy blocks where controls should be.

Suggested tokens:

```css
:root {
  --bg: #f7f3ec;
  --surface: #fffaf2;
  --surface-strong: #ffffff;
  --ink: #1f2328;
  --muted: #6b6258;
  --line: #ded6ca;
  --accent: #b75f2a;
  --accent-soft: #f3d8c5;
  --confirmed: #2f7d5c;
  --waitlist: #3d68a8;
  --failed: #b6423c;
  --pending: #9a6a1f;
  --shadow: 0 12px 32px rgba(31, 35, 40, 0.08);
}
```

Typography:

- Use system fonts or existing Next font setup after checking local Next docs.
- Use 14px to 16px body text.
- Use compact headings inside panels.
- Reserve large type only for a top-level page title, not every card.
- Letter spacing should be `0`.

Layout:

- Desktop:
  - Left navigation rail.
  - Top command bar.
  - Summary strip.
  - Main split pane: list on left, detail/operations on right.
  - Right-side notification or proof drawer where useful.
- Tablet:
  - Collapsible nav.
  - Two-column event catalog.
  - Detail drawer.
- Mobile:
  - Bottom tab navigation.
  - Single-column list.
  - Sticky primary action.
  - Full-screen detail sheet.

Components:

- Icon buttons use `lucide-react`.
- Toggle/segmented controls for role/demo views.
- Tabs for event states and detail panels.
- Menus for event actions.
- Switches for filters like "Open seats only".
- Sliders or steppers for capacity if useful.
- Tables for enterprise data: registrations, waitlist, jobs, audit events.
- Empty states with one concrete next action.
- Skeleton states for loading.
- Toasts for mutation outcomes.
- Inline error messages with stable layout.

Interaction style:

- Mutations should give clear feedback:
  - Register -> "Confirmed" or "Waitlisted, position 2".
  - Cancel -> "Cancelled. Next waitlisted student promoted."
  - Worker run -> "3 jobs processed, 1 retry scheduled."
- Optimistic UI can be used only after server success or with careful rollback.
- Keep destructive actions behind confirmation.
- Use motion only for orientation:
  - Detail drawer open.
  - Row status update.
  - Toast appearance.
  - Job state transition.

Accessibility:

- Keyboard reachable controls.
- Visible focus states.
- Sufficient contrast.
- Semantic table markup for data-heavy panels.
- `aria-live` region for registration status changes.
- Clear button labels and tooltips for icon-only controls.

## 10. Information architecture

Recommended routes:

```text
/
/login
/register
/terminal
/events
/events/[id]
/registrations/me
/trails
/trails/[id]
/crews/[code]
/organizer/events
/organizer/events/new
/organizer/events/[id]
/organizer/events/[id]/edit
/organizer/events/[id]/preview
/organizer/events/[id]/registrations
/organizer/events/[id]/waitlist
/organizer/events/[id]/jobs
/organizer/events/[id]/replay
/organizer/events/[id]/demand-lab
/notifications
/ops/proof
/ops/concurrency-arena
```

Recommended API routes:

```text
POST   /api/register
POST   /api/login
POST   /api/logout
GET    /api/users/me
PUT    /api/users/me

POST   /api/events
GET    /api/events
GET    /api/events/:id
PUT    /api/events/:id
POST   /api/events/:id/publish
POST   /api/events/:id/cancel

POST   /api/events/:id/registrations
DELETE /api/registrations/:id
GET    /api/registrations/me
GET    /api/events/:id/registrations
GET    /api/events/:id/waitlist

GET    /api/notification-jobs
GET    /api/notification-jobs/:id
GET    /api/notifications/me

POST   /api/events/:id/bookmark
DELETE /api/events/:id/bookmark
POST   /api/events/:id/crews
GET    /api/crews/:code
POST   /api/crews/:code/join
GET    /api/trails
GET    /api/trails/:id
POST   /api/trails/:id/follow
DELETE /api/trails/:id/follow
POST   /api/events/:id/feedback
GET    /api/search/command-palette

GET    /api/health
GET    /api/ready
POST   /api/dev/concurrency-drill
```

The `dev/concurrency-drill` endpoint should exist only in development or demo mode. It can help prove no overbooking by firing parallel registration attempts server-side or by preparing a test scenario.

Discovery/QoL routes are optional. They should be added only after the core PDF endpoints are implemented and tested.

## 11. Role model

Roles:

- `STUDENT`
- `ORGANIZER`
- `ADMIN`

Student permissions:

- Browse published events.
- Read published event details.
- Register for published events.
- Cancel own active registration.
- Read own registrations.
- Read own notification log.
- Update own profile if implemented.

Student restrictions:

- Cannot create, edit, publish, close, or cancel events.
- Cannot see draft events.
- Cannot see other students' registrations.
- Cannot see organizer job dashboards except their own notification log.

Organizer permissions:

- Create own draft events.
- Edit own draft events.
- Publish own drafts.
- Cancel or close own events.
- Read own event confirmed list.
- Read own event waitlist.
- Read notification jobs for own events.
- Preview own draft as a student would see it.

Organizer restrictions:

- Cannot edit another organizer's event.
- Cannot view another organizer's private attendee lists.
- Cannot register as a student from the same organizer account unless the team intentionally supports dual-role accounts. Simpler: one role per account.

Admin permissions:

- Seed organizers.
- View system health.
- View all jobs.
- Requeue failed jobs.
- Moderate events.

Admin should be kept minimal unless it is polished. The competition does not require a full admin console.

## 12. Event lifecycle

Statuses:

- `DRAFT`
- `PUBLISHED`
- `CLOSED`
- `CANCELLED`
- `ARCHIVED`

State transitions:

```text
DRAFT -> PUBLISHED
DRAFT -> CANCELLED
PUBLISHED -> CLOSED
PUBLISHED -> CANCELLED
CLOSED -> CANCELLED
CLOSED -> ARCHIVED
CANCELLED -> ARCHIVED
```

Rules:

- Only organizer owner can edit.
- Only `DRAFT` is fully editable.
- `PUBLISHED` can allow limited edits such as description/location, but not capacity reduction below confirmed count.
- Students see only `PUBLISHED` and optionally `CLOSED`/`CANCELLED` if they already registered.
- New registrations allowed only for `PUBLISHED`.
- `CLOSED` blocks new registrations but preserves current registrations.
- `CANCELLED` blocks new registrations and marks active registrations as event-cancelled.
- Event cancellation creates `EVENT_CANCELLED` domain events/jobs for affected users or one bulk job that the worker expands.

Recommended cancellation rule:

> Students may cancel their own registration until event start. If the cancelled registration was confirmed, the next waitlisted student is promoted automatically. If an organizer cancels an event, all active registrations are marked `CANCELLED_BY_EVENT`, new registrations are blocked, and affected users receive async notifications.

This rule is simple, explainable, and directly aligned with the PDF.

## 13. Registration lifecycle

Statuses:

- `CONFIRMED`
- `WAITLISTED`
- `CANCELLED_BY_USER`
- `CANCELLED_BY_EVENT`
- `PROMOTED`
- `CHECKED_IN`

Practical note:

- `PROMOTED` can be represented as a domain event rather than a persistent registration status.
- The registration row can simply move from `WAITLISTED` to `CONFIRMED`.

Registration state transitions:

```text
none -> CONFIRMED
none -> WAITLISTED
WAITLISTED -> CONFIRMED
CONFIRMED -> CANCELLED_BY_USER
WAITLISTED -> CANCELLED_BY_USER
CONFIRMED -> CANCELLED_BY_EVENT
WAITLISTED -> CANCELLED_BY_EVENT
CONFIRMED -> CHECKED_IN
```

Rules:

- One active registration per student per event.
- Active means `CONFIRMED` or `WAITLISTED`.
- A student cannot register after event start.
- A student cannot register for cancelled or closed events.
- A student can cancel only their own active registration.
- Cancelled rows remain for audit/history.
- Confirmed count must never exceed capacity.
- Waitlist order is deterministic by `waitlistSequence`, then `createdAt`.

## 14. Database schema plan

Use Prisma for models and migrations. Use raw SQL in migrations where PostgreSQL features are needed, especially partial unique indexes and row-locking patterns.

### 14.1 User

Fields:

- `id`
- `email`
- `displayName`
- `passwordHash`
- `role`
- `createdAt`
- `updatedAt`

Indexes:

- Unique `email`.
- Index `role`.

### 14.2 Event

Fields:

- `id`
- `organizerId`
- `status`
- `title`
- `description`
- `startsAt`
- `endsAt`
- `capacity`
- `locationText`
- `tags`
- `publishedAt`
- `closedAt`
- `cancelledAt`
- `confirmedCount`
- `waitlistCount`
- `nextWaitlistSequence`
- `createdAt`
- `updatedAt`
- `version`

Indexes:

- `(status, startsAt)`
- `(organizerId, status, startsAt)`
- `(startsAt)`
- Full-text or trigram search can be a stretch feature, but simple indexed search is enough.

Why counters:

- `confirmedCount` and `waitlistCount` make event cards fast.
- They are updated only inside transactions.
- They also make capacity pressure easy to display.

### 14.3 Registration

Fields:

- `id`
- `eventId`
- `userId`
- `status`
- `waitlistSequence`
- `registeredAt`
- `confirmedAt`
- `waitlistedAt`
- `cancelledAt`
- `cancelReason`
- `promotedAt`
- `checkedInAt`
- `createdAt`
- `updatedAt`

Indexes:

- `(eventId, status)`
- `(eventId, status, waitlistSequence)`
- `(userId, status)`
- `(userId, eventId)`

Important uniqueness:

Prisma alone does not express a partial unique index cleanly for "one active registration". Add raw SQL migration:

```sql
CREATE UNIQUE INDEX registration_one_active_per_event_user
ON "Registration" ("eventId", "userId")
WHERE "status" IN ('CONFIRMED', 'WAITLISTED');
```

### 14.4 DomainEvent

Fields:

- `id`
- `type`
- `aggregateType`
- `aggregateId`
- `eventId`
- `userId`
- `registrationId`
- `payloadJson`
- `occurredAt`
- `createdAt`

Indexes:

- `(type, occurredAt)`
- `(aggregateType, aggregateId, occurredAt)`
- `(eventId, occurredAt)`

Purpose:

- Durable business facts.
- Source for audit timelines.
- Input to notification jobs.

### 14.5 NotificationJob

Fields:

- `id`
- `type`
- `status`
- `domainEventId`
- `eventId`
- `userId`
- `registrationId`
- `idempotencyKey`
- `payloadJson`
- `attempts`
- `maxAttempts`
- `availableAt`
- `lockedAt`
- `lockedBy`
- `lastError`
- `sentAt`
- `createdAt`
- `updatedAt`

Statuses:

- `PENDING`
- `PROCESSING`
- `SENT`
- `FAILED`
- `SKIPPED`

Indexes:

- Unique `idempotencyKey`.
- `(status, availableAt)`
- `(eventId, createdAt)`
- `(userId, createdAt)`

Purpose:

- Transactional outbox.
- Visible job state for rubric proof.
- Retry/idempotency proof.

### 14.6 NotificationDelivery

Fields:

- `id`
- `jobId`
- `channel`
- `recipient`
- `status`
- `providerMessageId`
- `attempt`
- `responseJson`
- `error`
- `createdAt`

Purpose:

- Persistent proof of delivery attempts.
- Supports real email or structured console/log-only mode.

### 14.7 AuditLog

Fields:

- `id`
- `actorUserId`
- `action`
- `resourceType`
- `resourceId`
- `metadataJson`
- `createdAt`

Purpose:

- Useful for Proof Mode and presentation.
- Helps demonstrate role-protected actions.

### 14.8 Optional models

Optional if time remains:

- `EventBookmark`
- `EventCrew`
- `EventCrewMember`
- `Trail`
- `TrailEvent`
- `TrailFollower`
- `EventFeedback`
- `NotificationPreference`
- `CheckIn`
- `EventTag`
- `OrganizerProfile`
- `DemoDrillResult`
- `WorkerHeartbeat`

Keep optional models out of the critical path until the required rubric is complete.

Optional model purpose:

| Model | Enables | Priority |
|---|---|---|
| `EventBookmark` | Save events without registering | Medium |
| `EventCrew` | Crew Mode invite/status | High if social wow is prioritized |
| `EventCrewMember` | Crew membership and privacy settings | High if social wow is prioritized |
| `Trail` | Campus Trails | Medium |
| `TrailEvent` | Ordered themed event bundles | Medium |
| `TrailFollower` | Student trail progress | Medium |
| `EventFeedback` | Vibe Tags after attendance | Low/medium |
| `NotificationPreference` | Quiet Digest and urgent-vs-digest delivery | Medium |
| `CheckIn` | Attendance, Passport, Event Afterglow | Medium |
| `EventTag` | Structured tags if arrays become limiting | Low |
| `OrganizerProfile` | Better organizer presence | Low |
| `DemoDrillResult` | Persist Concurrency Arena outcomes | High for presentation |
| `WorkerHeartbeat` | Worker status in Proof Mode | High for presentation |

### 14.9 Prisma schema sketch

This is a planning sketch, not a final copy-paste schema. It shows the enterprise data shape and the constraints the implementation should preserve.

```prisma
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

enum RegistrationStatus {
  CONFIRMED
  WAITLISTED
  CANCELLED_BY_USER
  CANCELLED_BY_EVENT
  CHECKED_IN
}

enum DomainEventType {
  EVENT_PUBLISHED
  EVENT_CANCELLED
  REGISTRATION_CONFIRMED
  REGISTRATION_WAITLISTED
  REGISTRATION_CANCELLED
  WAITLIST_PROMOTED
}

enum NotificationJobStatus {
  PENDING
  PROCESSING
  SENT
  FAILED
  SKIPPED
}

enum NotificationChannel {
  LOG
  EMAIL
  IN_APP
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  displayName  String
  passwordHash String
  role         UserRole
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  organizedEvents Event[]        @relation("EventOrganizer")
  registrations   Registration[]
  auditLogs       AuditLog[]     @relation("AuditActor")

  @@index([role])
}

model Event {
  id                   String      @id @default(cuid())
  organizerId          String
  status               EventStatus @default(DRAFT)
  title                String
  description          String
  startsAt             DateTime
  endsAt               DateTime?
  capacity             Int
  locationText         String?
  tags                 String[]    @default([])
  publishedAt          DateTime?
  closedAt             DateTime?
  cancelledAt          DateTime?
  cancellationReason   String?
  confirmedCount       Int         @default(0)
  waitlistCount        Int         @default(0)
  nextWaitlistSequence Int         @default(1)
  version              Int         @default(1)
  createdAt            DateTime    @default(now())
  updatedAt            DateTime    @updatedAt

  organizer     User              @relation("EventOrganizer", fields: [organizerId], references: [id])
  registrations Registration[]
  domainEvents  DomainEvent[]
  jobs          NotificationJob[]

  @@index([status, startsAt])
  @@index([organizerId, status, startsAt])
  @@index([startsAt])
}

model Registration {
  id               String             @id @default(cuid())
  eventId          String
  userId           String
  status           RegistrationStatus
  waitlistSequence Int?
  registeredAt     DateTime           @default(now())
  confirmedAt      DateTime?
  waitlistedAt     DateTime?
  cancelledAt      DateTime?
  cancelReason     String?
  promotedAt       DateTime?
  checkedInAt      DateTime?
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  event        Event             @relation(fields: [eventId], references: [id])
  user         User              @relation(fields: [userId], references: [id])
  domainEvents DomainEvent[]
  jobs         NotificationJob[]

  @@index([eventId, status])
  @@index([eventId, status, waitlistSequence])
  @@index([userId, status])
  @@index([userId, eventId])
}

model DomainEvent {
  id             String          @id @default(cuid())
  type           DomainEventType
  aggregateType  String
  aggregateId    String
  eventId        String?
  userId         String?
  registrationId String?
  payloadJson    Json
  occurredAt     DateTime        @default(now())
  createdAt      DateTime        @default(now())

  event        Event?          @relation(fields: [eventId], references: [id])
  registration Registration?   @relation(fields: [registrationId], references: [id])
  jobs         NotificationJob[]

  @@index([type, occurredAt])
  @@index([aggregateType, aggregateId, occurredAt])
  @@index([eventId, occurredAt])
}

model NotificationJob {
  id             String                @id @default(cuid())
  type           DomainEventType
  status         NotificationJobStatus @default(PENDING)
  domainEventId  String
  eventId        String?
  userId         String?
  registrationId String?
  idempotencyKey String                @unique
  payloadJson    Json
  attempts       Int                   @default(0)
  maxAttempts    Int                   @default(3)
  availableAt    DateTime              @default(now())
  lockedAt       DateTime?
  lockedBy       String?
  lastError      String?
  sentAt         DateTime?
  createdAt      DateTime              @default(now())
  updatedAt      DateTime              @updatedAt

  domainEvent  DomainEvent            @relation(fields: [domainEventId], references: [id])
  event        Event?                 @relation(fields: [eventId], references: [id])
  registration Registration?          @relation(fields: [registrationId], references: [id])
  deliveries   NotificationDelivery[]

  @@index([status, availableAt])
  @@index([eventId, createdAt])
  @@index([userId, createdAt])
}

model NotificationDelivery {
  id                String              @id @default(cuid())
  jobId             String
  channel           NotificationChannel
  recipient         String
  status            String
  providerMessageId String?
  dedupeKey         String
  attempt           Int
  responseJson      Json?
  error             String?
  createdAt         DateTime            @default(now())

  job NotificationJob @relation(fields: [jobId], references: [id])

  @@unique([dedupeKey])
  @@index([jobId, createdAt])
}

model AuditLog {
  id           String   @id @default(cuid())
  actorUserId  String?
  action       String
  resourceType String
  resourceId   String
  metadataJson Json?
  requestId    String?
  createdAt    DateTime @default(now())

  actor User? @relation("AuditActor", fields: [actorUserId], references: [id])

  @@index([resourceType, resourceId, createdAt])
  @@index([actorUserId, createdAt])
}
```

Raw SQL migrations to add:

```sql
ALTER TABLE "Event"
ADD CONSTRAINT event_capacity_positive CHECK ("capacity" >= 1);

ALTER TABLE "Event"
ADD CONSTRAINT event_counts_non_negative
CHECK ("confirmedCount" >= 0 AND "waitlistCount" >= 0);

ALTER TABLE "Event"
ADD CONSTRAINT event_confirmed_not_above_capacity
CHECK ("confirmedCount" <= "capacity");

CREATE UNIQUE INDEX registration_one_active_per_event_user
ON "Registration" ("eventId", "userId")
WHERE "status" IN ('CONFIRMED', 'WAITLISTED');

CREATE UNIQUE INDEX registration_waitlist_sequence_unique
ON "Registration" ("eventId", "waitlistSequence")
WHERE "waitlistSequence" IS NOT NULL;
```

Important caveat:

- The `event_confirmed_not_above_capacity` check helps catch impossible states, but it does not replace row locking. The no-overbooking guarantee still comes from locking the event row during registration and promotion.

## 15. Transaction design for no overbooking

This is the most important backend behavior.

Use a database transaction and lock the event row before reading/updating capacity state.

Registration algorithm:

```text
1. Authenticate student.
2. Validate event id.
3. Start transaction.
4. Lock event row with SELECT ... FOR UPDATE.
5. Confirm event is PUBLISHED and not started.
6. Check no active registration exists for this user/event.
7. If confirmedCount < capacity:
   a. Create registration with status CONFIRMED.
   b. Increment confirmedCount.
   c. Create DomainEvent REGISTRATION_CONFIRMED.
   d. Create NotificationJob RegistrationConfirmed with unique idempotency key.
8. Else:
   a. Read event.nextWaitlistSequence.
   b. Create registration with status WAITLISTED and that sequence.
   c. Increment waitlistCount and nextWaitlistSequence.
   d. Create DomainEvent REGISTRATION_WAITLISTED.
   e. Create NotificationJob RegistrationWaitlisted with unique idempotency key.
9. Commit.
10. Return 201 with registration status and waitlist position if applicable.
```

Cancellation and promotion algorithm:

```text
1. Authenticate student.
2. Validate registration id.
3. Start transaction.
4. Lock the registration row.
5. Lock the event row with SELECT ... FOR UPDATE.
6. Confirm registration belongs to student and is active.
7. Mark registration CANCELLED_BY_USER.
8. Create DomainEvent REGISTRATION_CANCELLED.
9. Create NotificationJob RegistrationCancelled.
10. If cancelled registration was CONFIRMED:
    a. Find the next WAITLISTED registration for the event ordered by waitlistSequence.
    b. Lock that waitlisted row.
    c. Update it to CONFIRMED.
    d. Set promotedAt and confirmedAt.
    e. Adjust confirmedCount and waitlistCount.
    f. Create DomainEvent WAITLIST_PROMOTED.
    g. Create NotificationJob WaitlistPromoted.
11. If cancelled registration was WAITLISTED:
    a. Decrement waitlistCount.
12. Commit.
13. Return updated registration/event summary.
```

Important detail:

- If a confirmed student cancels and a waitlisted student is promoted, `confirmedCount` may remain unchanged:
  - Decrement for cancellation.
  - Increment for promotion.
  - Net effect: same confirmed count, waitlist count decreases by 1.

## 16. Queue and worker design

Use the transactional outbox pattern.

Why:

- It satisfies the requirement for domain events plus queue.
- It is simple with PostgreSQL and Prisma.
- It avoids losing notification jobs when the API writes data successfully.
- It gives the UI real job rows to display.

Job creation:

- Create `DomainEvent` and `NotificationJob` in the same transaction as the business state change.
- Use unique `idempotencyKey`.
- Do not send email inside the HTTP request.

Worker loop:

```text
1. Poll for pending jobs where availableAt <= now.
2. Lock a small batch with FOR UPDATE SKIP LOCKED.
3. Mark jobs PROCESSING with lockedBy and lockedAt.
4. For each job:
   a. Load user/event/registration from DB by id.
   b. Build notification content server-side.
   c. Send through configured adapter.
   d. Insert NotificationDelivery row.
   e. Mark job SENT.
5. If send fails:
   a. Increment attempts.
   b. Store lastError.
   c. If attempts < maxAttempts, set status PENDING and availableAt with backoff.
   d. Else mark FAILED.
```

Worker query sketch:

```sql
WITH next_jobs AS (
  SELECT id
  FROM "NotificationJob"
  WHERE status = 'PENDING'
    AND "availableAt" <= now()
  ORDER BY "availableAt", "createdAt"
  LIMIT 10
  FOR UPDATE SKIP LOCKED
)
UPDATE "NotificationJob"
SET status = 'PROCESSING',
    "lockedAt" = now(),
    "lockedBy" = $1
WHERE id IN (SELECT id FROM next_jobs)
RETURNING *;
```

Idempotency:

- `idempotencyKey` is unique.
- Delivery creation also checks whether a successful delivery already exists for the same logical job.
- If the worker sees an already-sent logical notification, it marks the job `SKIPPED` or `SENT` without creating duplicate user-visible notifications.

Recommended idempotency keys:

```text
registration:{registrationId}:confirmed
registration:{registrationId}:waitlisted
registration:{registrationId}:cancelled
registration:{registrationId}:promoted
event:{eventId}:cancelled:user:{userId}
```

Job types to implement first:

- `RegistrationConfirmed`
- `RegistrationWaitlisted`
- `WaitlistPromoted`

Additional strong types:

- `RegistrationCancelled`
- `EventCancelled`
- `EventPublished`

Notification channels:

- Development: structured console plus `NotificationDelivery` table.
- Competition: if time allows, SMTP or Resend, still with persistent delivery logs.
- In-app: `notifications/me` can read from successful delivery records or a separate `InAppNotification` table.

## 17. REST API contract

Use a consistent response shape.

Success:

```json
{
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have access to this event.",
    "details": []
  }
}
```

Common status codes:

- `200` for successful reads/updates.
- `201` for created resources.
- `204` for logout/delete when no body is needed.
- `400` for invalid JSON or impossible action.
- `401` for unauthenticated.
- `403` for authenticated but forbidden by role/ownership.
- `404` for not found or intentionally hidden resource.
- `409` for duplicate active registration or capacity conflict.
- `422` for validation errors.
- `500` for unexpected server errors.

Auth endpoints:

```text
POST /api/register
POST /api/login
POST /api/logout
GET  /api/users/me
PUT  /api/users/me
```

Event endpoints:

```text
POST /api/events
GET  /api/events
GET  /api/events/:id
PUT  /api/events/:id
POST /api/events/:id/publish
POST /api/events/:id/cancel
```

Registration endpoints:

```text
POST   /api/events/:id/registrations
DELETE /api/registrations/:id
GET    /api/registrations/me
GET    /api/events/:id/registrations
GET    /api/events/:id/waitlist
```

Notification endpoints:

```text
GET /api/notification-jobs
GET /api/notification-jobs/:id
GET /api/notifications/me
```

Health endpoints:

```text
GET /api/health
GET /api/ready
```

### 17.1 PDF endpoint to Next.js endpoint mapping

The PDF says its paths are examples. In this Next.js application, UI pages already use `/register`, `/login`, `/events`, and other human-facing routes. The REST implementation should therefore use an `/api` prefix while preserving the exact resources, methods, behavior, status codes, and access rules from the PDF.

| PDF endpoint | Next.js implementation | Auth | Role | Required behavior |
|---|---|---|---|---|
| `POST /register` | `POST /api/register` | Public | Public student only | Create student account; organizer creation is seeded/admin only and documented |
| `POST /login` | `POST /api/login` | Public | Any | Verify password hash and create session |
| `POST /logout` | `POST /api/logout` | Session | Any | Clear session if sessions are used |
| `POST /events` | `POST /api/events` | Required | Organizer | Create `DRAFT` event owned by organizer |
| `GET /events` | `GET /api/events` | Optional or required by view | Student/Organizer | Student sees published only; organizer sees own events |
| `GET /events/{id}` | `GET /api/events/:id` | Contextual | Student/Organizer | Return role-safe details and counts |
| `PUT /events/{id}` | `PUT /api/events/:id` | Required | Organizer owner | Edit only when editable by documented rule |
| `POST /events/{id}/publish` | `POST /api/events/:id/publish` | Required | Organizer owner | `DRAFT` to `PUBLISHED`; optionally enqueue `EventPublished` |
| `POST /events/{id}/cancel` | `POST /api/events/:id/cancel` | Required | Organizer owner | Cancel/close per documented rule; enqueue cancellation jobs |
| `POST /events/{id}/registrations` | `POST /api/events/:id/registrations` | Required | Student | Confirm or waitlist transactionally |
| `DELETE /registrations/{id}` | `DELETE /api/registrations/:id` | Required | Student owner | Cancel own registration; promote next waitlisted if applicable |
| `GET /registrations/me` | `GET /api/registrations/me` | Required | Student | Return own registrations and waitlist status/position |
| `GET /events/{id}/registrations` | `GET /api/events/:id/registrations` | Required | Organizer owner | Return confirmed list only for owned event |
| `GET /events/{id}/waitlist` | `GET /api/events/:id/waitlist` | Required | Organizer owner | Return ordered waitlist only for owned event |
| `GET /users/me` | `GET /api/users/me` | Required | Any | Current profile |
| `PUT /users/me` | `PUT /api/users/me` | Required | Any | Update display name/profile fields |
| `GET /notification-jobs/{id}` | `GET /api/notification-jobs/:id` | Required | Organizer owner/Admin | Job detail with scoped visibility |
| `GET /notification-jobs` | `GET /api/notification-jobs` | Required | Organizer/Admin | Filtered job list with scoped visibility |

### 17.2 Endpoint behavior detail

`POST /api/register`

- Accepts `email`, `password`, `displayName`.
- Does not accept arbitrary `role`.
- Always creates `STUDENT`.
- Returns `201` with profile data excluding password hash.
- Returns `409` if email already exists.
- Returns `422` for validation errors.

`POST /api/login`

- Accepts `email`, `password`.
- Uses slow hash verification.
- Returns httpOnly session cookie.
- Returns `401` for invalid credentials without revealing which field failed.

`POST /api/events`

- Organizer only.
- Creates event as `DRAFT`.
- Validates title, description, startsAt, endsAt, capacity, and location text.
- Returns `201`.

`GET /api/events`

- Student behavior:
  - Returns `PUBLISHED` events only.
  - Includes safe counts: capacity, confirmed count, waitlist count, current student's registration status if authenticated.
  - Never returns attendee names/emails.
- Organizer behavior:
  - Returns only events where `organizerId` equals session user id.
  - Includes draft, published, closed, cancelled status filters.

`GET /api/events/:id`

- Student:
  - Can read `PUBLISHED` events.
  - Can read limited details for an event they registered for if it later becomes `CANCELLED`, so their own history still works.
  - Cannot read drafts.
- Organizer:
  - Can read owned event with operational counts.

`PUT /api/events/:id`

- Organizer owner only.
- Full edit allowed only in `DRAFT`.
- Optional limited edit in `PUBLISHED` for description/location only.
- Capacity cannot be reduced below confirmed count.

`POST /api/events/:id/publish`

- Organizer owner only.
- Event must be `DRAFT`.
- Validates readiness checklist.
- Sets `publishedAt`.
- Creates `EVENT_PUBLISHED` domain event and optional job.

`POST /api/events/:id/cancel`

- Organizer owner only.
- Blocks new registrations.
- Marks active registrations `CANCELLED_BY_EVENT`.
- Creates cancellation domain event.
- Enqueues `EventCancelled` jobs for affected students or a bulk cancellation job.
- Returns affected counts.

`POST /api/events/:id/registrations`

- Student only.
- Event must be `PUBLISHED`.
- Uses transaction and event row lock.
- If seat available, creates `CONFIRMED`.
- If full, creates `WAITLISTED`.
- Creates domain event and notification job in same transaction.
- Returns `201` with registration status and position if waitlisted.
- Returns `409` for existing active registration.

`DELETE /api/registrations/:id`

- Student owner only.
- Registration must be active.
- Cancellation allowed until event start.
- If registration was confirmed, promotion happens in the same transaction.
- Returns updated registration and promoted registration summary if applicable.

`GET /api/registrations/me`

- Student only.
- No `userId` query parameter accepted.
- Returns own registrations, event summaries, status, and waitlist position.

`GET /api/events/:id/registrations`

- Organizer owner only.
- Returns confirmed rows with minimal student identity needed for operations.
- Supports pagination.

`GET /api/events/:id/waitlist`

- Organizer owner only.
- Returns waitlisted rows ordered by `waitlistSequence`, then `createdAt`, then `id`.
- Includes position numbers.

`GET /api/notification-jobs`

- Organizer sees jobs for owned events.
- Admin sees all if admin is implemented.
- Student does not see the job queue, only their own notification inbox.

### 17.3 Error code catalog

Use machine-readable error codes so tests and UI can respond cleanly.

| Code | HTTP | Meaning |
|---|---:|---|
| `UNAUTHENTICATED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Role or ownership check failed |
| `NOT_FOUND` | 404 | Resource not found or intentionally hidden |
| `VALIDATION_ERROR` | 422 | Request body/query failed schema validation |
| `DUPLICATE_ACTIVE_REGISTRATION` | 409 | User already has active event registration |
| `EVENT_NOT_PUBLISHED` | 409 | Registration attempted on non-published event |
| `EVENT_ALREADY_STARTED` | 409 | Registration/cancellation window closed |
| `EVENT_NOT_EDITABLE` | 409 | Event status blocks requested mutation |
| `CAPACITY_BELOW_CONFIRMED_COUNT` | 409 | Capacity edit would violate existing confirmations |
| `JOB_ALREADY_PROCESSED` | 409 | Requeue or mutation conflicts with job state |
| `INTERNAL_ERROR` | 500 | Unexpected server error |


## 18. Frontend screens in detail

### 18.1 Login and registration

Design:

- Simple centered auth panel.
- Warm neutral background.
- Clear role explanation.
- Student self-registration.
- Organizer accounts seeded or admin-created, as documented.

Fields:

- Email.
- Password.
- Display name.
- Student role for public registration.

Rules:

- Public registration creates `STUDENT` only.
- Organizers are seeded for demo or created by admin.
- Document this rule because the PDF allows choosing and documenting organizer creation.

### 18.2 Student dashboard

First viewport:

- Top command bar with search.
- Summary strip:
  - Upcoming confirmed.
  - Waitlisted.
  - Notifications.
  - Saved events.
- Event catalog with filters.
- Selected event detail panel.

Event card fields:

- Title.
- Date/time.
- Location/link.
- Organizer.
- Tags.
- Capacity status:
  - `12/20 seats`
  - `Full`
  - `Waitlist 4`
- Student-specific status:
  - `Confirmed`
  - `Waitlisted #2`
  - `Not registered`
- Pressure label:
  - `Open`
  - `Filling`
  - `Almost full`
  - `Waitlist active`

Primary actions:

- Register.
- Cancel registration.
- View details.
- Save/bookmark optional.

### 18.3 Event detail

Sections:

- Overview.
- Schedule and location.
- Capacity.
- Registration status.
- Waitlist position if applicable.
- Notification history related to this event.

Student should never see:

- Other student names.
- Full waitlist.
- Organizer job internals.

### 18.4 My Registrations

Purpose:

- Satisfies frontend rubric.
- Proves students can see only their own registrations.

Fields:

- Event.
- Date.
- Status.
- Waitlist position.
- Last update.
- Cancel action.

States:

- Upcoming.
- Waitlisted.
- Past/cancelled.

### 18.5 Organizer dashboard

First viewport:

- Status tabs:
  - Drafts.
  - Published.
  - Closed.
  - Cancelled.
- Event table/list.
- Selected event operations panel.

Event row fields:

- Status.
- Title.
- Start.
- Capacity.
- Confirmed count.
- Waitlist count.
- Pending jobs.
- Last updated.

Primary actions:

- New event.
- Edit draft.
- Preview.
- Publish.
- Cancel.
- View registrations.
- View waitlist.
- View jobs.

### 18.6 Draft editor

Fields:

- Title.
- Description.
- Starts at.
- Ends at.
- Capacity.
- Location or URL text.
- Tags.

Validation:

- Title required.
- Description required.
- Starts at future.
- Ends after starts.
- Capacity integer >= 1.
- Location/URL text plain string.

Publish checklist:

- Has title.
- Has description.
- Has valid time.
- Has capacity.
- Has location/link.
- Student preview inspected.

Publish checklist is a high-polish feature that also prevents demo mistakes.

### 18.7 Student preview

The organizer can preview a draft as a student would see it.

This directly satisfies the frontend polish criterion:

- "preview event as students would see it before publish or clear role-based navigation / empty states / basic responsiveness."

Preview should include:

- Event card.
- Detail view.
- Capacity label.
- Disabled register button with "Preview only".

### 18.8 Registrations and waitlist

Confirmed tab:

- Name.
- Email.
- Registered at.
- Status.
- Check-in optional.

Waitlist tab:

- Position.
- Name.
- Email.
- Waitlisted at.
- Sequence.

The waitlist table should show explicit FIFO order and sequence numbers. This is a visible proof artifact.

### 18.9 Notification operations

Sections:

- Job queue summary.
- Jobs table.
- Delivery attempts.
- Retry failed button for admin/demo.

Job fields:

- Type.
- Status.
- User.
- Event.
- Attempts.
- Max attempts.
- Available at.
- Idempotency key.
- Last error.

This panel is one of the strongest ways to exceed the rubric.

### 18.10 Proof Mode

Proof Mode is a judge-facing command center.

Checklist:

- Student self-registration works.
- Organizer can create draft.
- Organizer can publish.
- Student sees published event.
- Student registration confirms if capacity available.
- Extra student becomes waitlisted.
- Cancel confirmed student.
- Next waitlisted student promotes.
- Domain events created.
- Notification jobs created.
- Worker processed jobs.
- Delivery attempts logged.
- Forbidden access returns `403`.
- Concurrency drill did not overbook.

Each item should show:

- Status.
- Linked database evidence.
- Timestamp.
- Relevant route or API endpoint.

## 19. Novel features that stay realistic

The plan should avoid fake AI or infrastructure-heavy features. Novelty should be rule-based, deterministic, and demo-friendly.

### 19.1 FairSeat Ledger

Visible fairness timeline for each event.

Why it wins:

- Proves FIFO.
- Proves promotion.
- Proves auditability.
- Makes backend rigor understandable to non-technical judges.

### 19.2 Queue Theater

Operational view of notification jobs.

Why it wins:

- Proves worker separation.
- Shows retries.
- Shows failures.
- Shows idempotency.
- Turns async architecture into a front-end moment.

### 19.3 Capacity Pressure Index

Rule-based event pressure score:

```text
Open = confirmedCount / capacity < 0.6
Filling = 0.6 to 0.85
Almost full = 0.85 to < 1
Waitlist active = confirmedCount >= capacity and waitlistCount > 0
```

Why it wins:

- Makes event cards more useful.
- No risky ML required.
- Uses existing data.

### 19.4 Publish Readiness Contract

Before publish, organizer sees a checklist.

Why it wins:

- Demonstrates lifecycle care.
- Gives the UI enterprise polish.
- Prevents incomplete demo events.

### 19.5 Reliability Drill

Demo-only feature:

- Configure one notification job to fail once.
- Worker retries it.
- UI shows `FAILED` or retry scheduled, then `SENT`.

Why it wins:

- Proves retries instead of merely documenting them.
- Should be clearly marked as demo/dev.

### 19.6 Role Lens

During demo, allow switching between seeded accounts:

- Student Maya.
- Student Jordan.
- Student Priya.
- Organizer Dr. Rivera.

This is not a security bypass. It is a demo convenience that logs in as seeded users in development mode only.

Why it wins:

- Makes role-based behavior easy to show.
- Avoids awkward repeated login during presentation.

## 20. Security plan

Password storage:

- Use `argon2id` or bcrypt with strong cost.
- Never store plaintext or reversible encrypted passwords.

Session:

- Prefer httpOnly secure cookie.
- SameSite `lax`.
- CSRF protection for cookie-based mutating requests if needed.
- Short session lifetime with refresh optional.

Validation:

- Zod schemas for every request body.
- Reject unknown or invalid enum values.
- Normalize email.
- Validate dates and capacity.

Authorization:

- Central helpers:
  - `requireUser()`
  - `requireRole(role)`
  - `requireEventOwner(eventId, userId)`
  - `requireRegistrationOwner(registrationId, userId)`
- Never trust client role.
- All organizer reads check `organizerId`.
- Student registration reads check `userId`.

XSS:

- Render descriptions as text, not HTML.
- No rich HTML input.
- Escape or avoid `dangerouslySetInnerHTML`.

SQL injection:

- Use Prisma parameterization.
- For raw SQL row locks, use parameterized Prisma raw queries.

Sensitive data:

- Students do not receive other students' emails/names.
- Organizers only receive attendee data for their own events.
- Notification job visibility is scoped to organizer's event or admin.

## 21. Scalability plan

The rubric gives 15 points for scalability and design. The app should document and implement pragmatic scalability decisions.

Database:

- Index status/date queries.
- Index organizer event lists.
- Index student registration lists.
- Index waitlist ordering.
- Use counters on Event for frequent catalog reads.
- Use partial unique index for active registration.
- Use transaction row locks only on the target event row, not the entire table.

API:

- Pagination for event lists and job lists.
- Filtering by status/date/tag.
- Avoid loading full attendee lists on public event catalog.
- Return counts instead of full registration rows to students.

Worker:

- Batch size configurable.
- `FOR UPDATE SKIP LOCKED` allows multiple worker processes later.
- Backoff prevents hot-looping failures.
- Idempotency allows safe retry.

Frontend:

- Split routes by role.
- Use loading skeletons for data-heavy views.
- Keep tables paginated.
- Avoid enormous client-side state blobs.

Architecture:

- API and worker share domain modules.
- Notification adapter can switch from log-only to email provider.
- Queue is DB-backed now, but the outbox boundary can later publish to Redis/RabbitMQ.

## 22. Code organization plan

Recommended structure:

```text
prisma/
  schema.prisma
  migrations/
  seed.ts

src/
  app/
    api/
      register/
      login/
      logout/
      users/me/
      events/
      registrations/
      notification-jobs/
      notifications/
      health/
      ready/
    login/
    register/
    events/
    registrations/me/
    organizer/
    notifications/
    ops/proof/
  components/
    app-shell/
    auth/
    events/
    organizer/
    registrations/
    notifications/
    proof/
    ui/
  server/
    auth/
    db/
    events/
    registrations/
    notifications/
    validation/
    errors/
    audit/
  worker/
    notification-worker.ts
    adapters/
      log-adapter.ts
      email-adapter.ts
  lib/
    format.ts
    routes.ts
    status.ts
  types/
    api.ts
    domain.ts

tests/
  auth.spec.ts
  events.spec.ts
  registration-flow.spec.ts
  concurrency.spec.ts
  worker.spec.ts
```

Separation:

- Route handlers should be thin.
- Business rules live in `src/server`.
- Prisma access is centralized where possible.
- Worker reuses notification service code.
- UI components do not contain authorization logic.

## 23. Seed data

Seeded users:

```text
organizer@campuspulse.test / password123
student.maya@campuspulse.test / password123
student.jordan@campuspulse.test / password123
student.priya@campuspulse.test / password123
admin@campuspulse.test / password123
```

Seeded events:

- AI Study Sprint, capacity 2, published.
- Robotics Lab Open House, capacity 3, published.
- Wellness Reset Workshop, capacity 1, published.
- College Essay Clinic, draft.
- Spring Showcase, cancelled.

Seeded scenario:

- AI Study Sprint has two confirmed students and one waitlisted student.
- This allows the demo to cancel one confirmed registration and immediately show promotion.

## 24. Implementation roadmap

### Phase 0: Setup and Next.js verification

Goals:

- Install dependencies.
- Read local Next.js docs required by `AGENTS.md`.
- Add Prisma and server dependencies.
- Configure isolated Postgres on port `55434`.

Tasks:

- Run `npm install`.
- Confirm `node_modules/next/dist/docs/` exists.
- Read relevant Next.js route handler, server action, and app routing docs from the installed package.
- Add Prisma, Prisma client, Zod, password hashing package, and TS worker runtime.
- Add `.env.example`.
- Add Docker Compose file for CampusPulse Postgres.

Exit criteria:

- `npm run db:up` starts isolated Postgres.
- `npx prisma migrate dev` works.
- `npm run dev` starts on `3010`.

### Phase 1: Prisma schema and migrations

Goals:

- Create durable database foundation.
- Add constraints needed by rubric.

Tasks:

- Implement User, Event, Registration, DomainEvent, NotificationJob, NotificationDelivery.
- Add raw SQL partial unique index for active registration.
- Add indexes for event lists, waitlist, jobs.
- Add seed script.

Exit criteria:

- Seed creates demo users/events.
- Prisma Studio shows expected rows.
- Duplicate active registration is blocked.

### Phase 2: Auth and RBAC

Goals:

- Secure login/register.
- Role and ownership checks.

Tasks:

- Build register/login/logout.
- Store slow password hash.
- Create session cookie.
- Implement `requireUser`, `requireRole`, and ownership helpers.
- Add consistent API error format.

Exit criteria:

- Student self-registration works.
- Organizer accounts are seeded/admin-created.
- Student receives `403` for organizer endpoints.
- Student cannot read another student's registrations.

### Phase 3: Event lifecycle API

Goals:

- Implement organizer event management and student event catalog.

Tasks:

- Create draft event.
- Edit draft event.
- Publish event.
- Cancel event.
- List events with role-specific visibility.
- Return capacity/waitlist counts.

Exit criteria:

- Students see only published events.
- Organizer sees own drafts/published/cancelled events.
- Organizer cannot access another organizer's event.
- Cancelled event blocks new registrations.

### Phase 4: Registration and waitlist engine

Goals:

- Implement concurrency-safe registration and promotion.

Tasks:

- Register for event with event row lock.
- Confirm or waitlist based on capacity.
- Assign monotonic waitlist sequence.
- Cancel own registration.
- Promote next waitlisted registration.
- Insert DomainEvent and NotificationJob in the same transaction.

Exit criteria:

- Capacity never overbooks under parallel requests.
- FIFO waitlist promotion works.
- One active registration per event/user.
- Registration returns status and waitlist position.

### Phase 5: Worker and notification observability

Goals:

- Implement separate worker and visible job proof.

Tasks:

- Add notification worker process.
- Add log-only adapter.
- Add retry/backoff.
- Add idempotency checks.
- Add notification job API.
- Add in-app notification read API.

Exit criteria:

- At least three job types run end-to-end.
- Worker can be run separately from Next.js.
- Job states update from `PENDING` to `PROCESSING` to `SENT`.
- Failure and retry can be demonstrated.
- Delivery attempts are persisted.

### Phase 6: Frontend application

Goals:

- Replace demo-only mock behavior with real API-backed enterprise UI.

Tasks:

- Build app shell.
- Build student catalog.
- Build event detail.
- Build My Registrations.
- Build organizer dashboard.
- Build draft editor.
- Build preview mode.
- Build confirmed/waitlist tables.
- Build notification operations panel.
- Build Proof Mode.

Exit criteria:

- Student can browse/register/cancel/view own registrations.
- Organizer can create/edit/publish/cancel/view lists.
- UI is responsive and polished.
- Empty states and error states are complete.

### Phase 7: Tests and presentation hardening

Goals:

- Make the demo reliable.
- Make the rubric easy to verify.

Tasks:

- Add Playwright flows.
- Add API tests for role failures.
- Add concurrency test.
- Add worker test.
- Add README architecture section.
- Add demo script.
- Add screenshots or short notes for presentation.

Exit criteria:

- `npm run validate` passes.
- Demo script can be completed in under 5 minutes.
- Proof Mode has real evidence.

### Phase 8: Product magic and QoL

Goals:

- Make CampusPulse feel different from ordinary event software.
- Add discoverable features that are fun without weakening the core requirements.

Build first:

- FairSeat Replay.
- Queue Flight Recorder.
- Concurrency Arena.
- Publish Control Tower.
- Command palette.
- Serendipity Spin.
- Waitlist What-If.
- Arrival Companion.

Build next:

- Event Galaxy Map.
- Crew Mode.
- Campus Trails.
- Quiet Digest.
- Vibe Tags.
- Event Afterglow.
- Campus Passport.
- Organizer Demand Lab.

Exit criteria:

- At least three wow features are demo-ready.
- At least five QoL features are present in normal student/organizer flows.
- No optional feature bypasses role checks, FIFO ordering, or worker idempotency.
- Every optional feature has a reduced-motion and mobile-safe fallback where relevant.

## 25. Test plan

### 25.1 Auth and RBAC tests

Cases:

- Student can register/login.
- Organizer can login.
- Student cannot create event.
- Student cannot publish event.
- Student cannot access another student's registration.
- Organizer cannot access another organizer's event.
- Unauthenticated request returns `401`.
- Forbidden authenticated request returns `403`.

### 25.2 Event lifecycle tests

Cases:

- Organizer creates draft.
- Student cannot see draft.
- Organizer publishes draft.
- Student sees published event.
- Organizer cancels event.
- Student cannot register for cancelled event.
- Existing registrations are handled by documented cancellation rule.

### 25.3 Registration tests

Cases:

- First registrations become confirmed until capacity.
- Overflow registrations become waitlisted.
- Waitlist position is deterministic.
- Duplicate active registration returns `409`.
- Student can cancel own registration.
- Student cannot cancel another student's registration.
- Confirmed cancellation promotes next waitlisted student.

### 25.4 Concurrency tests

Cases:

- Create event with capacity 1.
- Fire 10 parallel registration requests from 10 users.
- Assert exactly 1 confirmed.
- Assert 9 waitlisted.
- Assert waitlist sequence has no duplicates.
- Assert confirmed count equals persisted rows.

### 25.5 Worker tests

Cases:

- Registration creates domain event and job.
- Worker processes pending job.
- Job becomes sent.
- Delivery row is created.
- Forced failure increments attempts.
- Retry does not create duplicate user-visible delivery.
- Idempotency key prevents duplicate jobs.

### 25.6 Frontend tests

Cases:

- Student catalog loads.
- Student registers and sees confirmed/waitlisted state.
- Student cancels and sees updated state.
- Organizer creates and publishes event.
- Organizer preview displays draft as student.
- Organizer sees confirmed list.
- Organizer sees waitlist order.
- Notification jobs panel shows worker updates.

## 26. Rubric score map

### Functionality, 40/40 target

Proof:

- Auth pages and seeded roles.
- `403` tests.
- Event lifecycle UI and API.
- Concurrency test.
- Waitlist table.
- Promotion demo.

Implementation anchors:

- Auth service.
- Event service.
- Registration transaction.
- Ownership helpers.

### Backend, 30/30 target

Proof:

- Prisma schema and migrations.
- Separate worker script.
- Outbox table.
- REST API routes.
- README architecture diagram.

Implementation anchors:

- `src/server`
- `src/worker`
- `prisma/migrations`

### Additional features, 25/25 target

Proof:

- Three or more job types.
- NotificationDelivery rows.
- Job state transitions.
- Retry attempts.
- Unique idempotency keys.

Implementation anchors:

- NotificationJob.
- NotificationDelivery.
- Worker.
- Notification operations UI.

### Frontend, 15/15 target

Proof:

- Student catalog/register/cancel/my registrations.
- Organizer event manager/preview/registrations/waitlist.
- Responsive layout, empty states, role navigation.

Implementation anchors:

- Student routes.
- Organizer routes.
- App shell.
- Proof Mode.

### REST endpoints, 10/10 target

Proof:

- API route list in README.
- Playwright API tests.
- Consistent response shape.

Implementation anchors:

- `/api/register`
- `/api/login`
- `/api/events`
- `/api/registrations`
- `/api/notification-jobs`

### Security, 15/15 target

Proof:

- Slow password hashing.
- Zod validation.
- Prisma parameterization.
- Role/ownership tests.

Implementation anchors:

- Auth service.
- Validation schemas.
- Ownership helpers.

### Scalability and design, 15/15 target

Proof:

- Indexed schema.
- Pagination.
- Outbox worker with `SKIP LOCKED`.
- Counters.
- Architecture notes.

Implementation anchors:

- Prisma indexes.
- Worker batch processing.
- README scalability section.

### Code quality, 10/10 target

Proof:

- Organized folders.
- Shared DTOs.
- Clear service boundaries.
- Short comments around transaction logic.

Implementation anchors:

- `src/server` modules.
- `src/components` modules.
- Tests.

### Presentation, 10/10 target

Proof:

- Demo script.
- Proof Mode.
- Architecture slide.
- Live worker/job visibility.

Implementation anchors:

- Seed scenario.
- Proof Mode.
- README demo section.

## 27. Presentation demo script

Goal: show the exact rubric flow in under 5 minutes.

### Step 1: Open Proof Mode

Show:

- Worker status.
- Current domain events.
- Current notification jobs.
- Demo checklist.

Say:

> This app is designed so the critical backend requirements are visible, not hidden. We will prove role access, waitlist fairness, and async notification delivery in one flow.

### Step 2: Organizer creates draft

Use seeded organizer:

- Create "Data Ethics Roundtable".
- Capacity 1.
- Add time/location.
- Preview as student.
- Publish.

Show:

- Event status changes from `DRAFT` to `PUBLISHED`.
- Student preview.

### Step 3: Student registers

Use Student Maya:

- Open published event.
- Register.
- Status becomes `CONFIRMED`.

Show:

- Capacity `1/1`.
- Job `RegistrationConfirmed` pending.

### Step 4: Second student joins waitlist

Use Student Jordan:

- Register for same event.
- Status becomes `WAITLISTED`.
- Position `1`.

Show:

- Waitlist count.
- Job `RegistrationWaitlisted` pending.
- Organizer waitlist table with Jordan sequence.

### Step 5: Cancel confirmed registration

Use Student Maya:

- Cancel registration.

Show:

- Maya cancelled.
- Jordan promoted to confirmed.
- Domain events:
  - `REGISTRATION_CANCELLED`
  - `WAITLIST_PROMOTED`
- Job `WaitlistPromoted` pending.

### Step 6: Run worker

Run worker process or click demo worker action if allowed in dev:

```bash
npm run worker:once
```

Show:

- Jobs move from `PENDING` to `SENT`.
- Delivery attempts logged.
- Idempotency keys visible.

### Step 7: Show security proof

Use a forbidden action:

- Student attempts organizer endpoint.
- Response `403`.
- Organizer attempts another organizer's event if seeded.

Show:

- API error shape.
- Proof Mode security check.

### Step 8: Show concurrency proof

Run test or Proof Mode drill:

```bash
npm run test:e2e -- tests/concurrency.spec.ts
```

Show:

- Capacity 1 event.
- 10 parallel requests.
- Exactly 1 confirmed.
- 9 waitlisted.
- No duplicate waitlist sequence.

## 28. README and documentation plan

The README should be rewritten for the competition, not left as a generic starter file.

README sections:

- Product summary.
- Requirements from PDF and how CampusPulse satisfies them.
- Local setup with port `55434`.
- Environment variables.
- Prisma migration and seed commands.
- Running Next.js on `3010`.
- Running worker separately.
- REST endpoint table.
- Architecture diagram.
- Database schema summary.
- Transaction/waitlist explanation.
- Notification outbox explanation.
- Idempotency strategy.
- Security model.
- Scalability notes.
- Demo script.
- Test commands.

Keep the current PDFs in root for evaluator context.

## 29. Environment variables

Recommended `.env.example`:

```bash
DATABASE_URL="postgresql://campuspulse:campuspulse_dev_password@localhost:55434/campuspulse_enterprise?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3010"
SESSION_SECRET="replace-with-a-long-random-secret"
PASSWORD_HASH_PEPPER=""
NOTIFICATION_DRIVER="log"
WORKER_POLL_INTERVAL_MS="1000"
WORKER_BATCH_SIZE="10"
WORKER_ID="local-worker-1"
DEMO_MODE="true"
```

If real email is used:

```bash
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="CampusPulse <no-reply@campuspulse.local>"
```

## 30. Risk register

### Risk: Next.js version differs from common docs

Mitigation:

- Follow `AGENTS.md`.
- After `npm install`, read `node_modules/next/dist/docs/` before writing app/API code.
- Avoid relying on memory for version-sensitive APIs.

### Risk: Prisma partial unique indexes

Mitigation:

- Use raw SQL migration for active registration uniqueness.
- Document it in README.
- Add test that duplicate active registration fails.

### Risk: Overbooking under concurrency

Mitigation:

- Lock event row in transaction.
- Update counters inside the same transaction.
- Add parallel registration test.

### Risk: Worker looks fake

Mitigation:

- Run worker as separate script.
- Persist job states.
- Persist delivery attempts.
- Show worker output in UI/Proof Mode.

### Risk: Frontend becomes too decorative

Mitigation:

- Build the application workspace as the first screen.
- Keep panels dense and useful.
- Use restrained color and typography.
- Avoid marketing-style hero sections.

### Risk: Demo data is hard to reset

Mitigation:

- Add seed command.
- Add optional demo reset script.
- Keep deterministic seeded users and events.

## 31. Definition of done

Backend done:

- Prisma schema and migrations exist.
- Postgres runs on `55434`.
- Auth works with slow password hashing.
- Role and ownership checks pass.
- Event lifecycle works.
- Registration and cancellation promotion are transaction-safe.
- Domain events and notification jobs are created in transactions.
- Separate worker processes jobs.
- Retries and idempotency are implemented.

Frontend done:

- Student can browse, register, cancel, and view own registrations.
- Organizer can create, edit, preview, publish, cancel, and view lists.
- Notification operations are visible.
- UI is responsive.
- Empty/loading/error states exist.
- Proof Mode demonstrates rubric requirements.

Testing done:

- Core Playwright flows pass.
- API authorization tests pass.
- Concurrency test passes.
- Worker test passes.
- Build passes.

Presentation done:

- README explains architecture and setup.
- Demo script is rehearsed.
- Seed data supports the exact flow.
- Proof Mode shows real evidence.

## 32. Final build priority

If time is limited, build in this order:

1. Database schema, auth, and RBAC.
2. Event lifecycle.
3. Registration transaction with FIFO waitlist.
4. Domain events and notification outbox.
5. Separate worker with log delivery.
6. Student and organizer UI for required flows.
7. Notification operations panel.
8. Proof Mode.
9. Concurrency tests.
10. FairSeat Replay.
11. Queue Flight Recorder.
12. Concurrency Arena.
13. Publish Control Tower.
14. Command palette and Waitlist What-If.
15. Event Galaxy Map or Serendipity Spin.
16. Campus Terminal surfaces: Terminal Display, Boarding Pass, Standby Board.
17. Crew Mode or Campus Trails.
18. Quiet Digest, Arrival Companion, and Vibe Tags.
19. Optional polish: Campus Passport, check-in, Event Afterglow, real email.

The most important thing is to avoid a beautiful app with shallow backend behavior. The winning version is beautiful because it makes the hard backend behavior understandable.

The second most important thing is to avoid a merely compliant app. Once the core is reliable, the winning version should feel like something students would actually open for fun: spin for events, follow trails, form crews, watch seats move fairly, and get useful reminders instead of notification noise.
