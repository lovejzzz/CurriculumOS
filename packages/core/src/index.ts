/** @curriculumos/core — the pure engine: schema, machine, edits, render,
 *  link/judge, voice, grade, the build/patch pipeline. No DOM, no fetch, no
 *  storage, no Date.now/Math.random — effects are ports (ADR-03). One brain,
 *  three homes (browser, server, CI), zero drift. */

// schema (010-schema, normative)
export * from './schema/courseObject.ts';
export type {
  EditOp,
  EditEvent,
  EditResult,
  ArtifactDiff,
} from './schema/editOps.ts';
export type {
  PipelineState,
  PipelineEvent,
  PipelineSSEFrame,
  BlockedReason,
  IntakeDetail,
} from './schema/machine.ts';
export { validateCourse, courseSchema, graphSchema, CourseValidationError } from './schema/validate.ts';

// machine
export { transition, initialMachineContext, IllegalTransitionError, IDLE } from './machine/reducer.ts';
export type { MachineContext } from './machine/reducer.ts';

// ports
export * from './ports/index.ts';
export { FakeModelPort, fakePassA, fakePassB } from './ports/fakeModel.ts';

// edits
export { applyBatch, PreconditionError, InvalidOpError } from './edits/apply.ts';
export type { ApplyResult } from './edits/apply.ts';

// render + diff
export { render, allSurfaces } from './render/index.ts';
export type { RenderedArtifact, RenderedCourse, RenderBlock, ArtifactKind } from './render/types.ts';
export { diffRenders } from './diff/index.ts';

// export / package
export { buildPackage, packageManifest, qualityReport } from './render/export/package.ts';
export { artifactToMarkdown } from './render/export/text.ts';

// knowledge stages
export { linkStage } from './link/index.ts';
export { judgeStage } from './judge/index.ts';

// voice
export { voiceStage, collectSurfaces, voiceRefreshSurface, VOICE_BUDGET_USD } from './voice/index.ts';
export { checkVoice } from './voice/contracts.ts';

// grade
export { grade, verify, gradeStructural, gradeTeachability, GRADER_VERSION } from './grade/index.ts';
export type { VerifyReport, StructuralReport } from './grade/index.ts';

// pipeline
export { buildCourse } from './pipeline/build.ts';
export type { BuildPorts, BuildOptions, BuildOutcome } from './pipeline/build.ts';
export { applyEdit, replayEdits } from './pipeline/patch.ts';
export { CostLedgerBuilder, BudgetExceededError, meteredModel } from './pipeline/cost.ts';

// the TA (one edit pathway)
export { proposeEdit, TA_SYSTEM } from './ta/index.ts';
export type { TAProposal } from './ta/index.ts';

// brief parsing (intake)
export { parseBrief, inferDiscipline, detectWeeks } from './author/briefParse.ts';

// util
export { fnv1a, stableStringify } from './util.ts';
