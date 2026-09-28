import { describe, expect, it } from "vitest";
import {
  castVote,
  confirmAdvance,
  createRoom,
  joinRoom,
  replayRoom,
  toView,
} from "./room";
import type { RoomState } from "./types";

function setupRoom(totalRounds = 10): RoomState {
  const room = createRoom("TXQP", "Ana", "host-token", totalRounds);
  return joinRoom(room, "Luis", "guest-token");
}

describe("createRoom", () => {
  it("starts in waiting-for-player2 with only the host filled in", () => {
    const room = createRoom("TXQP", "Ana", "host-token", 10);
    expect(room.phase).toBe("waiting-for-player2");
    expect(room.players[0]).toEqual({ name: "Ana", token: "host-token" });
    expect(room.players[1]).toBeNull();
  });
});

describe("joinRoom", () => {
  it("fills the second slot and moves to voting", () => {
    const room = createRoom("TXQP", "Ana", "host-token", 10);
    const joined = joinRoom(room, "Luis", "guest-token");
    expect(joined.phase).toBe("voting");
    expect(joined.players[1]).toEqual({ name: "Luis", token: "guest-token" });
    expect(joined.currentStatement).not.toBeNull();
    expect(joined.usedStatements).toHaveLength(1);
  });

  it("is a no-op if the room already has a second player", () => {
    const room = setupRoom();
    const again = joinRoom(room, "Otra", "another-token");
    expect(again).toBe(room);
  });
});

describe("castVote", () => {
  it("stays in voting until both players have voted", () => {
    const room = setupRoom();
    const afterOne = castVote(room, 0, 1);
    expect(afterOne.phase).toBe("voting");
    expect(afterOne.votes[0]).toBe(1);
    expect(afterOne.votes[1]).toBeNull();
  });

  it("moves to reveal and records a match once both vote the same", () => {
    const room = setupRoom();
    let s = castVote(room, 0, 1);
    s = castVote(s, 1, 1);
    expect(s.phase).toBe("reveal");
    expect(s.results).toHaveLength(1);
    expect(s.results[0].matched).toBe(true);
    expect(s.advanceReady).toEqual([false, false]);
  });

  it("records a non-match correctly", () => {
    const room = setupRoom();
    let s = castVote(room, 0, 0);
    s = castVote(s, 1, 1);
    expect(s.results[0].matched).toBe(false);
  });

  it("ignores a duplicate vote from the same player", () => {
    const room = setupRoom();
    const afterOne = castVote(room, 0, 1);
    const again = castVote(afterOne, 0, 0);
    expect(again).toBe(afterOne);
  });

  it("is a no-op outside the voting phase", () => {
    const room = setupRoom();
    expect(castVote(room, 0, 1)).not.toBe(room);
    const waiting = createRoom("TXQP", "Ana", "host-token", 10);
    expect(castVote(waiting, 0, 1)).toBe(waiting);
  });
});

describe("confirmAdvance", () => {
  function revealedRoom(totalRounds = 10): RoomState {
    let s = setupRoom(totalRounds);
    s = castVote(s, 0, 1);
    s = castVote(s, 1, 1);
    return s;
  }

  it("stays in reveal after only one player confirms", () => {
    const room = revealedRoom();
    const s = confirmAdvance(room, 0);
    expect(s.phase).toBe("reveal");
    expect(s.advanceReady).toEqual([true, false]);
  });

  it("does not drag the other player along: currentRound only changes once both confirm", () => {
    const room = revealedRoom();
    let s = confirmAdvance(room, 0);
    expect(s.currentRound).toBe(1);
    s = confirmAdvance(s, 1);
    expect(s.currentRound).toBe(2);
  });

  it("alternates firstVoterIndex and increments the round once both confirm", () => {
    const room = revealedRoom();
    expect(room.firstVoterIndex).toBe(0);
    let s = confirmAdvance(room, 0);
    s = confirmAdvance(s, 1);
    expect(s.phase).toBe("voting");
    expect(s.currentRound).toBe(2);
    expect(s.firstVoterIndex).toBe(1);
    expect(s.advanceReady).toEqual([false, false]);
  });

  it("confirming twice from the same player is idempotent and doesn't advance alone", () => {
    const room = revealedRoom();
    let s = confirmAdvance(room, 0);
    s = confirmAdvance(s, 0);
    expect(s.phase).toBe("reveal");
    expect(s.advanceReady).toEqual([true, false]);
  });

  it("moves to summary on the last round instead of drawing another statement", () => {
    const room = revealedRoom(1);
    let s = confirmAdvance(room, 0);
    s = confirmAdvance(s, 1);
    expect(s.phase).toBe("summary");
  });

  it("is a no-op outside the reveal phase", () => {
    const room = setupRoom();
    expect(confirmAdvance(room, 0)).toBe(room);
  });
});

describe("replayRoom", () => {
  it("resets rounds/results but keeps players, drawing a fresh statement", () => {
    const room = setupRoom(1);
    let s = castVote(room, 0, 1);
    s = castVote(s, 1, 1);
    s = confirmAdvance(s, 0);
    s = confirmAdvance(s, 1); // -> summary
    s = replayRoom(s);
    expect(s.phase).toBe("voting");
    expect(s.currentRound).toBe(1);
    expect(s.results).toHaveLength(0);
    expect(s.players).toEqual(room.players);
    expect(s.currentStatement).not.toBeNull();
    expect(s.advanceReady).toEqual([false, false]);
  });

  it("is a no-op outside the summary phase", () => {
    const room = setupRoom();
    expect(replayRoom(room)).toBe(room);
  });
});

describe("toView", () => {
  it("masks the opponent's vote pre-reveal and never leaks tokens", () => {
    const room = setupRoom();
    const afterHostVote = castVote(room, 0, 1);
    const hostView = toView(afterHostVote, "host-token");
    expect(hostView.you).toBe(0);
    expect(hostView.votes[0]).toBe(1); // your own vote is visible
    expect(hostView.votes[1]).toBeNull(); // opponent's is masked
    expect(JSON.stringify(hostView)).not.toContain("token");

    const guestView = toView(afterHostVote, "guest-token");
    expect(guestView.you).toBe(1);
    expect(guestView.votes[0]).toBeNull(); // masked from the guest's perspective too
  });

  it("reveals both votes once the phase is reveal", () => {
    const room = setupRoom();
    let s = castVote(room, 0, 1);
    s = castVote(s, 1, 0);
    const view = toView(s, "host-token");
    expect(view.votes).toEqual([1, 0]);
  });

  it("exposes only player names, never tokens", () => {
    const room = setupRoom();
    const view = toView(room, "host-token");
    expect(view.players).toEqual(["Ana", "Luis"]);
  });
});
