import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) redirect("/auth/signin");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-violet-400 mb-2">🎮 Cam Party Game</h1>
        <p className="text-gray-400">
          Welcome back, <span className="text-white font-medium">{session.user.name || session.user.email}</span>!
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <Link
          href="/rooms/create"
          className="flex-1 rounded-xl bg-violet-600 hover:bg-violet-500 py-4 text-center font-semibold text-lg transition-colors"
        >
          🏠 Create Room
        </Link>
        <Link
          href="/rooms"
          className="flex-1 rounded-xl bg-gray-800 hover:bg-gray-700 py-4 text-center font-semibold text-lg transition-colors"
        >
          🔍 Browse Rooms
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl text-center">
        {[
          { emoji: "🎲", title: "Dice Compare", desc: "Roll 2 dice — lowest total loses" },
          { emoji: "✂️", title: "Rock Paper Scissors", desc: "Multi-player elimination rounds" },
          { emoji: "🎡", title: "Roulette", desc: "Spin the wheel — random loser" },
        ].map((game) => (
          <div key={game.title} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <div className="text-3xl mb-2">{game.emoji}</div>
            <h3 className="font-semibold mb-1">{game.title}</h3>
            <p className="text-gray-500 text-sm">{game.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
