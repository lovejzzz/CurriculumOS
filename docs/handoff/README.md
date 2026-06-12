# The CurriculumOS Handoff Kit

_Everything an AI coder (or a human one) needs to build CurriculumOS in a fresh repository — the founding design, the normative schemas, the contracts fourteen prototype releases paid for, the port manifest, the fixtures that define done, and the first work order. Assembled June 12, 2026, from CourseMapper v0.14.6._

## Contents

| File / folder           | What it is                                                                    | Status    |
| ----------------------- | ----------------------------------------------------------------------------- | --------- |
| `000-founding.md`       | The design doc: thesis, the ten Laws, product, architecture, UX, build order  | normative |
| `010-schema/`           | Course Object, EditOp catalog, state machine, API — as real TS + examples     | normative |
| `020-contracts.md`      | Authoring/kernel/voice/readings/honesty contracts, each with its scar         | normative |
| `030-ports.md`          | What ports from the prototype (code + data), what dies, and why               | manifest  |
| `040-artifact-specs.md` | Per-artifact content contracts the renderer implements and the grader checks  | normative |
| `050-fixtures/`         | The 11 course briefs + the judge's verdict ledger (copied from the prototype) | data      |
| `060-design-system.md`  | The visual law: tokens, type floors, the Desk vocabulary, the CI scans        | normative |
| `070-decisions.md`      | ADR-01…12: stack, purity, persistence, providers, one edit pathway            | decided   |
| `080-traps.md`          | 21 transferable failure modes, one line of trap + one of consequence          | advisory  |
| `090-m0-work-order.md`  | Milestone 0, bar-first; M1+ orders get written when M0 ships                  | active    |

## How to brief the AI coder

1. **Give it this folder and a read-only checkout of CourseMapper** (the reference companion — when the kit is ambiguous, the prototype's implementation _and its pinning tests_ explain why; when they conflict, the kit wins).
2. **One milestone at a time.** Hand over `090-m0-work-order.md` only. The builder stops when the bar is green and requests the next order — never speculates ahead.
3. **Bars are tests, written first.** Every milestone's definition of done is executable before its implementation exists (Law 1 applies to the builder, not just the product).
4. **The Laws are review criteria.** `design/LAWS.md` in the new repo is §1 of the founding doc; PRs name the Law they serve.
5. **The Crucible is the judge of everything**, including the rebuild itself: v1 exists only when it beats CourseMapper v0.14.6 on teachability at equal cost, measured by the same harness, twice, on different days.

## What this kit deliberately does NOT contain

- M1+ work orders (written just-in-time).
- The ported source code itself (the manifest in `030-ports.md` points into the prototype repo — copying 10k+ lines into docs would fork the truth).
- Genome shard data (ports directly from `src/lib/genome/` + foundry output per the manifest).
- Provider keys, billing design beyond ADR-06/07, and the commons backend spec (M5 concerns, specced when M4 ships).
