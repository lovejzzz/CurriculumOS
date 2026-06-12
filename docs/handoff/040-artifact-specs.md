# 040-artifact-specs.md — per-artifact content contracts

_What each rendered artifact must contain. In the prototype this knowledge was implicit in 18k lines of compiler; here it is the explicit contract the renderer implements, the grader checks, and the artifact gate enforces. Common rules first, then per artifact._

## Common rules (all artifacts)

- **Identity lines.** Every item that derives from a registry entity prints its id: briefs/rubrics show `A7.2`, reading mentions resolve `R8.1`. Ids are how the grader, the sync diff, and the instructor cross-reference.
- **Voice surfaces are declared.** Each artifact's voiceable slots are listed below as `SurfaceId` patterns; everything else is compiled text that voice may not touch.
- **No placeholder may render.** `[`, `{`, "TBD", "TODO", "Lorem", unresolved `${…}` — the export audit scans rendered files for these (contracts §G4).
- **Verbatim titles** (contracts §V1) appear untransformed in every artifact that mentions them.
- **Cross-artifact consistency is free, not checked into existence**: all artifacts render from the same graph, so the grader's consistency dimension verifies the render layer, not the data.

## syllabus (1 per course)

- Course header: title (verbatim), term, discipline lens line.
- **Grading table**: one row per graded `Assessment` (weightPct ≠ null), summing to 100 (±0 — a sum ≠ 100 renders an explicit "weighting per instructor" note, never a silent renormalization).
- **Schedule**: one row per session in `index` order — title, assessment due that session (by id), readings (by id, with locators).
- **Required texts**: every `Reading` with kind book/chapter, provenance-ordered (instructor-named first), with locators.
- Policies section: rendered from brief-extracted policies if named; otherwise the honest default block.
- Voice surfaces: `syllabus:course:welcome` (course description paragraph), max 140 words.

## lessonPlans (1 per session)

- Header: session id + title, outcomes (by id, verb-visible).
- Arc: warm-up → core activity → practice → closing, each tied to an outcome.
- Materials: resources + readings by id.
- **Kernel-rendered block**: misconception alert (claim + correction) and worked example when the session's concepts have kernels; sessions without kernels render the structural arc only — never fake subject matter.
- Bridges: if a `Bridge` targets this session, its primer renders before the warm-up, citations included.
- Voice surfaces: `plan:S{n}:opener` (why this session matters, 60–120 words), `plan:S{n}:transition-notes`.

## slideDecks (1 per session)

- 12–15 slides: title, outcomes, 1 per core concept, worked example, practice, recap.
- **≥2 native visuals per deck** (concept-map shape or worked-example chart) rendered from graph/kernel data — zero AI calls; the PPTX audit line (decks, slides, visuals min/max/median) logs at export.
- Speaker notes on every content slide.
- Voice surfaces: `deck:S{n}:hook` (title-slide note).

## assignments — briefs (1 per graded-artifact/project/oral Assessment; per-session cadence ⇒ one per covered session)

- Header: assessment id + verbatim title + weight + due session.
- Sections: Context (voiced), Task, Deliverables, Criteria (MUST mirror the rubric's criteria 1:1 by name), Sources (readings/resources by id with locators).
- Voice surfaces: `brief:S{n}:context` — the highest-value voice slot in the product (60–140 words, grounded in the session kernel + readings).

## rubrics (1 per brief-bearing Assessment)

- 4 criteria × 4 levels; criteria names match the brief exactly; level descriptors are behavior-anchored (what the work shows), not adjective ladders.
- Points sum equals the assessment's contribution; weight printed in header.
- No voice surfaces (rubrics are pure structure — the prototype's judge never flagged rubric texture, and precision matters more here).

## discussions (1 per session)

- Prompt with a **requirement line** anchoring a specific reading or concept ("Anchor your post in _Antigone_") — frozen text (contracts §W1); the anchor must be a real `ReadingId`/`ConceptId` of that session.
- Participation expectations + a grading note when a discussion-kind assessment exists.
- Voice surfaces: `discussion:S{n}:framing` (the lead-in around the frozen requirement).

## quizBank (1 per quiz-cadence session + 1 exam doc per exam Assessment)

- Weekly quiz: ≥6 items — MC (4 options, 1 unambiguous best), short answer, one applied item; Bloom mix at least Understand+Apply; full answer key with per-item explanations.
- **Exam doc**: ≥10 items covering `coveredSessionIds` (≥1 item per covered session), mixed types incl. short answer + essay (essay keyed on rubric hints); exam scope line printed ("Lessons 1–6").
- **Texture rule** (the v0.14.6 scar): correct-option/explanation templates rotate phrasings such that no 8-word shingle repeats ≥12× within one rendered section. Phrasing pools live in template data; the export audit enforces.
- Item ids namespaced per exam (never collide with weekly ids).

## studyGuides (1 per session)

- Key concepts (by id) with kernel definitions where available; misconception warnings; what-to-practice list tied to the session's assessment; reading checklist (by id, locator).
- Exam sessions additionally render an exam-prep section scoped to `coveredSessionIds`.
- Voice surfaces: `guide:S{n}:narrative` (the connective walkthrough, 80–140 words).

## courseFaq (1 per course, session-sectioned)

- Per-session: 2–3 anticipated questions answered from graph facts (due dates, weights, scopes — never invented policy).
- Course-level: grading, late work, materials — rendered from the same registry the syllabus uses.

## The package (zip)

```
Course Title/
├── PACKAGE_MANIFEST.json     # entity counts, provenance summary, readings[], quality
├── QUALITY_REPORT.md         # the grade, findings, dimensions — same grader as CI
├── Course Map/               # xlsx render of the graph
├── Syllabus/  Lesson Plans/  Slide Decks/  Assignment Briefs/  Rubrics/
├── Discussion Prompts/  Quiz & Exam Bank/  Study Guides/  Course FAQ/
└── (per-artifact: bulk file + per-session files, DOCX; decks PPTX)
```

Filenames: `Lesson NN - Title - Artifact.docx` (NN zero-padded). Fonts: Georgia (body) + Trebuchet MS / Calibri (UI-ish headers) — universally installed set only.
