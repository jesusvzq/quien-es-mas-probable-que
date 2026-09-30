"use client";

import { RevealCard } from "@/components/screens/shared/RevealCard";
import type { RoomView } from "@/lib/online/types";

export function OnlineRevealScreen({
  view,
  onAdvance,
  onFinish,
}: {
  view: RoomView;
  onAdvance: () => void;
  onFinish: () => void;
}) {
  const lastResult = view.results[view.results.length - 1];
  const [p0, p1] = view.players;
  if (!p0 || !p1 || !lastResult) return null;

  const isLastRound = view.currentRound >= view.totalRounds;

  return (
    <RevealCard
      players={[p0, p1]}
      lastResult={lastResult}
      isLastRound={isLastRound}
      onContinue={onAdvance}
      onFinish={onFinish}
    />
  );
}
