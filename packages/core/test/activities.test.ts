/** activities.test.ts — v0.0.6 bar: Pass D content-woven activities. */
import { describe, expect, it } from 'vitest';
import { buildCourse, render, checkActivities, FakeModelPort, FixedClock, SeededRand } from '../src/index.ts';
import type { Kernel, OutcomeId } from '../src/index.ts';
import { CS_BRIEF } from './fixtures.ts';

function ports() {
  return { model: new FakeModelPort(), clock: new FixedClock(), rand: new SeededRand() };
}

const kernel: Kernel = {
  conceptId: 'C1',
  definition: 'A while loop repeats its body as long as a condition holds, checking only between iterations.',
  misconceptions: [{ claim: 'The condition is re-checked continuously.', correction: 'Only between iterations.' }],
  workedExample: { setup: 'count down from 3 with a while loop', steps: ['init', 'test', 'decrement'], answer: '3 2 1' },
  citations: [],
  basedOn: { outcomeHash: 'x', titleHash: 'y' },
};

describe('Pass D contracts', () => {
  const good = {
    phases: [
      { phase: 'warmup' as const, minutes: 8, activity: 'Students predict what the while loop prints before running the countdown from 3.', outcomeIds: ['O1.1'], check: 'Two predictions stated aloud.' },
      { phase: 'core' as const, minutes: 18, activity: 'Walk the countdown worked example step by step: init, test the condition, decrement — students supply each move of the while loop.', outcomeIds: ['O1.1'], check: 'A student restates when the condition is checked.' },
      { phase: 'practice' as const, minutes: 16, activity: 'Pairs rewrite the countdown while loop to count up instead, keeping the condition-checking structure between iterations.', outcomeIds: ['O1.2'], check: 'Each pair runs their loop against the provided test.' },
      { phase: 'closing' as const, minutes: 8, activity: 'Exit ticket: when does a while loop test its condition, and what breaks if the body never decrements?', outcomeIds: ['O1.2'], check: 'Tickets collected and tallied.' },
    ],
    performanceTask: 'Students submit a working while-loop program that counts down from any given n, with one sentence on when its condition is tested.',
  };
  const outcomes = ['O1.1', 'O1.2'] as OutcomeId[];

  it('accepts a kernel-grounded plan covering every outcome', () => {
    const r = checkActivities(good, outcomes, ['while loops'], [kernel]);
    expect(r.ok, r.violations.join('; ')).toBe(true);
  });

  it('rejects a plan that orphans an outcome', () => {
    const bad = { ...good, phases: good.phases.map((p) => ({ ...p, outcomeIds: ['O1.1'] })) };
    const r = checkActivities(bad, outcomes, ['while loops'], [kernel]);
    expect(r.ok).toBe(false);
    expect(r.violations.some((v) => v.includes('O1.2'))).toBe(true);
  });

  it('rejects a plan with no kernel vocabulary (generic frames)', () => {
    const generic = {
      phases: good.phases.map((p, i) => ({
        ...p,
        activity: `Students engage in meaningful learning activity number ${i + 1} together in groups today.`,
      })),
      performanceTask: 'Students submit something meaningful they produced during group engagement period.',
    };
    const r = checkActivities(generic, outcomes, ['while loops'], [kernel]);
    expect(r.ok).toBe(false);
  });

  it('rejects unreal class periods', () => {
    const tooShort = { ...good, phases: good.phases.map((p) => ({ ...p, minutes: 5 })) };
    expect(checkActivities(tooShort, outcomes, ['while loops'], [kernel]).ok).toBe(false);
  });
});

describe('Pass D end-to-end (fake authors activities)', () => {
  it('authored activities render in the lesson plan with checks + a performance task', async () => {
    const out = await buildCourse(CS_BRIEF, ports(), { voice: false, items: true });
    expect(out.terminal).toBe('ready');
    const withActivities = Object.keys(out.course.overlays.activities ?? {}).length;
    expect(withActivities).toBeGreaterThan(0);
    const rc = render(out.course);
    const plan = rc.artifacts.find((a) => a.kind === 'lessonPlans' && out.course.overlays.activities?.[a.scope as never]);
    expect(plan).toBeTruthy();
    const arc = plan!.blocks.find((b) => b.kind === 'arc')!;
    expect(arc.rows![0]).toContain('Check'); // the authored arc carries checks
    expect(plan!.blocks.some((b) => b.kind === 'performance-task')).toBe(true);
  });

  it('the items fallback report names reasons (R1 instrumentation)', async () => {
    const out = await buildCourse(CS_BRIEF, ports(), { voice: false, items: true });
    const itemsRecord = out.course.receipts.builds.at(-1)!.states.find((s) => s.state === 'items');
    expect(itemsRecord).toBeTruthy();
    // the fake authors everything, so 0 fallbacks — and the record proves it
    expect(itemsRecord!.detail).toMatch(/\d+ authored, \d+ fallback/);
  });
});
