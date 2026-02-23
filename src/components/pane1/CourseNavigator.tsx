'use client';

import { useCurriculumStore } from '@/store/curriculumStore';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';

export function CourseNavigator() {
    const { courseModel, activeSelection, setActiveSelection, setActiveDraft } = useCurriculumStore();
    const [acting, setActing] = useState(false);

    if (!courseModel) return null;

    const triggerDirectAction = async (opName: string, payload: unknown) => {
        setActing(true);
        try {
            const draftRes = await fetch(`/api/courses/${courseModel.courseId}/intents/draft`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ops: [{ op: opName, payload }] })
            });
            const draftPlan = await draftRes.json();
            setActiveDraft(draftPlan);
        } catch (err) {
            console.error('Failed to auto draft', err);
        } finally {
            setActing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white text-zinc-800">
            <div className="p-4 border-b border-zinc-200">
                <h2 className="text-lg font-semibold truncate" title={courseModel.meta.title}>
                    {courseModel.meta.title}
                </h2>
                <p className="text-sm text-zinc-500 mb-4">
                    {courseModel.meta.durationWeeks} Weeks • {courseModel.meta.audience}
                </p>

                {/* Quick Actions / Structured Edits */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => triggerDirectAction('ADD_WEEK', { insertAfterWeekId: courseModel.weeks[courseModel.weeks.length - 1]?.id })}
                        disabled={acting}
                        className="text-xs font-medium px-2 py-1 bg-zinc-100 border border-zinc-200 rounded hover:bg-zinc-200 transition-colors flex items-center"
                    >
                        {acting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : '+ Week'}
                    </button>
                    <button
                        onClick={() => triggerDirectAction('ADD_ASSESSMENT', { type: 'quiz', weight: 5 })}
                        disabled={acting}
                        className="text-xs font-medium px-2 py-1 bg-zinc-100 border border-zinc-200 rounded hover:bg-zinc-200 transition-colors flex items-center"
                    >
                        {acting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : '+ Quiz (5%)'}
                    </button>
                    <button
                        onClick={async () => {
                            setActing(true);
                            try {
                                const res = await fetch(`/api/courses/${courseModel.courseId}/sync/brightspace`, { method: 'POST' });
                                if (res.ok) {
                                    alert('Successfully synced to Brightspace!');
                                } else {
                                    alert('Failed to sync to Brightspace.');
                                }
                            } catch (e) {
                                console.error(e);
                            } finally {
                                setActing(false);
                            }
                        }}
                        disabled={acting}
                        className="text-xs font-semibold px-2 py-1 bg-orange-100 border border-orange-200 text-orange-700 rounded hover:bg-orange-200 transition-colors flex items-center ml-auto"
                    >
                        {acting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : 'Sync to Brightspace'}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Artifacts Selection */}
                <section>
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Artifacts</h3>
                    <ul className="space-y-1">
                        <li
                            className={`px-2 py-1.5 rounded cursor-pointer text-sm font-medium transition-colors ${activeSelection?.id === 'CourseMapGen' && activeSelection?.type === 'artifact' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-zinc-100 text-zinc-700'}`}
                            onClick={() => setActiveSelection({ type: 'artifact', id: 'CourseMapGen' })}
                        >
                            Course Map
                        </li>
                        <li
                            className={`px-2 py-1.5 rounded cursor-pointer text-sm font-medium transition-colors ${activeSelection?.id === 'WeeklyPlanGen' && activeSelection?.type === 'artifact' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-zinc-100 text-zinc-700'}`}
                            onClick={() => setActiveSelection({ type: 'artifact', id: 'WeeklyPlanGen' })}
                        >
                            Weekly Plan
                        </li>
                        <li
                            className={`px-2 py-1.5 rounded cursor-pointer text-sm font-medium transition-colors ${activeSelection?.id === 'AssignmentPackGen' && activeSelection?.type === 'artifact' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-zinc-100 text-zinc-700'}`}
                            onClick={() => setActiveSelection({ type: 'artifact', id: 'AssignmentPackGen' })}
                        >
                            Assignment Pack
                        </li>
                        <li
                            className={`px-2 py-1.5 rounded cursor-pointer text-sm font-medium transition-colors ${activeSelection?.id === 'AssessmentQAGen' && activeSelection?.type === 'artifact' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-zinc-100 text-zinc-700'}`}
                            onClick={() => setActiveSelection({ type: 'artifact', id: 'AssessmentQAGen' })}
                        >
                            Assessment QA
                        </li>
                        <li
                            className={`px-2 py-1.5 rounded cursor-pointer text-sm font-medium transition-colors ${activeSelection?.id === 'AccessibilityGen' && activeSelection?.type === 'artifact' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-zinc-100 text-zinc-700'}`}
                            onClick={() => setActiveSelection({ type: 'artifact', id: 'AccessibilityGen' })}
                        >
                            Accessible Syllabus
                        </li>
                    </ul>
                </section>

                {/* Outcomes Coverage Matrix */}
                <section>
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Outcome Coverage</h3>
                    <div className="bg-zinc-50 border border-zinc-200 rounded p-2 text-sm space-y-2">
                        {courseModel.learningOutcomes.map(lo => {
                            // Find any assessment that links to this outcome
                            const isCovered = courseModel.assessments.some(a => a.linkedOutcomes.includes(lo.id));
                            return (
                                <div key={lo.id} className="flex items-start gap-2">
                                    <span className={isCovered ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                                        {isCovered ? "✓" : "⚠"}
                                    </span>
                                    <span className={`text-xs ${isCovered ? "text-zinc-700" : "text-red-600 font-medium"}`}>
                                        {lo.text} {isCovered ? "" : "(Orphaned)"}
                                    </span>
                                </div>
                            );
                        })}
                        {courseModel.learningOutcomes.length === 0 && (
                            <span className="text-xs text-zinc-500 italic">No outcomes defined.</span>
                        )}
                    </div>
                </section>

                {/* Structure Visualization */}
                <section>
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Structure</h3>

                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-semibold text-zinc-600 mb-1">Learning Outcomes</h4>
                            <ul className="space-y-1">
                                {courseModel.learningOutcomes.map(lo => (
                                    <li key={lo.id} className="text-sm px-2 py-1.5 rounded bg-zinc-50 border border-zinc-100 text-zinc-700 truncate" title={lo.text}>
                                        <span className="font-mono text-xs text-zinc-400 mr-2">{lo.id}</span>
                                        {lo.text}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-zinc-600 mb-1">Grading</h4>
                            <ul className="space-y-1">
                                {courseModel.policies.grading.map(g => (
                                    <li key={g.id} className="text-sm px-2 py-1 flex justify-between rounded text-zinc-700 hover:bg-zinc-50">
                                        <span>{g.name}</span>
                                        <span className="font-mono text-zinc-500">{g.weight}%</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-zinc-600 mb-1">Assessments</h4>
                            <ul className="space-y-1">
                                {courseModel.assessments.map(a => (
                                    <li key={a.id} className="text-sm px-2 py-1.5 rounded bg-zinc-50 border border-zinc-100 text-zinc-700">
                                        <span className="font-mono text-xs text-zinc-400 mr-2">{a.id}</span>
                                        <span className="capitalize">{a.type}</span> (x{a.count})
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-zinc-600 mb-1">Weekly Plan</h4>
                            <ul className="space-y-2">
                                {courseModel.weeks.map(w => (
                                    <li key={w.id} className="text-sm px-2 py-2 rounded bg-zinc-50 border border-zinc-100 text-zinc-700">
                                        <div className="font-medium text-zinc-800"><span className="font-mono text-xs text-zinc-400 mr-2">{w.id}</span>{w.theme}</div>
                                        {w.deliverables.length > 0 && (
                                            <div className="mt-1 text-xs text-zinc-500">
                                                Deliverables: {w.deliverables.join(', ')}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>
                </section>
            </div>
        </div>
    );
}
