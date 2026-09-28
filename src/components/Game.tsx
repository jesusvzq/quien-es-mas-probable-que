"use client";

import { AnimatePresence } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { DrawScreen } from "@/components/screens/DrawScreen";
import { RevealScreen } from "@/components/screens/RevealScreen";
import { RoundScreen } from "@/components/screens/RoundScreen";
import { SetupScreen } from "@/components/screens/SetupScreen";
import { SummaryScreen } from "@/components/screens/SummaryScreen";
import { PreGameFlow } from "@/components/PreGameFlow";

export function Game({ initialJoinCode }: { initialJoinCode?: string } = {}) {
  const { state, dispatch } = useGame();

  // Screens receive `state`/`dispatch` as props (rather than reading the
  // GameContext directly) so that when AnimatePresence keeps an outgoing
  // screen mounted for its exit animation, it keeps rendering the state it
  // last had instead of re-rendering with the already-updated live context
  // (which would flash the next phase's reset data, e.g. "0 de 0").
  return (
    <AnimatePresence mode="wait">
      {state.phase === "rules" && (
        <PreGameFlow
          key="rules"
          dispatch={dispatch}
          initialJoinCode={initialJoinCode}
        />
      )}
      {state.phase === "setup" && (
        <SetupScreen key="setup" dispatch={dispatch} />
      )}
      {state.phase === "draw" && (
        <DrawScreen key="draw" state={state} dispatch={dispatch} />
      )}
      {(state.phase === "voting1" ||
        state.phase === "handoff" ||
        state.phase === "voting2") && (
        <RoundScreen
          key={`round-${state.phase}-${state.currentRound}`}
          state={state}
          dispatch={dispatch}
        />
      )}
      {state.phase === "reveal" && (
        <RevealScreen
          key={`reveal-${state.currentRound}`}
          state={state}
          dispatch={dispatch}
        />
      )}
      {state.phase === "summary" && (
        <SummaryScreen key="summary" state={state} dispatch={dispatch} />
      )}
    </AnimatePresence>
  );
}
