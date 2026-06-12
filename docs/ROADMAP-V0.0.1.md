# Roadmap V0.0.1 — the audit, the path to 10/10, and what comes next

_Written June 12, 2026, immediately after the handoff-kit rebuild shipped (commits `404cb11`, `c8f947f`). This document is three things: an honest audit of what exists, the engineering plan for genuine 10/10 teachability, and the versioned roadmap with bars defined before work begins (Law 8). It follows the kit's discipline: one milestone's order is detailed at a time; later milestones get bars, not designs._

---

## Part I — The audit

### What exists and works (verified, not vibes)

| Layer | State | Evidence |
| --- | --- | --- |
| **Schema / Course Object** | ✅ complete | 010-schema types verbatim; zod validation; id-format + cross-ref rules; named errors. 46 tests. |
| **State machine** | ✅ complete | Hand-rolled reducer, exhaustive state×event test, retry/blocked semantics per the table. |
| **EditOps** | ✅ complete | Full catalog applied atomically with preconditions, dense-seq events, invalidation table. One edit pathway (instructor = TA = system). |
| **Authoring** | ✅ working | Typed Pass A/B (no prose intermediate), cadence expansion, degenerate lint + retry, bounded-concurrency waves, kernel candidates on genome miss (incl. romanization — real build authored 你好 → nǐ hǎo). |
| **Knowledge** | ◐ partial | 8 handwritten shards (~100 concepts), cache-first linker, prereq judgment (seeded econ gap caught every run). **No retrieval providers, no cache-miss persistence, no commons.** |
| **Compile/render** | ✅ working | All 9 artifact kinds + course map from one pure render; templates are data; phrasing pools; markdown package (zip + manifest + quality report). **No DOCX/PPTX/xlsx.** |
| **Voice** | ◐ working | W1–W5 enforced, violations quoted on retry, parallel waves, budget-capped. Real-build fallback rate 26–47% — honest but high. |
| **Verify/grade** | ◐ working | Structural grader (reconciliation, coverage, placeholders, texture, verbatim, weights) — all 10 fixture courses 100/A, 0 findings. Teachability proxy exists but is **uncalibrated** (see below). |
| **API** | ✅ working | The two verbs + reads + TA chat; SSE; closed error taxonomy; idempotency (PATCH); If-Match; budget cap; provider-reported cost; key redaction. |
| **Web client** | ◐ working | Door (live "heard so far"), Desk (Spine/Course/TA/Seal), four-second sync moment verified in-browser. Several founding-doc affordances missing (below). |
| **Crucible** | ◐ skeleton | Drives the engine, grades, writes round reports, seeded-gap honesty check, `--real --max-spend`. **No judge, no drift gate, no client-driving.** |
| **Guardrail CI** | ✅ armed | Strict TS, 1,500-line budget, core-purity import lint, token scans (floors/accent/radius + counted 10px ledger), 46 tests, app build. |

Measured economics (real `gpt-5.4-mini`, voice on): **$0.049–$0.086 per 12–15-lesson build, ~60–70s** — under the $0.15/90s target. Structural edits: $0, instant.

### The honest defect list

**P0 — the meter is flat.** The extended round grades all ten fixture courses **exactly 7/10 teachable**. A meter that cannot tell a mandarin course from an astronomy course is not yet measuring teachability — it is decorating the Seal (trap #11: the second number disappearing into the first). Cause: the proxy (sameness/specificity/arc) was designed from first principles but never calibrated against the judge's verdicts (`packages/crucible/fixtures/verdicts.json` is shipped **and unread by any code**). The M2 bar — _teachability metric calibrated against the judge ledger_ — is unmet. Nothing else in this document matters more.

**P0 — exports are not teacher-ready.** The package is markdown. Real instructors open Word and PowerPoint. The kit's spec (DOCX bulk + per-session, PPTX decks, xlsx course map, Georgia/Trebuchet) is unimplemented. Until this lands, no professor downloads the zip and teaches Monday morning — which is the product's one-sentence promise.

**P1 — the pipeline does not drive the reducer.** `buildCourse` emits machine states directly; the tested reducer sits beside it rather than underneath it. Two sources of truth for legal sequencing is exactly the Law 7 scar in miniature. (The exhaustive test keeps the table honest, but the pipeline could drift from it without a test failing.)

**P1 — knowledge layer is a cache with no fill mechanism.** Retrieval (OpenAlex/OpenLibrary) is absent: instructor-named readings never get enriched metadata, empty reading slots never fill, kernel citations can't verify, bridges cite only the genome, and cache misses produce kernel candidates that are never promoted to verified. The flywheel (founding §7) has no intake.

**P1 — voice coverage and pass rate.** Only ~6 surface kinds are voiced; 26–47% of surfaces fall back on real builds. The W2 no-new-facts lint is a proper-noun/number heuristic — it still rejects honest prose (e.g. a discipline term capitalized mid-sentence that wasn't in the narrow grounding). The texture ceiling the prototype hit ("too templated, 5–6/10 forever") is held off today mostly by *structural* variety, not by voice.

**P1 — the Desk is missing founding-doc affordances.** No file-drop on the Door ("adjust details ▸" disclosure also missing); no syllabus/FAQ/course-map unfold in the continuous document; no receipt view behind the Seal; no undo/time-travel (the event log exists; `GET /events` exists; no UI); no voice accept/reject; no `artifact.patch_text` editing (user-prose-survives-regeneration is engine-ready, UI-absent); TA is reactive only — the founding doc's proactive observations ("Week 9's load is 2× week 8") don't exist.

**P2 — assorted.** `Idempotency-Key` honored on PATCH but not POST /courses, in-memory only (no 24h window); `materials[]` (file upload + extraction) unimplemented — `brief.files` is always empty; slide-deck "native visuals" are descriptors, not rendered figures; exam items only sample `concepts[0]` per session; NGSS crosswalk unimplemented; browser home (IndexedDB + BYO key) unimplemented — the privacy/free-tier story is server-only today; Crucible doesn't drive the real client; no golden-file render tests; DeepSeek port untested live; CORS `*`; no input size caps.

### What I'd defend as-is

The architecture held under audit. Purity (one engine, effects as ports) made every test deterministic and every replay byte-identical. Ids-at-birth + render-and-diff made sync genuinely free — the four-second moment costs $0 and no dependency map exists to rot. The dual meter, even uncalibrated, already stopped one perfect number from hiding a 4/10 (it's how the mandarin gap was found and fixed). The guardrails caught their own author twice this session (file budget on a fixture; purity lint on a careless import). These are the kit's Laws doing their job.

---

## Part II — The path to genuine 10/10 teachable

**The trap to refuse:** our metric is code we wrote; setting it to 10 is one commit. That is gaming the proxy, not improving the course (Law 5's dark side). 10/10 must mean: **a calibrated meter, whose 10 predicts that the judge — and a professor — would teach from the package as-is.** Three moves, in order:

### 1. Make the meter mean something (calibrate before climbing)

- Implement **the judge** in Crucible: a model evaluator asking the prototype's question (_would a professor teach from this as-is?_) per artifact class, scored /10 with named deficiencies, run via `--judge` on schedule, never gating CI directly (ADR-11).
- **Calibrate**: regress the deterministic dimensions against judge scores across the 10 fixture courses × real builds; re-weight (and add dimensions) until the code meter ranks courses the way the judge does — and reproduce the historical verdicts in `verdicts.json` where they encode texture findings. The meter must **spread** (a thin course scores 4, a rich one 9) before it may gate.
- Add the **drift gate**: in-app score vs Crucible external score within tolerance or the round fails (G6).

### 2. Close the content gap the judge will name (the real work)

What a 7/10 course is missing today, concretely, in expected order of judge impact:

| Workstream | Today | Target | Moves which dimension |
| --- | --- | --- | --- |
| **Session arcs** | Generic frames ("Develop the core treatment of X") | Discipline-specific activity templates per lens (cs: code-along + bug hunt; stem-lab: specimen/протокол; humanities: close-reading sequence), parameterized by kernel content | arc, specificity |
| **Assessment items** | 4 MC from one kernel shape + templated short answers | A budgeted Pass C authoring real items per session (scenario MCs, data/passage-based items, varied stems), contract-linted like voice, compiled fallback | specificity |
| **Kernels** | 1 definition + 1 misconception + ≤1 example | 2–3 misconceptions, 2 worked examples (one routine, one transfer), application contexts, prior-knowledge hooks | specificity |
| **Narrative through-line** | Per-session openers only | Course-level "story of the course" voice surface; transitions that name the actual previous/next session; unit groupings in the map | arc |
| **Readings** | Only what the brief names | OpenAlex/OpenLibrary retrieval fills empty slots (R1 order enforced), enriches named works with ISBN/year; discussion anchors cite real texts | specificity, credibility |
| **Voice** | ~6 surface kinds, 26–47% fallback | Voice activity descriptions + transitions; smarter W2 (lemma-level grounding match, allow-list of discipline terms from the kernel set); target <10% fallback at the same budget | sameness, arc |

### 3. Prove it the kit's way

10/10 is claimed only when: **judge ≥ 9/10 average on the four audit courses, structural 100/A held, ≤ $0.15/course, twice, on different days** (the M3 bar shape, raised). Until the meter is calibrated, the Seal keeps showing the uncalibrated number honestly labeled — we do not print a 10 we cannot defend.

---

## Part III — Vision: what this becomes

**The near vision (v0.x):** an instructor types three sentences at the Door and downloads, ninety seconds later, a course a department chair would approve — Word and PowerPoint files they can hand to a colleague, every fact traceable, every change a diff, every grade fresh. The TA reads the course like a colleague: it notices the overloaded week, the orphaned outcome, the reading nobody discusses, and proposes the fix as a reviewable diff.

**The real vision (v1+):** CurriculumOS as infrastructure — the layer LMSes, bootcamps, and publishers call instead of building course tooling. The genome becomes the moat the founding doc describes: every course taught anywhere makes the next one cheaper and better (the second economics course links instantly and free). Two homes, one brain: private and free in the browser with your own key; metered and pooled on the platform, where verified kernels flow into the commons (concept abstractions only — never instructor content). The Crucible runs nightly as the public proof: here is today's build, today's grade, today's cost, signed by the same harness that gates our merges. **No response without a receipt** stops being a slogan and becomes the reason institutions trust machine-built curriculum at all.

---

## Part IV — The roadmap

_Bars before work (Law 8). Each version ships only when its bar is green twice on different days. Costs are per-course build targets with voice on._

### v0.1 — Teacher-ready exports & materials-in  *(next; full work order below)*
**Bar:** a real build's zip opens in Word/PowerPoint/Excel with correct fonts (Georgia/Trebuchet), zero placeholder leakage flagged by the export audit re-reading the **rendered bytes**; a syllabus PDF dropped at the Door shows correct "heard so far" chips and survives into `brief.files` with hashes; structural 100/A held on all ten fixtures.
- DOCX exporter (one builder, façade delegates only — trap #7), bulk + per-session files
- PPTX decks with the two native visuals actually drawn (concept map, worked-example chart) + speaker notes; visual-audit log line
- xlsx course map
- `materials[]` upload: PDF/docx text extraction at the edge → `brief.files` (sha256), intake reads them
- POST idempotency + persisted keys; input size caps

### v0.2 — The judge & the calibrated meter  *(the 10/10 release)*
**Bar:** the deterministic teachability score ranks the ten fixture courses in the same order as the judge (Spearman ≥ 0.8); scores SPREAD (min–max ≥ 4 points across deliberately thin vs rich builds); drift gate armed (in-app vs Crucible ≤ 1.0 apart); judge ≥ 9/10 on the four audit courses at ≤ $0.15 — twice, different days.
- Crucible `--judge` + judge prompts; calibration harness against `verdicts.json` + fresh runs
- The Part II content workstreams: discipline activity templates, Pass C assessment items, enriched kernels, narrative through-line, voice expansion + lemma-level W2
- Pipeline drives the reducer (one sequencing truth — closes the Law 7 gap)

### v0.3 — The Desk completes
**Bar:** the Crucible drives the real client (Playwright) through build → edit → undo → download and the round passes; every founding-doc §6 affordance demonstrable on camera.
- Receipt view behind the Seal (cost ledger, provenance browser, build history)
- Undo/time-travel on the event log; voice accept/reject; `artifact.patch_text` inline editing (user prose survives rebuild — demoed)
- Proactive TA: load-balance/orphan/anchor lints surfacing as Queue observations with proposed EditOps
- Door: "adjust details ▸" disclosure; course library; WCAG AA measured in CI + dark-parity scan

### v0.4 — The knowledge flywheel
**Bar:** a course naming a real text retrieves verified metadata (OpenAlex/OpenLibrary) with the citation relevance gate passing its calibration cases; a cache-missed concept's model kernel gets provider-verified and persists; the SECOND build of a same-domain course links it from cache at $0 (the flywheel demonstrated).
- RetrievalPort + providers; relevance gate (ported calibration cases from the kit's scars)
- Cache-miss extraction → verification → genome persistence; shard growth tooling
- NGSS crosswalk seed

### v0.5 — Two homes
**Bar:** the full build runs in-browser with a user key that never leaves the page (IndexedDB persistence, same SSE frame shape from a local engine); the server home meters platform keys with the ledger as the invoice line.
- Browser engine bundle + BYO-key; IndexedDB StoragePort; `.coursemapper` export
- Platform auth, per-key metering, rate limits, CORS tightening; Postgres behind StoragePort

### v1 — The kit's bar, unchanged
**Beats CourseMapper v0.14.6 on teachability at equal-or-better cost, measured by the same Crucible, twice, on different days.** (Requires obtaining/reconstructing the prototype's packages as the baseline corpus; if the prototype is unavailable, the bar is re-stated against the strongest v0.2 judge baseline and said so in the receipt — we do not quietly substitute an easier incumbent.)

### Deliberately not on this roadmap
SCORM/Canvas exports, collaborative editing, marketplace/commons UI, multi-language UI, fine-tuned models — all premature until v0.4's flywheel proves demand. The discipline that built this repo (one milestone detailed at a time, bars first, the Crucible as judge of everything) is the roadmap's first commitment.

---

## Part V — v0.1 work order (the only one detailed, per the kit's rule)

1. Write the bar tests first, failing: export-audit reopens DOCX/PPTX bytes (placeholder + font + shingle scans on extracted text); fixture PDF → intake chips assertion.
2. DOCX builder in `packages/core/render/export/docx/` (pure: bytes out; office XML is zip+XML — the zip writer exists). One builder; the package façade delegates.
3. PPTX builder with drawn visuals (concept-map SVG→EMF or native shapes; worked-example bar chart). Audit line: decks/slides/visuals min/max/median.
4. xlsx course map (one sheet, the graph table).
5. Edge extraction for `materials[]` (pdf-parse/mammoth at the API edge — impure, lives outside core), `BriefFile` populated, intake merges extracted text.
6. POST idempotency persisted with TTL; 1MB brief cap; 25MB upload cap.
7. Crucible round downloads the zip and runs the export audit on the real bytes (Law 1: the artifact is the test).

_When v0.1's bar is green twice, write the v0.2 work order. Not before._
