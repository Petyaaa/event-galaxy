"use client";

export default function RegisterButton({
  disabled,
  loading,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
    >
      {loading ? "Registering..." : "Register"}
    </button>
  );
}