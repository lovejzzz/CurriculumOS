import { CourseModel, DraftPlan } from '@/types/curriculum';

export interface GeneratedSectionDraft {
  sectionKey: string;
  modelDependencies: string[];
  generatedContent: string;
}

export interface DeliverableGenerator {
  pluginId: string;
  displayName: string;
  description: string;

  // JSON Path prefixes that trigger this generator
  dependsOnPaths: string[];

  generate: (model: CourseModel, currentVersion: number) => Promise<GeneratedSectionDraft[]>;
}

import { CourseMapGen } from '../generators/CourseMapGen';
import { WeeklyPlanGen } from '../generators/WeeklyPlanGen';
import { AssignmentPackGen } from '../generators/AssignmentPackGen';
import { AssessmentQAGen } from '../generators/AssessmentQAGen';
import { AccessibilityGen } from '../generators/AccessibilityGen';

export const GENERATOR_REGISTRY: DeliverableGenerator[] = [
  CourseMapGen,
  WeeklyPlanGen,
  AssignmentPackGen,
  AssessmentQAGen,
  AccessibilityGen
];

/**
 * Traverses the DAG to determine which generators need to run
 * based on the provided JSONPatch paths.
 */
export function getImpactedGenerators(patchPaths: string[]): string[] {
  const impacted = new Set<string>();

  for (const path of patchPaths) {
    for (const generator of GENERATOR_REGISTRY) {
      if (generator.dependsOnPaths.some(depPath => {
        // Simple prefix match, handle wildcard e.g., "/weeks/*"
        const cleanDepPath = depPath.replace(/\/\*$/, '');
        return path.startsWith(cleanDepPath);
      })) {
        impacted.add(generator.pluginId);
      }
    }
  }

  return Array.from(impacted);
}
