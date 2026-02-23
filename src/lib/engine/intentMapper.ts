import { IntentOp, JSONPatch, CourseModel } from '@/types/curriculum';
import { v4 as uuidv4 } from 'uuid';

/**
 * Translates a user IntentOp into one or more JSONPatch operations
 * against the CourseModel.
 */
export function mapIntentToPatches(intent: IntentOp, currentModel: CourseModel): JSONPatch[] {
  const patches: JSONPatch[] = [];

  switch (intent.op) {
    case 'ADD_ASSESSMENT': {
      const newAssessmentId = `A-${uuidv4().substring(0, 4)}`;
      
      patches.push({
        op: 'add',
        path: `/assessments/-`,
        value: {
          id: newAssessmentId,
          type: intent.payload.type,
          count: 1,
          rubricRequired: ['essay', 'project', 'reflection'].includes(intent.payload.type),
          linkedOutcomes: intent.payload.linkedOutcomes || []
        }
      });

      // If a weight is provided, also add a grading policy entry
      if (intent.payload.weight !== undefined) {
        patches.push({
          op: 'add',
          path: `/policies/grading/-`,
          value: {
            id: `G-${newAssessmentId}`,
            name: `${intent.payload.type} Assessment`,
            weight: intent.payload.weight
          }
        });
      }

      // If a target week is provided, append it to the week's deliverables
      if (intent.payload.targetWeek) {
        const weekIndex = currentModel.weeks.findIndex(w => w.id === intent.payload.targetWeek);
        if (weekIndex !== -1) {
          patches.push({
            op: 'add',
            path: `/weeks/${weekIndex}/deliverables/-`,
            value: `${newAssessmentId}#instance1`
          });
        }
      }
      break;
    }

    case 'UPDATE_GRADING_WEIGHT': {
      const gradingIndex = currentModel.policies.grading.findIndex(
        g => g.id === intent.payload.assessmentId || g.id === `G-${intent.payload.assessmentId}`
      );
      
      if (gradingIndex !== -1) {
        patches.push({
          op: 'replace',
          path: `/policies/grading/${gradingIndex}/weight`,
          value: intent.payload.newWeight
        });
      }
      break;
    }

    case 'ADD_WEEK': {
      const newWeekId = `W-${uuidv4().substring(0, 4)}`;
      const insertIndex = currentModel.weeks.findIndex(w => w.id === intent.payload.insertAfterWeekId);
      
      if (insertIndex !== -1) {
        patches.push({
          op: 'add',
          path: `/weeks/${insertIndex + 1}`,
          value: {
            id: newWeekId,
            theme: 'New Theme',
            deliverables: []
          }
        });
      } else {
        // Append to end if insertAfterWeekId not found
        patches.push({
          op: 'add',
          path: `/weeks/-`,
          value: {
            id: newWeekId,
            theme: 'New Theme',
            deliverables: []
          }
        });
      }
      break;
    }

    case 'REASSIGN_DELIVERABLE': {
      // Find where it currently is and remove it
      let found = false;
      currentModel.weeks.forEach((week, wIndex) => {
        const dIndex = week.deliverables.findIndex(d => d === intent.payload.assessmentInstanceId);
        if (dIndex !== -1) {
          patches.push({
            op: 'remove',
            path: `/weeks/${wIndex}/deliverables/${dIndex}`
          });
          found = true;
        }
      });

      if (found) {
        // Add to new week
        const newWeekIndex = currentModel.weeks.findIndex(w => w.id === intent.payload.newWeekId);
        if (newWeekIndex !== -1) {
          patches.push({
            op: 'add',
            path: `/weeks/${newWeekIndex}/deliverables/-`,
            value: intent.payload.assessmentInstanceId
          });
        }
      }
      break;
    }
  }

  return patches;
}
