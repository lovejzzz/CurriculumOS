import { describe, expect, it } from 'vitest';
import { buildCourse, validateCourse, CourseValidationError, FakeModelPort, FixedClock, SeededRand } from '../src/index.ts';
import { ECON_BRIEF } from './fixtures.ts';
import type { Course } from '../src/index.ts';

async function buildEcon(): Promise<Course> {
  const out = await buildCourse(ECON_BRIEF, { model: new FakeModelPort(), clock: new FixedClock(), rand: new SeededRand() }, { voice: false });
  expect(out.terminal).toBe('ready');
  return out.course;
}

describe('core/schema (M0 bar 1)', () => {
  it('validates a well-formed fixture Course Object', async () => {
    const course = await buildEcon();
    expect(() => validateCourse(course)).not.toThrow();
    expect(course.graph.sessions.length).toBeGreaterThanOrEqual(14);
  });

  it('enforces id format rules', async () => {
    const course = await buildEcon();
    expect(course.graph.sessions[0]!.id).toMatch(/^S[1-9]\d*$/);
    expect(course.graph.assessments[0]!.id).toMatch(/^A[1-9]\d*\.[1-9]\d*$/);
  });

  it('rejects an invalid cross-reference with a NAMED error', async () => {
    const course = await buildEcon();
    // point an assessment due at a non-existent session
    course.graph.assessments[0]!.dueSessionId = 'S999' as never;
    try {
      validateCourse(course);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(CourseValidationError);
      expect((e as CourseValidationError).code).toBe('dangling-reference');
    }
  });

  it('rejects weights exceeding 100', async () => {
    const course = await buildEcon();
    course.graph.assessments[0]!.weightPct = 80;
    course.graph.assessments[1]!.weightPct = 80;
    expect(() => validateCourse(course)).toThrow(CourseValidationError);
  });

  it('rejects a non-dense session index permutation', async () => {
    const course = await buildEcon();
    course.graph.sessions[0]!.index = 99;
    try {
      validateCourse(course);
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as CourseValidationError).code).toBe('index-gap');
    }
  });
});
