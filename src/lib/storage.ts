import type { GameState } from "./game/types";

const STORAGE_KEY = "qmp-game-state";

export function saveState(state: GameState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage may be unavailable (private mode, disabled storage); ignore.
  }
}

export function loadState(): GameState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GameState) : null;
  } catch {
    return null;
  }
}

export type OnlineSession = { code: string; token: string };

const ONLINE_SESSION_KEY = "qmp-online-room";

export function saveOnlineSession(session: OnlineSession): void {
  try {
    localStorage.setItem(ONLINE_SESSION_KEY, JSON.stringify(session));
  } catch {
    // localStorage may be unavailable (private mode, disabled storage); ignore.
  }
}

export function loadOnlineSession(): OnlineSession | null {
  try {
    const raw = localStorage.getItem(ONLINE_SESSION_KEY);
    return raw ? (JSON.parse(raw) as OnlineSession) : null;
  } catch {
    return null;
  }
}

export function clearOnlineSession(): void {
  try {
    localStorage.removeItem(ONLINE_SESSION_KEY);
  } catch {
    // ignore
  }
}
