/**
 * schema/validate.ts — zod validation for the Course Object (ADR-09).
 * The TS types in courseObject.ts are the spec; these schemas validate at
 * every boundary where data crosses into core. Id formats are part of the
 * contract; cross-reference violations are rejected with NAMED errors —
 * never a generic "invalid course" (Law 6).
 */
import { z } from 'zod';
import type { Course } from './courseObject.ts';

// ── Id formats (Law 3 — printed by graders and exporters) ───────────────────
export const SESSION_ID = /^S[1-9]\d*$/;
export const CONCEPT_ID = /^C[1-9]\d*$/;
export const OUTCOME_ID = /^O[1-9]\d*\.[1-9]\d*$/;
export const ASSESSMENT_ID = /^A[1-9]\d*\.[1-9]\d*$/;
export const READING_ID = /^R[1-9]\d*\.[1-9]\d*$/;
export const RESOURCE_ID = /^X[1-9]\d*\.[1-9]\d*$/;
export const BRIDGE_ID = /^B[1-9]\d*$/;

const sessionId = z.string().regex(SESSION_ID, 'id-format: SessionId must be S<n>');
const conceptId = z.string().regex(CONCEPT_ID, 'id-format: ConceptId must be C<n>');
const outcomeId = z.string().regex(OUTCOME_ID, 'id-format: OutcomeId must be O<s>.<n>');
const assessmentId = z.string().regex(ASSESSMENT_ID, 'id-format: AssessmentId must be A<s>.<n>');
const readingId = z.string().regex(READING_ID, 'id-format: ReadingId must be R<s>.<n>');
const resourceId = z.string().regex(RESOURCE_ID, 'id-format: ResourceId must be X<s>.<n>');
const bridgeId = z.string().regex(BRIDGE_ID, 'id-format: BridgeId must be B<n>');

const citation = z.object({
  title: z.string().min(1),
  source: z.enum(['openalex', 'openlibrary', 'genome']),
  externalId: z.string().min(1),
  year: z.number().int().optional(),
});

const provenance = z.enum(['instructor-named', 'instructor-provided', 'genome-cited', 'retrieved-open']);

const disciplineLens = z.enum([
  'stem-quant',
  'stem-lab',
  'cs',
  'humanities',
  'social-science',
  'language',
  'arts',
  'business',
  'health',
  'education',
  'general',
]);

export const graphSchema = z.object({
  courseTitle: z.string().min(1),
  discipline: disciplineLens,
  term: z.string().optional(),
  sessions: z.array(
    z.object({
      id: sessionId,
      index: z.number().int().min(1),
      title: z.string().min(1),
      summary: z.string().optional(),
      conceptIds: z.array(conceptId),
      outcomeIds: z.array(outcomeId),
    }),
  ),
  concepts: z.array(
    z.object({
      id: conceptId,
      name: z.string().min(1),
      sessionIds: z.array(sessionId),
      genomeRef: z.object({ shard: z.string(), conceptKey: z.string() }).nullable().optional(),
    }),
  ),
  outcomes: z.array(
    z.object({
      id: outcomeId,
      sessionId,
      text: z.string().min(1),
      bloom: z.enum(['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']),
    }),
  ),
  assessments: z.array(
    z.object({
      id: assessmentId,
      sessionId,
      dueSessionId: sessionId,
      title: z.string().min(1),
      kind: z.enum(['quiz', 'exam', 'oral', 'in-class', 'graded-artifact', 'project', 'discussion']),
      weightPct: z.number().min(0).max(100).nullable(),
      cadence: z.enum(['once', 'per-session']),
      coveredSessionIds: z.array(sessionId).optional(),
      notes: z.string().optional(),
    }),
  ),
  readings: z.array(
    z.object({
      id: readingId,
      sessionIds: z.array(sessionId),
      title: z.string().min(1),
      author: z.string().optional(),
      locator: z.string().optional(),
      kind: z.enum(['book', 'article', 'chapter', 'media', 'website', 'dataset']),
      provenance,
      externalIds: z
        .object({
          doi: z.string().optional(),
          isbn: z.string().optional(),
          openalex: z.string().optional(),
          openlibrary: z.string().optional(),
        })
        .optional(),
    }),
  ),
  resources: z.array(
    z.object({
      id: resourceId,
      sessionIds: z.array(sessionId),
      title: z.string().min(1),
      kind: z.enum(['tool', 'software', 'equipment', 'site', 'document']),
      provenance,
    }),
  ),
  bridges: z.array(
    z.object({
      id: bridgeId,
      gapConceptId: conceptId,
      beforeSessionId: sessionId,
      primer: z.object({ text: z.string().min(1), citations: z.array(citation) }),
    }),
  ),
  standards: z
    .object({
      framework: z.string(),
      mappings: z.array(
        z.object({ outcomeId, code: z.string(), confidence: z.enum(['exact', 'partial']) }),
      ),
    })
    .optional(),
});

export const courseSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.literal(1),
  brief: z.object({
    text: z.string(),
    files: z.array(z.object({ name: z.string(), sha256: z.string(), extractedText: z.string() })),
    receivedAt: z.string(),
  }),
  graph: graphSchema,
  overlays: z.object({
    kernels: z.record(z.string(), z.any()),
    voice: z.record(z.string(), z.any()),
    edits: z.array(z.any()),
  }),
  receipts: z.object({
    provenance: z.record(z.string(), z.any()),
    cost: z.object({ totalUsd: z.number(), entries: z.array(z.any()) }),
    quality: z.any().nullable(),
    builds: z.array(z.any()),
  }),
});

/** A named validation error — the closed-set contract (Law 6). */
export class CourseValidationError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'CourseValidationError';
  }
}

/** Structural validation + the cross-reference rules zod can't express.
 *  Throws CourseValidationError with a NAMED code on the first violation. */
export function validateCourse(course: Course): void {
  const parsed = courseSchema.safeParse(course);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new CourseValidationError(
      'schema-invalid',
      `${issue?.path.join('.')}: ${issue?.message ?? 'invalid'}`,
    );
  }
  const g = course.graph;
  const sessionIds = new Set(g.sessions.map((s) => s.id));
  const conceptIds = new Set(g.concepts.map((c) => c.id));
  const outcomeIds = new Set(g.outcomes.map((o) => o.id));

  // unique ids at birth, never reused (Law 3)
  for (const [name, ids] of [
    ['session', g.sessions.map((s) => s.id)],
    ['concept', g.concepts.map((c) => c.id)],
    ['outcome', g.outcomes.map((o) => o.id)],
    ['assessment', g.assessments.map((a) => a.id)],
    ['reading', g.readings.map((r) => r.id)],
    ['resource', g.resources.map((r) => r.id)],
    ['bridge', g.bridges.map((b) => b.id)],
  ] as const) {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) throw new CourseValidationError('duplicate-id', `${name} id ${id} appears twice`);
      seen.add(id);
    }
  }

  for (const a of g.assessments) {
    if (!sessionIds.has(a.sessionId))
      throw new CourseValidationError('dangling-reference', `assessment ${a.id} announced in missing session ${a.sessionId}`);
    if (!sessionIds.has(a.dueSessionId))
      throw new CourseValidationError('dangling-reference', `assessment ${a.id} due in missing session ${a.dueSessionId}`);
    for (const cov of a.coveredSessionIds ?? []) {
      if (!sessionIds.has(cov))
        throw new CourseValidationError('dangling-reference', `assessment ${a.id} covers missing session ${cov}`);
    }
  }
  for (const s of g.sessions) {
    for (const c of s.conceptIds)
      if (!conceptIds.has(c)) throw new CourseValidationError('dangling-reference', `session ${s.id} lists missing concept ${c}`);
    for (const o of s.outcomeIds)
      if (!outcomeIds.has(o)) throw new CourseValidationError('dangling-reference', `session ${s.id} lists missing outcome ${o}`);
  }
  for (const o of g.outcomes) {
    if (!sessionIds.has(o.sessionId))
      throw new CourseValidationError('dangling-reference', `outcome ${o.id} belongs to missing session ${o.sessionId}`);
  }
  for (const r of [...g.readings, ...g.resources]) {
    for (const sid of r.sessionIds)
      if (!sessionIds.has(sid)) throw new CourseValidationError('dangling-reference', `${r.id} linked to missing session ${sid}`);
  }
  for (const b of g.bridges) {
    if (!conceptIds.has(b.gapConceptId))
      throw new CourseValidationError('dangling-reference', `bridge ${b.id} targets missing concept ${b.gapConceptId}`);
    if (!sessionIds.has(b.beforeSessionId))
      throw new CourseValidationError('dangling-reference', `bridge ${b.id} placed before missing session ${b.beforeSessionId}`);
  }

  // teaching order: indexes are a permutation of 1..n (ids never renumber; indexes may)
  const indexes = [...g.sessions.map((s) => s.index)].sort((a, b) => a - b);
  for (let i = 0; i < indexes.length; i++) {
    if (indexes[i] !== i + 1)
      throw new CourseValidationError('index-gap', `session indexes are not a dense 1..${indexes.length} permutation`);
  }

  // graded weights may not exceed 100 (warning at ≠100 is the grader's job; >100 is invalid)
  const totalWeight = g.assessments.reduce((sum, a) => sum + (a.weightPct ?? 0), 0);
  if (totalWeight > 100.05)
    throw new CourseValidationError('weights-exceed-100', `graded weights sum to ${totalWeight.toFixed(2)}`);
}
