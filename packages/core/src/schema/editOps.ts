/**
 * 010-schema/editOps.ts — the EditOp catalog, normative.
 *
 * EVERY change to a Course Object after creation is one of these typed
 * operations — instructor edits, TA (agent) edits, and system repairs all
 * use the same catalog. There is no freetext field-poke API. This is what
 * makes PATCH = diff + re-grade a property instead of a feature.
 *
 * Op semantics, uniformly:
 *  - preconditions are checked before apply; violation → 422, nothing applied
 *  - apply mutates graph/overlays, appends an EditEvent, invalidates the
 *    listed overlays, re-renders, diffs, and RE-GRADES (always; grades are
 *    never stale by construction)
 *  - a batch of ops is atomic: all apply or none
 */
import type {
  AssessmentId,
  Citation,
  ConceptId,
  Course,
  OutcomeId,
  ReadingId,
  ResourceId,
  SessionId,
  SurfaceId,
} from './courseObject.ts';

// ── The catalog ──────────────────────────────────────────────────────────────
export type EditOp =
  // course-level
  | { type: 'course.set_title'; title: string }
  | { type: 'course.set_term'; term: string }
  | { type: 'brief.amend'; addendum: string } // appends; brief text itself is immutable

  // sessions — ids never renumber on move/remove (Law 3)
  | { type: 'session.add'; afterId: SessionId | null; title: string }
  | { type: 'session.retitle'; id: SessionId; title: string }
  | { type: 'session.move'; id: SessionId; toIndex: number }
  | { type: 'session.remove'; id: SessionId } // precondition: no assessment dueSessionId
  //                                             references it unless also removed in batch

  // outcomes
  | { type: 'outcome.add'; sessionId: SessionId; text: string }
  | { type: 'outcome.edit'; id: OutcomeId; text: string } // invalidates: session kernels
  | { type: 'outcome.remove'; id: OutcomeId }

  // assessments — the registry ops; the sync demo lives here
  | { type: 'assessment.add'; sessionId: SessionId; title: string; kind: string; weightPct: number | null }
  | { type: 'assessment.set_weight'; id: AssessmentId; weightPct: number | null }
  //   diff radius: syllabus grading table, the assessment's brief/rubric
  //   header, study-guide mentions. Precondition: batch may not push the
  //   graded total over 100 (warning at ≠100, block at >100).
  | { type: 'assessment.set_kind'; id: AssessmentId; kind: string }
  | { type: 'assessment.set_due'; id: AssessmentId; dueSessionId: SessionId }
  | { type: 'assessment.retitle'; id: AssessmentId; title: string }
  | { type: 'assessment.remove'; id: AssessmentId }

  // readings — provenance order enforced (contracts §R)
  | { type: 'reading.add'; sessionIds: SessionId[]; title: string; kind: string; locator?: string }
  //   provenance is ALWAYS 'instructor-named' for this op
  | { type: 'reading.set_locator'; id: ReadingId; locator: string }
  | { type: 'reading.relink'; id: ReadingId; sessionIds: SessionId[] }
  | { type: 'reading.remove'; id: ReadingId }

  // resources
  | { type: 'resource.add'; sessionIds: SessionId[]; title: string; kind: string }
  | { type: 'resource.remove'; id: ResourceId }

  // kernels — the model-assisted op (cost itemized; everything else is $0)
  | { type: 'kernel.refresh'; conceptId: ConceptId } // runs extraction + verification;
  //   the ONLY op that may spend money without a voice surface involved
  | { type: 'kernel.accept'; conceptId: ConceptId; kernel: unknown } // explicit replace

  // voice — the human stays sovereign over prose
  | { type: 'voice.accept'; surfaceId: SurfaceId; text: string }
  | { type: 'voice.reject'; surfaceId: SurfaceId } // reverts surface to compiled skeleton
  | { type: 'voice.refresh'; surfaceId: SurfaceId } // re-runs voice pass for one surface

  // artifact text — SCAR (sync clobbering): hand-edits to rendered text are
  // stored as id-bound overlay patches and re-applied after every recompile.
  | { type: 'artifact.patch_text'; surfaceId: SurfaceId; text: string }
  | { type: 'artifact.clear_patch'; surfaceId: SurfaceId };

// ── Events and results ───────────────────────────────────────────────────────
export interface EditEvent {
  seq: number; // dense, ascending; THE ordering authority
  at: string; // ISO — recorded at the edge, injected into core (replay-safe)
  actor: 'instructor' | 'ta' | 'system';
  ops: EditOp[]; // the atomic batch
  note?: string; // TA proposals carry their rationale here
}

export interface EditResult {
  applied: boolean;
  seq: number;
  diff: ArtifactDiff[];
  grade: import('./courseObject.ts').Grade; // fresh, always
  cost: { usd: number; itemized: { op: string; usd: number }[] }; // $0 unless kernel/voice
}

/** Human-readable, machine-checkable. The desk renders these as the
 *  four-second sync moment; the Crucible asserts them. */
export interface ArtifactDiff {
  artifact: string; // 'syllabus' | 'lessonPlans' | …
  surfaceId?: SurfaceId;
  entityId?: string;
  change: 'added' | 'removed' | 'updated';
  summary: string; // "Grading table: Midterm 20% → 25%"
  before?: string;
  after?: string;
}

// ── Invalidation table (normative) ──────────────────────────────────────────
// op family              → invalidates
// session.retitle        → kernels of its concepts (basedOn.titleHash), voice of its surfaces
// outcome.*              → kernels of the session's concepts, voice of assessment-linked surfaces
// assessment.*           → nothing model-made (pure recompile) EXCEPT retitle → voice of its brief surfaces
// reading.*              → voice of surfaces that cite the reading
// kernel.*               → voice of surfaces rendering that concept
// voice.* / artifact.*   → nothing (leaf overlays)
// Invalidated voice falls back to skeleton with status:'fallback' until
// refreshed — visible in the receipt, never silent (Law 6).
