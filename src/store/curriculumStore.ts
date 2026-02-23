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

  // Actions
  setCourseModel: (model: CourseModel | null) => void;
  setActiveDraft: (draft: DraftPlan | null) => void;
  setActiveSelection: (selection: ActiveSelection) => void;
  
  // Async Actions
  fetchCourse: (courseId: string) => Promise<void>;
}

export const useCurriculumStore = create<CurriculumState>((set, get) => ({
  courseModel: null,
  activeDraft: null,
  activeSelection: null,

  setCourseModel: (model) => set({ courseModel: model }),
  setActiveDraft: (draft) => set({ activeDraft: draft }),
  setActiveSelection: (selection) => set({ activeSelection: selection }),

  fetchCourse: async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) throw new Error('Failed to fetch course');
      
      const course = await response.json();
      if (course && course.versions && course.versions.length > 0) {
        // Ensure version in modelData syncs with DB versionNumber
        const modelData = course.versions[0].modelData as CourseModel;
        modelData.version = course.versions[0].versionNumber;
        modelData.courseId = course.id;
        
        set({ courseModel: modelData });
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
    }
  }
}));
