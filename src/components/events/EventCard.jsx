export default function EventCard({ event }) {

  return (
    <div className="rounded-xl border p-4 shadow-sm">
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
  );
}