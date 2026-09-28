import { Redis } from "@upstash/redis";
import { randomRoomCode } from "./codes";
import type { RoomState } from "./types";

export function isOnlineModeEnabled(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

// Only constructed when the routes that need it are actually invoked, which
// only happens when isOnlineModeEnabled() is true — the client never links
// to those routes otherwise.
function getRedis(): Redis {
  return Redis.fromEnv();
}

const ROOM_TTL_SECONDS = 60 * 60 * 2; // 2 hours

export function roomKey(code: string): string {
  return `room:${code}`;
}

export async function readRoom(code: string): Promise<RoomState | null> {
  return getRedis().get<RoomState>(roomKey(code));
}

export async function writeRoom(state: RoomState): Promise<void> {
  await getRedis().set(roomKey(state.code), state, { ex: ROOM_TTL_SECONDS });
}

/** Generates a room code with no active room, retrying once on collision
 * (collisions are rare at this scale, so a single retry is enough). */
export async function generateUniqueRoomCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomRoomCode();
    const existing = await readRoom(code);
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique room code");
}
