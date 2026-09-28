"use client";

import { SummaryCard } from "@/components/screens/shared/SummaryCard";
import { BigButton } from "@/components/ui/BigButton";
import { ScreenShell } from "@/components/ui/ScreenShell";
import type { RoomView } from "@/lib/online/types";

export function OnlineSummaryScreen({
  view,
  onReplay,
  onExitToMenu,
}: {
  view: RoomView;
  onReplay: () => void;
  onExitToMenu: () => void;
}) {
  const [p0, p1] = view.players;
  if (!p0 || !p1) return null;

  return (
    <ScreenShell>
      <SummaryCard players={[p0, p1]} results={view.results} />

      <div className="flex flex-col gap-3">
        <BigButton onClick={onReplay}>Jugar otra vez</BigButton>
        <BigButton variant="secondary" onClick={onExitToMenu}>
          Salir
        </BigButton>
      </div>
    </ScreenShell>
  );
}
