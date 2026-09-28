import type { PlayerIndex } from "@/lib/game/types";
import type { RoomState } from "./types";

/** Returns which player slot `token` belongs to, or null if it matches neither. */
export function findPlayerIndex(
  room: RoomState,
  token: string
): PlayerIndex | null {
  const index = room.players.findIndex((p) => p?.token === token);
  return index === 0 || index === 1 ? (index as PlayerIndex) : null;
}
