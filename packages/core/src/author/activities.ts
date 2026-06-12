/** author/activities.ts — Pass D (v0.0.6, the 10/10 plan workstream B): the
 *  session arc written USING the kernel. The judge's recurring complaint —
 *  "templated activities, not text/code-specific, outcomes not operationalized"
 *  — is a synthesis problem, and synthesis is sentence-writing: paid, budgeted,
 *  contract-linted, with the compiled lens frames as the loud fallback (Law 4).
 *
 *  Contracts (linted at the boundary; one retry with the rule quoted):
 *   - all four phases, minutes summing to a real class period (40–70)
 *   - EVERY session outcome id operationalized by some phase
 *   - the script is kernel-grounded: concept named + kernel vocabulary present
 *   - phases are distinct (no template stamped four times)
 *   - one concrete performance task (a deliverable sentence, not a vibe) */
import type { ActivityPlan, Course, Kernel, OutcomeId, Session } from '../schema/courseObject.ts';
import type { ModelPort } from '../ports/index.ts';
import { z } from 'zod';

export const activitiesSchema = z.object({
  phases: z
    .array(
      z.object({
        phase: z.enum(['warmup', 'core', 'practice', 'closing']),
        minutes: z.number().int().min(3).max(35),
        activity: z.string().min(20),
        outcomeIds: z.array(z.string()).min(1),
        check: z.string().min(5),
      }),
    )
    .length(4),
  performanceTask: z.string().min(15),
});

export interface ActivitiesResult {
  sessions: number;
  authored: number;
  fallbacks: number;
  fallbackReasons: Record<string, string>;
  usd: number;
}

export function activitiesBudgetFor(sessions: number): number {
  return Math.max(0.04, sessions * 0.005);
}
const CONCURRENCY = 6;

const STOP = new Set(['the', 'a', 'an', 'of', 'is', 'are', 'to', 'and', 'or', 'in', 'on', 'for', 'with', 'that', 'this', 'it', 'as', 'be', 'by', 'their', 'its']);
function contentWords(text: string): Set<string> {
  return new Set(
    text.toLowerCase().replace(/[^a-z0-9\s一-鿿]/gu, ' ').split(/\s+/).filter((w) => w.length > 4 && !STOP.has(w)),
  );
}

/** Contract check for one authored plan against its session + kernels. The
 *  plan arrives boundary-typed (outcome ids are unvalidated strings — the
 *  check itself verifies they are real). */
export function checkActivities(
  plan: z.infer<typeof activitiesSchema>,
  sessionOutcomes: OutcomeId[],
  conceptNames: string[],
  kernels: Kernel[],
): { ok: boolean; violations: string[] } {
  const v: string[] = [];
  const totalMin = plan.phases.reduce((s, p) => s + p.minutes, 0);
  if (totalMin < 40 || totalMin > 70) v.push(`minutes: ${totalMin} not a real class period (40–70)`);

  // every outcome operationalized
  const covered = new Set(plan.phases.flatMap((p) => p.outcomeIds));
  for (const oid of sessionOutcomes) {
    if (!covered.has(oid)) v.push(`outcome ${oid} not operationalized by any phase`);
  }
  // phase outcome ids must be REAL
  for (const p of plan.phases) {
    for (const oid of p.outcomeIds) if (!sessionOutcomes.includes(oid as OutcomeId)) v.push(`phase ${p.phase} cites unknown outcome ${oid}`);
  }

  // kernel grounding: the combined script names a concept and uses kernel vocabulary
  const combined = plan.phases.map((p) => p.activity).join(' ') + ' ' + plan.performanceTask;
  const combinedLower = combined.toLowerCase();
  // inflection-tolerant: "while loops" is named by "while loop" (natural prose
  // inflects; demanding the exact graph string is a false positive)
  const namesConcept = conceptNames.some((n) => {
    const lower = n.toLowerCase();
    return combinedLower.includes(lower) || combinedLower.includes(lower.replace(/(es|s)$/, ''));
  });
  if (!namesConcept) v.push('script never names a session concept');
  if (kernels.length > 0) {
    const kernelVocab = contentWords(
      kernels.map((k) => [k.definition, k.workedExample?.setup ?? '', k.excerpt?.text ?? '', ...k.misconceptions.map((m) => m.claim)].join(' ')).join(' '),
    );
    const scriptVocab = contentWords(combined);
    let shared = 0;
    for (const w of scriptVocab) if (kernelVocab.has(w)) shared++;
    if (shared < 3) v.push(`script shares only ${shared} content words with the kernel (needs ≥3 — write WITH the material, not about it)`);
  }

  // anti-template: phases must be distinct
  const texts = plan.phases.map((p) => p.activity.trim().toLowerCase());
  if (new Set(texts).size !== texts.length) v.push('duplicate phase scripts (templated)');

  return { ok: v.length === 0, violations: v };
}

function groundingFor(course: Course, s: Session): { text: string; kernels: Kernel[]; conceptNames: string[]; outcomes: { id: OutcomeId; text: string }[] } {
  const kernels = s.conceptIds.map((id) => course.overlays.kernels[id]).filter((k): k is Kernel => !!k);
  const conceptNames = s.conceptIds.map((id) => course.graph.concepts.find((c) => c.id === id)?.name ?? '').filter(Boolean);
  const outcomes = course.graph.outcomes.filter((o) => o.sessionId === s.id).map((o) => ({ id: o.id, text: o.text }));
  const parts = [`Session ${s.index}: ${s.title}`, `Discipline: ${course.graph.discipline}`];
  for (const o of outcomes) parts.push(`Outcome ${o.id}: ${o.text}`);
  for (let i = 0; i < kernels.length; i++) {
    const k = kernels[i]!;
    parts.push(`Concept: ${conceptNames[i] ?? ''}`);
    parts.push(`Definition: ${k.definition}`);
    if (k.workedExample) parts.push(`Worked example: ${k.workedExample.setup} | steps: ${k.workedExample.steps.join('; ')} | answer: ${k.workedExample.answer}`);
    if (k.excerpt?.text) parts.push(`Primary text: "${k.excerpt.text}" (${k.excerpt.work ?? ''} ${k.excerpt.locator ?? ''})`);
    else if (k.excerpt?.locator) parts.push(`Primary text locator: ${k.excerpt.work ?? ''} — ${k.excerpt.locator}`);
    for (const m of k.misconceptions) parts.push(`Misconception: ${m.claim}`);
  }
  return { text: parts.join('\n'), kernels, conceptNames, outcomes };
}

const SYSTEM = [
  'You write the minute-by-minute activity sequence for ONE course session, USING the provided kernel material — never generic frames.',
  'Four phases: warmup, core, practice, closing. Each phase: minutes (must total 40–70), the actual teaching script (what the instructor and students DO, concretely), the outcome ids it operationalizes, and a 2-minute check for understanding.',
  'RULE — write WITH the material: the core phase walks the provided worked example or primary text step by step; the practice phase has students apply it to a NEW case you specify concretely. Quote or use the kernel content directly.',
  'RULE — every provided outcome id must appear in some phase\'s outcomeIds.',
  'RULE — end with one performanceTask: a single concrete deliverable sentence ("students submit X that does Y").',
  'Return strict JSON: { phases:[{phase,minutes,activity,outcomeIds,check}], performanceTask }.',
].join('\n');

async function authorOne(course: Course, s: Session, model: ModelPort): Promise<{ plan: ActivityPlan | null; usd: number; reason?: string }> {
  const g = groundingFor(course, s);
  if (g.kernels.length === 0) return { plan: null, usd: 0, reason: 'no kernels to ground on' };
  let usd = 0;
  let lastViolations: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    let res;
    try {
      res = await model.completeJSON({
        purpose: 'activities',
        reasoning: 'low',
        maxOutputTokens: 1200,
        system: SYSTEM,
        user:
          `Write this session's activity sequence as JSON, using the kernel material below. ` +
          (attempt > 0 ? `Your previous attempt violated the contract: ${lastViolations.join('; ')}. Fix exactly these. ` : '') +
          `\n\n${g.text}`,
        payload: { sessionId: s.id, grounding: g.text },
      });
    } catch (err) {
      return { plan: null, usd, reason: `provider: ${err instanceof Error ? err.message.slice(0, 80) : 'error'}` };
    }
    usd += res.usd;
    const parsed = activitiesSchema.safeParse(res.json);
    if (!parsed.success) {
      lastViolations = parsed.error.issues.slice(0, 4).map((i) => `${i.path.join('.')}: ${i.message}`);
      continue;
    }
    const check = checkActivities(parsed.data, g.outcomes.map((o) => o.id), g.conceptNames, g.kernels);
    if (check.ok) {
      return {
        plan: { sessionId: s.id, phases: parsed.data.phases as ActivityPlan['phases'], performanceTask: parsed.data.performanceTask, status: 'active' },
        usd,
      };
    }
    lastViolations = check.violations.slice(0, 5);
  }
  return { plan: null, usd, reason: lastViolations.join('; ').slice(0, 160) || 'schema invalid after retry' };
}

export async function activitiesStage(
  course: Course,
  model: ModelPort,
  opts: { budgetUsd?: number } = {},
): Promise<ActivitiesResult> {
  const sessions = [...course.graph.sessions].sort((a, b) => a.index - b.index);
  const budget = opts.budgetUsd ?? activitiesBudgetFor(sessions.length);
  course.overlays.activities = course.overlays.activities ?? {};
  let usd = 0;
  let authored = 0;
  let fallbacks = 0;
  const fallbackReasons: Record<string, string> = {};

  for (let i = 0; i < sessions.length; i += CONCURRENCY) {
    const wave = sessions.slice(i, i + CONCURRENCY);
    if (usd >= budget) {
      for (const s of wave) {
        fallbacks++;
        fallbackReasons[s.id] = `budget exhausted at $${usd.toFixed(4)}`;
      }
      continue;
    }
    const settled = await Promise.allSettled(wave.map((s) => authorOne(course, s, model)));
    settled.forEach((outcome, j) => {
      const s = wave[j]!;
      if (outcome.status === 'fulfilled') {
        usd += outcome.value.usd;
        if (outcome.value.plan) {
          course.overlays.activities![s.id] = outcome.value.plan;
          authored++;
          return;
        }
        fallbackReasons[s.id] = outcome.value.reason ?? 'unknown';
      } else {
        fallbackReasons[s.id] = `rejected: ${String(outcome.reason).slice(0, 80)}`;
      }
      fallbacks++;
    });
  }
  return { sessions: sessions.length, authored, fallbacks, fallbackReasons, usd };
}
