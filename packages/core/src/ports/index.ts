/**
 * ports/index.ts — ADR-03: the core is pure; effects are ports.
 * Zero fetch/DOM/fs/Date.now/Math.random reachable from core. The same engine
 * runs in the browser, on a server, and in CI because everything effectful
 * arrives through these interfaces.
 */

export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
}

export interface ModelResult {
  /** Parsed JSON output — the model authors typed entities (Law 2). */
  json: unknown;
  usage: ModelUsage;
  model: string;
  /** Provider-reported tokens × published rates, computed by the port —
   *  the only truth for cost (trap #4, Law 9). */
  usd: number;
}

export interface ModelRequest {
  system: string;
  user: string; // JSON-mode rule: must contain the word "JSON" (trap #1) — port asserts
  reasoning?: 'low' | 'medium' | 'high'; // per-stage knob (trap #3)
  maxOutputTokens?: number;
  /** Stage hint. The real port uses it to pick the reasoning tier; the fake
   *  port uses it to dispatch deterministic output. Stages set it; one
   *  interface serves browser, server, and CI homes. */
  purpose?: 'intake' | 'authorA' | 'authorB' | 'voice' | 'chat' | 'items';
  /** Structured stage input. The real port serializes it into the user prompt;
   *  the fake port reads it directly. */
  payload?: unknown;
}

export interface ModelPort {
  completeJSON(req: ModelRequest): Promise<ModelResult>;
}

/** Deterministic clock/rand for tests and replay — injected, never global. */
export class FixedClock implements ClockPort {
  private ms: number;
  constructor(startMs = 1_700_000_000_000) {
    this.ms = startMs;
  }
  nowISO(): string {
    return new Date(this.ms).toISOString();
  }
  nowMs(): number {
    return this.ms;
  }
  /** advance deterministically between stages so timestamps differ but replay-stably */
  tick(by = 1000): void {
    this.ms += by;
  }
}

/** Seeded LCG — deterministic uniform stream (no Math.random; replay-safe). */
export class SeededRand implements RandPort {
  private state: number;
  constructor(seed = 0x2545f4914f6cdd1d) {
    this.state = seed >>> 0;
  }
  next(): number {
    // numerical recipes LCG
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }
}

/** In-memory storage for tests and the browser fallback. */
export class MemoryStorage implements StoragePort {
  private map = new Map<string, string>();
  async get(id: string): Promise<string | null> {
    return this.map.get(id) ?? null;
  }
  async put(id: string, value: string): Promise<void> {
    this.map.set(id, value);
  }
  async list(): Promise<string[]> {
    return [...this.map.keys()];
  }
  async delete(id: string): Promise<void> {
    this.map.delete(id);
  }
}

export interface ClockPort {
  /** ISO timestamp — recorded at the edge, injected into core (replay-safe). */
  nowISO(): string;
  /** Milliseconds since epoch, for ULIDs and durations. */
  nowMs(): number;
  /** Advance a deterministic clock between stages so timestamps differ
   *  replay-stably. A real (wall-clock) port omits it — it advances on its own. */
  tick?(by?: number): void;
}

export interface RandPort {
  /** Uniform in [0,1). Deterministic fakes make replay byte-identical. */
  next(): number;
}

/** Persistence boundary (ADR-06). Implementations: memory (tests), JSON file
 *  (server), IndexedDB (browser home). Core never touches storage directly —
 *  the API layer owns load/save around pure core calls. */
export interface StoragePort {
  get(id: string): Promise<string | null>;
  put(id: string, value: string): Promise<void>;
  list(): Promise<string[]>;
  delete(id: string): Promise<void>;
}

// ── Deterministic id generation ──────────────────────────────────────────────
const ULID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32

/** ULID built from injected time + randomness — never from globals. */
export function ulid(clock: ClockPort, rand: RandPort): string {
  let ms = clock.nowMs();
  let time = '';
  for (let i = 0; i < 10; i++) {
    time = ULID_ALPHABET[ms % 32] + time;
    ms = Math.floor(ms / 32);
  }
  let entropy = '';
  for (let i = 0; i < 16; i++) {
    entropy += ULID_ALPHABET[Math.floor(rand.next() * 32)];
  }
  return time + entropy;
}
