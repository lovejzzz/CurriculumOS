import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { IntentOp, DraftPlan, CourseModel } from '@/types/curriculum';
import { mapIntentToPatches } from '@/lib/engine/intentMapper';
import { validateCourseModel } from '@/lib/engine/validator';
import { getImpactedGenerators } from '@/lib/engine/registry';
import { v4 as uuidv4 } from 'uuid';
import * as jsonpatch from 'fast-json-patch';

export async function POST(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    const body = await request.json();
    const { ops } = body as { ops: IntentOp[] };

    if (!ops || !Array.isArray(ops)) {
      return NextResponse.json({ error: 'Missing or invalid "ops" array' }, { status: 400 });
    }

    // 1. Fetch current CourseModel (SSOT)
    const currentCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    });

    if (!currentCourse || currentCourse.versions.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const currentModel: CourseModel = JSON.parse(currentCourse.versions[0].modelData as unknown as string);
    currentModel.courseId = currentCourse.id;
    currentModel.version = currentCourse.versions[0].versionNumber;

    // 2. Map IntentOps to JSONPatches
    const allPatches = ops.flatMap(op => mapIntentToPatches(op, currentModel));

    // 3. Apply patches to a clone of the CourseModel
    const clonedModel: CourseModel = JSON.parse(JSON.stringify(currentModel));

    // Apply patches using fast-json-patch
    // fast-json-patch requires patches to follow the RFC6902 standard.
    // Some custom intentMapper logic might need careful handling, but we mapped to standard ops
    let applyError = null;
    try {
      jsonpatch.applyPatch(clonedModel, allPatches as unknown as jsonpatch.Operation[]);
    } catch (e) {
      const err = e as Error;
      applyError = err.message;
    }

    // 4. Validate constraints on the cloned model
    const validation = validateCourseModel(clonedModel);

    // 5. Traverse DAG to find impacted generators
    const patchPaths = allPatches.map(p => p.path);
    const impactedGenerators = getImpactedGenerators(patchPaths);

    // 6. Return DraftPlan
    const draftPlan: DraftPlan = {
      planId: uuidv4(),
      proposedPatches: allPatches,
      impactedGenerators,
      conflicts: validation.conflicts,
      isCommittable: validation.isValid && !applyError
    };

    if (applyError) {
      draftPlan.conflicts.push({
        type: 'MISSING_DELIVERABLE_SLOT', // Reuse or add new conflict type
        message: `Patch application error: ${applyError}`,
        requiredAction: 'Review the intended operations.'
      });
      draftPlan.isCommittable = false;
    }

    return NextResponse.json(draftPlan);

  } catch (error) {
    console.error('Error generating draft:', error);
    return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 });
  }
}
