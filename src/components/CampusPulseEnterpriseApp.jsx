"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  Loader2,
  LogIn,
  PlaneTakeoff,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  User,
  Users,
  Workflow,
  XCircle,
} from "lucide-react";
import { api, authApi } from "@/lib/api";

const demoAccounts = {
  student: { email: "student.maya@campuspulse.test", password: "password123" },
  organizer: { email: "organizer@campuspulse.test", password: "password123" },
};

const defaultDraft = () => {
  const startsAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  startsAt.setMinutes(0, 0, 0);
  return {
    title: "Night Market Builder Lab",
    description: "Students form pop-up teams, reserve build tables, and learn how campus events move from draft to queue proof.",
    startsAt: startsAt.toISOString().slice(0, 16),
    capacity: 6,
    locationText: "Student Union Bay 3",
    tags: "Design, Career, Workshop",
    terminal: "Launch",
    prepNote: "Bring one idea and one teammate.",
  };
};

function formatDate(value) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function statusTone(status) {
  return (
    {
      PUBLISHED: "border-emerald-200 bg-emerald-50 text-emerald-800",
      DRAFT: "border-zinc-200 bg-zinc-50 text-zinc-700",
      CANCELLED: "border-rose-200 bg-rose-50 text-rose-800",
      CLOSED: "border-amber-200 bg-amber-50 text-amber-800",
      CONFIRMED: "border-emerald-200 bg-emerald-50 text-emerald-800",
      WAITLISTED: "border-amber-200 bg-amber-50 text-amber-800",
      SENT: "border-emerald-200 bg-emerald-50 text-emerald-800",
      PENDING: "border-sky-200 bg-sky-50 text-sky-800",
      FAILED: "border-rose-200 bg-rose-50 text-rose-800",
    }[status] ?? "border-zinc-200 bg-white text-zinc-700"
  );
}

function Button({ children, className, variant = "primary", busy = false, ...props }) {
  return (
    <button
      className={cx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-zinc-950 text-white hover:bg-zinc-800",
        variant === "secondary" && "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
        variant === "danger" && "bg-rose-700 text-white hover:bg-rose-800",
        className,
      )}
      disabled={busy || props.disabled}
      {...props}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

function Stat({ label, value, icon: Icon, tone = "zinc" }) {
  return (
    <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</p>
        <Icon className={cx("h-4 w-4", tone === "rose" ? "text-rose-700" : "text-emerald-700")} />
      </div>
      <p className="mt-3 font-mono text-3xl font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

function Badge({ children, status }) {
  return (
    <span className={cx("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", statusTone(status))}>
      {children}
    </span>
  );
}

export default function CampusPulseEnterpriseApp({ initialMode = "student" }) {
  const [mode, setMode] = useState(initialMode);
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [proof, setProof] = useState(null);
  const [roster, setRoster] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedOrgEventId, setSelectedOrgEventId] = useState(null);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("All");
  const [draft, setDraft] = useState(defaultDraft);
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState("Choose a demo account to begin.");

  async function loadSession(nextMode = mode) {
    try {
      const response = await api("/users/me");
      setUser(response.user);
      await loadData(response.user, nextMode);
    } catch {
      setUser(null);
    }
  }

  async function loadData(currentUser = user, nextMode = mode) {
    if (!currentUser) return;
    const staff = currentUser.role === "ORGANIZER" || currentUser.role === "ADMIN";
    const eventQuery = staff && nextMode !== "student" ? "/events?mine=true&limit=100" : "/events?limit=100";
    const eventResponse = await api(eventQuery);
    const nextEvents = eventResponse.events ?? [];
    setEvents(nextEvents);

    const selected = nextEvents[0]?.id ?? null;
    setSelectedEventId((current) => current ?? selected);
    setSelectedOrgEventId((current) => current ?? selected);

    if (currentUser.role === "STUDENT") {
      const [myRegistrations, myNotifications] = await Promise.all([
        api("/registrations/me"),
        api("/notifications/me").catch(() => ({ notifications: [] })),
      ]);
      setRegistrations(myRegistrations.registrations ?? []);
      setNotifications(myNotifications.notifications ?? []);
      setJobs([]);
      setProof(null);
      return;
    }

    const [jobResponse, proofResponse] = await Promise.all([
      api("/notification-jobs?limit=50"),
      api("/ops/proof").catch(() => ({ proof: null })),
    ]);
    setJobs(jobResponse.jobs ?? []);
    setProof(proofResponse.proof ?? null);
  }

  async function loadOrganizerLists(eventId = selectedOrgEventId) {
    if (!eventId || !user || user.role === "STUDENT") return;
    const [confirmed, queued] = await Promise.all([
      api(`/events/${eventId}/registrations`),
      api(`/events/${eventId}/waitlist`),
    ]);
    setRoster(confirmed.registrations ?? []);
    setWaitlist(queued.registrations ?? []);
  }

  useEffect(() => {
    loadSession(initialMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadOrganizerLists(selectedOrgEventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrgEventId, user?.id]);

  async function loginAs(kind, nextMode = kind) {
    setBusy(`login-${kind}`);
    try {
      const response = await authApi.login(demoAccounts[kind]);
      setUser(response.user);
      setMode(nextMode);
      setToast(`Signed in as ${response.user.displayName}.`);
      await loadData(response.user, nextMode);
    } finally {
      setBusy("");
    }
  }

  async function switchMode(nextMode) {
    if (nextMode === "student") return loginAs("student", "student");
    if (nextMode === "organizer") return loginAs("organizer", "organizer");
    if (nextMode === "proof" || nextMode === "terminal") return loginAs("organizer", nextMode);
    setMode(nextMode);
  }

  async function refresh() {
    setBusy("refresh");
    try {
      await loadData(user, mode);
      await loadOrganizerLists(selectedOrgEventId);
      setToast("Live data refreshed.");
    } finally {
      setBusy("");
    }
  }

  async function register(eventId) {
    setBusy(`register-${eventId}`);
    try {
      const response = await api(`/events/${eventId}/registrations`, { method: "POST", body: JSON.stringify({}) });
      setToast(response.registration.status === "CONFIRMED" ? "Seat confirmed." : "Added to the FairSeat queue.");
      await loadData(user, mode);
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusy("");
    }
  }

  async function cancelRegistration(registrationId) {
    setBusy(`cancel-${registrationId}`);
    try {
      await api(`/registrations/${registrationId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: "Student changed plans" }),
      });
      setToast("Registration cancelled. FIFO promotion checked.");
      await loadData(user, mode);
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusy("");
    }
  }

  async function createDraft(event) {
    event.preventDefault();
    setBusy("draft");
    try {
      const response = await api("/events", {
        method: "POST",
        body: JSON.stringify({
          ...draft,
          startsAt: new Date(draft.startsAt).toISOString(),
          capacity: Number(draft.capacity),
          tags: draft.tags
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });
      setDraft(defaultDraft());
      setSelectedOrgEventId(response.event.id);
      setToast("Draft created in the command center.");
      await loadData(user, "organizer");
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusy("");
    }
  }

  async function publish(eventId) {
    setBusy(`publish-${eventId}`);
    try {
      await api(`/events/${eventId}/publish`, { method: "POST" });
      setToast("Event published and queued for notification delivery.");
      await loadData(user, "organizer");
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusy("");
    }
  }

  async function cancelEvent(eventId) {
    setBusy(`cancel-event-${eventId}`);
    try {
      await api(`/events/${eventId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: "Venue maintenance window" }),
      });
      setToast("Event cancelled and affected students were queued for notice.");
      await loadData(user, "organizer");
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusy("");
    }
  }

  async function runDrill() {
    setBusy("drill");
    try {
      const response = await api("/ops/concurrency-drill", {
        method: "POST",
        body: JSON.stringify({ label: "Judge Proof Drill", capacity: 2, attempts: 8 }),
      });
      setToast(`Drill complete: ${response.result.confirmed} confirmed, ${response.result.waitlisted} waitlisted.`);
      await loadData(user, "proof");
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusy("");
    }
  }

  const tags = useMemo(() => {
    const all = new Set(events.flatMap((event) => event.tags ?? []));
    return ["All", ...Array.from(all).sort()];
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const searchable = `${event.title} ${event.description} ${event.locationText ?? ""} ${(event.tags ?? []).join(" ")}`;
      const queryMatch = searchable.toLowerCase().includes(query.toLowerCase());
      const tagMatch = tag === "All" || event.tags?.includes(tag);
      return queryMatch && tagMatch;
    });
  }, [events, query, tag]);

  const registrationByEvent = useMemo(() => {
    const map = new Map();
    for (const registration of registrations) {
      if (["CONFIRMED", "WAITLISTED", "CHECKED_IN"].includes(registration.status)) {
        map.set(registration.eventId, registration);
      }
    }
    return map;
  }, [registrations]);

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? filteredEvents[0] ?? events[0];
  const selectedOrgEvent = events.find((event) => event.id === selectedOrgEventId) ?? events[0];
  const staff = user?.role === "ORGANIZER" || user?.role === "ADMIN";
  const summary = {
    events: events.length,
    confirmed: events.reduce((sum, event) => sum + (event.confirmedCount ?? 0), 0),
    waitlisted: events.reduce((sum, event) => sum + (event.waitlistCount ?? 0), 0),
    pending: proof?.queueSummary?.pendingJobs ?? jobs.filter((job) => job.status === "PENDING").length,
    sent: proof?.queueSummary?.sentJobs ?? jobs.filter((job) => job.status === "SENT").length,
  };

  if (!user) {
    return (
      <main className="min-h-[100dvh] bg-zinc-100 px-4 py-8 text-zinc-950" data-testid="app-shell">
        <section className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-semibold text-emerald-700">CampusPulse Enterprise</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.02] tracking-normal md:text-7xl">
              Run campus events like an operations terminal.
            </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-600">
              Real seats, FIFO waitlists, queued notifications, and proof cards for judges.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button data-testid="role-switch-student" onClick={() => loginAs("student")} busy={busy === "login-student"}>
                <User className="h-4 w-4" />
                Student Demo
              </Button>
              <Button
                data-testid="role-switch-organizer"
                onClick={() => loginAs("organizer", "organizer")}
                busy={busy === "login-organizer"}
                variant="secondary"
              >
                <ShieldCheck className="h-4 w-4" />
                Organizer Demo
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-xl">
            <div className="grid gap-3">
              {["Validate", "Authorize", "Lock row", "Allocate seat", "Queue job", "Deliver proof"].map((step) => (
                <div key={step} className="flex items-center justify-between rounded-lg border border-zinc-100 p-4">
                  <span className="font-semibold">{step}</span>
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-100 text-zinc-950" data-testid="app-shell">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-zinc-950 text-sm font-black text-white">CP</div>
            <div>
              <p className="text-lg font-black leading-tight">CampusPulse</p>
              <p className="text-xs font-medium text-zinc-500">{user.displayName} · {user.role}</p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Button data-testid="role-switch-student" variant={mode === "student" ? "primary" : "secondary"} onClick={() => switchMode("student")}>
              <User className="h-4 w-4" />
              Student
            </Button>
            <Button data-testid="role-switch-organizer" variant={mode === "organizer" ? "primary" : "secondary"} onClick={() => switchMode("organizer")}>
              <LayoutDashboard className="h-4 w-4" />
              Organizer
            </Button>
            <Button data-testid="role-switch-proof" variant={mode === "proof" ? "primary" : "secondary"} onClick={() => switchMode("proof")}>
              <ShieldCheck className="h-4 w-4" />
              Proof
            </Button>
            <Button variant={mode === "terminal" ? "primary" : "secondary"} onClick={() => switchMode("terminal")}>
              <PlaneTakeoff className="h-4 w-4" />
              Terminal
            </Button>
            <Button variant="secondary" onClick={refresh} busy={busy === "refresh"}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1500px] gap-4 overflow-x-hidden px-4 py-4">
        <section className="grid min-w-0 gap-3 md:grid-cols-5">
          <Stat label="Events" value={summary.events} icon={CalendarDays} />
          <Stat label="Confirmed" value={summary.confirmed} icon={Ticket} />
          <Stat label="Waitlist" value={summary.waitlisted} icon={ClipboardList} />
          <Stat label="Pending Jobs" value={summary.pending} icon={Workflow} />
          <Stat label="Sent Jobs" value={summary.sent} icon={CheckCircle2} />
        </section>

        {mode === "student" ? (
          <StudentPortal
            events={filteredEvents}
            selectedEvent={selectedEvent}
            selectedEventId={selectedEvent?.id}
            setSelectedEventId={setSelectedEventId}
            query={query}
            setQuery={setQuery}
            tag={tag}
            setTag={setTag}
            tags={tags}
            registrationByEvent={registrationByEvent}
            registrations={registrations}
            notifications={notifications}
            onRegister={register}
            onCancel={cancelRegistration}
            busy={busy}
          />
        ) : null}

        {mode === "organizer" ? (
          <OrganizerCenter
            events={events}
            selectedEvent={selectedOrgEvent}
            selectedEventId={selectedOrgEvent?.id}
            setSelectedEventId={setSelectedOrgEventId}
            draft={draft}
            setDraft={setDraft}
            onCreateDraft={createDraft}
            onPublish={publish}
            onCancelEvent={cancelEvent}
            roster={roster}
            waitlist={waitlist}
            jobs={jobs}
            busy={busy}
          />
        ) : null}

        {mode === "proof" ? <ProofMode proof={proof} onRunDrill={runDrill} busy={busy} /> : null}

        {mode === "terminal" ? <CampusTerminal events={events} selectedEvent={selectedOrgEvent ?? selectedEvent} /> : null}
      </main>

      <div
        data-testid="toast-status"
        className="mx-auto mb-4 w-[calc(100%-2rem)] max-w-[1500px] rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm"
      >
        {toast}
      </div>
    </div>
  );
}

function StudentPortal({
  events,
  selectedEvent,
  selectedEventId,
  setSelectedEventId,
  query,
  setQuery,
  tag,
  setTag,
  tags,
  registrationByEvent,
  registrations,
  notifications,
  onRegister,
  onCancel,
  busy,
}) {
  const currentRegistration = selectedEvent ? registrationByEvent.get(selectedEvent.id) : null;
  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]" data-testid="student-catalog">
      <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black">Student Event Galaxy</h1>
            <p className="mt-1 text-sm text-zinc-500">Published events only. Seat state comes from the database.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                data-testid="event-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-emerald-700 sm:w-72"
                placeholder="Search events"
              />
            </label>
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {tags.map((item) => (
            <button
              key={item}
              data-testid={`tag-filter-${item.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              onClick={() => setTag(item)}
              className={cx(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold",
                tag === item ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-700",
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {events.map((event) => {
            const registration = registrationByEvent.get(event.id);
            return (
              <article
                key={event.id}
                data-testid={`event-card-${event.id}`}
                className={cx(
                  "rounded-lg border p-4 transition hover:-translate-y-0.5 hover:shadow-md",
                  selectedEventId === event.id ? "border-zinc-950 bg-zinc-50" : "border-zinc-200 bg-white",
                )}
              >
                <button className="block w-full text-left" onClick={() => setSelectedEventId(event.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black leading-tight">{event.title}</h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">{event.description}</p>
                    </div>
                    <Badge status={registration?.status ?? event.status}>{registration?.status ?? event.status}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <span className="rounded-lg bg-zinc-100 p-2 font-semibold">{formatDate(event.startsAt)}</span>
                    <span className="rounded-lg bg-zinc-100 p-2 font-semibold">{event.confirmedCount}/{event.capacity}</span>
                    <span className="rounded-lg bg-zinc-100 p-2 font-semibold">{event.waitlistCount} queued</span>
                  </div>
                </button>
                <div className="mt-4 flex gap-2">
                  {registration ? (
                    <Button
                      data-testid={`event-cancel-${event.id}`}
                      variant="secondary"
                      onClick={() => onCancel(registration.id)}
                      busy={busy === `cancel-${registration.id}`}
                    >
                      Cancel
                    </Button>
                  ) : (
                    <Button
                      data-testid={`event-register-${event.id}`}
                      onClick={() => onRegister(event.id)}
                      busy={busy === `register-${event.id}`}
                    >
                      Register
                    </Button>
                  )}
                  {registration?.status === "WAITLISTED" ? (
                    <span data-testid={`waitlist-position-${event.id}`} className="inline-flex items-center rounded-lg bg-amber-50 px-3 text-sm font-semibold text-amber-800">
                      Position {registration.waitlistSequence}
                    </span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <aside className="grid min-w-0 gap-4">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" data-testid="student-detail">
          <h2 className="text-xl font-black">{selectedEvent?.title ?? "Select an event"}</h2>
          {selectedEvent ? (
            <>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{selectedEvent.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-semibold">
                <span className="rounded-lg bg-zinc-100 p-3">{selectedEvent.locationText ?? "Location pending"}</span>
                <span className="rounded-lg bg-zinc-100 p-3">{selectedEvent.seatsRemaining} seats left</span>
              </div>
              <div className="mt-4 rounded-lg border border-zinc-200 p-4" data-testid="fairseat-ledger">
                <div className="flex items-center justify-between">
                  <h3 className="font-black">FairSeat Ledger</h3>
                  <Gauge className="h-5 w-5 text-emerald-700" />
                </div>
                <div className="mt-4 grid gap-2 text-sm">
                  <div className="flex justify-between"><span>Capacity lock</span><strong>{selectedEvent.capacity}</strong></div>
                  <div className="flex justify-between"><span>Confirmed</span><strong>{selectedEvent.confirmedCount}</strong></div>
                  <div className="flex justify-between"><span>FIFO queue</span><strong>{selectedEvent.waitlistCount}</strong></div>
                  <div className="flex justify-between"><span>Your state</span><strong>{currentRegistration?.status ?? "Not registered"}</strong></div>
                </div>
              </div>
            </>
          ) : null}
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" data-testid="my-registrations">
          <h2 className="text-lg font-black">My Registrations</h2>
          <div className="mt-3 grid gap-2">
            {registrations.length === 0 ? <p className="text-sm text-zinc-500">No registrations yet.</p> : null}
            {registrations.slice(0, 6).map((registration) => (
              <div key={registration.id} className="rounded-lg border border-zinc-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <strong>{registration.event?.title ?? registration.eventId}</strong>
                  <Badge status={registration.status}>{registration.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-zinc-500">{formatDate(registration.event?.startsAt)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" data-testid="notification-feed">
          <h2 className="text-lg font-black">Notification Feed</h2>
          <div className="mt-3 grid gap-2">
            {notifications.length === 0 ? <p className="text-sm text-zinc-500">Run the worker to populate in-app notices.</p> : null}
            {notifications.slice(0, 5).map((notification) => (
              <div key={notification.id} data-testid={`notification-row-${notification.id}`} className="rounded-lg border border-zinc-200 p-3 text-sm">
                <strong>{notification.job?.type}</strong>
                <p className="mt-1 text-zinc-500">{notification.job?.event?.title ?? notification.recipient}</p>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </section>
  );
}

function OrganizerCenter({
  events,
  selectedEvent,
  selectedEventId,
  setSelectedEventId,
  draft,
  setDraft,
  onCreateDraft,
  onPublish,
  onCancelEvent,
  roster,
  waitlist,
  jobs,
  busy,
}) {
  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-[420px_minmax(0,1fr)]" data-testid="organizer-command">
      <div className="grid min-w-0 gap-4">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" data-testid="organizer-event-list">
          <h1 className="text-2xl font-black">Organizer Command Center</h1>
          <div className="mt-4 grid gap-2">
            {events.map((event) => (
              <button
                key={event.id}
                data-testid={`organizer-event-row-${event.id}`}
                onClick={() => setSelectedEventId(event.id)}
                className={cx(
                  "rounded-lg border p-3 text-left transition hover:bg-zinc-50",
                  selectedEventId === event.id ? "border-zinc-950 bg-zinc-50" : "border-zinc-200 bg-white",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <strong>{event.title}</strong>
                  <Badge status={event.status}>{event.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-zinc-500">{event.confirmedCount}/{event.capacity} confirmed · {event.waitlistCount} waitlisted</p>
              </button>
            ))}
          </div>
        </section>

        <form onSubmit={onCreateDraft} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" data-testid="draft-form">
          <h2 className="text-lg font-black">Draft Editor</h2>
          <div className="mt-3 grid gap-3">
            <input className="rounded-lg border border-zinc-200 p-3" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} aria-label="Event title" />
            <textarea className="min-h-24 rounded-lg border border-zinc-200 p-3" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} aria-label="Description" />
            <input className="rounded-lg border border-zinc-200 p-3" type="datetime-local" value={draft.startsAt} onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })} aria-label="Start time" />
            <div className="grid grid-cols-2 gap-2">
              <input className="rounded-lg border border-zinc-200 p-3" type="number" min="1" value={draft.capacity} onChange={(event) => setDraft({ ...draft, capacity: event.target.value })} aria-label="Capacity" />
              <input className="rounded-lg border border-zinc-200 p-3" value={draft.terminal} onChange={(event) => setDraft({ ...draft, terminal: event.target.value })} aria-label="Terminal" />
            </div>
            <input className="rounded-lg border border-zinc-200 p-3" value={draft.locationText} onChange={(event) => setDraft({ ...draft, locationText: event.target.value })} aria-label="Location" />
            <input className="rounded-lg border border-zinc-200 p-3" value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} aria-label="Tags" />
            <Button type="submit" busy={busy === "draft"}>
              <Plus className="h-4 w-4" />
              Create Draft
            </Button>
          </div>
        </form>
      </div>

      <div className="grid min-w-0 gap-4">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">{selectedEvent?.title ?? "Select an event"}</h2>
              <p className="mt-1 text-sm text-zinc-500">{selectedEvent ? formatDate(selectedEvent.startsAt) : null}</p>
            </div>
            {selectedEvent ? (
              <div className="flex flex-wrap gap-2">
                <Button data-testid="publish-event" disabled={selectedEvent.status !== "DRAFT"} onClick={() => onPublish(selectedEvent.id)} busy={busy === `publish-${selectedEvent.id}`}>
                  Publish
                </Button>
                <Button data-testid="cancel-event" variant="danger" disabled={selectedEvent.status === "CANCELLED"} onClick={() => onCancelEvent(selectedEvent.id)} busy={busy === `cancel-event-${selectedEvent.id}`}>
                  Cancel Event
                </Button>
              </div>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3" data-testid="publish-checklist">
            {[
              ["Capacity set", selectedEvent?.capacity >= 1],
              ["Future start", selectedEvent ? new Date(selectedEvent.startsAt) > new Date() : false],
              ["Delivery queue ready", true],
            ].map(([label, ok]) => (
              <div key={label} className="rounded-lg border border-zinc-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{label}</span>
                  {ok ? <CheckCircle2 className="h-5 w-5 text-emerald-700" /> : <XCircle className="h-5 w-5 text-rose-700" />}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" data-testid="organizer-tab-confirmed">
            <h3 className="text-lg font-black">Confirmed Roster</h3>
            <div className="mt-3 grid gap-2">
              {roster.length === 0 ? <p className="text-sm text-zinc-500">No confirmed students yet.</p> : null}
              {roster.map((registration) => (
                <div key={registration.id} data-testid={`confirmed-row-${registration.id}`} className="rounded-lg border border-zinc-200 p-3">
                  <strong>{registration.user?.displayName}</strong>
                  <p className="text-sm text-zinc-500">{registration.user?.email}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" data-testid="organizer-tab-waitlist">
            <h3 className="text-lg font-black">FIFO Waitlist</h3>
            <div className="mt-3 grid gap-2">
              {waitlist.length === 0 ? <p className="text-sm text-zinc-500">Queue is clear.</p> : null}
              {waitlist.map((registration) => (
                <div key={registration.id} data-testid={`waitlist-row-${registration.id}`} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3">
                  <div>
                    <strong>{registration.user?.displayName}</strong>
                    <p className="text-sm text-zinc-500">{registration.user?.email}</p>
                  </div>
                  <span className="font-mono text-xl font-black">{registration.waitlistSequence}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" data-testid="organizer-tab-notifications">
            <h3 className="text-lg font-black">Queue Operations</h3>
            <div className="mt-3 grid gap-2">
              {jobs.slice(0, 8).map((job) => (
                <div key={job.id} data-testid={`job-row-${job.id}`} className="rounded-lg border border-zinc-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <strong>{job.type}</strong>
                    <Badge status={job.status}>{job.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">{job.event?.title ?? job.eventId} · attempts {job.attempts}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" data-testid="organizer-tab-preview">
            <h3 className="text-lg font-black">Student Preview</h3>
            <div className="mt-3 rounded-[2rem] border-8 border-zinc-950 bg-zinc-950 p-2">
              <div className="rounded-[1.4rem] bg-white p-4">
                <p className="text-xs font-semibold text-emerald-700">CampusPulse</p>
                <h4 className="mt-2 text-lg font-black">{selectedEvent?.title}</h4>
                <p className="mt-2 text-sm text-zinc-600">{selectedEvent?.description}</p>
                <div className="mt-4 rounded-lg bg-zinc-100 p-3 text-sm font-semibold">{selectedEvent?.confirmedCount}/{selectedEvent?.capacity} confirmed</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function ProofMode({ proof, onRunDrill, busy }) {
  const checks = proof?.checks ?? {};
  const latestDrill = proof?.drillResults?.[0];
  return (
    <section className="grid min-w-0 gap-4" data-testid="proof-mode">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">Judge Proof Mode</h1>
            <p className="mt-1 text-sm text-zinc-500">Evidence is read from database rows, worker heartbeats, jobs, and deliveries.</p>
          </div>
          <Button data-testid="proof-concurrency-result" onClick={onRunDrill} busy={busy === "drill"}>
            <Sparkles className="h-4 w-4" />
            Run Concurrency Drill
          </Button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {Object.entries(checks).map(([key, value]) => (
            <div key={key} data-testid={`proof-check-${key}`} className="rounded-lg border border-zinc-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{key.replace(/([A-Z])/g, " $1")}</span>
                {value ? <CheckCircle2 className="h-5 w-5 text-emerald-700" /> : <XCircle className="h-5 w-5 text-rose-700" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-3">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" data-testid="proof-domain-events">
          <h2 className="text-lg font-black">Domain Events</h2>
          <div className="mt-3 grid gap-2">
            {(proof?.domainEvents ?? []).slice(0, 8).map((event) => (
              <div key={event.id} className="rounded-lg border border-zinc-200 p-3 text-sm">
                <strong>{event.type}</strong>
                <p className="text-zinc-500">{formatDate(event.occurredAt)}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" data-testid="proof-jobs">
          <h2 className="text-lg font-black">Jobs</h2>
          <div className="mt-3 grid gap-2">
            {(proof?.jobs ?? []).slice(0, 8).map((job) => (
              <div key={job.id} className="rounded-lg border border-zinc-200 p-3 text-sm">
                <div className="flex items-center justify-between"><strong>{job.type}</strong><Badge status={job.status}>{job.status}</Badge></div>
                <p className="mt-1 text-zinc-500">{job.deliveries.length} deliveries</p>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" data-testid="proof-worker-status">
          <h2 className="text-lg font-black">Worker Status</h2>
          <div className="mt-3 rounded-lg bg-zinc-950 p-4 font-mono text-sm text-zinc-100">
            <p>sent_jobs={proof?.queueSummary?.sentJobs ?? 0}</p>
            <p>pending_jobs={proof?.queueSummary?.pendingJobs ?? 0}</p>
            <p>failed_jobs={proof?.queueSummary?.failedJobs ?? 0}</p>
            <p>heartbeat={proof?.heartbeats?.[0]?.status ?? "missing"}</p>
          </div>
          {latestDrill ? (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
              <strong>{latestDrill.label}</strong>
              <p className="mt-1">capacity {latestDrill.capacity}, attempts {latestDrill.attempts}, confirmed {latestDrill.confirmed}, waitlisted {latestDrill.waitlisted}, overbooked {latestDrill.overbooked}</p>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}

function CampusTerminal({ events, selectedEvent }) {
  const terminals = useMemo(() => {
    const map = new Map();
    for (const event of events) {
      const key = event.terminal ?? "Campus";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    }
    return Array.from(map.entries());
  }, [events]);

  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]" data-testid="campus-terminal">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-zinc-100 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">Campus Terminal</h1>
            <p className="mt-1 text-sm text-zinc-400">Events behave like departures: gates, capacity, standby, and dispatch state.</p>
          </div>
          <Activity className="h-6 w-6 text-emerald-400" />
        </div>
        <div className="mt-5 grid gap-4">
          {terminals.map(([terminal, terminalEvents]) => (
            <div key={terminal} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-black">{terminal} Terminal</h2>
                <span className="font-mono text-sm text-emerald-300">{terminalEvents.length} departures</span>
              </div>
              <div className="mt-3 grid gap-2">
                {terminalEvents.map((event) => (
                  <div key={event.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg bg-zinc-950 p-3 text-sm">
                    <div>
                      <strong>{event.title}</strong>
                      <p className="text-zinc-400">{formatDate(event.startsAt)} · {event.locationText}</p>
                    </div>
                    <span className="font-mono">{event.confirmedCount}/{event.capacity}</span>
                    <Badge status={event.status}>{event.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-black">Boarding Pass</h2>
        <div className="mt-4 rounded-lg border-2 border-dashed border-zinc-300 p-4">
          <p className="text-xs font-semibold text-emerald-700">PASSENGER</p>
          <p className="text-2xl font-black">Campus Student</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-zinc-500">Event</span><strong className="block">{selectedEvent?.title ?? "Select event"}</strong></div>
            <div><span className="text-zinc-500">Gate</span><strong className="block">{selectedEvent?.terminal ?? "Campus"}</strong></div>
            <div><span className="text-zinc-500">Standby</span><strong className="block">{selectedEvent?.waitlistCount ?? 0}</strong></div>
            <div><span className="text-zinc-500">Seats</span><strong className="block">{selectedEvent?.confirmedCount ?? 0}/{selectedEvent?.capacity ?? 0}</strong></div>
          </div>
        </div>
      </aside>
    </section>
  );
}
