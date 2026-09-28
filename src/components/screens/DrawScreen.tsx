"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { ScreenShell } from "@/components/ui/ScreenShell";
import type { Action, GameState, PlayerIndex } from "@/lib/game/types";

const SPIN_DURATION_MS = 1600;

export function DrawScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}) {
  const [revealed, setRevealed] = useState(false);
  const chosen = useMemo<PlayerIndex>(() => (Math.random() < 0.5 ? 0 : 1), []);

  useEffect(() => {
    const revealTimer = setTimeout(() => setRevealed(true), SPIN_DURATION_MS);
    const advanceTimer = setTimeout(
      () => dispatch({ type: "FINISH_DRAW", firstVoterIndex: chosen }),
      SPIN_DURATION_MS + 1200
    );
    return () => {
      clearTimeout(revealTimer);
      clearTimeout(advanceTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!state.players) return null;
  const winnerName = state.players[chosen];

  return (
    <ScreenShell>
      <h2 className="text-center text-2xl font-extrabold">
        ¿Quién vota primero?
      </h2>

      <div className="flex items-center justify-center py-8">
        <motion.div
          className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-4xl shadow-xl"
          animate={
            revealed ? { rotate: 0, scale: 1.1 } : { rotate: 1080 }
          }
          transition={
            revealed
              ? { type: "spring", stiffness: 200, damping: 12 }
              : { duration: SPIN_DURATION_MS / 1000, ease: "easeInOut" }
          }
        >
          🪙
        </motion.div>
      </div>

      <div className="h-10 text-center text-xl font-bold">
        {revealed ? `¡${winnerName} empieza!` : "Girando..."}
      </div>
    </ScreenShell>
  );
}
