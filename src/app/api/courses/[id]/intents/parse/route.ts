import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { IntentOp } from '@/types/curriculum';

const intentSchema = z.object({
  ops: z.array(
    z.discriminatedUnion('op', [
      z.object({
        op: z.literal('ADD_ASSESSMENT'),
        payload: z.object({
          type: z.enum(['reflection', 'project', 'essay', 'quiz', 'exam']),
          linkedOutcomes: z.array(z.string()).optional(),
          targetWeek: z.string().optional().describe('The week ID where this is due, e.g., "W-3"'),
          weight: z.number().optional().describe('The percentage of the total grade')
        })
      }),
      z.object({
        op: z.literal('UPDATE_GRADING_WEIGHT'),
        payload: z.object({
          assessmentId: z.string().describe('The ID of the assessment or grading policy, e.g., "A-1" or "participation"'),
          newWeight: z.number().describe('The new weight percentage (0-100)')
        })
      }),
      z.object({
        op: z.literal('ADD_WEEK'),
        payload: z.object({
          insertAfterWeekId: z.string().describe('The ID of the week to insert after, e.g., "W-2"')
        })
      }),
      z.object({
        op: z.literal('REASSIGN_DELIVERABLE'),
        payload: z.object({
          assessmentInstanceId: z.string().describe('The instance ID, e.g., "A-1#instance1"'),
          newWeekId: z.string().describe('The new week ID, e.g., "W-4"')
        })
      })
    ])
  )
});

export async function POST(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    const body = await request.json();
    const { prompt } = body as { prompt: string };

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: intentSchema,
      system: `You are the Intent Parsing Engine for a Curriculum Operating System.
Your job is to translate the user's natural language requests regarding curriculum changes into structured API operations (IntentOps).
You do NOT generate the curriculum content. You only orchestrate the structural changes.

Rules:
1. Map the user's intent to one or more available tool calls.
2. If the user asks to "add an assignment", use the ADD_ASSESSMENT op.
3. If the user asks to change the weight of a grading policy, use the UPDATE_GRADING_WEIGHT op.
4. If a request is ambiguous, make the safest assumption based on standard pedagogical practices.`,
      prompt,
    });

    return NextResponse.json({ ops: object.ops });
  } catch (error) {
    console.error('Error parsing intent:', error);
    const err = error as Error;
    return NextResponse.json({
      error: 'INTENT_PARSE_FAILED',
      rawResponse: err.message || 'Unknown error during intent parsing'
    }, { status: 400 });
  }
}
