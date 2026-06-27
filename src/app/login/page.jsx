"use client";

import { useState } from "react";
import { authApi } from "../../lib/api";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authApi.login(form);
      alert("Logged in successfully!");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-xl shadow-slate-100/50 space-y-6">
        
        {/* Header Section */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-black text-white font-black text-lg shadow-md tracking-wider mx-auto">
            CP
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-3">
            Log in to CampusPulse
          </h1>
          <p className="text-sm text-slate-500 max-w-[280px] mx-auto">
            Enter your details below to access your campus account.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email address
            </label>
            <input
              name="email"
              type="email"
              placeholder="student@school.com"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <a href="/forgot-password" className="text-xs font-medium text-blue-600 hover:underline">
                Forgot your password?
              </a>
            </div>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
              required
            />
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600 font-medium text-center">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-950 text-white py-3.5 text-sm font-semibold hover:bg-slate-900 transition-all active:scale-[0.99] shadow-sm disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-500 pt-2">
          Don't have an account?{" "}
          <a href="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition underline underline-offset-4">
            Sign up
          </a>
        </p>

      </div>
    </main>
  );
}