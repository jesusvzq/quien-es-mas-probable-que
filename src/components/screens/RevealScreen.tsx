"use client";

import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BigButton } from "@/components/ui/BigButton";
import { ScreenShell } from "@/components/ui/ScreenShell";
import type { Action, GameState } from "@/lib/game/types";

const NO_MATCH_MESSAGES = [
  "¡Vaya, no coincidís! La próxima seguro que sí.",
  "Cada uno a su rollo. ¡No pasa nada!",
  "Puntos de vista distintos, ¡qué interesante!",
];

export function RevealScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}) {
  const [suspense, setSuspense] = useState(true);

  const lastResult = state.results[state.results.length - 1];

  useEffect(() => {
    const timer = setTimeout(() => setSuspense(false), 900);
    return () => clearTimeout(timer);
  }, [lastResult]);

  useEffect(() => {
    if (!suspense && lastResult?.matched) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        disableForReducedMotion: true,
      });
    }
  }, [suspense, lastResult]);

  if (!state.players || !lastResult) return null;
  const [p0, p1] = state.players;
  const noMatchMessage =
    NO_MATCH_MESSAGES[state.currentRound % NO_MATCH_MESSAGES.length];

  const isLastRound = state.currentRound >= state.totalRounds;

  return (
    <ScreenShell>
      <div className="flex min-h-[16rem] flex-col items-center justify-center gap-4 rounded-2xl bg-surface p-6 text-center shadow-sm">
        {suspense ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            className="text-4xl"
          >
            🔮
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-3"
          >
            <p className="text-sm text-foreground/60">
              {p0} votó a{" "}
              <strong>{state.players[lastResult.votes[0]]}</strong>
            </p>
            <p className="text-sm text-foreground/60">
              {p1} votó a{" "}
              <strong>{state.players[lastResult.votes[1]]}</strong>
            </p>
            {lastResult.matched ? (
              <p className="text-xl font-extrabold text-green-600">
                ¡Coincidís! 🎉
              </p>
            ) : (
              <p className="text-lg font-semibold text-foreground/70">
                ¡No coincidís! {noMatchMessage}
              </p>
            )}
          </motion.div>
        )}
      </div>

      {!suspense && (
        <BigButton
          onClick={() =>
            dispatch({ type: isLastRound ? "FINISH_GAME" : "NEXT_ROUND" })
          }
        >
          {isLastRound ? "Ver resultados" : "Siguiente ronda"}
        </BigButton>
      )}
    </ScreenShell>
  );
}
