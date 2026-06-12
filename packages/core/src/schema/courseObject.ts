/**
 * 010-schema/courseObject.ts — the Course Object, fully typed.
 *
 * This file is normative: the new repo's packages/core/src/schema.ts starts
 * as a copy of this file. Field semantics carry the prototype's lessons —
 * where a field exists because of a CourseMapper scar, the comment names it.
 *
 * ID LAW (founding doc, Law 3): every entity gets its id at birth; ids are
 * never reused, never renumbered, never derived from titles. Sessions may
 * reorder — their ids do not change. All cross-references are by id.
 */

import type { EditEvent } from './editOps.ts';

// ── Identifiers ──────────────────────────────────────────────────────────────
// Formats are part of the contract (graders and exporters print them).
export type SessionId = `S${number}`; // S1, S2, …      (1-based, birth order)
export type ConceptId = `C${number}`; // C1, C2, …
export type OutcomeId = `O${number}.${number}`; // O<sessionIndex>.<n>
export type AssessmentId = `A${number}.${number}`; // A7.2 = session 7, 2nd atom
export type ReadingId = `R${number}.${number}`; // R8.1
export type ResourceId = `X${number}.${number}`;
export type BridgeId = `B${number}`;
/** SurfaceId addresses one voiceable/editable prose slot in one artifact.
 *  Format: `${artifactKind}:${SessionId | 'course'}:${slot}`
 *  e.g. "brief:S5:context", "discussion:S3:framing", "syllabus:course:welcome" */
export type SurfaceId = string;

// ── The Course Object ────────────────────────────────────────────────────────
export interface Course {
  id: string; // ULID
  schemaVersion: 1;
  brief: Brief; // the instructor's words — verbatim, immutable, forever
  graph: CourseGraph; // THE source of truth
  overlays: Overlays; // kernels, voice, and the edit log
  receipts: Receipts; // provenance, cost, quality, build history
  // NOTE deliberately absent: artifacts. They are renders, never stored as
  // truth. render(graph, overlays, lens) is a pure function in core.
}

export interface Brief {
  text: string; // never normalized, never trimmed beyond whitespace
  files: BriefFile[]; // extracted text of uploads, with byte hashes
  receivedAt: string; // ISO
}
export interface BriefFile {
  name: string;
  sha256: string;
  extractedText: string;
}

// ── Graph ────────────────────────────────────────────────────────────────────
export interface CourseGraph {
  courseTitle: string; // verbatim-eligible (see contracts §V1)
  discipline: DisciplineLens; // drives template data selection
  term?: string;
  sessions: Session[];
  concepts: Concept[];
  outcomes: Outcome[];
  assessments: Assessment[];
  readings: Reading[];
  resources: Resource[];
  bridges: Bridge[];
  standards?: StandardsCrosswalk; // optional; NGSS-seeded in prototype
}

export interface Session {
  id: SessionId;
  index: number; // current teaching order (mutable; id is not)
  title: string; // verbatim-eligible
  summary?: string;
  conceptIds: ConceptId[];
  outcomeIds: OutcomeId[];
}

export interface Concept {
  id: ConceptId;
  name: string;
  sessionIds: SessionId[];
  /** Genome linkage. null = linker ran and missed (triggers cache-miss
   *  extraction when enabled); undefined = not yet linked. */
  genomeRef?: { shard: string; conceptKey: string } | null;
}

export interface Outcome {
  id: OutcomeId;
  sessionId: SessionId;
  text: string;
  /** Verb classification feeds the alignment audit ("Evaluate Design"). */
  bloom: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
}

/** SCAR (v0.14.1): assessments were prose once, and ".2 atoms" silently
 *  dropped. The registry IS the fix; every downstream artifact derives from
 *  these entries and the reconciliation gate fails loudly on any orphan. */
export interface Assessment {
  id: AssessmentId;
  sessionId: SessionId; // where it is announced/assigned
  dueSessionId: SessionId; // where it is due (exams: where sat)
  title: string; // verbatim-eligible
  kind: 'quiz' | 'exam' | 'oral' | 'in-class' | 'graded-artifact' | 'project' | 'discussion';
  weightPct: number | null; // null = ungraded/practice
  /** SCAR (native Round B): "weekly quizzes" transcribed as ONE entry →
   *  degenerate registry → silent hang. Cadence is explicit so expansion
   *  (one entry per covered session) is a checked invariant, not a vibe. */
  cadence: 'once' | 'per-session';
  coveredSessionIds?: SessionId[]; // exams: scope; quizzes: usually [sessionId]
  notes?: string;
}

/** SCAR (V0.14 audit → v0.14.5): the instructor's named works were being
 *  replaced by retrieval. Provenance is an enum with a total order; renders
 *  may ENRICH metadata of instructor-named works but never replace titles. */
export interface Reading {
  id: ReadingId;
  sessionIds: SessionId[];
  title: string; // VERBATIM when provenance is instructor-*
  author?: string;
  locator?: string; // "ch. 1–4", "pp. 12–40"
  kind: 'book' | 'article' | 'chapter' | 'media' | 'website' | 'dataset';
  provenance: 'instructor-named' | 'instructor-provided' | 'genome-cited' | 'retrieved-open';
  externalIds?: { doi?: string; isbn?: string; openalex?: string; openlibrary?: string };
}

export interface Resource {
  id: ResourceId;
  sessionIds: SessionId[];
  title: string;
  kind: 'tool' | 'software' | 'equipment' | 'site' | 'document';
  provenance: Reading['provenance'];
}

/** Prerequisite-gap primer (the judgment layer's output). Citations must be
 *  provider-verified before a bridge persists (contracts §K3). */
export interface Bridge {
  id: BridgeId;
  gapConceptId: ConceptId;
  beforeSessionId: SessionId;
  primer: { text: string; citations: Citation[] };
}

export interface Citation {
  title: string;
  source: 'openalex' | 'openlibrary' | 'genome';
  externalId: string;
  year?: number;
}

export type DisciplineLens =
  | 'stem-quant'
  | 'stem-lab'
  | 'cs'
  | 'humanities'
  | 'social-science'
  | 'language'
  | 'arts'
  | 'business'
  | 'health'
  | 'education'
  | 'general';

export interface StandardsCrosswalk {
  framework: string; // e.g. "NGSS"
  mappings: { outcomeId: OutcomeId; code: string; confidence: 'exact' | 'partial' }[];
}

// ── Overlays ─────────────────────────────────────────────────────────────────
export interface Overlays {
  kernels: Record<ConceptId, Kernel>;
  voice: Record<SurfaceId, VoiceProse>;
  /** Append-only. Replaying brief→edits deterministically reproduces the
   *  Course Object (no Date.now()/randomness inside core — Crucible law). */
  edits: EditEvent[]; // EditEvent defined in editOps.ts
}

/** Subject-matter kernel — what makes content non-generic. Survives sync
 *  (SCAR: the prototype's sync silently dropped these — audit §2.9). */
export interface Kernel {
  conceptId: ConceptId;
  definition: string;
  misconceptions: { claim: string; correction: string }[];
  workedExample?: { setup: string; steps: string[]; answer: string };
  citations: Citation[];
  sourceCue?: string; // "the assigned course materials" replacement
  romanization?: Record<string, string>; // language courses: term → rm
  /** Invalidation: kernels are keyed to the graph state that produced them. */
  basedOn: { outcomeHash: string; titleHash: string };
}

export interface VoiceProse {
  surfaceId: SurfaceId;
  text: string;
  contractVersion: number; // which voice contract validated it
  basedOnHash: string; // hash of the rendered skeleton it wrapped
  status: 'active' | 'fallback'; // fallback = contract failed, compiled text used
}

// ── Receipts ─────────────────────────────────────────────────────────────────
export interface Receipts {
  provenance: Record<string /* any entity id or SurfaceId */, ProvenanceMark>;
  cost: CostLedger;
  quality: Grade | null; // null ONLY before first grade; never stale —
  //                        every applied EditOp batch re-grades (Law: a
  //                        stale seal is unrepresentable).
  builds: BuildRecord[];
}

export type ProvenanceMark =
  | { source: 'instructor'; briefSpan?: [number, number] }
  | { source: 'genome'; ref: string }
  | { source: 'retrieved'; provider: string; externalId: string }
  | { source: 'voiced'; model: string; contractVersion: number }
  | { source: 'compiled' };

export interface CostLedger {
  totalUsd: number;
  entries: {
    stage: string; // machine state name
    model?: string;
    calls: number;
    inputTokens: number;
    outputTokens: number;
    reasoningTokens: number;
    usd: number; // provider-reported tokens × published rates
  }[];
}

export interface Grade {
  structural: {
    score: number; // 0–100
    letter: 'A' | 'B' | 'C' | 'D' | 'F';
    findings: Finding[];
    graderVersion: string;
  };
  teachability: {
    score10: number; // the judge's question, measured
    dimensions: { sameness: number; specificity: number; arc: number };
    calibrationRef: string; // verdicts ledger entry it was calibrated against
  };
  gradedAt: string;
  driftCheck?: { externalScore: number; delta: number }; // Crucible fills this
}

export interface Finding {
  id: string;
  severity: 'P0' | 'P1' | 'P2';
  dimension: string;
  surface?: SurfaceId;
  entityId?: string;
  detail: string;
  evidence: string; // the offending text, quoted — findings must be checkable
}

export interface BuildRecord {
  buildId: string;
  startedAt: string;
  states: { state: string; enteredAt: string; detail?: string }[];
  terminal: 'ready' | 'blocked';
  blockedReason?: string; // named, never generic (Law 6)
  costUsd: number;
}
