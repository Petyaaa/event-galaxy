"use client";

import { useState } from "react";
import { LogIn, ShieldCheck, User } from "lucide-react";
import { authApi } from "@/lib/api";

const demos = [
  { label: "Student", icon: User, email: "student.maya@campuspulse.test", password: "password123" },
  { label: "Organizer", icon: ShieldCheck, email: "organizer@campuspulse.test", password: "password123" },
];

export default function LoginPage() {
  const [form, setForm] = useState({ email: "student.maya@campuspulse.test", password: "password123" });
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  async function submit(nextForm = form, intent = "login") {
    setError("");
    setLoading(intent);
    try {
      await authApi.login(nextForm);
      window.location.href = nextForm.email.startsWith("organizer") ? "/organizer" : "/events";
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading("");
    }
  }

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-zinc-100 p-4" data-testid="login-page">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl md:grid-cols-[0.95fr_1.05fr]">
        <div className="bg-zinc-950 p-8 text-white">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-white text-sm font-black text-zinc-950">CP</div>
          <h1 className="mt-8 text-4xl font-black leading-tight">Sign in to the campus operations console.</h1>
          <p className="mt-4 text-sm leading-6 text-zinc-300">Use seeded accounts to inspect student registration, organizer queues, worker delivery, and proof mode.</p>
          <div className="mt-8 grid gap-3">
            {demos.map((demo) => {
              const Icon = demo.icon;
              return (
                <button
                  key={demo.label}
                  data-testid={`login-demo-${demo.label.toLowerCase()}`}
                  onClick={() => submit({ email: demo.email, password: demo.password }, demo.label)}
                  className="flex items-center justify-between rounded-lg border border-white/15 bg-white/10 p-4 text-left transition hover:bg-white/15"
                >
                  <span className="flex items-center gap-3 font-semibold"><Icon className="h-5 w-5" /> {demo.label} Demo</span>
                  <LogIn className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="grid gap-4 p-8"
        >
          <div>
            <h2 className="text-2xl font-black text-zinc-950">Account Login</h2>
            <p className="mt-1 text-sm text-zinc-500">Credentials are stored with bcrypt and issued as an HTTP-only session cookie.</p>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-zinc-700">
            Email address
            <input
              name="email"
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
              name="password"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="h-12 rounded-lg border border-zinc-200 px-3 text-zinc-950 outline-none focus:border-emerald-700"
              required
            />
          </label>
          {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p> : null}
          <button
            type="submit"
            disabled={Boolean(loading)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <a className="text-sm font-semibold text-emerald-800 underline underline-offset-4" href="/register">
            Create student account
          </a>
        </form>
      </section>
    </main>
  );
}
