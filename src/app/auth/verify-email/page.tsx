import Link from "next/link";

type Props = { searchParams: Promise<{ success?: string; error?: string }> };

export default async function VerifyEmailPage({ searchParams }: Props) {
  const params = await searchParams;

  if (params.success) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-green-800 bg-gray-900 p-8 shadow-2xl text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-400 mb-3">Email Verified!</h1>
          <p className="text-gray-300 mb-6">
            Your account is now active. You can sign in and start playing.
          </p>
          <Link
            href="/auth/signin"
            className="inline-block rounded-lg bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 font-semibold transition-colors"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  const messages: Record<string, string> = {
    expired: "This verification link has expired. Please sign up again to get a new link.",
    invalid: "This verification link is invalid or has already been used.",
    server: "Something went wrong on our end. Please try again later.",
  };

  const errorMsg = messages[params.error ?? ""] ?? "Verification failed.";

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-red-800 bg-gray-900 p-8 shadow-2xl text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-red-400 mb-3">Verification Failed</h1>
        <p className="text-gray-300 mb-6">{errorMsg}</p>
        <Link
          href="/auth/signup"
          className="inline-block rounded-lg bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 font-semibold transition-colors"
        >
          Back to Sign Up
        </Link>
      </div>
    </main>
  );
}
