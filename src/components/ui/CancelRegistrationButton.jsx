"use client";

export default function WaitlistButton({
  loading,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full rounded-xl bg-yellow-500 py-3 text-white font-semibold hover:bg-yellow-600 transition"
    >
      {loading ? "Joining..." : "Join Waitlist"}
    </button>
  );
}