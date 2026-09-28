"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import { createInitialState, gameReducer } from "@/lib/game/reducer";
import type { Action, GameState } from "@/lib/game/types";
import { loadState, saveState } from "@/lib/storage";

type GameContextValue = {
  state: GameState;
  dispatch: React.Dispatch<Action>;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, createInitialState());
  const [hydrated, setHydrated] = useState(false);

  // Session storage is only readable client-side, so hydrating in an effect
  // (rather than the reducer's lazy init) keeps the first client render
  // identical to the server-rendered HTML and avoids a hydration mismatch.
  // Setting `hydrated` in the same effect as the HYDRATE dispatch lets React
  // batch both updates together, so the persist effect below never observes
  // hydrated=true paired with the old, pre-hydration state (which would
  // overwrite the just-loaded storage with the initial state).
  useEffect(() => {
    const stored = loadState();
    if (stored) dispatch({ type: "HYDRATE", state: stored });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [state, hydrated]);

  useEffect(() => {
    const isMidGame = state.phase !== "rules" && state.phase !== "summary";
    if (!isMidGame) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state.phase]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
