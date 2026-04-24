"use client";

import {
  rollDice,
  diceTotal,
  getDiceLoser,
  spinRoulette,
  pickRandomPunishment,
  type PlayerDiceResult,
  type RoulettePlayer,
  type RPSMove,
  type Punishment,
} from "@/lib/games";

// ─── Dice Compare Game ────────────────────────────────────────────────────────
interface DiceGameProps {
  players: { userId: string; userName: string }[];
  punishments: Punishment[];
  isHost: boolean;
  onResult: (loserId: string, loserName: string, punishment: string) => void;
}

export function DiceGame({ players, punishments, isHost, onResult }: DiceGameProps) {
  function play() {
    const results: PlayerDiceResult[] = players.map((p) => {
      const roll = rollDice();
      return { userId: p.userId, userName: p.userName, roll, total: diceTotal(roll) };
    });

    const losers = getDiceLoser(results);
    const summary = results.map((r) => `${r.userName}: ${r.roll[0]}+${r.roll[1]}=${r.total}`).join("  |  ");

    if (losers.length > 1) {
      onResult("__tie__", "Tie!", `Tie at ${losers[0].total} — re-roll! (${summary})`);
      return;
    }

    const loser = losers[0];
    const punishment = pickRandomPunishment(punishments);
    const punishmentText = punishment?.description ?? "No punishment — lucky!";
    onResult(loser.userId, loser.userName, `${punishmentText}  [${summary}]`);
  }

  return (
    <div className="text-center space-y-4">
      <p className="text-gray-400">Everyone rolls 2 dice. Lowest total loses!</p>
      {isHost ? (
        <button
          onClick={play}
          className="rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 text-lg transition-colors"
        >
          🎲 Roll Dice!
        </button>
      ) : (
        <p className="text-gray-500 text-sm animate-pulse">⏳ Waiting for host to roll…</p>
      )}
    </div>
  );
}

// ─── Rock Paper Scissors ──────────────────────────────────────────────────────
interface RPSGameProps {
  players: { userId: string; userName: string }[];
  myUserId: string;
  onEmitMove: (move: RPSMove) => void;
  pendingMoves: Record<string, RPSMove>;
}

export function RPSGame({ players, myUserId, onEmitMove, pendingMoves }: RPSGameProps) {
  const moves: RPSMove[] = ["rock", "paper", "scissors"];
  const myMove = pendingMoves[myUserId];
  const allMoved = players.length > 0 && players.every((p) => pendingMoves[p.userId]);

  const LABELS: Record<RPSMove, string> = { rock: "🪨 Rock", paper: "📄 Paper", scissors: "✂️ Scissors" };
  const EMOJI: Record<RPSMove, string> = { rock: "🪨", paper: "📄", scissors: "✂️" };

  return (
    <div className="text-center space-y-4">
      <p className="text-gray-400">Pick your move!</p>
      <div className="flex gap-3 justify-center flex-wrap">
        {moves.map((m) => (
          <button
            key={m}
            onClick={() => { if (!myMove) onEmitMove(m); }}
            disabled={!!myMove}
            className={`rounded-xl px-5 py-2.5 font-semibold transition-colors ${
              myMove === m
                ? "bg-violet-600 text-white ring-2 ring-violet-400"
                : "bg-gray-800 hover:bg-gray-700 disabled:opacity-40"
            }`}
          >
            {LABELS[m]}
          </button>
        ))}
      </div>

      {/* Per-player status */}
      <div className="flex flex-wrap gap-2 justify-center text-xs text-gray-500">
        {players.map((p) => (
          <span key={p.userId} className="rounded-full bg-gray-800 px-2 py-1">
            {p.userName}:{" "}
            {allMoved
              ? EMOJI[pendingMoves[p.userId]]
              : pendingMoves[p.userId]
              ? "✅"
              : "⏳"}
          </span>
        ))}
      </div>

      {allMoved && (
        <p className="text-yellow-400 text-sm animate-pulse">Resolving…</p>
      )}
    </div>
  );
}

// ─── Roulette ─────────────────────────────────────────────────────────────────
interface RouletteGameProps {
  players: RoulettePlayer[];
  punishments: Punishment[];
  isHost: boolean;
  onResult: (loserId: string, loserName: string, punishment: string) => void;
}

export function RouletteGame({ players, punishments, isHost, onResult }: RouletteGameProps) {
  function spin() {
    const loser = spinRoulette(players);
    const punishment = pickRandomPunishment(punishments);
    const punishmentText = punishment?.description ?? "No punishment — lucky!";
    onResult(loser.userId, loser.userName, punishmentText);
  }

  return (
    <div className="text-center space-y-4">
      <p className="text-gray-400">Spin the roulette — one random player loses!</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {players.map((p) => (
          <span key={p.userId} className="rounded-full bg-gray-800 px-3 py-1 text-sm">
            {p.userName}
          </span>
        ))}
      </div>
      {isHost ? (
        <button
          onClick={spin}
          className="rounded-xl bg-pink-600 hover:bg-pink-500 font-bold px-8 py-3 text-lg transition-colors"
        >
          🎡 Spin!
        </button>
      ) : (
        <p className="text-gray-500 text-sm animate-pulse">⏳ Waiting for host to spin…</p>
      )}
    </div>
  );
}
