/** render/types.ts — the rendered-artifact model.
 *  Artifacts are NEVER stored as truth (courseObject.ts) — render(graph,
 *  overlays, lens) produces these on demand. Each carries the SurfaceIds it
 *  exposes for voice and the entity ids it derives from (so the diff and the
 *  grader can cross-reference — Law 3). */
import type { SurfaceId } from '../schema/courseObject.ts';

export type ArtifactKind =
  | 'courseMap'
  | 'syllabus'
  | 'lessonPlans'
  | 'slideDecks'
  | 'assignments'
  | 'rubrics'
  | 'discussions'
  | 'quizBank'
  | 'studyGuides'
  | 'courseFaq';

/** A block of rendered content. Voiced blocks carry a surfaceId; everything
 *  else is compiled text voice may not touch (040 common rules). */
export interface RenderBlock {
  /** machine label, e.g. 'grading-table', 'schedule', 'arc', 'criteria' */
  kind: string;
  /** entity id this block derives from, when applicable */
  entityId?: string;
  /** voiceable slot id, when this block is a voice surface */
  surfaceId?: SurfaceId;
  heading?: string;
  /** rendered text (compiled or, after voice, the voiced text) */
  text?: string;
  /** tabular content: rows of cells */
  rows?: string[][];
  /** nested blocks (sections) */
  children?: RenderBlock[];
  /** for slides: speaker notes / visuals descriptors */
  meta?: Record<string, unknown>;
}

export interface RenderedArtifact {
  kind: ArtifactKind;
  /** one file per session (sessionId) or per course ('course') or per assessment id */
  scope: string;
  title: string;
  blocks: RenderBlock[];
  surfaces: SurfaceId[];
}

export interface RenderedCourse {
  artifacts: RenderedArtifact[];
  /** index by "kind:scope" for O(1) lookup by the diff and the desk */
  byKey: Record<string, RenderedArtifact>;
}
