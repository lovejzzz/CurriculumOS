# 020-contracts.md — the learned contracts

_Every rule here was paid for with a live defect in the prototype. Source locations in CourseMapper are given so the builder can read the original implementation and its pinning tests. These contracts are linted at the boundary where model output enters the system; violations retry once with the violated rule quoted, then fail loudly (`contract-violation`), never silently degrade._

## V — Verbatim rules (authoring)

- **V1.** Instructor-named things are transcribed **verbatim**: course title, session titles the brief names, assessment titles ("Midterm Exam: minerals through metamorphic rocks"), reading titles, named policies. No paraphrase, no normalization, no title-casing. _Scar: finalizer "shortening" once rewrote instructor titles; verbatim titles are exempt from every cleanup pass._ (Prototype: verbatim exemptions in `packageFinalizer.js`, `compiledLanguageFinalizer.js`.)
- **V2.** The brief is immutable and stored whole. Anything the system inferred must be traceable to a span of it or marked as inferred — that is what powers the Door's "heard so far" and the provenance receipts.

## A — Authoring contracts (Pass A / Pass B)

- **A1. Cadence expansion.** "Weekly quizzes/problem sets/journals" → `cadence: 'per-session'` AND one registry entry per covered session. _Scar: the model honestly transcribed "weekly quizzes" as ONE assessment → degenerate registry → uncaught compiler throw → silent 10-minute hang (native Round B)._ (Prototype: RULE 4 in `NATIVE_SKELETON_SYSTEM_PROMPT`, `src/lib/prompts.js`.)
- **A2. Degenerate-skeleton lint.** After Pass A: `assessments.length >= sessions.length` when any per-session cadence was named; sessions ≥ the weeks the brief states; every exam names `coveredSessionIds`. Failure → one retry with the expansion rule quoted → `blocked('degenerate-skeleton')`. Loud, named, never a hang. (Prototype: `isDegenerateNativeGraph`, `src/lib/nativeGraphAuthoring.js`.)
- **A3. Resource transcription.** Pass A transcribes supporting resources/materials per session. _Scar: the one gap that kept native authoring behind its flag — 66 "unresolved source placeholder" P1s from untranscribed resources._
- **A4. Weights discipline.** Transcribe stated weights; never invent missing ones — `weightPct: null` is the honest value. The syllabus renderer prints "weighting per instructor" rows for nulls rather than fabricating a 100% table.
- **A5. Stable ids at birth** (Law 3). Pass B batches reference Pass A ids; a batch returning unknown ids fails the batch, not the build. (Prototype: `matchEntityIds` B4 stability.)

## K — Kernel contracts (subject matter)

- **K1. Script-aware lint.** Minimum term length is 1 for non-Latin scripts, 3 for Latin. _Scar: hanzi vocabulary rejected as "too short" by a Latin-minded lint._ (Prototype: `NON_LATIN_SCRIPT_RE` in `blueprintEnrichmentPass.js`.)
- **K2. Romanization.** For non-Latin-script courses, every term carries romanization (`rm`); a missing-rm kernel triggers recovery within the retry budget, and the recovery is itemized in cost. (Prototype: `ROMANIZATION_PROMPT_LINE`.)
- **K3. Citations are never model-trusted.** The model proposes citation _candidates_; only those that resolve through providers (OpenAlex/OpenLibrary) persist, and the relevance gate applies: topical-overlap yield against the concept, generic tokens excluded, discipline allow-lists (e.g., medicine sources allowed for stats/nutrition/nursing/psych), product-side blacklist for known bad attractors. _Scar: an Alzheimer's paper cited on an immunology concept; STROBE rejected for stats by an over-tight gate; both directions failed before the current design._ (Prototype: citation relevance gate, v0.14.1; calibration cases in its tests.)
- **K4. Kernel invalidation is hash-based.** Kernels store `basedOn` hashes of the outcome/title text that shaped them. Structural edits that change those hashes invalidate the kernel (eligible for `kernel.refresh`, ≤$0.01, itemized); cosmetic edits do not. _Scar: prototype sync silently recompiled without kernels at all — audit §2.9._

## W — Voice contracts

- **W1. Frozen text.** Registry ids, verbatim titles (V1), citation strings, and requirement lines (e.g., "Anchor your post in _Antigone_") are immutable inside a voiced surface — voice wraps them, never rewrites them.
- **W2. No new facts.** A voiced surface may not introduce factual claims, names, numbers, or citations absent from the graph/kernels it was grounded in. Lint: extract entities from output, diff against grounding set.
- **W3. Bounds.** 60–140 words per surface (per-surface overrides in artifact specs); sentence-case; no headers inside surfaces.
- **W4. Fallback, never block.** Any violation after one retry → surface reverts to compiled skeleton with `status: 'fallback'`, counted in the receipt and the QUALITY_REPORT. A voice failure can never make a package worse than no voice at all.
- **W5. Hard budget.** The voice stage has a per-build cap (~$0.04 target); exhaustion mid-pass voices what it can, falls back for the rest, and says so (Law 6 + Law 9).

## R — Readings & provenance

- **R1. Provenance total order:** `instructor-named > instructor-provided > genome-cited > retrieved-open`. Retrieval attaches only to EMPTY slots; it may enrich metadata of an instructor-named work (ISBN, year) but may **never** replace its title or identity. _Scar: the V0.14 audit found instructors' own canons displaced by retrieved "relevant readings."_
- **R2.** Every rendered mention of a reading resolves its `ReadingId` — the syllabus Required Texts list, schedule rows, plan materials, brief source cues, and discussion anchors are all renders of the same entity (one fact, one place).

## G — Honesty gates (the finalize checklist)

Carried whole from the prototype; each was added after a silent failure shipped:

1. **Degraded-plan guard** — any stage that runs in a reduced mode must mark the build; reduced mode is a named state in receipts, never an inference.
2. **Coverage gate** — kernel coverage below threshold blocks "ready" (it warns ≥60%, blocks below); partial enrichment is named per session.
3. **Reconciliation gate** — every graph assessment has its downstream artifacts (brief+rubric for graded-artifacts, exam doc for exams, oral brief for orals); orphans are findings, extras are findings.
4. **Export rendered-text audit** — rendered files are reopened and scanned: phrase repetition (8-word shingles, limit 12 per section), placeholder leakage (`[`, `{`, "TBD", "Lorem"), encoding damage.
5. **Grade-or-say-why** — a package without a grade carries the named reason; the seal never silently disappears.
6. **Drift gate** (CI): in-app grade vs external Crucible grade within 3 points or the round fails.

## P — Prompt mechanics (provider-level)

- JSON-mode calls must include the word "JSON" in the user prompt (OpenAI rejects otherwise).
- Token/cost accounting uses provider-reported usage only; never estimate when the provider reports.
- Per-provider key prefixes validated at entry (`sk-`, `sk-ant-`, `AIza`); keys are never logged — redaction patterns cover all three.
- Cost-bearing call sites are a **whitelisted enum** — adding a call site is a reviewed schema change, and a trailing-events test asserts no call site emits after its stage completes. _Scar: untracked call sites once made the ledger lie by omission._
