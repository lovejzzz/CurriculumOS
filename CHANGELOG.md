# Changelog

## V0.0.8 — June 12, 2026

Workstream E of [the 10/10 plan](docs/PLAN-10-OF-10.md): genome breadth for the
stranger disciplines + the flywheel proven LIVE.

- **Three new shards** — `arts` (the art-history survey AND music-theory
  fundamentals: 27 concepts, from formal analysis through the avant-garde,
  staff notation through phrase structure), `philosophy` (11 concepts with
  public-domain primary texts: Plato, Descartes, Hume, Mill), `business`
  (11 business-ethics concepts whose worked examples are decidable mini-cases).
  Every concept carries citations, ≥1 misconception (most 2), and prereq
  edges; an out-of-order music course deterministically fires a bridge.
- **The link bar**: art-history, music-theory, intro-philosophy, and
  business-ethics each link ≥8 concepts (deterministic tests on the verbatim
  stranger briefs); world-lit keeps its lit links — philosophy shares the
  humanities lane without stealing a single lesson. Public speaking stays
  deliberately unsharded as the suite's honest cache-miss probe (the role
  art history just graduated from).
- **The flywheel turned live**: one real build of public-speaking with live
  retrieval promoted 2 model kernels corroborated by OpenAlex topics
  ("audience analysis" C2776427610, "source credibility" C2776620684),
  persisted them to `.data/genome/ext-humanities`, and re-linked 3 concepts
  from the extension at $0 — `packages/crucible/src/flywheel-live.ts` is the
  repeatable driver.
**Five real judged rounds, three scars fixed, each with its fixture:**

| round | result | what it exposed |
| --- | --- | --- |
| 1 | FAIL (drift 3) | the HARNESS lying: judge sampling sliced artifacts at a silent 6,000 chars, so post-Pass-D lesson plans read as truncated and both courses were docked for a cliff the harness created → excerpts now cut at a line boundary with an explicit marker |
| 2 | FAIL (drift 5) | business-ethics 6→**8, drift 1** ✓ — but art-history WORSE: lit's "Magical realism" (García Márquez) linked into the Realism painting session by EXACT name match → all matches now obey the discipline lanes |
| 3 | FAIL (drift 3) | García Márquez STILL there and links collapsed to 3 — root cause: the real model classifies art history as 'humanities', locking out the arts shard and opening the lit lane → **discipline is deterministic-first now** (a brief-cue hit overrides the model; the model fills in only on 'general') |
| 4 | blocked | transient: Pass A returned malformed JSON twice ($0.005, named, re-run) |
| 5 | **PASS** | art-history judge **7/10, drift 1, linked 19**, S11 mismatch gone (lesson 2→8); the surviving complaint — duplicated 'Watch out for' rows when two concepts share one kernel — fixed + pinned after the round |

- Item-kind synonym intolerance fixed twice over (`'multiple-choice'`, then
  `'applied-transfer'` in the very next round — normalized at the boundary,
  the Bloom-case lesson again).

105 tests green. Honest residuals, named for the v0.0.9 campaign: syllabus
texture (weekly assessments render as near-identical schedule entries, many
sessions without readings on no-reading briefs) and study guides that echo
lesson language instead of independent retrieval practice.

## V0.0.5–V0.0.7 — June 12, 2026 (one tree, three campaign scopes)

The first three iterations of [the 10/10 plan](docs/PLAN-10-OF-10.md), shipped
together so every tag is a green tree. Judged validation of all three runs in
the v0.0.9 campaign (per-iteration rounds were traded for one comprehensive
measurement — economical and the campaign measures twice anyway).

### v0.0.5 — items reliability (workstream A)
- **Fallback instrumentation**: every Pass C fallback is NAMED per session in
  the build record and round report. It paid for itself in its first round:
  the ~85% fallback rate was MY lints, not the model — a Latin-minded
  content-word check stripped all hanzi ("generic filler" on every Chinese
  distractor — the kit's K1 scar, reproduced and fixed script-aware), a
  verbose-key demand on MC items (the marked correct option IS the key), and
  case-intolerant Bloom enums ('apply' vs 'Apply').
- **Fallback floor**: compiled quizzes ship misconception-grounded items only —
  ≥2 misconceptions → MC with real distractors (at most one generic option);
  exactly 1 → an honest true/false-with-explain; 0 → short-answer/applied.
- **Exams through Pass C**: exam docs use the strongest authored item per
  covered session; rotating stems for the compiled remainder.
- Items budget scales with course size.

### v0.0.6 — Pass D: content-woven activities (workstream B)
- A budgeted, contract-linted pass writes each session's 4-phase activity
  sequence USING the kernel — the worked example becomes the core script, the
  excerpt the close-reading object — with minutes summing to a real class
  period, EVERY outcome operationalized, a 2-minute check per phase, and one
  concrete performance task. Lens frames remain the loud fallback.
- Contracts: outcome coverage, kernel-vocabulary grounding (script-aware),
  phase distinctness, real-period minutes; violations quoted on retry.

### v0.0.7 — the complete syllabus + categorized voice (workstreams C+D)
- **Retrieval fills EMPTY reading slots** (retrieved-open provenance, relevance-
  gated, one per session, instructor slots untouchable per R1).
- **Per-discipline policy library** (data): cs AI/collaboration policy, lab
  safety, seminar participation, clinical confidentiality, target-language
  classroom norms, problem-set collaboration rules.
- **Confidence language**: "Default weighting — adjust to taste" (a default is
  a decision made FOR the instructor, not an unfinished blank).
- **Voice fallbacks categorized** (W1-frozen / W2-no-new-facts / W3-bounds /
  provider) in the build record; bounds now scale with the surface (short
  compiled chips accept 40+ words — the fixed 60 floor was rejecting honest
  tightenings).

94 tests green; the suite stays offline (a live-retrieval leak into the API
tests was caught by its 50× slowdown and sealed with COS_NO_RETRIEVAL).

## V0.0.4 — June 12, 2026

The knowledge flywheel begins (docs/ROADMAP-V0.0.4.md). The V0.0.3 residual was
unambiguous: the judge rewards verified knowledge, and the two courses with ZERO
genome coverage (mandarin, world-lit) sat at judge 5–6.

**Real judged round (gpt-5.4-mini, voice + items + live retrieval):**

| | linked (was) | judge (was) | drift |
| --- | --- | --- | --- |
| mandarin | **8 (0)** | **7 (6)** ✓ bar met | 0 |
| world-lit | **19 (0)** | 5 (5–6) — residual named below | 2 ✓ gate |

- **`lit` and `lang` shards** — citation-bearing kernels for the two uncovered
  disciplines, with public-domain excerpts (Du Fu, Dante, Eliot, Gilgamesh,
  Sophocles…) and real hanzi + tone-marked pinyin throughout. Mandarin's study
  guide judged 8/10 ("content-rich").
- **RetrievalPort + live providers** — OpenLibrary (works) and OpenAlex (topics)
  at the API edge: instructor-named readings gain verified external ids with the
  title byte-identical (R1); failures are named in the build record (Law 6).
- **The citation relevance gate** — bidirectional distinctive-token evidence;
  calibration encodes both prototype scars ("Cooking with Statistics" rejects;
  partial-title-with-author passes).
- **Kernel promotion + the extension store** — cache-missed concepts corroborated
  by a provider topic gain provider citations, flip provenance to `retrieved`,
  and persist under `.data/genome/`; the SECOND same-discipline build links them
  at **$0** (deterministically tested — the flywheel turns).
- **Two judge-caught rendering defects fixed:** concepts sharing one genome entry
  rendered duplicate kernel sections (world-lit S4 plan: 3 → 5); the correct MC
  option was always "A" — positions now rotate deterministically in both the
  compiled and authored paths.
- Discipline cue fix ("art history" no longer classifies as humanities via the
  bare 'history' cue); over-generic cross-discipline aliases removed.

88 tests green (relevance calibration, R1 enrichment, flywheel cache hit, named
misses — all offline via a fake retrieval port). **Honest residual:** world-lit
judge 5 — its S4 quiz fell back to compiled items (2/10, "absurd distractors")
and plans still need text-specific activities; Pass C reliability +
instrumentation is the next iteration's first target.

## V0.0.2 — June 12, 2026 (audit + fixes, folded into V0.0.3)

The V0.0.2 roadmap planned the judge-gap work; before it shipped, a real judged
round across all four audit courses surfaced four bugs the fake engine couldn't
see — all fixed (`193924b`): Pass A schema intolerance (blocked every course),
an assembler TDZ crash on model-returned readings/resources (masqueraded as
"provider-failure"), genome cross-contamination (a Tang-poetry lesson carrying
nursing content), and 429 backoff too short with failures masked behind bare
reason codes. Standing rule adopted: every real-round bug earns a deterministic
fixture, and the fake is shaped to exercise every real path.

## V0.0.3 — June 12, 2026

Closes the judge gap (docs/ROADMAP-V0.0.3.md). The V0.0.1 judge scored courses
≈ 6/10 with a 2–5 point meter↔judge drift; the meter over-credited structure the
judge saw through. V0.0.3 turns the judge's own verdicts into content, worst
artifact first, and recalibrates the meter to track it.

**Real judged round, all four audit courses (gpt-5.4-mini, voice + items):**

| | structural | meter | judge | drift |
| --- | --- | --- | --- | --- |
| mandarin | 100/A | 7 | 6 | 1 |
| cs-python | 100/A | 7 | 7 | 0 |
| geology | 100/A | 7 | 5 | 2 |
| world-lit | 100/A | 7 | 6 | 1 |

**Drift collapsed from 2–5 to 0–2** (mean 1.0) — every course within the
tightened gate; the round PASSES. ~$0.15/course.

- **Pass C — real assessment items.** A budgeted, parallel, contract-linted pass
  authors genuine quiz/exam items grounded in kernel misconceptions (one best
  option, distractors trace to distinct misconceptions, no key leakage, real
  short-answer keys); items are overlay data, renderer prefers them with a
  compiled fallback. (cs-python quiz: judge 4 → no longer the dragging artifact.)
- **Functional grading scheme.** Discipline-aware *suggested* weights when the
  brief states none — marked "suggested (edit me)", summing to 100, graph weights
  left null (A4); rubric and FAQ agree. (Every syllabus was docked for "weighting
  per instructor.")
- **Study guides that teach.** Retrieval-practice self-tests (de-duped from the
  self-check), a worked walkthrough, and an outcome checklist.
- **Lesson-plan concreteness.** Minute budgets (~50 min) and every outcome timed
  to a phase (no orphan outcomes).
- **Source-text anchoring.** Kernels carry a public-domain excerpt or a precise
  locator (copyright-safe by prompt); lessons render an actual "Primary text".
- **Meter recalibrated (teachability v3)** to credit kernel depth, real items,
  functional grading, operationalized outcomes, and retrieval practice — not mere
  presence; only an actual excerpt counts, not a bare locator. Drift gate 3 → 2.
- **Two real rendering bugs the judge caught and fixed:** a malformed study-guide
  overview (a lead template that needed a verb but got a noun) and duplicated
  retrieval/self-check rows.

81 tests green; OOXML revalidated (68 docx / 15 pptx / 1 xlsx). Honest residual:
judge scores are 5–7, not yet ≥8 everywhere — deeper content quality on
no-genome courses (a literature shard, retrieval) is the v0.4 line, where the
judge rises to meet the meter rather than the meter being gamed down.

## V0.0.1 — June 12, 2026

The first framed release: the full rebuild from the [handoff kit](docs/handoff/) plus the
[Roadmap V0.0.1](docs/ROADMAP-V0.0.1.md) v0.1 work order and the v0.2/v0.3 substance,
implemented and verified. Every bar below has a test pinning it.

### Teacher-ready exports (the roadmap's v0.1 — Law 1: the artifact is the test)
- **DOCX** for every text artifact — bulk + per-session files, Georgia body / Trebuchet MS
  headings (the universal set), real tables; validated file-by-file with python-docx (80/80).
- **PPTX** decks — speaker notes on every slide, two NATIVE drawn visuals per deck
  (concept map: nodes + connectors; worked-example chart: step bars) rendered from graph
  data at $0; validated with python-pptx (14/14 decks, 126 slides).
- **XLSX** course map; kit folder layout, zero-padded filenames.
- **Export audit** reopens the rendered BYTES every Crucible round: placeholder leakage,
  encoding damage, phrase repetition, font drift — P0s fail the round.
- **Materials-in**: drop a syllabus (.txt/.md/.docx/.pdf) at the Door — extracted at the
  edge, hashed into `brief.files`, read by intake and authoring. Unextractable files
  degrade loudly by name, never silently.
- POST idempotency persisted with a 24h window; brief/upload size caps.

### The meter means something now (the roadmap's v0.2 — Law 5, ADR-11)
- **Teachability v2** spreads: a deliberately thin build (no kernels) scores ≤4, a rich
  one ≥7 — pinned by calibration tests. Dimensions: sameness (shingle uniqueness),
  specificity (kernel richness + item variety), arc (neighbor-aware transitions, opener
  variety, lens-specific activities, gated by content coverage).
- **The judge**: `crucible --judge` asks a model the prototype's question — *would a
  professor teach from this as-is?* — over sampled real artifacts; the drift between
  judge and meter is the gated number (>3 fails the round, G6).
- **Verdict-ledger calibration**: every distinct checkId in the prototype's verdicts.json
  maps to a covering control (test-enforced) — initials never trip the texture scan,
  truncated prose bullets DO trip, hanzi pairs with pinyin in study guides, doubled
  option letters are structurally unrepresentable.
- **Content depth**: discipline-specific session arcs (cs code-alongs, lab protocols,
  seminar close-readings, clinical cases, language drills…), two misconceptions per
  kernel (each powering a distinct MC distractor), neighbor-aware transition notes,
  richer decks (agenda + misconception slides).

### One sequencing truth (Law 7, closed)
- The pipeline now drives the exhaustive-tested reducer for every stage change; an
  illegal transition throws rather than ships.

### The Desk completes (the roadmap's v0.3, the cheap half)
- **The receipt**: click the Seal — findings, cost ledger (per-stage tokens and USD),
  provenance summary, build history. No response without a receipt, now visibly.
- **Undo**: event-sourced replay from the base snapshot (ADR-05); model-assisted edits
  that can't replay deterministically refuse by name.
- **The proactive TA**: pure observation lints (load imbalance, uncovered sessions,
  unanchored readings, weight gaps) surface in the Queue with one-click reviewable fixes.
- **The Door** takes file drops with live extraction chips.

### Numbers (verified this release)
- 68 tests green; CI gate: strict TS (packages + app), 1,500-line file budget,
  core-purity import lint, design-token scans.
- Real-provider builds (gpt-5.4-mini, voice on): 100/A structural, $0.05–$0.09/course.
- All ten fixture courses: 100/A, zero findings; econ seeded prerequisite gap bridged.

### Deferred, deliberately (per the roadmap's own rule)
v0.4 knowledge flywheel (retrieval providers, citation relevance gate, cache-miss
promotion) and v0.5 two homes (browser engine + metered platform) — their bars are
written in [docs/ROADMAP-V0.0.1.md](docs/ROADMAP-V0.0.1.md); their work orders get
written when this release's bars hold twice on different days.
