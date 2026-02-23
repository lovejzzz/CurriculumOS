import { CourseModel } from '@/types/curriculum';
import { DeliverableGenerator, GeneratedSectionDraft } from '../engine/registry';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const AssessmentQAGen: DeliverableGenerator = {
    pluginId: 'AssessmentQAGen',
    displayName: 'Assessment QA & Rubrics',
    description: 'Acts as an assessment expert. Generates grading rubrics and multiple-choice question banks aligned to Bloom\'s Taxonomy.',
    dependsOnPaths: [
        '/assessments',
        '/learningOutcomes'
    ],
    generate: async (model: CourseModel): Promise<GeneratedSectionDraft[]> => {
        const drafts: GeneratedSectionDraft[] = [];

        const outcomesMap = new Map(model.learningOutcomes.map(lo => [lo.id, lo.text]));
        const assessments = model.assessments;

        if (assessments.length === 0) {
            return [{
                sectionKey: 'no-assessments',
                modelDependencies: ['/assessments'],
                generatedContent: '*No assessments defined in the curriculum yet.*'
            }];
        }

        for (const assessment of assessments) {
            const linkedOutcomesTexts = assessment.linkedOutcomes.map(id => outcomesMap.get(id) || id);

            let prompt = '';
            if (assessment.type === 'quiz' || assessment.type === 'exam') {
                prompt = `Act as an expert in psychometrics and instructional design. 
        Assessment Type: ${assessment.type}
        Linked Learning Outcomes: ${linkedOutcomesTexts.length > 0 ? linkedOutcomesTexts.join('; ') : 'None specified'}
        
        Generate a set of 5 multiple-choice questions aligned with these outcomes using Bloom's Taxonomy.
        For each question, provide:
        - The question stem
        - 4 plausible options (A, B, C, D)
        - The correct answer and a brief rationale.
        
        Format as Markdown, starting with an h3 heading for this assessment.`;
            } else if (assessment.rubricRequired) {
                prompt = `Act as an expert in instructional design.
        Assessment Type: ${assessment.type}
        Linked Learning Outcomes: ${linkedOutcomesTexts.length > 0 ? linkedOutcomesTexts.join('; ') : 'None specified'}
        
        Generate a comprehensive analytic grading rubric for this assessment. Include 4 proficiency levels (e.g., Exemplary, Proficient, Developing, Beginning) and 3-4 criteria based on the linked outcomes.
        
        Format as a strictly valid Markdown table, starting with an h3 heading for this assessment's rubric.`;
            } else {
                continue;
            }

            try {
                const { text } = await generateText({
                    model: openai('gpt-4o'),
                    system: 'You are an Assessment Expert Agent. Output ONLY valid markdown.',
                    prompt
                });

                drafts.push({
                    sectionKey: `qa-${assessment.id}`,
                    modelDependencies: [`/assessments/${model.assessments.indexOf(assessment)}`],
                    generatedContent: text
                });
            } catch (error) {
                console.error(`Error generating QA section for assessment ${assessment.id}:`, error);
                drafts.push({
                    sectionKey: `qa-${assessment.id}`,
                    modelDependencies: [`/assessments/${model.assessments.indexOf(assessment)}`],
                    generatedContent: `*QA Generation failed for assessment ${assessment.id}.*`
                });
            }
        }

        return drafts;
    }
};
