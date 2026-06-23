"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  Calendar,
  Check,
  CheckCircle,
  ClipboardList,
  Clock,
  Eye,
  Filter,
  Inbox,
  Mail,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Ticket,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  cancelRegistration,
  checkedInHistory,
  createDraftEvent,
  createInitialState,
  draftSeed,
  enrichEvents,
  formatEventDate,
  formatTimeOnly,
  getActionState,
  getActiveRegistration,
  getPublishChecklist,
  getStudent,
  getWaitlistBadge,
  getWaitlistPosition,
  organizer,
  publishEvent,
  registerForEvent,
  runWorker,
  scoreRecommendation,
  students,
  tagOptions,
} from "@/lib/campuspulse";

const visibleStudentStatuses = ["CONFIRMED", "WAITLISTED", "CANCELLED_BY_USER", "CHECKED_IN"];
const orgTabs = ["Details", "Confirmed", "Waitlist", "Notifications", "Analytics", "Preview"];

export default function CampusPulseApp() {
  const [state, setState] = useState(() => createInitialState());
  const [role, setRole] = useState("student");
  const [studentId, setStudentId] = useState("maya");
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [selectedEventId, setSelectedEventId] = useState("evt-ai");
  const [selectedOrgEventId, setSelectedOrgEventId] = useState("evt-ai");
  const [orgTab, setOrgTab] = useState("Details");
  const [draft, setDraft] = useState(() => draftSeed());
  const [toast, setToast] = useState("Worker ready");

  const events = useMemo(() => enrichEvents(state.events, state.registrations), [state.events, state.registrations]);
  const publishedEvents = events.filter((event) => ["PUBLISHED", "CLOSED", "CANCELLED"].includes(event.status));
  const selectedStudent = getStudent(studentId);
  const filteredEvents = useMemo(
    () =>
      publishedEvents.filter((event) => {
        const matchesQuery = `${event.title} ${event.description} ${event.locationText} ${event.tags.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesTag = activeTag === "All" || event.tags.includes(activeTag);
        return matchesQuery && matchesTag;
      }),
    [activeTag, publishedEvents, query],
  );

  const selectedEvent =
    publishedEvents.find((event) => event.id === selectedEventId) ?? filteredEvents[0] ?? publishedEvents[0] ?? events[0];
  const selectedOrgEvent = events.find((event) => event.id === selectedOrgEventId) ?? events[0];
  const currentRegistration = selectedEvent
    ? getActiveRegistration(state.registrations, selectedEvent.id, studentId)
    : null;

  const summary = useMemo(() => {
    const confirmed = state.registrations.filter((registration) =>
      ["CONFIRMED", "CHECKED_IN"].includes(registration.status),
    ).length;
    return {
      published: publishedEvents.filter((event) => event.status === "PUBLISHED").length,
      confirmed,
      waitlist: state.registrations.filter((registration) => registration.status === "WAITLISTED").length,
      pendingJobs: state.jobs.filter((job) => job.status === "PENDING").length,
      failedJobs: state.jobs.filter((job) => job.status === "FAILED").length,
    };
  }, [publishedEvents, state.jobs, state.registrations]);

  function commitResult(result) {
    setState(result.state);
    setToast(result.message);
  }

  function handleRegister(eventId = selectedEvent.id) {
    const result = registerForEvent(state, eventId, studentId);
    commitResult(result);
  }

  function handleCancel(eventId = selectedEvent.id) {
    const result = cancelRegistration(state, eventId, studentId);
    commitResult(result);
  }

  function handleRunWorker() {
    commitResult(runWorker(state));
  }

  function handlePublish(eventId = selectedOrgEvent.id) {
    const result = publishEvent(state, eventId);
    commitResult(result);
  }

  function handleCreateDraft() {
    const result = createDraftEvent(state, draft);
    setState(result.state);
    setSelectedOrgEventId(result.event.id);
    setSelectedEventId(result.event.id);
    setDraft(draftSeed());
    setToast(result.message);
  }

  function resetDemo() {
    setState(createInitialState());
    setSelectedEventId("evt-ai");
    setSelectedOrgEventId("evt-ai");
    setStudentId("maya");
    setActiveTag("All");
    setQuery("");
    setToast("Demo reset");
  }

  return (
    <div className="app-shell">
      <motion.header
        className="topbar"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            CP
          </div>
          <div>
            <h1>CampusPulse</h1>
            <p>Event Galaxy and command center</p>
          </div>
        </div>

        <div className="topbar-actions">
          <SegmentedControl
            value={role}
            onChange={setRole}
            options={[
              { value: "student", label: "Student", icon: User },
              { value: "organizer", label: "Organizer", icon: ShieldCheck },
            ]}
            ariaLabel="Role view"
          />
          <IconTextButton onClick={handleRunWorker} icon={Send}>
            Run worker
          </IconTextButton>
          <IconButton onClick={resetDemo} icon={RefreshCw} label="Reset demo" />
        </div>
      </motion.header>

      <section className="metric-strip" aria-label="CampusPulse system summary">
        <Metric label="Published" value={summary.published} icon={Rocket} />
        <Metric label="Confirmed" value={summary.confirmed} icon={CheckCircle} />
        <Metric label="Waitlist" value={summary.waitlist} icon={ClipboardList} />
        <Metric label="Pending jobs" value={summary.pendingJobs} icon={Clock} />
        <Metric label="Failed jobs" value={summary.failedJobs} icon={AlertCircle} tone="danger" />
      </section>

      <AnimatePresence mode="wait">
        {role === "student" ? (
          <motion.main
            key="student"
            className="workspace student-workspace"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.25 }}
          >
            <StudentControls
              selectedStudent={selectedStudent}
              studentId={studentId}
              setStudentId={setStudentId}
              query={query}
              setQuery={setQuery}
              activeTag={activeTag}
              setActiveTag={setActiveTag}
            />

            <section className="event-galaxy" aria-label="Published events">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Event Galaxy</span>
                  <h2>Published events</h2>
                </div>
                <span className="result-count">{filteredEvents.length} visible</span>
              </div>

              <LayoutGroup>
                <div className="event-grid">
                  <AnimatePresence initial={false}>
                    {filteredEvents.map((event) => {
                      const registration = getActiveRegistration(state.registrations, event.id, studentId);
                      const action = getActionState(event, registration, state.registrations);
                      const recommendation = scoreRecommendation(event, selectedStudent, registration);

                      return (
                        <EventCard
                          key={event.id}
                          event={event}
                          active={selectedEvent?.id === event.id}
                          action={action}
                          registration={registration}
                          recommendation={recommendation}
                          onSelect={() => setSelectedEventId(event.id)}
                          onRegister={() => handleRegister(event.id)}
                          onCancel={() => handleCancel(event.id)}
                        />
                      );
                    })}
                  </AnimatePresence>
                </div>
              </LayoutGroup>

              {filteredEvents.length === 0 ? (
                <div className="empty-state">
                  <Search size={22} />
                  <p>No events match the current filters.</p>
                </div>
              ) : null}
            </section>

            <StudentDetailPanel
              event={selectedEvent}
              state={state}
              student={selectedStudent}
              registration={currentRegistration}
              onRegister={() => handleRegister(selectedEvent.id)}
              onCancel={() => handleCancel(selectedEvent.id)}
            />
          </motion.main>
        ) : (
          <motion.main
            key="organizer"
            className="workspace organizer-workspace"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.25 }}
          >
            <OrganizerCommandCenter
              events={events}
              state={state}
              selectedEvent={selectedOrgEvent}
              selectedEventId={selectedOrgEventId}
              setSelectedEventId={setSelectedOrgEventId}
              activeTab={orgTab}
              setActiveTab={setOrgTab}
              onPublish={() => handlePublish(selectedOrgEvent.id)}
              onRunWorker={handleRunWorker}
              draft={draft}
              setDraft={setDraft}
              onCreateDraft={handleCreateDraft}
            />
          </motion.main>
        )}
      </AnimatePresence>

      <motion.div
        className="toast"
        role="status"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <Zap size={16} />
        {toast}
      </motion.div>
    </div>
  );
}

function StudentControls({
  selectedStudent,
  studentId,
  setStudentId,
  query,
  setQuery,
  activeTag,
  setActiveTag,
}) {
  return (
    <aside className="control-panel" aria-label="Student controls">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Student</span>
          <h2>{selectedStudent.name}</h2>
        </div>
        <Bell size={20} />
      </div>

      <label className="field-label" htmlFor="student-select">
        Active account
      </label>
      <select
        id="student-select"
        className="input-control"
        value={studentId}
        onChange={(event) => setStudentId(event.target.value)}
      >
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.name}
          </option>
        ))}
      </select>

      <label className="field-label" htmlFor="event-search">
        Search
      </label>
      <div className="search-box">
        <Search size={18} />
        <input
          id="event-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Event, tag, venue"
        />
      </div>

      <div className="filter-block">
        <div className="filter-title">
          <Filter size={16} />
          Tags
        </div>
        <div className="tag-grid">
          {["All", ...tagOptions.map((tag) => tag.label)].map((tag) => (
            <motion.button
              type="button"
              className={activeTag === tag ? "tag-chip active" : "tag-chip"}
              key={tag}
              onClick={() => setActiveTag(tag)}
              whileTap={{ scale: 0.97 }}
            >
              {tag}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="preference-block">
        <span className="eyebrow">Preference match</span>
        <div className="mini-chip-row">
          {selectedStudent.preferredTags.map((tag) => (
            <span className="mini-chip" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}

function EventCard({ event, active, action, registration, recommendation, onSelect, onRegister, onCancel }) {
  const actionIcon = action.action === "register" ? Ticket : action.action === "cancel" ? X : Check;
  const ActionIcon = actionIcon;

  function handlePrimary(eventObject) {
    eventObject.stopPropagation();
    if (action.action === "register") onRegister();
    if (action.action === "cancel") onCancel();
  }

  return (
    <motion.article
      layout
      className={active ? "event-card active" : "event-card"}
      onClick={onSelect}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.28 }}
    >
      <div className="cover-wrap">
        <img src={event.coverImage} alt={`Cover art for ${event.title}`} />
        <div className="cover-status">
          <WaitlistBadge event={event} />
        </div>
      </div>

      <div className="event-card-body">
        <div className="card-title-row">
          <div>
            <div className="tag-line">
              {event.tags.map((tag) => (
                <span className="tag-dot" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
            <h3>{event.title}</h3>
          </div>
          <PulseCapacityRing event={event} size={76} />
        </div>

        <div className="event-meta">
          <span>
            <Calendar size={15} />
            {formatEventDate(event.startsAt)}
          </span>
          <span>
            <Users size={15} />
            {event.confirmedCount}/{event.capacity} seats
          </span>
        </div>

        <div className="pulse-row">
          <span className="pulse-pill" style={{ "--score": event.pulse.score }}>
            <Activity size={14} />
            {event.pulse.label}
          </span>
          {registration?.status === "WAITLISTED" ? (
            <span className="position-pill">Position #{registration.waitlistSequence}</span>
          ) : null}
        </div>

        {recommendation?.reasons.length ? (
          <p className="recommendation">
            <Sparkles size={14} />
            {recommendation.reasons.slice(0, 2).join(" + ")}
          </p>
        ) : null}

        <motion.button
          type="button"
          className={action.action === "cancel" ? "card-action cancel" : "card-action"}
          disabled={action.disabled}
          onClick={handlePrimary}
          whileTap={{ scale: action.disabled ? 1 : 0.98 }}
        >
          <ActionIcon size={17} />
          {action.action === "cancel" ? "Cancel registration" : action.label}
        </motion.button>
      </div>
    </motion.article>
  );
}

function StudentDetailPanel({ event, state, student, registration, onRegister, onCancel }) {
  const action = getActionState(event, registration, state.registrations);
  const notifications = state.notifications
    .filter((notification) => notification.userId === student.id)
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const studentRegistrations = state.registrations
    .filter((item) => item.studentId === student.id && visibleStudentStatuses.includes(item.status))
    .map((item) => ({ ...item, event: state.events.find((eventItem) => eventItem.id === item.eventId) }))
    .filter((item) => item.event);

  return (
    <aside className="detail-panel" aria-label="Student detail">
      <section className="detail-section selected-event-section">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Selected event</span>
            <h2>{event.title}</h2>
          </div>
          <Eye size={20} />
        </div>
        <p className="event-description">{event.description}</p>
        <div className="detail-facts">
          <span>
            <Calendar size={15} />
            {formatEventDate(event.startsAt)}
          </span>
          <span>
            <Clock size={15} />
            Ends {formatTimeOnly(event.endsAt)}
          </span>
          <span>
            <Ticket size={15} />
            {event.seatsOpen} seats open
          </span>
        </div>

        <div className="detail-action-row">
          {action.action === "register" ? (
            <IconTextButton onClick={onRegister} icon={Ticket}>
              {action.label}
            </IconTextButton>
          ) : action.action === "cancel" ? (
            <IconTextButton onClick={onCancel} icon={X} variant="secondary">
              Cancel registration
            </IconTextButton>
          ) : (
            <span className="disabled-action">{action.label}</span>
          )}
          <span className="status-note">
            {registration?.status === "WAITLISTED"
              ? `FIFO position #${getWaitlistPosition(state.registrations, event.id, registration.id)}`
              : registration?.status ?? event.status}
          </span>
        </div>
      </section>

      <section className="detail-section">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">My Pulse</span>
            <h2>Registrations</h2>
          </div>
          <ClipboardList size={20} />
        </div>
        <div className="registration-list">
          {studentRegistrations.map((item) => (
            <div className="registration-row" key={item.id}>
              <span className={`status-dot ${item.status.toLowerCase()}`} />
              <div>
                <strong>{item.event.title}</strong>
                <span>{item.status.replaceAll("_", " ")}</span>
              </div>
            </div>
          ))}
          {studentRegistrations.length === 0 ? <p className="muted">No registrations yet.</p> : null}
        </div>
      </section>

      <FairSeatTimeline
        transitions={state.transitions.filter(
          (transition) => transition.eventId === event.id && transition.studentId === student.id,
        )}
      />

      <section className="detail-section">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Notifications</span>
            <h2>In-app feed</h2>
          </div>
          <Inbox size={20} />
        </div>
        <div className="notification-feed">
          {notifications.map((notification) => (
            <div className={notification.read ? "notification read" : "notification"} key={notification.id}>
              <Mail size={16} />
              <div>
                <strong>{notification.title}</strong>
                <span>{notification.body}</span>
              </div>
            </div>
          ))}
          {notifications.length === 0 ? <p className="muted">No notifications yet.</p> : null}
        </div>
      </section>

      <CampusPassport student={student} />
    </aside>
  );
}

function CampusPassport({ student }) {
  const badges = checkedInHistory.filter((badge) => badge.studentId === student.id);
  const derivedBadges = badges.length ? badges : student.preferredTags.slice(0, 2).map((tag) => ({ id: tag, tag, label: tag }));

  return (
    <section className="detail-section">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">Campus Passport</span>
          <h2>Badges</h2>
        </div>
        <CheckCircle size={20} />
      </div>
      <div className="passport-grid">
        {derivedBadges.map((badge) => (
          <div className="passport-badge" key={badge.id}>
            <Check size={15} />
            <span>{badge.tag}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FairSeatTimeline({ transitions }) {
  const ordered = transitions.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <section className="detail-section">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">FairSeat Ledger</span>
          <h2>Timeline</h2>
        </div>
        <ShieldCheck size={20} />
      </div>
      <div className="timeline">
        {ordered.map((transition) => (
          <div className="timeline-item" key={transition.id}>
            <span>{formatTimeOnly(transition.createdAt)}</span>
            <p>{transition.label}</p>
          </div>
        ))}
        {ordered.length === 0 ? <p className="muted">No ledger entries for this event yet.</p> : null}
      </div>
    </section>
  );
}

function OrganizerCommandCenter({
  events,
  state,
  selectedEvent,
  selectedEventId,
  setSelectedEventId,
  activeTab,
  setActiveTab,
  onPublish,
  onRunWorker,
  draft,
  setDraft,
  onCreateDraft,
}) {
  const eventRegistrations = state.registrations.filter((registration) => registration.eventId === selectedEvent.id);
  const confirmed = eventRegistrations.filter((registration) => ["CONFIRMED", "CHECKED_IN"].includes(registration.status));
  const waitlist = eventRegistrations
    .filter((registration) => registration.status === "WAITLISTED")
    .sort((a, b) => a.waitlistSequence - b.waitlistSequence);
  const jobs = state.jobs.filter((job) => job.eventId === selectedEvent.id);
  const failedJobs = jobs.filter((job) => job.status === "FAILED");
  const checklist = getPublishChecklist(selectedEvent);

  return (
    <>
      <aside className="control-panel organizer-rail" aria-label="Organizer events">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Organizer</span>
            <h2>{organizer.name}</h2>
          </div>
          <ShieldCheck size={20} />
        </div>

        <div className="event-selector">
          {events.map((event) => (
            <motion.button
              type="button"
              key={event.id}
              className={event.id === selectedEventId ? "selector-row active" : "selector-row"}
              onClick={() => setSelectedEventId(event.id)}
              whileTap={{ scale: 0.98 }}
            >
              <span>{event.title}</span>
              <em>{event.status}</em>
            </motion.button>
          ))}
        </div>
      </aside>

      <section className="command-center" aria-label="Organizer command center">
        <div className="command-header">
          <div>
            <span className="eyebrow">Command Center</span>
            <h2>{selectedEvent.title}</h2>
            <p>{selectedEvent.locationText} - {formatEventDate(selectedEvent.startsAt)}</p>
          </div>
          <div className="command-actions">
            {selectedEvent.status === "DRAFT" ? (
              <IconTextButton onClick={onPublish} icon={Rocket}>
                Publish
              </IconTextButton>
            ) : null}
            <IconTextButton onClick={onRunWorker} icon={Send} variant="secondary">
              Process jobs
            </IconTextButton>
          </div>
        </div>

        <div className="command-metrics">
          <Metric label="Confirmed" value={`${confirmed.length}/${selectedEvent.capacity}`} icon={Users} />
          <Metric label="Waitlist" value={waitlist.length} icon={ClipboardList} />
          <Metric label="Sent jobs" value={jobs.filter((job) => job.status === "SENT").length} icon={Send} />
          <Metric label="Failed jobs" value={failedJobs.length} icon={AlertCircle} tone="danger" />
          <Metric label="Views" value={selectedEvent.viewCount} icon={Eye} />
        </div>

        {failedJobs.length ? (
          <div className="warning-strip" role="alert">
            <AlertCircle size={18} />
            {failedJobs.length} failed notification job needs review.
          </div>
        ) : null}

        <div className="tab-list" role="tablist" aria-label="Organizer sections">
          {orgTabs.map((tab) => (
            <motion.button
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={activeTab === tab ? "tab-button active" : "tab-button"}
              key={tab}
              onClick={() => setActiveTab(tab)}
              whileTap={{ scale: 0.98 }}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            className="tab-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
          >
            {activeTab === "Details" ? (
              <DetailsTab
                event={selectedEvent}
                checklist={checklist}
                draft={draft}
                setDraft={setDraft}
                onCreateDraft={onCreateDraft}
              />
            ) : null}
            {activeTab === "Confirmed" ? <RosterList registrations={confirmed} label="Confirmed students" /> : null}
            {activeTab === "Waitlist" ? <WaitlistList registrations={waitlist} /> : null}
            {activeTab === "Notifications" ? <OrganizerJobConsole jobs={jobs} deliveries={state.deliveries} /> : null}
            {activeTab === "Analytics" ? (
              <AnalyticsPanel event={selectedEvent} confirmed={confirmed} waitlist={waitlist} jobs={jobs} />
            ) : null}
            {activeTab === "Preview" ? <StudentPreviewFrame event={selectedEvent} /> : null}
          </motion.div>
        </AnimatePresence>
      </section>
    </>
  );
}

function DetailsTab({ event, checklist, draft, setDraft, onCreateDraft }) {
  const draftChecklist = getPublishChecklist(draft);
  const canCreate = Object.values(draftChecklist).every(Boolean) && draft.tags.length > 0;

  return (
    <div className="details-grid">
      <section className="framed-tool">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Publish checklist</span>
            <h3>{event.status}</h3>
          </div>
          <ListStatus complete={Object.values(checklist).every(Boolean)} />
        </div>
        <div className="checklist">
          {Object.entries(checklist).map(([key, complete]) => (
            <div className={complete ? "check-row complete" : "check-row"} key={key}>
              <Check size={16} />
              <span>{labelForChecklist(key)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="framed-tool">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">New Event</span>
            <h3>Create draft</h3>
          </div>
          <Plus size={20} />
        </div>
        <div className="draft-form">
          <label>
            Title
            <input
              value={draft.title}
              onChange={(eventObject) => setDraft({ ...draft, title: eventObject.target.value })}
            />
          </label>
          <label>
            Description
            <textarea
              rows={3}
              value={draft.description}
              onChange={(eventObject) => setDraft({ ...draft, description: eventObject.target.value })}
            />
          </label>
          <div className="two-column-fields">
            <label>
              Capacity
              <input
                type="number"
                min="1"
                value={draft.capacity}
                onChange={(eventObject) => setDraft({ ...draft, capacity: eventObject.target.value })}
              />
            </label>
            <label>
              Location
              <input
                value={draft.locationText}
                onChange={(eventObject) => setDraft({ ...draft, locationText: eventObject.target.value })}
              />
            </label>
          </div>
          <label>
            Starts
            <input
              value={draft.startsAt}
              onChange={(eventObject) => setDraft({ ...draft, startsAt: eventObject.target.value })}
            />
          </label>
          <div className="mini-chip-row selectable">
            {tagOptions.slice(0, 6).map((tag) => {
              const active = draft.tags.includes(tag.label);
              return (
                <button
                  type="button"
                  className={active ? "mini-chip active" : "mini-chip"}
                  key={tag.label}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      tags: active
                        ? draft.tags.filter((item) => item !== tag.label)
                        : [...draft.tags, tag.label],
                    })
                  }
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
          <IconTextButton onClick={onCreateDraft} icon={Plus} disabled={!canCreate}>
            Create draft
          </IconTextButton>
        </div>
      </section>
    </div>
  );
}

function RosterList({ registrations, label }) {
  return (
    <section className="framed-tool">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">{label}</span>
          <h3>{registrations.length} students</h3>
        </div>
        <Users size={20} />
      </div>
      <div className="roster-table">
        {registrations.map((registration) => {
          const student = getStudent(registration.studentId);
          return (
            <div className="roster-row" key={registration.id}>
              <span>{student.name}</span>
              <em>{student.email}</em>
              <strong>{registration.status.replaceAll("_", " ")}</strong>
            </div>
          );
        })}
        {registrations.length === 0 ? <p className="muted">No rows yet.</p> : null}
      </div>
    </section>
  );
}

function WaitlistList({ registrations }) {
  return (
    <section className="framed-tool">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">FIFO waitlist</span>
          <h3>{registrations.length} active</h3>
        </div>
        <ClipboardList size={20} />
      </div>
      <div className="waitlist-table">
        {registrations.map((registration, index) => {
          const student = getStudent(registration.studentId);
          return (
            <div className="waitlist-row" key={registration.id}>
              <strong>#{index + 1}</strong>
              <span>{student.name}</span>
              <em>sequence {registration.waitlistSequence}</em>
            </div>
          );
        })}
        {registrations.length === 0 ? <p className="muted">The waitlist is empty.</p> : null}
      </div>
    </section>
  );
}

function OrganizerJobConsole({ jobs, deliveries }) {
  return (
    <section className="framed-tool">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">Notification jobs</span>
          <h3>{jobs.length} jobs</h3>
        </div>
        <Send size={20} />
      </div>
      <div className="job-console">
        {jobs.map((job) => {
          const delivery = deliveries.find((item) => item.jobId === job.id);
          return (
            <div className={`job-row ${job.status.toLowerCase()}`} key={job.id}>
              <span>{job.status}</span>
              <em>{job.channel}</em>
              <strong>{job.type}</strong>
              <small>attempts {job.attempts}</small>
              <small>{delivery ? delivery.provider : job.lastError || "queued"}</small>
            </div>
          );
        })}
        {jobs.length === 0 ? <p className="muted">No notification jobs for this event.</p> : null}
      </div>
    </section>
  );
}

function AnalyticsPanel({ event, confirmed, waitlist, jobs }) {
  const sentJobs = jobs.filter((job) => job.status === "SENT").length;
  const rows = [
    { label: "Views", value: event.viewCount, max: Math.max(event.viewCount, 1), color: "#00a7e1" },
    { label: "Confirmed", value: confirmed.length, max: event.capacity, color: "#19a974" },
    { label: "Waitlist", value: waitlist.length, max: Math.max(waitlist.length, 1), color: "#ff9f1c" },
    { label: "Sent jobs", value: sentJobs, max: Math.max(jobs.length, 1), color: "#ec5f67" },
  ];

  return (
    <section className="framed-tool">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">Analytics</span>
          <h3>PulseScore {event.pulse.score}</h3>
        </div>
        <BarChart3 size={20} />
      </div>
      <div className="analytics-bars">
        {rows.map((row) => (
          <div className="analytics-row" key={row.label}>
            <span>{row.label}</span>
            <div className="bar-track">
              <motion.div
                className="bar-fill"
                style={{ background: row.color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((row.value / row.max) * 100, 100)}%` }}
              />
            </div>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function StudentPreviewFrame({ event }) {
  return (
    <section className="preview-frame">
      <div className="phone-frame">
        <img src={event.coverImage} alt={`Preview cover for ${event.title}`} />
        <div className="phone-content">
          <span className="eyebrow">{event.status}</span>
          <h3>{event.title}</h3>
          <p>{event.description}</p>
          <div className="detail-facts">
            <span>
              <Calendar size={15} />
              {formatEventDate(event.startsAt)}
            </span>
            <span>
              <Ticket size={15} />
              {event.confirmedCount}/{event.capacity}
            </span>
          </div>
          <button type="button" className="card-action" disabled>
            <Ticket size={17} />
            {event.status === "PUBLISHED" ? "Register" : "Preview only"}
          </button>
        </div>
      </div>
    </section>
  );
}

function PulseCapacityRing({ event, size = 86 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = event.capacity === 0 ? 1 : Math.min(event.confirmedCount / event.capacity, 1);
  const dashOffset = circumference * (1 - ratio);

  return (
    <div className="capacity-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} className="ring-track" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="ring-progress"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <span>
        {event.confirmedCount}
        <em>/{event.capacity}</em>
      </span>
    </div>
  );
}

function WaitlistBadge({ event }) {
  const label = getWaitlistBadge(event);
  return <span className={`waitlist-badge ${label.toLowerCase().replaceAll(" ", "-")}`}>{label}</span>;
}

function Metric({ label, value, icon: Icon, tone = "default" }) {
  return (
    <div className={`metric ${tone}`}>
      <Icon size={19} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SegmentedControl({ value, onChange, options, ariaLabel }) {
  return (
    <div className="segmented" aria-label={ariaLabel}>
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <motion.button
            type="button"
            key={option.value}
            className={value === option.value ? "active" : ""}
            onClick={() => onChange(option.value)}
            whileTap={{ scale: 0.98 }}
          >
            <Icon size={16} />
            {option.label}
          </motion.button>
        );
      })}
    </div>
  );
}

function IconTextButton({ children, icon: Icon, onClick, variant = "primary", disabled = false }) {
  return (
    <motion.button
      type="button"
      className={`icon-text-button ${variant}`}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      <Icon size={17} />
      {children}
    </motion.button>
  );
}

function IconButton({ icon: Icon, label, onClick }) {
  return (
    <motion.button type="button" className="icon-button" onClick={onClick} aria-label={label} whileTap={{ scale: 0.95 }}>
      <Icon size={18} />
    </motion.button>
  );
}

function ListStatus({ complete }) {
  return complete ? <CheckCircle className="list-status good" size={20} /> : <AlertCircle className="list-status" size={20} />;
}

function labelForChecklist(key) {
  const labels = {
    title: "Title valid",
    description: "Description valid",
    time: "Time valid",
    capacity: "Capacity valid",
    location: "Location or URL set",
  };

  return labels[key] ?? key;
}
