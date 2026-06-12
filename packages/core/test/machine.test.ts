import { describe, expect, it } from 'vitest';
import { transition, initialMachineContext, IllegalTransitionError, IDLE } from '../src/index.ts';
import type { PipelineEvent, PipelineState } from '../src/index.ts';

const ALL_STATES: PipelineState[] = [
  { state: 'idle' },
  { state: 'intake', detail: { heard: { assessments: [], readings: [] } } },
  { state: 'author', pass: 'A' },
  { state: 'author', pass: 'B' },
  { state: 'link', detail: { linked: 0, missed: 0, total: 0 } },
  { state: 'judge', detail: { gaps: 0, bridges: 0 } },
  { state: 'compile', detail: { artifacts: 0 } },
  { state: 'voice', detail: { surfaces: { done: 0, total: 0 }, fallbacks: 0 } },
  { state: 'verify', detail: { checked: 0, failed: 0, warnings: 0 } },
  { state: 'grade' },
  { state: 'ready' },
  { state: 'syncing', detail: { ops: 1 } },
  { state: 'blocked', reason: 'provider-failure' },
];

const ALL_EVENTS: PipelineEvent[] = [
  { type: 'BUILD_REQUESTED', briefHash: 'h', budgetUsd: 1 },
  { type: 'INTAKE_DONE' },
  { type: 'PASS_A_DONE', skeleton: { sessions: 14, assessments: 16 } },
  { type: 'PASS_A_DEGENERATE' },
  { type: 'PASS_B_BATCH_DONE', batch: 1 },
  { type: 'AUTHOR_DONE' },
  { type: 'LINK_DONE' },
  { type: 'JUDGE_DONE' },
  { type: 'COMPILE_DONE' },
  { type: 'VOICE_SURFACE_DONE', surfaceId: 's', fallback: false },
  { type: 'VOICE_DONE' },
  { type: 'VERIFY_DONE', failed: 0 },
  { type: 'GRADE_DONE' },
  { type: 'EDIT_REQUESTED', ops: 1 },
  { type: 'EDIT_APPLIED' },
  { type: 'FAILED', reason: 'provider-failure' },
];

// The legal transition table from machine.ts, enumerated.
const LEGAL = new Set<string>([
  'idle|BUILD_REQUESTED',
  'intake|INTAKE_DONE',
  'author:A|PASS_A_DONE',
  'author:A|PASS_A_DEGENERATE',
  'author:B|PASS_B_BATCH_DONE',
  'author:B|AUTHOR_DONE',
  'link|LINK_DONE',
  'judge|JUDGE_DONE',
  'compile|COMPILE_DONE',
  'voice|VOICE_SURFACE_DONE',
  'voice|VOICE_DONE',
  'verify|VERIFY_DONE',
  'grade|GRADE_DONE',
  'ready|EDIT_REQUESTED',
  'syncing|EDIT_APPLIED',
  'blocked|BUILD_REQUESTED',
]);

function key(s: PipelineState, e: PipelineEvent): string {
  const sk = s.state === 'author' ? `author:${(s as { pass: string }).pass}` : s.state;
  return `${sk}|${e.type}`;
}

describe('core/machine (M0 bar 2) — exhaustive state×event', () => {
  it('every legal (state,event) transitions; every illegal throws in dev', () => {
    for (const s of ALL_STATES) {
      for (const e of ALL_EVENTS) {
        const ctx = initialMachineContext({ mode: 'dev' });
        const k = key(s, e);
        const isFailed = e.type === 'FAILED';
        if (LEGAL.has(k) || isFailed) {
          const next = transition(s, e, ctx);
          expect(next).toBeTruthy();
          if (isFailed) expect(next.state).toBe('blocked');
        } else {
          expect(() => transition(s, e, ctx)).toThrow(IllegalTransitionError);
        }
      }
    }
  });

  it('PASS_A_DEGENERATE retries once then blocks', () => {
    const ctx = initialMachineContext({ mode: 'dev' });
    const a: PipelineState = { state: 'author', pass: 'A' };
    const retry = transition(a, { type: 'PASS_A_DEGENERATE' }, ctx);
    expect(retry).toEqual({ state: 'author', pass: 'A' });
    const blocked = transition(a, { type: 'PASS_A_DEGENERATE' }, ctx);
    expect(blocked).toEqual({ state: 'blocked', reason: 'degenerate-skeleton' });
  });

  it('compile routes to verify when voice disabled', () => {
    const ctx = initialMachineContext({ mode: 'dev', voiceEnabled: false });
    const next = transition({ state: 'compile', detail: { artifacts: 1 } }, { type: 'COMPILE_DONE' }, ctx);
    expect(next.state).toBe('verify');
  });

  it('verify with failures blocks (verification-blockers)', () => {
    const ctx = initialMachineContext({ mode: 'dev' });
    const next = transition({ state: 'verify', detail: { checked: 1, failed: 1, warnings: 0 } }, { type: 'VERIFY_DONE', failed: 1 }, ctx);
    expect(next).toEqual({ state: 'blocked', reason: 'verification-blockers' });
  });

  it('illegal transition no-ops loudly in production', () => {
    let logged = false;
    const ctx = initialMachineContext({ mode: 'production', onIllegal: () => (logged = true) });
    const next = transition({ state: 'ready' }, { type: 'INTAKE_DONE' }, ctx);
    expect(next).toEqual({ state: 'ready' });
    expect(logged).toBe(true);
  });
});
