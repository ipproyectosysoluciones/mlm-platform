/**
 * @fileoverview Mock for uuid v14 (ESM-only) to work with Jest CJS runtime
 * @description Provides CJS-compatible uuid v4 implementation producing valid UUIDs
 */

let counter = 0;

export function v4(): string {
  counter++;
  const ts = Date.now().toString(16).padStart(12, '0');
  const seq = counter.toString(16).padStart(6, '0').slice(0, 6);
  const rand = Math.random().toString(16).slice(2, 14).padStart(12, '0');
  return `${ts.slice(0, 8)}-${ts.slice(8, 12)}-4${seq.slice(0, 3)}-a${seq.slice(3, 6)}-${rand.slice(0, 12)}`;
}

export default { v4 };
