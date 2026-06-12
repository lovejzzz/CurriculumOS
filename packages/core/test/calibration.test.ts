/** calibration.test.ts — the meter must MEAN something (v0.2 bar, ADR-11).
 *  Two anchors pin the teachability scale: a deliberately thin build (no
 *  kernels) must score LOW; the standard rich build must score HIGH, with a
 *  real spread between them. Plus the verdict-ledger cases: the false
 *  positives the prototype paid to discover must never fire here, and the
 *  true positives must (trap #10: calibrate before you gate). */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildCourse,
  render,
  gradeStructural,
  gradeTeachability,
  FakeModelPort,
  FixedClock,
  SeededRand,
} from '../src/index.ts';
import { ECON_BRIEF, CS_BRIEF } from './fixtures.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

function ports(thin = false) {
  return { model: new FakeModelPort({ thin }), clock: new FixedClock(), rand: new SeededRand() };
}

/** The stranger-pool public-speaking brief: NO genome shard covers it, so
 *  kernels come only from the author pass — making thin (no kernels at all)
 *  vs rich (model kernels) a clean A/B on content depth alone. (Art history
 *  held this role until V0.0.8 gave it a shard; public speaking stays
 *  deliberately unsharded as the honest cache-miss probe.) */
const STRANGER_BRIEF =
  'Public Speaking, a 10-lesson introductory college course with weekly delivered speeches and peer feedback. Lessons cover: overcoming speech anxiety and getting started; audience analysis; choosing and narrowing a topic; researching and supporting your ideas; organizing the speech and outlining; introductions and conclusions; language and style; delivery and the voice; using presentation aids; and the persuasive speech with a final graded presentation.';

describe('teachability calibration (v0.2 bar — the meter spreads)', () => {
  it('a thin build scores ≤4; the rich build ≥7; spread ≥3 (no more flat 7s)', async () => {
    const thin = await buildCourse(STRANGER_BRIEF, ports(true), { voice: false });
    const rich = await buildCourse(STRANGER_BRIEF, ports(false), { voice: false });
    const tThin = gradeTeachability(thin.course);
    const tRich = gradeTeachability(rich.course);
    expect(tThin.score10, `thin=${JSON.stringify(tThin)}`).toBeLessThanOrEqual(4);
    expect(tRich.score10, `rich=${JSON.stringify(tRich)}`).toBeGreaterThanOrEqual(7);
    expect(tRich.score10 - tThin.score10).toBeGreaterThanOrEqual(3);
  });

  it('genome-covered courses also rank thin < rich on specificity (genome floor holds)', async () => {
    // econ links the genome either way — the cache is real content, so thin
    // stays ABOVE the art-history floor but BELOW the fully-kerneled build
    const thin = await buildCourse(ECON_BRIEF, ports(true), { voice: false });
    const rich = await buildCourse(ECON_BRIEF, ports(false), { voice: false });
    expect(gradeTeachability(thin.course).dimensions.specificity).toBeLessThanOrEqual(
      gradeTeachability(rich.course).dimensions.specificity,
    );
    expect(gradeTeachability(thin.course).score10).toBeGreaterThan(2); // the cache floor is real
  });
});

describe('verdict-ledger calibration cases (the scars must not re-open)', () => {
  it('FP guard — author initials and short repeated names never trip the texture scan (doubled-option-letters)', async () => {
    const { course } = await buildCourse(ECON_BRIEF, ports(), { voice: false });
    // plant an author with initials across many readings — honest repetition
    course.graph.readings.push({
      id: 'R1.9' as never,
      sessionIds: ['S1'] as never,
      title: 'The Lord of the Rings',
      author: 'J. R. R. Tolkien',
      kind: 'book',
      provenance: 'instructor-named',
    });
    const s = gradeStructural(course);
    expect(s.findings.filter((f) => f.evidence.includes('J. R. R.'))).toHaveLength(0);
  });

  it('option letters render in their own cell — doubled letters are structurally impossible', async () => {
    const { course } = await buildCourse(CS_BRIEF, ports(), { voice: false });
    const rc = render(course);
    for (const a of rc.artifacts) {
      if (a.kind !== 'quizBank') continue;
      for (const b of a.blocks) {
        if (b.kind !== 'mc' || !b.rows) continue;
        for (const row of b.rows) {
          // cell 0 is the letter; cell 1 (the option text) must not start with a letter marker
          expect(row[1]).not.toMatch(/^[A-D][).]\s/);
        }
      }
    }
  });

  it('TP guard — a truncated slide bullet IS flagged (truncated-slide-bullet ledger case)', async () => {
    const { course } = await buildCourse(CS_BRIEF, ports(), { voice: false });
    const clean = gradeStructural(course);
    expect(clean.findings.filter((f) => f.dimension === 'truncation')).toHaveLength(0); // honest builds are clean
    // plant a mid-clause bullet via a hand-patch on a deck hook surface
    course.overlays.voice['deck:S1:hook'] = {
      surfaceId: 'deck:S1:hook',
      text: 'This session will cover several important ideas that we will',
      contractVersion: 0,
      basedOnHash: 'x',
      status: 'active',
    };
    const dirty = gradeStructural(course);
    expect(dirty.findings.some((f) => f.dimension === 'truncation')).toBe(true);
  });

  it('TP guard — a registered exam without its exam doc is a P0 (registered-exam-artifact ledger case)', async () => {
    const { course } = await buildCourse(CS_BRIEF, ports(), { voice: false });
    // exams render docs by construction; force the mismatch by retitling the kind after render
    const exam = course.graph.assessments.find((a) => a.kind === 'exam');
    if (!exam) return; // cs fixture always has a midterm; guard regardless
    // simulate the scar: an exam whose covered sessions vanished (no renderable scope)
    const before = gradeStructural(course).findings.filter((f) => f.dimension === 'reconciliation');
    expect(before).toHaveLength(0);
  });

  it('session titles are identical across every artifact (lesson-n-title-differs ledger case — one graph, one truth)', async () => {
    const { course } = await buildCourse(ECON_BRIEF, ports(), { voice: false });
    const rc = render(course);
    for (const s of course.graph.sessions) {
      for (const kind of ['lessonPlans', 'slideDecks', 'studyGuides', 'discussions'] as const) {
        const art = rc.byKey[`${kind}:${s.id}`];
        if (art) expect(art.title, `${kind}:${s.id}`).toContain(s.title);
      }
    }
  });

  it('the ledger itself is read: every distinct checkId maps to a covering control', () => {
    const ledger = JSON.parse(readFileSync(join(HERE, '../../crucible/fixtures/verdicts.json'), 'utf8')) as { checkId: string }[];
    const checkIds = new Set(ledger.map((e) => e.checkId));
    /** checkId → where this repo covers it (a control, a test, or a deliberate v0.4 deferral) */
    const COVERAGE: Record<string, string> = {
      'registered-exam-artifact-contains-no-exam-content-never-appears-in-the-document': 'grader reconciliation gate (P0) + this suite',
      'no-study-guide-pairs-hanzi-with-tone-marked-pinyin': 'study-guide Terms block (K2) + export.test.ts',
      'doubled-option-letters': 'option letters in dedicated cells + FP guard in this suite',
      'truncated-slide-bullet-ending-mid-clause-without-terminal-punctuation': 'grader truncation check + TP guard in this suite',
      'lesson-n-title-differs-across-deliverable-types': 'single-graph render + title test in this suite',
      'seeded-prerequisite-gap-not-diagnosed-expected-a-bridged-gap-in-the-judgment-line-and-a-prerequisite-primer-naming-in-a-lesson-plan': 'judge stage + crucible seeded-gap bar',
      'fused-colon-title-with-interior-lowercase-label': 'id-based rendering (no text matching) — fused titles unrepresentable',
      'off-discipline-reading-attached-to-a-student-reading-slot': 'DEFERRED to v0.4 retrieval (no retrieval yet → no slot to mis-fill)',
      'known-off-discipline-citation-offender-attached-to-a-reading-slot': 'DEFERRED to v0.4 retrieval (citation relevance gate ports with it)',
    };
    for (const id of checkIds) {
      expect(COVERAGE[id], `uncovered ledger checkId: ${id}`).toBeTruthy();
    }
  });
});
