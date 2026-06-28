"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EventDetailsPage() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvent();
  }, []);

  async function loadEvent() {
    try {
      // TODO:
      // const res = await fetch(`http://localhost:3001/events/${id}`);
      // const data = await res.json();

      const data = {
        id,
        title: "AI Workshop",
        description:
          "Learn the basics of Artificial Intelligence through practical examples.",
        organizer: "CampusPulse",
        location: "Room 205",
        meetingUrl: "https://meet.google.com/",
        date: "03 Jul 2026",
        time: "14:00",
        tags: ["AI", "Workshop"],
        confirmedCount: 18,
        capacity: 25,
        status: "Published",
      };

      setEvent(data);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto p-8">
        <h1 className="text-3xl font-bold">Loading...</h1>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-8">

      <h1 className="text-4xl font-bold">
        {event.title}
      </h1>

      <p className="mt-4 text-gray-600">
        {event.description}
      </p>

      <div className="grid md:grid-cols-2 gap-6 mt-10">

        <div className="rounded-xl border p-5">

          <h2 className="font-semibold text-xl">
            Event Info
          </h2>

          <p className="mt-4">
            📅 {event.date}
          </p>

          <p>
            🕒 {event.time}
          </p>

          <p>
            📍 {event.location}
          </p>

          <p className="mt-4">
            Organizer: {event.organizer}
          </p>

        </div>

        <div className="rounded-xl border p-5">

          <h2 className="font-semibold text-xl">
            Registration
          </h2>

          <p className="mt-4">
            Capacity
          </p>

          <div className="w-full h-3 rounded-full bg-gray-200 mt-2">

            <div
              className="h-3 rounded-full bg-blue-600"
              style={{
                width: `${(event.confirmedCount / event.capacity) * 100}%`,
              }}
            />

          </div>

          <p className="mt-2">
            {event.confirmedCount} / {event.capacity}
          </p>

          <button
            className="mt-6 w-full bg-blue-600 text-white rounded-lg py-3 hover:bg-blue-700"
          >
            Register
          </button>

        </div>

      </div>

      <div className="flex gap-2 mt-8">

        {event.tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 rounded-full bg-gray-100"
          >
            {tag}
          </span>
        ))}

      </div>

    </main>
  );
}