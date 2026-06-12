/** author/assemble.ts — turn authoring JSON (Pass A + Pass B) into a typed
 *  CourseGraph. Every entity gets its id at birth (Law 3); ids never derive
 *  from titles and never renumber. Cadence expansion is applied here so the
 *  registry is non-degenerate by construction (§A1). */
import type {
  Assessment,
  AssessmentId,
  Concept,
  ConceptId,
  Course,
  CourseGraph,
  Kernel,
  Outcome,
  OutcomeId,
  Reading,
  ReadingId,
  Resource,
  ResourceId,
  Session,
  SessionId,
} from '../schema/courseObject.ts';
import { fnv1a } from '../util.ts';
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

  // explicit accumulation — the per-session counter reads the array being
  // built, so we push rather than .map (a .map callback referencing its own
  // const is a temporal-dead-zone crash that only fires when the model returns
  // readings/resources — invisible to the fake engine; the V0.0.1 audit's
  // geology/world-lit "provider-failure" was really this).
  const readings: Reading[] = [];
  for (const r of a.readings) {
    const inSessions = r.inSessions.filter((n) => n >= 1 && n <= sessions.length);
    const first = inSessions[0] ?? 1;
    const n = readings.filter((x) => x.id.startsWith(`R${first}.`)).length + 1;
    readings.push({
      id: `R${first}.${n}` as ReadingId,
      sessionIds: (inSessions.length ? inSessions : [1]).map(sid),
      title: r.title,
      ...(r.author ? { author: r.author } : {}),
      ...(r.locator ? { locator: r.locator } : {}),
      kind: r.kind,
      provenance: 'instructor-named' as const,
    });
  }

  const resources: Resource[] = [];
  for (const r of a.resources) {
    const inSessions = r.inSessions.filter((n) => n >= 1 && n <= sessions.length);
    const first = inSessions[0] ?? 1;
    const n = resources.filter((x) => x.id.startsWith(`X${first}.`)).length + 1;
    resources.push({
      id: `X${first}.${n}` as ResourceId,
      sessionIds: (inSessions.length ? inSessions : [1]).map(sid),
      title: r.title,
      kind: r.kind,
      provenance: 'instructor-named' as const,
    });
  }

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

/**
 * Attach Pass B kernel CANDIDATES to the overlays (founding §7: the model
 * proposes; the cache verifies). Runs BEFORE the link stage, which overwrites
 * any candidate whose concept the genome covers (cache-first — verified
 * knowledge always wins). Candidates carry NO citations: the model may not
 * invent them (K3), and an unverified kernel that claims none is honest.
 */
export function attachKernelCandidates(course: Course, batch: PassB): void {
  const g = course.graph;
  for (const k of batch.kernels) {
    const concept = g.concepts.find((c) => c.name.toLowerCase() === k.concept.toLowerCase());
    if (!concept) continue; // candidate names an unknown concept — drop, batch stays valid (A5 spirit)
    if (course.overlays.kernels[concept.id]) continue; // an earlier batch already proposed
    const outcomeHash = fnv1a(
      g.outcomes
        .filter((o) => concept.sessionIds.includes(o.sessionId))
        .map((o) => o.text)
        .join('|'),
    );
    const kernel: Kernel = {
      conceptId: concept.id,
      definition: k.definition,
      misconceptions: k.misconceptions,
      ...(k.workedExample ? { workedExample: k.workedExample } : {}),
      citations: [], // K3: unverified candidates carry no citations, ever
      sourceCue: 'the assigned course materials',
      ...(k.romanization && Object.keys(k.romanization).length ? { romanization: k.romanization } : {}),
      basedOn: { outcomeHash, titleHash: fnv1a(concept.name) },
    };
    course.overlays.kernels[concept.id] = kernel;
  }
}

export type { Concept };
