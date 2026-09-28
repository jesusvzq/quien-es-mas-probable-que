"use client";

import { SummaryCard } from "@/components/screens/shared/SummaryCard";
import { BigButton } from "@/components/ui/BigButton";
import { ScreenShell } from "@/components/ui/ScreenShell";
import type { Action, GameState } from "@/lib/game/types";

export function SummaryScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}) {
  if (!state.players) return null;

  return (
    <ScreenShell>
      <SummaryCard players={state.players} results={state.results} />

      <div className="flex flex-col gap-3">
        <BigButton onClick={() => dispatch({ type: "REPLAY_SAME_PLAYERS" })}>
          Jugar otra vez
        </BigButton>
        <BigButton
          variant="secondary"
          onClick={() => dispatch({ type: "CHANGE_PLAYERS" })}
        >
          Cambiar jugadores
        </BigButton>
      </div>
    </ScreenShell>
  );
}
