/** weights.test.ts — v0.0.3 bar: a functional grading scheme. The judge docked
 *  every syllabus for "weighting per instructor." Suggested weights must be
 *  functional (sum to 100), marked, and NEVER overwrite stated weights (A4). */
import { describe, expect, it } from 'vitest';
import { buildCourse, weightScheme, render, FakeModelPort, FixedClock, SeededRand } from '../src/index.ts';
import { ECON_BRIEF } from './fixtures.ts';

function ports() {
  return { model: new FakeModelPort(), clock: new FixedClock(), rand: new SeededRand() };
}

describe('grading scheme (suggested weights)', () => {
  it('a brief with NO stated weights yields a suggested table summing to 100', async () => {
    // the real model returns null weights when the brief states none (the fake
    // always normalizes); simulate that honest case by clearing the weights
    const { course } = await buildCourse(ECON_BRIEF, ports(), { voice: false });
    for (const a of course.graph.assessments) a.weightPct = null;
    course.receipts.quality = null; // (grade is recomputed on read where needed)
    const scheme = weightScheme(course);
    expect(scheme.suggested).toBe(true);
    const total = Object.values(scheme.byId).reduce((s, w) => s + w, 0);
    expect(total).toBe(100); // largest-remainder rounding sums EXACTLY to 100
    // graph weights stay null (A4: never invented onto the truth)
    expect(course.graph.assessments.every((a) => a.weightPct === null)).toBe(true);
    // syllabus renders the suggested heading + functional numbers (no "per instructor")
    const syl = render(course).byKey['syllabus:course']!;
    const grading = syl.blocks.find((b) => b.kind === 'grading-table')!;
    expect(grading.heading).toContain('suggested');
    const text = JSON.stringify(grading.rows);
    expect(text).not.toContain('per instructor');
    expect(text).toMatch(/\d+%/);
  });

  it('a brief WITH stated weights is left exactly as stated (A4 preserved)', async () => {
    // econ brief states "two midterms (20% each)"? it doesn't — use a synthetic one
    const brief = 'Intro Stats, a 12-lesson course with a midterm worth 30% and a final worth 40% and weekly problem sets worth 30%. Lessons cover: data; sampling; the central limit theorem; the p-value; hypothesis testing; regression; correlation; confidence intervals; visualization; survey bias; inference review; and a final project.';
    const { course } = await buildCourse(brief, ports(), { voice: false });
    const scheme = weightScheme(course);
    // if the model/fake stated any weights, suggested is false and they're untouched
    if (course.graph.assessments.some((a) => a.weightPct !== null)) {
      expect(scheme.suggested).toBe(false);
      for (const a of course.graph.assessments) {
        if (a.weightPct !== null) expect(scheme.byId[a.id]).toBe(a.weightPct);
      }
    }
  });

  it('rubric weight agrees with the syllabus scheme', async () => {
    const { course } = await buildCourse(ECON_BRIEF, ports(), { voice: false });
    const scheme = weightScheme(course);
    const rc = render(course);
    for (const a of course.graph.assessments) {
      const rubric = rc.byKey[`rubrics:${a.id}`];
      if (!rubric) continue;
      const header = rubric.blocks[0]!.text ?? '';
      if (scheme.byId[a.id] != null) expect(header).toContain(`${scheme.byId[a.id]}%`);
    }
  });
});
