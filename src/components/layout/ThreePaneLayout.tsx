'use client';

import { useEffect, useState } from 'react';
import { useCurriculumStore } from '@/store/curriculumStore';
import { CourseNavigator } from '@/components/pane1/CourseNavigator';
import { Workbench } from '@/components/pane2/Workbench';
import { CopilotPane } from '@/components/pane3/CopilotPane';

export function ThreePaneLayout() {
    const { fetchCourse, courseModel } = useCurriculumStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function init() {
            try {
                const resp = await fetch('/api/courses');
                const courses = await resp.json();

                if (courses.length > 0) {
                    await fetchCourse(courses[0].id);
                } else {
                    // Initialize a default course if none exists
                    const defaultModel = {
                        meta: {
                            title: 'Getting Started with Curriculum OS',
                            durationWeeks: 4,
                            audience: 'Educators and Instructional Designers',
                        },
                        learningOutcomes: [
                            { id: 'LO-1', text: 'Understand the basics of Curriculum OS.' }
                        ],
                        policies: {
                            grading: [
                                { id: 'G-1', name: 'Participation', weight: 100 }
                            ]
                        },
                        assessments: [],
                        weeks: [
                            { id: 'W-1', theme: 'Introduction', deliverables: [] }
                        ]
                    };

                    const createRes = await fetch('/api/courses', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: 'Getting Started with Curriculum OS',
                            modelData: defaultModel
                        })
                    });
                    const newCourse = await createRes.json();
                    await fetchCourse(newCourse.id);
                }
            } catch (err) {
                console.error('Failed to initialize course:', err);
            } finally {
                setLoading(false);
            }
        }

        init();
    }, [fetchCourse]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-50">
                <div className="text-zinc-500 animate-pulse">Loading Environment...</div>
            </div>
        );
    }

    if (!courseModel) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-50">
                <div className="text-red-500">Failed to load Curriculum Model.</div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-zinc-50 overflow-hidden font-sans text-zinc-900">
            {/* Pane 1: Course Navigator (Left) */}
            <div className="w-[320px] flex-shrink-0 border-r border-zinc-200 bg-white flex flex-col h-full shadow-sm z-10">
                <CourseNavigator />
            </div>

            {/* Pane 2: Workbench (Middle - Expandable) */}
            <div className="flex-1 flex flex-col bg-zinc-50/50 overflow-hidden h-full">
                <Workbench />
            </div>

            {/* Pane 3: Copilot (Right) */}
            <div className="w-[400px] flex-shrink-0 bg-white border-l border-zinc-200 flex flex-col h-full shadow-sm z-10">
                <CopilotPane />
            </div>
        </div>
    );
}
