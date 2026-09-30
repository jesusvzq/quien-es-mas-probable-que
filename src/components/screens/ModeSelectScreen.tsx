"use client";

import { BigButton } from "@/components/ui/BigButton";
import { DevCredit } from "@/components/ui/DevCredit";
import { ScreenShell } from "@/components/ui/ScreenShell";

export function ModeSelectScreen({
  onSingleDevice,
  onCreate,
  onJoin,
  onBack,
}: {
  onSingleDevice: () => void;
  onCreate: () => void;
  onJoin: () => void;
  onBack: () => void;
}) {
  return (
    <ScreenShell>
      <DevCredit />
      <div className="text-center">
        <h2 className="text-2xl font-extrabold">¿Cómo queréis jugar?</h2>
        <p className="mt-2 text-sm text-foreground/60">
          En el mismo dispositivo o cada uno desde el suyo.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <BigButton onClick={onSingleDevice}>Jugar en este dispositivo</BigButton>
        <BigButton variant="secondary" onClick={onCreate}>
          Crear partida online
        </BigButton>
        <BigButton variant="ghost" onClick={onJoin}>
          Unirse a partida online
        </BigButton>
        <BigButton variant="ghost" onClick={onBack}>
          Volver
        </BigButton>
      </div>
    </ScreenShell>
  );
}
