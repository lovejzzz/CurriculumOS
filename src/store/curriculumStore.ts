import { create } from 'zustand';
import { CourseModel, DraftPlan } from '@/types/curriculum';

export type ActiveSelection =
  | { type: 'node'; id: string }
  | { type: 'artifact'; id: string }
  | null;

interface CurriculumState {
  // Global State
  courseModel: CourseModel | null;
  activeDraft: DraftPlan | null;
  activeSelection: ActiveSelection;
  activeBranchId: string | null;

  // Actions
  setCourseModel: (model: CourseModel | null) => void;
  setActiveDraft: (draft: DraftPlan | null) => void;
  setActiveSelection: (selection: ActiveSelection) => void;
  setActiveBranchId: (branchId: string | null) => void;

  // Async Actions
  fetchCourse: (courseId: string, branchId?: string | null) => Promise<void>;
}

export const useCurriculumStore = create<CurriculumState>((set, get) => ({
  courseModel: null,
  activeDraft: null,
  activeSelection: null,
  activeBranchId: null,

  setCourseModel: (model) => set({ courseModel: model }),
  setActiveDraft: (draft) => set({ activeDraft: draft }),
  setActiveSelection: (selection) => set({ activeSelection: selection }),

  setActiveBranchId: (branchId) => {
    set({ activeBranchId: branchId });
    // When branch changes, we must refetch the course data for that branch
    const { courseModel } = get();
    if (courseModel?.courseId && branchId) {
      get().fetchCourse(courseModel.courseId, branchId);
    }
  },

  fetchCourse: async (courseId: string, branchId?: string | null) => {
    try {
      const url = branchId
        ? `/api/courses/${courseId}?branchId=${branchId}`
        : `/api/courses/${courseId}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch course');

      const course = await response.json();

      // Look for the specific branch version, or just the latest if no branch specified
      let currentVersion;
      if (branchId) {
        currentVersion = course.versions.find((v: { branchId: string; modelData: unknown; versionNumber: number }) => v.branchId === branchId);
      }

      // Fallback to the latest version if the specific branch version isn't found
      if (!currentVersion && course.versions && course.versions.length > 0) {
        currentVersion = course.versions[0];
      }

      if (currentVersion) {
        // Ensure version in modelData syncs with DB versionNumber
        const modelData = currentVersion.modelData as CourseModel;
        modelData.version = currentVersion.versionNumber;
        modelData.courseId = course.id;

        set({ courseModel: modelData });
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
    }
  }
}));
