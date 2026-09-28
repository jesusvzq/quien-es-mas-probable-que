"use client";

import { useState } from "react";
import { OnlineGame } from "@/components/OnlineGame";
import { ModeSelectScreen } from "@/components/screens/ModeSelectScreen";
import { RulesScreen } from "@/components/screens/RulesScreen";
import type { Action } from "@/lib/game/types";
import { useOnlineEnabled } from "@/lib/online/useOnlineEnabled";

type Stage =
  | { name: "rules" }
  | { name: "mode-select" }
  | { name: "online"; mode: "create" | "join" };

export function PreGameFlow({
  dispatch,
  initialJoinCode,
}: {
  dispatch: React.Dispatch<Action>;
  initialJoinCode?: string;
}) {
  const onlineEnabled = useOnlineEnabled();
  const [stage, setStage] = useState<Stage>({ name: "rules" });

  if (stage.name === "rules") {
    return (
      <RulesScreen
        onContinue={() => {
          if (onlineEnabled) {
            setStage(
              initialJoinCode
                ? { name: "online", mode: "join" }
                : { name: "mode-select" }
            );
          } else {
            dispatch({ type: "START_SETUP" });
          }
        }}
      />
    );
  }

  if (stage.name === "mode-select") {
    return (
      <ModeSelectScreen
        onSingleDevice={() => dispatch({ type: "START_SETUP" })}
        onCreate={() => setStage({ name: "online", mode: "create" })}
        onJoin={() => setStage({ name: "online", mode: "join" })}
      />
    );
  }

  return (
    <OnlineGame
      mode={stage.mode}
      initialCode={initialJoinCode}
      onExitToMenu={() => setStage({ name: "mode-select" })}
    />
  );
}
