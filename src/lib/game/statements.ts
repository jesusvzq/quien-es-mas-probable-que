import { STATEMENTS } from "@/data/statements";

/**
 * Picks a random statement from the pool that hasn't been used yet.
 * Only throws if the pool is exhausted, which can't happen given
 * MAX_ROUNDS <= STATEMENTS.length.
 */
export function pickStatement(used: readonly string[]): string {
  const available = STATEMENTS.filter((s) => !used.includes(s));
  if (available.length === 0) {
    throw new Error("Statement pool exhausted");
  }
  const index = Math.floor(Math.random() * available.length);
  return available[index];
}
