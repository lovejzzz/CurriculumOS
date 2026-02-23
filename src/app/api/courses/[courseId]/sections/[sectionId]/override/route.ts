import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: { courseId: string; sectionId: string } }
) {
    try {
        const { sectionId } = params;
        const { overrideContent, isLocked } = await request.json();

        const updatedSection = await prisma.artifactSection.update({
            where: { id: sectionId },
            data: {
                overrideContent,
                isLocked
            }
        });

        return NextResponse.json(updatedSection);
    } catch (error) {
        console.error('Error overriding section:', error);
        return NextResponse.json({ error: 'Failed to override section' }, { status: 500 });
    }
}
