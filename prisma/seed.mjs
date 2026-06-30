import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash("password123", 12);

const now = new Date("2026-06-30T12:00:00.000Z");

const users = [
  { id: "user-organizer-rivera", email: "organizer@campuspulse.test", displayName: "Dr. Elena Rivera", role: "ORGANIZER", interests: ["AI", "Career"] },
  { id: "user-organizer-kim", email: "organizer.kim@campuspulse.test", displayName: "Marcus Kim", role: "ORGANIZER", interests: ["Wellness"] },
  { id: "user-admin", email: "admin@campuspulse.test", displayName: "Campus Admin", role: "ADMIN", interests: [] },
  { id: "user-maya", email: "student.maya@campuspulse.test", displayName: "Maya Chen", role: "STUDENT", interests: ["AI", "Design", "Career"] },
  { id: "user-jordan", email: "student.jordan@campuspulse.test", displayName: "Jordan Ellis", role: "STUDENT", interests: ["Robotics", "Career"] },
  { id: "user-priya", email: "student.priya@campuspulse.test", displayName: "Priya Nair", role: "STUDENT", interests: ["Wellness", "Workshop"] },
  { id: "user-sam", email: "student.sam@campuspulse.test", displayName: "Sam Okafor", role: "STUDENT", interests: ["Arts", "AI"] },
  { id: "user-lee", email: "student.lee@campuspulse.test", displayName: "Lee Alvarez", role: "STUDENT", interests: ["Career", "Wellness"] },
];

const events = [
  {
    id: "event-ai-study-sprint",
    organizerId: "user-organizer-rivera",
    status: "PUBLISHED",
    title: "AI Study Sprint",
    slug: "ai-study-sprint",
    description: "Students build a study workflow, test prompt patterns, and leave with a reusable exam-prep assistant.",
    startsAt: new Date("2026-07-08T16:00:00.000Z"),
    endsAt: new Date("2026-07-08T17:30:00.000Z"),
    capacity: 2,
    locationText: "Innovation Lab 2B",
    tags: ["AI", "Workshop"],
    terminal: "Academic",
    prepNote: "Bring one upcoming exam topic.",
    publishedAt: now,
    confirmedCount: 2,
    waitlistCount: 1,
    nextWaitlistSequence: 2,
  },
  {
    id: "event-robotics-open-house",
    organizerId: "user-organizer-rivera",
    status: "PUBLISHED",
    title: "Robotics Lab Open House",
    slug: "robotics-lab-open-house",
    description: "A hands-on open lab with sensor demos, safety walkthroughs, and club project matching.",
    startsAt: new Date("2026-07-12T15:30:00.000Z"),
    endsAt: new Date("2026-07-12T17:00:00.000Z"),
    capacity: 3,
    locationText: "Maker Hall Arena",
    tags: ["Robotics", "Workshop"],
    terminal: "Clubs",
    prepNote: "Closed-toe shoes required.",
    publishedAt: now,
    confirmedCount: 1,
    waitlistCount: 0,
    nextWaitlistSequence: 1,
  },
  {
    id: "event-wellness-reset",
    organizerId: "user-organizer-kim",
    status: "PUBLISHED",
    title: "Wellness Reset Workshop",
    slug: "wellness-reset-workshop",
    description: "A guided reset with breathing drills, focus blocks, and a practical finals-week recovery plan.",
    startsAt: new Date("2026-07-15T11:00:00.000Z"),
    endsAt: new Date("2026-07-15T12:00:00.000Z"),
    capacity: 1,
    locationText: "North Quad Studio",
    tags: ["Wellness", "Workshop"],
    terminal: "Wellness",
    prepNote: "Comfortable clothes recommended.",
    publishedAt: now,
    confirmedCount: 1,
    waitlistCount: 0,
    nextWaitlistSequence: 1,
  },
  {
    id: "event-career-clinic",
    organizerId: "user-organizer-rivera",
    status: "DRAFT",
    title: "College Essay Clinic",
    slug: "college-essay-clinic",
    description: "Small critique pods for personal statements and scholarship essays.",
    startsAt: new Date("2026-07-18T14:00:00.000Z"),
    endsAt: new Date("2026-07-18T16:00:00.000Z"),
    capacity: 12,
    locationText: "Career Hub Room 4",
    tags: ["Career", "Workshop"],
    terminal: "Career",
  },
  {
    id: "event-spring-showcase",
    organizerId: "user-organizer-kim",
    status: "CANCELLED",
    title: "Spring Showcase",
    slug: "spring-showcase",
    description: "A cancelled showcase retained for lifecycle and notification proof.",
    startsAt: new Date("2026-07-02T19:00:00.000Z"),
    endsAt: new Date("2026-07-02T21:00:00.000Z"),
    capacity: 80,
    locationText: "Riverside Theater",
    tags: ["Arts"],
    terminal: "Arts",
    cancelledAt: now,
    cancellationReason: "Venue maintenance",
  },
];

const registrations = [
  { id: "reg-ai-maya", eventId: "event-ai-study-sprint", userId: "user-maya", status: "CONFIRMED", confirmedAt: now },
  { id: "reg-ai-jordan", eventId: "event-ai-study-sprint", userId: "user-jordan", status: "CONFIRMED", confirmedAt: now },
  { id: "reg-ai-priya", eventId: "event-ai-study-sprint", userId: "user-priya", status: "WAITLISTED", waitlistSequence: 1, waitlistedAt: now },
  { id: "reg-robotics-jordan", eventId: "event-robotics-open-house", userId: "user-jordan", status: "CONFIRMED", confirmedAt: now },
  { id: "reg-wellness-priya", eventId: "event-wellness-reset", userId: "user-priya", status: "CONFIRMED", confirmedAt: now },
];

const trails = [
  { id: "trail-first-year", slug: "first-year-starter", title: "First-Year Starter Trail", description: "A low-pressure path through clubs, study support, and wellness events." },
  { id: "trail-career-launch", slug: "career-launch", title: "Career Launch Trail", description: "Resume clinics, interview practice, and alumni panels for career momentum." },
];

async function main() {
  await prisma.notificationDelivery.deleteMany();
  await prisma.notificationJob.deleteMany();
  await prisma.domainEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.eventFeedback.deleteMany();
  await prisma.trailFollower.deleteMany();
  await prisma.trailEvent.deleteMany();
  await prisma.trail.deleteMany();
  await prisma.eventCrewMember.deleteMany();
  await prisma.eventCrew.deleteMany();
  await prisma.eventBookmark.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.user.deleteMany();
  await prisma.demoDrillResult.deleteMany();
  await prisma.workerHeartbeat.deleteMany();

  for (const user of users) {
    await prisma.user.create({ data: { ...user, passwordHash } });
  }

  for (const event of events) {
    await prisma.event.create({ data: event });
  }

  for (const registration of registrations) {
    await prisma.registration.create({ data: registration });
  }

  for (const trail of trails) {
    await prisma.trail.create({ data: trail });
  }

  await prisma.trailEvent.createMany({
    data: [
      { trailId: "trail-first-year", eventId: "event-ai-study-sprint", sortOrder: 1 },
      { trailId: "trail-first-year", eventId: "event-wellness-reset", sortOrder: 2 },
      { trailId: "trail-career-launch", eventId: "event-career-clinic", sortOrder: 1 },
    ],
  });

  await prisma.eventCrew.create({
    data: {
      id: "crew-ai-builders",
      eventId: "event-ai-study-sprint",
      code: "AI-CREW",
      name: "AI Builders",
      createdBy: "user-maya",
      members: {
        create: [
          { userId: "user-maya" },
          { userId: "user-jordan" },
          { userId: "user-priya" },
        ],
      },
    },
  });

  await prisma.workerHeartbeat.create({
    data: {
      workerId: "seed-worker",
      status: "SEEDED",
      seenAt: now,
      metaJson: { note: "Seed completed" },
    },
  });

  console.log("Seeded CampusPulse Enterprise demo data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
