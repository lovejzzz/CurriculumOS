import { describe, expect, it } from 'vitest';
import { buildCourse, render, gradeStructural, gradeTeachability, FakeModelPort, FixedClock, SeededRand } from '../src/index.ts';
import { ECON_BRIEF, CS_BRIEF } from './fixtures.ts';

function ports() {
  return { model: new FakeModelPort(), clock: new FixedClock(), rand: new SeededRand() };
}

describe('pipeline behavior (M1/M2)', () => {
  it('links econ concepts to the genome and seeds kernels', async () => {
    const { course } = await buildCourse(ECON_BRIEF, ports(), { voice: false });
    const linked = course.graph.concepts.filter((c) => c.genomeRef);
    expect(linked.length).toBeGreaterThanOrEqual(8); // most of the 14 topics resolve
    expect(Object.keys(course.overlays.kernels).length).toBeGreaterThanOrEqual(8);
  });

  it('diagnoses the seeded prerequisite gap (elasticity before demand curve) with a cited bridge', async () => {
    const { course } = await buildCourse(ECON_BRIEF, ports(), { voice: false });
    // elasticity (lesson 5) requires demand-curve (lesson 6) — taught later → gap
    const bridge = course.graph.bridges.find((b) => b.primer.text.toLowerCase().includes('demand curve'));
    expect(bridge, 'a demand-curve prerequisite primer must exist').toBeTruthy();
    expect(bridge!.primer.citations.length).toBeGreaterThan(0); // citations included
  });

  it('grades a fake-built course with a real structural score and two meters', async () => {
    const { course } = await buildCourse(CS_BRIEF, ports(), { voice: false });
    const s = gradeStructural(course);
    const t = gradeTeachability(course);
    expect(s.score).toBeGreaterThanOrEqual(80); // no P0s; structurally sound
    expect(s.findings.every((f) => f.severity !== 'P0')).toBe(true);
    expect(t.score10).toBeGreaterThanOrEqual(1);
    expect(t.score10).toBeLessThanOrEqual(10);
    expect(course.receipts.quality).toBeTruthy();
  });

  it('renders all nine artifact kinds plus the course map', async () => {
    const { course } = await buildCourse(CS_BRIEF, ports(), { voice: false });
    const rc = render(course);
    const kinds = new Set(rc.artifacts.map((a) => a.kind));
    for (const k of ['courseMap', 'syllabus', 'lessonPlans', 'slideDecks', 'discussions', 'studyGuides', 'rubrics', 'assignments', 'quizBank', 'courseFaq']) {
      expect(kinds.has(k as never), `missing artifact: ${k}`).toBe(true);
    }
  });

  it('has no placeholder leakage in any rendered artifact', async () => {
    const { course } = await buildCourse(ECON_BRIEF, ports(), { voice: false });
    const s = gradeStructural(course);
    expect(s.findings.filter((f) => f.dimension === 'placeholder')).toHaveLength(0);
  });
});
