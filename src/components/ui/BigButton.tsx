"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-primary text-white shadow-lg shadow-primary/30 active:bg-primary-dark",
  secondary:
    "bg-secondary text-white shadow-lg shadow-secondary/30 active:bg-secondary-dark",
  ghost:
    "bg-surface text-foreground border-2 border-foreground/10 active:border-foreground/20",
};

type BigButtonProps = {
  variant?: Variant;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
};

export function BigButton({
  variant = "primary",
  className = "",
  children,
  onClick,
  disabled,
  type = "button",
}: BigButtonProps) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      className={`w-full min-h-[3.5rem] rounded-2xl px-6 py-4 text-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
