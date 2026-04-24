export default function VerifyPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center shadow-2xl">
        <div className="text-5xl mb-4">📬</div>
        <h1 className="text-2xl font-bold mb-2">Check your inbox</h1>
        <p className="text-gray-400">
          A sign-in link has been sent to your email. Click the link to sign in and start playing.
        </p>
        <p className="mt-4 text-sm text-gray-600">The link will expire in 24 hours.</p>
      </div>
    </main>
  );
}
