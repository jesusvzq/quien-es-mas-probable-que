"use client";

import { CreateRoomScreen } from "@/components/screens/online/CreateRoomScreen";
import { HostLobbyScreen } from "@/components/screens/online/HostLobbyScreen";
import { JoinRoomScreen } from "@/components/screens/online/JoinRoomScreen";
import { OnlineRevealScreen } from "@/components/screens/online/OnlineRevealScreen";
import { OnlineRoundScreen } from "@/components/screens/online/OnlineRoundScreen";
import { OnlineSummaryScreen } from "@/components/screens/online/OnlineSummaryScreen";
import { WaitingScreen } from "@/components/screens/online/WaitingScreen";
import { BigButton } from "@/components/ui/BigButton";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { useOnlineRoom } from "@/lib/online/useOnlineRoom";

export function OnlineGame({
  mode,
  initialCode,
  onExitToMenu,
}: {
  mode: "create" | "join";
  initialCode?: string;
  onExitToMenu: () => void;
}) {
  const room = useOnlineRoom();

  if (!room.code) {
    return mode === "create" ? (
      <CreateRoomScreen
        onCreate={room.createRoom}
        pending={room.status === "working"}
        error={room.error}
        onBack={onExitToMenu}
      />
    ) : (
      <JoinRoomScreen
        initialCode={initialCode}
        onJoin={room.joinRoom}
        pending={room.status === "working"}
        error={room.error}
        onBack={onExitToMenu}
      />
    );
  }

  if (room.status === "error") {
    return (
      <ScreenShell>
        <div className="rounded-2xl bg-surface p-6 text-center shadow-sm">
          <p className="text-lg font-semibold">
            {room.error ?? "Esta sala ya no existe."}
          </p>
        </div>
        <BigButton
          onClick={() => {
            room.reset();
            onExitToMenu();
          }}
        >
          Volver al menú
        </BigButton>
      </ScreenShell>
    );
  }

  const { view } = room;
  if (!view) {
    return <WaitingScreen message="Conectando..." />;
  }

  if (view.phase === "waiting-for-player2") {
    return <HostLobbyScreen code={view.code} />;
  }

  if (view.phase === "voting") {
    const myVote = view.votes[view.you];
    if (myVote !== null) {
      return <WaitingScreen message="Esperando el voto de tu rival..." />;
    }
    return <OnlineRoundScreen view={view} onVote={room.castVote} />;
  }

  if (view.phase === "reveal") {
    if (view.advanceReady[view.you]) {
      return <WaitingScreen message="Esperando a que tu rival continúe..." />;
    }
    return <OnlineRevealScreen view={view} onAdvance={room.advance} />;
  }

  return (
    <OnlineSummaryScreen
      view={view}
      onReplay={room.replay}
      onExitToMenu={() => {
        room.reset();
        onExitToMenu();
      }}
    />
  );
}
