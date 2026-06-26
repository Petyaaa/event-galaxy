"use client";

import { useState } from "react";
import { authApi } from "@/lib/api";

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      await authApi.register(form);

      alert("Registration successful!");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-4"
      >

        <h1 className="text-3xl font-bold text-center">
          Register
        </h1>

        <input
          className="w-full border rounded-lg p-3"
          placeholder="Full name"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
        />

        <input
          className="w-full border rounded-lg p-3"
          placeholder="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
        />

        <input
          className="w-full border rounded-lg p-3"
          placeholder="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
        />

        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg py-3"
        >
          {loading ? "Loading..." : "Create account"}
        </button>

      </form>

    </main>
  );
}