/** author/prompts.ts — the system + user prompts for native typed authoring
 *  (Law 2). The model authors typed JSON from the first token; there is no
 *  prose intermediate. Trap #1: JSON-mode requires the literal word "JSON" in
 *  the prompt. The cadence-expansion rule (§A1) is stated explicitly because
 *  models transcribe "weekly quizzes" honestly as ONE entity (trap #2). */

export function authorASystem(): string {
  return [
    'You are a curriculum architect. You author the typed SKELETON of a course as strict JSON.',
    'Transcribe instructor-named things VERBATIM: course title, session titles named in the brief, assessment titles, reading titles. Never paraphrase or title-case them.',
    'RULE — cadence expansion: a "weekly" / "each week" assessment (quizzes, problem sets, journals, labs, responses) is cadence:"per-session" and its coveredSessions lists EVERY session it recurs in. Never collapse a recurring assessment into one entry.',
    'RULE — exams: every exam names coveredSessions (the lessons it covers).',
    'RULE — weights: transcribe stated weights; use null when a weight is not stated (do not invent). Graded weights should sum to 100 when stated.',
    'RULE — sessions: produce at least as many sessions as the brief implies (one per lesson/week).',
    'Return strict JSON matching: { courseTitle, discipline, term?, sessions:[{title}], assessments:[{title,kind,weightPct|null,cadence,announcedInSession,dueInSession,coveredSessions?}], readings:[{title,author?,locator?,kind,inSessions:[n]}], resources:[{title,kind,inSessions:[n]}] }.',
    'discipline is one of: stem-quant, stem-lab, cs, humanities, social-science, language, arts, business, health, education, general.',
    'kind is one of: quiz, exam, oral, in-class, graded-artifact, project, discussion.',
  ].join('\n');
}

export function authorAUser(brief: string, retry: boolean): string {
  return [
    retry
      ? 'Your previous skeleton was degenerate (a recurring assessment was not expanded per session, or too few sessions). Fix it: expand every weekly cadence to one entry per covered session, and produce one session per lesson.'
      : '',
    'Author the course skeleton as JSON for this brief:',
    '"""',
    brief,
    '"""',
  ]
    .filter(Boolean)
    .join('\n');
}

export function authorBSystem(): string {
  return [
    'You are a subject-matter author. For ONE session you author its concepts and learning outcomes as strict JSON.',
    'Outcomes are measurable and verb-classified by Bloom level (Remember, Understand, Apply, Analyze, Evaluate, Create).',
    'Concepts are the teachable ideas of the session (1–3), named so a knowledge base can recognize them.',
    'Return strict JSON: { sessionIndex, concepts:[{name}], outcomes:[{text,bloom}] }.',
  ].join('\n');
}

export function authorBUser(courseTitle: string, sessionIndex: number, sessionTitle: string): string {
  return [
    `Course: ${courseTitle}.`,
    `Author session ${sessionIndex} titled "${sessionTitle}" as JSON.`,
    'Give 1–3 concepts and 2–3 outcomes.',
  ].join('\n');
}
