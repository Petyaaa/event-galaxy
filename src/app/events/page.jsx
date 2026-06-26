"use client";

import { useEffect, useMemo, useState } from "react";

import EventCard from "../../components/events/EventCard";
import EventSearch from "../../components/events/EventSearch";
import EventFilters from "../../components/events/EventFilters";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:3001/events", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to load events");
      }

      const data = await res.json();

      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {

      const matchesSearch =
        event.title
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        event.description
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesTag =
        selectedTag === "All" ||
        event.tags?.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [events, search, selectedTag]);

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto p-8">

        <h1 className="text-4xl font-bold mb-8">
          Event Galaxy
        </h1>

        <p>Loading events...</p>

      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-8">

      <h1 className="text-4xl font-bold mb-8">
        Event Galaxy
      </h1>

      <div className="space-y-4">

        <EventSearch
          value={search}
          onChange={setSearch}
        />

        <EventFilters
          selectedTag={selectedTag}
          setSelectedTag={setSelectedTag}
        />

      </div>

      {filteredEvents.length === 0 ? (
        <div className="mt-12 text-center">

          <h2 className="text-2xl font-semibold">
            No events found
          </h2>

          <p className="text-gray-500 mt-2">
            Try changing your search or filters.
          </p>

        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mt-10">

          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
            />
          ))}

        </div>
      )}

    </main>
  );
}