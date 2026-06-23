export const students = [
  {
    id: "maya",
    name: "Maya Chen",
    email: "maya@school.edu",
    preferredTags: ["AI", "Workshop", "Design"],
    follows: ["organizer"],
  },
  {
    id: "luis",
    name: "Luis Romero",
    email: "luis@school.edu",
    preferredTags: ["Music", "Career", "Sports"],
    follows: ["organizer"],
  },
  {
    id: "nora",
    name: "Nora Patel",
    email: "nora@school.edu",
    preferredTags: ["Robotics", "AI", "Workshop"],
    follows: ["organizer"],
  },
  {
    id: "kai",
    name: "Kai Johnson",
    email: "kai@school.edu",
    preferredTags: ["Wellness", "Design", "Workshop"],
    follows: [],
  },
  {
    id: "zara",
    name: "Zara Smith",
    email: "zara@school.edu",
    preferredTags: ["Career", "AI", "Music"],
    follows: ["organizer"],
  },
];

export const organizer = {
  id: "organizer",
  name: "Campus Activities",
  email: "organizer@school.edu",
};

export const tagOptions = [
  { label: "AI", tone: "#19a974" },
  { label: "Workshop", tone: "#f6c85f" },
  { label: "Career", tone: "#ff9f1c" },
  { label: "Music", tone: "#ec5f67" },
  { label: "Art", tone: "#f45b69" },
  { label: "Sports", tone: "#00a7e1" },
  { label: "Wellness", tone: "#70c1b3" },
  { label: "Design", tone: "#ff6f59" },
  { label: "Robotics", tone: "#4ecdc4" },
];

export const initialEvents = [
  {
    id: "evt-ai",
    organizerId: organizer.id,
    title: "Build an AI Study Buddy in 90 Minutes",
    slug: "build-ai-study-buddy",
    status: "PUBLISHED",
    visibility: "PUBLIC",
    startsAt: "2026-07-08T16:00:00+03:00",
    endsAt: "2026-07-08T17:30:00+03:00",
    capacity: 2,
    locationText: "Innovation Lab 2B",
    meetingUrl: "",
    coverImage: "/covers/ai.png",
    tags: ["AI", "Workshop"],
    description:
      "A fast workshop where students prototype a personal study assistant, validate prompts, and leave with a working demo.",
    waitlistCounter: 1,
    viewCount: 348,
    publishedAt: "2026-06-19T12:00:00+03:00",
  },
  {
    id: "evt-jazz",
    organizerId: organizer.id,
    title: "Campus Jazz Night",
    slug: "campus-jazz-night",
    status: "PUBLISHED",
    visibility: "PUBLIC",
    startsAt: "2026-07-12T19:00:00+03:00",
    endsAt: "2026-07-12T21:30:00+03:00",
    capacity: 80,
    locationText: "Riverside Theater",
    meetingUrl: "",
    coverImage: "/covers/jazz.png",
    tags: ["Music", "Art"],
    description:
      "Student ensembles share a rotating setlist with reserved seating, check-in, and organizer delivery logs.",
    waitlistCounter: 0,
    viewCount: 521,
    publishedAt: "2026-06-18T09:30:00+03:00",
  },
  {
    id: "evt-robotics",
    organizerId: organizer.id,
    title: "Robotics Club: Sumo Bot Challenge",
    slug: "robotics-sumo-bot-challenge",
    status: "DRAFT",
    visibility: "PUBLIC",
    startsAt: "2026-07-16T15:30:00+03:00",
    endsAt: "2026-07-16T18:00:00+03:00",
    capacity: 20,
    locationText: "Maker Hall Arena",
    meetingUrl: "",
    coverImage: "/covers/robotics.png",
    tags: ["Robotics", "Workshop"],
    description:
      "Teams build compact bots, pass safety checks, and compete in a bracket with transparent waitlist rules.",
    waitlistCounter: 0,
    viewCount: 104,
    publishedAt: null,
  },
  {
    id: "evt-wellness",
    organizerId: organizer.id,
    title: "Finals Week Wellness Lab",
    slug: "finals-week-wellness-lab",
    status: "PUBLISHED",
    visibility: "PUBLIC",
    startsAt: "2026-07-20T11:00:00+03:00",
    endsAt: "2026-07-20T13:00:00+03:00",
    capacity: 25,
    locationText: "North Quad Studio",
    meetingUrl: "",
    coverImage: "/covers/wellness.png",
    tags: ["Wellness", "Workshop"],
    description:
      "A guided rotation through breathing drills, study breaks, and check-in stations for finals week.",
    waitlistCounter: 0,
    viewCount: 286,
    publishedAt: "2026-06-19T13:10:00+03:00",
  },
  {
    id: "evt-career",
    organizerId: organizer.id,
    title: "Career Sprint: Resume Critique Pods",
    slug: "career-sprint-resume-pods",
    status: "PUBLISHED",
    visibility: "PUBLIC",
    startsAt: "2026-07-22T14:00:00+03:00",
    endsAt: "2026-07-22T16:00:00+03:00",
    capacity: 30,
    locationText: "Career Hub Room 4",
    meetingUrl: "",
    coverImage: "/covers/career.png",
    tags: ["Career", "Workshop"],
    description:
      "Career advisers rotate through small pods. Seat status stays visible so students know when waitlist pressure rises.",
    waitlistCounter: 0,
    viewCount: 402,
    publishedAt: "2026-06-17T14:00:00+03:00",
  },
  {
    id: "evt-design",
    organizerId: organizer.id,
    title: "Design Systems Crit Night",
    slug: "design-systems-crit-night",
    status: "CLOSED",
    visibility: "PUBLIC",
    startsAt: "2026-07-04T17:00:00+03:00",
    endsAt: "2026-07-04T18:30:00+03:00",
    capacity: 18,
    locationText: "Studio C",
    meetingUrl: "",
    coverImage: "/covers/design.png",
    tags: ["Design", "Career"],
    description:
      "A closed critique session for portfolio review, showing how the catalog handles events after registration closes.",
    waitlistCounter: 0,
    viewCount: 198,
    publishedAt: "2026-06-12T10:00:00+03:00",
  },
];

export const initialRegistrations = [
  {
    id: "reg-ai-maya",
    eventId: "evt-ai",
    studentId: "maya",
    status: "CONFIRMED",
    waitlistSequence: null,
    createdAt: "2026-06-20T12:05:00+03:00",
    updatedAt: "2026-06-20T12:05:00+03:00",
  },
  {
    id: "reg-ai-luis",
    eventId: "evt-ai",
    studentId: "luis",
    status: "CONFIRMED",
    waitlistSequence: null,
    createdAt: "2026-06-20T12:07:00+03:00",
    updatedAt: "2026-06-20T12:07:00+03:00",
  },
  {
    id: "reg-ai-nora",
    eventId: "evt-ai",
    studentId: "nora",
    status: "WAITLISTED",
    waitlistSequence: 1,
    createdAt: "2026-06-20T12:08:00+03:00",
    updatedAt: "2026-06-20T12:08:00+03:00",
  },
  {
    id: "reg-jazz-maya",
    eventId: "evt-jazz",
    studentId: "maya",
    status: "CONFIRMED",
    waitlistSequence: null,
    createdAt: "2026-06-19T13:20:00+03:00",
    updatedAt: "2026-06-19T13:20:00+03:00",
  },
  {
    id: "reg-wellness-kai",
    eventId: "evt-wellness",
    studentId: "kai",
    status: "CONFIRMED",
    waitlistSequence: null,
    createdAt: "2026-06-19T14:10:00+03:00",
    updatedAt: "2026-06-19T14:10:00+03:00",
  },
  {
    id: "reg-career-zara",
    eventId: "evt-career",
    studentId: "zara",
    status: "CONFIRMED",
    waitlistSequence: null,
    createdAt: "2026-06-18T11:05:00+03:00",
    updatedAt: "2026-06-18T11:05:00+03:00",
  },
];

export const initialTransitions = [
  {
    id: "tr-ai-maya-confirmed",
    registrationId: "reg-ai-maya",
    eventId: "evt-ai",
    studentId: "maya",
    from: null,
    to: "CONFIRMED",
    label: "Confirmed after capacity check",
    createdAt: "2026-06-20T12:05:00+03:00",
  },
  {
    id: "tr-ai-luis-confirmed",
    registrationId: "reg-ai-luis",
    eventId: "evt-ai",
    studentId: "luis",
    from: null,
    to: "CONFIRMED",
    label: "Confirmed after capacity check",
    createdAt: "2026-06-20T12:07:00+03:00",
  },
  {
    id: "tr-ai-nora-waitlisted",
    registrationId: "reg-ai-nora",
    eventId: "evt-ai",
    studentId: "nora",
    from: null,
    to: "WAITLISTED",
    label: "Joined waitlist at position #1",
    createdAt: "2026-06-20T12:08:00+03:00",
  },
  {
    id: "tr-jazz-maya-confirmed",
    registrationId: "reg-jazz-maya",
    eventId: "evt-jazz",
    studentId: "maya",
    from: null,
    to: "CONFIRMED",
    label: "Confirmed after capacity check",
    createdAt: "2026-06-19T13:20:00+03:00",
  },
];

export const initialJobs = [
  {
    id: "job-ai-maya-email",
    eventId: "evt-ai",
    registrationId: "reg-ai-maya",
    recipientId: "maya",
    type: "REGISTRATION_CONFIRMED",
    channel: "EMAIL",
    status: "SENT",
    attempts: 1,
    maxAttempts: 5,
    runAt: "2026-06-20T12:05:01+03:00",
    idempotencyKey: "REGISTRATION_CONFIRMED:EMAIL:reg-ai-maya",
    lastError: "",
  },
  {
    id: "job-ai-nora-inapp",
    eventId: "evt-ai",
    registrationId: "reg-ai-nora",
    recipientId: "nora",
    type: "REGISTRATION_WAITLISTED",
    channel: "IN_APP",
    status: "SENT",
    attempts: 1,
    maxAttempts: 5,
    runAt: "2026-06-20T12:08:01+03:00",
    idempotencyKey: "REGISTRATION_WAITLISTED:IN_APP:reg-ai-nora",
    lastError: "",
  },
  {
    id: "job-design-failed-email",
    eventId: "evt-design",
    registrationId: null,
    recipientId: "zara",
    type: "EVENT_CANCELLED",
    channel: "EMAIL",
    status: "FAILED",
    attempts: 5,
    maxAttempts: 5,
    runAt: "2026-06-19T18:00:00+03:00",
    idempotencyKey: "EVENT_CANCELLED:EMAIL:evt-design:zara",
    lastError: "SMTP provider rejected the message after retry.",
  },
];

export const initialDeliveries = [
  {
    id: "del-ai-maya-email",
    jobId: "job-ai-maya-email",
    userId: "maya",
    channel: "EMAIL",
    status: "SENT",
    provider: "log",
    createdAt: "2026-06-20T12:05:03+03:00",
  },
  {
    id: "del-ai-nora-inapp",
    jobId: "job-ai-nora-inapp",
    userId: "nora",
    channel: "IN_APP",
    status: "SENT",
    provider: "in-app",
    createdAt: "2026-06-20T12:08:03+03:00",
  },
];

export const initialNotifications = [
  {
    id: "notif-nora-waitlisted",
    userId: "nora",
    eventId: "evt-ai",
    type: "REGISTRATION_WAITLISTED",
    title: "Waitlist position saved",
    body: "You are position #1 for Build an AI Study Buddy in 90 Minutes.",
    createdAt: "2026-06-20T12:08:03+03:00",
    read: false,
  },
  {
    id: "notif-maya-jazz",
    userId: "maya",
    eventId: "evt-jazz",
    type: "REGISTRATION_CONFIRMED",
    title: "Seat confirmed",
    body: "You are confirmed for Campus Jazz Night.",
    createdAt: "2026-06-19T13:20:03+03:00",
    read: true,
  },
];

export const initialDomainEvents = [
  {
    id: "de-ai-maya-confirmed",
    eventId: "evt-ai",
    registrationId: "reg-ai-maya",
    userId: "maya",
    type: "REGISTRATION_CONFIRMED",
    createdAt: "2026-06-20T12:05:00+03:00",
  },
  {
    id: "de-ai-nora-waitlisted",
    eventId: "evt-ai",
    registrationId: "reg-ai-nora",
    userId: "nora",
    type: "REGISTRATION_WAITLISTED",
    createdAt: "2026-06-20T12:08:00+03:00",
  },
];

export const checkedInHistory = [
  { id: "check-maya-design", studentId: "maya", label: "Design Systems Crit", tag: "Design" },
  { id: "check-luis-sports", studentId: "luis", label: "Intramural Finals", tag: "Sports" },
  { id: "check-zara-career", studentId: "zara", label: "Career Sprint", tag: "Career" },
];

export function createInitialState() {
  return structuredClone({
    events: initialEvents,
    registrations: initialRegistrations,
    transitions: initialTransitions,
    jobs: initialJobs,
    deliveries: initialDeliveries,
    notifications: initialNotifications,
    domainEvents: initialDomainEvents,
  });
}

export function computePulse(event) {
  const fillRatio = event.capacity === 0 ? 1 : event.confirmedCount / event.capacity;

  if (event.status === "CANCELLED") return { label: "Cancelled", score: 0 };
  if (event.status === "CLOSED") return { label: "Closed", score: 20 };
  if (event.waitlistCount > 0) return { label: "Waitlist Active", score: 100 };
  if (fillRatio >= 0.9) return { label: "Almost Full", score: 90 };
  if (fillRatio >= 0.65) return { label: "Filling Fast", score: 70 };
  return { label: "Fresh", score: 40 };
}

export function activeRegistration(registration) {
  return ["CONFIRMED", "WAITLISTED", "CHECKED_IN"].includes(registration.status);
}

export function confirmedRegistration(registration) {
  return ["CONFIRMED", "CHECKED_IN"].includes(registration.status);
}

export function deriveEventMetrics(event, registrations) {
  const eventRegistrations = registrations.filter((registration) => registration.eventId === event.id);
  const confirmedCount = eventRegistrations.filter(confirmedRegistration).length;
  const waitlistCount = eventRegistrations.filter((registration) => registration.status === "WAITLISTED").length;

  return {
    ...event,
    confirmedCount,
    waitlistCount,
    seatsOpen: Math.max(event.capacity - confirmedCount, 0),
  };
}

export function enrichEvents(events, registrations) {
  return events.map((event) => {
    const withMetrics = deriveEventMetrics(event, registrations);
    return {
      ...withMetrics,
      pulse: computePulse(withMetrics),
    };
  });
}

export function getStudent(studentId) {
  return students.find((student) => student.id === studentId);
}

export function getActiveRegistration(registrations, eventId, studentId) {
  return registrations.find(
    (registration) =>
      registration.eventId === eventId &&
      registration.studentId === studentId &&
      activeRegistration(registration),
  );
}

export function getWaitlistPosition(registrations, eventId, registrationId) {
  const waitlist = registrations
    .filter((registration) => registration.eventId === eventId && registration.status === "WAITLISTED")
    .sort((a, b) => a.waitlistSequence - b.waitlistSequence);

  const index = waitlist.findIndex((registration) => registration.id === registrationId);
  return index === -1 ? null : index + 1;
}

export function getActionState(event, registration, registrations) {
  if (event.status === "CANCELLED") return { label: "Cancelled", action: "none", disabled: true };
  if (event.status === "CLOSED") return { label: "Registration closed", action: "none", disabled: true };
  if (event.status !== "PUBLISHED") return { label: "Preview only", action: "none", disabled: true };

  if (registration?.status === "CONFIRMED" || registration?.status === "CHECKED_IN") {
    return { label: "You're confirmed", action: "cancel", disabled: false };
  }

  if (registration?.status === "WAITLISTED") {
    const position = getWaitlistPosition(registrations, event.id, registration.id);
    return { label: `You're #${position} on waitlist`, action: "cancel", disabled: false };
  }

  if (event.seatsOpen > 0) return { label: "Register", action: "register", disabled: false };
  return { label: "Join waitlist", action: "register", disabled: false };
}

export function getWaitlistBadge(event) {
  if (event.waitlistCount > 0) return "Waitlist Active";
  if (event.seatsOpen <= 0) return "Full";
  return "Open";
}

export function formatEventDate(iso) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Europe/Kyiv",
  }).format(new Date(iso));
}

export function formatTimeOnly(iso) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Europe/Kyiv",
  }).format(new Date(iso));
}

export function createJobSet({ eventId, registrationId, recipientId, type, now }) {
  return ["EMAIL", "IN_APP"].map((channel) => ({
    id: uniqueId("job", `${eventId}-${recipientId}-${type}-${channel}`),
    eventId,
    registrationId,
    recipientId,
    type,
    channel,
    status: "PENDING",
    attempts: 0,
    maxAttempts: 5,
    runAt: now,
    idempotencyKey: `${type}:${channel}:${registrationId ?? eventId}:${recipientId}`,
    lastError: "",
  }));
}

export function registerForEvent(state, eventId, studentId, now = new Date().toISOString()) {
  const events = state.events.map((event) => ({ ...event }));
  const eventIndex = events.findIndex((event) => event.id === eventId);
  if (eventIndex === -1) return { state, message: "Event not found" };

  const registrations = state.registrations.map((registration) => ({ ...registration }));
  const eventWithMetrics = deriveEventMetrics(events[eventIndex], registrations);
  const existing = getActiveRegistration(registrations, eventId, studentId);

  if (existing) {
    return { state, message: "Already registered" };
  }

  if (eventWithMetrics.status !== "PUBLISHED") {
    return { state, message: "Registration unavailable" };
  }

  const willConfirm = eventWithMetrics.confirmedCount < eventWithMetrics.capacity;
  const sequence = willConfirm ? null : nextWaitlistSequence(events[eventIndex], registrations);
  const status = willConfirm ? "CONFIRMED" : "WAITLISTED";
  const registration = {
    id: uniqueId("reg", `${eventId}-${studentId}`),
    eventId,
    studentId,
    status,
    waitlistSequence: sequence,
    createdAt: now,
    updatedAt: now,
  };

  if (sequence) {
    events[eventIndex].waitlistCounter = Math.max(events[eventIndex].waitlistCounter, sequence);
  }

  const transitions = [
    ...state.transitions,
    {
      id: uniqueId("tr", `${registration.id}-${status}`),
      registrationId: registration.id,
      eventId,
      studentId,
      from: null,
      to: status,
      label: willConfirm ? "Confirmed after capacity check" : `Joined waitlist at position #${sequence}`,
      createdAt: now,
    },
  ];

  const type = willConfirm ? "REGISTRATION_CONFIRMED" : "REGISTRATION_WAITLISTED";
  const jobs = [
    ...state.jobs,
    ...createJobSet({ eventId, registrationId: registration.id, recipientId: studentId, type, now }),
  ];

  const domainEvents = [
    ...state.domainEvents,
    {
      id: uniqueId("de", `${registration.id}-${type}`),
      eventId,
      registrationId: registration.id,
      userId: studentId,
      type,
      createdAt: now,
    },
  ];

  return {
    state: {
      ...state,
      events,
      registrations: [...registrations, registration],
      transitions,
      jobs,
      domainEvents,
    },
    message: willConfirm ? "Seat confirmed" : `Joined waitlist at position #${sequence}`,
    registration,
  };
}

export function cancelRegistration(state, eventId, studentId, now = new Date().toISOString()) {
  const registrations = state.registrations.map((registration) => ({ ...registration }));
  const targetIndex = registrations.findIndex(
    (registration) =>
      registration.eventId === eventId &&
      registration.studentId === studentId &&
      activeRegistration(registration),
  );

  if (targetIndex === -1) return { state, message: "No active registration" };

  const cancelled = { ...registrations[targetIndex] };
  const wasConfirmed = confirmedRegistration(cancelled);
  registrations[targetIndex] = {
    ...cancelled,
    status: "CANCELLED_BY_USER",
    updatedAt: now,
  };

  let transitions = [
    ...state.transitions,
    {
      id: uniqueId("tr", `${cancelled.id}-cancelled`),
      registrationId: cancelled.id,
      eventId,
      studentId,
      from: cancelled.status,
      to: "CANCELLED_BY_USER",
      label: "Student cancelled before event start",
      createdAt: now,
    },
  ];

  let domainEvents = [
    ...state.domainEvents,
    {
      id: uniqueId("de", `${cancelled.id}-cancelled`),
      eventId,
      registrationId: cancelled.id,
      userId: studentId,
      type: "REGISTRATION_CANCELLED",
      createdAt: now,
    },
  ];

  let jobs = [
    ...state.jobs,
    ...createJobSet({
      eventId,
      registrationId: cancelled.id,
      recipientId: studentId,
      type: "REGISTRATION_CANCELLED",
      now,
    }),
  ];

  let promoted = null;
  if (wasConfirmed) {
    const nextIndex = registrations
      .map((registration, index) => ({ registration, index }))
      .filter(({ registration }) => registration.eventId === eventId && registration.status === "WAITLISTED")
      .sort((a, b) => a.registration.waitlistSequence - b.registration.waitlistSequence)[0]?.index;

    if (nextIndex !== undefined) {
      const nextRegistration = registrations[nextIndex];
      registrations[nextIndex] = {
        ...nextRegistration,
        status: "CONFIRMED",
        updatedAt: now,
      };
      promoted = registrations[nextIndex];

      transitions = [
        ...transitions,
        {
          id: uniqueId("tr", `${nextRegistration.id}-promoted`),
          registrationId: nextRegistration.id,
          eventId,
          studentId: nextRegistration.studentId,
          from: "WAITLISTED",
          to: "CONFIRMED",
          label: "Promoted after a confirmed seat opened",
          createdAt: now,
        },
      ];

      domainEvents = [
        ...domainEvents,
        {
          id: uniqueId("de", `${nextRegistration.id}-promoted`),
          eventId,
          registrationId: nextRegistration.id,
          userId: nextRegistration.studentId,
          type: "WAITLIST_PROMOTED",
          createdAt: now,
        },
      ];

      jobs = [
        ...jobs,
        ...createJobSet({
          eventId,
          registrationId: nextRegistration.id,
          recipientId: nextRegistration.studentId,
          type: "WAITLIST_PROMOTED",
          now,
        }),
      ];
    }
  }

  return {
    state: {
      ...state,
      registrations,
      transitions,
      jobs,
      domainEvents,
    },
    message: promoted ? `${getStudent(promoted.studentId).name} promoted from waitlist` : "Registration cancelled",
    promoted,
  };
}

export function runWorker(state, now = new Date().toISOString()) {
  const pendingJobs = state.jobs.filter((job) => job.status === "PENDING");

  if (pendingJobs.length === 0) {
    return { state, message: "No pending jobs" };
  }

  const sentJobs = new Set(pendingJobs.map((job) => job.id));
  const jobs = state.jobs.map((job) =>
    sentJobs.has(job.id)
      ? {
          ...job,
          status: "SENT",
          attempts: job.attempts + 1,
          lastError: "",
        }
      : job,
  );

  const deliveries = [
    ...state.deliveries,
    ...pendingJobs.map((job) => ({
      id: uniqueId("del", job.id),
      jobId: job.id,
      userId: job.recipientId,
      channel: job.channel,
      status: "SENT",
      provider: job.channel === "EMAIL" ? "log" : "in-app",
      createdAt: now,
    })),
  ];

  const notifications = [
    ...state.notifications,
    ...pendingJobs
      .filter((job) => job.channel === "IN_APP")
      .map((job) => {
        const event = state.events.find((item) => item.id === job.eventId);
        return {
          id: uniqueId("notif", job.id),
          userId: job.recipientId,
          eventId: job.eventId,
          type: job.type,
          title: notificationTitle(job.type),
          body: notificationBody(job.type, event),
          createdAt: now,
          read: false,
        };
      }),
  ];

  return {
    state: {
      ...state,
      jobs,
      deliveries,
      notifications,
    },
    message: `${pendingJobs.length} jobs sent`,
  };
}

export function publishEvent(state, eventId, now = new Date().toISOString()) {
  const events = state.events.map((event) => ({ ...event }));
  const eventIndex = events.findIndex((event) => event.id === eventId);
  if (eventIndex === -1) return { state, message: "Event not found" };

  const checklist = getPublishChecklist(events[eventIndex]);
  if (!Object.values(checklist).every(Boolean)) {
    return { state, message: "Publish checklist is incomplete" };
  }

  events[eventIndex] = {
    ...events[eventIndex],
    status: "PUBLISHED",
    publishedAt: now,
  };

  return {
    state: {
      ...state,
      events,
      domainEvents: [
        ...state.domainEvents,
        {
          id: uniqueId("de", `${eventId}-published`),
          eventId,
          registrationId: null,
          userId: organizer.id,
          type: "EVENT_PUBLISHED",
          createdAt: now,
        },
      ],
    },
    message: "Event published",
  };
}

export function createDraftEvent(state, draft, now = new Date().toISOString()) {
  const event = {
    id: uniqueId("evt", draft.title),
    organizerId: organizer.id,
    title: draft.title.trim(),
    slug: draft.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
    status: "DRAFT",
    visibility: "PUBLIC",
    startsAt: draft.startsAt,
    endsAt: draft.endsAt,
    capacity: Number(draft.capacity),
    locationText: draft.locationText.trim(),
    meetingUrl: "",
    coverImage: draft.coverImage,
    tags: draft.tags,
    description: draft.description.trim(),
    waitlistCounter: 0,
    viewCount: 0,
    publishedAt: null,
  };

  return {
    state: {
      ...state,
      events: [event, ...state.events],
      domainEvents: [
        ...state.domainEvents,
        {
          id: uniqueId("de", `${event.id}-created`),
          eventId: event.id,
          registrationId: null,
          userId: organizer.id,
          type: "EVENT_CREATED",
          createdAt: now,
        },
      ],
    },
    event,
    message: "Draft created",
  };
}

export function getPublishChecklist(event) {
  return {
    title: event.title.trim().length >= 8,
    description: event.description.trim().length >= 40,
    time: Boolean(event.startsAt && event.endsAt && new Date(event.endsAt) > new Date(event.startsAt)),
    capacity: Number(event.capacity) > 0,
    location: Boolean(event.locationText?.trim() || event.meetingUrl?.trim()),
  };
}

export function scoreRecommendation(event, student, registration) {
  if (event.status !== "PUBLISHED") return null;
  if (registration) return null;

  const matchingTags = event.tags.filter((tag) => student.preferredTags.includes(tag));
  const reasons = [];
  let score = 0;

  if (matchingTags.length) {
    score += matchingTags.length * 24;
    reasons.push(`${matchingTags.join(", ")} preference`);
  }
  if (student.follows.includes(event.organizerId)) {
    score += 18;
    reasons.push("followed organizer");
  }
  if (event.seatsOpen > 0) {
    score += 12;
    reasons.push("seats open");
  }
  if (event.waitlistCount > 0) {
    score += 8;
    reasons.push("active waitlist");
  }

  return { score, reasons };
}

export function draftSeed() {
  return {
    title: "VR Field Trip Studio",
    description:
      "Students rotate through immersive campus history scenes, reserve headset seats, and receive in-app reminders.",
    startsAt: "2026-07-28T15:00:00+03:00",
    endsAt: "2026-07-28T16:30:00+03:00",
    capacity: 16,
    locationText: "Media Lab B",
    tags: ["Design", "Workshop"],
    coverImage: "/covers/design.png",
  };
}

function nextWaitlistSequence(event, registrations) {
  const maxExisting = registrations
    .filter((registration) => registration.eventId === event.id)
    .reduce((max, registration) => Math.max(max, registration.waitlistSequence ?? 0), 0);

  return Math.max(event.waitlistCounter ?? 0, maxExisting) + 1;
}

function notificationTitle(type) {
  const titles = {
    REGISTRATION_CONFIRMED: "Seat confirmed",
    REGISTRATION_WAITLISTED: "Waitlist position saved",
    REGISTRATION_CANCELLED: "Registration cancelled",
    WAITLIST_PROMOTED: "Promoted from waitlist",
    EVENT_CANCELLED: "Event cancelled",
    EVENT_PUBLISHED: "Event published",
  };

  return titles[type] ?? "CampusPulse update";
}

function notificationBody(type, event) {
  const eventTitle = event?.title ?? "this event";
  const bodies = {
    REGISTRATION_CONFIRMED: `You are confirmed for ${eventTitle}.`,
    REGISTRATION_WAITLISTED: `Your FIFO waitlist position is saved for ${eventTitle}.`,
    REGISTRATION_CANCELLED: `Your registration for ${eventTitle} was cancelled.`,
    WAITLIST_PROMOTED: `A seat opened and you are confirmed for ${eventTitle}.`,
    EVENT_CANCELLED: `${eventTitle} was cancelled by the organizer.`,
    EVENT_PUBLISHED: `${eventTitle} is now published.`,
  };

  return bodies[type] ?? `Update for ${eventTitle}.`;
}

function uniqueId(prefix, seed) {
  const normalized = String(seed)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);

  return `${prefix}-${normalized}-${Date.now().toString(36)}`;
}
