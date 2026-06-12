# 070-decisions.md — architecture decision records

_The choices the founding doc gestures at, decided. Format: decision, why, what would reverse it. An AI coder follows these without re-litigating; reversing one requires a written ADR superseding it._

**ADR-01 — TypeScript, strict, everywhere in packages/.**
The prototype's 18k-line compiler survived on regex contracts and golden files; whole bug classes (shape drift between stages, optional-field lies) were caught live by the Crucible instead of at compile time. Strict TS + zod at boundaries. _Reverse if: never._

**ADR-02 — pnpm workspaces monorepo; tsup for packages, Vite for the app; vitest.**
Boring, fast, proven by the prototype's own tooling (vitest already runs 3,200+ tests in ~30s there). No Nx/Turbo until build times demand it.

**ADR-03 — The core is pure; effects are ports.**
`packages/core` has zero imports of fetch/DOM/fs/Date.now/Math.random. Ports: `ModelPort`, `RetrievalPort`, `StoragePort`, `ClockPort`, `RandPort`. This is what makes the engine isomorphic (browser/server/CI) and replay deterministic — the Crucible resume lesson, generalized. _The CI check: an import-graph lint on core._

**ADR-04 — Hand-rolled typed state machine, not XState.**
The machine is ~12 states with a printable transition table (see `010-schema/machine.ts`); the exhaustive state×event test is the safety, a framework would be ceremony. _Reverse if: hierarchical/parallel states genuinely emerge._

**ADR-05 — Event-sourced edits; snapshots for load speed.**
`EditEvent[]` is authoritative; a materialized snapshot per N events keeps loads O(1). Replay correctness is a CI property test (brief + events ⇒ identical Course Object, twice).

**ADR-06 — Persistence: IndexedDB (browser home) / Postgres + object storage (server home), behind StoragePort.**
M0–M4 ship on the browser home (the prototype's deal: private, free, BYO-key) with `.coursemapper`-style export retained as portability. The server home lands with the API milestone (M5). localStorage is dead as a source of truth (audit §2.8) — IndexedDB from day one.

**ADR-07 — Providers: OpenAI default (gpt-5.x-mini tier), Anthropic + Google first-class via the ported provider layer.**
Per-provider quirks live ONLY in the ModelPort implementation (JSON-mode rule, key prefixes, native tool-calling). Model names are config, never hardcoded in stages.

**ADR-08 — Streaming: SSE, not WebSockets.**
One-directional state streams fit SSE exactly; it survives proxies, needs no upgrade dance, and the in-browser engine fakes the same frame shape locally so clients have ONE code path.

**ADR-09 — Schema validation with zod, generated from the normative TS types in 010-schema.**
The TS types are the spec; zod schemas derive from them (or are written adjacent with type-equality asserts). API and model-output boundaries both validate; nothing unvalidated crosses into core.

**ADR-10 — Module budget: no file over 1,500 lines, CI-enforced.**
The 18,289-line lesson. Templates are data files (per-lens), exempt from the budget but capped at data-only content (a template file importing logic fails the lint).

**ADR-11 — The judge is a model; the teachability metric is code calibrated against the judge's ledger.**
Gating runs on the deterministic metric (free, reproducible); the live judge runs on Crucible schedule to re-calibrate. We never gate CI on a raw model verdict (flaky, paid) — we gate on its distilled, versioned proxy.

**ADR-12 — One edit pathway.**
Instructor UI, TA agent, and system repairs all emit EditOp batches through the same applier. There is no second door. (The prototype had three edit pathways — direct cell edits, agent actions, finalizer repairs — and reconciling them consumed multiple releases.)
