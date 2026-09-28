import type { PlayerIndex, RoundResult } from "@/lib/game/types";

export type OnlinePhase =
  | "waiting-for-player2" // room created, only player 1 present
  | "voting" // both present, waiting on one or both votes for this round
  | "reveal" // both votes in for this round
  | "summary";

export type OnlinePlayerSlot = {
  name: string;
  /** Secret, per-player token. Never sent to the other player. */
  token: string;
} | null;

export type RoomState = {
  code: string; // 4 uppercase letters, e.g. "TXQP"
  createdAt: number; // epoch ms, for debugging/observability only (Redis TTL is authoritative)
  totalRounds: number;
  currentRound: number;
  firstVoterIndex: PlayerIndex;
  usedStatements: string[];
  currentStatement: string | null;
  votes: [PlayerIndex | null, PlayerIndex | null];
  results: RoundResult[];
  phase: OnlinePhase;
  players: [OnlinePlayerSlot, OnlinePlayerSlot];
};

/** What a client actually receives — never includes tokens, and masks the
 * opponent's vote until both have voted (anti-cheat, enforced server-side). */
export type RoomView = Omit<RoomState, "players" | "votes"> & {
  players: [string | null, string | null]; // names only
  /** Your own vote (if cast) always visible; the other slot is null until
   * `phase` is "reveal" or "summary". */
  votes: [PlayerIndex | null, PlayerIndex | null];
  you: PlayerIndex;
};
