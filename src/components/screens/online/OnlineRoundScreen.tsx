"use client";

import { useState } from "react";
import { BigButton } from "@/components/ui/BigButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScreenShell } from "@/components/ui/ScreenShell";
import type { PlayerIndex } from "@/lib/game/types";
import type { RoomView } from "@/lib/online/types";

export function OnlineRoundScreen({
  view,
  onVote,
}: {
  view: RoomView;
  onVote: (vote: PlayerIndex) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [p0, p1] = view.players;
  if (!p0 || !p1 || !view.currentStatement) return null;

  async function handleVote(vote: PlayerIndex) {
    if (pending) return;
    setPending(true);
    try {
      await onVote(vote);
    } finally {
      setPending(false);
    }
  }

  return (
    <ScreenShell>
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-foreground/50">
          Ronda {view.currentRound} de {view.totalRounds}
        </p>
        <ProgressBar progress={(view.currentRound - 1) / view.totalRounds} />
      </div>

      <div className="rounded-2xl bg-surface p-6 text-center shadow-sm">
        <h2 className="text-lg font-bold text-primary">
          ¿Quién es más probable que...?
        </h2>
        <p className="mt-2 text-xl font-semibold">{view.currentStatement}</p>
      </div>

      <p className="text-center text-sm text-foreground/60">Vota</p>

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
