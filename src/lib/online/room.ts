import { pickStatement } from "@/lib/game/statements";
import type { PlayerIndex } from "@/lib/game/types";
import type { RoomState, RoomView } from "./types";

export function createRoom(
  code: string,
  hostName: string,
  hostToken: string,
  totalRounds: number
): RoomState {
  return {
    code,
    createdAt: Date.now(),
    totalRounds,
    currentRound: 1,
    firstVoterIndex: 0,
    usedStatements: [],
    currentStatement: null,
    votes: [null, null],
    results: [],
    phase: "waiting-for-player2",
    players: [{ name: hostName, token: hostToken }, null],
  };
}

export function joinRoom(
  room: RoomState,
  name: string,
  token: string
): RoomState {
  if (room.phase !== "waiting-for-player2" || room.players[1] !== null) {
    return room;
  }
  const statement = pickStatement(room.usedStatements);
  return {
    ...room,
    players: [room.players[0], { name, token }],
    usedStatements: [...room.usedStatements, statement],
    currentStatement: statement,
    phase: "voting",
  };
}

export function castVote(
  room: RoomState,
  playerIndex: PlayerIndex,
  vote: PlayerIndex
): RoomState {
  if (room.phase !== "voting") return room;
  if (room.votes[playerIndex] !== null) return room; // already voted, idempotent

  const votes: [PlayerIndex | null, PlayerIndex | null] = [...room.votes];
  votes[playerIndex] = vote;

  const otherIndex: PlayerIndex = playerIndex === 0 ? 1 : 0;
  const otherVote = votes[otherIndex];
  if (otherVote === null) {
    return { ...room, votes };
  }

  const finalVotes: [PlayerIndex, PlayerIndex] =
    playerIndex === 0 ? [vote, otherVote] : [otherVote, vote];
  const matched = finalVotes[0] === finalVotes[1];

  return {
    ...room,
    votes: finalVotes,
    results: [
      ...room.results,
      {
        statement: room.currentStatement ?? "",
        round: room.currentRound,
        votes: finalVotes,
        matched,
      },
    ],
    phase: "reveal",
  };
}

export function advanceRound(room: RoomState): RoomState {
  if (room.phase !== "reveal") return room;
  if (room.currentRound >= room.totalRounds) {
    return { ...room, phase: "summary" };
  }
  const statement = pickStatement(room.usedStatements);
  const nextFirstVoter: PlayerIndex = room.firstVoterIndex === 0 ? 1 : 0;
  return {
    ...room,
    currentRound: room.currentRound + 1,
    firstVoterIndex: nextFirstVoter,
    usedStatements: [...room.usedStatements, statement],
    currentStatement: statement,
    votes: [null, null],
    phase: "voting",
  };
}

export function replayRoom(room: RoomState): RoomState {
  if (room.phase !== "summary") return room;
  const statement = pickStatement([]);
  return {
    ...room,
    currentRound: 1,
    firstVoterIndex: 0,
    usedStatements: [statement],
    currentStatement: statement,
    votes: [null, null],
    results: [],
    phase: "voting",
  };
}

export function toView(room: RoomState, viewerToken: string): RoomView {
  const you = room.players.findIndex(
    (p) => p?.token === viewerToken
  ) as PlayerIndex;

  const revealVotes = room.phase === "reveal" || room.phase === "summary";
  const votes: [PlayerIndex | null, PlayerIndex | null] = [null, null];
  const otherIndex: PlayerIndex = you === 0 ? 1 : 0;
  votes[you] = room.votes[you];
  votes[otherIndex] = revealVotes ? room.votes[otherIndex] : null;

  return {
    code: room.code,
    createdAt: room.createdAt,
    totalRounds: room.totalRounds,
    currentRound: room.currentRound,
    firstVoterIndex: room.firstVoterIndex,
    usedStatements: room.usedStatements,
    currentStatement: room.currentStatement,
    results: room.results,
    phase: room.phase,
    players: [room.players[0]?.name ?? null, room.players[1]?.name ?? null],
    votes,
    you,
  };
}
