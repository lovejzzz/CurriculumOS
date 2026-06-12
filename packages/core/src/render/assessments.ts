/** render/assessments.ts — assignments (briefs), rubrics, quizBank.
 *  Brief criteria mirror the rubric 1:1 (040); quiz texture rotates phrasings
 *  so no 8-word shingle repeats ≥12× (the v0.14.6 scar, trap #9). */
import type { Assessment, Concept, Course, Kernel, Session } from '../schema/courseObject.ts';
import { rotate } from '../util.ts';
import { LENSES } from './templates/lenses.ts';
import { MC_CORRECT_STEMS, MC_EXPLANATION_LEADS, MC_QUESTION_FRAMES, DISTRACTOR_UNRELATED, DISTRACTOR_OTHER } from './templates/phrasing.ts';
import { readingsForSession, readingLabel, voiceBlock, rubricPoints } from './helpers.ts';
import { weightScheme } from './weights.ts';
import type { RenderBlock, RenderedArtifact } from './types.ts';

function sessionOf(course: Course, id: string): Session | undefined {
  return course.graph.sessions.find((s) => s.id === id);
}
function conceptsOfSession(course: Course, sessionId: string): Concept[] {
  const s = sessionOf(course, sessionId);
  if (!s) return [];
  return s.conceptIds.map((id) => course.graph.concepts.find((c) => c.id === id)).filter((c): c is Concept => !!c);
}
function kernelFor(course: Course, conceptId: string): Kernel | undefined {
  return course.overlays.kernels[conceptId as never];
}

/** The four rubric criteria names — shared by brief (Criteria) and rubric so
 *  they mirror 1:1 by name (040 spec). */
function criteriaNames(course: Course): string[] {
  const lens = LENSES[course.graph.discipline];
  return [
    `Command of ${lens.deliverable} content`,
    'Use of evidence and sources',
    'Reasoning and structure',
    'Clarity and conventions',
  ];
}

export function renderBrief(course: Course, a: Assessment): RenderedArtifact {
  const s = sessionOf(course, a.sessionId)!;
  const dueSession = sessionOf(course, a.dueSessionId);
  const concepts = conceptsOfSession(course, a.sessionId);
  const readings = readingsForSession(course, a.sessionId);
  const lens = LENSES[course.graph.discipline];
  const blocks: RenderBlock[] = [];

  blocks.push({
    kind: 'header',
    entityId: a.id,
    heading: `${a.id} · ${a.title}`,
    text: `Weight: ${a.weightPct ?? 'per instructor'}% · Due: ${a.dueSessionId} ${dueSession?.title ?? ''}`,
  });

  // Context — the highest-value voice slot in the product
  const k = concepts.map((c) => kernelFor(course, c.id)).find(Boolean);
  const compiledContext =
    `This ${lens.deliverable} asks you to apply ${(concepts[0]?.name ?? s.title).toLowerCase()}. ` +
    (k ? `${k.definition} ` : '') +
    `Ground your work in the session's materials.`;
  blocks.push(voiceBlock(course, `brief:${s.id}:context`, 'context', compiledContext, 'Context'));

  blocks.push({
    kind: 'task',
    heading: 'Task',
    text: `${rotate(lens.signatureVerbs, s.index).replace(/^./, (c) => c.toUpperCase())} a ${lens.deliverable} that demonstrates mastery of ${a.title.toLowerCase()}.`,
  });
  blocks.push({
    kind: 'deliverables',
    heading: 'Deliverables',
    text: `Submit one ${lens.deliverable}. Follow the format and length your instructor specifies.`,
  });
  // Criteria MUST mirror the rubric criteria 1:1 by name
  blocks.push({ kind: 'criteria', heading: 'Criteria', rows: criteriaNames(course).map((c, i) => [`${i + 1}`, c]) });

  if (readings.length) {
    blocks.push({ kind: 'sources', heading: 'Sources', rows: readings.map((r) => [r.id, readingLabel(r)]) });
  }

  return { kind: 'assignments', scope: a.id, title: `${a.id} ${a.title} — Brief`, blocks, surfaces: [`brief:${s.id}:context`] };
}

export function renderRubric(course: Course, a: Assessment): RenderedArtifact {
  const names = criteriaNames(course);
  const levels = ['Exemplary', 'Proficient', 'Developing', 'Beginning'];
  // weight from the scheme (stated, or suggested) so the rubric agrees with the syllabus
  const scheme = weightScheme(course);
  const effectiveWeight = scheme.byId[a.id] ?? a.weightPct;
  const pts = rubricPoints(effectiveWeight);
  const per = pts / names.length;
  const weightLabel = effectiveWeight != null ? `${effectiveWeight}%${scheme.suggested ? ' (suggested)' : ''}` : 'per instructor';
  const blocks: RenderBlock[] = [];

  blocks.push({
    kind: 'header',
    entityId: a.id,
    heading: `${a.id} · ${a.title} — Rubric`,
    text: `Total: ${pts} points · Weight: ${weightLabel}`,
  });

  // 4 criteria × 4 levels, behavior-anchored descriptors
  const anchored = (criterion: string, level: string): string => {
    const lc = criterion.toLowerCase();
    switch (level) {
      case 'Exemplary':
        return `Work consistently demonstrates ${lc} with no significant gaps.`;
      case 'Proficient':
        return `Work demonstrates ${lc} with minor, non-substantive gaps.`;
      case 'Developing':
        return `Work shows partial ${lc}; key elements are missing or unclear.`;
      default:
        return `Work shows little evidence of ${lc}.`;
    }
  };
  blocks.push({
    kind: 'rubric-grid',
    rows: [
      ['Criterion', ...levels, 'Points'],
      ...names.map((c) => [c, ...levels.map((l) => anchored(c, l)), per.toFixed(1)]),
    ],
  });

  return { kind: 'rubrics', scope: a.id, title: `${a.id} ${a.title} — Rubric`, blocks, surfaces: [] };
}

function mcItem(course: Course, concept: Concept, idx: number, ns: string, misconceptionIdx = 0): RenderBlock {
  const k = kernelFor(course, concept.id);
  const m = k?.misconceptions[misconceptionIdx % Math.max(1, k.misconceptions.length)];
  const correct = m?.correction ?? k?.definition ?? `${concept.name} as defined in this session.`;
  const wrong = m?.claim ?? `A common misunderstanding of ${concept.name}.`;
  // distractors rotate by item index so no fixed option string repeats across a section (trap #9)
  const distractors = [
    wrong,
    `${rotate(DISTRACTOR_UNRELATED, idx).replace('%s', concept.name)}.`,
    `${rotate(DISTRACTOR_OTHER, idx + 1).replace('%s', concept.name)}.`,
  ];
  // the correct option's POSITION rotates deterministically — an answer key
  // that always reads "A" is a real defect the judge failed (V0.0.4 round)
  const correctPos = idx % 4;
  const options = [...distractors];
  options.splice(correctPos, 0, correct);
  const letter = String.fromCharCode(65 + correctPos);
  return {
    kind: 'mc',
    entityId: concept.id,
    heading: `${ns}.${idx} (multiple choice)`,
    text: rotate(MC_QUESTION_FRAMES, idx).replace('%s', concept.name),
    rows: options.map((o, i) => [String.fromCharCode(65 + i), o]),
    meta: {
      answer: letter,
      // rotate the correct-answer phrasing and explanation lead so no shingle repeats (trap #9)
      explanation: `${rotate(MC_CORRECT_STEMS, idx)} ${letter}. ${rotate(MC_EXPLANATION_LEADS, idx + 1)} ${correct}`,
    },
  };
}

/** Render one authored Pass C item to a quiz block. The correct option's
 *  position rotates deterministically — models habitually list the correct
 *  answer first, and an all-A key is a real defect (the V0.0.4 judge). */
function authoredItemBlock(item: import('../schema/courseObject.ts').AssessmentItem, ns: string, n: number): RenderBlock {
  if (item.kind === 'mc' && item.options) {
    const correct = item.options.filter((o) => o.correct);
    const distractors = item.options.filter((o) => !o.correct);
    const correctPos = correct.length === 1 ? n % item.options.length : Math.max(0, item.options.findIndex((o) => o.correct));
    const arranged = correct.length === 1 ? [...distractors.slice(0, correctPos), ...correct, ...distractors.slice(correctPos)] : item.options;
    const letter = String.fromCharCode(65 + arranged.findIndex((o) => o.correct));
    return {
      kind: 'mc',
      entityId: item.conceptId,
      heading: `${ns}.${n} (multiple choice)`,
      text: item.stem,
      rows: arranged.map((o, i) => [String.fromCharCode(65 + i), o.text]),
      meta: { answer: `${letter} — ${item.answerKey}`, explanation: `Correct: ${letter}. ${item.answerKey}` },
    };
  }
  return {
    kind: item.kind === 'applied' ? 'applied' : 'short-answer',
    entityId: item.conceptId,
    heading: `${ns}.${n} (${item.kind === 'applied' ? 'applied' : 'short answer'})`,
    text: item.stem,
    meta: { answer: item.answerKey },
  };
}

export function renderQuiz(course: Course, s: Session): RenderedArtifact {
  const ns = `Q${s.index}`;
  const blocks: RenderBlock[] = [{ kind: 'header', entityId: s.id, heading: `${s.id} ${s.title} — Quiz`, text: `Item namespace: ${ns}` }];

  // Pass C authored items take precedence when present (V0.0.3); otherwise the
  // compiled items below are the fallback (counted in the receipt).
  const authored = course.overlays.items?.[s.id];
  if (authored && authored.length >= 4) {
    authored.forEach((item, i) => blocks.push(authoredItemBlock(item, ns, i + 1)));
    return { kind: 'quizBank', scope: s.id, title: `${s.id} ${s.title} — Quiz`, blocks, surfaces: [] };
  }

  // ── compiled fallback ──
  const concepts = conceptsOfSession(course, s.id);
  let n = 1;
  // ≥6 items: MC (4 options), short answer, one applied — Bloom mix Understand+Apply.
  // Each misconception powers its own MC item (plurality there = variety here).
  for (const c of concepts.slice(0, 3)) {
    const k = kernelFor(course, c.id);
    const mCount = Math.min(2, k?.misconceptions.length ?? 1);
    for (let mi = 0; mi < mCount && n <= 5; mi++) {
      blocks.push(mcItem(course, c, n++, ns, mi));
    }
  }
  while (blocks.length < 5) {
    const c = concepts[0];
    blocks.push({ kind: 'short-answer', heading: `${ns}.${n} (short answer)`, text: `Explain ${c?.name ?? s.title} in your own words.`, meta: { answer: `A correct answer references the session's definition of ${c?.name ?? s.title}.` }, entityId: c?.id });
    n++;
  }
  const applied = concepts.find((c) => kernelFor(course, c.id)?.workedExample);
  const ak = applied ? kernelFor(course, applied.id) : undefined;
  blocks.push({
    kind: 'applied',
    entityId: applied?.id,
    heading: `${ns}.${n++} (applied)`,
    text: ak?.workedExample ? `${ak.workedExample.setup}` : `Apply ${concepts[0]?.name ?? s.title} to a new situation of your choosing.`,
    meta: { answer: ak?.workedExample ? ak.workedExample.answer : 'Answers vary; must apply the concept correctly.' },
  });
  blocks.push({ kind: 'short-answer', heading: `${ns}.${n++} (short answer)`, text: `Describe one common error related to ${concepts[0]?.name ?? s.title} and how to avoid it.`, meta: { answer: 'References a misconception from the session.' } });

  return { kind: 'quizBank', scope: s.id, title: `${s.id} ${s.title} — Quiz`, blocks, surfaces: [] };
}

export function renderExam(course: Course, a: Assessment): RenderedArtifact {
  const covered = a.coveredSessionIds ?? [a.sessionId];
  const ns = `EX${a.id.replace(/[^0-9]/g, '')}`;
  const coveredSessions = covered
    .map((id) => course.graph.sessions.find((s) => s.id === id))
    .filter((s): s is Session => !!s)
    .sort((x, y) => x.index - y.index);
  const scopeLine = coveredSessions.length
    ? `Lessons ${coveredSessions[0]!.index}–${coveredSessions[coveredSessions.length - 1]!.index}`
    : 'Course scope';
  const blocks: RenderBlock[] = [
    { kind: 'header', entityId: a.id, heading: `${a.id} · ${a.title}`, text: `${scopeLine} · Weight: ${a.weightPct ?? 'per instructor'}%` },
  ];
  let n = 1;
  // ≥10 items, ≥1 per covered session, mixed types incl. short answer + essay;
  // concept choice and misconception rotate so items vary across the exam
  for (const s of coveredSessions) {
    const concepts = conceptsOfSession(course, s.id);
    const c = concepts[(n - 1) % Math.max(1, concepts.length)];
    if (c) blocks.push(mcItem(course, c, n, ns, (n - 1) % 2));
    n++;
  }
  // top up to 10 with short answers across covered sessions
  let guard = 0;
  while (blocks.length - 1 < 9 && guard < 40) {
    const s = coveredSessions[(n - 1) % Math.max(1, coveredSessions.length)];
    const concepts = s ? conceptsOfSession(course, s.id) : [];
    const c = concepts[0];
    blocks.push({ kind: 'short-answer', entityId: c?.id, heading: `${ns}.${n} (short answer)`, text: `Explain ${c?.name ?? s?.title ?? 'a key concept'} and give an example.`, meta: { answer: 'References the session definition with a correct example.' } });
    n++;
    guard++;
  }
  // essay keyed on rubric hints
  blocks.push({
    kind: 'essay',
    heading: `${ns}.${n} (essay)`,
    text: `Synthesize the major ideas across ${scopeLine.toLowerCase()} into a coherent argument.`,
    meta: { answer: 'Rubric hints: thesis clarity, correct use of ≥3 concepts, evidence, organization.' },
  });

  return { kind: 'quizBank', scope: a.id, title: `${a.id} ${a.title} — Exam`, blocks, surfaces: [] };
}
