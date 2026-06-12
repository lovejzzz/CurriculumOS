# CurriculumOS

_An engine that turns a description of a course into a verified, internally-consistent, teachable course — and keeps it consistent through every edit._

The website was never the product. It is the first client of a brain called CurriculumOS, whose every answer proves itself: **no response without a receipt** — every result ships with its own grade, provenance, and price.

Built from the [handoff kit](docs/handoff/) (`docs/000-founding.md` is the founding design). The ten Laws live in [design/LAWS.md](design/LAWS.md) and are CI-enforced review criteria. Where this goes next — the full audit, the path to calibrated 10/10 teachability, and the versioned plan — lives in [docs/ROADMAP-V0.0.1.md](docs/ROADMAP-V0.0.1.md).

## What's here

```
curriculumos/
├── packages/
│   ├── core/        # the pure engine — schema, state machine, edits, render, link/judge, voice, grade, build/patch
│   │   └── (no DOM/fetch/storage/Date.now/Math.random — effects are injected ports; ADR-03)
│   ├── knowledge/   # the genome cache (8 discipline shards) + cache-first linker + prerequisite judgment
│   ├── api/         # the server home — the two verbs as HTTP, SSE, metering, the OpenAI/DeepSeek ModelPort
│   └── crucible/    # the harness — drives builds, grades them, diffs against the verdict ledger
├── apps/
│   └── coursemapper/ # client #1 — the Door and the Desk (Vite + React)
├── design/
│   ├── LAWS.md       # §1 of the founding doc, normative
│   └── tokens/       # the Calm Surface design system, consumed by the CI token scan
├── scripts/          # the guardrail lints (file budget, core purity, design tokens)
└── docs/             # the founding doc + the full handoff kit
```

## The two verbs

```
POST  /courses        brief in → a Course Object out (graph, artifacts, grade, provenance, cost),
                      streaming its build states as Server-Sent Events.
PATCH /courses/{id}   a typed EditOp batch in → a diff + a fresh grade + an itemized cost out.
```

Everything else is a read or a render: `GET /courses/{id}`, `/receipt`, `/package?format=zip`, `/events`,
`/artifacts/{kind}/{scope}`, and `POST /courses/{id}/chat` (the TA — a tool-calling agent whose tools are EditOps,
so its edits diff and re-grade like everyone else's). See [docs/handoff/010-schema/api.md](docs/handoff/010-schema/api.md).

## The Course Object

One artifact owns everything ([docs/handoff/010-schema/courseObject.ts](docs/handoff/010-schema/courseObject.ts)):

- a typed, id'd, versioned **graph** (the source of truth — nothing matches on strings),
- **overlays** (genome kernels, model-authored voice, an append-only EditEvent log),
- **receipts** (provenance, cost ledger, the dual-meter grade, build history).

Artifacts are never stored as truth — `render(graph, overlays)` derives them. So **sync is a property, not a feature**:
an edit changes the graph or an overlay, re-render is free, and the diff between renders _is_ the sync plan.

## Quick start

```bash
pnpm install

# run the full CI gate: types + file-budget + core-purity + token scans + tests (36, all green)
pnpm run ci

# run a Crucible round against the deterministic fake engine ($0, no key needed)
pnpm crucible -- --courses all

# the server home (set a key for real builds; falls back to the fake engine without one)
OPENAI_API_KEY=sk-... OPENAI_MODEL=gpt-5.4-mini pnpm api      # :8787

# the web client (proxies /api → :8787)
pnpm app                                                       # :5173
```

Bring-your-own-key or platform key — the same pure core runs in the browser, on the server, and in CI.
Model names and prices are config (ADR-07); cost is computed from provider-reported tokens only.

## Economics (measured, real provider)

| Operation | Target | Measured (gpt-5.4-mini, with voice) |
| --- | --- | --- |
| Build (12–15 lessons) | ≤ $0.15, ≤ 90s | **$0.049 – $0.062** |
| Structural edit | $0, < 5s | $0 (pure recompile + diff) |
| Genome cache hit | $0 | $0 (the flywheel) |

## The Laws, enforced

The guardrails guard the guard (Law 10): `pnpm run ci` fails on a >1,500-line file (ADR-10), on any
`fetch`/`fs`/`Date.now`/`Math.random` reachable from the pure core (ADR-03), on sub-12px text or off-palette
status colors in the app, on a type error, or on a failing test. Quality is physics, not vibes.

_CourseMapper, built on CurriculumOS._
