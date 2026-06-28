import Link from "next/link";
export default function EventCard({ event }) {

  return (
    <Link href={`/events/${event.id}`}>
      <div className="rounded-xl border p-4 shadow-sm hover:shadow-lg transition cursor-pointer">
      <h3 className="text-xl font-bold">{event.title}</h3>

      <p className="mt-2 text-sm text-gray-600">
        {event.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {event.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-gray-100 px-3 py-1 text-xs"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 text-sm">
        {event.confirmedCount}/{event.capacity}
      </div>
    </div>
  </Link>
);
}