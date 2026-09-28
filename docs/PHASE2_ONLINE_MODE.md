# Phase 2: online room mode (implementation plan)

This document describes the online mode scoped in the original brief: each
player joins from their own phone via a 4-letter room code, instead of
passing one phone back and forth. **The code is implemented** (see
[Client-side plan](#client-side-plan)); what's left is the manual Vercel
setup below, done once per deployment.

Nothing here changes the existing single-device mode. It stays the default,
fully working with zero configuration; online mode only appears when the
required environment variables are present (see [Feature flag](#feature-flag)).

## Why Upstash Redis

Recommendation: **Vercel Marketplace → Upstash Redis** (free tier).

- It's a Vercel-native integration: provisioning it from the dashboard wires
  the env vars into the project automatically — no separate account/billing
  setup, no infra to run.
- Upstash's client talks over HTTPS (`@upstash/redis`), so it works from
  Vercel's Edge Runtime with low latency — a good fit for a poll-every-1.5s
  client.
- A room's entire lifetime is a couple of hours; Redis with a TTL is a
  natural fit — no schema migrations, no cleanup job needed.

Alternatives considered and rejected: WebRTC/PeerJS (still needs a
signaling server, plus NAT/firewall flakiness on mobile networks is a bad
failure mode for a casual party game); a custom relay server (reinvents what
Upstash already gives for free).

## Data model

One Redis key per room, storing the whole room as JSON, with a TTL that
Redis enforces natively (so an abandoned room just disappears — no cron job
needed).

```ts
// src/lib/online/types.ts
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
  /** Who has confirmed leaving the current `reveal` screen. The round only
   * actually advances once both are true — one player continuing never
   * drags the other along. Reset to [false, false] whenever a new `reveal`
   * phase begins. */
  advanceReady: [boolean, boolean];
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
```

Key naming: `room:{code}` → JSON-serialized `RoomState`, TTL 2 hours,
refreshed (re-set) on every write so an active game doesn't expire mid-play.

Room codes: 4 letters from an unambiguous alphabet (skip `0/O/1/I` etc.),
regenerated on collision (check `EXISTS` before writing; collisions are rare
at this scale, one retry is enough).

## Redis client wrapper

Implemented in `src/lib/online/redis.ts`. **Env var names**: the
`@upstash/redis` SDK's own `Redis.fromEnv()` looks for
`UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`, but Vercel's current
Upstash/KV marketplace integration actually injects `KV_REST_API_URL` /
`KV_REST_API_TOKEN` (plus `KV_REST_API_READ_ONLY_TOKEN`, `KV_URL`,
`REDIS_URL`, which are unused here) — so `redis.ts` does **not** use
`Redis.fromEnv()`. It reads `KV_REST_API_URL`/`KV_REST_API_TOKEN` first,
falling back to `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` for a
manually-created Upstash integration, and constructs `new Redis({ url,
token })` directly. `isOnlineModeEnabled()` is true whenever either pair is
present. The client is only constructed lazily, inside route handlers, so a
misconfigured environment never crashes anything the client can reach
directly — those routes 404 first via `isOnlineModeEnabled()`.

Room reads/writes go through `readRoom`/`writeRoom`, keyed by `roomKey(code)`
= `room:{code}`, with the TTL (2 hours) refreshed on every write.

## Room logic (pure functions, unit-testable like the existing reducer)

Keep all the state-transition logic in plain functions that take a
`RoomState` and return a new one — mirroring `src/lib/game/reducer.ts` — so
it can be unit tested the same way, independent of Redis:

```ts
// src/lib/online/room.ts
export function createRoom(code: string, hostName: string, hostToken: string, totalRounds: number): RoomState { ... }
export function joinRoom(room: RoomState, name: string, token: string): RoomState { ... }
export function castVote(room: RoomState, playerIndex: PlayerIndex, vote: PlayerIndex): RoomState { ... }
export function confirmAdvance(room: RoomState, playerIndex: PlayerIndex): RoomState { ... }
export function replayRoom(room: RoomState): RoomState { ... }
export function toView(room: RoomState, viewerToken: string): RoomView { ... }
```

`toView` is where the anti-cheat masking happens: it looks up which player
slot `viewerToken` belongs to, and nulls out the *other* slot's vote unless
`room.phase` is `"reveal"` or `"summary"`. The API routes below only ever
serialize rooms through `toView` — the raw `RoomState` (with both votes and
both tokens) never leaves the server.

`confirmAdvance` mirrors `castVote`'s two-slot pattern: it marks the caller's
`advanceReady` slot true and only performs the actual round transition (the
internal `advanceRound` helper) once *both* slots are true, resetting them
for the next reveal. One player tapping "siguiente ronda" never advances the
other player's screen — they see a "waiting for tu rival" state
(`view.advanceReady[view.you]`) until their opponent also confirms.

## API routes (Next.js Route Handlers)

All under `src/app/api/rooms/`. Use the **Edge Runtime**
(`export const runtime = "edge"`) for the poll endpoint to minimize latency;
Node runtime is fine for the rest.

| Route | Method | Purpose |
|---|---|---|
| `src/app/api/config/route.ts` | GET | `{ onlineEnabled: boolean }` — drives the feature flag on the client |
| `src/app/api/rooms/route.ts` | POST | Create a room. Body: `{ hostName, totalRounds }`. Returns `{ code, token }` |
| `src/app/api/rooms/[code]/join/route.ts` | POST | Join as player 2. Body: `{ name }`. Returns `{ token }` |
| `src/app/api/rooms/[code]/route.ts` | GET | Poll current state. Query: `?token=...`. Returns `RoomView` |
| `src/app/api/rooms/[code]/vote/route.ts` | POST | Cast a vote. Body: `{ token, vote }` |
| `src/app/api/rooms/[code]/advance/route.ts` | POST | Confirm leaving `reveal`; only advances to the next round (or `summary`) once both players have confirmed. Body: `{ token }` |
| `src/app/api/rooms/[code]/replay/route.ts` | POST | Same players, new game, fresh draw. Body: `{ token }` |

Every route:

1. Rejects with 404 if `isOnlineModeEnabled()` is false, or if the room
   doesn't exist (expired/never created).
2. Validates the caller's `token` against the room's player slots before
   accepting a mutation (400/403 otherwise).
3. Reads, applies one pure function from `room.ts`, writes back, and
   responds with `toView(...)` — never the raw state.

Example (create room):

```ts
// src/app/api/rooms/route.ts
import { NextResponse } from "next/server";
import { isOnlineModeEnabled, writeRoom } from "@/lib/online/redis";
import { createRoom, toView } from "@/lib/online/room";
import { generateRoomCode, generateToken } from "@/lib/online/ids";

export async function POST(req: Request) {
  if (!isOnlineModeEnabled()) {
    return NextResponse.json({ error: "Online mode disabled" }, { status: 404 });
  }
  const { hostName, totalRounds } = await req.json();
  // ...validate hostName/totalRounds the same way SetupScreen does client-side...

  const code = await generateRoomCode(); // retries on collision
  const token = generateToken();
  const room = createRoom(code, hostName, token, totalRounds);
  await writeRoom(room);

  return NextResponse.json({ code, token, view: toView(room, token) });
}
```

Example (poll, edge runtime):

```ts
// src/app/api/rooms/[code]/route.ts
export const runtime = "edge";

import { NextResponse } from "next/server";
import { isOnlineModeEnabled, readRoom } from "@/lib/online/redis";
import { toView } from "@/lib/online/room";

export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  if (!isOnlineModeEnabled()) {
    return NextResponse.json({ error: "Online mode disabled" }, { status: 404 });
  }
  const token = new URL(req.url).searchParams.get("token");
  const room = await readRoom(params.code.toUpperCase());
  if (!room || !token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(toView(room, token));
}
```

The `vote` and `advance` routes follow the same shape: read → validate
token → apply the pure transform → write → respond with the view.

## Client-side plan

Implemented. Online mode gets its own component tree and hook, entirely
separate from `GameContext`/`gameReducer` — `src/lib/game/types.ts`,
`reducer.ts`, and `GameState`/`Phase` are untouched, so single-device mode
behaves exactly as before once chosen.

- **Rules → mode select**: `src/components/PreGameFlow.tsx` renders in place
  of `RulesScreen` whenever `state.phase === "rules"` (wired in
  `src/components/Game.tsx`). It pre-fetches `/api/config` on mount via
  `useOnlineEnabled()` (`src/lib/online/useOnlineEnabled.ts`), so the flag is
  already known by the time the user taps "Empezar" on the (unchanged)
  `RulesScreen`. If the flag is off or still unresolved, it dispatches
  `START_SETUP` — today's exact behavior, zero visible change. If it's on, it
  shows `ModeSelectScreen` (single-device / create online / join online).
- **Per-player "ready" step**: there is no separate ready toggle. Submitting
  the name (+ rounds, for the host) form *is* the ready action, exactly like
  the existing `SetupScreen` pattern — one editable form, one submit. The
  host is placed in `waiting-for-player2` immediately after creating; the
  joiner enters the game immediately after joining.
- **`useOnlineRoom`** (`src/lib/online/useOnlineRoom.ts`) is the online
  equivalent of the reducer: `createRoom`/`joinRoom`/`castVote`/`advance`/
  `replay`/`reset`, persisting `{code, token}` to `sessionStorage`
  (`src/lib/storage.ts`) so a refresh mid-game resumes polling, and polling
  `GET /api/rooms/[code]?token=...` every ~1.5s with `AbortController`,
  paused while a mutation is in flight.
- **One reusable waiting screen**: `src/components/screens/online/WaitingScreen.tsx`
  is used at every synchronization point — the host's lobby (waiting for
  join, via `HostLobbyScreen`), mid-round (waiting for the opponent's vote,
  driven by `view.votes[view.you] !== null`), after tapping "siguiente
  ronda"/"ver resultados" on the reveal screen while the opponent hasn't
  confirmed yet (`view.advanceReady[view.you]`, both checked in
  `src/components/OnlineGame.tsx`), and as the generic "conectando..."
  fallback while a session is resuming.
- **Screens**: `src/components/OnlineGame.tsx` switches on `RoomView.phase`
  across `CreateRoomScreen`, `JoinRoomScreen`, `HostLobbyScreen`,
  `OnlineRoundScreen` (no `handoff` phase — each device shows its own voting
  screen directly), `OnlineRevealScreen`, and `OnlineSummaryScreen`, all
  under `src/components/screens/online/`. `OnlineRevealScreen`/
  `OnlineSummaryScreen` share their presentational guts with the
  single-device `RevealScreen`/`SummaryScreen` via extracted, dispatch-free
  components `src/components/screens/shared/RevealCard.tsx` and
  `SummaryCard.tsx`.
- **Sharing the room**: `HostLobbyScreen` shows the 4-letter code in large
  text plus a QR code (`qrcode` rendering to a `<canvas>`) encoding
  `${origin}/join/{code}`. `src/app/join/[code]/page.tsx` renders the same
  `<Game>` with `initialJoinCode` set: the rules screen still shows once, and
  if online mode is enabled, "Empezar" skips mode-select and jumps straight
  to the join screen with the code pre-filled (still editable); if disabled,
  it silently falls back to single-device mode.
- **Local dev testing**: open the app in two separate browser
  tabs/windows/devices — host in one, join in the other with the code shown
  in the first tab.

## Feature flag

`isOnlineModeEnabled()` (server) backs the `/api/config` route; the client
never inspects environment variables directly (they aren't available
client-side anyway). This means:

- No env vars set → `/api/config` returns `{ onlineEnabled: false }` → the
  UI is unchanged from what's live today.
- Env vars set (see below) → the option appears automatically after the
  next deploy. No client code path needs a rebuild-time flag.

## New dependencies to add when implementing

```bash
npm install @upstash/redis qrcode
npm install -D @types/qrcode
```

## Manual steps in the Vercel dashboard

Do this once per Vercel project, whenever Phase 2 is actually implemented
and ready to go live:

1. Push the Phase 2 code to the repo and make sure the project is already
   imported into Vercel (or import it now via **Add New → Project**).
2. Open the project in the Vercel dashboard → **Storage** tab → **Create
   Database**.
3. Choose **Upstash** → **Redis** from the marketplace list.
4. Pick a region close to your expected players (lower latency for the
   polling requests) and the **free tier** — a casual 2-player game is well
   within its limits.
5. Confirm creation. Vercel automatically adds several environment variables
   to the project — in the current marketplace integration these are named
   `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`,
   `KV_URL`, and `REDIS_URL` (only the first two are actually used by this
   app; a project set up before Vercel's rename might instead see
   `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` — both naming schemes
   work, see [Redis client wrapper](#redis-client-wrapper)). Vercel shows
   exactly which environments it applied them to (Production/Preview/
   Development) — leave whatever it selects checked.
6. Trigger a redeploy (or push a new commit) so the running deployment
   picks up the new environment variables — Vercel does not hot-reload env
   vars into an already-running deployment.
7. Verify: open the deployed site, tap "Empezar", and the mode-select screen
   (single-device / create online / join online) should now appear instead
   of going straight to setup. If it doesn't, check **Settings →
   Environment Variables** to confirm the URL+token pair is present under
   one of the two supported naming schemes, and check the deployment's
   **Functions** logs for `/api/config` for errors.

### Local development against the same Redis instance

To test online mode locally against the real (free-tier) Upstash instance
instead of only in deployed previews:

```bash
npm i -g vercel        # if not already installed
vercel link            # links this directory to the Vercel project, once
vercel env pull .env.local
npm run dev
```

`vercel env pull` writes whichever Redis env vars the project actually has
(`KV_REST_API_URL`/`KV_REST_API_TOKEN` or `UPSTASH_REDIS_REST_URL`/
`UPSTASH_REDIS_REST_TOKEN`, plus any other project env vars) into
`.env.local`, which Next.js loads automatically and which is already
git-ignored — never commit that file.

## Testing plan

- Unit tests for `src/lib/online/room.ts`'s pure functions, mirroring
  `src/lib/game/reducer.test.ts`: joining fills the second slot, voting
  transitions `voting → reveal` only once both votes are in, `confirmAdvance`
  only moves past `reveal` once both players have confirmed (never on just
  one), alternates `firstVoterIndex` and stops at `totalRounds` once it does,
  `toView` masks the opponent's vote pre-reveal and never leaks tokens.
- A lightweight integration test (or a manual check) hitting the route
  handlers with an in-memory fake standing in for `@upstash/redis`'s
  `get`/`set`, since the pure logic is already covered by the unit tests
  above — this just checks the HTTP wiring (status codes, token
  validation, 404s when the flag is off).
- Manual end-to-end pass with two browser windows/tabs before shipping,
  covering: create → join → vote (match and no-match) → next round →
  summary → replay, plus a room-not-found case (wrong/expired code).

## Anti-cheat summary

- The Upstash REST token is a server-only secret (env var, never sent to
  the client); the client only ever talks to this app's own API routes.
- A vote is only ever included in a poll response once **both** players
  have voted for that round (`toView`'s masking) — so there is no way to
  see the opponent's answer before committing your own, mirroring the
  single-device mode's handoff guarantee.
- Every mutation (`vote`, `advance`, `replay`) validates the caller's token
  against the room's stored player slots, so one player can't advance the
  round or vote on the other's behalf.
