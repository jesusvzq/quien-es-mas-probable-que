"use client";

import { motion } from "framer-motion";
import { BigButton } from "@/components/ui/BigButton";

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-surface p-6 text-center shadow-xl"
      >
        <h3 className="text-lg font-extrabold">{title}</h3>
        <p className="text-sm text-foreground/70">{message}</p>
        <div className="flex flex-col gap-2">
          <BigButton variant="secondary" onClick={onConfirm}>
            {confirmLabel}
          </BigButton>
          <BigButton variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </BigButton>
        </div>
      </motion.div>
    </div>
  );
}
