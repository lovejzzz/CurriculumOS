# Design: The CurriculumOS

_The founding document for the new repository. Written June 12, 2026, from inside CourseMapper v0.14.6, by the agent that built v0.8 → v0.14.6 and audited itself in [BEFORE_V0.14.6.md](../BEFORE_V0.14.6.md). CourseMapper was the prototype that discovered the product. This is the product._

**The thesis in one sentence:** the website was never the product — it is the first client of a brain called CurriculumOS, whose every answer proves itself.

---

## 1. The Laws

Fourteen releases taught these. Each one is written with the scar that taught it, because a law without its scar gets renegotiated the first time it's inconvenient. In the new repo these are not guidelines — they are review criteria.

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

---

## 2. What CurriculumOS is

**CurriculumOS is an engine that turns a description of a course into a verified, internally-consistent, teachable course — and keeps it consistent through every edit.** It is consumed through an API of essentially two verbs, and its first client is a web app with essentially two surfaces.

What it is **not**: not a chatbot that emits documents, not a template mill, not an LMS. It is the layer those things will call.

### The two verbs

```
POST  /courses                  the brief + materials go in;
                                a Course Object comes out — graph, artifacts,
                                grade, provenance, cost — streaming its build
                                states as they happen.

PATCH /courses/{id}             a typed edit goes in;
                                a diff + a fresh grade come out.
```

Everything else is a read or a render:

```
GET   /courses/{id}             the Course Object
GET   /courses/{id}/package     zip | docx-set | pptx-set | (later: scorm, canvas)
GET   /courses/{id}/receipt     grade, provenance ledger, cost ledger, build history
```

**The contract that defines the company: no response without a receipt.** Every 200 carries `quality` (score, findings), `provenance` (where every fact came from), and `cost` (what was spent, on what). The only course API whose answers prove themselves — that is the moat, stated as an interface.

### The five layers of the brain

| Layer            | What it knows                                             | CourseMapper ancestor                |
| ---------------- | --------------------------------------------------------- | ------------------------------------ |
| **Knowledge**    | what is true, what to read, what students get wrong       | genome + shards + open backbone      |
| **Judgment**     | how to teach it — prerequisites, gaps, bridges, standards | buildPrerequisiteJudgment, crosswalk |
| **Structure**    | internally-consistent artifacts, compiled for cents       | courseBlueprintCompiler (decomposed) |
| **Voice**        | sentences a professor would actually keep                 | V0.14.7 WS-D, made first-class       |
| **Verification** | proof — grades, gates, provenance, drift                  | deepQualityGrader + honesty gates    |

---

## 3. The Course Object

One artifact owns everything. Its design answers, by construction, the three problems that cost CourseMapper the most (sync clobbering, stale grades, text-matched identity):

```ts
Course {
  id: string
  brief: Brief                      // the instructor's words, verbatim, forever

  graph: {                          // THE source of truth — typed, id'd, versioned
    sessions:    Session[]          // S1..Sn
    concepts:    Concept[]          // C*, genome-linked where possible
    outcomes:    Outcome[]          // O*, verb-classified
    assessments: Assessment[]       // A<session>.<n> — kind, weight, due
    readings:    Reading[]          // R<session>.<n> — kind, provenance
    resources:   Resource[]
    bridges:     Bridge[]           // prerequisite-gap primers, cited
  }

  overlays: {                       // everything the graph doesn't own but renders with
    kernels: Map<ConceptId, Kernel> // subject-matter: misconceptions, examples, citations
    voice:   Map<SurfaceId, Prose>  // model-authored connective tissue, contract-bound
    edits:   EditEvent[]            // EVERY change, event-sourced — see below
  }

  // artifacts are NEVER stored as truth — always derived:
  //   render(graph, overlays, lens) → syllabus, plans, decks, briefs, rubrics,
  //                                   discussions, quizzes, guides, faq
  receipts: {
    provenance: Map<NodeId, Provenance>   // instructor | genome | retrieved | voiced
    cost:       CostLedger
    quality:    Grade                     // structural score + teachability score
    builds:     BuildRecord[]
  }
}
```

Three deliberate consequences:

1. **Sync is not a feature; it is a property.** Artifacts are pure renders. An edit changes the graph or an overlay; re-render is free and instant; the diff between renders _is_ the sync plan. The hand-maintained dependency map, the stale flags, the regex patch-matching — none of it exists, because the problem it approximated doesn't exist.
2. **Edits are events.** `EditEvent[]` is an append-only log of typed operations (`set_assessment_weight(A7.2, 25)`, `rename_session(S5, …)`, `accept_voice(surface, text)`). This buys undo, time-travel, audit, the PATCH diff, and deterministic replay — and it is what makes the Course Object collaborative-ready later without redesign.
3. **User prose survives every regeneration.** When an instructor hand-edits artifact text, the edit is stored as an overlay patch bound to entity ids — so recompiles re-apply it instead of clobbering it. CourseMapper's most dangerous merge code becomes a map lookup.

---

## 4. The engine

**One isomorphic core.** The engine is a pure TypeScript package — no DOM, no fetch, no storage in the core; effects (model calls, retrieval, persistence) are injected ports. The same engine runs in the browser (client-side compute with your own key — CourseMapper's economics and privacy story, preserved), on a server (the metered API), and in CI (the Crucible grades the engine directly). One brain, three homes, zero drift between them.

**TypeScript, and not apologetically.** The 18,289-line compiler survived on regex contracts and golden files. Types would have caught entire classes of what the Crucible had to catch live. The core is strictly typed; the schema above is real code.

**The pipeline is a state machine** (Law 7), and its states are public API:

```
intake → author → link → judge → compile → voice → verify → grade → ready
                                                              ↘ blocked (named reasons)
```

`POST /courses` streams these as SSE events. The web client's status spine renders them. The Crucible asserts them. One vocabulary, three audiences.

**Stage contracts:**

- **author** — the model writes the typed graph directly (Pass A skeleton at low reasoning + parallel Pass B batches — the proven shape). Verbatim rules for instructor-named things; cadence expansion for "weekly X"; degenerate-skeleton lint fails loudly into a retry, never a hang.
- **link / judge** — genome linking (cache-first — see §7), prerequisite-gap diagnosis with cited bridges, standards crosswalk.
- **compile** — deterministic render of all structural artifacts. **Templates are data, not code**: per-discipline lenses and frames live in versioned data modules consumed by a small render engine (~hundreds of lines, not 18k). Module budget: no file over 1,500 lines, enforced in CI like a bundle budget.
- **voice** — parallel, low-reasoning, budgeted (~$0.04 target). Rewrites only high-read surfaces (brief context, discussion framing, guide narratives). Hard contracts: ids and verbatim titles untouchable, zero new factual claims or citations, length bounds, per-item lint with compiled-text fallback. Voice failures degrade loudly to skeleton, never block.
- **verify / grade** — the ported grader (it earned its place) plus the **teachability dimension** (slot-masked cross-document similarity, sentence-opener variety, emphasis asymmetry — calibrated against the judge ledger before it gates; Law 5 and Law 8 together).

---

## 5. The API, precisely

```
POST /courses
  body: { brief: string, materials?: File[], options?: { voice?, budgetUsd?, lens? } }
  → 202 + SSE stream of machine states with per-stage receipts
  → terminal event: the Course Object
  Idempotency-Key honored; budgetUsd is a hard cap (Law 9).

PATCH /courses/{id}
  body: { ops: EditOp[] }            // typed ops, never freetext field pokes
  → { diff: ArtifactDiff[],          // exactly what changed, per artifact, human-readable
      grade: Grade,                  // ALWAYS re-graded — stale grades are unrepresentable
      cost: CostLedger }             // $0 for pure recompiles; voiced surfaces itemized

GET /courses/{id}/package?format=zip|docx|pptx        (scorm, canvas: later clients)
GET /courses/{id}/receipt
POST /courses/{id}/chat                                // the TA — tool-calling agent
                                                       // whose tools are EditOps,
                                                       // so agent edits get diffs and
                                                       // re-grades like everyone else
```

Auth: bring-your-own-key (browser engine, free tier — the CourseMapper deal) or metered platform keys (server engine). Same core either way.

---

## 6. Client #1 — the web app: a Door and a Desk

_CourseMapper remains the brand of this client: "CourseMapper, built on CurriculumOS." Everything below is designed against the lessons of the v0.14.4 calm-surface work — one narrator, one verb, a 12px floor, counted exceptions, codified in CI._

### The Door

One screen. One decision (Law: the dominant path is defaults).

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│            What course are we building?                  │
│                                                          │
│   ┌────────────────────────────────────────────────┐     │
│   │ Intro to Microeconomics, 14 weeks, two         │     │
│   │ midterms, weekly problem sets, we read         │     │
│   │ Freakonomics ch. 1–4 in week 3…                │     │
│   │                                  [⎘ drop files] │     │
│   └────────────────────────────────────────────────┘     │
│                                                          │
│   heard so far:  14 weeks · 2 midterms · weekly sets     │
│                  📖 Freakonomics (week 3) · econ lens     │
│                                                          │
│                       [ Build my course ]                │
│                         adjust details ▸                 │
└──────────────────────────────────────────────────────────┘
```

The one new idea: **"heard so far."** As the instructor types or drops a syllabus, the intake stage reflects back — live, as chips — the entities it's extracting (weeks, assessments, readings, discipline). Trust starts before the first API call, and transcription errors get caught at the door instead of in the deliverables. "Adjust details" is the progressive-disclosure path to model/scope/deliverable choices; nobody is forced through it.

### The Desk

The workspace. Three permanent elements and only three — everything learned from the calm-surface releases, finished:

```
┌─ THE SPINE ──────────────────────────────────────────────────────────┐
│  ● author ✓ link ✓ judge ✓ compile ● voice ○ verify ○ grade   $0.11  │
├──────────────────────────────────────────┬───────────────────────────┤
│                                          │  THE TA                   │
│   THE COURSE                             │                           │
│   one continuous, beautiful document —   │  "Week 9's load is 2×     │
│   the course map as its spine, every     │   week 8 — want me to     │
│   artifact unfolding inline beneath      │   rebalance?"             │
│   its session. No tabs. Reading order    │                           │
│   = teaching order.                      │  [review queue: 2]        │
│                                          │                           │
│   S5 · Elasticity            ⌄           │  every block has a quiet  │
│     plan · deck · A5.1 brief · rubric    │  "ask" handle; the TA's   │
│     R5.1 Freakonomics ch.3                │  edits are EditOps —      │
│                                          │  diffed, graded, undoable │
├──────────────────────────────────────────┴───────────────────────────┤
│   THE SEAL   Quality 100 · Teachable 8/10        [ Download ▾ ]      │
└──────────────────────────────────────────────────────────────────────┘
```

- **The Spine** — the single narrator. Renders machine states verbatim (Law 7). The cost ticker lives here (Law 9). Nothing else in the product announces status, ever.
- **The Course** — the artifact set as **one continuous document**, not eleven tabs. The course map is its table of contents; each session unfolds its plan, deck, briefs, rubric, readings inline. This is the deepest UI lesson inverted: CourseMapper fragmented the course into deliverable silos and then needed registries to stitch them back; here the desk shows the stitched whole and the formats are just exports.
- **The TA** — the agent, proactive but polite. Its tools are EditOps, so everything it does arrives as a diff with a fresh grade, reviewable in one queue. The proposal/diff/receipt loop was CourseMapper's best interaction; here it is the _only_ edit pathway — humans and agent use the same door.
- **The Seal** — the grade, always current (a stale seal is unrepresentable; every edit re-grades), always one click from its full receipt. **Two numbers, deliberately**: structural quality and teachability. We will never again let one perfect number hide a 5/10.
- **One verb.** The primary button morphs with the machine: `Build → Building… → Review 2 → Download`. Every other action lives behind it.

**Editing = sync, visibly.** Change A7.2's weight to 25% anywhere — the map cell, the syllabus table, the TA. The PATCH returns its diff, and the desk plays it: the three affected blocks glow, a one-line card reads _"Syllabus grading table · Rubric A7.2 · Study guide S7 updated — re-graded 100/A, $0.00"_. That four-second moment is the IP made visible, and it is the product's signature interaction — the thing no prompt-wrapper can imitate.

**Design system, codified on day 1:** the v0.14.4 tokens carried over as law — slate=structure, indigo=interactive, amber/green/red=status only; 12px reading floor with a counted badge scale; one radius scale; sentence case; a global dark layer; WCAG AA measured in CI; the scans that catch their own author (Law 10).

---

## 7. The knowledge flywheel

The genome is a **cache, not an encyclopedia** (the calculus 5/15 lesson). Linking is cache-first; on miss, one low-reasoning extraction call proposes kernel candidates whose citations must resolve through the open backbone (OpenAlex/OpenLibrary) before anything persists — the model proposes, the providers verify, nothing model-invented survives unverified. Verified kernels persist to the commons under the existing privacy boundary: **concept abstractions only, never course or instructor content.**

The flywheel: the second economics course anyone builds, anywhere, links instantly and free. Every course taught makes the brain smarter for everyone. This is the network effect, and it requires the server home of the engine — which is why it ships with the API, not before.

---

## 8. Quality as physics: the Crucible is the CI

The new repo's CI has four gates, in order of cheapness: types → unit/golden → **artifact gate** (compile fixtures, grade the rendered files) → **Crucible rounds** (drive the real client, download the real package, grade, diff against the verdict ledger, judge on schedule). A change that improves code but degrades artifacts does not merge. The dual meter gates releases: structural score **and** teachability score, each with its own bar, defined in advance (Law 8).

The incumbent baseline is CourseMapper itself: until the new engine beats v0.14.6's packages on teachability at equal-or-better cost — measured by the same Crucible, twice, on different days — there is no v1.

---

## 9. Economics

| Operation                  | Target             | How                                            |
| -------------------------- | ------------------ | ---------------------------------------------- |
| Build (15 lessons)         | **≤ $0.15, ≤90s**  | native authoring + parallel batches + voice    |
| of which: structure        | $0                 | compiled                                       |
| of which: voice            | ~$0.04             | low-reasoning, parallel, hard-capped           |
| Edit (structural)          | **$0, <5s**        | recompile + diff                               |
| Edit (touches voiced text) | ≤ $0.01, itemized  | surface-scoped voice refresh                   |
| Genome cache hit           | $0                 | the flywheel                                   |
| Genome miss                | ≤ $0.05, once ever | extraction + verification, then cached for all |

Every number above appears in receipts. The budget cap is a request parameter, honored hard.

---

## 10. The repository

```
curriculumos/
├── packages/
│   ├── core/          # the pure engine: schema, machine, compile, verify, grade
│   │   └── (no file over 1,500 lines — CI-enforced; templates are data/)
│   ├── voice/         # the voice pass: contracts, lints, budget
│   ├── knowledge/     # genome cache, providers, judgment  (shards ported as seed data)
│   ├── api/           # the server home: routes = the §5 surface, SSE, metering
│   └── crucible/      # the harness, verdict ledger, judge — ported and promoted
├── apps/
│   └── coursemapper/  # client #1: the Door and the Desk
├── design/
│   ├── LAWS.md        # §1 of this document, normative
│   └── tokens/        # the design system, consumed by CI scans
└── docs/              # this file is docs/000-founding.md
```

**Port, don't rewrite, what earned its place:** the grader, the genome shards, the exporters (mind the façade trap and the universal-fonts rule), the judge prompts, the verdict ledger, the defect-pattern library. **Rewrite** what the audit indicted: orchestration, parsing (deleted, not rewritten), the dependency map (deleted — recompile-and-diff), the three-screen onboarding. **Leave behind:** every line that exists to repair prose the model should never have written.

---

## 11. Build order

Each milestone has its bar before work begins (Law 8). The Crucible runs from M1 onward.

- **M0 — The spine.** Schema, state machine, event log, API stubs, repo CI (types, file budgets, token scans). _Bar: a Course Object round-trips through every machine state with a fake model; replay is deterministic._
- **M1 — Structure.** Native authoring + ported compiler over the new schema; artifact gate live. _Bar: grader 100/A on the four original audit courses; cost ≤ $0.08._
- **M2 — Verification + the Seal.** Grader + teachability dimension + receipts in every response. _Bar: teachability metric calibrated against the judge ledger._
- **M3 — Voice.** _Bar: judge ≥ 7/10 on two courses, structural 100/A held, ≤ $0.15 total — the number CourseMapper could never reach._
- **M4 — The Desk + PATCH.** Door, Desk, TA-as-EditOps, sync-as-diff. _Bar: the four-second edit moment works live; grade always fresh; Crucible learns to edit._
- **M5 — The flywheel + the API public.** Genome cache + commons + metered keys. _Bar: second-course-cache-hit demonstrated; the two verbs documented and stable._
- **v1 = beats CourseMapper v0.14.6 on teachability at equal cost, same Crucible, twice.** The prototype retires the day its student surpasses it.

---

## 12. The one-paragraph summary

CurriculumOS is a five-layer brain — knowledge, judgment, structure, voice, verification — wrapped around one artifact, the Course Object: a typed, event-sourced graph whose documents are renders, whose edits are diffs, and whose every answer ships with its own grade, provenance, and price. It is consumed through two verbs and experienced through two surfaces — a Door that listens and a Desk where a course lives with its TA — and it is held to its promises by the same instrument that taught us everything in this document: a harness that grades the real artifact, against bars set before the work, twice, on different days. The prototype proved the brain is buildable. Now we build it as what it always was: the product.
