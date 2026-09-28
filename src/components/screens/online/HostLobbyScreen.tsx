"use client";

import QRCode from "qrcode";
import { useEffect, useRef } from "react";
import { WaitingScreen } from "@/components/screens/online/WaitingScreen";

export function HostLobbyScreen({ code }: { code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = `${window.location.origin}/join/${code}`;
    QRCode.toCanvas(canvas, url, { width: 200, margin: 1 }).catch(() => {
      // Non-critical: the code is also shown as text below.
    });
  }, [code]);

  return (
    <WaitingScreen message="Esperando a que se una tu rival...">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-surface p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-foreground/50">
          Código de la sala
        </p>
        <p className="text-4xl font-extrabold tracking-[0.3em] text-primary">
          {code}
        </p>
        <canvas ref={canvasRef} className="rounded-xl" />
        <p className="text-sm text-foreground/60">
          Comparte el código o que escaneen el QR para uniros.
        </p>
      </div>
    </WaitingScreen>
  );
}
