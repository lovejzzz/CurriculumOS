import { mapIntentToPatches } from './intentMapper';
import { CourseModel, IntentOp } from '@/types/curriculum';

jest.mock('uuid', () => ({ v4: () => 'abcd1234-abcd-abcd-abcd-abcd1234abcd' }));

describe('intentMapper', () => {
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
                    { id: 'G-quiz', name: 'Quiz', weight: 10 }
                ]
            },
            assessments: [
                { id: 'A-quiz1', type: 'quiz', count: 1, rubricRequired: false, linkedOutcomes: [] }
            ],
            weeks: [
                { id: 'W-1', theme: 'Week 1', deliverables: ['A-quiz1#instance1'] },
                { id: 'W-2', theme: 'Week 2', deliverables: [] }
            ]
        };
    });

    it('maps ADD_ASSESSMENT correctly without weight or week', () => {
        const op: IntentOp = {
            op: 'ADD_ASSESSMENT',
            payload: { type: 'essay', linkedOutcomes: ['LO-1'] }
        };

        const patches = mapIntentToPatches(op, mockModel);

        expect(patches.length).toBe(1);
        expect(patches[0].op).toBe('add');
        expect(patches[0].path).toBe('/assessments/-');
        expect(patches[0].value).toMatchObject({
            type: 'essay',
            count: 1,
            rubricRequired: true,
            linkedOutcomes: ['LO-1']
        });
        // Check that ID starts with A-
        expect((patches[0].value as { id: string }).id).toMatch(/^A-[a-f0-9]{4}$/);
    });

    it('maps ADD_ASSESSMENT with weight and targetWeek correctly', () => {
        const op: IntentOp = {
            op: 'ADD_ASSESSMENT',
            payload: { type: 'project', weight: 20, targetWeek: 'W-2' }
        };

        const patches = mapIntentToPatches(op, mockModel);

        expect(patches.length).toBe(3);

        // Check assessment patch
        expect(patches[0].op).toBe('add');
        expect(patches[0].path).toBe('/assessments/-');
        const newId = (patches[0].value as { id: string }).id;

        // Check grading patch
        expect(patches[1].op).toBe('add');
        expect(patches[1].path).toBe('/policies/grading/-');
        expect(patches[1].value).toMatchObject({
            id: `G-${newId}`,
            name: 'project Assessment',
            weight: 20
        });

        // Check week deliverable patch
        expect(patches[2].op).toBe('add');
        expect(patches[2].path).toBe('/weeks/1/deliverables/-'); // Week W-2 is at index 1
        expect(patches[2].value).toBe(`${newId}#instance1`);
    });

    it('maps UPDATE_GRADING_WEIGHT correctly when grading policy exists', () => {
        const op: IntentOp = {
            op: 'UPDATE_GRADING_WEIGHT',
            payload: { assessmentId: 'G-quiz', newWeight: 25 }
        };

        const patches = mapIntentToPatches(op, mockModel);

        expect(patches.length).toBe(1);
        expect(patches[0].op).toBe('replace');
        expect(patches[0].path).toBe('/policies/grading/0/weight');
        expect(patches[0].value).toBe(25);
    });

    it('maps ADD_WEEK correctly when inserting after an existing week', () => {
        const op: IntentOp = {
            op: 'ADD_WEEK',
            payload: { insertAfterWeekId: 'W-1' }
        };

        const patches = mapIntentToPatches(op, mockModel);

        expect(patches.length).toBe(1);
        expect(patches[0].op).toBe('add');
        expect(patches[0].path).toBe('/weeks/1'); // Insert at index 1 (after W-1)
        expect((patches[0].value as { theme: string }).theme).toBe('New Theme');
    });

    it('maps REASSIGN_DELIVERABLE correctly', () => {
        const op: IntentOp = {
            op: 'REASSIGN_DELIVERABLE',
            payload: { assessmentInstanceId: 'A-quiz1#instance1', newWeekId: 'W-2' }
        };

        const patches = mapIntentToPatches(op, mockModel);

        expect(patches.length).toBe(2);
        // First remove from week 1
        expect(patches[0].op).toBe('remove');
        expect(patches[0].path).toBe('/weeks/0/deliverables/0');
        // Then add to week 2
        expect(patches[1].op).toBe('add');
        expect(patches[1].path).toBe('/weeks/1/deliverables/-');
        expect(patches[1].value).toBe('A-quiz1#instance1');
    });
});
