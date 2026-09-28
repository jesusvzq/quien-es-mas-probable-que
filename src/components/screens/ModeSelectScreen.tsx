"use client";

import { BigButton } from "@/components/ui/BigButton";
import { ScreenShell } from "@/components/ui/ScreenShell";

export function ModeSelectScreen({
  onSingleDevice,
  onCreate,
  onJoin,
}: {
  onSingleDevice: () => void;
  onCreate: () => void;
  onJoin: () => void;
}) {
  return (
    <ScreenShell>
      <div className="text-center">
        <h2 className="text-2xl font-extrabold">¿Cómo queréis jugar?</h2>
        <p className="mt-2 text-sm text-foreground/60">
          En el mismo móvil o cada uno desde el suyo.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <BigButton onClick={onSingleDevice}>Jugar en este móvil</BigButton>
        <BigButton variant="secondary" onClick={onCreate}>
          Crear partida online
        </BigButton>
        <BigButton variant="ghost" onClick={onJoin}>
          Unirse a partida online
        </BigButton>
      </div>
    </ScreenShell>
  );
}
