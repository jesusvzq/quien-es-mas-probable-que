"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { ScreenShell } from "@/components/ui/ScreenShell";

export function WaitingScreen({
  message,
  children,
}: {
  message: string;
  children?: ReactNode;
}) {
  return (
    <ScreenShell>
      {children}

      <div className="flex flex-col items-center gap-4 rounded-2xl bg-surface p-6 text-center shadow-sm">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="text-4xl"
        >
          ⏳
        </motion.div>
        <p className="text-lg font-semibold">{message}</p>
      </div>
    </ScreenShell>
  );
}
