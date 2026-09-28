import { randomUUID } from "node:crypto";

// Only used from Node-runtime routes (create/join) — never imported by
// anything the Edge-runtime poll route depends on, since node:crypto can't
// be bundled for the Edge runtime.
export function generateToken(): string {
  return randomUUID();
}
