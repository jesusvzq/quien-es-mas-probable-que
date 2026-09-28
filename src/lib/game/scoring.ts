import type { RoundResult } from "./types";

export type Tier = {
  minPercentage: number;
  maxPercentage: number;
  emoji: string;
  label: string;
  comment: string;
};

export const TIERS: readonly Tier[] = [
  {
    minPercentage: 0,
    maxPercentage: 20,
    emoji: "🧊",
    label: "Desconocidos",
    comment: "¿Seguro que os conocéis de algo?",
  },
  {
    minPercentage: 21,
    maxPercentage: 40,
    emoji: "🌱",
    label: "Conocidos de ascensor",
    comment: "Sabéis lo básico y poco más.",
  },
  {
    minPercentage: 41,
    maxPercentage: 60,
    emoji: "🤝",
    label: "Buenos compañeros",
    comment: "Hay confianza, pero aún quedan sorpresas.",
  },
  {
    minPercentage: 61,
    maxPercentage: 80,
    emoji: "🔥",
    label: "Dúo dinámico",
    comment: "Os leéis la mente casi siempre.",
  },
  {
    minPercentage: 81,
    maxPercentage: 99,
    emoji: "💞",
    label: "Almas gemelas",
    comment: "Sois prácticamente la misma persona.",
  },
  {
    minPercentage: 100,
    maxPercentage: 100,
    emoji: "👑",
    label: "Telepatía total",
    comment: "Esto ya no es normal, es telepatía.",
  },
];

export function getTier(percentage: number): Tier {
  const tier = TIERS.find(
    (t) => percentage >= t.minPercentage && percentage <= t.maxPercentage
  );
  return tier ?? TIERS[0];
}

export type Summary = {
  matches: number;
  total: number;
  percentage: number;
  tier: Tier;
};

export function computeSummary(results: readonly RoundResult[]): Summary {
  const total = results.length;
  const matches = results.filter((r) => r.matched).length;
  const percentage = total === 0 ? 0 : Math.round((matches / total) * 100);
  return { matches, total, percentage, tier: getTier(percentage) };
}

/** Counts how many times each player index was voted "more likely" overall. */
export function countVotesPerPlayer(
  results: readonly RoundResult[]
): [number, number] {
  const counts: [number, number] = [0, 0];
  for (const result of results) {
    for (const vote of result.votes) {
      counts[vote] += 1;
    }
  }
  return counts;
}
