"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { authApi } from "@/lib/api";

export default function RegisterPage() {
  const [form, setForm] = useState({ displayName: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.register(form);
      window.location.href = "/events";
    } catch (err) {
      setError(err.message || "Could not create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-zinc-100 p-4" data-testid="register-page">
      <form onSubmit={handleSubmit} className="grid w-full max-w-lg gap-4 rounded-lg border border-zinc-200 bg-white p-8 shadow-xl">
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-zinc-950 text-sm font-black text-white">CP</div>
        <div>
          <h1 className="text-3xl font-black text-zinc-950">Create a student account</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">Public registration creates students only. Organizer accounts are seeded by campus staff.</p>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Display name
          <input
            value={form.displayName}
            onChange={(event) => setForm({ ...form, displayName: event.target.value })}
            className="h-12 rounded-lg border border-zinc-200 px-3 text-zinc-950 outline-none focus:border-emerald-700"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className="h-12 rounded-lg border border-zinc-200 px-3 text-zinc-950 outline-none focus:border-emerald-700"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Password
          <input
            type="password"
            minLength={8}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            className="h-12 rounded-lg border border-zinc-200 px-3 text-zinc-950 outline-none focus:border-emerald-700"
            required
          />
        </label>
        {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
        >
          <UserPlus className="h-4 w-4" />
          {loading ? "Creating..." : "Create Account"}
        </button>
        <a className="text-sm font-semibold text-emerald-800 underline underline-offset-4" href="/login">
          Back to login
        </a>
      </form>
    </main>
  );
}
