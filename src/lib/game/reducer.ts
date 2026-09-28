import { pickStatement } from "./statements";
import type { Action, GameState, PlayerIndex } from "./types";
import { MAX_ROUNDS, MIN_ROUNDS } from "./types";

export function createInitialState(): GameState {
  return {
    phase: "rules",
    players: null,
    totalRounds: MIN_ROUNDS,
    currentRound: 1,
    firstVoterIndex: 0,
    usedStatements: [],
    currentStatement: null,
    votes: [null, null],
    results: [],
  };
}

function clampRounds(n: number): number {
  return Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, Math.round(n)));
}

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "HYDRATE": {
      return action.state;
    }

    case "START_SETUP": {
      if (state.phase !== "rules") return state;
      return { ...state, phase: "setup" };
    }

    case "CONFIRM_SETUP": {
      if (state.phase !== "setup") return state;
      return {
        ...state,
        players: action.players,
        totalRounds: clampRounds(action.totalRounds),
        phase: "draw",
      };
    }

    case "FINISH_DRAW": {
      if (state.phase !== "draw") return state;
      const statement = pickStatement(state.usedStatements);
      return {
        ...state,
        firstVoterIndex: action.firstVoterIndex,
        currentRound: 1,
        usedStatements: [...state.usedStatements, statement],
        currentStatement: statement,
        votes: [null, null],
        results: [],
        phase: "voting1",
      };
    }

    case "CAST_VOTE": {
      return castVote(state, action.playerIndex);
    }

    case "ARRIVE_AT_SECOND_VOTER": {
      if (state.phase !== "handoff") return state;
      return { ...state, phase: "voting2" };
    }

    case "NEXT_ROUND": {
      if (state.phase !== "reveal") return state;
      if (state.currentRound >= state.totalRounds) return state;
      const statement = pickStatement(state.usedStatements);
      const nextFirstVoter: PlayerIndex = state.firstVoterIndex === 0 ? 1 : 0;
      return {
        ...state,
        currentRound: state.currentRound + 1,
        firstVoterIndex: nextFirstVoter,
        usedStatements: [...state.usedStatements, statement],
        currentStatement: statement,
        votes: [null, null],
        phase: "voting1",
      };
    }

    case "FINISH_GAME": {
      if (state.phase !== "reveal") return state;
      return { ...state, phase: "summary" };
    }

    case "REPLAY_SAME_PLAYERS": {
      if (state.phase !== "summary") return state;
      return {
        ...state,
        currentRound: 1,
        usedStatements: [],
        currentStatement: null,
        votes: [null, null],
        results: [],
        phase: "draw",
      };
    }

    case "CHANGE_PLAYERS": {
      if (state.phase !== "summary") return state;
      return {
        ...createInitialState(),
        phase: "setup",
      };
    }

    default:
      return state;
  }
}

function castVote(state: GameState, playerIndex: PlayerIndex): GameState {
  if (state.phase === "voting1") {
    const firstSlot = state.firstVoterIndex;
    const votes: [PlayerIndex | null, PlayerIndex | null] = [null, null];
    votes[firstSlot] = playerIndex;
    return { ...state, votes, phase: "handoff" };
  }

  if (state.phase === "voting2") {
    const secondSlot: PlayerIndex = state.firstVoterIndex === 0 ? 1 : 0;
    const votes = [...state.votes] as [
      PlayerIndex | null,
      PlayerIndex | null
    ];
    votes[secondSlot] = playerIndex;

    const finalVotes = votes as [PlayerIndex, PlayerIndex];
    const matched = finalVotes[0] === finalVotes[1];

    return {
      ...state,
      votes: finalVotes,
      results: [
        ...state.results,
        {
          statement: state.currentStatement ?? "",
          round: state.currentRound,
          votes: finalVotes,
          matched,
        },
      ],
      phase: "reveal",
    };
  }

  return state;
}
