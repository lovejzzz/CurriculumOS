/** author/lint.ts — the degenerate-skeleton lint (contracts §A2, the silent
 *  10-minute-hang scar). After Pass A: assessments ≥ sessions when any
 *  per-session cadence was named; sessions ≥ the weeks the brief states; every
 *  exam names coveredSessions. Failure → caller retries once, then blocked. */
import type { PassA } from './schema.ts';

export interface LintResult {
  ok: boolean;
  reasons: string[];
}

/** Expand per-session cadence into the implied per-session count. */
export function expandedAssessmentCount(skeleton: PassA): number {
  let count = 0;
  for (const a of skeleton.assessments) {
    if (a.cadence === 'per-session') {
      const covered = a.coveredSessions?.length ?? skeleton.sessions.length;
      count += covered;
    } else {
      count += 1;
    }
  }
  return count;
}

export function lintSkeleton(skeleton: PassA, statedWeeks?: number): LintResult {
  const reasons: string[] = [];
  const namedPerSession = skeleton.assessments.some((a) => a.cadence === 'per-session');
  const effectiveAssessments = expandedAssessmentCount(skeleton);

  if (namedPerSession && effectiveAssessments < skeleton.sessions.length) {
    reasons.push(
      `cadence-expansion: ${effectiveAssessments} expanded assessments < ${skeleton.sessions.length} sessions ` +
        `(a "weekly" cadence must expand to one entry per covered session — §A1)`,
    );
  }
  if (statedWeeks && skeleton.sessions.length < statedWeeks) {
    reasons.push(`session-count: ${skeleton.sessions.length} sessions < ${statedWeeks} weeks the brief states`);
  }
  for (const a of skeleton.assessments) {
    if (a.kind === 'exam' && (!a.coveredSessions || a.coveredSessions.length === 0)) {
      reasons.push(`exam-scope: exam "${a.title}" names no coveredSessions`);
    }
  }
  // session index references must be in range
  const n = skeleton.sessions.length;
  for (const a of skeleton.assessments) {
    if (a.announcedInSession > n || a.dueInSession > n) {
      reasons.push(`out-of-range: assessment "${a.title}" references a session beyond ${n}`);
    }
  }
  return { ok: reasons.length === 0, reasons };
}
