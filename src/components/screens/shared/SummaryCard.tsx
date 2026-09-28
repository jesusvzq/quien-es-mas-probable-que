"use client";

import { CompatMeter } from "@/components/ui/CompatMeter";
import { computeSummary, countVotesPerPlayer } from "@/lib/game/scoring";
import type { RoundResult } from "@/lib/game/types";

export function SummaryCard({
  players,
  results,
}: {
  players: [string, string];
  results: RoundResult[];
}) {
  const [p0, p1] = players;
  const summary = computeSummary(results);
  const [votes0, votes1] = countVotesPerPlayer(results);
  const mostLikely = votes0 === votes1 ? null : votes0 > votes1 ? p0 : p1;

  return (
    <>
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
          {results.map((r) => (
            <li
              key={r.round}
              className="flex items-start justify-between gap-2 border-b border-foreground/5 pb-2 last:border-0 last:pb-0"
            >
              <div>
                <p className="font-semibold">Ronda {r.round}</p>
                <p className="text-foreground/60">{r.statement}</p>
                <p className="text-foreground/50">
                  {p0}: {players[r.votes[0]]} · {p1}: {players[r.votes[1]]}
                </p>
              </div>
              <span className="text-lg">{r.matched ? "✅" : "❌"}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
