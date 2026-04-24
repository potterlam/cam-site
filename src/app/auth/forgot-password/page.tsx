"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setSubmitted(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
        <h1 className="mb-2 text-3xl font-bold text-violet-400">🔑 Forgot Password</h1>
        <p className="mb-8 text-gray-400">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {submitted ? (
          <div className="rounded-xl bg-violet-900/40 border border-violet-700 p-6 text-center">
            <div className="text-4xl mb-3">📧</div>
            <h2 className="text-xl font-semibold mb-2">Check your inbox</h2>
            <p className="text-gray-400 text-sm">
              If an account exists for{" "}
              <span className="text-violet-300 font-medium">{email}</span>, a password reset link
              has been sent. It expires in <span className="text-violet-300">1 hour</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 py-3 font-semibold transition-colors"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Remember your password?{" "}
          <Link href="/auth/signin" className="text-violet-400 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
