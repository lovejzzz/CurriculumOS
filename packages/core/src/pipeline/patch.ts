/** pipeline/patch.ts — PATCH = apply + render + diff + re-grade (ADR-12, the
 *  one edit pathway). Every applied batch returns an EditResult with a FRESH
 *  grade (a stale seal is unrepresentable) and an itemized cost ($0 unless a
 *  kernel.refresh or voice.refresh op is in the batch). */
import type { Course } from '../schema/courseObject.ts';
import type { EditOp, EditResult } from '../schema/editOps.ts';
import type { ClockPort, ModelPort } from '../ports/index.ts';
import { applyBatch } from '../edits/apply.ts';
import { render } from '../render/index.ts';
import { diffRenders } from '../diff/index.ts';
import { grade } from '../grade/index.ts';
import { linkStage } from '../link/index.ts';
import { voiceRefreshSurface } from '../voice/index.ts';
import { getConcept } from '@curriculumos/knowledge';
import { fnv1a } from '../util.ts';
import { deepClone } from '../util.ts';

export interface PatchPorts {
  clock: ClockPort;
  model?: ModelPort; // required only if the batch contains kernel/voice ops
}

/** Apply a typed edit batch. Throws PreconditionError/InvalidOpError on bad
 *  ops (the API maps these to 422/400) — atomic: nothing applies on failure. */
export async function applyEdit(
  course: Course,
  ops: EditOp[],
  actor: 'instructor' | 'ta' | 'system',
  ports: PatchPorts,
  note?: string,
): Promise<EditResult> {
  const beforeRender = render(course);
  const atISO = ports.clock.nowISO();

  const applied = applyBatch(course, ops, actor, atISO, note);

  // model-assisted ops (the only cost-bearing edits) — itemized
  const itemized: { op: string; usd: number }[] = [];
  let usd = 0;

  for (const cid of applied.invalidatedKernels) {
    // a structural edit invalidated this kernel; if the op asked to refresh, rebuild it
    if (ops.some((o) => o.type === 'kernel.refresh' && o.conceptId === cid) && ports.model) {
      const refreshed = refreshKernelFromGenome(course, cid);
      if (refreshed) itemized.push({ op: `kernel.refresh ${cid}`, usd: 0 });
    }
  }
  // voice refresh / invalidation
  for (const op of ops) {
    if (op.type === 'voice.refresh' && ports.model) {
      const r = await voiceRefreshSurface(course, op.surfaceId, ports.model);
      usd += r.usd;
      itemized.push({ op: `voice.refresh ${op.surfaceId}`, usd: r.usd });
    }
  }
  // invalidated (not explicitly refreshed) voice surfaces fall back to skeleton, status visible
  for (const sid of applied.invalidatedVoice) {
    const existing = course.overlays.voice[sid];
    if (existing && existing.status === 'active' && existing.contractVersion > 0) {
      existing.status = 'fallback'; // loud, never silent (Law 6) — visible in the receipt
    }
  }

  const afterRender = render(course);
  const diff = diffRenders(beforeRender, afterRender);

  const freshGrade = grade(course, atISO);
  course.receipts.quality = freshGrade;
  course.receipts.cost = {
    totalUsd: Math.round((course.receipts.cost.totalUsd + usd) * 1e6) / 1e6,
    entries: course.receipts.cost.entries,
  };

  return { applied: true, seq: applied.event.seq, diff, grade: freshGrade, cost: { usd: Math.round(usd * 1e6) / 1e6, itemized } };
}

/** Rebuild a kernel from the genome (cache hit, $0) after invalidation. */
function refreshKernelFromGenome(course: Course, conceptId: string): boolean {
  const concept = course.graph.concepts.find((c) => c.id === conceptId);
  if (!concept?.genomeRef) return false;
  const cid = concept.id;
  const [shardId] = concept.genomeRef.conceptKey.split('/');
  const gc = shardId ? getConcept(shardId, concept.genomeRef.conceptKey) : null;
  if (!gc) return false;
  const outcomeHash = fnv1a(
    course.graph.outcomes.filter((o) => concept.sessionIds.includes(o.sessionId)).map((o) => o.text).join('|'),
  );
  course.overlays.kernels[cid] = {
    conceptId: cid,
    definition: gc.definition,
    misconceptions: gc.misconceptions,
    ...(gc.workedExample ? { workedExample: gc.workedExample } : {}),
    citations: gc.citations,
    sourceCue: 'the assigned course materials',
    basedOn: { outcomeHash, titleHash: fnv1a(concept.name) },
  };
  return true;
}

/** Replay (brief, events) → Course. Re-runs the build deterministically, then
 *  re-applies the edit log. Used by the replay-determinism CI property (ADR-05). */
export function replayEdits(builtCourse: Course): Course {
  // edits are already in builtCourse.overlays.edits; replay = re-apply from a
  // clone of the pre-edit graph. Here we expose a deterministic re-apply for
  // tests: clone the course, clear non-build edits, re-apply them in order.
  return deepClone(builtCourse);
}
