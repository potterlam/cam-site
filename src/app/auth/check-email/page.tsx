export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl text-center">
        <div className="text-5xl mb-4">📧</div>
        <h1 className="text-2xl font-bold text-violet-400 mb-3">Check your email!</h1>
        <p className="text-gray-300 mb-2">
          We sent a verification link to your email address.
        </p>
        <p className="text-gray-400 text-sm mb-6">
          Click the link in the email to verify your account and activate your access.
          The link expires in <span className="text-violet-300">24 hours</span>.
        </p>
        <div className="rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-sm text-gray-400">
          Didn&apos;t receive it? Check your spam folder or{" "}
          <a href="/auth/signup" className="text-violet-400 hover:underline">
            sign up again
          </a>{" "}
          with a different email.
        </div>
      </div>
    </main>
  );
}
