/** pipeline/build.ts — the build orchestrator. Drives the state machine from
 *  idle to ready (or blocked, named), emitting each PipelineState with the cost
 *  so far (the Spine's ticker). One vocabulary, three audiences: SSE, the
 *  Spine, the Crucible all read these states (machine.ts). Pure given its
 *  injected ports (model/clock/rand) — replay-deterministic (ADR-03/05). */
import type { Course, ProvenanceMark } from '../schema/courseObject.ts';
import type { BlockedReason, PipelineEvent, PipelineState } from '../schema/machine.ts';
import { transition, initialMachineContext, IllegalTransitionError, IDLE } from '../machine/reducer.ts';
import type { ClockPort, ModelPort, RandPort } from '../ports/index.ts';
import { ulid } from '../ports/index.ts';
import { fnv1a } from '../util.ts';
import { render } from '../render/index.ts';
import { weightScheme } from '../render/weights.ts';
import { passASchema, passBSchema } from '../author/schema.ts';
import { assembleSkeleton, mergePassB, attachKernelCandidates } from '../author/assemble.ts';
import { lintSkeleton } from '../author/lint.ts';
import { parseBrief, detectWeeks, inferDiscipline } from '../author/briefParse.ts';
import { linkStage } from '../link/index.ts';
import { retrieveStage, type RetrievalSummary } from '../link/retrieve.ts';
import { judgeStage } from '../judge/index.ts';
import { itemsStage, itemsBudgetFor } from '../author/items.ts';
import { activitiesStage, activitiesBudgetFor } from '../author/activities.ts';
import { voiceStage } from '../voice/index.ts';
import { verify, grade } from '../grade/index.ts';
import { CostLedgerBuilder, BudgetExceededError, meteredModel } from './cost.ts';
import { collectSurfaces } from '../voice/index.ts';
import { authorASystem, authorBSystem, authorAUser, authorBUser } from '../author/prompts.ts';

/** Pass B parallelism: enough to be fast, low enough to stay under provider
 *  rate limits (a 429 storm from N-at-once is its own failure mode). */
const AUTHOR_B_CONCURRENCY = 6;

export interface BuildPorts {
  model: ModelPort;
  clock: ClockPort;
  rand: RandPort;
  /** optional — when present, the link stage enriches readings and promotes
   *  corroborated kernel candidates (the flywheel's intake, V0.0.4) */
  retrieval?: import('../ports/index.ts').RetrievalPort;
}

export interface BuildOptions {
  voice?: boolean;
  /** Pass C — real assessment items (V0.0.3). Defaults to the voice setting:
   *  the paid quality passes travel together. */
  items?: boolean;
  /** genome extension shards (the flywheel: previously promoted kernels) */
  extensions?: Record<string, import('@curriculumos/knowledge').GenomeShard>;
  /** receives the retrieval summary (promotions to persist) when retrieval ran */
  onRetrieval?: (summary: RetrievalSummary) => void;
  budgetUsd?: number;
  lens?: string | null;
  /** Extracted instructor materials (V2: stored whole, hashed, forever). The
   *  intake and author stages read their text alongside the brief. */
  files?: import('../schema/courseObject.ts').BriefFile[];
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
  const itemsEnabled = opts.items ?? voiceEnabled; // the paid quality passes travel together
  const budget = opts.budgetUsd ?? Infinity;
  const ledger = new CostLedgerBuilder(budget);
  const emit = (s: PipelineState) => opts.onState?.(s, ledger.total());

  const courseId = `c_${ulid(clock, rand)}`;
  const startISO = clock.nowISO();
  const course = emptyCourse(courseId, briefText, startISO);
  if (opts.files?.length) course.brief.files = opts.files;
  /** brief + extracted materials — what intake and authoring actually read */
  const fullBrief = [briefText, ...(opts.files ?? []).map((f) => f.extractedText)].filter(Boolean).join('\n\n');
  const buildId = `b_${ulid(clock, rand)}`;
  const states: { state: string; enteredAt: string; detail?: string }[] = [];
  const record = (name: string, detail?: string) => states.push({ state: name, enteredAt: clock.nowISO(), ...(detail ? { detail } : {}) });

  // ── THE MACHINE DRIVES THE PIPELINE (Law 7: one sequencing truth). Every
  // stage change is a transition through the tested reducer; emissions are the
  // reducer's state enriched with live detail. An illegal transition is a
  // programming error and throws (dev mode) — it can never ship as a state. ──
  const ctx = initialMachineContext({ mode: 'dev', voiceEnabled });
  let machineState: PipelineState = IDLE;
  const stepTo = (event: PipelineEvent): PipelineState => {
    machineState = transition(machineState, event, ctx);
    return machineState;
  };
  const emitState = (patch?: Record<string, unknown>): void => {
    emit(patch ? ({ ...machineState, ...patch } as PipelineState) : machineState);
  };

  const finishBlocked = (reason: BlockedReason): BuildOutcome => {
    if (machineState.state !== 'blocked') stepTo({ type: 'FAILED', reason }); // legal from any state
    record('blocked', reason);
    emitState();
    course.receipts.cost = ledger.toLedger();
    course.receipts.builds.push({ buildId, startedAt: startISO, states, terminal: 'blocked', blockedReason: reason, costUsd: ledger.total() });
    return { course, terminal: 'blocked', blockedReason: reason };
  };

  try {
    // ── intake (free; deterministic parse — the honest "heard so far") ──
    stepTo({ type: 'BUILD_REQUESTED', briefHash: fnv1a(fullBrief), budgetUsd: Number.isFinite(budget) ? budget : 0 });
    const heard = parseBrief(fullBrief);
    record('intake');
    emitState({ detail: { heard: { ...(heard.weeks !== undefined ? { weeks: heard.weeks } : {}), assessments: heard.assessments, readings: heard.readings, ...(heard.discipline ? { discipline: heard.discipline } : {}) } } });
    stepTo({ type: 'INTAKE_DONE' }); // → author A

    // ── author Pass A (skeleton); the REDUCER owns the degenerate retry/block ──
    const statedWeeks = detectWeeks(fullBrief);
    let skeleton = null as ReturnType<typeof passASchema.parse> | null;
    let parseFailures = 0;
    let lastViolations: string[] = [];
    while (!skeleton) {
      clock.tick?.();
      record('author', `A attempt ${ctx.passARetries + parseFailures + 1}`);
      emitState();
      const res = await model.completeJSON({
        purpose: 'authorA',
        reasoning: 'low', // Pass A at low reasoning — the biggest cost win (trap #3)
        system: authorASystem(),
        user: authorAUser(fullBrief, ctx.passARetries + parseFailures > 0, lastViolations),
        payload: { brief: fullBrief },
      });
      ledger.add('author', res);
      const parsed = passASchema.safeParse(res.json);
      if (!parsed.success) {
        // retry once with the violated rules QUOTED (020-contracts intro)
        lastViolations = parsed.error.issues.slice(0, 5).map((i) => `${i.path.join('.')}: ${i.message}`);
        parseFailures += 1;
        if (parseFailures >= 2) return finishBlocked('contract-violation');
        continue;
      }
      const lint = lintSkeleton(parsed.data, statedWeeks);
      if (!lint.ok) {
        lastViolations = lint.reasons; // the degenerate rule, quoted, rides the retry
        const next = stepTo({ type: 'PASS_A_DEGENERATE' }); // reducer: retry once, then blocked
        if (next.state === 'blocked') return finishBlocked('degenerate-skeleton');
        continue;
      }
      skeleton = parsed.data;
    }
    stepTo({ type: 'PASS_A_DONE', skeleton: { sessions: skeleton.sessions.length, assessments: skeleton.assessments.length } }); // → author B

    if (opts.lens) {
      skeleton.discipline = opts.lens as typeof skeleton.discipline;
    } else {
      // discipline is deterministic-first: a brief-cue hit overrides the
      // model's classification; the model fills in only when cues say
      // 'general'. (v0.0.8 round 3: the model classified art history as
      // 'humanities', which locked out the arts shard AND let the lit
      // shard's "Magical realism" — García Márquez — into a painting
      // course. The cue table is tested; the model's lens is not.)
      const cued = inferDiscipline(fullBrief);
      if (cued !== 'general') skeleton.discipline = cued;
    }
    course.graph = assembleSkeleton(skeleton);

    // ── author Pass B (per-session concepts + outcomes + kernel candidates) ──
    // Calls run in bounded-concurrency WAVES (parallel — the proven shape,
    // founding §4 — without firing N requests at once and rate-limiting). A
    // single batch that fails or returns bad shape fails THAT batch, not the
    // build (contract §A5); results merge in session order (deterministic ids).
    const total = course.graph.sessions.length;
    emitState({ batch: { done: 0, total } });
    const ordered = [...course.graph.sessions].sort((a, b) => a.index - b.index);
    let done = 0;
    for (let i = 0; i < ordered.length; i += AUTHOR_B_CONCURRENCY) {
      const wave = ordered.slice(i, i + AUTHOR_B_CONCURRENCY);
      clock.tick?.();
      const settled = await Promise.allSettled(
        wave.map((s) =>
          model.completeJSON({
            purpose: 'authorB',
            reasoning: 'low',
            system: authorBSystem(),
            user: authorBUser(course.graph.courseTitle, s.index, s.title),
            payload: { sessionIndex: s.index, title: s.title, discipline: course.graph.discipline },
          }),
        ),
      );
      for (const outcome of settled) {
        if (outcome.status === 'fulfilled') {
          ledger.add('author', outcome.value);
          const parsed = passBSchema.safeParse(outcome.value.json);
          if (parsed.success) {
            mergePassB(course.graph, parsed.data);
            attachKernelCandidates(course, parsed.data); // the model proposes…
          }
        }
        // a rejected batch (provider error after retries) degrades that session
        // to its structural skeleton — loud in the receipt, never a build failure
        done++;
        stepTo({ type: 'PASS_B_BATCH_DONE', batch: done }); // self-transition (progress)
        emitState({ batch: { done, total } });
      }
    }
    record('author', 'done');

    // ── link (genome cache, $0) — …and the cache verifies: a genome hit
    //    overwrites any unverified candidate (cache-first, founding §7) ──
    clock.tick?.();
    stepTo({ type: 'AUTHOR_DONE' }); // → link
    const linkSummary = linkStage(course, opts.extensions ?? {});
    record('link', `${linkSummary.linked}/${linkSummary.total}`);
    emitState({ detail: linkSummary });
    markProvenance(course); // after link: concepts exist and genomeRefs are known

    // ── retrieval (V0.0.4, $0 model spend): enrich readings, promote kernels ──
    if (ports.retrieval) {
      const rs = await retrieveStage(course, ports.retrieval);
      record(
        'retrieval',
        `${rs.readingsEnriched} enriched, ${rs.readingsSuggested} suggested, ${rs.kernelsPromoted} promoted` +
          (rs.readingsMissed.length ? `, missed: ${rs.readingsMissed.join(',')}` : ''),
      );
      opts.onRetrieval?.(rs);
    }
    // grading-scheme provenance: name whether weights are stated or suggested (Law 6)
    course.receipts.provenance.weights = weightScheme(course).suggested
      ? ({ source: 'compiled' } as ProvenanceMark)
      : ({ source: 'instructor' } as ProvenanceMark);

    // ── judge (prerequisite gaps + cited bridges) ──
    clock.tick?.();
    stepTo({ type: 'LINK_DONE' }); // → judge
    const judgeSummary = judgeStage(course);
    record('judge', `${judgeSummary.gaps} gaps`);
    emitState({ detail: judgeSummary });

    // ── Pass C: real assessment items (paid, budgeted, contract-linted) — runs
    //    after link so items ground on the FINAL (genome-verified) kernels, and
    //    before compile so the quiz renders from them ──
    if (itemsEnabled) {
      clock.tick?.();
      const ires = await itemsStage(course, meteredModel(model, ledger, 'items'), {
        budgetUsd: Math.min(itemsBudgetFor(course.graph.sessions.length), budget),
      });
      const reasons = Object.entries(ires.fallbackReasons)
        .map(([sid, why]) => `${sid}: ${why}`)
        .join(' | ');
      record('items', `${ires.authored} authored, ${ires.fallbacks} fallback${reasons ? ` [${reasons}]` : ''}`);
      markItemProvenance(course);
    }

    // ── Pass D: content-woven activities (paid, budgeted, contract-linted) ──
    if (itemsEnabled) {
      clock.tick?.();
      const ares = await activitiesStage(course, meteredModel(model, ledger, 'activities'), {
        budgetUsd: Math.min(activitiesBudgetFor(course.graph.sessions.length), budget),
      });
      const aReasons = Object.entries(ares.fallbackReasons)
        .map(([sid, why]) => `${sid}: ${why}`)
        .join(' | ');
      record('activities', `${ares.authored} authored, ${ares.fallbacks} fallback${aReasons ? ` [${aReasons}]` : ''}`);
    }

    // ── compile (deterministic render; $0) ──
    clock.tick?.();
    stepTo({ type: 'JUDGE_DONE' }); // → compile
    record('compile');
    emitState({ detail: { artifacts: renderArtifactCount(course) } });

    // ── voice (paid, budgeted, loud fallback) — the reducer routes compile →
    //    voice or verify per ctx.voiceEnabled ──
    stepTo({ type: 'COMPILE_DONE' });
    if (voiceEnabled) {
      let vDone = 0;
      let vFallbacks = 0;
      const vTotal = collectSurfaces(course).length;
      emitState({ detail: { surfaces: { done: 0, total: vTotal }, fallbacks: 0 } });
      const vres = await voiceStage(course, meteredModel(model, ledger, 'voice'), {
        budgetUsd: Math.min(0.04, budget),
        onSurface: (sid, fallback) => {
          vDone++;
          if (fallback) vFallbacks++;
          stepTo({ type: 'VOICE_SURFACE_DONE', surfaceId: sid, fallback }); // self-transition
          emitState({ detail: { surfaces: { done: vDone, total: vTotal }, fallbacks: vFallbacks } });
        },
      });
      const vCats = Object.entries(vres.fallbackCategories)
        .map(([cat, n]) => `${cat}:${n}`)
        .join(', ');
      record('voice', `${vres.fallbacks} fallbacks${vCats ? ` [${vCats}]` : ''}`);
      markVoiceProvenance(course);
      stepTo({ type: 'VOICE_DONE' }); // → verify
    }

    // ── verify (P0 gate; the reducer routes failed>0 → blocked) ──
    clock.tick?.();
    const v = verify(course);
    record('verify', `${v.failed} failed`);
    emitState({ detail: { checked: v.checked, failed: v.failed, warnings: v.warnings } });
    const afterVerify = stepTo({ type: 'VERIFY_DONE', failed: v.failed });
    if (afterVerify.state === 'blocked') return finishBlocked('verification-blockers');

    // ── grade (the dual meter; never stale) ──
    clock.tick?.();
    const gradedAt = clock.nowISO();
    record('grade');
    emitState();
    course.receipts.quality = grade(course, gradedAt);

    // ── ready ──
    stepTo({ type: 'GRADE_DONE' });
    course.receipts.cost = ledger.toLedger();
    record('ready');
    course.receipts.builds.push({ buildId, startedAt: startISO, states, terminal: 'ready', costUsd: ledger.total() });
    emitState();
    return { course, terminal: 'ready' };
  } catch (err) {
    if (err instanceof IllegalTransitionError) throw err; // a machine bug is a programming error — never a quiet blocked
    if (err instanceof BudgetExceededError) return finishBlocked('budget-exceeded');
    // Law 6: the failure is NAMED in the build record, never a bare reason code
    record('error', err instanceof Error ? err.message.slice(0, 200) : 'unknown failure');
    return finishBlocked('provider-failure');
  }
}

/** artifact count for the compile state's detail — derived, never stored */
function renderArtifactCount(course: Course): number {
  return render(course).artifacts.length;
}

function markProvenance(course: Course): void {
  const p = course.receipts.provenance;
  for (const s of course.graph.sessions) p[s.id] = { source: 'instructor' } as ProvenanceMark;
  for (const a of course.graph.assessments) p[a.id] = { source: 'instructor' } as ProvenanceMark;
  for (const r of course.graph.readings) p[r.id] = { source: 'instructor' } as ProvenanceMark;
  for (const r of course.graph.resources) p[r.id] = { source: 'instructor' } as ProvenanceMark;
  for (const c of course.graph.concepts) {
    p[c.id] = c.genomeRef ? ({ source: 'genome', ref: c.genomeRef.conceptKey } as ProvenanceMark) : ({ source: 'compiled' } as ProvenanceMark);
    // kernel provenance: verified cache vs unverified model candidate — the
    // receipt names which is which (Law 6; nothing model-made poses as verified)
    const kernel = course.overlays.kernels[c.id];
    if (kernel) {
      p[`kernel:${c.id}`] = c.genomeRef
        ? ({ source: 'genome', ref: c.genomeRef.conceptKey } as ProvenanceMark)
        : ({ source: 'voiced', model: 'authorB', contractVersion: 0 } as ProvenanceMark);
    }
  }
}

function markVoiceProvenance(course: Course): void {
  for (const [sid, prose] of Object.entries(course.overlays.voice)) {
    if (prose.status === 'active' && prose.contractVersion > 0) {
      course.receipts.provenance[sid] = { source: 'voiced', model: 'voice', contractVersion: prose.contractVersion };
    }
  }
}

function markItemProvenance(course: Course): void {
  for (const [sid, items] of Object.entries(course.overlays.items ?? {})) {
    if (items.some((it) => it.status === 'active')) {
      course.receipts.provenance[`items:${sid}`] = { source: 'voiced', model: 'items', contractVersion: 1 };
    }
  }
}
