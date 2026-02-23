import { CourseModel } from '@/types/curriculum';
import { DeliverableGenerator, GeneratedSectionDraft } from '../engine/registry';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const CourseMapGen: DeliverableGenerator = {
  pluginId: 'CourseMapGen',
  displayName: 'Course Map',
  description: 'Generates the high-level course map and syllabus overview based on meta data, outcomes, and grading policies.',
  dependsOnPaths: [
    '/meta',
    '/learningOutcomes',
    '/policies/grading',
    '/assessments',
    '/weeks'
  ],
  generate: async (model: CourseModel): Promise<GeneratedSectionDraft[]> => {

    // We break the Course Map down into logical sections
    // 1. Course Information (Title, Meta)
    const infoSection = await generateSection(
      'info',
      ['/meta'],
      `Create a formal, engaging course description for "${model.meta.title}".
      Target Audience: ${model.meta.audience}.
      Duration: ${model.meta.durationWeeks} weeks.
      Format as Markdown. Do not include a main # Title, just the description.`
    );

    // 2. Learning Outcomes
    const outcomesSection = await generateSection(
      'outcomes',
      ['/learningOutcomes'],
      `List the following Learning Outcomes in a clear, bulleted markdown format:
      ${model.learningOutcomes.map(lo => `- ${lo.id}: ${lo.text}`).join('\n')}`
    );

    // 3. Grading Policy
    const gradingSection = await generateSection(
      'grading',
      ['/policies/grading'],
      `Create a clear markdown table showing the grading breakdown:
      ${model.policies.grading.map(g => `- ${g.name}: ${g.weight}%`).join('\n')}
      Include a brief encouraging sentence about grading at the end.`
    );

    return [
      {
        sectionKey: 'course-info',
        modelDependencies: ['/meta'],
        generatedContent: infoSection
      },
      {
        sectionKey: 'learning-outcomes',
        modelDependencies: ['/learningOutcomes'],
        generatedContent: outcomesSection
      },
      {
        sectionKey: 'grading-policy',
        modelDependencies: ['/policies/grading'],
        generatedContent: gradingSection
      }
    ];
  }
};

async function generateSection(id: string, paths: string[], prompt: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai('gpt-4o'),
      system: 'You are an expert curriculum designer. Generate formal, academic, and engaging markdown content based on the provided instructions. Output ONLY valid markdown.',
      prompt
    });
    return text;
  } catch (error) {
    console.error(`Error generating section ${id}:`, error);
    return `*Content generation failed for ${id}. Please try again later.*`;
  }
}
