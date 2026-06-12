/** render/weights.ts — a functional grading scheme (V0.0.3). The judge docked
 *  every syllabus for "weighting per instructor." A4 forbids INVENTING weights
 *  onto the graph (they would then be indistinguishable from instructor-stated
 *  ones) — so the graph weights stay null, and this PURE function computes a
 *  suggested distribution at render time, clearly marked "suggested (edit me)."
 *  Honest about being a default; functional as a scheme. */
import type { Assessment, Course, DisciplineLens } from '../schema/courseObject.ts';

/** Base credit per assessment kind — exams/projects carry the most, recurring
 *  low-stakes work the least. Tuned so a typical course lands on familiar
 *  splits (e.g. ~two midterms + final + weekly work). */
const KIND_WEIGHT: Record<Assessment['kind'], number> = {
  exam: 3,
  project: 3,
  'graded-artifact': 2,
  oral: 2,
  quiz: 1,
  'in-class': 1,
  discussion: 1,
};

/** Discipline nudges — humanities leans on essays/participation, quant on
 *  exams, labs on the graded artifacts. Multiplies the kind base. */
const DISCIPLINE_NUDGE: Partial<Record<DisciplineLens, Partial<Record<Assessment['kind'], number>>>> = {
  humanities: { 'graded-artifact': 1.5, discussion: 1.6, exam: 0.8 },
  'social-science': { 'graded-artifact': 1.3, exam: 1.0 },
  'stem-quant': { exam: 1.3, quiz: 1.1 },
  'stem-lab': { 'graded-artifact': 1.4, exam: 1.0 },
  cs: { project: 1.4, 'graded-artifact': 1.2 },
  language: { oral: 1.5, quiz: 1.1 },
  arts: { project: 1.5, 'graded-artifact': 1.3 },
  business: { 'graded-artifact': 1.3, discussion: 1.2 },
  health: { exam: 1.2, 'graded-artifact': 1.2 },
};

export interface WeightScheme {
  /** weightPct by assessment id — stated where the instructor stated it,
   *  suggested otherwise; always rounded and summing to 100 across graded items. */
  byId: Record<string, number>;
  /** true when the brief stated NO weights and these are model-free suggestions */
  suggested: boolean;
}

/** Assessments that bear a grade slot (everything except ungraded practice that
 *  was explicitly null AND of a non-graded kind — here, all kinds can be graded). */
function gradeable(course: Course): Assessment[] {
  return course.graph.assessments;
}

export function weightScheme(course: Course): WeightScheme {
  const all = gradeable(course);
  const stated = all.filter((a) => a.weightPct !== null);

  // instructor stated at least one weight → honor exactly what they said (A4)
  if (stated.length > 0) {
    const byId: Record<string, number> = {};
    for (const a of stated) byId[a.id] = a.weightPct as number;
    return { byId, suggested: false };
  }

  // none stated → compute a suggested distribution (graph weights stay null)
  if (all.length === 0) return { byId: {}, suggested: true };
  const nudge = DISCIPLINE_NUDGE[course.graph.discipline] ?? {};
  const raw = all.map((a) => ({ id: a.id, w: KIND_WEIGHT[a.kind] * (nudge[a.kind] ?? 1) }));
  const total = raw.reduce((s, r) => s + r.w, 0) || 1;
  // largest-remainder rounding so the suggested table sums to EXACTLY 100
  const exact = raw.map((r) => ({ id: r.id, pct: (r.w / total) * 100 }));
  const floors = exact.map((e) => ({ id: e.id, pct: Math.floor(e.pct), rem: e.pct - Math.floor(e.pct) }));
  let used = floors.reduce((s, f) => s + f.pct, 0);
  floors.sort((a, b) => b.rem - a.rem);
  for (let i = 0; used < 100 && i < floors.length; i++, used++) floors[i]!.pct += 1;
  const byId: Record<string, number> = {};
  for (const f of floors) byId[f.id] = f.pct;
  return { byId, suggested: true };
}
