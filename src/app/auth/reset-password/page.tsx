"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token || !email) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-3">❌</div>
        <p className="text-red-400 font-medium mb-4">Invalid reset link.</p>
        <Link href="/auth/forgot-password" className="text-violet-400 hover:underline">
          Request a new one
        </Link>
      </div>
    );
  }

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

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/auth/signin"), 3000);
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-xl font-semibold text-green-400 mb-2">Password updated!</h2>
        <p className="text-gray-400 text-sm">Redirecting you to sign in...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
          New Password <span className="text-gray-500">(min. 6 characters)</span>
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
          Confirm New Password
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
        {loading ? "Updating..." : "Set New Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
        <h1 className="mb-2 text-3xl font-bold text-violet-400">🔒 Reset Password</h1>
        <p className="mb-8 text-gray-400">Enter your new password below.</p>
        <Suspense fallback={<p className="text-gray-400 text-sm">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
