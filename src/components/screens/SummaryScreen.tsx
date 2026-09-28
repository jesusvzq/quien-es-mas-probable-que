"use client";

import { useState } from "react";
import { BigButton } from "@/components/ui/BigButton";
import { CompatMeter } from "@/components/ui/CompatMeter";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { computeSummary, countVotesPerPlayer } from "@/lib/game/scoring";
import type { Action, GameState } from "@/lib/game/types";

export function SummaryScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}) {
  const [copied, setCopied] = useState(false);

  if (!state.players) return null;
  const [p0, p1] = state.players;
  const summary = computeSummary(state.results);
  const [votes0, votes1] = countVotesPerPlayer(state.results);
  const mostLikely =
    votes0 === votes1 ? null : votes0 > votes1 ? p0 : p1;

  const shareText = `¡Hemos coincidido en ${summary.matches} de ${summary.total} rondas (${summary.percentage}%) jugando a "¿Quién es más probable que...?"! ${summary.tier.emoji} ${summary.tier.label}`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch {
        // user cancelled or share failed; fall back to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable; silently ignore
    }
  }

  return (
    <ScreenShell>
      <div className="text-center">
        <h2 className="text-2xl font-extrabold">
          ¡Habéis coincidido en {summary.matches} de {summary.total}!
        </h2>
      </div>

      <CompatMeter percentage={summary.percentage} />

      <div className="text-center">
        <p className="text-2xl font-bold">
          {summary.tier.emoji} {summary.tier.label}
        </p>
        <p className="mt-1 text-sm text-foreground/60">
          {summary.tier.comment}
        </p>
      </div>

      {mostLikely && (
        <p className="text-center text-sm text-foreground/60">
          Curiosidad: {mostLikely} fue el elegido más veces en la partida.
        </p>
      )}

      <div className="max-h-64 overflow-y-auto rounded-2xl bg-surface p-4 shadow-sm">
        <ul className="flex flex-col gap-2 text-sm">
          {state.results.map((r) => (
            <li
              key={r.round}
              className="flex items-start justify-between gap-2 border-b border-foreground/5 pb-2 last:border-0 last:pb-0"
            >
              <div>
                <p className="font-semibold">Ronda {r.round}</p>
                <p className="text-foreground/60">{r.statement}</p>
                <p className="text-foreground/50">
                  {p0}: {state.players?.[r.votes[0]]} · {p1}:{" "}
                  {state.players?.[r.votes[1]]}
                </p>
              </div>
              <span className="text-lg">{r.matched ? "✅" : "❌"}</span>
            </li>
          ))}
        </ul>
      </div>

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
        <BigButton variant="ghost" onClick={handleShare}>
          {copied ? "¡Copiado!" : "Compartir resultado"}
        </BigButton>
      </div>
    </ScreenShell>
  );
}
