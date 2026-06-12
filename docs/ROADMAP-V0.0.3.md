# Roadmap V0.0.3 — the release that closes the judge gap

_Written June 12, 2026. V0.0.1 built the instruments (exports, a meter that spreads, the judge). The V0.0.2 roadmap planned the content work but shipped nothing. V0.0.3 is the release that **implements** it: the judge's own verdicts, turned into artifacts the judge will score ≥ 8. Audit first, then the plan, then — this time — the build, with bars before each piece (Law 8)._

---

## Part I — Where we are (audit)

V0.0.1 is tagged and clean: 71 tests green, all four audit courses build to ready at 100/A structural on the real provider, the four real-provider bugs the fake couldn't see are fixed (`193924b`), and genome cross-contamination is gated. The instruments work. The product is honest. **It is not yet good enough that a professor would teach it as-is — and we can prove that, because the judge says so.**

The real judged round is the audit. Aggregated across mandarin, cs-python, geology, world-lit (all 100/A structural, judge ≈ 6/10 overall):

| Artifact | Judge | The verbatim complaint, every course |
| -------- | ----- | ------------------------------------- |
| **Quizzes** | **1–4** | "templated distractors", "placeholder key", "tests recognition of canned statements", "nonsensical filler" |
| **Syllabus** | **6–7** | "every assessment labeled 'weighting per instructor' — no functional scoring scheme" |
| **Study guides** | **3–7** | "no retrieval practice, worked examples, or self-check", "a compressed copy of the definitions" |
| **Lesson plans** | **5–8** | "generic", "no concrete timing/exercises", "doesn't operationalize the outcome" |
| **Humanities text** | — | "no actual poem", "supply actual texts" |

And the meter↔judge **drift is 2–5**: our teachability meter says 8–9 where the judge says 4–6, because it credits structural _presence_ (a kernel exists, a transition names a neighbor) that the judge sees straight through. The drift gate (G6) is doing its job — it fails the round until the two agree.

**The diagnosis is unambiguous and ranked: fix the worst-judged artifact first.** That is the whole of V0.0.3.

---

## Part II — What V0.0.3 implements

Five workstreams, in judge-impact order. Each is real content the renderer produces, not a metric tweak.

1. **Pass C — real assessment items.** Quizzes are the worst artifact. Today they render from one kernel shape with templated distractors. V0.0.3 adds a budgeted, parallel, low-reasoning authoring pass (the voice pattern): per session, genuine items grounded in that session's kernel — application/scenario MCs whose distractors are the kernel's _distinct real misconceptions_, short-answer items with actual keys, one transfer item. Each item is contract-linted (exactly one best option, distractors trace to different misconceptions, no answer text in the stem, key references the kernel); a violation falls back to the compiled item, counted. Items are overlay data, like kernels and voice; the renderer stays pure.

2. **A functional grading scheme.** Every syllabus was docked for "weighting per instructor." A4 forbids _inventing_ weights — but silence shouldn't render a dead table. V0.0.3 applies a **discipline-aware default distribution** only when the brief states none, rendered as an explicit **"suggested weighting (edit me)"** band carrying a `suggested` provenance mark. Honest about being a default; functional as a scheme.

3. **Study guides that teach.** Today they restate definitions. V0.0.3 renders per session: retrieval-practice questions (from the kernel's misconceptions + outcomes), a worked-example walkthrough, and a self-check checklist tied to the session's assessment.

4. **Lesson-plan concreteness.** The best artifact, held back by abstraction. V0.0.3 gives each phase a concrete minute budget and ensures every outcome is addressed by a named activity (no orphan outcomes).

5. **Source-text anchoring + meter recalibration.** Text-bearing concepts carry a representative excerpt or precise locator that discussions and lessons quote ("no actual poem" → a poem). And the meter recalibrates: it stops crediting mere presence — a kernel scores for _content specificity_, an arc for _operationalized outcomes_ — so it tracks the judge, and the drift gate tightens 3 → 2.

### The standing rule (from the V0.0.1 audit)
Every real-round bug earns a deterministic fixture, and the fake is shaped to exercise every path the real model hits. V0.0.3 holds to it: the fake authors real-item, suggested-weight, and excerpt shapes so the 70+ test suite catches in CI what would otherwise only surface in a paid round.

---

## Part III — Bars (before the work, Law 8)

V0.0.3 ships when, on the four audit courses, twice on different days:
- judge **quiz ≥ 7**, **syllabus ≥ 8**, **study guide ≥ 7**, **lesson plan ≥ 8**;
- structural **100/A held**, cost **≤ $0.15/course** with voice;
- item-contract lint green (no key leakage, one best option, distractors distinct);
- suggested weights carry the `suggested` mark and sum to 100; stated weights untouched (A4);
- the meter tracks the judge: **mean |drift| ≤ 2** across the four, and the drift gate is set to 2;
- the deterministic suite reproduces every new path (the standing rule).

---

## Part IV — After V0.0.3 (bars, not designs)

- **v0.4 — the knowledge flywheel:** live retrieval (OpenAlex/OpenLibrary) fills empty reading slots and verifies citations; cache-miss kernels get provider-verified and persist; the second same-discipline course links from cache at $0. _Bar in [ROADMAP-V0.0.1.md](ROADMAP-V0.0.1.md) §IV._
- **v0.5 — two homes:** the browser engine (BYO key, IndexedDB) and the metered platform.
- **v1 — beats CourseMapper v0.14.6 on teachability at equal cost, same Crucible, twice.** V0.0.3's judge-≥8 corpus is the launchpad.

---

## Part V — v0.0.3 work order (built in this release, sub-milestone order)

1. **Bars first, failing:** item-contract lint tests (leaked key / two best options / generic distractor fail; kernel-grounded item passes); grading-scheme tests (null-weight brief → 100-summing suggested table with `suggested` mark; stated-weight brief untouched); fake-path tests (fake authors items + excerpts + suggested weights).
2. **Pass C** in `author/items.ts` + `author/itemContracts.ts`; items as `overlays.items`; budgeted/parallel; ledger-itemized; compiled fallback.
3. **Grading defaults** in the renderer + `weightProvenance`; discipline distribution table (data).
4. **Study-guide + lesson-plan renderers** enriched (retrieval Qs, worked walkthrough, self-check; minute budgets, activity-per-outcome).
5. **Excerpts** on text-bearing kernels (schema field + render + fake shape).
6. **Meter recalibration** against the captured judge verdicts; tighten the gate.
7. **Verify:** suite green, python OOXML validation, a real judged round recording the deltas, browser smoke. Ship as V0.0.3, tagged.

_When V0.0.3's bar holds twice, write the v0.4 work order. Not before._
