'use client';

import { useState } from 'react';
import { useCurriculumStore } from '@/store/curriculumStore';
import { Send, Loader2 } from 'lucide-react';

export function CopilotPane() {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const { courseModel, activeDraft, setActiveDraft, fetchCourse } = useCurriculumStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || !courseModel) return;

        setLoading(true);
        try {
            // 1. Parse intent
            const parseRes = await fetch(`/api/courses/${courseModel.courseId}/intents/parse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            const parseData = await parseRes.json();

            if (parseData.ops) {
                // 2. Draft plan
                const draftRes = await fetch(`/api/courses/${courseModel.courseId}/intents/draft`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ops: parseData.ops })
                });
                const draftPlan = await draftRes.json();
                setActiveDraft(draftPlan);
            }
        } catch (err) {
            console.error('Error in copilot flow:', err);
        } finally {
            setLoading(false);
            setPrompt('');
        }
    };

    const handleCommit = async () => {
        if (!activeDraft || !courseModel) return;

        setLoading(true);
        try {
            const commitRes = await fetch(`/api/courses/${courseModel.courseId}/intents/commit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: activeDraft })
            });
            const result = await commitRes.json();

            if (result.success) {
                setActiveDraft(null);
                await fetchCourse(courseModel.courseId); // Refresh state
            }
        } catch (err) {
            console.error('Commit failed:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-50 border-l border-zinc-200">

            {/* Header */}
            <div className="p-4 border-b border-zinc-200 bg-white">
                <h2 className="text-lg font-semibold text-zinc-800">Copilot</h2>
                <p className="text-xs text-zinc-500">Describe structural changes you want to make</p>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

                {/* Active Draft Review Card */}
                {activeDraft && (
                    <div className="bg-white border border-indigo-200 shadow-sm rounded-lg p-4 flex flex-col gap-3">
                        <h3 className="font-semibold text-indigo-900 border-b border-indigo-100 pb-2">Review Changes</h3>

                        <div className="text-sm">
                            <span className="font-medium text-zinc-700">Impacted Generators:</span>
                            <div className="flex gap-1 flex-wrap mt-1">
                                {activeDraft.impactedGenerators.length > 0 ? activeDraft.impactedGenerators.map(g => (
                                    <span key={g} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs">{g}</span>
                                )) : <span className="text-zinc-500 text-xs">None</span>}
                            </div>
                        </div>

                        <div className="text-sm max-h-[150px] overflow-y-auto bg-zinc-50 p-2 rounded font-mono text-xs border border-zinc-100">
                            {activeDraft.proposedPatches.map((p, i) => (
                                <div key={i} className="mb-1 pb-1 border-b border-zinc-200 last:mb-0 last:pb-0 last:border-0 truncate">
                                    <span className={`font-bold mr-2 ${(
                                        {
                                            add: 'text-green-600',
                                            remove: 'text-red-600',
                                            replace: 'text-blue-600'
                                        } as Record<string, string>
                                    )[p.op] || 'text-zinc-600'}`}>{p.op.toUpperCase()}</span>
                                    {p.path} {p.value !== undefined ? `=> ${JSON.stringify(p.value)}` : ''}
                                </div>
                            ))}
                        </div>

                        {activeDraft.conflicts && activeDraft.conflicts.length > 0 && (
                            <div className="bg-red-50 text-red-700 p-2 rounded text-xs border border-red-100">
                                <span className="font-bold block mb-1">Conflicts detected:</span>
                                <ul className="list-disc pl-4">
                                    {activeDraft.conflicts.map((c, i) => (
                                        <li key={i}>{c.message} <span className="font-semibold">({c.requiredAction})</span></li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {activeDraft.warnings && activeDraft.warnings.length > 0 && (
                            <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded text-sm">
                                <h4 className="font-semibold text-orange-900 mb-1 flex items-center">
                                    <span className="mr-1">⚠️</span> Soft Warnings
                                </h4>
                                <ul className="list-disc pl-4 space-y-1">
                                    {activeDraft.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                </ul>
                            </div>
                        )}

                        <div className="flex gap-2 mt-2">
                            <button
                                className="flex-1 bg-zinc-100 text-zinc-700 py-1.5 rounded text-sm font-medium hover:bg-zinc-200 transition-colors"
                                onClick={() => setActiveDraft(null)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                className="flex-1 bg-indigo-600 text-white py-1.5 rounded text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                onClick={handleCommit}
                                disabled={!activeDraft.isCommittable || loading}
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Apply Changes
                            </button>
                        </div>
                    </div>
                )}

            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-zinc-200">
                <form onSubmit={handleSubmit} className="relative flex items-center">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={loading || !!activeDraft}
                        placeholder={activeDraft ? "Resolve draft first..." : "E.g., Add an essay worth 20% to Week 4"}
                        className="w-full pl-3 pr-10 py-3 bg-zinc-50 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-[68px] disabled:bg-zinc-100 disabled:cursor-not-allowed"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!prompt.trim() || loading || !!activeDraft}
                        className="absolute right-2 bottom-2 p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
            </div>

        </div>
    );
}
