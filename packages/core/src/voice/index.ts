/** voice/index.ts — the voice stage (Law 4: voice is paid; both verified).
 *  Parallel, low-reasoning, budgeted. Rewrites high-read surfaces only; ids
 *  and verbatim titles are frozen (W1); zero new facts (W2); loud fallback to
 *  the compiled skeleton on any violation (W4); hard per-build cap (W5). */
import type { Course, SurfaceId, VoiceProse } from '../schema/courseObject.ts';
import type { ModelPort } from '../ports/index.ts';
import { render } from '../render/index.ts';
import type { RenderBlock } from '../render/types.ts';
import { fnv1a } from '../util.ts';
import { checkVoice } from './contracts.ts';

export const VOICE_CONTRACT_VERSION = 1;
export const VOICE_BUDGET_USD = 0.04; // W5 target

export interface VoiceSurfaceTask {
  surfaceId: SurfaceId;
  compiled: string;
  frozen: string[];
  /** W2 grounding: compiled text PLUS the surface's session context (kernel
   *  definitions, concept names, reading/assessment titles) so voice can use
   *  domain facts that belong to the session without tripping no-new-facts. */
  grounding: string;
}

/** Parse the SessionId out of a SurfaceId ("brief:S5:context" → "S5"). */
function sessionOfSurface(surfaceId: SurfaceId): string | null {
  const m = surfaceId.match(/:(S\d+):/);
  return m ? m[1]! : null;
}

/** Build the grounding text for a session: its kernels, concept names,
 *  reading + assessment titles. course-level surfaces ground on the whole graph. */
function sessionGrounding(course: Course, sessionId: string | null): string {
  const g = course.graph;
  const parts: string[] = [g.courseTitle, g.discipline];
  if (sessionId) {
    const s = g.sessions.find((x) => x.id === sessionId);
    if (s) {
      parts.push(s.title);
      for (const cid of s.conceptIds) {
        const c = g.concepts.find((x) => x.id === cid);
        if (c) parts.push(c.name);
        const k = course.overlays.kernels[cid as never];
        if (k) {
          parts.push(k.definition);
          for (const m of k.misconceptions) parts.push(m.claim, m.correction);
          if (k.workedExample) parts.push(k.workedExample.setup, k.workedExample.answer, ...k.workedExample.steps);
        }
      }
      for (const o of g.outcomes.filter((x) => x.sessionId === sessionId)) parts.push(o.text);
      for (const r of g.readings.filter((x) => x.sessionIds.includes(sessionId as never))) parts.push(r.title, r.author ?? '');
      for (const a of g.assessments.filter((x) => x.sessionId === sessionId || x.dueSessionId === sessionId)) parts.push(a.title);
    }
  } else {
    // course-level surface: ground on titles across the graph
    parts.push(...g.concepts.map((c) => c.name), ...g.readings.map((r) => r.title), ...g.assessments.map((a) => a.title));
  }
  return parts.filter(Boolean).join(' \n ');
}

/** Collect every voice surface with its compiled text and frozen substrings. */
export function collectSurfaces(course: Course): VoiceSurfaceTask[] {
  const rc = render(course);
  const tasks: VoiceSurfaceTask[] = [];
  const ids = new Set([
    ...course.graph.assessments.map((a) => a.id),
    ...course.graph.readings.map((r) => r.id),
    ...course.graph.concepts.map((c) => c.id),
  ]);
  const titles = [
    course.graph.courseTitle,
    ...course.graph.assessments.map((a) => a.title),
    ...course.graph.readings.map((r) => r.title),
  ];

  const walk = (block: RenderBlock) => {
    if (block.surfaceId && block.text) {
      // frozen: any id or verbatim title that appears in the compiled text (W1)
      const frozen = [...ids, ...titles].filter((s) => s && block.text!.includes(s));
      // requirement lines are frozen whole (discussions §W1)
      if (block.kind === 'framing') {
        const reqBlock = findSibling(block);
        if (reqBlock) frozen.push(reqBlock);
      }
      const sid = sessionOfSurface(block.surfaceId);
      const grounding = `${block.text}\n${sessionGrounding(course, sid)}`;
      tasks.push({ surfaceId: block.surfaceId, compiled: block.text, frozen, grounding });
    }
    block.children?.forEach(walk);
  };
  for (const art of rc.artifacts) art.blocks.forEach(walk);
  return tasks;

  function findSibling(_b: RenderBlock): string | null {
    return null; // requirement lines live in a separate block; W1 covers them via the requirement block itself
  }
}

export interface VoiceResult {
  done: number;
  total: number;
  fallbacks: number;
  usd: number;
}

/** Voice one surface: attempt + ONE retry that QUOTES the violated rules
 *  (020-contracts: "violations retry once with the violated rule quoted").
 *  Returns null prose on second failure — the caller falls back loudly. */
async function voiceOne(task: VoiceSurfaceTask, model: ModelPort): Promise<{ prose: VoiceProse | null; usd: number }> {
  let usd = 0;
  let lastViolations: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await model.completeJSON({
      purpose: 'voice',
      reasoning: 'low',
      maxOutputTokens: 360, // a 140-word surface needs ~200 tokens; cap the spend (W5)
      system: VOICE_SYSTEM,
      user:
        `Rewrite this surface as warm, specific prose. Return JSON {"text": "..."}. ` +
        `Use ONLY facts, names, and numbers that appear in the grounding below — introduce nothing new. ` +
        (attempt > 0
          ? `Your previous attempt violated the voice contract. The violated rules, quoted: ${lastViolations.join('; ')}. Fix exactly these and change nothing else about your approach. `
          : '') +
        `Frozen (keep verbatim): ${task.frozen.join(' | ') || 'none'}.`,
      payload: { surfaceId: task.surfaceId, compiled: task.compiled, grounding: task.grounding },
    });
    usd += res.usd;
    const text = extractText(res.json) ?? task.compiled;
    const check = checkVoice({ voiced: text, compiled: task.compiled, frozen: task.frozen, grounding: task.grounding });
    if (check.ok) {
      return {
        prose: {
          surfaceId: task.surfaceId,
          text,
          contractVersion: VOICE_CONTRACT_VERSION,
          basedOnHash: fnv1a(task.compiled),
          status: 'active',
        },
        usd,
      };
    }
    lastViolations = check.violations;
  }
  return { prose: null, usd };
}

/** Concurrent surfaces per wave — parallel, low-reasoning, budgeted (founding §4). */
const VOICE_CONCURRENCY = 8;

/** Run the voice pass. Surfaces are voiced in parallel waves; results apply in
 *  task order (deterministic). The budget is checked between waves (W5): when
 *  it runs out, the rest fall back to compiled skeletons — counted, never
 *  silent. One surface's failure never touches its siblings. */
export async function voiceStage(
  course: Course,
  model: ModelPort,
  opts: { budgetUsd?: number; onSurface?: (surfaceId: string, fallback: boolean) => void } = {},
): Promise<VoiceResult> {
  const tasks = collectSurfaces(course);
  const budget = opts.budgetUsd ?? VOICE_BUDGET_USD;
  let usd = 0;
  let done = 0;
  let fallbacks = 0;

  const applyFallback = (task: VoiceSurfaceTask) => {
    course.overlays.voice[task.surfaceId] = fallback(task);
    fallbacks++;
    done++;
    opts.onSurface?.(task.surfaceId, true);
  };

  for (let i = 0; i < tasks.length; i += VOICE_CONCURRENCY) {
    const wave = tasks.slice(i, i + VOICE_CONCURRENCY);
    if (usd >= budget) {
      wave.forEach(applyFallback); // W5: exhausted — voice what we could, say so
      continue;
    }
    const settled = await Promise.allSettled(wave.map((task) => voiceOne(task, model)));
    settled.forEach((outcome, j) => {
      const task = wave[j]!;
      if (outcome.status === 'fulfilled') {
        usd += outcome.value.usd;
        if (outcome.value.prose) {
          course.overlays.voice[task.surfaceId] = outcome.value.prose;
          done++;
          opts.onSurface?.(task.surfaceId, false);
        } else {
          applyFallback(task);
        }
      } else {
        // provider/budget error on this surface — its siblings are unaffected
        applyFallback(task);
      }
    });
  }

  return { done, total: tasks.length, fallbacks, usd };
}

/** Refresh a single surface (the voice.refresh / voice invalidation path). */
export async function voiceRefreshSurface(
  course: Course,
  surfaceId: SurfaceId,
  model: ModelPort,
): Promise<{ usd: number; fallback: boolean }> {
  const task = collectSurfaces(course).find((t) => t.surfaceId === surfaceId);
  if (!task) return { usd: 0, fallback: false };
  const res = await model.completeJSON({
    purpose: 'voice',
    reasoning: 'low',
    system: VOICE_SYSTEM,
    user: `Rewrite this surface. Return JSON {"text": "..."}. Frozen: ${task.frozen.join(' | ') || 'none'}.`,
    payload: { surfaceId: task.surfaceId, compiled: task.compiled },
  });
  const text = extractText(res.json) ?? task.compiled;
  const check = checkVoice({ voiced: text, compiled: task.compiled, frozen: task.frozen, grounding: task.grounding });
  if (check.ok) {
    course.overlays.voice[surfaceId] = {
      surfaceId,
      text,
      contractVersion: VOICE_CONTRACT_VERSION,
      basedOnHash: fnv1a(task.compiled),
      status: 'active',
    };
    return { usd: res.usd, fallback: false };
  }
  course.overlays.voice[surfaceId] = fallback(task);
  return { usd: res.usd, fallback: true };
}

function fallback(task: VoiceSurfaceTask): VoiceProse {
  return {
    surfaceId: task.surfaceId,
    text: task.compiled,
    contractVersion: VOICE_CONTRACT_VERSION,
    basedOnHash: fnv1a(task.compiled),
    status: 'fallback',
  };
}

function extractText(json: unknown): string | null {
  if (json && typeof json === 'object' && 'text' in json && typeof (json as { text: unknown }).text === 'string') {
    return (json as { text: string }).text;
  }
  return null;
}

const VOICE_SYSTEM =
  'You are a voice editor for course materials. You rewrite one short surface into warm, specific, ' +
  'professor-quality prose. You NEVER add facts, names, numbers, or citations not already present. ' +
  'You keep every id (S5, A7.2, R8.1), every verbatim title, and every requirement line exactly as given. ' +
  'Sentence case, 60–140 words, no headings. Return strict JSON: {"text": "..."}.';
