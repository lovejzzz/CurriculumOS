import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncCourseToBrightspace } from '@/lib/lms/brightspace';

import { CourseModel } from '@/types/curriculum';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Fetch the latest CourseVersion 
        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1
                }
            }
        });

        if (!course || course.versions.length === 0) {
            return NextResponse.json({ error: 'Course or version not found' }, { status: 404 });
        }

        const currentModel = course.versions[0].modelData as unknown as CourseModel;

        // Simulate Sync
        // In production, brightspace URL and token would be fetched from env or org settings
        const syncResult = await syncCourseToBrightspace(currentModel, 'https://brightspace.mock.edu', 'mock-token');

        // Optionally update the Course model with a lastSyncedAt timestamp
        await prisma.course.update({
            where: { id },
            data: {
                updatedAt: new Date(syncResult.timestamp) // Updating course updatedAt to reflect sync
            }
        });

        return NextResponse.json(syncResult);
    } catch (error) {
        console.error('Error syncing to Brightspace:', error);
        const err = error as Error;
        return NextResponse.json({ error: 'Brightspace Sync Failed', details: err.message }, { status: 500 });
    }
}
