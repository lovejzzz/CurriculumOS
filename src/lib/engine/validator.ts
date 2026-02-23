import { CourseModel } from '@/types/curriculum';

export interface ValidationResult {
  isValid: boolean;
  conflicts: Array<{
    type: "GRADING_SUM_INVALID" | "WEEK_OUT_OF_BOUNDS" | "MISSING_DELIVERABLE_SLOT";
    message: string;
    requiredAction: string;
  }>;
}

export function validateCourseModel(model: CourseModel): ValidationResult {
  const conflicts: ValidationResult['conflicts'] = [];

  // Constraint 1: Grading weight must sum to exactly 100
  const totalWeight = model.policies.grading.reduce((sum, g) => sum + g.weight, 0);
  if (totalWeight !== 100) {
    conflicts.push({
      type: "GRADING_SUM_INVALID",
      message: `Total grading weight is ${totalWeight}%, but it must be exactly 100%.`,
      requiredAction: "Adjust the weights of the assessments to sum to 100."
    });
  }

  // Constraint 2: All deliverables in weeks must reference valid assessments
  const assessmentIds = new Set(model.assessments.map(a => a.id));
  model.weeks.forEach((week, index) => {
    week.deliverables.forEach(deliv => {
      const baseId = deliv.split('#')[0];
      if (!assessmentIds.has(baseId)) {
        conflicts.push({
          type: "MISSING_DELIVERABLE_SLOT",
          message: `Week ${index + 1} references an unknown assessment: ${baseId}`,
          requiredAction: "Remove the deliverable or create the missing assessment."
        });
      }
    });
  });

  return {
    isValid: conflicts.length === 0,
    conflicts
  };
}
