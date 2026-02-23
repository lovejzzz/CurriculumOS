import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DraftPlan, CourseModel } from '@/types/curriculum';
import { GENERATOR_REGISTRY } from '@/lib/engine/registry';
import * as jsonpatch from 'fast-json-patch';

export async function POST(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    const body = await request.json();
    const { plan } = body as { plan: DraftPlan };

    if (!plan || !plan.proposedPatches) {
      return NextResponse.json({ error: 'Missing or invalid "plan" object' }, { status: 400 });
    }

    if (!plan.isCommittable) {
      return NextResponse.json({ error: 'Plan is not committable. Resolve conflicts first.' }, { status: 400 });
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
    const currentVersionNumber = currentCourse.versions[0].versionNumber;

    // 2. Apply patches to a clone
    const clonedModel: CourseModel = JSON.parse(JSON.stringify(currentModel));
    try {
      jsonpatch.applyPatch(clonedModel, plan.proposedPatches as unknown as jsonpatch.Operation[]);
    } catch (e) {
      const err = e as Error;
      return NextResponse.json({ error: `Patch application failed: ${err.message}` }, { status: 400 });
    }

    // 3. Create new CourseVersion
    const newVersionNumber = currentVersionNumber + 1;
    clonedModel.version = newVersionNumber;

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        versions: {
          create: {
            versionNumber: newVersionNumber,
            modelData: JSON.stringify(clonedModel),
            commitReason: `Applied plan ${plan.planId}`
          }
        }
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    });

    const newVersionDbId = updatedCourse.versions[0].id;

    // 4. Run impacted generators
    const impactedGenPlugins = GENERATOR_REGISTRY.filter(g => plan.impactedGenerators.includes(g.pluginId));

    // Process them synchronously for MVPs. Real implementation may use a background job.
    for (const generator of impactedGenPlugins) {
      console.log(`[Commit] Running generator: ${generator.pluginId}`);

      const generatedDrafts = await generator.generate(clonedModel, newVersionNumber);

      // Ensure an Artifact exists for this plugin
      let artifact = await prisma.artifact.findFirst({
        where: { courseId, type: generator.pluginId }
      });

      if (!artifact) {
        artifact = await prisma.artifact.create({
          data: {
            courseId,
            type: generator.pluginId,
            title: generator.displayName
          }
        });
      }

      // Upsert sections
      for (const sectionDraft of generatedDrafts) {
        await prisma.artifactSection.upsert({
          where: {
            artifactId_sectionKey: {
              artifactId: artifact.id,
              sectionKey: sectionDraft.sectionKey
            }
          },
          update: {
            versionId: newVersionDbId,
            modelDependencies: JSON.stringify(sectionDraft.modelDependencies),
            generatedContent: sectionDraft.generatedContent
          },
          create: {
            artifactId: artifact.id,
            versionId: newVersionDbId,
            sectionKey: sectionDraft.sectionKey,
            modelDependencies: JSON.stringify(sectionDraft.modelDependencies),
            generatedContent: sectionDraft.generatedContent,
            isLocked: false
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      newVersionNumber
    });

  } catch (error) {
    console.error('Error committing plan:', error);
    return NextResponse.json({ error: 'Failed to commit plan' }, { status: 500 });
  }
}
