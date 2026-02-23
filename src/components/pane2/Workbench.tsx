'use client';

import { useCurriculumStore } from '@/store/curriculumStore';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, Edit3, Unlock } from 'lucide-react';
import { ArtifactSection } from '@/types/curriculum';

function SectionRenderer({ section, courseId }: { section: ArtifactSection & { id: string }; courseId: string }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(section.overrideContent || section.generatedContent);
    const [isLocked, setIsLocked] = useState(section.isLocked);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/sections/${section.id}/override`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ overrideContent: editContent, isLocked: true })
            });
            if (res.ok) {
                setIsLocked(true);
                section.overrideContent = editContent;
                section.isLocked = true;
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
            setIsEditing(false);
        }
    };

    const handleUnlock = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/sections/${section.id}/override`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ overrideContent: section.overrideContent, isLocked: false })
            });
            if (res.ok) {
                setIsLocked(false);
                section.isLocked = false;
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="relative group border-2 border-transparent hover:border-indigo-50 px-4 py-2 rounded-md -mx-4 transition-colors mb-4">
            {!isEditing && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    {isLocked ? (
                        <button onClick={handleUnlock} disabled={isSaving} className="px-2 py-1 bg-zinc-100 text-xs rounded hover:bg-zinc-200 flex items-center gap-1 text-zinc-600 transition-colors">
                            <Unlock className="w-3 h-3" /> Unlock
                        </button>
                    ) : null}
                    <button onClick={() => setIsEditing(true)} className="px-2 py-1 bg-white border border-zinc-200 shadow-sm text-xs rounded hover:bg-zinc-50 flex items-center gap-1 text-zinc-700 transition-colors">
                        <Edit3 className="w-3 h-3" /> {isLocked ? 'Edit Override' : 'Edit & Lock'}
                    </button>
                </div>
            )}

            {isEditing ? (
                <div className="flex flex-col gap-2 mt-4">
                    <div className="text-xs font-semibold text-indigo-600 mb-1">EDITING OVERRIDE LAYER</div>
                    <textarea
                        className="w-full min-h-[250px] p-3 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-zinc-800 bg-zinc-50 leading-relaxed shadow-inner"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end mt-2">
                        <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm bg-zinc-100 text-zinc-700 rounded hover:bg-zinc-200 transition-colors font-medium">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2 transition-colors font-medium shadow-sm">
                            {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                            Save & Lock
                        </button>
                    </div>
                </div>
            ) : (
                <div className="prose prose-zinc max-w-none">
                    {isLocked ? (
                        <div className="border-l-4 border-indigo-400 pl-4 py-1">
                            <div className="text-xs font-semibold text-indigo-500 mb-2 uppercase tracking-wide flex items-center gap-1">
                                <Edit3 className="w-3 h-3" /> Manual Override Active
                            </div>
                            <ReactMarkdown>{section.overrideContent || ''}</ReactMarkdown>
                        </div>
                    ) : (
                        <ReactMarkdown>{section.generatedContent}</ReactMarkdown>
                    )}
                </div>
            )}
        </div>
    );
}

export function Workbench() {
    const { activeSelection, courseModel } = useCurriculumStore();
    const [artifactSections, setArtifactSections] = useState<(ArtifactSection & { id: string })[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchArtifact() {
            if (activeSelection?.type === 'artifact' && courseModel) {
                setLoading(true);
                try {
                    const res = await fetch(`/api/courses/${courseModel.courseId}/artifacts`);
                    const artifacts = await res.json();
                    const matched = artifacts.find((a: { type: string; sections: (ArtifactSection & { id: string })[] }) => a.type === activeSelection.id);

                    if (matched && matched.sections && matched.sections.length > 0) {
                        setArtifactSections(matched.sections);
                    } else {
                        setArtifactSections([]);
                    }
                } catch {
                    console.error('Failed to fetch artifact');
                    setArtifactSections([]);
                } finally {
                    setLoading(false);
                }
            } else {
                setArtifactSections([]);
            }
        }
        fetchArtifact();
    }, [activeSelection, courseModel]);

    return (
        <div className="flex-1 flex flex-col h-full bg-zinc-50 overflow-hidden">
            <div className="flex-none p-4 border-b border-zinc-200 bg-white flex justify-between items-center z-10">
                <h2 className="text-lg font-semibold text-zinc-800">
                    Workbench
                </h2>
                {activeSelection && (
                    <div className="text-sm px-2 py-1 bg-zinc-100 rounded text-zinc-600 font-mono">
                        {activeSelection.type}: {activeSelection.id}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-8 flex justify-center">
                <div className="max-w-3xl w-full bg-white shadow-sm border border-zinc-200 p-8 min-h-[800px] rounded-md transition-all">
                    {activeSelection ? (
                        activeSelection.type === 'artifact' ? (
                            loading ? (
                                <div className="flex items-center justify-center h-40 text-zinc-400">
                                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                    Loading Artifact...
                                </div>
                            ) : artifactSections.length > 0 ? (
                                <div>
                                    {artifactSections.map(section => (
                                        <SectionRenderer key={section.id} section={section} courseId={courseModel!.courseId} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-zinc-500 italic">
                                    *Artifact not yet generated or is empty. Commit a plan to generate it.*
                                </div>
                            )
                        ) : (
                            <div className="prose prose-zinc max-w-none">
                                <h3>Preview for Node: {activeSelection.id}</h3>
                                <p className="text-zinc-500">Node editing forms would appear here. For MVP, use the Copilot to make structural changes.</p>
                            </div>
                        )
                    ) : (
                        <div className="flex h-full min-h-[400px] items-center justify-center text-zinc-400 text-sm">
                            Select an item from the navigator to view details or artifacts.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
