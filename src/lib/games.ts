// ─── Game Logic Utilities ─────────────────────────────────────────────────────

export type DiceRoll = [number, number];
export type RPSMove = "rock" | "paper" | "scissors";

// Dice Compare: each player rolls 2 dice, lowest total loses (ties re-roll)
export function rollDice(): DiceRoll {
  return [
    Math.ceil(Math.random() * 6),
    Math.ceil(Math.random() * 6),
  ];
}

export function diceTotal(roll: DiceRoll): number {
  return roll[0] + roll[1];
}

export interface PlayerDiceResult {
  userId: string;
  userName: string;
  roll: DiceRoll;
  total: number;
}

export function getDiceLoser(results: PlayerDiceResult[]): PlayerDiceResult[] {
  const minTotal = Math.min(...results.map((r) => r.total));
  return results.filter((r) => r.total === minTotal);
}

// Rock Paper Scissors: multi-player, ties mean everyone re-plays
export const RPS_BEATS: Record<RPSMove, RPSMove> = {
  rock: "scissors",
  scissors: "paper",
  paper: "rock",
};

export interface PlayerRPSResult {
  userId: string;
  userName: string;
  move: RPSMove;
}

export type RPSOutcome = { type: "tie" } | { type: "result"; losers: PlayerRPSResult[] };

export function resolveRPS(results: PlayerRPSResult[]): RPSOutcome {
  const uniqueMoves = [...new Set(results.map((r) => r.move))];

  // All same or all three moves = tie
  if (uniqueMoves.length === 1 || uniqueMoves.length === 3) {
    return { type: "tie" };
  }

  // Two distinct moves: one beats the other
  const [moveA, moveB] = uniqueMoves;
  const winningMove = RPS_BEATS[moveA] === moveB ? moveA : moveB;
  const losers = results.filter((r) => r.move !== winningMove);
  return { type: "result", losers };
}

// Roulette: randomly pick one player as loser
export interface RoulettePlayer {
  userId: string;
  userName: string;
}

export function spinRoulette(players: RoulettePlayer[]): RoulettePlayer {
  const idx = Math.floor(Math.random() * players.length);
  return players[idx];
}

// ─── Punishment Selector ──────────────────────────────────────────────────────
export interface Punishment {
  id: string;
  description: string;
  severity: number;
}

export function pickRandomPunishment(punishments: Punishment[]): Punishment | null {
  if (!punishments.length) return null;
  return punishments[Math.floor(Math.random() * punishments.length)];
}
