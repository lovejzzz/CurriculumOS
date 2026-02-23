'use client';

import { useEffect, useState } from 'react';
import { useCurriculumStore } from '@/store/curriculumStore';
import { Branch } from '@prisma/client';

export function BranchSwitcher() {
    const { courseModel, activeBranchId, setActiveBranchId } = useCurriculumStore();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!courseModel?.courseId) return;

        const fetchBranches = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/courses/${courseModel.courseId}/branches`);
                if (res.ok) {
                    const data = await res.json();
                    setBranches(data);

                    // Auto-select the first branch if none is active
                    if (!activeBranchId && data.length > 0) {
                        // Assuming the most recently created or 'main' is first
                        setActiveBranchId(data[data.length - 1].id);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch branches', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBranches();
    }, [courseModel?.courseId, activeBranchId, setActiveBranchId]);

    const handleCreateBranch = async () => {
        const branchName = prompt('Enter a name for the new branch (e.g., "Fall 2026 Sandbox"):');
        if (!branchName) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/courses/${courseModel?.courseId}/branches`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ branchName })
            });
            if (res.ok) {
                const data = await res.json();
                setBranches(prev => [data.branch, ...prev]);
                setActiveBranchId(data.branch.id);
            } else {
                const errData = await res.json();
                alert(`Error: ${errData.error}`);
            }
        } catch (err) {
            console.error('Failed to create branch', err);
        } finally {
            setLoading(false);
        }
    };

    if (!courseModel) return null;

    return (
        <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Branch:</span>
            <select
                value={activeBranchId || ''}
                onChange={(e) => setActiveBranchId(e.target.value)}
                disabled={loading}
                className="text-xs font-medium bg-zinc-100 border border-zinc-200 rounded px-2 py-1 text-zinc-800 disabled:opacity-50"
            >
                {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                ))}
            </select>
            <button
                onClick={handleCreateBranch}
                disabled={loading}
                className="text-xs px-2 py-1 bg-white border border-dashed border-zinc-300 rounded text-zinc-500 hover:text-indigo-600 hover:border-indigo-300"
                title="Create New Branch"
            >
                + New
            </button>
        </div>
    );
}
