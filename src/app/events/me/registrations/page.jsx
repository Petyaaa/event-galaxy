"use client";

import { useEffect, useState } from "react";

import EventCard from "../../../components/events/EventCard";
import Loading from "../../../components/ui/Loading";
import EmptyState from "../../../components/ui/EmptyState";

export default function MyRegistrationsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRegistrations();
  }, []);

  async function loadRegistrations() {
    try {
      setLoading(true);

      // TODO:
      // const res = await fetch("http://localhost:3001/users/me/registrations", {
      //   credentials: "include",
      // });
      //
      // const data = await res.json();
      // setEvents(data);

      // Mock данни докато backend не е свързан
      setEvents([
        {
          id: 1,
          title: "AI Workshop",
          description: "Introduction to Artificial Intelligence",
          tags: ["AI", "Workshop"],
          confirmedCount: 18,
          capacity: 25,
        },
        {
          id: 2,
          title: "Career Day",
          description: "Meet leading tech companies.",
          tags: ["Career"],
          confirmedCount: 42,
          capacity: 50,
        },
      ]);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Loading text="Loading your registrations..." />;
  }

  if (events.length === 0) {
    return (
      <EmptyState
        title="No registrations yet"
        description="Register for an event to see it here."
      />
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-8">

      <h1 className="text-4xl font-bold mb-8">
        My Registrations
      </h1>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
          />
        ))}

      </div>

    </main>
  );
}