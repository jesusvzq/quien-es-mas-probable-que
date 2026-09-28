"use client";

import { BigButton } from "@/components/ui/BigButton";
import { ScreenShell } from "@/components/ui/ScreenShell";

const RULES = [
  'Aparece una frase: "¿Quién es más probable que...?".',
  "Jugando en el mismo móvil, cada uno vota en secreto pasándoos el teléfono; jugando a distancia, cada uno vota desde su propio móvil a la vez.",
  "Podéis votaros a vosotros mismos.",
  "Si votáis a la misma persona, sumáis un punto entre los dos: la puntuación es común.",
  "Al final descubriréis cuánto os conocéis.",
];

export function RulesScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <ScreenShell>
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-primary">
          ¿Quién es más probable que...?
        </h1>
        <p className="mt-2 text-foreground/70">Un juego para dos</p>
      </div>

      <ol className="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-sm">
        {RULES.map((rule, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {i + 1}
            </span>
            {rule}
          </li>
        ))}
      </ol>

      <BigButton onClick={onContinue}>Empezar</BigButton>
    </ScreenShell>
  );
}
