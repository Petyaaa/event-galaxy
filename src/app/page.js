"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-gray-900">
          Welcome to Event Galaxy
        </h1>
        <p className="text-gray-600">
          Discover and register for the best campus events.
        </p>
        <Link 
          href="/events" 
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
        >
          Go to Events Dashboard
        </Link>
      </div>
    </main>
  );
}