# The 10/10 Plan — making the best case the every-case

_Written June 12, 2026, after V0.0.4. This is the governing quality plan: the operational definition of 10/10, the evidence-grounded gap analysis, six workstreams with bars, and the iteration sequence the build loop executes. Supersedes nothing — it composes the roadmaps (V0.0.1–V0.0.4) into one campaign with one finish line._

---

## 1. What 10/10 means (operational, falsifiable)

**The judge's question — would a professor teach from this AS-IS? — answered "yes, tomorrow, unchanged" for every artifact class, on every fixture course, reliably.** Concretely, the release that claims 10/10 must show, **twice, on different days**, on the four audit courses **plus** two stranger courses:

| Gate | Bar |
| --- | --- |
| Judge, per artifact class | **≥ 9** on quizzes, lesson plans, syllabus, study guides (no artifact below 8) |
| Judge, overall | **≥ 9** per course |
| Structural | 100/A, zero P0/P1 findings |
| Meter↔judge drift | ≤ 2 per course (gate already armed); mean ≤ 1 |
| Export audit | zero P0s on the rendered Office bytes |
| Cost | ≤ $0.20/course all passes on (voice + items + activities) |
| Determinism | every paid path has a fake-port twin; suite green offline |

No partial credit: a 9-average hiding a 4 quiz is the exact failure Law 5 exists to prevent.

## 2. Where we are (the evidence)

Aggregated judge scores across the V0.0.3–V0.0.4 real rounds:

| Artifact | Range seen | Best seen | The complaint at the low end |
| --- | --- | --- | --- |
| Quiz | **2 – 9** | **9** (Pass C succeeded) | "absurd distractors, repeated prompts" (compiled fallback) |
| Study guide | 3 – **8** | **8** ("content-rich") | "decontextualized; no text-specific examples" |
| Syllabus | 6 – **8** | **8** | "placeholder readings; 'edit me' grading; generic policies" |
| Lesson plan | 3 – **8** | **8** | "templated activities; not text/code-specific; outcomes not operationalized into tasks" |

**The headline: the ceiling is already proven per class.** A quiz has scored 9; the same machinery scored 2 when Pass C silently fell back to compiled items. The campaign is therefore three kinds of work, in order of leverage:
1. **Reliability** — make the best path fire every time (or fail loudly enough to fix).
2. **Specificity** — weave the kernel's actual content (worked examples, excerpts, code) INTO the activities, instead of templated frames around topic names.
3. **Completeness** — fill the honest blanks (readings on text-less briefs, policy depth) with verified, provenance-marked material.

## 3. Root causes, not symptoms

- **R1 — Pass C fallback is silent and unexplained.** The build record says "N authored, M fallback" but never WHY (schema fail? contract violation? which rule?). You cannot fix a failure you cannot see. (This is the same lesson as the phantom "provider-failure": name the error.)
- **R2 — compiled fallbacks are below the floor.** When a paid pass degrades, the fallback must still be a 6, not a 2. The compiled distractor pools ("a consequence mistaken for its definition") read as filler to a professor — the fallback should draw ONLY on real kernel misconceptions and skip MC entirely when it lacks enough of them.
- **R3 — activities are frames, not content.** `phase(lensArc.core, i) + topic` produces "Code-along: build up a worked program using while loops" — generic by construction. The kernel HAS the worked example, the excerpt, the misconceptions; the activity text never uses them. Specificity requires synthesis, which is sentence-writing — i.e., **paid voice-class work** (Law 4 says exactly this: structure free, voice paid, both verified).
- **R4 — empty reading slots render as blanks.** Briefs that name no texts produce schedule rows with "—". R1's design already permits retrieval to fill EMPTY slots with `retrieved-open` provenance; we built the retrieval but never the filling.
- **R5 — "edit me" language reads as unfinished.** The suggested-weighting feature is right; its label invites a deduction. Confidence language ("Default weighting — adjust to taste") with the same honesty does not.
- **R6 — voice fallback 26–47%** still caps texture; failures are counted but not categorized (bounds? frozen? names?). Same instrumentation gap as R1.

## 4. The six workstreams

### A. Items to a reliable 9 (kills R1, R2)
1. **Instrument every fallback**: per-session fallback REASONS into the build record and the round report (`items: 12 authored, 2 fallback [S4: item-set templated stems; S9: zod options.length]`).
2. **Retry economics**: the item budget rises with course size (≥ $0.06/14 sessions); the second retry quotes violations (already) AND switches to a stricter system prompt variant.
3. **Fallback floor**: compiled quiz uses ONLY real misconception-derived items; if a session's kernel lacks ≥2 misconceptions, render short-answer + applied items (no MC) — fewer, honest items beat absurd ones.
4. **Exam items**: exams currently compile; route them through Pass C too (scoped to coveredSessions kernels).
- **Bar:** judged quiz ≥ 8 on every audit course; zero sessions with unexplained fallback; the round report names every degradation.

### B. Activities that teach the actual content (kills R3) — *the big one*
1. **Pass D (activities)**: a budgeted, parallel, low-reasoning pass that writes each session's 4-phase activity sequence USING the kernel — the worked example becomes the core activity's script, the excerpt becomes the close-reading object, code concepts get a runnable snippet, each activity names its outcome id and a 2-minute check. Contract-linted (must reference the kernel content verbatim somewhere, must cover every outcome id, length bounds); compiled lens-frames remain the fallback.
2. **Performance task**: each session's practice phase ends with one concrete deliverable sentence ("students submit the fixed `count_vowels` function with its failing test now passing").
3. **Per-concept differentiation**: when a session carries 2+ distinct kernels, the core phase addresses each by name (the Li Bai vs Du Fu complaint).
- **Bar:** judged lesson plan ≥ 8 everywhere, ≥ 9 on two courses; the activity text quotes kernel content (lint-verified); plan cost ≤ $0.03/course.

### C. The complete syllabus (kills R4, R5)
1. **Retrieval fills EMPTY reading slots** with `retrieved-open` provenance (R1 order preserved: never touches instructor-named slots), discipline-filtered through the relevance gate; rendered with external ids.
2. **Policy library v2**: per-discipline policy blocks (lab safety for stem-lab, academic-integrity-with-AI language, participation norms for seminars) — data, not model calls.
3. **Confidence language** for suggested weights; schedule rows gain one-line task descriptions from the assessment registry.
- **Bar:** judged syllabus ≥ 8 everywhere; no empty schedule cells on any fixture course; every added reading carries provenance + external id.

### D. Voice to >90% acceptance (kills R6)
1. Categorize voice fallback reasons in the receipt (bounds / frozen / names / provider).
2. Fix the dominant category (likely bounds: compiled openers are short, the 60-word floor rejects honest tightenings — lower floor to 40 for short surfaces).
3. Voice the Pass D activity descriptions (they are the most-read sentences in the product).
- **Bar:** voice fallback ≤ 10% per course; zero uncategorized failures.

### E. Genome breadth + flywheel depth
1. Shards for the stranger disciplines still cache-cold: **arts/music-theory, philosophy, business-ethics** (the stranger pool grades generically today).
2. Run promotion across all ten fixture courses once; verify the extension store accumulates and second builds link at $0 (already tested deterministically — do it live).
3. Grow prereq edges (more bridges = more judgment visible).
- **Bar:** every fixture + stranger course links ≥ 8 concepts; at least one live promotion persisted and re-linked.

### F. Measurement that can't lie
1. **The judged corpus**: 6 courses × 2 days per release candidate; per-artifact scores recorded into `packages/crucible/corpus/` (versioned history, like the verdicts ledger we inherited).
2. **Per-artifact drift**: the meter learns per-class sub-scores (quiz/plan/syllabus/guide) so CI can gate the class that regressed, not just the average.
3. **Judge stability audit**: same package judged twice in one day; if the judge's own variance exceeds ±1, average two judge calls per course before gating (variance is a measurement problem, not a content problem).
4. **Spend guard**: the full 2-day campaign costs ≈ 6 courses × 2 days × $0.20 ≈ **$2.40 per release candidate** — budgeted, capped, in the receipts.
- **Bar:** the 10/10 claim is two green campaign days, archived in the corpus, reproducible by `pnpm crucible -- --courses campaign --real --voice --judge`.

## 5. Iteration sequence (what the loop executes)

Each iteration = one loop firing: implement → suite green → one real judged measurement → ship tagged → record deltas.

| Version | Scope | Exit bar |
| --- | --- | --- |
| **v0.0.5** | Workstream A (items reliability + instrumentation + fallback floor + exam items) | quiz ≥ 8 on all four audit courses |
| **v0.0.6** | Workstream B (Pass D activities + contracts + performance tasks) | plan ≥ 8 everywhere |
| **v0.0.7** | Workstream C (reading fill + policies + confidence language) + D (voice categorization + fixes) | syllabus ≥ 8; voice fallback ≤ 10% |
| **v0.0.8** | Workstream E (3 stranger shards + live promotion pass) | every course links ≥ 8; one live flywheel cycle |
| **v0.0.9** | Workstream F (corpus harness, per-artifact meter, judge stability) + fix whatever the corpus exposes | campaign day 1 green |
| **v0.1.0** | Campaign day 2 + the 10/10 claim, or the named gap and another iteration | **all §1 gates, twice** |

## 6. Risks, named now

- **Judge variance** could gift or steal a point. Mitigation: F.3 (average two calls when variance > ±1); never tune content to one judge transcript — tune to the recurring complaint.
- **The model ceiling**: gpt-5.4-mini may plateau below 9 on synthesis-heavy artifacts. Mitigation: per-stage model config already exists (ADR-07) — Pass D may justify one tier up for ~$0.02/course; measure before deciding.
- **Cost creep**: passes A–D + voice + retrieval must stay ≤ $0.20. The ledger already itemizes per stage; the budget cap is enforced, so creep fails loudly.
- **Goodhart's judge**: optimizing the sampled artifacts could leave unsampled ones (decks, FAQ, discussions) behind. Mitigation: rotate the judge's sample per round (sample 2 random classes extra); the export audit still covers every byte.
- **The 9→10 last mile is taste**: if the campaign saturates at 9, the honest move is a human professor review of one package (the user, or a colleague) before claiming 10 — the judge calibrated the meter; a human calibrates the judge.

## 7. What we will NOT do

No new product surface (browser home, auth, SCORM) until v0.1.0 ships — quality of the existing promise first. No meter tuning to close drift from the meter's side while content gaps remain. No claiming any bar from a single lucky round: twice, different days, archived.
