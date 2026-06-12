/** pipeline/build.ts — the build orchestrator. Drives the state machine from
 *  idle to ready (or blocked, named), emitting each PipelineState with the cost
 *  so far (the Spine's ticker). One vocabulary, three audiences: SSE, the
 *  Spine, the Crucible all read these states (machine.ts). Pure given its
 *  injected ports (model/clock/rand) — replay-deterministic (ADR-03/05). */
import type { Course, ProvenanceMark } from '../schema/courseObject.ts';
import type { BlockedReason, PipelineState } from '../schema/machine.ts';
import type { ClockPort, ModelPort, RandPort } from '../ports/index.ts';
import { ulid } from '../ports/index.ts';
import { passASchema, passBSchema } from '../author/schema.ts';
import { assembleSkeleton, mergePassB } from '../author/assemble.ts';
import { lintSkeleton } from '../author/lint.ts';
import { parseBrief, detectWeeks } from '../author/briefParse.ts';
import { linkStage } from '../link/index.ts';
import { judgeStage } from '../judge/index.ts';
import { voiceStage } from '../voice/index.ts';
import { verify, grade } from '../grade/index.ts';
import { CostLedgerBuilder, BudgetExceededError, meteredModel } from './cost.ts';
import { collectSurfaces } from '../voice/index.ts';
import { authorASystem, authorBSystem, authorAUser, authorBUser } from '../author/prompts.ts';

export interface BuildPorts {
  model: ModelPort;
  clock: ClockPort;
  rand: RandPort;
}

export interface BuildOptions {
  voice?: boolean;
  budgetUsd?: number;
  lens?: string | null;
  onState?: (state: PipelineState, costSoFarUsd: number) => void;
}

export interface BuildOutcome {
  course: Course;
  terminal: 'ready' | 'blocked';
  blockedReason?: BlockedReason;
}

function emptyCourse(id: string, briefText: string, atISO: string): Course {
  return {
    id,
    schemaVersion: 1,
    brief: { text: briefText, files: [], receivedAt: atISO },
    graph: {
      courseTitle: '',
      discipline: 'general',
      sessions: [],
      concepts: [],
      outcomes: [],
      assessments: [],
      readings: [],
      resources: [],
      bridges: [],
    },
    overlays: { kernels: {}, voice: {}, edits: [] },
    receipts: { provenance: {}, cost: { totalUsd: 0, entries: [] }, quality: null, builds: [] },
  };
}

export async function buildCourse(briefText: string, ports: BuildPorts, opts: BuildOptions = {}): Promise<BuildOutcome> {
  const { model, clock, rand } = ports;
  const voiceEnabled = opts.voice !== false;
  const budget = opts.budgetUsd ?? Infinity;
  const ledger = new CostLedgerBuilder(budget);
  const emit = (s: PipelineState) => opts.onState?.(s, ledger.total());

  const courseId = `c_${ulid(clock, rand)}`;
  const startISO = clock.nowISO();
  const course = emptyCourse(courseId, briefText, startISO);
  const buildId = `b_${ulid(clock, rand)}`;
  const states: { state: string; enteredAt: string; detail?: string }[] = [];
  const record = (name: string, detail?: string) => states.push({ state: name, enteredAt: clock.nowISO(), ...(detail ? { detail } : {}) });

  const finishBlocked = (reason: BlockedReason): BuildOutcome => {
    record('blocked', reason);
    emit({ state: 'blocked', reason });
    course.receipts.cost = ledger.toLedger();
    course.receipts.builds.push({ buildId, startedAt: startISO, states, terminal: 'blocked', blockedReason: reason, costUsd: ledger.total() });
    return { course, terminal: 'blocked', blockedReason: reason };
  };

  try {
    // ── intake (free; deterministic parse — the honest "heard so far") ──
    const heard = parseBrief(briefText);
    record('intake');
    emit({ state: 'intake', detail: { heard: { ...(heard.weeks !== undefined ? { weeks: heard.weeks } : {}), assessments: heard.assessments, readings: heard.readings, ...(heard.discipline ? { discipline: heard.discipline } : {}) } } });

    // ── author Pass A (skeleton) with degenerate retry ──
    const statedWeeks = detectWeeks(briefText);
    let skeleton = null as ReturnType<typeof passASchema.parse> | null;
    for (let attempt = 0; attempt < 2 && !skeleton; attempt++) {
      clock.tick?.();
      record('author', `A attempt ${attempt + 1}`);
      emit({ state: 'author', pass: 'A' });
      const res = await model.completeJSON({
        purpose: 'authorA',
        reasoning: 'low', // Pass A at low reasoning — the biggest cost win (trap #3)
        system: authorASystem(),
        user: authorAUser(briefText, attempt > 0),
        payload: { brief: briefText },
      });
      ledger.add('author', res);
      const parsed = passASchema.safeParse(res.json);
      if (!parsed.success) {
        if (attempt === 1) return finishBlocked('contract-violation');
        continue;
      }
      const lint = lintSkeleton(parsed.data, statedWeeks);
      if (!lint.ok) {
        if (attempt === 1) return finishBlocked('degenerate-skeleton');
        continue; // retry once with the expansion reminder
      }
      skeleton = parsed.data;
    }
    if (!skeleton) return finishBlocked('degenerate-skeleton');

    if (opts.lens) skeleton.discipline = opts.lens as typeof skeleton.discipline;
    course.graph = assembleSkeleton(skeleton);
    markProvenance(course);

    // ── author Pass B (per-session concepts + outcomes), batched ──
    const total = course.graph.sessions.length;
    emit({ state: 'author', pass: 'B', batch: { done: 0, total } });
    const ordered = [...course.graph.sessions].sort((a, b) => a.index - b.index);
    let done = 0;
    for (const s of ordered) {
      clock.tick?.();
      const res = await model.completeJSON({
        purpose: 'authorB',
        reasoning: 'low',
        system: authorBSystem(),
        user: authorBUser(course.graph.courseTitle, s.index, s.title),
        payload: { sessionIndex: s.index, title: s.title },
      });
      ledger.add('author', res);
      const parsed = passBSchema.safeParse(res.json);
      if (parsed.success) mergePassB(course.graph, parsed.data);
      done++;
      emit({ state: 'author', pass: 'B', batch: { done, total } });
    }
    record('author', 'done');

    // ── link (genome cache, $0) ──
    clock.tick?.();
    const linkSummary = linkStage(course);
    record('link', `${linkSummary.linked}/${linkSummary.total}`);
    emit({ state: 'link', detail: linkSummary });

    // ── judge (prerequisite gaps + cited bridges) ──
    clock.tick?.();
    const judgeSummary = judgeStage(course);
    record('judge', `${judgeSummary.gaps} gaps`);
    emit({ state: 'judge', detail: judgeSummary });

    // ── compile (deterministic render; $0) ──
    clock.tick?.();
    record('compile');
    emit({ state: 'compile', detail: { artifacts: 0 } });

    // ── voice (paid, budgeted, loud fallback) ──
    if (voiceEnabled) {
      let vDone = 0;
      let vFallbacks = 0;
      const vTotal = collectSurfaces(course).length;
      emit({ state: 'voice', detail: { surfaces: { done: 0, total: vTotal }, fallbacks: 0 } });
      const vres = await voiceStage(course, meteredModel(model, ledger, 'voice'), {
        budgetUsd: Math.min(0.04, budget),
        onSurface: (_sid, fallback) => {
          vDone++;
          if (fallback) vFallbacks++;
          emit({ state: 'voice', detail: { surfaces: { done: vDone, total: vTotal }, fallbacks: vFallbacks } });
        },
      });
      record('voice', `${vres.fallbacks} fallbacks`);
      markVoiceProvenance(course);
    }

    // ── verify (P0 gate) ──
    clock.tick?.();
    const v = verify(course);
    record('verify', `${v.failed} failed`);
    emit({ state: 'verify', detail: { checked: v.checked, failed: v.failed, warnings: v.warnings } });
    if (v.failed > 0) return finishBlocked('verification-blockers');

    // ── grade (the dual meter; never stale) ──
    clock.tick?.();
    const gradedAt = clock.nowISO();
    record('grade');
    emit({ state: 'grade' });
    course.receipts.quality = grade(course, gradedAt);

    // ── ready ──
    course.receipts.cost = ledger.toLedger();
    record('ready');
    course.receipts.builds.push({ buildId, startedAt: startISO, states, terminal: 'ready', costUsd: ledger.total() });
    emit({ state: 'ready' });
    return { course, terminal: 'ready' };
  } catch (err) {
    if (err instanceof BudgetExceededError) return finishBlocked('budget-exceeded');
    return finishBlocked('provider-failure');
  }
}

function markProvenance(course: Course): void {
  const p = course.receipts.provenance;
  for (const s of course.graph.sessions) p[s.id] = { source: 'instructor' } as ProvenanceMark;
  for (const a of course.graph.assessments) p[a.id] = { source: 'instructor' } as ProvenanceMark;
  for (const r of course.graph.readings) p[r.id] = { source: 'instructor' } as ProvenanceMark;
  for (const r of course.graph.resources) p[r.id] = { source: 'instructor' } as ProvenanceMark;
  for (const c of course.graph.concepts) {
    p[c.id] = c.genomeRef ? ({ source: 'genome', ref: c.genomeRef.conceptKey } as ProvenanceMark) : ({ source: 'compiled' } as ProvenanceMark);
  }
}

function markVoiceProvenance(course: Course): void {
  for (const [sid, prose] of Object.entries(course.overlays.voice)) {
    if (prose.status === 'active' && prose.contractVersion > 0) {
      course.receipts.provenance[sid] = { source: 'voiced', model: 'voice', contractVersion: prose.contractVersion };
    }
  }
}
