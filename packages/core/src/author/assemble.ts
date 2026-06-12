/** author/assemble.ts — turn authoring JSON (Pass A + Pass B) into a typed
 *  CourseGraph. Every entity gets its id at birth (Law 3); ids never derive
 *  from titles and never renumber. Cadence expansion is applied here so the
 *  registry is non-degenerate by construction (§A1). */
import type {
  Assessment,
  AssessmentId,
  Concept,
  ConceptId,
  CourseGraph,
  Outcome,
  OutcomeId,
  Reading,
  ReadingId,
  Resource,
  ResourceId,
  Session,
  SessionId,
} from '../schema/courseObject.ts';
import type { PassA, PassB } from './schema.ts';

function sid(i: number): SessionId {
  return `S${i}` as SessionId;
}

/** Build the skeleton graph from Pass A: sessions, assessments (cadence
 *  expanded), readings, resources. Concepts/outcomes arrive in Pass B. */
export function assembleSkeleton(a: PassA): CourseGraph {
  const sessions: Session[] = a.sessions.map((s, i) => ({
    id: sid(i + 1),
    index: i + 1,
    title: s.title,
    conceptIds: [],
    outcomeIds: [],
  }));

  const assessments: Assessment[] = [];
  for (const raw of a.assessments) {
    const announced = Math.min(raw.announcedInSession, sessions.length);
    if (raw.cadence === 'per-session') {
      // expand: one entry per covered session (§A1) — covered defaults to all sessions
      const covered = (raw.coveredSessions && raw.coveredSessions.length ? raw.coveredSessions : sessions.map((_, i) => i + 1))
        .filter((n) => n >= 1 && n <= sessions.length)
        .sort((x, y) => x - y);
      // per-session weight: split the stated total weight across instances (honest, A4)
      const perWeight = raw.weightPct === null ? null : Math.round((raw.weightPct / covered.length) * 100) / 100;
      covered.forEach((sessionIdx) => {
        const n = assessments.filter((x) => x.sessionId === sid(sessionIdx)).length + 1;
        assessments.push({
          id: `A${sessionIdx}.${n}` as AssessmentId,
          sessionId: sid(sessionIdx),
          dueSessionId: sid(sessionIdx),
          title: raw.title,
          kind: raw.kind,
          weightPct: perWeight,
          cadence: 'per-session',
          coveredSessionIds: [sid(sessionIdx)],
        });
      });
    } else {
      const due = Math.min(raw.dueInSession, sessions.length);
      const n = assessments.filter((x) => x.sessionId === sid(announced)).length + 1;
      const covered = raw.coveredSessions?.filter((c) => c >= 1 && c <= sessions.length).map((c) => sid(c));
      assessments.push({
        id: `A${announced}.${n}` as AssessmentId,
        sessionId: sid(announced),
        dueSessionId: sid(due),
        title: raw.title,
        kind: raw.kind,
        weightPct: raw.weightPct,
        cadence: 'once',
        ...(covered && covered.length ? { coveredSessionIds: covered } : {}),
      });
    }
  }

  const readings: Reading[] = a.readings.map((r, i) => {
    const inSessions = r.inSessions.filter((n) => n >= 1 && n <= sessions.length);
    const first = inSessions[0] ?? 1;
    const n = readings_count(readings, first) + 1;
    return {
      id: `R${first}.${n}` as ReadingId,
      sessionIds: (inSessions.length ? inSessions : [1]).map(sid),
      title: r.title,
      ...(r.author ? { author: r.author } : {}),
      ...(r.locator ? { locator: r.locator } : {}),
      kind: r.kind,
      provenance: 'instructor-named' as const,
    };
  });

  const resources: Resource[] = a.resources.map((r) => {
    const inSessions = r.inSessions.filter((n) => n >= 1 && n <= sessions.length);
    const first = inSessions[0] ?? 1;
    const n = resources.filter((x) => x.id.startsWith(`X${first}.`)).length + 1;
    return {
      id: `X${first}.${n}` as ResourceId,
      sessionIds: (inSessions.length ? inSessions : [1]).map(sid),
      title: r.title,
      kind: r.kind,
      provenance: 'instructor-named' as const,
    };
  });

  return {
    courseTitle: a.courseTitle,
    discipline: a.discipline,
    ...(a.term ? { term: a.term } : {}),
    sessions,
    concepts: [],
    outcomes: [],
    assessments,
    readings,
    resources,
    bridges: [],
  };
}

function readings_count(readings: Reading[], first: number): number {
  return readings.filter((x) => x.id.startsWith(`R${first}.`)).length;
}

/** Merge a Pass B batch (one session's concepts + outcomes) into the graph. */
export function mergePassB(graph: CourseGraph, batch: PassB): void {
  const session = graph.sessions.find((s) => s.index === batch.sessionIndex);
  if (!session) return;
  const sIdx = session.index;

  for (const c of batch.concepts) {
    // reuse a concept id if the same name already exists (shared concepts span sessions)
    let concept = graph.concepts.find((x) => x.name.toLowerCase() === c.name.toLowerCase());
    if (!concept) {
      const id = `C${graph.concepts.length + 1}` as ConceptId;
      concept = { id, name: c.name, sessionIds: [session.id] };
      graph.concepts.push(concept);
    } else if (!concept.sessionIds.includes(session.id)) {
      concept.sessionIds.push(session.id);
    }
    if (!session.conceptIds.includes(concept.id)) session.conceptIds.push(concept.id);
  }

  let n = graph.outcomes.filter((o) => o.sessionId === session.id).length;
  for (const o of batch.outcomes) {
    n += 1;
    const id = `O${sIdx}.${n}` as OutcomeId;
    const outcome: Outcome = { id, sessionId: session.id, text: o.text, bloom: o.bloom };
    graph.outcomes.push(outcome);
    session.outcomeIds.push(id);
  }
}

export type { Concept };
