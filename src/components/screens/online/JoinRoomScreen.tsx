"use client";

import { useState } from "react";
import { BigButton } from "@/components/ui/BigButton";
import { DevCredit } from "@/components/ui/DevCredit";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { MAX_NAME_LENGTH } from "@/lib/game/types";

const CODE_LENGTH = 4;

export function JoinRoomScreen({
  initialCode,
  onJoin,
  pending,
  error,
  onBack,
}: {
  initialCode?: string;
  onJoin: (code: string, name: string) => void;
  pending: boolean;
  error: string | null;
  onBack: () => void;
}) {
  const [code, setCode] = useState(initialCode ?? "");
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);

  const trimmedName = name.trim();
  const normalizedCode = code.trim().toUpperCase();
  const isValid = trimmedName.length > 0 && normalizedCode.length === CODE_LENGTH;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValid || pending) return;
    onJoin(normalizedCode, trimmedName);
  }

  return (
    <ScreenShell>
      <DevCredit />
      <h2 className="text-center text-2xl font-extrabold">
        Unirse a una partida
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Código de la sala
          <input
            type="text"
            value={code}
            maxLength={CODE_LENGTH}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD"
            autoCapitalize="characters"
            className="rounded-xl border-2 border-foreground/10 bg-surface px-4 py-3 text-center text-2xl font-bold uppercase tracking-[0.3em] focus:border-primary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold">
          Tu nombre
          <input
            type="text"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre"
            className="rounded-xl border-2 border-foreground/10 bg-surface px-4 py-3 text-base font-normal focus:border-primary focus:outline-none"
          />
        </label>

        {touched && !isValid && (
          <div className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-600">
            Escribe tu nombre y un código de 4 letras.
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <BigButton type="submit" disabled={pending}>
          {pending ? "Uniéndote..." : "Unirse"}
        </BigButton>
        <BigButton type="button" variant="ghost" onClick={onBack}>
          Volver
        </BigButton>
      </form>
    </ScreenShell>
  );
}
