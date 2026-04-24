"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    // Register the user (server will send verification email via Resend)
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Registration failed.");
      return;
    }

    // Redirect to sign in — account is active immediately
    router.push("/auth/signin?registered=1");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
        <h1 className="mb-2 text-3xl font-bold text-violet-400">🎮 Cam Party Game</h1>
        <p className="mb-8 text-gray-400">Create your account to start playing.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Display Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your nickname"
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

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

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password <span className="text-gray-500">(min. 6 characters)</span>
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 py-3 font-semibold transition-colors"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-violet-400 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
