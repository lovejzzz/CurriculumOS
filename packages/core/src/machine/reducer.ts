/**
 * machine/reducer.ts — the pipeline state machine (Law 7, ADR-04).
 * Hand-rolled typed reducer; the exhaustive state×event test is the safety.
 * Illegal transitions throw in dev, log loudly + no-op in production.
 */
import type { BlockedReason, PipelineEvent, PipelineState } from '../schema/machine.ts';

export class IllegalTransitionError extends Error {
  constructor(
    public from: string,
    public event: string,
  ) {
    super(`illegal transition: ${from} --${event}-->`);
    this.name = 'IllegalTransitionError';
  }
}

export interface MachineContext {
  /** Pass A retry counter — PASS_A_DEGENERATE retries once, then blocks. */
  passARetries: number;
  mode: 'dev' | 'production';
  voiceEnabled: boolean;
  onIllegal?: (err: IllegalTransitionError) => void; // production loud-log hook
}

export function initialMachineContext(opts?: Partial<MachineContext>): MachineContext {
  return { passARetries: 0, mode: 'dev', voiceEnabled: true, ...opts };
}

export const IDLE: PipelineState = { state: 'idle' };

function blocked(reason: BlockedReason): PipelineState {
  return { state: 'blocked', reason };
}

/**
 * The transition table from 010-schema/machine.ts, as code. Any (state, event)
 * pair not listed is illegal.
 */
export function transition(
  current: PipelineState,
  event: PipelineEvent,
  ctx: MachineContext,
): PipelineState {
  // any --FAILED(reason)--> blocked(reason)
  if (event.type === 'FAILED') return blocked(event.reason);

  switch (current.state) {
    case 'idle':
      if (event.type === 'BUILD_REQUESTED')
        return { state: 'intake', detail: { heard: { assessments: [], readings: [] } } };
      break;
    case 'intake':
      if (event.type === 'INTAKE_DONE') return { state: 'author', pass: 'A' };
      break;
    case 'author':
      if (current.pass === 'A') {
        if (event.type === 'PASS_A_DONE') return { state: 'author', pass: 'B' };
        if (event.type === 'PASS_A_DEGENERATE') {
          if (ctx.passARetries < 1) {
            ctx.passARetries += 1;
            return { state: 'author', pass: 'A' };
          }
          return blocked('degenerate-skeleton');
        }
      } else {
        if (event.type === 'PASS_B_BATCH_DONE') return current; // progress detail updates ride emit, not state shape
        if (event.type === 'AUTHOR_DONE') return { state: 'link', detail: { linked: 0, missed: 0, total: 0 } };
      }
      break;
    case 'link':
      if (event.type === 'LINK_DONE') return { state: 'judge', detail: { gaps: 0, bridges: 0 } };
      break;
    case 'judge':
      if (event.type === 'JUDGE_DONE') return { state: 'compile', detail: { artifacts: 0 } };
      break;
    case 'compile':
      if (event.type === 'COMPILE_DONE') {
        return ctx.voiceEnabled
          ? { state: 'voice', detail: { surfaces: { done: 0, total: 0 }, fallbacks: 0 } }
          : { state: 'verify', detail: { checked: 0, failed: 0, warnings: 0 } };
      }
      break;
    case 'voice':
      if (event.type === 'VOICE_SURFACE_DONE') return current; // fallbacks counted, never blocking
      if (event.type === 'VOICE_DONE') return { state: 'verify', detail: { checked: 0, failed: 0, warnings: 0 } };
      break;
    case 'verify':
      if (event.type === 'VERIFY_DONE') {
        return event.failed > 0 ? blocked('verification-blockers') : { state: 'grade' };
      }
      break;
    case 'grade':
      if (event.type === 'GRADE_DONE') return { state: 'ready' };
      break;
    case 'ready':
      if (event.type === 'EDIT_REQUESTED') return { state: 'syncing', detail: { ops: event.ops } };
      break;
    case 'syncing':
      if (event.type === 'EDIT_APPLIED') return { state: 'ready' };
      break;
    case 'blocked':
      // rebuild is always available
      if (event.type === 'BUILD_REQUESTED')
        return { state: 'intake', detail: { heard: { assessments: [], readings: [] } } };
      break;
  }

  const err = new IllegalTransitionError(current.state, event.type);
  if (ctx.mode === 'dev') throw err;
  ctx.onIllegal?.(err); // loud log, no-op (production)
  return current;
}
