# Roadmap V0.0.2 — close the judge gap

_Written June 12, 2026, after auditing V0.0.1 with a real judged Crucible round across all four audit courses (commits `bdd6ce2` → `193924b`). V0.0.1 set up the instruments — teacher-ready exports, a calibrated-to-spread meter, and the judge. This roadmap is what the judge then SAID, turned into ranked work with bars before it (Law 8). The discipline holds: one work order detailed at a time._

---

## Part I — The V0.0.1 audit, with real numbers

The deterministic suite (71 tests) was green and the fake-engine round graded every course 100/A. Then the real judged round ran — and earned its keep. **Four defects the fake engine could not see** surfaced and are now fixed (commit `193924b`):

| # | Defect | Why the fake missed it | Fix |
| - | ------ | ---------------------- | --- |
| 1 | All four courses `blocked(contract-violation)` | the fake never emits `term:null` or invented enum labels; real gpt-5.4-mini does | schema tolerant for harmless variance, strict for structure; Pass A retry quotes the violation |
| 2 | geology/world-lit `blocked(provider-failure)` — actually a TDZ crash (`Cannot access 'resources' before initialization`) | the fake returned empty readings/resources, so the self-referencing `.map` never ran | explicit accumulation; the fake now emits per-session resources so the suite exercises the path |
| 3 | world-lit's Tang-poetry lesson carried **nursing content** ("leukocytes and platelets") | the fake's concept names never loose-matched a foreign shard | the linker now gates loose matches to discipline-compatible shards; only exact aliases cross |
| 4 | failures masked as bare `provider-failure`; 429s after a 250ms wait | the fake never rate-limits or errors | seconds-scale backoff honoring `Retry-After`; the build records the NAMED error (Law 6) |

**The meta-finding (the one that matters most for process):** the fake and real engines diverge, and bugs live in the gap. Defect #2 was a crash hiding behind a generic reason code for two releases' worth of "passing" fake rounds. **Standing rule for V0.0.2 onward:** every real-round bug earns a deterministic fixture that reproduces it, and the fake is shaped to exercise every path the real model hits. (Done for #2 and #3 already; this becomes policy.)

### What the judge actually said (the real signal)

With the bugs fixed, all four audit courses build to **ready, 100/A structural**. The judge — _would a professor teach this as-is?_ — landed them at **6/10** with striking consistency. Aggregating its per-artifact verdicts across mandarin, cs-python, geology, world-lit:

| Artifact | Judge range | The recurring complaint (verbatim themes) |
| -------- | ----------- | ------------------------------------------ |
| **Quizzes** | **1–4/10** | "templated distractors", "placeholder key", "tests recognition of canned statements", "nonsensical filler distractors" |
| **Study guides** | **3–7/10** | "no retrieval practice, worked examples, or self-check questions", "mostly a compressed copy of the definitions" |
| **Syllabus grading** | **6–7/10** | "every assessment labeled 'weighting per instructor' — no functional scoring scheme" (flagged on **every single course**) |
| **Lesson plans** | **5–8/10** (best) | "generic", "no concrete timing/exercises/code samples", "abstract", "doesn't operationalize the stated outcome" |
| **Humanities texts** | — | "no actual poem", "supply actual texts and discussion prompts" |

And the structural↔judge **drift is 2–5 points** — our meter says 8–9 where the judge says 4–6. The meter rewards structural _presence_ (a kernel exists, a transition names a neighbor) that the judge sees straight through. **The drift gate (G6) is doing its job: it failed the round until the meter and the judge agreed within tolerance.** Closing that gap honestly — not by inflating the judge or deflating into noise — is the whole of V0.0.2.

---

## Part II — V0.0.2: the theme is "close the judge gap"

V0.0.1 asked "is the meter flat?" and fixed that (it spreads now). V0.0.2 asks the harder question: **does the meter agree with the judge, and is the content good enough that the judge says 9?** The ranked work falls straight out of the table above — fix the worst-judged artifact first.

### The five workstreams, in judge-impact order

1. **Real assessment items (Pass C).** Quizzes are the worst artifact (1–4/10). Today they're rendered from a single kernel shape with templated distractors. V0.0.2 adds a budgeted authoring pass: genuine items per session — scenario/application MCs whose distractors come from the kernel's _real_ misconceptions, short-answer items with actual keys, one transfer item — contract-linted like voice (no answer leakage, exactly one best option, distractors plausible), compiled-fallback on failure. _Bar: judge quiz ≥ 7 on the four audit courses._

2. **A functional grading scheme.** Every course's syllabus was docked for "weighting per instructor." A4 was right that the model must not _invent_ weights — but silence shouldn't render a non-functional table. V0.0.2 adds a **discipline-aware default distribution** applied only when the brief states none, rendered as an explicit **"suggested weighting (edit me)"** band with its own provenance mark — honest about being a default, functional as a scheme. _Bar: judge syllabus ≥ 8; provenance distinguishes stated vs suggested weights._

3. **Study guides that teach.** Today they restate definitions. V0.0.2 renders, per session: retrieval-practice questions (from the kernel's misconceptions + outcomes), a worked example walkthrough, and a self-check checklist tied to the assessment. _Bar: judge study guide ≥ 7._

4. **Meter recalibration against the judge.** Build a small judged corpus (the 4 audit + 4 stranger courses, real, twice), then re-weight the teachability dimensions until the meter **ranks with the judge (Spearman ≥ 0.7)** and **tracks it (mean |drift| ≤ 1.5)**. The meter stops crediting mere presence: a kernel scores for _specificity of content_, an arc for _operationalized outcomes_, not for existing. _Bar: across the judged corpus, mean |meter − judge| ≤ 1.5, twice on different days; the drift gate tightens from 3 to 2._

5. **Source-text anchoring (humanities/readings).** "No actual poem." A light precursor to v0.4 retrieval: the kernel for a text-bearing concept carries a short, public-domain-safe representative excerpt or a precise locator, and discussions/lessons quote it. _Bar: every named primary text in world-lit appears with a specific anchored passage or locator, not a generic prompt._

### What this is NOT

Not v0.4 (the knowledge flywheel — live retrieval, citation verification, cache-miss promotion) and not v0.5 (two homes). Those bars stand in [ROADMAP-V0.0.1.md](ROADMAP-V0.0.1.md) §IV. V0.0.2 is the content-and-calibration release that earns the right to claim a judge-9 — the precondition for the v1 "beats the prototype" bar.

---

## Part III — Milestones (bars before work)

_Each ships only when its bar holds twice on different days, measured by the same Crucible._

### v0.2.1 — Real items & a functional grading scheme *(next; work order below)*
**Bar:** judge **quiz ≥ 7 and syllabus ≥ 8** on the four audit courses; quizzes pass an item-contract lint (one best option, no key leakage, distractors trace to kernel misconceptions); suggested weights carry a `suggested` provenance mark and sum to 100; structural 100/A held; ≤ $0.15/course with voice; the fake reproduces every new path (the standing rule).

### v0.2.2 — Study guides that teach & lesson-plan concreteness
**Bar:** judge **study guide ≥ 7 and lesson plan ≥ 8**; each study guide carries retrieval questions + a worked walkthrough + a self-check; each lesson plan names concrete timings and an activity per outcome (no outcome unaddressed).

### v0.2.3 — Meter recalibration (the gate tightens)
**Bar:** on a judged corpus (8 courses × 2 days), mean |meter − judge| ≤ 1.5 and Spearman ≥ 0.7; the drift gate moves 3 → 2 and the regression suite stays green at the new gate.

### v0.2.4 — Source-text anchoring
**Bar:** every named primary text renders with a specific anchored passage or precise locator; no humanities lesson scores below 7 on the judge's "is there real text" axis.

### V0.0.2 = all four bars green, twice, different days
At which point the four audit courses sit at **judge ≥ 8 across every artifact** — the launchpad for the v1 bar (beat CourseMapper v0.14.6 on teachability at equal cost, same Crucible, twice).

---

## Part IV — v0.2.1 work order (the only one detailed)

1. **Bar tests first, failing (Law 8 + Law 1):**
   - an item-contract lint test: a quiz with a leaked key / two best options / a generic distractor fails; a kernel-grounded item passes.
   - a grading-scheme test: a brief with no stated weights yields a 100-summing suggested table with `suggested` provenance; a brief WITH stated weights leaves them untouched (A4 preserved).
   - a fake-shaped path test: the fake authors real-item and suggested-weight shapes so the deterministic suite exercises them (standing rule).
2. **Pass C item authoring** in `packages/core/src/author/` — a budgeted, parallel, low-reasoning pass (like voice): per session, author items grounded in that session's kernel; contract-lint each; compiled-fallback on violation; cost itemized in the ledger. New machine detail on the existing states (no new state — items author during/after compile).
3. **Item contracts** in `packages/core/src/author/itemContracts.ts` — one best option, distractors map to distinct kernel misconceptions, short-answer keys reference the kernel, no answer text in the stem. Linted at the boundary; violations quote the rule.
4. **Grading-scheme defaults** in the renderer + a `weightProvenance` mark — discipline-aware distribution (e.g. exams-heavy for stem-quant, participation-bearing for seminars), applied only to null-weight courses, rendered as "suggested weighting (edit me)".
5. **Render the richer quiz** from authored items (fallback to today's compiled items when Pass C is disabled or fails) — the renderer stays pure; items are overlay data like kernels/voice.
6. **Re-run the judged round** on the four audit courses; record quiz/syllabus deltas in the next CHANGELOG; the drift number is the evidence.

_When v0.2.1's bar holds twice, write the v0.2.2 work order. Not before._
