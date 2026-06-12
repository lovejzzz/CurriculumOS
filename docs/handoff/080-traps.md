# 080-traps.md — the traps that transfer

_Curated from the prototype's memory files: the non-obvious failure modes that will bite the new repo too. Each is one sentence of trap + one of consequence._

## Model & provider

1. OpenAI `json_object` mode **requires the word "JSON" in the user prompt** — omitting it errors at the provider, not in your code.
2. Models transcribe honestly: "weekly quizzes" becomes ONE entity unless the cadence-expansion rule is explicit — and a degenerate registry downstream of an honest transcription hangs pipelines that assumed plurality (contracts §A1/§A2).
3. Reasoning tokens dominate cost on structure-authoring calls (65% of output tokens on the prototype's map call) — reasoning tier is a per-stage knob, not a global one; Pass A at low reasoning was the single biggest cost win.
4. Provider-reported usage is the only truth for cost; estimates drift and then lie in receipts.
5. Key prefixes (`sk-`, `sk-ant-`, `AIza`) validate at entry; redaction patterns must cover all three BEFORE the first log line ships.

## Rendering & export

6. Fonts must be universally installed — Georgia + Trebuchet MS / Calibri; a beautiful unavailable font renders as Times New Roman on the instructor's machine.
7. Exporter façades rot into duplicate builders — one builder per format, façade delegates only (the prototype paid for this twice).
8. Office XML re-opened and text-scanned catches what unit tests can't: phrase repetition at template frequency, placeholder leakage, encoding damage. Scan the **rendered bytes**, not the data that produced them.
9. Template texture: any fixed sentence stamped once per session crosses the 12-repeat shingle limit at 12+ sessions — phrasing pools are a design requirement, not polish (the v0.14.6 scar).

## Quality measurement

10. Calibrate before you gate: a texture/quality metric that flags honest variation is worse than no metric — the prototype's grader needed a verdict ledger and several FP rounds (author initials tripping "doubled letters", relationship arrows read as truncation) before it earned gate status.
11. A grader that measures absence-of-defects will happily 100/A content a human rates 5/10 — keep two meters or the second number disappears into the first.
12. In-app self-grade vs external-harness grade WILL drift unless a CI gate fails the round at >3 points delta.

## State & sync

13. Any boolean that approximates "what phase are we in" will eventually disagree with another such boolean, in production, on a screenshot (three consecutive prototype releases). Machine or bust.
14. Regeneration that replaces arrays clobbers what it didn't regenerate — the prototype lost a 17-entry quiz bank to a 1-lesson regen before merge protections; in the new architecture, never store derived arrays as truth at all.
15. Sync paths that rebuild inputs from scratch silently drop overlays (kernels) — invalidation must be hash-keyed, not vibes-keyed (audit §2.9).

## Process

16. Format before every push (the CI runs format:check; 27 unformatted files once failed a release commit).
17. Know exactly which test command is the release gate — the prototype's bare `vitest run` included Playwright specs and excluded-by-script audits, producing phantom failures that `npm test` never sees.
18. zsh aborts a whole `&&` chain on a failed glob, and `echo ===` dies to `=`-expansion — quote separators, loop over files explicitly in release scripts.
19. Golden/byte-stable harnesses gate compiler changes honestly ONLY if regenerating goldens is a deliberate, reviewed act — an auto-update flag turns the gate into a rubber stamp.
20. Screenshots at 2× DPR lie about layout — trust DOM rects for geometry, screenshots for styling (applies to any browser-driving harness).
21. When deleting a "legacy" path, count its live consumptions first with telemetry — the prototype's diet refused two deletions because the data said no, and both refusals were correct.
