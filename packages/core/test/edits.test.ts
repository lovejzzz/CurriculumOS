import { describe, expect, it } from 'vitest';
import {
  buildCourse,
  applyEdit,
  applyBatch,
  PreconditionError,
  FakeModelPort,
  FixedClock,
  SeededRand,
} from '../src/index.ts';
import type { Course } from '../src/index.ts';
import { ECON_BRIEF } from './fixtures.ts';

async function buildEcon(): Promise<Course> {
  const out = await buildCourse(ECON_BRIEF, { model: new FakeModelPort(), clock: new FixedClock(), rand: new SeededRand() }, { voice: false });
  return out.course;
}

describe('core/edits (M0 bar 3)', () => {
  it('applies a weight change atomically and appends exactly one dense-seq EditEvent', async () => {
    const course = await buildEcon();
    const before = course.overlays.edits.length;
    const graded = course.graph.assessments.find((a) => a.weightPct !== null)!;
    const res = await applyEdit(course, [{ type: 'assessment.set_weight', id: graded.id, weightPct: graded.weightPct! }], 'instructor', { clock: new FixedClock(1) });
    expect(res.applied).toBe(true);
    expect(course.overlays.edits.length).toBe(before + 1);
    expect(res.seq).toBe(course.overlays.edits[before]!.seq);
    // dense ascending seq
    course.overlays.edits.forEach((e, i) => expect(e.seq).toBe(i + 1));
  });

  it('always returns a fresh grade — never a missing one', async () => {
    const course = await buildEcon();
    const a = course.graph.assessments.find((x) => x.weightPct !== null)!;
    const res = await applyEdit(course, [{ type: 'assessment.set_weight', id: a.id, weightPct: a.weightPct! }], 'instructor', { clock: new FixedClock(1) });
    expect(res.grade).toBeTruthy();
    expect(res.grade.structural.score).toBeGreaterThan(0);
    expect(course.receipts.quality).toEqual(res.grade);
  });

  it('blocks a batch that pushes graded weights over 100 (precondition, nothing applied)', async () => {
    const course = await buildEcon();
    const graded = course.graph.assessments.filter((a) => a.weightPct !== null);
    const before = course.overlays.edits.length;
    expect(() =>
      applyBatch(
        course,
        graded.map((a) => ({ type: 'assessment.set_weight', id: a.id, weightPct: 90 })),
        'instructor',
        new FixedClock().nowISO(),
      ),
    ).toThrow(PreconditionError);
    expect(course.overlays.edits.length).toBe(before); // atomic: nothing applied
  });

  it('blocks removing a session that still has a due assessment', async () => {
    const course = await buildEcon();
    const due = course.graph.assessments[0]!;
    expect(() => applyBatch(course, [{ type: 'session.remove', id: due.dueSessionId }], 'instructor', new FixedClock().nowISO())).toThrow(PreconditionError);
  });

  it('produces a diff for a weight change touching the syllabus grading table', async () => {
    const course = await buildEcon();
    const a = course.graph.assessments.find((x) => x.weightPct !== null && x.cadence === 'once')!;
    const newWeight = (a.weightPct ?? 0) === 25 ? 24 : 25;
    // keep total <= 100 by lowering another graded item
    const other = course.graph.assessments.find((x) => x.id !== a.id && x.weightPct !== null && x.cadence === 'once');
    const ops: import('../src/index.ts').EditOp[] = [{ type: 'assessment.set_weight', id: a.id, weightPct: newWeight }];
    if (other) ops.push({ type: 'assessment.set_weight', id: other.id, weightPct: Math.max(0, (other.weightPct ?? 0) - (newWeight - (a.weightPct ?? 0))) });
    const res = await applyEdit(course, ops, 'instructor', { clock: new FixedClock(5) });
    const syllabusDiff = res.diff.find((d) => d.artifact === 'syllabus');
    expect(syllabusDiff).toBeTruthy();
    expect(res.cost.usd).toBe(0); // pure recompile
  });
});
