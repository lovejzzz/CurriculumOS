/** ta/index.ts — the TA: a tool-calling agent whose tools ARE EditOps (ADR-12,
 *  founding §6). Every TA turn returns an EditOp batch with a rationale; it is
 *  previewed (diff + fresh grade against a clone) and lands in the Queue —
 *  nothing auto-applies. Humans and the agent use the same door. */
import type { Course } from '../schema/courseObject.ts';
import type { EditOp, EditResult } from '../schema/editOps.ts';
import type { ClockPort, ModelPort } from '../ports/index.ts';
import { applyEdit } from '../pipeline/patch.ts';
import { deepClone } from '../util.ts';
import { z } from 'zod';

const proposalSchema = z.object({
  reply: z.string(),
  note: z.string().optional(),
  ops: z.array(z.record(z.string(), z.unknown())).default([]),
});

export interface TAProposal {
  reply: string; // what the TA says to the instructor
  note?: string; // rationale carried on the EditEvent
  ops: EditOp[]; // the proposed batch (tools = EditOps)
  preview: { diff: EditResult['diff']; grade: EditResult['grade'] } | null; // computed on a clone
}

/** Summarize the course graph so the model can reference real ids. */
function courseContext(course: Course): string {
  const g = course.graph;
  const assess = g.assessments.map((a) => `${a.id} "${a.title}" ${a.kind} ${a.weightPct ?? 'null'}% due ${a.dueSessionId}`).join('\n');
  const sessions = g.sessions
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((s) => `${s.id} (#${s.index}) ${s.title}`)
    .join('\n');
  return `Course: ${g.courseTitle}\nSessions:\n${sessions}\nAssessments:\n${assess}`;
}

export const TA_SYSTEM = [
  'You are the TA for a course-authoring system. Your ONLY way to change the course is by emitting typed EditOps.',
  'Return strict JSON: { "reply": string, "note": string, "ops": EditOp[] }.',
  'EditOp examples: {"type":"assessment.set_weight","id":"A7.2","weightPct":25}, {"type":"session.retitle","id":"S5","title":"..."}, {"type":"assessment.retitle","id":"A3.1","title":"..."}, {"type":"reading.add","sessionIds":["S2"],"title":"...","kind":"book"}.',
  'Reference entities by their real ids only. If the request is a question, answer in reply with ops:[].',
  'Never let graded weights exceed 100; rebalance other items in the same batch if needed.',
].join('\n');

/** Ask the TA for a proposal, then preview it against a clone (diff + fresh
 *  grade) without mutating the live course. */
export async function proposeEdit(
  course: Course,
  message: string,
  model: ModelPort,
  clock: ClockPort,
): Promise<TAProposal> {
  const res = await model.completeJSON({
    purpose: 'chat',
    reasoning: 'low',
    system: TA_SYSTEM,
    user: `${courseContext(course)}\n\nInstructor: ${message}\n\nReturn JSON.`,
    payload: { message, course: courseContext(course) },
  });
  const parsed = proposalSchema.safeParse(res.json);
  if (!parsed.success) {
    return { reply: "I couldn't form a valid edit for that — could you rephrase?", ops: [], preview: null };
  }
  const ops = parsed.data.ops as EditOp[];
  let preview: TAProposal['preview'] = null;
  if (ops.length > 0) {
    try {
      const clone = deepClone(course);
      const result = await applyEdit(clone, ops, 'ta', { clock }, parsed.data.note);
      preview = { diff: result.diff, grade: result.grade };
    } catch {
      // an invalid proposal previews as null; the Queue shows it can't apply (Law 6)
      preview = null;
    }
  }
  return {
    reply: parsed.data.reply,
    ...(parsed.data.note ? { note: parsed.data.note } : {}),
    ops,
    preview,
  };
}
