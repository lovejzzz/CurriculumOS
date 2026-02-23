import { CourseModel } from '@/types/curriculum';
import { DeliverableGenerator, GeneratedSectionDraft } from '../engine/registry';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const AssignmentPackGen: DeliverableGenerator = {
    pluginId: 'AssignmentPackGen',
    displayName: 'Assignment Pack',
    description: 'Generates detailed prompts and instructions for major assignments based on the assessment type and linked outcomes.',
    dependsOnPaths: [
        '/assessments',
        '/learningOutcomes'
    ],
    generate: async (model: CourseModel): Promise<GeneratedSectionDraft[]> => {
        const drafts: GeneratedSectionDraft[] = [];

        const outcomesMap = new Map(model.learningOutcomes.map(lo => [lo.id, lo.text]));
        const majorAssessments = model.assessments.filter(a => ['essay', 'project', 'reflection'].includes(a.type.toLowerCase()));

        if (majorAssessments.length === 0) {
            return [{
                sectionKey: 'no-major-assignments',
                modelDependencies: ['/assessments'],
                generatedContent: '*No major assignments (essay, project, reflection) found in the course model.*'
            }];
        }

        for (const assessment of majorAssessments) {
            const linkedOutcomesTexts = assessment.linkedOutcomes.map(id => outcomesMap.get(id) || id);

            const prompt = `Create a detailed assignment instruction prompt.
      Assessment Type: ${assessment.type}
      Quantity: ${assessment.count}
      Linked Learning Outcomes: ${linkedOutcomesTexts.length > 0 ? linkedOutcomesTexts.join('; ') : 'None specified'}
      
      Format as Markdown. Include the following sections:
      - **Objective**: Tied to the learning outcomes.
      - **Instructions**: Step-by-step what the student needs to do.
      - **Deliverable Format**: What to submit.
      
      Start with an h3 heading for the assignment.`;

            try {
                const { text } = await generateText({
                    model: openai('gpt-4o'),
                    system: 'You are an expert curriculum designer. Generate formal, academic, and engaging markdown content based on the provided instructions. Output ONLY valid markdown.',
                    prompt
                });

                drafts.push({
                    sectionKey: `assessment-${assessment.id}`,
                    modelDependencies: [`/assessments/${model.assessments.indexOf(assessment)}`],
                    generatedContent: text
                });
            } catch (error) {
                console.error(`Error generating section for assessment ${assessment.id}:`, error);
                drafts.push({
                    sectionKey: `assessment-${assessment.id}`,
                    modelDependencies: [`/assessments/${model.assessments.indexOf(assessment)}`],
                    generatedContent: `*Generation failed for assessment ${assessment.id}.*`
                });
            }
        }

        return drafts;
    }
};
