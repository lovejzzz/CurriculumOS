import { CourseModel } from '@/types/curriculum';
import { DeliverableGenerator, GeneratedSectionDraft } from '../engine/registry';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const AccessibilityGen: DeliverableGenerator = {
    pluginId: 'AccessibilityGen',
    displayName: 'Accessible Syllabus',
    description: 'Acts as an accessibility expert. Generates an abbreviated, low-text-complexity version of the syllabus tailored for cognitive accessibility.',
    dependsOnPaths: [
        '/meta',
        '/learningOutcomes',
        '/policies'
    ],
    generate: async (model: CourseModel, currentVersion: number): Promise<GeneratedSectionDraft[]> => {
        const drafts: GeneratedSectionDraft[] = [];

        const prompt = `Act as an Accessibility Expert in Special Education.
    You will generate a highly accessible, low-cognitive-load Course Overview based on the following data:
    
    Course Title: ${model.meta.title}
    Audience: ${model.meta.audience}
    Duration: ${model.meta.durationWeeks} Weeks
    
    Learning Outcomes:
    ${model.learningOutcomes.map(lo => `- ${lo.text}`).join('\n')}
    
    Grading Breakdown:
    ${model.policies.grading.map(g => `- ${g.name}: ${g.weight}%`).join('\n')}
    
    Instructions:
    - Use simple, direct language (Plain English).
    - Limit sentences to 15 words or less.
    - Avoid jargon.
    - Use bullet points aggressively.
    - Format as Markdown.
    
    Start with an h2: "Easy to Read Course Guide".`;

        try {
            const { text } = await generateText({
                model: openai('gpt-4o'),
                system: 'You are an Accessibility Agent. You output ONLY valid markdown.',
                prompt
            });

            drafts.push({
                sectionKey: 'accessible-overview',
                modelDependencies: ['/meta', '/learningOutcomes', '/policies'],
                generatedContent: text
            });
        } catch (error) {
            console.error('Error generating Accessibility section:', error);
            drafts.push({
                sectionKey: 'accessible-overview',
                modelDependencies: ['/meta'],
                generatedContent: '*Accessibility Generation failed.*'
            });
        }

        return drafts;
    }
};
