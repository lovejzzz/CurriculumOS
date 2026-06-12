/** ta/observe.ts — the proactive TA (founding §6: "Week 9's load is 2× week
 *  8 — want me to rebalance?"). Pure lints over the graph that surface as
 *  Queue observations, each carrying proposed EditOps where a safe fix exists.
 *  Observations are suggestions, not findings — they never gate (the grader
 *  owns gating; the TA owns noticing). */
import type { Course } from '../schema/courseObject.ts';
import type { EditOp } from '../schema/editOps.ts';

export interface Observation {
  id: string;
  kind: 'load-imbalance' | 'uncovered-session' | 'unanchored-reading' | 'unassessed-outcomes' | 'weight-gap';
  text: string; // what the TA says, plainly
  entityIds: string[];
  ops?: EditOp[]; // a proposed, reviewable fix (never auto-applied)
}

export function observe(course: Course): Observation[] {
  const g = course.graph;
  const out: Observation[] = [];
  const ordered = [...g.sessions].sort((a, b) => a.index - b.index);
  let n = 0;
  const id = () => `obs-${++n}`;

  // ── load imbalance: a session whose due graded weight is ≥2× the median ──
  const loadBySession = ordered.map((s) => ({
    s,
    load: g.assessments.filter((a) => a.dueSessionId === s.id).reduce((t, a) => t + (a.weightPct ?? 0), 0),
  }));
  const loads = loadBySession.map((x) => x.load).filter((l) => l > 0).sort((a, b) => a - b);
  const median = loads.length ? loads[Math.floor(loads.length / 2)]! : 0;
  for (const { s, load } of loadBySession) {
    if (median > 0 && load >= 2 * median && load >= 15) {
      const prev = ordered.find((x) => x.index === s.index - 1);
      out.push({
        id: id(),
        kind: 'load-imbalance',
        text: `${s.id} ("${s.title}") carries ${load.toFixed(0)}% of the grade — about ${(load / median).toFixed(1)}× the median session${prev ? `; ${prev.id} carries ${loadBySession.find((x) => x.s.id === prev.id)?.load.toFixed(0)}%` : ''}. Want to move a due date?`,
        entityIds: [s.id],
      });
    }
  }

  // ── uncovered sessions: nothing due, nothing covering them ──
  for (const s of ordered) {
    const touched =
      g.assessments.some((a) => a.dueSessionId === s.id || a.sessionId === s.id || a.coveredSessionIds?.includes(s.id));
    if (!touched) {
      out.push({
        id: id(),
        kind: 'uncovered-session',
        text: `${s.id} ("${s.title}") has no assessment touching it — nothing due, nothing announced, no exam covering it. Students get no signal this session counts.`,
        entityIds: [s.id],
      });
    }
  }

  // ── unanchored readings: assigned but never anchored in a discussion ──
  for (const r of g.readings) {
    if (r.kind !== 'book' && r.kind !== 'chapter') continue;
    // the discussion for its session anchors the first reading; later ones can drift
    const anchored = r.sessionIds.some((sid) => {
      const readingsThere = g.readings.filter((x) => x.sessionIds.includes(sid));
      return readingsThere[0]?.id === r.id;
    });
    if (!anchored) {
      out.push({
        id: id(),
        kind: 'unanchored-reading',
        text: `${r.id} ("${r.title}") is assigned but no discussion anchors it — students can skip it without consequence.`,
        entityIds: [r.id],
      });
    }
  }

  // ── weight gap: graded total meaningfully under 100 ──
  const graded = g.assessments.filter((a) => a.weightPct !== null);
  const total = graded.reduce((t, a) => t + (a.weightPct ?? 0), 0);
  if (graded.length > 0 && total < 99.5) {
    const last = graded[graded.length - 1]!;
    const gap = Math.round((100 - total) * 100) / 100;
    out.push({
      id: id(),
      kind: 'weight-gap',
      text: `Graded weights total ${total.toFixed(0)}% — ${gap.toFixed(0)}% unassigned. I can top up ${last.id} ("${last.title}") to close it.`,
      entityIds: [last.id],
      ops: [{ type: 'assessment.set_weight', id: last.id, weightPct: Math.round(((last.weightPct ?? 0) + gap) * 100) / 100 }],
    });
  }

  return out;
}
