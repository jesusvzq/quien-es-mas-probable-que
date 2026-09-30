"use client";

import { useState } from "react";
import { OnlineGame } from "@/components/OnlineGame";
import { ModeSelectScreen } from "@/components/screens/ModeSelectScreen";
import { RulesScreen } from "@/components/screens/RulesScreen";
import { SetupScreen } from "@/components/screens/SetupScreen";
import type { Action } from "@/lib/game/types";
import { useOnlineEnabled } from "@/lib/online/useOnlineEnabled";

type Stage =
  | { name: "rules" }
  | { name: "mode-select" }
  | { name: "setup" }
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
            setStage({ name: "setup" });
          }
        }}
      />
    );
  }

  if (stage.name === "mode-select") {
    return (
      <ModeSelectScreen
        onSingleDevice={() => setStage({ name: "setup" })}
        onCreate={() => setStage({ name: "online", mode: "create" })}
        onJoin={() => setStage({ name: "online", mode: "join" })}
        onBack={() => setStage({ name: "rules" })}
      />
    );
  }

  if (stage.name === "setup") {
    return (
      <SetupScreen
        dispatch={dispatch}
        onBack={() =>
          setStage(onlineEnabled ? { name: "mode-select" } : { name: "rules" })
        }
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
