/** author/briefParse.ts — deterministic brief reading (pure, $0).
 *  Powers the Door's "heard so far" chips (intake stage runs free) and the
 *  fake ModelPort's skeleton. The REAL author stage still calls the model for
 *  the typed graph; this parser is the honest, traceable intake reflection (V2). */
import type { DisciplineLens } from '../schema/courseObject.ts';
import type { IntakeHeard } from './schema.ts';

const DISCIPLINE_CUES: { lens: DisciplineLens; cues: RegExp }[] = [
  { lens: 'cs', cues: /\b(python|programming|computer science|coding|algorithm|software)\b/i },
  { lens: 'stem-lab', cues: /\b(geology|chemistry|biology|lab|specimen|mineral|rock)\b/i },
  { lens: 'stem-quant', cues: /\b(statistics|calculus|physics|astronomy|mathematics|probability)\b/i },
  { lens: 'language', cues: /\b(mandarin|spanish|french|language|pinyin|vocabulary|conversation)\b/i },
  { lens: 'humanities', cues: /\b(literature|philosophy|history|poetry|essay|seminar|reading responses)\b/i },
  { lens: 'business', cues: /\b(business|marketing|finance|ethics|management|economics of the firm)\b/i },
  { lens: 'health', cues: /\b(nursing|nutrition|anatomy|physiology|clinical|patient|health)\b/i },
  { lens: 'arts', cues: /\b(music|art history|studio|painting|composition|theory)\b/i },
  { lens: 'social-science', cues: /\b(economics|microeconomics|macroeconomics|psychology|sociology|political)\b/i },
  { lens: 'education', cues: /\b(pedagogy|curriculum|teaching practicum|classroom management)\b/i },
];

export function inferDiscipline(brief: string): DisciplineLens {
  for (const { lens, cues } of DISCIPLINE_CUES) if (cues.test(brief)) return lens;
  return 'general';
}

/** Lesson/week count — prefers the "NN-lesson"/"NN lesson" form (high
 *  confidence), then "NN weeks". */
export function detectWeeks(brief: string): number | undefined {
  const lesson = brief.match(/(\d{1,2})\s*-?\s*lesson/i);
  if (lesson?.[1]) return parseInt(lesson[1], 10);
  const weeks = brief.match(/(\d{1,2})\s*weeks?\b/i);
  if (weeks?.[1]) return parseInt(weeks[1], 10);
  return undefined;
}

const ASSESSMENT_CUES = [
  { re: /\bweekly\s+(?:\w+\s+){0,2}(problem sets?|quizzes|journals?|labs?|reading responses?|responses?|data labs?|case studies|case discussions?|coding labs?)\b/gi, weekly: true },
  { re: /\b(two|2)\s+midterms?\b/gi, weekly: false, label: 'two midterms' },
  { re: /\bmidterm(?:\s+exam)?\b/gi, weekly: false, label: 'midterm' },
  { re: /\bfinal\s+(exam|project|paper|performance|presentation|diet-analysis project|data-analysis project)\b/gi, weekly: false },
  { re: /\bcomprehensive\s+(review|final)\b/gi, weekly: false, label: 'final exam' },
];

export function detectAssessments(brief: string): string[] {
  const found = new Set<string>();
  for (const cue of ASSESSMENT_CUES) {
    const matches = brief.match(cue.re);
    if (matches) for (const m of matches) found.add(cue.label ?? m.trim().toLowerCase());
  }
  return [...found];
}

/** Named readings — capitalized titles, "ch. N", and known canon markers. */
export function detectReadings(brief: string): string[] {
  const out = new Set<string>();
  // "Title ch. 1-4" or "Title chapters …"
  const chap = brief.matchAll(/\b([A-Z][A-Za-z'’]+(?:\s+[A-Z][A-Za-z'’]+){0,4})\s+(?:ch\.?|chapters?)\s*[\d–-]+/g);
  for (const m of chap) if (m[1]) out.add(m[0].trim());
  // "reads X" / "reads The Y" from the grounding fixture
  const reads = brief.matchAll(/\breads?\s+([A-Z][A-Za-z'’]+(?:\s+(?:of|the|and|[A-Z][A-Za-z'’]+)){0,5})/g);
  for (const m of reads) if (m[1]) out.add(m[1].trim());
  return [...out].slice(0, 12);
}

export function parseBrief(brief: string): IntakeHeard {
  const weeks = detectWeeks(brief);
  return {
    ...(weeks !== undefined ? { weeks } : {}),
    assessments: detectAssessments(brief),
    readings: detectReadings(brief),
    discipline: inferDiscipline(brief),
  };
}
