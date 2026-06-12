/**
 * edits/apply.ts — the EditOp applier (ADR-12, the one edit pathway).
 * Instructor edits, TA edits, and system repairs all flow through here.
 *
 * Contract (editOps.ts header):
 *  - preconditions checked before apply; violation → PreconditionError, nothing applied
 *  - apply mutates graph/overlays, appends exactly one EditEvent with a dense seq,
 *    invalidates the listed overlays
 *  - a batch is atomic: all apply or none
 *
 * Re-render / diff / re-grade happen in the pipeline layer around this pure
 * applier (this function only mutates the Course and returns invalidations).
 */
import type { Course, SessionId } from '../schema/courseObject.ts';
import type { EditEvent, EditOp } from '../schema/editOps.ts';
import { fnv1a } from '../util.ts';

export class PreconditionError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'PreconditionError';
  }
}

export class InvalidOpError extends Error {
  constructor(
    public opIndex: number,
    message: string,
  ) {
    super(message);
    this.name = 'InvalidOpError';
  }
}

export interface ApplyResult {
  event: EditEvent;
  /** SurfaceIds whose voice/kernel overlays were invalidated (fall back to skeleton). */
  invalidatedVoice: string[];
  invalidatedKernels: string[];
}

function nextSeq(course: Course): number {
  const edits = course.overlays.edits;
  return edits.length === 0 ? 1 : (edits[edits.length - 1]?.seq ?? 0) + 1;
}

function assessmentSeries(course: Course, id: string) {
  return course.graph.assessments.find((a) => a.id === id);
}

/** Sum of graded weights — null weights are ungraded and excluded (A4). */
function gradedTotal(course: Course): number {
  return course.graph.assessments.reduce((s, a) => s + (a.weightPct ?? 0), 0);
}

/**
 * Validate the whole batch against the current course WITHOUT mutating, then
 * apply. Atomicity: we deep-validate first; if any op's precondition fails we
 * throw before touching the course.
 */
export function applyBatch(
  course: Course,
  ops: EditOp[],
  actor: EditEvent['actor'],
  atISO: string,
  note?: string,
): ApplyResult {
  if (ops.length === 0) throw new InvalidOpError(0, 'empty batch');

  // ── Phase 1: preconditions (no mutation) ──
  // Simulate weight changes across the batch so a multi-op rebalance is judged
  // as a whole (precondition: batch may not push graded total over 100).
  const weightAfter = new Map<string, number | null>();
  for (const a of course.graph.assessments) weightAfter.set(a.id, a.weightPct);

  ops.forEach((op, i) => {
    switch (op.type) {
      case 'assessment.set_weight': {
        const a = assessmentSeries(course, op.id);
        if (!a) throw new InvalidOpError(i, `assessment ${op.id} not found`);
        if (op.weightPct !== null && (op.weightPct < 0 || op.weightPct > 100))
          throw new PreconditionError('precondition-failed', `weight ${op.weightPct} out of range for ${op.id}`);
        weightAfter.set(op.id, op.weightPct);
        break;
      }
      case 'session.remove': {
        const exists = course.graph.sessions.some((s) => s.id === op.id);
        if (!exists) throw new InvalidOpError(i, `session ${op.id} not found`);
        // precondition: no assessment's dueSessionId references it unless that
        // assessment is ALSO removed in this batch (via assessment.remove)
        const removedAssessments = new Set(
          ops.filter((o): o is Extract<EditOp, { type: 'assessment.remove' }> => o.type === 'assessment.remove').map((o) => o.id),
        );
        const blockingDue = course.graph.assessments.find(
          (a) => a.dueSessionId === op.id && !removedAssessments.has(a.id),
        );
        if (blockingDue)
          throw new PreconditionError(
            'precondition-failed',
            `cannot remove ${op.id}: assessment ${blockingDue.id} is due there (remove it in the same batch)`,
          );
        break;
      }
      case 'session.move': {
        const exists = course.graph.sessions.some((s) => s.id === op.id);
        if (!exists) throw new InvalidOpError(i, `session ${op.id} not found`);
        if (op.toIndex < 1 || op.toIndex > course.graph.sessions.length)
          throw new PreconditionError('precondition-failed', `toIndex ${op.toIndex} out of range`);
        break;
      }
      case 'assessment.set_due': {
        const a = assessmentSeries(course, op.id);
        if (!a) throw new InvalidOpError(i, `assessment ${op.id} not found`);
        if (!course.graph.sessions.some((s) => s.id === op.dueSessionId))
          throw new PreconditionError('precondition-failed', `dueSessionId ${op.dueSessionId} not found`);
        break;
      }
      case 'outcome.edit':
      case 'outcome.remove': {
        if (!course.graph.outcomes.some((o) => o.id === op.id))
          throw new InvalidOpError(i, `outcome ${op.id} not found`);
        break;
      }
      case 'assessment.set_kind':
      case 'assessment.retitle':
      case 'assessment.remove': {
        if (!assessmentSeries(course, op.id)) throw new InvalidOpError(i, `assessment ${op.id} not found`);
        break;
      }
      case 'reading.set_locator':
      case 'reading.relink':
      case 'reading.remove': {
        if (!course.graph.readings.some((r) => r.id === op.id)) throw new InvalidOpError(i, `reading ${op.id} not found`);
        if (op.type === 'reading.relink')
          for (const sid of op.sessionIds)
            if (!course.graph.sessions.some((s) => s.id === sid))
              throw new PreconditionError('precondition-failed', `relink target ${sid} not found`);
        break;
      }
      case 'session.retitle': {
        if (!course.graph.sessions.some((s) => s.id === op.id)) throw new InvalidOpError(i, `session ${op.id} not found`);
        break;
      }
      case 'outcome.add': {
        if (!course.graph.sessions.some((s) => s.id === op.sessionId))
          throw new PreconditionError('precondition-failed', `outcome.add target session ${op.sessionId} not found`);
        break;
      }
      case 'assessment.add': {
        if (!course.graph.sessions.some((s) => s.id === op.sessionId))
          throw new PreconditionError('precondition-failed', `assessment.add target session ${op.sessionId} not found`);
        if (op.weightPct !== null) weightAfter.set(`__new_${i}`, op.weightPct);
        break;
      }
      case 'kernel.refresh':
      case 'kernel.accept': {
        if (!course.graph.concepts.some((c) => c.id === op.conceptId))
          throw new InvalidOpError(i, `concept ${op.conceptId} not found`);
        break;
      }
      default:
        break; // course.*, brief.amend, session.add, resource.*, voice.*, artifact.* have shape-only checks
    }
  });

  const projectedTotal = [...weightAfter.values()].reduce<number>((s, w) => s + (w ?? 0), 0);
  if (projectedTotal > 100.05)
    throw new PreconditionError(
      'precondition-failed',
      `graded weights would total ${projectedTotal.toFixed(2)} (>100)`,
    );

  // ── Phase 2: apply (mutation) ──
  const invalidatedVoice = new Set<string>();
  const invalidatedKernels = new Set<string>();
  for (const op of ops) applyOne(course, op, invalidatedVoice, invalidatedKernels);

  const event: EditEvent = { seq: nextSeq(course), at: atISO, actor, ops, ...(note ? { note } : {}) };
  course.overlays.edits.push(event);

  return {
    event,
    invalidatedVoice: [...invalidatedVoice],
    invalidatedKernels: [...invalidatedKernels],
  };
}

function reindex(course: Course): void {
  // ensure dense 1..n indexes after add/move/remove, preserving relative order
  const sorted = [...course.graph.sessions].sort((a, b) => a.index - b.index);
  sorted.forEach((s, i) => (s.index = i + 1));
}

function invalidateSessionVoice(course: Course, sessionId: SessionId, voiceSet: Set<string>): void {
  for (const sid of Object.keys(course.overlays.voice)) {
    if (sid.includes(`:${sessionId}:`)) voiceSet.add(sid);
  }
}

function invalidateConceptKernels(course: Course, sessionId: SessionId, kernelSet: Set<string>, voiceSet: Set<string>): void {
  const session = course.graph.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  for (const cid of session.conceptIds) {
    if (course.overlays.kernels[cid]) kernelSet.add(cid);
  }
  invalidateSessionVoice(course, sessionId, voiceSet);
}

function applyOne(course: Course, op: EditOp, voiceSet: Set<string>, kernelSet: Set<string>): void {
  const g = course.graph;
  switch (op.type) {
    case 'course.set_title':
      g.courseTitle = op.title;
      break;
    case 'course.set_term':
      g.term = op.term;
      break;
    case 'brief.amend':
      course.brief.text = `${course.brief.text}\n\n[amendment] ${op.addendum}`;
      break;

    case 'session.add': {
      const maxIdx = g.sessions.reduce((m, s) => Math.max(m, parseInt(s.id.slice(1), 10)), 0);
      const newId = `S${maxIdx + 1}` as SessionId;
      const afterIndex = op.afterId ? (g.sessions.find((s) => s.id === op.afterId)?.index ?? g.sessions.length) : 0;
      for (const s of g.sessions) if (s.index > afterIndex) s.index += 1;
      g.sessions.push({ id: newId, index: afterIndex + 1, title: op.title, conceptIds: [], outcomeIds: [] });
      reindex(course);
      break;
    }
    case 'session.retitle': {
      const s = g.sessions.find((x) => x.id === op.id);
      if (s) {
        s.title = op.title;
        invalidateConceptKernels(course, op.id, kernelSet, voiceSet);
      }
      break;
    }
    case 'session.move': {
      const s = g.sessions.find((x) => x.id === op.id);
      if (s) {
        const from = s.index;
        const to = op.toIndex;
        if (from !== to) {
          for (const other of g.sessions) {
            if (other.id === s.id) continue;
            if (from < to && other.index > from && other.index <= to) other.index -= 1;
            else if (from > to && other.index >= to && other.index < from) other.index += 1;
          }
          s.index = to;
          reindex(course);
        }
      }
      break;
    }
    case 'session.remove': {
      g.sessions = g.sessions.filter((s) => s.id !== op.id);
      // cascade: drop outcomes/assessments tied to it (precondition already cleared dues)
      g.outcomes = g.outcomes.filter((o) => o.sessionId !== op.id);
      g.assessments = g.assessments.filter((a) => a.sessionId !== op.id);
      for (const r of g.readings) r.sessionIds = r.sessionIds.filter((s) => s !== op.id);
      for (const r of g.resources) r.sessionIds = r.sessionIds.filter((s) => s !== op.id);
      reindex(course);
      break;
    }

    case 'outcome.add': {
      const session = g.sessions.find((s) => s.id === op.sessionId);
      if (session) {
        const n = g.outcomes.filter((o) => o.sessionId === op.sessionId).length + 1;
        const sIdx = session.index;
        const id = `O${sIdx}.${n}` as `O${number}.${number}`;
        g.outcomes.push({ id, sessionId: op.sessionId, text: op.text, bloom: 'Understand' });
        session.outcomeIds.push(id);
        invalidateConceptKernels(course, op.sessionId, kernelSet, voiceSet);
      }
      break;
    }
    case 'outcome.edit': {
      const o = g.outcomes.find((x) => x.id === op.id);
      if (o) {
        o.text = op.text;
        invalidateConceptKernels(course, o.sessionId, kernelSet, voiceSet);
      }
      break;
    }
    case 'outcome.remove': {
      const o = g.outcomes.find((x) => x.id === op.id);
      if (o) {
        g.outcomes = g.outcomes.filter((x) => x.id !== op.id);
        const session = g.sessions.find((s) => s.id === o.sessionId);
        if (session) session.outcomeIds = session.outcomeIds.filter((x) => x !== op.id);
        invalidateConceptKernels(course, o.sessionId, kernelSet, voiceSet);
      }
      break;
    }

    case 'assessment.add': {
      const session = g.sessions.find((s) => s.id === op.sessionId);
      if (session) {
        const n = g.assessments.filter((a) => a.sessionId === op.sessionId).length + 1;
        const id = `A${session.index}.${n}` as `A${number}.${number}`;
        g.assessments.push({
          id,
          sessionId: op.sessionId,
          dueSessionId: op.sessionId,
          title: op.title,
          kind: op.kind as never,
          weightPct: op.weightPct,
          cadence: 'once',
        });
      }
      break;
    }
    case 'assessment.set_weight': {
      const a = assessmentSeries(course, op.id);
      if (a) {
        a.weightPct = op.weightPct;
        // diff radius: brief/rubric header + study-guide mentions; retitle invalidates voice, weight does not
      }
      break;
    }
    case 'assessment.set_kind': {
      const a = assessmentSeries(course, op.id);
      if (a) a.kind = op.kind as never;
      break;
    }
    case 'assessment.set_due': {
      const a = assessmentSeries(course, op.id);
      if (a) a.dueSessionId = op.dueSessionId;
      break;
    }
    case 'assessment.retitle': {
      const a = assessmentSeries(course, op.id);
      if (a) {
        a.title = op.title;
        voiceSet.add(`brief:${a.sessionId}:context`);
      }
      break;
    }
    case 'assessment.remove': {
      g.assessments = g.assessments.filter((a) => a.id !== op.id);
      break;
    }

    case 'reading.add': {
      const firstSession = op.sessionIds[0] ?? g.sessions[0]?.id;
      const sIdx = firstSession ? (g.sessions.find((s) => s.id === firstSession)?.index ?? 1) : 1;
      const n = g.readings.filter((r) => r.id.startsWith(`R${sIdx}.`)).length + 1;
      const id = `R${sIdx}.${n}` as `R${number}.${number}`;
      g.readings.push({
        id,
        sessionIds: op.sessionIds,
        title: op.title,
        kind: op.kind as never,
        provenance: 'instructor-named', // always, for this op (R1)
        ...(op.locator ? { locator: op.locator } : {}),
      });
      break;
    }
    case 'reading.set_locator': {
      const r = g.readings.find((x) => x.id === op.id);
      if (r) r.locator = op.locator;
      break;
    }
    case 'reading.relink': {
      const r = g.readings.find((x) => x.id === op.id);
      if (r) {
        // voice surfaces that cite this reading invalidate
        for (const sid of [...r.sessionIds, ...op.sessionIds]) invalidateSessionVoice(course, sid, voiceSet);
        r.sessionIds = op.sessionIds;
      }
      break;
    }
    case 'reading.remove': {
      const r = g.readings.find((x) => x.id === op.id);
      if (r) for (const sid of r.sessionIds) invalidateSessionVoice(course, sid, voiceSet);
      g.readings = g.readings.filter((x) => x.id !== op.id);
      break;
    }

    case 'resource.add': {
      const firstSession = op.sessionIds[0] ?? g.sessions[0]?.id;
      const sIdx = firstSession ? (g.sessions.find((s) => s.id === firstSession)?.index ?? 1) : 1;
      const n = g.resources.filter((r) => r.id.startsWith(`X${sIdx}.`)).length + 1;
      const id = `X${sIdx}.${n}` as `X${number}.${number}`;
      g.resources.push({ id, sessionIds: op.sessionIds, title: op.title, kind: op.kind as never, provenance: 'instructor-named' });
      break;
    }
    case 'resource.remove': {
      g.resources = g.resources.filter((x) => x.id !== op.id);
      break;
    }

    case 'kernel.refresh': {
      // model-assisted op — the pipeline layer runs extraction; here we mark the
      // kernel invalid so the pipeline knows to rebuild it (cost itemized there)
      kernelSet.add(op.conceptId);
      break;
    }
    case 'kernel.accept': {
      course.overlays.kernels[op.conceptId] = op.kernel as never;
      break;
    }

    case 'voice.accept': {
      const existing = course.overlays.voice[op.surfaceId];
      course.overlays.voice[op.surfaceId] = {
        surfaceId: op.surfaceId,
        text: op.text,
        contractVersion: existing?.contractVersion ?? 1,
        basedOnHash: fnv1a(op.text),
        status: 'active',
      };
      break;
    }
    case 'voice.reject': {
      delete course.overlays.voice[op.surfaceId];
      break;
    }
    case 'voice.refresh': {
      voiceSet.add(op.surfaceId); // pipeline re-runs voice for this surface
      break;
    }

    case 'artifact.patch_text': {
      course.overlays.voice[op.surfaceId] = {
        surfaceId: op.surfaceId,
        text: op.text,
        contractVersion: 0, // 0 = human hand-edit, not model voice
        basedOnHash: fnv1a(op.text),
        status: 'active',
      };
      break;
    }
    case 'artifact.clear_patch': {
      delete course.overlays.voice[op.surfaceId];
      break;
    }
  }
}
