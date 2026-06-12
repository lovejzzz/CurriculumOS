/**
 * 010-schema/machine.ts — the pipeline state machine, normative.
 *
 * One vocabulary, three audiences: the SSE stream emits these states, the
 * web client's Spine renders them, the Crucible asserts them. No surface
 * anywhere re-derives phase from booleans (Law 7 — the scar is three
 * consecutive CourseMapper releases shipping status bugs, ending with green
 * "Compile" checks during map streaming).
 *
 * Implementation note (ADR-04): hand-rolled typed reducer, not a framework.
 * The machine is small enough that a library buys ceremony, not safety; the
 * exhaustive transition test (every state × every event) is the safety.
 */

export type PipelineState =
  | { state: 'idle' }
  | { state: 'intake'; detail: IntakeDetail } // parsing brief/files; "heard so far" chips
  | { state: 'author'; pass: 'A' | 'B'; batch?: { done: number; total: number } }
  | { state: 'link'; detail: { linked: number; missed: number; total: number } }
  | { state: 'judge'; detail: { gaps: number; bridges: number } }
  | { state: 'compile'; detail: { artifacts: number } }
  | { state: 'voice'; detail: { surfaces: { done: number; total: number }; fallbacks: number } }
  | { state: 'verify'; detail: { checked: number; failed: number; warnings: number } }
  | { state: 'grade' }
  | { state: 'ready' }
  | { state: 'syncing'; detail: { ops: number } } // PATCH in flight — the desk's glow state
  | { state: 'blocked'; reason: BlockedReason }; // ALWAYS named (Law 6)

export interface IntakeDetail {
  heard: {
    weeks?: number;
    assessments: string[]; // titles as heard, verbatim
    readings: string[];
    discipline?: string;
  };
}

/** Closed enum. Adding a reason is a schema change, reviewed as one —
 *  generic "something went wrong" is unrepresentable. */
export type BlockedReason =
  | 'degenerate-skeleton' // author produced fewer assessments than sessions; retried once already
  | 'provider-failure' // model API failed after retries
  | 'budget-exceeded' // hard cap hit mid-build (Law 9); partial receipts preserved
  | 'contract-violation' // authored output failed lint after retry
  | 'verification-blockers'; // P0s the finalizer could not repair

export type PipelineEvent =
  | { type: 'BUILD_REQUESTED'; briefHash: string; budgetUsd: number }
  | { type: 'INTAKE_DONE' }
  | { type: 'PASS_A_DONE'; skeleton: { sessions: number; assessments: number } }
  | { type: 'PASS_A_DEGENERATE' } // → retry once with expansion reminder, then blocked
  | { type: 'PASS_B_BATCH_DONE'; batch: number }
  | { type: 'AUTHOR_DONE' }
  | { type: 'LINK_DONE' }
  | { type: 'JUDGE_DONE' }
  | { type: 'COMPILE_DONE' }
  | { type: 'VOICE_SURFACE_DONE'; surfaceId: string; fallback: boolean }
  | { type: 'VOICE_DONE' }
  | { type: 'VERIFY_DONE'; failed: number }
  | { type: 'GRADE_DONE' }
  | { type: 'EDIT_REQUESTED'; ops: number } // ready → syncing
  | { type: 'EDIT_APPLIED' } // syncing → ready (grade already fresh)
  | { type: 'FAILED'; reason: BlockedReason };

/**
 * Transition table (normative; the exhaustive test enumerates this):
 *
 *   idle      --BUILD_REQUESTED-->            intake
 *   intake    --INTAKE_DONE-->                author(A)
 *   author(A) --PASS_A_DONE-->                author(B)
 *   author(A) --PASS_A_DEGENERATE-->          author(A, retry=1) | blocked(degenerate-skeleton)
 *   author(B) --AUTHOR_DONE-->                link
 *   link      --LINK_DONE-->                  judge
 *   judge     --JUDGE_DONE-->                 compile
 *   compile   --COMPILE_DONE-->               voice        (or verify when voice disabled)
 *   voice     --VOICE_DONE-->                 verify       (fallbacks counted, never blocking)
 *   verify    --VERIFY_DONE(failed=0)-->      grade
 *   verify    --VERIFY_DONE(failed>0)-->      blocked(verification-blockers)
 *   grade     --GRADE_DONE-->                 ready
 *   ready     --EDIT_REQUESTED-->             syncing
 *   syncing   --EDIT_APPLIED-->               ready
 *   any       --FAILED(reason)-->             blocked(reason)
 *   blocked   --BUILD_REQUESTED-->            intake       (rebuild is always available)
 *
 * Illegal transitions throw in dev, log loudly + no-op in production.
 */

/** SSE frame shape — the API streams exactly the machine, nothing else. */
export interface PipelineSSEFrame {
  event: 'state';
  data: {
    buildId: string;
    state: PipelineState;
    costSoFarUsd: number; // the Spine's ticker (Law 9)
    at: string;
  };
}
