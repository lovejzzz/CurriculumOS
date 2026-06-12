/** author/items.ts — Pass C: genuine assessment items (V0.0.3). The judge
 *  scored compiled quizzes 1–4/10. This budgeted, parallel, low-reasoning pass
 *  (the voice pattern) authors real items grounded in each session's kernels:
 *  application MCs whose distractors are the kernel's DISTINCT misconceptions,
 *  short-answer items keyed to the kernel, one transfer item. Every item is
 *  contract-linted; a violation falls back to nothing for that session (the
 *  renderer then compiles items as before — counted, never silent). */
import type { AssessmentItem, Course, Kernel, Session } from '../schema/courseObject.ts';
import type { ModelPort } from '../ports/index.ts';
import { z } from 'zod';
import { checkItem, checkItemSet } from './itemContracts.ts';

/** boundary tolerance (the Pass A lesson, applied here after the v0.0.5
 *  instrumentation showed 'apply' vs 'Apply' blocking whole sessions) */
const bloomEnum = z.preprocess(
  (v) => (typeof v === 'string' && v.length ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : v),
  z.enum(['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']).catch('Understand'),
);

export const itemsSchema = z.object({
  items: z
    .array(
      z.object({
        kind: z.enum(['mc', 'short-answer', 'applied']),
        stem: z.string().min(1),
        options: z
          .array(z.object({ text: z.string().min(1), correct: z.boolean(), rationale: z.string().optional() }))
          .optional(),
        // MC items may omit the key — the marked correct option IS the key
        answerKey: z.string().nullish().transform((v) => v ?? ''),
        bloom: bloomEnum,
        concept: z.string().nullish().transform((v) => v ?? undefined),
      }),
    )
    .min(4),
});

export interface ItemsResult {
  sessions: number;
  authored: number; // sessions whose item set passed contracts
  fallbacks: number; // sessions that fell back to compiled items
  /** WHY each session fell back — named, never silent (the 10/10 plan, R1:
   *  "you cannot fix a failure you cannot see") */
  fallbackReasons: Record<string, string>;
  usd: number;
}

/** budget scales with course size (R1: a 14-session course starved a $0.05 cap) */
export function itemsBudgetFor(sessions: number): number {
  return Math.max(0.05, sessions * 0.006);
}
const ITEMS_CONCURRENCY = 6;

const SYSTEM = [
  'You write genuine assessment items for ONE session of a course, grounded ONLY in the provided kernel (definition + misconceptions + worked example).',
  'Author 4–6 items: 2–3 multiple-choice (4 options, exactly ONE correct), 1–2 short-answer with a real key, and one applied/transfer item.',
  'For multiple-choice, the WRONG options must be the real student misconceptions provided — never generic filler like "none of the above" or "a different concept". Each distractor must be plausible and concept-specific.',
  'Never put the answer in the stem. Vary the question stems — do not template them. Mix Bloom levels (Understand + Apply at least).',
  'Return strict JSON: { items: [{ kind, stem, options?:[{text,correct,rationale?}], answerKey, bloom, concept? }] }.',
].join('\n');

function kernelsForSession(course: Course, s: Session): Kernel[] {
  return s.conceptIds.map((id) => course.overlays.kernels[id]).filter((k): k is Kernel => !!k);
}

function groundingFor(course: Course, s: Session): string {
  const kernels = kernelsForSession(course, s);
  const parts = [`Session: ${s.title}`];
  for (const k of kernels) {
    parts.push(`Concept: ${course.graph.concepts.find((c) => c.id === k.conceptId)?.name ?? ''}`);
    parts.push(`Definition: ${k.definition}`);
    for (const m of k.misconceptions) parts.push(`Misconception: ${m.claim} — Correction: ${m.correction}`);
    if (k.workedExample) parts.push(`Worked example: ${k.workedExample.setup} → ${k.workedExample.answer}`);
  }
  for (const o of course.graph.outcomes.filter((x) => x.sessionId === s.id)) parts.push(`Outcome (${o.bloom}): ${o.text}`);
  return parts.join('\n');
}

function toItems(s: Session, raw: z.infer<typeof itemsSchema>, course: Course): AssessmentItem[] {
  return raw.items.map((it) => {
    const concept = it.concept ? course.graph.concepts.find((c) => c.name.toLowerCase() === it.concept!.toLowerCase()) : undefined;
    // MC key derives from the marked correct option when the model omits it
    const correct = it.options?.find((o) => o.correct);
    const answerKey = it.answerKey || (correct ? `${correct.text}${correct.rationale ? ` — ${correct.rationale}` : ''}` : '');
    const base: AssessmentItem = {
      sessionId: s.id,
      ...(concept ? { conceptId: concept.id } : {}),
      kind: it.kind,
      stem: it.stem,
      answerKey,
      bloom: it.bloom,
      status: 'active',
    };
    if (it.kind === 'mc' && it.options) base.options = it.options;
    return base;
  });
}

/** Author one session's items: attempt + one retry quoting violations; on a
 *  second failure, return null + the NAMED reason so the renderer compiles
 *  items for that session and the receipt explains why (R1 instrumentation). */
async function authorSession(
  course: Course,
  s: Session,
  model: ModelPort,
): Promise<{ items: AssessmentItem[] | null; usd: number; reason?: string }> {
  const kernels = kernelsForSession(course, s);
  if (kernels.length === 0) return { items: null, usd: 0, reason: 'no kernels to ground on' };
  const grounding = groundingFor(course, s);
  let usd = 0;
  let lastViolations: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    let res;
    try {
      res = await model.completeJSON({
        purpose: 'items',
        reasoning: 'low',
        maxOutputTokens: 1400,
        system: SYSTEM,
        user:
          `Write the assessment items for this session as JSON, grounded ONLY in the kernel below. ` +
          (attempt > 0 ? `Your previous attempt violated the item contract: ${lastViolations.join('; ')}. Fix exactly these. ` : '') +
          `\n\n${grounding}`,
        payload: { sessionId: s.id, grounding },
      });
    } catch (err) {
      return { items: null, usd, reason: `provider: ${err instanceof Error ? err.message.slice(0, 80) : 'error'}` };
    }
    usd += res.usd;
    const parsed = itemsSchema.safeParse(res.json);
    if (!parsed.success) {
      lastViolations = parsed.error.issues.slice(0, 4).map((i) => `${i.path.join('.')}: ${i.message}`);
      continue;
    }
    const items = toItems(s, parsed.data, course);
    const setCheck = checkItemSet(items);
    const itemChecks = items.map((it) => checkItem(it, it.conceptId ? course.overlays.kernels[it.conceptId] : kernels[0]));
    const allViolations = [...setCheck.violations, ...itemChecks.flatMap((c) => c.violations)];
    if (setCheck.ok && itemChecks.every((c) => c.ok)) return { items, usd };
    lastViolations = allViolations.slice(0, 5);
  }
  return { items: null, usd, reason: lastViolations.join('; ').slice(0, 160) || 'schema invalid after retry' };
}

/** Run Pass C across sessions in bounded-concurrency waves (budgeted, W5-style). */
export async function itemsStage(
  course: Course,
  model: ModelPort,
  opts: { budgetUsd?: number; onSession?: (sessionId: string, fallback: boolean) => void } = {},
): Promise<ItemsResult> {
  const sessions = [...course.graph.sessions].sort((a, b) => a.index - b.index);
  const budget = opts.budgetUsd ?? itemsBudgetFor(sessions.length);
  course.overlays.items = course.overlays.items ?? {};
  let usd = 0;
  let authored = 0;
  let fallbacks = 0;
  const fallbackReasons: Record<string, string> = {};

  for (let i = 0; i < sessions.length; i += ITEMS_CONCURRENCY) {
    const wave = sessions.slice(i, i + ITEMS_CONCURRENCY);
    if (usd >= budget) {
      // budget exhausted — remaining sessions compile their items (NAMED)
      for (const s of wave) {
        fallbacks++;
        fallbackReasons[s.id] = `budget exhausted at $${usd.toFixed(4)}`;
        opts.onSession?.(s.id, true);
      }
      continue;
    }
    const settled = await Promise.allSettled(wave.map((s) => authorSession(course, s, model)));
    settled.forEach((outcome, j) => {
      const s = wave[j]!;
      if (outcome.status === 'fulfilled') {
        usd += outcome.value.usd;
        if (outcome.value.items) {
          course.overlays.items![s.id] = outcome.value.items;
          authored++;
          opts.onSession?.(s.id, false);
          return;
        }
        fallbackReasons[s.id] = outcome.value.reason ?? 'unknown';
      } else {
        fallbackReasons[s.id] = `rejected: ${String(outcome.reason).slice(0, 80)}`;
      }
      fallbacks++;
      opts.onSession?.(s.id, true);
    });
  }
  return { sessions: sessions.length, authored, fallbacks, fallbackReasons, usd };
}
