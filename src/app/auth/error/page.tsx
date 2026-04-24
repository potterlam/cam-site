"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "There is a server configuration error. Please contact support.",
  AccessDenied: "You do not have access to this resource.",
  Verification: "The sign-in link has expired or has already been used. Please request a new one.",
  Default: "An unexpected error occurred. Please try again.",
};

function ErrorContent() {
  const params = useSearchParams();
  const error = params.get("error") ?? "Default";
  const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default;

  return (
    <div className="w-full max-w-md rounded-2xl border border-red-800 bg-gray-900 p-8 text-center shadow-2xl">
      <div className="text-5xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold mb-2 text-red-400">Sign In Error</h1>
      <p className="text-gray-400 mb-6">{message}</p>
      <Link
        href="/auth/signin"
        className="inline-block rounded-xl bg-violet-600 hover:bg-violet-500 px-6 py-3 font-semibold transition-colors"
      >
        Try Again
      </Link>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
        <ErrorContent />
      </Suspense>
    </main>
  );
}
