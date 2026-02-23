import { validateCourseModel } from './validator';
import { CourseModel } from '@/types/curriculum';

describe('validateCourseModel', () => {
    let mockModel: CourseModel;

    beforeEach(() => {
        mockModel = {
            courseId: 'course-123',
            version: 1,
            meta: {
                title: 'Test Course',
                durationWeeks: 4,
                audience: 'Test Audience'
            },
            learningOutcomes: [],
            policies: {
                grading: [
                    { id: 'G-1', name: 'Quiz', weight: 40 },
                    { id: 'G-2', name: 'Final', weight: 60 }
                ]
            },
            assessments: [
                { id: 'A-quiz1', type: 'quiz', count: 1, rubricRequired: false, linkedOutcomes: [] },
                { id: 'A-final', type: 'exam', count: 1, rubricRequired: false, linkedOutcomes: [] }
            ],
            weeks: [
                { id: 'W-1', theme: 'Week 1', deliverables: ['A-quiz1#instance1'] },
                { id: 'W-2', theme: 'Week 2', deliverables: ['A-final#instance1'] }
            ]
        };
    });

    it('validates a valid model without conflicts', () => {
        const result = validateCourseModel(mockModel);
        expect(result.isValid).toBe(true);
        expect(result.conflicts).toHaveLength(0);
    });

    it('detects GRADING_SUM_INVALID when sum is less than 100', () => {
        mockModel.policies.grading[0].weight = 30; // 30 + 60 = 90
        const result = validateCourseModel(mockModel);
        expect(result.isValid).toBe(false);
        expect(result.conflicts).toHaveLength(1);
        expect(result.conflicts[0].type).toBe('GRADING_SUM_INVALID');
    });

    it('detects GRADING_SUM_INVALID when sum is greater than 100', () => {
        mockModel.policies.grading[0].weight = 50; // 50 + 60 = 110
        const result = validateCourseModel(mockModel);
        expect(result.isValid).toBe(false);
        expect(result.conflicts).toHaveLength(1);
        expect(result.conflicts[0].type).toBe('GRADING_SUM_INVALID');
    });

    it('detects MISSING_DELIVERABLE_SLOT when week references unknown assessment', () => {
        mockModel.weeks[0].deliverables.push('A-unknown#instance1');
        const result = validateCourseModel(mockModel);
        expect(result.isValid).toBe(false);
        expect(result.conflicts).toHaveLength(1);
        expect(result.conflicts[0].type).toBe('MISSING_DELIVERABLE_SLOT');
        expect(result.conflicts[0].message).toContain('A-unknown');
    });
});
