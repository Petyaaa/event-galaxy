"use client";

export default function EventDetails({ event, onRegister, isRegistered }) {
  if (!event) return <p className="text-center">Event not found.</p>;

  const isFull = event.confirmedCount >= event.capacity;

  return (
    <div className="w-full max-w-2xl bg-white border rounded-2xl p-6 shadow-sm">
      <div className="flex flex-wrap gap-2 mb-4">
        {event.tags?.map((tag) => (
          <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium">
            {tag}
          </span>
        ))}
      </div>

      <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
      <p className="text-gray-600 mb-6">{event.description}</p>

      <div className="flex justify-between items-center border-t pt-4">
        <div>
          <span className="text-xs text-gray-400 block uppercase">Capacity</span>
          <span className="text-lg font-semibold">
            {event.confirmedCount} / {event.capacity} seats
          </span>
        </div>

        <RegisterButton
            event={event}
            isRegistered={isRegistered}
            onRegister={onRegister}
          className={`px-6 py-2 rounded-xl font-semibold border transition
            ${
              isRegistered
                ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                : isFull
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border-transparent"
                : "bg-blue-600 text-white border-transparent hover:bg-blue-700"
            }`}
        >
          {isRegistered ? "Cancel Registration" : isFull ? "Full" : "Register"}
        </RegisterButton>
      </div>
    </div>
  );
}