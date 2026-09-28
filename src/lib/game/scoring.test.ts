import { describe, expect, it } from "vitest";
import { computeSummary, countVotesPerPlayer, getTier } from "./scoring";
import type { RoundResult } from "./types";

function makeResults(matchedFlags: boolean[]): RoundResult[] {
  return matchedFlags.map((matched, i) => ({
    statement: `stmt-${i}`,
    round: i + 1,
    votes: matched ? [0, 0] : [0, 1],
    matched,
  }));
}

describe("computeSummary", () => {
  it("counts matches and computes percentage", () => {
    const results = makeResults([true, true, false, true, false]);
    const summary = computeSummary(results);
    expect(summary.matches).toBe(3);
    expect(summary.total).toBe(5);
    expect(summary.percentage).toBe(60);
  });

  it("handles a perfect game", () => {
    const results = makeResults([true, true, true, true]);
    const summary = computeSummary(results);
    expect(summary.percentage).toBe(100);
    expect(summary.tier.label).toBe("Telepatía total");
  });

  it("handles zero matches", () => {
    const results = makeResults([false, false, false]);
    const summary = computeSummary(results);
    expect(summary.percentage).toBe(0);
    expect(summary.tier.label).toBe("Desconocidos");
  });
});

describe("getTier boundaries", () => {
  const cases: [number, string][] = [
    [0, "Desconocidos"],
    [20, "Desconocidos"],
    [21, "Conocidos de ascensor"],
    [40, "Conocidos de ascensor"],
    [41, "Buenos compañeros"],
    [60, "Buenos compañeros"],
    [61, "Dúo dinámico"],
    [80, "Dúo dinámico"],
    [81, "Almas gemelas"],
    [99, "Almas gemelas"],
    [100, "Telepatía total"],
  ];

  for (const [percentage, expectedLabel] of cases) {
    it(`maps ${percentage}% to "${expectedLabel}"`, () => {
      expect(getTier(percentage).label).toBe(expectedLabel);
    });
  }

  it("scales sensibly for different round counts (e.g. 17 rounds)", () => {
    // 10/17 -> 59% -> Buenos compañeros; 11/17 -> 65% -> Dúo dinámico
    expect(getTier(Math.round((10 / 17) * 100)).label).toBe(
      "Buenos compañeros"
    );
    expect(getTier(Math.round((11 / 17) * 100)).label).toBe("Dúo dinámico");
  });
});

describe("countVotesPerPlayer", () => {
  it("tallies how many times each player index was picked", () => {
    const results = makeResults([true, false, true]);
    // true -> [0,0], false -> [0,1], true -> [0,0]
    expect(countVotesPerPlayer(results)).toEqual([5, 1]);
  });
});
