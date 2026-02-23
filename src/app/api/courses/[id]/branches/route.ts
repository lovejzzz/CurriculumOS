import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all branches for a course
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const branches = await prisma.branch.findMany({
            where: { courseId: params.id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(branches);
    } catch (error) {
        console.error('Failed to fetch branches', error);
        return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
    }
}

// POST create a new branch from a specific version (or latest)
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { branchName, sourceVersionId } = body as { branchName: string; sourceVersionId?: string };

        if (!branchName) {
            return NextResponse.json({ error: 'Branch name required' }, { status: 400 });
        }

        // Determine the source model data to copy
        let sourceModelData: string;
        const newVersionNumber = 1;

        if (sourceVersionId) {
            const sourceVersion = await prisma.courseVersion.findUnique({
                where: { id: sourceVersionId }
            });
            if (!sourceVersion) {
                return NextResponse.json({ error: 'Source version not found' }, { status: 404 });
            }
            sourceModelData = sourceVersion.modelData;
        } else {
            // Get the absolute latest version of the course to branch from
            const latestVersion = await prisma.courseVersion.findFirst({
                where: { courseId: params.id },
                orderBy: { versionNumber: 'desc' }
            });

            if (!latestVersion) {
                return NextResponse.json({ error: 'No source version available to branch from' }, { status: 404 });
            }
            sourceModelData = latestVersion.modelData;
        }

        // 1. Create the branch
        const newBranch = await prisma.branch.create({
            data: {
                courseId: params.id,
                name: branchName,
            }
        });

        // 2. Create the initial CourseVersion for this new branch (the snapshot)
        const initialBranchVersion = await prisma.courseVersion.create({
            data: {
                courseId: params.id,
                branchId: newBranch.id,
                versionNumber: newVersionNumber,
                modelData: sourceModelData,
                commitReason: `Branched to ${branchName}`
            }
        });

        return NextResponse.json({ branch: newBranch, initialVersion: initialBranchVersion });

    } catch (error) {
        console.error('Failed to create branch', error);
        // Handle unique constraint violation (branch name already exists for this course)
        if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002') {
            return NextResponse.json({ error: 'A branch with this name already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 });
    }
}
