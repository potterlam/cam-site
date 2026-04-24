"use client";

import {
  rollDice,
  diceTotal,
  getDiceLoser,
  resolveRPS,
  spinRoulette,
  pickRandomPunishment,
  type PlayerDiceResult,
  type PlayerRPSResult,
  type RoulettePlayer,
  type RPSMove,
  type Punishment,
} from "@/lib/games";

// ─── Dice Compare Game ────────────────────────────────────────────────────────
interface DiceGameProps {
  players: { userId: string; userName: string }[];
  punishments: Punishment[];
  onResult: (loserId: string, loserName: string, punishment: string) => void;
}

export function DiceGame({ players, punishments, onResult }: DiceGameProps) {
  function play() {
    const results: PlayerDiceResult[] = players.map((p) => {
      const roll = rollDice();
      return { userId: p.userId, userName: p.userName, roll, total: diceTotal(roll) };
    });

    const losers = getDiceLoser(results);
    if (losers.length > 1) {
      // Tie — announce tie, no punishment
      alert(`Tie! Players tied with ${losers[0].total}. Re-roll!`);
      return;
    }

    const loser = losers[0];
    const punishment = pickRandomPunishment(punishments);
    const punishmentText = punishment?.description ?? "No punishment — lucky!";

    alert(
      results.map((r) => `${r.userName}: ${r.roll[0]} + ${r.roll[1]} = ${r.total}`).join("\n") +
        `\n\nLoser: ${loser.userName}\nPunishment: ${punishmentText}`
    );

    onResult(loser.userId, loser.userName, punishmentText);
  }

  return (
    <div className="text-center space-y-4">
      <p className="text-gray-400">Everyone rolls 2 dice. Lowest total loses!</p>
      <button
        onClick={play}
        className="rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 text-lg transition-colors"
      >
        🎲 Roll Dice!
      </button>
    </div>
  );
}

// ─── Rock Paper Scissors ──────────────────────────────────────────────────────
interface RPSGameProps {
  players: { userId: string; userName: string }[];
  myUserId: string;
  punishments: Punishment[];
  onResult: (loserId: string, loserName: string, punishment: string) => void;
  onEmitMove: (move: RPSMove) => void;
  pendingMoves: Record<string, RPSMove>;
}

export function RPSGame({ players, myUserId, punishments, onResult, onEmitMove, pendingMoves }: RPSGameProps) {
  const moves: RPSMove[] = ["rock", "paper", "scissors"];
  const myMove = pendingMoves[myUserId];

  function handleMove(move: RPSMove) {
    onEmitMove(move);
  }

  // When all moves are in (handled by parent via socket), resolve
  const allMoved = players.every((p) => pendingMoves[p.userId]);
  if (allMoved && players.length > 0) {
    const results: PlayerRPSResult[] = players.map((p) => ({
      userId: p.userId,
      userName: p.userName,
      move: pendingMoves[p.userId],
    }));

    const outcome = resolveRPS(results);
    if (outcome.type === "tie") {
      // Let parent handle re-play
    } else {
      const loser = outcome.losers[0];
      const punishment = pickRandomPunishment(punishments);
      onResult(loser.userId, loser.userName, punishment?.description ?? "No punishment");
    }
  }

  const LABELS: Record<RPSMove, string> = { rock: "🪨 Rock", paper: "📄 Paper", scissors: "✂️ Scissors" };

  return (
    <div className="text-center space-y-4">
      <p className="text-gray-400">Pick your move!</p>
      <div className="flex gap-3 justify-center">
        {moves.map((m) => (
          <button
            key={m}
            onClick={() => handleMove(m)}
            disabled={!!myMove}
            className={`rounded-xl px-6 py-3 font-semibold transition-colors ${
              myMove === m
                ? "bg-violet-500 text-white"
                : "bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
            }`}
          >
            {LABELS[m]}
          </button>
        ))}
      </div>
      <div className="text-sm text-gray-500">
        {players.map((p) => (
          <span key={p.userId} className="mr-3">
            {p.userName}: {pendingMoves[p.userId] ? "✅" : "⏳"}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Roulette ─────────────────────────────────────────────────────────────────
interface RouletteGameProps {
  players: RoulettePlayer[];
  punishments: Punishment[];
  onResult: (loserId: string, loserName: string, punishment: string) => void;
}

export function RouletteGame({ players, punishments, onResult }: RouletteGameProps) {
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
      <button
        onClick={spin}
        className="rounded-xl bg-pink-600 hover:bg-pink-500 font-bold px-8 py-3 text-lg transition-colors"
      >
        🎡 Spin!
      </button>
    </div>
  );
}
