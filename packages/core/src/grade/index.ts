/** grade/index.ts — the dual meter (founding §8): structural quality AND
 *  teachability, each its own number. We will never again let one perfect
 *  number hide a 5/10. A stale grade is unrepresentable — every build and
 *  every applied edit batch re-grades (courseObject.ts Receipts contract). */
import type { Course, Grade } from '../schema/courseObject.ts';
import { gradeStructural } from './structural.ts';
import { gradeTeachability } from './teachability.ts';

export { gradeStructural, GRADER_VERSION } from './structural.ts';
export { gradeTeachability } from './teachability.ts';
export type { StructuralReport } from './structural.ts';

/** verify result: P0 count gates "ready" (VERIFY_DONE failed>0 → blocked). */
export interface VerifyReport {
  checked: number;
  failed: number; // P0 findings the finalizer could not repair
  warnings: number; // P1/P2
}

export function verify(course: Course): VerifyReport {
  const s = gradeStructural(course);
  const failed = s.findings.filter((f) => f.severity === 'P0').length;
  const warnings = s.findings.filter((f) => f.severity !== 'P0').length;
  return { checked: s.findings.length, failed, warnings };
}

export function grade(course: Course, atISO: string, calibrationRef = 'verdicts:baseline'): Grade {
  const structural = gradeStructural(course);
  const teach = gradeTeachability(course);
  return {
    structural: {
      score: structural.score,
      letter: structural.letter,
      findings: structural.findings,
      graderVersion: 'cos-structural-1',
    },
    teachability: {
      score10: teach.score10,
      dimensions: teach.dimensions,
      calibrationRef,
    },
    gradedAt: atISO,
  };
}
