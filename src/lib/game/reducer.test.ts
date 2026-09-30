import { describe, expect, it } from "vitest";
import { createInitialState, gameReducer } from "./reducer";
import type { GameState } from "./types";

function play(state: GameState, rounds: number): GameState {
  let s = state;
  for (let i = 0; i < rounds; i++) {
    if (s.phase === "reveal") {
      s = gameReducer(
        s,
        s.currentRound >= s.totalRounds
          ? { type: "FINISH_GAME" }
          : { type: "NEXT_ROUND" }
      );
    }
    if (s.phase === "voting1") {
      s = gameReducer(s, { type: "CAST_VOTE", playerIndex: 0 });
    }
    if (s.phase === "handoff") {
      s = gameReducer(s, { type: "ARRIVE_AT_SECOND_VOTER" });
    }
    if (s.phase === "voting2") {
      s = gameReducer(s, { type: "CAST_VOTE", playerIndex: 0 });
    }
  }
  if (s.phase === "reveal" && s.currentRound >= s.totalRounds) {
    s = gameReducer(s, { type: "FINISH_GAME" });
  }
  return s;
}

function setupGame(totalRounds: number): GameState {
  let s = createInitialState();
  s = gameReducer(s, { type: "START_SETUP" });
  s = gameReducer(s, {
    type: "CONFIRM_SETUP",
    players: ["Ana", "Luis"],
    totalRounds,
  });
  s = gameReducer(s, { type: "FINISH_DRAW", firstVoterIndex: 0 });
  return s;
}

describe("gameReducer phase transitions", () => {
  it("walks rules -> setup -> draw -> voting1", () => {
    const s = setupGame(10);
    expect(s.phase).toBe("voting1");
    expect(s.players).toEqual(["Ana", "Luis"]);
    expect(s.currentRound).toBe(1);
  });

  it("goes voting1 -> handoff -> voting2 -> reveal on votes", () => {
    let s = setupGame(10);
    s = gameReducer(s, { type: "CAST_VOTE", playerIndex: 1 });
    expect(s.phase).toBe("handoff");
    s = gameReducer(s, { type: "ARRIVE_AT_SECOND_VOTER" });
    expect(s.phase).toBe("voting2");
    s = gameReducer(s, { type: "CAST_VOTE", playerIndex: 1 });
    expect(s.phase).toBe("reveal");
    expect(s.results).toHaveLength(1);
    expect(s.results[0].matched).toBe(true);
  });

  it("records a non-match correctly", () => {
    let s = setupGame(10);
    s = gameReducer(s, { type: "CAST_VOTE", playerIndex: 0 });
    s = gameReducer(s, { type: "ARRIVE_AT_SECOND_VOTER" });
    s = gameReducer(s, { type: "CAST_VOTE", playerIndex: 1 });
    expect(s.results[0].matched).toBe(false);
  });

  it("alternates the first voter every round", () => {
    let s = setupGame(10);
    expect(s.firstVoterIndex).toBe(0);
    s = gameReducer(s, { type: "CAST_VOTE", playerIndex: 0 });
    s = gameReducer(s, { type: "ARRIVE_AT_SECOND_VOTER" });
    s = gameReducer(s, { type: "CAST_VOTE", playerIndex: 0 });
    s = gameReducer(s, { type: "NEXT_ROUND" });
    expect(s.firstVoterIndex).toBe(1);
    expect(s.currentRound).toBe(2);

    s = gameReducer(s, { type: "CAST_VOTE", playerIndex: 0 });
    s = gameReducer(s, { type: "ARRIVE_AT_SECOND_VOTER" });
    s = gameReducer(s, { type: "CAST_VOTE", playerIndex: 0 });
    s = gameReducer(s, { type: "NEXT_ROUND" });
    expect(s.firstVoterIndex).toBe(0);
    expect(s.currentRound).toBe(3);
  });

  it("moves to summary via FINISH_GAME on the last round", () => {
    let s = setupGame(10);
    s = play(s, 10);
    expect(s.phase).toBe("summary");
    expect(s.results).toHaveLength(10);
  });

  it("FINISH_GAME can end the game early, keeping only the results played so far", () => {
    let s = setupGame(10);
    s = gameReducer(s, { type: "CAST_VOTE", playerIndex: 0 });
    s = gameReducer(s, { type: "ARRIVE_AT_SECOND_VOTER" });
    s = gameReducer(s, { type: "CAST_VOTE", playerIndex: 0 });
    expect(s.phase).toBe("reveal");
    expect(s.currentRound).toBe(1);
    s = gameReducer(s, { type: "FINISH_GAME" });
    expect(s.phase).toBe("summary");
    expect(s.results).toHaveLength(1);
  });

  it("never repeats a statement across a full 50-round game", () => {
    let s = setupGame(50);
    s = play(s, 50);
    const statements = s.results.map((r) => r.statement);
    expect(new Set(statements).size).toBe(statements.length);
    expect(statements).toHaveLength(50);
  });

  it("keeps round counter within [1, totalRounds]", () => {
    let s = setupGame(10);
    for (let i = 0; i < 9; i++) {
      s = gameReducer(s, { type: "CAST_VOTE", playerIndex: 0 });
      s = gameReducer(s, { type: "ARRIVE_AT_SECOND_VOTER" });
      s = gameReducer(s, { type: "CAST_VOTE", playerIndex: 0 });
      s = gameReducer(s, { type: "NEXT_ROUND" });
      expect(s.currentRound).toBeGreaterThanOrEqual(1);
      expect(s.currentRound).toBeLessThanOrEqual(10);
    }
  });

  it("REPLAY_SAME_PLAYERS keeps players but resets rounds/results", () => {
    let s = setupGame(10);
    s = play(s, 10);
    s = gameReducer(s, { type: "REPLAY_SAME_PLAYERS" });
    expect(s.phase).toBe("draw");
    expect(s.players).toEqual(["Ana", "Luis"]);
    expect(s.results).toHaveLength(0);
    expect(s.usedStatements).toHaveLength(0);
  });

  it("CHANGE_PLAYERS resets everything back to setup", () => {
    let s = setupGame(10);
    s = play(s, 10);
    s = gameReducer(s, { type: "CHANGE_PLAYERS" });
    expect(s.phase).toBe("setup");
    expect(s.players).toBeNull();
    expect(s.results).toHaveLength(0);
  });
});
