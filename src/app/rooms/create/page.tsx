"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface PunishmentSet {
  id: string;
  name: string;
  description?: string;
}

const GAME_OPTIONS = [
  { value: "DICE_COMPARE", label: "🎲 Dice Compare", desc: "Each player rolls 2 dice — lowest total loses" },
  { value: "ROCK_PAPER_SCISSORS", label: "✂️ Rock Paper Scissors", desc: "Multi-player elimination" },
  { value: "ROULETTE", label: "🎡 Roulette", desc: "Spin the wheel — random player loses" },
];

export default function CreateRoomPage() {
  const router = useRouter();
  const [gameType, setGameType] = useState("DICE_COMPARE");
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [maxSpectators, setMaxSpectators] = useState(100);
  const [punishmentSetId, setPunishmentSetId] = useState("");
  const [punishmentSets, setPunishmentSets] = useState<PunishmentSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/punishments")
      .then((r) => r.json())
      .then(setPunishmentSets)
      .catch(() => {});
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameType,
        maxPlayers,
        maxSpectators,
        punishmentSetId: punishmentSetId || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create room");
      setLoading(false);
      return;
    }

    const room = await res.json();
    router.push(`/rooms/${room.code}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
        <h1 className="text-2xl font-bold mb-6">🏠 Create a Room</h1>

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Game Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Game</label>
            <div className="space-y-2">
              {GAME_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                    gameType === opt.value
                      ? "border-violet-500 bg-violet-900/30"
                      : "border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="gameType"
                    value={opt.value}
                    checked={gameType === opt.value}
                    onChange={() => setGameType(opt.value)}
                    className="mt-1 accent-violet-500"
                  />
                  <div>
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-sm text-gray-500">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Player Count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Max Players <span className="text-gray-500">(1–6)</span>
              </label>
              <input
                type="number"
                min={1}
                max={6}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Max Spectators
              </label>
              <input
                type="number"
                min={0}
                value={maxSpectators}
                onChange={(e) => setMaxSpectators(Number(e.target.value))}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Punishment Set */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Punishment Set
            </label>
            <select
              value={punishmentSetId}
              onChange={(e) => setPunishmentSetId(e.target.value)}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">— No punishment set —</option>
              {punishmentSets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {punishmentSets.length === 0 && (
              <p className="text-xs text-gray-600 mt-1">
                No punishment sets yet. Add them via the API first.
              </p>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 py-3 font-semibold text-lg transition-colors"
          >
            {loading ? "Creating..." : "Create Room"}
          </button>
        </form>
      </div>
    </main>
  );
}
