/** author/schema.ts — the typed JSON the model authors (Law 2: no prose
 *  intermediate). Pass A authors the skeleton; Pass B authors per-session
 *  content. Both fake and real ModelPorts return exactly these shapes; zod
 *  validates at the boundary before anything reaches the assembler. */
import { z } from 'zod';

export const disciplineEnum = z.enum([
  'stem-quant',
  'stem-lab',
  'cs',
  'humanities',
  'social-science',
  'language',
  'arts',
  'business',
  'health',
  'education',
  'general',
]);

export const passASchema = z.object({
  courseTitle: z.string().min(1),
  discipline: disciplineEnum,
  term: z.string().optional(),
  sessions: z.array(z.object({ title: z.string().min(1) })).min(1),
  assessments: z
    .array(
      z.object({
        title: z.string().min(1),
        kind: z.enum(['quiz', 'exam', 'oral', 'in-class', 'graded-artifact', 'project', 'discussion']),
        weightPct: z.number().min(0).max(100).nullable(),
        cadence: z.enum(['once', 'per-session']),
        announcedInSession: z.number().int().min(1),
        dueInSession: z.number().int().min(1),
        coveredSessions: z.array(z.number().int().min(1)).optional(),
      }),
    )
    .min(1),
  readings: z
    .array(
      z.object({
        title: z.string().min(1),
        author: z.string().optional(),
        locator: z.string().optional(),
        kind: z.enum(['book', 'article', 'chapter', 'media', 'website', 'dataset']),
        inSessions: z.array(z.number().int().min(1)).min(1),
      }),
    )
    .default([]),
  resources: z
    .array(
      z.object({
        title: z.string().min(1),
        kind: z.enum(['tool', 'software', 'equipment', 'site', 'document']),
        inSessions: z.array(z.number().int().min(1)).min(1),
      }),
    )
    .default([]),
});
export type PassA = z.infer<typeof passASchema>;

export const passBSchema = z.object({
  sessionIndex: z.number().int().min(1),
  concepts: z.array(z.object({ name: z.string().min(1) })).min(1),
  outcomes: z
    .array(
      z.object({
        text: z.string().min(1),
        bloom: z.enum(['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']),
      }),
    )
    .min(1),
});
export type PassB = z.infer<typeof passBSchema>;

export const intakeSchema = z.object({
  weeks: z.number().int().optional(),
  assessments: z.array(z.string()).default([]),
  readings: z.array(z.string()).default([]),
  discipline: z.string().optional(),
});
export type IntakeHeard = z.infer<typeof intakeSchema>;
