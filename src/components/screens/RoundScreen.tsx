"use client";

import { useState } from "react";
import { BigButton } from "@/components/ui/BigButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScreenShell } from "@/components/ui/ScreenShell";
import type { Action, GameState, PlayerIndex } from "@/lib/game/types";

export function RoundScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}) {
  const [pending, setPending] = useState(false);

  if (!state.players || !state.currentStatement) return null;
  const [p0, p1] = state.players;
  const otherIndex: PlayerIndex = state.firstVoterIndex === 0 ? 1 : 0;

  if (state.phase === "handoff") {
    const secondVoterName = state.players[otherIndex];
    return (
      <ScreenShell>
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-foreground/50">
            Ronda {state.currentRound} de {state.totalRounds}
          </p>
          <ProgressBar
            progress={(state.currentRound - 1) / state.totalRounds}
          />
        </div>

        <div className="rounded-2xl bg-surface p-6 text-center shadow-sm">
          <p className="text-lg font-semibold">
            Es el turno de {secondVoterName}
          </p>
          <p className="mt-2 text-sm text-foreground/60">
            Que nadie más mire la pantalla.
          </p>
        </div>

        <BigButton
          variant="secondary"
          onClick={() => dispatch({ type: "ARRIVE_AT_SECOND_VOTER" })}
        >
          Soy {secondVoterName}
        </BigButton>
      </ScreenShell>
    );
  }

  const voterIndex: PlayerIndex =
    state.phase === "voting1" ? state.firstVoterIndex : otherIndex;
  const voterName = state.players[voterIndex];

  function handleVote(playerIndex: PlayerIndex) {
    if (pending) return;
    setPending(true);
    dispatch({ type: "CAST_VOTE", playerIndex });
    setPending(false);
  }

  return (
    <ScreenShell>
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-foreground/50">
          Ronda {state.currentRound} de {state.totalRounds}
        </p>
        <ProgressBar progress={(state.currentRound - 1) / state.totalRounds} />
      </div>

      <div className="rounded-2xl bg-surface p-6 text-center shadow-sm">
        <h2 className="text-lg font-bold text-primary">
          ¿Quién es más probable que...?
        </h2>
        <p className="mt-2 text-xl font-semibold">
          {state.currentStatement}
        </p>
      </div>

      <p className="text-center text-sm text-foreground/60">
        Vota {voterName}
      </p>

      <div className="flex flex-col gap-3">
        <BigButton disabled={pending} onClick={() => handleVote(0)}>
          {p0}
        </BigButton>
        <BigButton
          variant="secondary"
          disabled={pending}
          onClick={() => handleVote(1)}
        >
          {p1}
        </BigButton>
      </div>
    </ScreenShell>
  );
}
