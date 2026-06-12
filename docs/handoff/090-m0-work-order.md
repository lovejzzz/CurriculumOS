# 090-m0-work-order.md — Milestone 0: the spine

_The first and only pre-written work order. M1+'s orders get written when M0 ships — work orders written too early go stale (the prototype's roadmaps were written one release ahead, never further, and that discipline held)._

## Objective

A new repository where a Course Object round-trips through every machine state with a **fake model**, replay is deterministic, and all the guardrail CI exists — so that every later milestone changes behavior, never scaffolding.

## Bar — written as failing tests FIRST (Law 8 + Law 1)

1. `core/schema`: zod schemas validate/reject fixture Course Objects per `010-schema/courseObject.ts`; id format rules enforced; an invalid cross-reference (assessment due a missing session) is rejected with a named error.
2. `core/machine`: the exhaustive state×event transition test passes exactly per the table in `010-schema/machine.ts`; illegal transitions throw in dev mode.
3. `core/edits`: applying an EditOp batch is atomic; preconditions per `editOps.ts` (weights >100 blocks; removing a session with dues blocks); every applied batch appends exactly one EditEvent with a dense seq.
4. **Replay determinism**: `build(brief, fakeModel) → events[]`; replaying `(brief, events)` twice yields byte-identical Course Objects. No `Date.now`/`Math.random` reachable from core (import-graph lint green).
5. `api` stub: POST /courses streams the fake build's machine states as SSE frames matching `PipelineSSEFrame`; PATCH applies ops and returns an `EditResult` with a (stub) grade — **never a missing one**; the error taxonomy returns its closed set.
6. Guardrail CI green and demonstrably armed: strict TS, the 1,500-line file budget (add a 1,501-line fixture file → CI fails), the core-purity import lint, prettier, the design-token scan harness (no app yet — scans run against an empty `apps/` glob without erroring).
7. The Crucible package skeleton runs end-to-end against the fake engine: drives a build, captures states, writes a round report (no grading content yet — grading arrives with M1's port).

## Deliverables

```
curriculumos/
├── pnpm-workspace.yaml, tsconfig.base.json, .github/workflows/ci.yml
├── packages/core/src/{schema/, machine/, edits/, ports/}      ← 010-schema, typed for real
├── packages/core/test/{schema, machine, edits, replay}.test.ts ← the bar, written first
├── packages/api/src/{routes.ts, sse.ts, errors.ts}             ← stubs honoring api.md
├── packages/crucible/src/{driver.ts, round.ts}                 ← skeleton + fake-engine round
├── design/LAWS.md            ← §1 of 000-founding.md, copied verbatim
├── design/tokens/            ← from 060-design-system.md
└── docs/000-founding.md      ← this kit's founding doc, copied
```

## Explicit non-goals for M0

No real model calls. No compiler/templates (M1). No grader port (M1/M2). No web app (M4 — the Door/Desk wait for a real engine worth fronting). No persistence beyond in-memory + JSON file export (ADR-06's IndexedDB lands with the app).

## Standing instructions to the builder

- The kit is normative; CourseMapper (read-only checkout) is the reference companion — consult its implementation AND tests when ambiguous; if it contradicts the kit, the kit wins and the discrepancy is logged in `docs/decisions/`.
- Write the bar tests before the implementation, commit them failing (CI allows a tagged `m0-bar` lane to be red until the milestone closes — everything else stays green).
- Every PR description names which Law(s) the change serves; a PR that can't name one is probably scaffolding drift.
- Do not start M1. When M0's bar is green, STOP and request the M1 work order.
