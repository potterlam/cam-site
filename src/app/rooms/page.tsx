import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import LobbyChatClient from "@/components/LobbyChatClient";

export default async function RoomsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const rooms = await db.room.findMany({
    where: { status: { in: ["WAITING", "PLAYING"] } },
    include: {
      creator: { select: { name: true } },
      members: { select: { role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const GAME_LABELS: Record<string, string> = {
    DICE_COMPARE: "🎲 Dice Compare",
    ROCK_PAPER_SCISSORS: "✂️ Rock Paper Scissors",
    ROULETTE: "🎡 Roulette",
  };

  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Browse Rooms</h1>
        <Link
          href="/rooms/create"
          className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-semibold transition-colors"
        >
          + Create Room
        </Link>
      </div>

      {rooms.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center text-gray-500">
          No active rooms. <Link href="/rooms/create" className="text-violet-400 underline">Create one!</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => {
            const playerCount = room.members.filter((m) => m.role === "PLAYER").length;
            return (
              <Link
                key={room.id}
                href={`/rooms/${room.code}`}
                className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 hover:border-violet-700 p-4 transition-colors"
              >
                <div>
                  <span className="font-mono text-violet-400 font-bold mr-3">{room.code}</span>
                  <span className="text-sm text-gray-400">{GAME_LABELS[room.gameType]}</span>
                  <p className="text-xs text-gray-600 mt-0.5">by {room.creator.name}</p>
                </div>
                <div className="text-right text-sm">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${room.status === "PLAYING" ? "bg-green-900 text-green-300" : "bg-yellow-900 text-yellow-300"}`}>
                    {room.status}
                  </span>
                  <p className="text-gray-500 mt-1">{playerCount}/{room.maxPlayers} players</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <LobbyChatClient
        userId={session.user.id}
        userName={session.user.name || session.user.email || "Player"}
      />
    </main>
  );
}
