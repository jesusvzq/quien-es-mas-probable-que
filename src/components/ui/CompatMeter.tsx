"use client";

import { motion } from "framer-motion";

export function CompatMeter({ percentage }: { percentage: number }) {
  const clamped = Math.min(100, Math.max(0, percentage));
  const radius = 80;
  const circumference = Math.PI * radius; // half circle
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative mx-auto h-[100px] w-[200px]">
      <svg viewBox="0 0 200 100" className="h-full w-full overflow-visible">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="currentColor"
          className="text-foreground/10"
          strokeWidth={16}
          strokeLinecap="round"
        />
        <motion.path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#compat-gradient)"
          strokeWidth={16}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="compat-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7c6bff" />
            <stop offset="100%" stopColor="#ff6b81" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center text-3xl font-extrabold">
        {clamped}%
      </div>
    </div>
  );
}
