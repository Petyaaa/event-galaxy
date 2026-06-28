"use client";

export default function EventSearch({
  value,
  onChange,
}) {
  return (
    <div className="w-full">
      <input
        type="text"
        placeholder="Search events..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}