import { Redis } from "@upstash/redis";
import { randomRoomCode } from "./codes";
import type { RoomState } from "./types";

// Vercel's Upstash/KV marketplace integration injects KV_REST_API_URL /
// KV_REST_API_TOKEN; a manually-created Upstash Redis integration (or
// `vercel env pull` against an older project) may instead use
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. Accept either.
function credentialsFromEnv(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export function isOnlineModeEnabled(): boolean {
  return credentialsFromEnv() !== null;
}

// Only constructed when the routes that need it are actually invoked, which
// only happens when isOnlineModeEnabled() is true — the client never links
// to those routes otherwise.
function getRedis(): Redis {
  const credentials = credentialsFromEnv();
  if (!credentials) {
    throw new Error("Redis is not configured (see isOnlineModeEnabled)");
  }
  return new Redis(credentials);
}

const ROOM_TTL_SECONDS = 60 * 30; // 30 minutes

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
