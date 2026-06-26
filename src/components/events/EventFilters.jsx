"use client";

const TAGS = [
  "All",
  "AI",
  "Workshop",
  "Career",
  "Music",
  "Sports",
  "Wellness",
  "Design",
  "Robotics",
];

export default function EventFilters({
  selectedTag,
  setSelectedTag,
}) {
  return (
    <div className="flex flex-wrap gap-2">

      {TAGS.map((tag) => (
        <button
          key={tag}
          onClick={() => setSelectedTag(tag)}
          className={`px-4 py-2 rounded-full border transition
            ${
              selectedTag === tag
                ? "bg-blue-600 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
        >
          {tag}
        </button>
      ))}

    </div>
  );
}