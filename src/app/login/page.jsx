"use client";

import { useState } from "react";
import { authApi } from "../../lib/api";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await authApi.login(form);
      alert("Logged in!");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8">

        <h1 className="text-3xl font-bold text-center">
          Event Galaxy
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Sign in to your account
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">

          <div>
            <label className="block mb-2 font-medium">
              Email
            </label>
            <input
              name="email"
              type="email"
              placeholder="student@school.com"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 transition"
          >
            Login
          </button>

        </form>

      </div>
    </main>
  );
}