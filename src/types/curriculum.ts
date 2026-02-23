export interface CourseModel {
  courseId: string;
  version: number;
  meta: {
    title: string;
    durationWeeks: number;
    audience: string;
  };
  learningOutcomes: Array<{
    id: string; // e.g., "LO-1"
    text: string;
  }>;
  policies: {
    grading: Array<{
      id: string; // e.g., "G-1"
      name: string;
      weight: number; // MUST sum to 100 globally
    }>;
  };
  assessments: Array<{
    id: string; // e.g., "A-1"
    type: "reflection" | "project" | "essay" | "quiz" | "exam";
    count: number;
    rubricRequired: boolean;
    linkedOutcomes: string[]; // references LO ids
  }>;
  weeks: Array<{
    id: string; // e.g., "W-1"
    theme: string;
    deliverables: string[]; // references Assessment IDs + instance (e.g., "A-1#instance1")
  }>;
}

export type IntentOp =
  | { op: "ADD_ASSESSMENT"; payload: { type: string; linkedOutcomes?: string[]; targetWeek?: string; weight?: number } }
  | { op: "UPDATE_GRADING_WEIGHT"; payload: { assessmentId: string; newWeight: number } }
  | { op: "ADD_WEEK"; payload: { insertAfterWeekId: string } }
  | { op: "REASSIGN_DELIVERABLE"; payload: { assessmentInstanceId: string; newWeekId: string } };

export interface JSONPatch {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;
}

export interface DraftPlan {
  planId: string;
  proposedPatches: JSONPatch[];
  impactedGenerators: string[]; // e.g., ["CourseMap", "AssignmentPack"]
  conflicts: Array<{
    type: "GRADING_SUM_INVALID" | "WEEK_OUT_OF_BOUNDS" | "MISSING_DELIVERABLE_SLOT";
    message: string;
    requiredAction: string;
  }>;
  isCommittable: boolean; // MUST be false if conflicts.length > 0
}

export interface ArtifactSection {
  sectionId: string; // DB ID
  artifactId: string;
  sectionKey: string; // Stable business ID e.g., "A-1-rubric"
  modelDependencies: string[]; // JSON Paths, e.g., ["/assessments/A-1"]

  // The Pure Function Output
  generatedContent: string; // Markdown

  // The Human Override Layer
  overrideContent: string | null; // Sanitized HTML
  isLocked: boolean; // If true, rendering engine uses overrideContent

  // Sync tracking
  lastGeneratedModelVersion: number;
}
