/** util.ts — pure helpers shared across core. No effects (ADR-03). */

/** FNV-1a 32-bit — stable content hashing for kernel/voice invalidation (K4). */
export function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** 8-word shingles — the texture unit (G4, the v0.14.6 scar). */
export function shingles(text: string, size = 8): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .split(/\s+/)
    .filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i + size <= words.length; i++) {
    out.push(words.slice(i, i + size).join(' '));
  }
  return out;
}

/** Sentence-opener extraction (teachability: variety beats sameness). */
export function sentenceOpeners(text: string, words = 3): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim().toLowerCase().split(/\s+/).slice(0, words).join(' '))
    .filter((s) => s.length > 0);
}

/** Numbers mentioned in a text — the no-new-facts lint's cheapest signal (W2). */
export function numbersIn(text: string): Set<string> {
  return new Set((text.match(/\d+(?:\.\d+)?/g) ?? []).map((n) => n.replace(/^0+(?=\d)/, '')));
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Deterministic pick from a pool keyed by an index — phrasing pools rotate
 *  by entity index, never by randomness (replay law). */
export function rotate<T>(pool: readonly T[], index: number): T {
  if (pool.length === 0) throw new Error('rotate: empty pool');
  return pool[((index % pool.length) + pool.length) % pool.length] as T;
}

export function zeroPad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Stable JSON stringify (sorted keys) — byte-identical replay comparisons. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}
