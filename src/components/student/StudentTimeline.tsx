// src/components/student/StudentTimeline.tsx
'use client';
import { CourseModel, ArtifactSection } from '@/types/curriculum';
import ReactMarkdown from 'react-markdown';

export function StudentTimeline({ courseModel, weeklyPlanArtifact }: { courseModel: CourseModel, weeklyPlanArtifact: ArtifactSection[] }) {
    const getWeekContent = (weekId: string) => {
        if (!weeklyPlanArtifact || weeklyPlanArtifact.length === 0) return '*Content not available yet.*';
        const section = weeklyPlanArtifact.find(s => s.sectionKey === `week-${weekId}`);
        if (section) {
            return section.overrideContent || section.generatedContent;
        }
        return '*Content not available yet.*';
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="mb-12 border-b border-zinc-200 pb-8 text-center">
                <h1 className="text-4xl font-extrabold text-zinc-900 mb-4 tracking-tight">{courseModel.meta.title}</h1>
                <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
                    Duration: {courseModel.meta.durationWeeks} Weeks • Audience: {courseModel.meta.audience}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-12">
                    <h2 className="text-2xl font-bold text-zinc-800 border-b border-zinc-100 pb-2">Weekly Schedule</h2>
                    {courseModel.weeks.map((week, index) => (
                        <div key={week.id} className="relative pl-8 border-l-2 border-indigo-100">
                            <div className="absolute w-4 h-4 bg-indigo-500 rounded-full -left-[9px] top-1 border-4 border-white shadow-sm"></div>
                            <h3 className="text-xl font-semibold text-zinc-800 mb-2">
                                Week {index + 1}: {week.theme}
                            </h3>
                            <div className="prose prose-zinc prose-indigo max-w-none bg-white p-6 rounded-lg shadow-sm border border-zinc-100">
                                <ReactMarkdown>{getWeekContent(week.id)}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {courseModel.weeks.length === 0 && (
                        <div className="text-zinc-500 italic">No weeks scheduled.</div>
                    )}
                </div>

                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Grading Policy</h3>
                        <ul className="space-y-3">
                            {courseModel.policies.grading.map(g => (
                                <li key={g.id} className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-zinc-700">{g.name}</span>
                                    <span className="bg-zinc-100 px-2 py-1 rounded font-mono text-zinc-600 font-bold">{g.weight}%</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100 shadow-sm">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4">Learning Outcomes</h3>
                        <ul className="space-y-3">
                            {courseModel.learningOutcomes.map(lo => (
                                <li key={lo.id} className="text-sm text-indigo-900 leading-relaxed flex items-start gap-2">
                                    <span className="text-indigo-400 mt-0.5">•</span>
                                    {lo.text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
