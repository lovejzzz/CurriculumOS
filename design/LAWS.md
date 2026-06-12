# The Laws

_§1 of [docs/000-founding.md](../docs/000-founding.md), copied verbatim. These are not guidelines — they are review criteria. Every PR names the Law it serves._

**Law 1 — The artifact is the test.**
Unit tests passed for six releases while the product shipped mail-merge. Quality only moved when the Crucible started downloading the real zip from the real app and grading it (51/F → 100/A in four rounds, ~$1.70). The new repo has artifact-grading CI from day one; a feature without a Crucible scenario does not exist.

**Law 2 — Authored typed, never parsed prose.**
The prose course map cost us: a parser, a repair layer that "fixes" 30 of 30 fields on every single run, a 4,115-line post-processor, and an entire bug class ("the model said X, the parser heard Y"). The native path proved −36% cost and −57% time. In CurriculumOS, the model authors typed entities from the first token. There is no prose intermediate. Ever.

**Law 3 — Identity before content.**
Every defect class we fought traced to text-matching: fused titles, decapitated exams, regex lesson-matching in sync. Every entity gets an id at birth (S5, C12, A7.2, R8.1); every reference is by id; text is a render. Nothing matches on strings.

**Law 4 — Structure is free; voice is paid; both are verified.**
The compiler's economics are right ($0.15/course while competitors burn dollars) and its texture ceiling is real (judge: "too templated," 5–6/10 forever). The split is permanent architecture: deterministic compilation for everything that must be correct, a budgeted model pass for the sentences humans actually read, verification over both.

**Law 5 — What gets measured gets fixed; what doesn't, doesn't.**
The refine loop crushed every scored dimension to 100/A and never moved the unscored one. The judge's question — _would a professor teach from this as-is?_ — is a gated, scored dimension in CurriculumOS from the first release.

**Law 6 — Fail loud or don't fail.**
The degraded-plan bug silently disabled enrichment in four straight test courses. The rule since, kept: no silent fallbacks, no quiet downgrades. Every degradation is named in the receipt the user sees.

**Law 7 — One fact, one place.**
Three releases in a row shipped status bugs because six booleans owned by four modules all approximated "what phase are we in." In CurriculumOS the pipeline is a state machine; every surface renders machine state; no consumer re-derives anything.

**Law 8 — Bars before work.**
The native flip and the voice pass were judged against bars defined _before_ the experiments ran ("within 2 points, no new finding classes, ≥20% cheaper, twice on different days") — which is the only reason "bar honestly unmet, default stays prose" was a result and not a negotiation. Every flip in the new repo states its bar in the design doc first.

**Law 9 — Money is part of the product.**
Provider-reported tokens, per-task ledgers, spend caps, cost in the UI. Users never get surprised; neither do we. Every API response carries its own cost.

**Law 10 — The guardrails guard the guard.**
The token scans caught their own author's new UI twice in one day. Codified taste (design tokens, text floors, counted exceptions, bundle budgets) outlives moods, sessions, and authors. The new repo codifies taste in CI from the start.
