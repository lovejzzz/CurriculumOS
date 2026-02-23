'use client';

import { useEffect, useState } from 'react';
import { CourseVersion } from '@prisma/client';
import { useCurriculumStore } from '@/store/curriculumStore';

export function VersionHistory() {
    const { courseModel } = useCurriculumStore();
    const [history, setHistory] = useState<CourseVersion[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!courseModel?.courseId) return;

        const fetchHistory = async () => {
            setLoading(true);
            try {
                // To fetch branch-specific history, we'd add an endpoint or query param. 
                // For MVP Phase 4, let's just show the raw commits for the current model.
                const res = await fetch(`/api/courses/${courseModel.courseId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.versions) {
                        setHistory(data.versions);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch version history', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [courseModel?.courseId]);

    if (!courseModel) return null;

    return (
        <div className="p-4 border-t border-zinc-200/50 mt-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Version Graph
            </h3>

            {loading ? (
                <div className="text-xs text-zinc-500 animate-pulse">Loading history...</div>
            ) : (
                <div className="space-y-4">
                    {history.map((version, index) => (
                        <div key={version.id} className="relative pl-4">
                            {/* Timeline line */}
                            {index !== history.length - 1 && (
                                <div className="absolute left-[3px] top-6 bottom-[-16px] w-[2px] bg-zinc-200" />
                            )}
                            {/* Timeline node */}
                            <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full border-2 border-indigo-600 bg-white" />

                            <div className="text-xs text-zinc-900 font-medium">v{version.versionNumber}</div>
                            <div className="text-xs text-zinc-500 truncate" title={version.commitReason || 'Initial Blueprint'}>
                                {version.commitReason || 'Initial Blueprint'}
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">
                                {new Date(version.createdAt).toLocaleString()}
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && (
                        <div className="text-xs text-zinc-500 italic">No committed history available on this branch.</div>
                    )}
                </div>
            )}
        </div>
    );
}
