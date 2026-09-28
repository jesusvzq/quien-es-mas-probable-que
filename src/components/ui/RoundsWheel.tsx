"use client";

import { useEffect, useRef } from "react";

const ITEM_HEIGHT = 56;
const VISIBLE_ROWS = 3;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;
// Padding of one item height centers the selected row in the viewport:
// scrollTop = index * ITEM_HEIGHT then lines up the item's middle with the
// container's vertical center (padding + index*height + half height == scrollTop + half container height).
const VISIBLE_PADDING = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;

type RoundsWheelProps = {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
};

export function RoundsWheel({ min, max, value, onChange }: RoundsWheelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const targetTop = (value - min) * ITEM_HEIGHT;
    if (Math.abs(el.scrollTop - targetTop) > 1) {
      el.scrollTo({ top: targetTop, behavior: "auto" });
    }
    // Only run on mount / external value changes, not on every user scroll tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      const index = Math.round(el.scrollTop / ITEM_HEIGHT);
      const clamped = Math.min(values.length - 1, Math.max(0, index));
      const next = values[clamped];
      if (next !== value) onChange(next);
      el.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: "smooth" });
    }, 100);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = Math.max(min, value - 1);
      onChange(next);
      scrollToValue(next);
    } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = Math.min(max, value + 1);
      onChange(next);
      scrollToValue(next);
    }
  }

  function scrollToValue(v: number) {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: (v - min) * ITEM_HEIGHT, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-14 -translate-y-1/2 rounded-xl border-2 border-primary/60"
        aria-hidden
      />
      <div
        ref={containerRef}
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label="Número de rondas"
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className="scrollbar-hidden overflow-y-scroll scroll-smooth rounded-2xl bg-surface/60 [scroll-snap-type:y_mandatory] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        style={{
          height: CONTAINER_HEIGHT,
          paddingTop: VISIBLE_PADDING,
          paddingBottom: VISIBLE_PADDING,
        }}
      >
        {values.map((v) => (
          <div
            key={v}
            className="flex items-center justify-center text-2xl font-bold [scroll-snap-align:center]"
            style={{ height: ITEM_HEIGHT, opacity: v === value ? 1 : 0.35 }}
          >
            {v}
          </div>
        ))}
      </div>
    </div>
  );
}
