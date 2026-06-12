/** render/helpers.ts — shared pure helpers for the renderers. */
import type { Course, Reading, Session, SurfaceId } from '../schema/courseObject.ts';
import type { RenderBlock } from './types.ts';

/** Sessions in current teaching order (by index, not id). */
export function sessionsInOrder(course: Course): Session[] {
  return [...course.graph.sessions].sort((a, b) => a.index - b.index);
}

export function readingLabel(r: Reading): string {
  const author = r.author ? `${r.author}, ` : '';
  const loc = r.locator ? ` (${r.locator})` : '';
  return `${r.id} — ${author}${r.title}${loc}`;
}

export function readingsForSession(course: Course, sessionId: string): Reading[] {
  return course.graph.readings.filter((r) => r.sessionIds.includes(sessionId as never));
}

export function assessmentsDueIn(course: Course, sessionId: string) {
  return course.graph.assessments.filter((a) => a.dueSessionId === sessionId);
}

export function gradedAssessments(course: Course) {
  return course.graph.assessments.filter((a) => a.weightPct !== null);
}

/**
 * Resolve a voice surface: if an active overlay exists, use its text; else the
 * compiled fallback. Returns a block carrying the surfaceId so the grader and
 * diff can find it, and so the renderer can report which surfaces are live.
 */
export function voiceBlock(
  course: Course,
  surfaceId: SurfaceId,
  kind: string,
  compiledFallback: string,
  heading?: string,
): RenderBlock {
  const overlay = course.overlays.voice[surfaceId];
  const text = overlay && overlay.status === 'active' ? overlay.text : compiledFallback;
  return { kind, surfaceId, text, ...(heading ? { heading } : {}) };
}

/** Provenance order for the Required Texts list (R1). */
const PROV_ORDER: Record<Reading['provenance'], number> = {
  'instructor-named': 0,
  'instructor-provided': 1,
  'genome-cited': 2,
  'retrieved-open': 3,
};
export function provenanceSorted(readings: Reading[]): Reading[] {
  return [...readings].sort((a, b) => PROV_ORDER[a.provenance] - PROV_ORDER[b.provenance]);
}

export function bloomVerb(bloom: string): string {
  return bloom;
}

/** Points for a 4-criteria × 4-level rubric scaled to the assessment weight. */
export function rubricPoints(weightPct: number | null): number {
  return weightPct ?? 100;
}
