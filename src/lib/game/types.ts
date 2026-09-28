export type Phase =
  | "rules"
  | "setup"
  | "draw"
  | "voting1"
  | "handoff"
  | "voting2"
  | "reveal"
  | "summary";

/** Index into `players`: 0 or 1 */
export type PlayerIndex = 0 | 1;

export type RoundResult = {
  statement: string;
  round: number;
  votes: [PlayerIndex, PlayerIndex];
  matched: boolean;
};

export type GameState = {
  phase: Phase;
  players: [string, string] | null;
  totalRounds: number;
  currentRound: number;
  firstVoterIndex: PlayerIndex;
  usedStatements: string[];
  currentStatement: string | null;
  votes: [PlayerIndex | null, PlayerIndex | null];
  results: RoundResult[];
};

export type Action =
  | { type: "HYDRATE"; state: GameState }
  | { type: "START_SETUP" }
  | { type: "CONFIRM_SETUP"; players: [string, string]; totalRounds: number }
  | { type: "FINISH_DRAW"; firstVoterIndex: PlayerIndex }
  | { type: "CAST_VOTE"; playerIndex: PlayerIndex }
  | { type: "ARRIVE_AT_SECOND_VOTER" }
  | { type: "NEXT_ROUND" }
  | { type: "FINISH_GAME" }
  | { type: "REPLAY_SAME_PLAYERS" }
  | { type: "CHANGE_PLAYERS" };

export const MIN_ROUNDS = 10;
export const MAX_ROUNDS = 50;
