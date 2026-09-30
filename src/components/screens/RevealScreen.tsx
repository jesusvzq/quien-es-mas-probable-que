"use client";

import { RevealCard } from "@/components/screens/shared/RevealCard";
import type { Action, GameState } from "@/lib/game/types";

export function RevealScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}) {
  const lastResult = state.results[state.results.length - 1];
  if (!state.players || !lastResult) return null;

  const isLastRound = state.currentRound >= state.totalRounds;

  return (
    <RevealCard
      players={state.players}
      lastResult={lastResult}
      isLastRound={isLastRound}
      onContinue={() =>
        dispatch({ type: isLastRound ? "FINISH_GAME" : "NEXT_ROUND" })
      }
      onFinish={() => dispatch({ type: "FINISH_GAME" })}
    />
  );
}
