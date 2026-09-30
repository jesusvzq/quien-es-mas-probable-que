"use client";

import { useState } from "react";
import { BigButton } from "@/components/ui/BigButton";
import { DevCredit } from "@/components/ui/DevCredit";
import { RoundsWheel } from "@/components/ui/RoundsWheel";
import { ScreenShell } from "@/components/ui/ScreenShell";
import type { Action } from "@/lib/game/types";
import { MAX_NAME_LENGTH, MAX_ROUNDS, MIN_ROUNDS } from "@/lib/game/types";

export function SetupScreen({
  dispatch,
  onBack,
}: {
  dispatch: React.Dispatch<Action>;
  onBack?: () => void;
}) {
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [rounds, setRounds] = useState(MIN_ROUNDS);
  const [touched, setTouched] = useState(false);

  const trimmed1 = name1.trim();
  const trimmed2 = name2.trim();
  const errors: string[] = [];
  if (touched) {
    if (!trimmed1 || !trimmed2) errors.push("Escribid los dos nombres.");
    if (
      trimmed1 &&
      trimmed2 &&
      trimmed1.toLowerCase() === trimmed2.toLowerCase()
    ) {
      errors.push("Los nombres deben ser diferentes.");
    }
  }

  const isValid =
    trimmed1.length > 0 &&
    trimmed2.length > 0 &&
    trimmed1.toLowerCase() !== trimmed2.toLowerCase();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    dispatch({
      type: "CONFIRM_SETUP",
      players: [trimmed1, trimmed2],
      totalRounds: rounds,
    });
  }

  return (
    <ScreenShell>
      <DevCredit />
      <h2 className="text-center text-2xl font-extrabold">
        ¿Quiénes juegan?
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Jugador 1
          <input
            type="text"
            value={name1}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) => setName1(e.target.value)}
            placeholder="Nombre"
            className="rounded-xl border-2 border-foreground/10 bg-surface px-4 py-3 text-base font-normal focus:border-primary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold">
          Jugador 2
          <input
            type="text"
            value={name2}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) => setName2(e.target.value)}
            placeholder="Nombre"
            className="rounded-xl border-2 border-foreground/10 bg-surface px-4 py-3 text-base font-normal focus:border-primary focus:outline-none"
          />
        </label>

        {errors.length > 0 && (
          <div className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-600">
            {errors[0]}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Número de rondas</span>
          <RoundsWheel
            min={MIN_ROUNDS}
            max={MAX_ROUNDS}
            value={rounds}
            onChange={setRounds}
          />
        </div>

        <BigButton type="submit">Elegir quién empieza</BigButton>
        {onBack && (
          <BigButton type="button" variant="ghost" onClick={onBack}>
            Volver
          </BigButton>
        )}
      </form>
    </ScreenShell>
  );
}
