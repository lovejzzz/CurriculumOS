import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { courseId: string } }
) {
    try {
        const { courseId } = params;

        const artifacts = await prisma.artifact.findMany({
            where: { courseId },
            include: {
                sections: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        return NextResponse.json(artifacts);
    } catch (error) {
        console.error('Error fetching artifacts:', error);
        return NextResponse.json({ error: 'Failed to fetch artifacts' }, { status: 500 });
    }
}
