"use client";

import { useState } from "react";

export default function CheckEmailPage() {
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [resendError, setResendError] = useState("");

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setResendError("");
    setResendStatus("loading");

    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resendEmail }),
    });

    const data = await res.json();
    if (!res.ok) {
      setResendError(data.error ?? "Failed to resend.");
      setResendStatus("error");
    } else {
      setResendStatus("sent");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl text-center">
        <div className="text-5xl mb-4">📧</div>
        <h1 className="text-2xl font-bold text-violet-400 mb-3">Check your email!</h1>
        <p className="text-gray-300 mb-2">
          We sent a verification link to your email address.
        </p>
        <p className="text-gray-400 text-sm mb-6">
          Click the link to verify your account. The link expires in{" "}
          <span className="text-violet-300">24 hours</span>.
        </p>

        <div className="rounded-lg bg-gray-800 border border-gray-700 p-4 text-left">
          <p className="text-sm text-gray-400 mb-3">
            Didn&apos;t receive it? Enter your email to resend:
          </p>

          {resendStatus === "sent" ? (
            <p className="text-green-400 text-sm text-center py-2">
              ✅ Verification email resent! Check your inbox.
            </p>
          ) : (
            <form onSubmit={handleResend} className="flex gap-2">
              <input
                type="email"
                required
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                type="submit"
                disabled={resendStatus === "loading"}
                className="rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap"
              >
                {resendStatus === "loading" ? "Sending..." : "Resend"}
              </button>
            </form>
          )}

          {resendStatus === "error" && (
            <p className="text-red-400 text-xs mt-2">{resendError}</p>
          )}
        </div>
      </div>
    </main>
  );
}
