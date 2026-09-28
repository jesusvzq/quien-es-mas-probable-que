# ¿Quién es más probable que...?

A mobile-first, two-player "pass the phone" party game, built with Next.js
(App Router), TypeScript, and Tailwind CSS. The UI is in Spanish; the
codebase (identifiers, comments, commits) is in English.

Two players sit around one phone. Each round shows a statement completing
"¿Quién es más probable que...?" (who is more likely to...?). Both players
vote in secret, passing the phone between them, and the app reveals whether
they picked the same person. At the end, a compatibility score and tier
summarize how well the two players know each other.

## Requirements

- Node.js 18.18+ (works on 18.19; Node 20+ recommended for a smoother
  `npm install` — a couple of dev dependencies emit engine warnings on 18
  but function correctly)

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build
npm run start     # run the production build
npm run lint       # ESLint
npm run test       # Vitest (game logic unit tests)
```

## Architecture

The game runs entirely client-side — no backend, database, or environment
variables are required.

- `src/lib/game/` — pure game logic, no React dependency:
  - `types.ts` — `GameState`, `Action`, phases, and shared constants.
  - `reducer.ts` — the state machine driving the game (`rules → setup → draw
    → voting1 → handoff → voting2 → reveal → ...→ summary`).
  - `statements.ts` — picks a random, not-yet-used statement from the pool.
  - `scoring.ts` — match tally, percentage, and compatibility tier lookup.
  - `*.test.ts` — Vitest unit tests for the above.
- `src/data/statements.ts` — the pool of 100 Spanish statement completions.
- `src/context/GameContext.tsx` — a `useReducer`-based provider that
  persists state to `sessionStorage` (so a refresh mid-game doesn't lose
  progress) and warns before leaving the tab mid-game.
- `src/components/Game.tsx` — switches between screens based on
  `state.phase`, animated with Framer Motion. Screens receive `state` and
  `dispatch` as props (rather than reading context directly) so that an
  exiting screen's fade-out animation keeps showing its last known state
  instead of flashing the next phase's (already-reset) data.
- `src/components/screens/` — one component per game screen.
- `src/components/ui/` — shared building blocks (buttons, progress bar, the
  rounds picker wheel, the compatibility gauge).

## Adding statements

Add new entries to the array in `src/data/statements.ts`. Each entry is the
part of the sentence that follows "¿Quién es más probable que...?" (e.g.
`"se pierda con el GPS puesto"`). Keep the pool at 100+ entries so a full
50-round game never has to repeat a statement (enforced by a unit test in
`src/lib/game/reducer.test.ts`).

## Deploying

The app is a standard Next.js project with no custom server or required
environment variables, so it deploys to Vercel with zero configuration via
`vercel` or Git import.

## Phase 2 (not implemented): online room mode

A future online mode — each player on their own phone, joined via a 4-letter
room code — was scoped but deliberately not built in this pass. It stays
opt-in: single-device mode keeps working with zero configuration regardless
of whether Phase 2 is ever implemented.

The full implementation plan — data model, API routes, client-side plan,
and the exact manual steps to provision the required Redis instance in the
Vercel dashboard — is written up in
[`docs/PHASE2_ONLINE_MODE.md`](docs/PHASE2_ONLINE_MODE.md).
