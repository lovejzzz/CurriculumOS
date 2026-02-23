import { CourseModel } from '@/types/curriculum';
import { DeliverableGenerator, GeneratedSectionDraft } from '../engine/registry';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const WeeklyPlanGen: DeliverableGenerator = {
    pluginId: 'WeeklyPlanGen',
    displayName: 'Weekly Plan',
    description: 'Generates the detailed weekly schedule including themes and deliverables for each week.',
    dependsOnPaths: [
        '/weeks',
        '/assessments'
    ],
    generate: async (model: CourseModel): Promise<GeneratedSectionDraft[]> => {
        const drafts: GeneratedSectionDraft[] = [];

        const assessmentsMap = new Map(model.assessments.map(a => [a.id, a]));

        for (const week of model.weeks) {
            const weekDeliverablesDetailed = week.deliverables.map(dId => {
                const baseAId = dId.split('#')[0];
                const assessment = assessmentsMap.get(baseAId);
                return `${dId} (${assessment ? assessment.type : 'Unknown Type'})`;
            });

            const prompt = `Create a detailed and engaging weekly schedule for the following week block.
      Theme: ${week.theme}
      Deliverables: ${weekDeliverablesDetailed.length > 0 ? weekDeliverablesDetailed.join(', ') : 'None'}
      
      Format as Markdown. Start with an encouraging paragraph introducing the theme, followed by a bulleted checklist of the deliverables if any. Do not use an h1 heading. Use an h3 for the week title (e.g., ### Week [X]: ${week.theme}).`;

            try {
                const { text } = await generateText({
                    model: openai('gpt-4o'),
                    system: 'You are an expert curriculum designer. Generate formal, academic, and engaging markdown content based on the provided instructions. Output ONLY valid markdown.',
                    prompt
                });

                drafts.push({
                    sectionKey: `week-${week.id}`,
                    modelDependencies: [`/weeks/${model.weeks.indexOf(week)}`],
                    generatedContent: text
                });
            } catch (error) {
                console.error(`Error generating section for week ${week.id}:`, error);
                drafts.push({
                    sectionKey: `week-${week.id}`,
                    modelDependencies: [`/weeks/${model.weeks.indexOf(week)}`],
                    generatedContent: `*Generation failed for ${week.theme}.*`
                });
            }
        }

        if (drafts.length === 0) {
            drafts.push({
                sectionKey: 'no-weeks',
                modelDependencies: ['/weeks'],
                generatedContent: '*No weeks defined in the curriculum yet.*'
            });
        }

        return drafts;
    }
};
