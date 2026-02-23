import { prisma } from '@/lib/prisma';
import { StudentTimeline } from '@/components/student/StudentTimeline';
import { notFound } from 'next/navigation';
import { CourseModel } from '@/types/curriculum';

export default async function StudentPortalPage({ params }: { params: { id: string } }) {
    const course = await prisma.course.findUnique({
        where: { id: params.id },
        include: {
            versions: {
                orderBy: { versionNumber: 'desc' },
                take: 1
            },
            artifacts: {
                where: { type: 'WeeklyPlanGen' },
                include: { sections: true }
            }
        }
    });

    if (!course || course.versions.length === 0) {
        notFound();
    }

    const courseModel = course.versions[0].modelData as unknown as CourseModel;
    const weeklyPlanArtifact = course.artifacts.length > 0 ? (course.artifacts[0].sections as unknown as import('@/types/curriculum').ArtifactSection[]) : [];

    return (
        <div className="min-h-screen bg-zinc-50 selection:bg-indigo-100 selection:text-indigo-900">
            {/* Read-Only Banner */}
            <div className="w-full bg-indigo-600 text-white text-xs font-semibold uppercase tracking-widest text-center py-2 shadow-sm">
                Student View (Read-Only)
            </div>
            <StudentTimeline courseModel={courseModel} weeklyPlanArtifact={weeklyPlanArtifact} />
        </div>
    );
}
