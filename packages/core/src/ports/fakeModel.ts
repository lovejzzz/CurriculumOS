/** ports/fakeModel.ts — a deterministic ModelPort (no effects; replay-safe).
 *  It authors a valid, NON-degenerate typed graph from the brief so the whole
 *  pipeline round-trips through every machine state with a fake model (M0 bar)
 *  and the Crucible can drive a build without spending a cent. The real
 *  OpenAI port (packages/api) returns the SAME shapes. */
import type { ModelPort, ModelRequest, ModelResult } from './index.ts';
import type { PassA, PassB } from '../author/schema.ts';
import { detectWeeks, inferDiscipline } from '../author/briefParse.ts';

function topicsFromBrief(brief: string): string[] {
  const m = brief.match(/lessons?\s+cover[:\s]+(.*?)(?:\.\s*(?:Course materials|Required readings|$)|$)/is);
  if (!m?.[1]) return [];
  return m[1]
    .split(/;|—|(?:,\s+and\s+)/)
    .map((t) =>
      t
        .replace(/\band\b\s*$/i, '')
        .replace(/^\s*(?:a|an|the)\s+/i, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((t) => t.length > 2)
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1));
}

function titleCaseTopic(t: string): string {
  return t.length > 64 ? t.slice(0, 61).trimEnd() + '…' : t;
}

export function fakePassA(brief: string): PassA {
  const discipline = inferDiscipline(brief);
  const weeks = detectWeeks(brief) ?? 12;
  let topics = topicsFromBrief(brief);
  if (topics.length === 0) {
    topics = Array.from({ length: weeks }, (_, i) => `Core topic ${i + 1}`);
  }
  // pad or trim to the stated week count (sessions >= weeks — §A2)
  if (topics.length < weeks) {
    while (topics.length < weeks) topics.push(`Review and synthesis ${topics.length + 1}`);
  } else if (topics.length > weeks) {
    topics = topics.slice(0, weeks);
  }
  const sessions = topics.map((t) => ({ title: titleCaseTopic(t) }));

  const titleMatch = brief.match(/^([^,]+?),\s+a\s+\d/i) ?? brief.match(/^([^,]+),/);
  const courseTitle = (titleMatch?.[1] ?? 'Untitled Course').trim();

  const n = sessions.length;
  const midtermSession = Math.max(1, Math.round(n / 2));
  const lower = brief.toLowerCase();

  const assessments: PassA['assessments'] = [];

  // weekly cadence (problem sets / quizzes / labs / responses) — expands per session (§A1)
  const weeklyKind = /quiz/.test(lower)
    ? ('quiz' as const)
    : /problem set|data lab|diet-analysis lab/.test(lower)
      ? ('graded-artifact' as const)
      : /reading response|close-reading|case (discussion|stud)|discussion/.test(lower)
        ? ('discussion' as const)
        : /lab/.test(lower)
          ? ('graded-artifact' as const)
          : ('quiz' as const);
  if (/weekly|each week/.test(lower)) {
    assessments.push({
      title: weeklyKind === 'quiz' ? 'Weekly quiz' : weeklyKind === 'discussion' ? 'Weekly response' : 'Weekly assignment',
      kind: weeklyKind,
      weightPct: 30,
      cadence: 'per-session',
      announcedInSession: 1,
      dueInSession: 1,
      coveredSessions: sessions.map((_, i) => i + 1),
    });
  }

  // midterm
  if (/midterm/.test(lower)) {
    const twoMid = /\b(two|2)\s+midterms?/.test(lower);
    const covered = Array.from({ length: midtermSession }, (_, i) => i + 1);
    assessments.push({
      title: 'Midterm exam',
      kind: 'exam',
      weightPct: twoMid ? 20 : 30,
      cadence: 'once',
      announcedInSession: 1,
      dueInSession: midtermSession,
      coveredSessions: covered,
    });
    if (twoMid) {
      assessments.push({
        title: 'Midterm exam 2',
        kind: 'exam',
        weightPct: 20,
        cadence: 'once',
        announcedInSession: midtermSession,
        dueInSession: Math.max(midtermSession + 1, Math.round((3 * n) / 4)),
        coveredSessions: Array.from({ length: Math.round((3 * n) / 4) - midtermSession }, (_, i) => midtermSession + 1 + i),
      });
    }
  }

  // final — exam or project depending on the brief
  const finalIsProject = /final\s+(project|paper|diet-analysis project|data-analysis project|presentation)/.test(lower);
  const finalIsPerformance = /final\s+oral|oral performance/.test(lower);
  const remaining = Math.max(10, 100 - assessments.reduce((s, a) => s + (a.weightPct ?? 0), 0));
  assessments.push(
    finalIsPerformance
      ? { title: 'Final oral performance', kind: 'oral', weightPct: remaining, cadence: 'once', announcedInSession: 1, dueInSession: n }
      : finalIsProject
        ? { title: 'Final project', kind: 'project', weightPct: remaining, cadence: 'once', announcedInSession: Math.max(1, n - 2), dueInSession: n }
        : {
            title: 'Final exam',
            kind: 'exam',
            weightPct: remaining,
            cadence: 'once',
            announcedInSession: 1,
            dueInSession: n,
            coveredSessions: sessions.map((_, i) => i + 1),
          },
  );

  // normalize graded weights to 100 deterministically
  const total = assessments.reduce((s, a) => s + (a.weightPct ?? 0), 0);
  if (total !== 100 && total > 0) {
    const last = assessments[assessments.length - 1]!;
    last.weightPct = Math.max(0, (last.weightPct ?? 0) + (100 - total));
  }

  // readings from the grounding fixture's "Week N reads X" and "Title ch. N"
  const readings: PassA['readings'] = [];
  const readsRe = /week\s+(\d{1,2})\s+reads?\s+([A-Z][^.;]+?)(?=[.;]|\s+Week\s+\d|$)/gi;
  for (const m of brief.matchAll(readsRe)) {
    const wk = parseInt(m[1]!, 10);
    if (wk >= 1 && wk <= n && m[2]) readings.push({ title: m[2].trim(), kind: 'book', inSessions: [wk] });
  }
  const chapRe = /\b([A-Z][A-Za-z'’]+(?:\s+[A-Z][A-Za-z'’]+){0,3})\s+ch\.?\s*([\d–-]+)/g;
  for (const m of brief.matchAll(chapRe)) {
    if (m[1]) readings.push({ title: m[1].trim(), kind: 'chapter', locator: `ch. ${m[2]}`, inSessions: [Math.min(3, n)] });
  }

  // resources: lab/studio/clinical courses name supporting materials per session
  // (A3). Emitting these in the FAKE keeps the deterministic suite exercising
  // the same assembler paths the real model hits — the V0.0.1 audit's hidden
  // readings/resources crash would have been caught here, not in a real round.
  const resources: PassA['resources'] = [];
  const resourceCue = /\b(lab|kit|specimen|studio|clinical|equipment|software|instrument)\b/i.exec(lower);
  if (resourceCue) {
    const kind: PassA['resources'][number]['kind'] = /software/.test(lower) ? 'software' : /kit|specimen|instrument|equipment/.test(lower) ? 'equipment' : 'document';
    for (let wk = 1; wk <= n; wk++) resources.push({ title: `Session ${wk} materials`, kind, inSessions: [wk] });
  }

  return { courseTitle, discipline, sessions, assessments, readings, resources };
}

function bloomCycle(i: number): PassB['outcomes'][number]['bloom'] {
  const order: PassB['outcomes'][number]['bloom'][] = ['Understand', 'Apply', 'Analyze', 'Evaluate'];
  return order[i % order.length]!;
}

export function fakePassB(payload: { sessionIndex: number; title: string; discipline?: string }): PassB {
  const topic = payload.title.replace(/…$/, '');
  const i = payload.sessionIndex;
  // deterministic kernel candidate (the real model authors true subject matter;
  // the fake authors a recognizable, valid stand-in so pipelines and renders
  // exercise the same paths)
  const cjk = topic.match(/[㐀-鿿぀-ヿ]/g) ?? [];
  const romanization = Object.fromEntries(cjk.map((ch, n) => [ch, `rm${n + 1}`]));
  // text-bearing disciplines get a locator excerpt (locator only — copyright-safe
  // in the deterministic suite; the real model may add public-domain text)
  const textBearing = payload.discipline === 'humanities' || payload.discipline === 'arts' || payload.discipline === 'language';
  const excerpt = textBearing ? { work: topic, locator: `${topic} — assigned passage` } : undefined;
  return {
    sessionIndex: i,
    concepts: [{ name: topic }],
    outcomes: [
      { text: `Explain the core ideas of ${topic.toLowerCase()}.`, bloom: bloomCycle(i) },
      { text: `Apply ${topic.toLowerCase()} to a representative problem.`, bloom: bloomCycle(i + 1) },
    ],
    kernels: [
      {
        concept: topic,
        definition: `${topic} names the session's central idea: what it is, when it applies, and how it connects to the work before and after it.`,
        misconceptions: [
          {
            claim: `${topic} can be memorized as a fixed recipe without understanding when it applies.`,
            correction: `The conditions of application matter as much as the procedure — vary the context and check the idea still holds.`,
          },
          {
            claim: `If an answer involving ${topic.toLowerCase()} looks plausible, it is probably right.`,
            correction: `Plausibility is not a check — verify against the definition and a worked case before trusting the result.`,
          },
        ],
        ...(i % 2 === 0
          ? {
              workedExample: {
                setup: `A short scenario that requires ${topic.toLowerCase()}.`,
                steps: ['identify what the question asks', 'apply the session idea', 'check the result against the conditions'],
                answer: 'A worked result consistent with the session idea.',
              },
            }
          : {}),
        ...(Object.keys(romanization).length ? { romanization } : {}),
        ...(excerpt ? { excerpt } : {}),
      },
    ],
  };
}

function fakeVoice(payload: { surfaceId: string; compiled: string }): { text: string } {
  // the fake voice returns the compiled text unchanged (it never improves
  // texture) — so a fake build is honest about voice being a no-op (Law 6).
  return { text: payload.compiled };
}

/** Deterministic Pass C: author contract-valid items from the grounding text so
 *  the suite exercises the real item path (the standing rule). Distractors are
 *  the kernel's actual misconceptions, parsed from the grounding. */
function fakeItems(grounding: string): unknown {
  const def = /Definition:\s*(.+)/.exec(grounding)?.[1]?.trim() ?? 'the session concept';
  const concept = /Concept:\s*(.+)/.exec(grounding)?.[1]?.trim() ?? /Session:\s*(.+)/.exec(grounding)?.[1]?.trim() ?? 'this concept';
  const miscons = [...grounding.matchAll(/Misconception:\s*(.+?)\s*—\s*Correction:\s*(.+)/g)].map((m) => ({ claim: m[1]!.trim(), correction: m[2]!.trim() }));
  const c = concept.toLowerCase();
  const correct = miscons[0]?.correction ?? def;
  const d1 = miscons[0]?.claim ?? `A surface restatement of ${c} that ignores when it applies.`;
  const d2 = miscons[1]?.claim ?? `A property adjacent to ${c} that learners over-extend.`;
  const d3 = `A consequence of ${c} mistaken for its definition.`;
  return {
    items: [
      {
        kind: 'mc',
        stem: `Which statement about ${c} best reflects how it actually works?`,
        options: [
          { text: correct, correct: true, rationale: 'Matches the kernel definition.' },
          { text: d1, correct: false },
          { text: d2, correct: false },
          { text: d3, correct: false },
        ],
        answerKey: `The first option is correct: ${correct}`,
        bloom: 'Understand',
        concept,
      },
      {
        kind: 'mc',
        stem: `A student applies ${c} and gets a surprising result. Which check resolves whether the reasoning is sound?`,
        options: [
          { text: `Verify the steps against the definition of ${c} and a worked case.`, correct: true },
          { text: d2, correct: false },
          { text: d3, correct: false },
          { text: d1, correct: false },
        ],
        answerKey: `Verify against the definition of ${c} and a worked example before trusting the result.`,
        bloom: 'Apply',
        concept,
      },
      {
        kind: 'short-answer',
        stem: `In your own words, explain ${c} and name one situation where it applies.`,
        answerKey: `A correct response restates: ${def} — and gives a concrete applying situation.`,
        bloom: 'Understand',
        concept,
      },
      {
        kind: 'applied',
        stem: `Construct a new example that requires ${c}, then show the reasoning to the answer.`,
        answerKey: `Any example that correctly exercises ${c} with sound step-by-step reasoning.`,
        bloom: 'Apply',
        concept,
      },
    ],
  };
}

/** Deterministic TA: parse a few command shapes into EditOps (for tests and
 *  offline use). "set weight of A7.2 to 25" → assessment.set_weight. */
function fakeChat(message: string): { reply: string; note?: string; ops: unknown[] } {
  const weight = message.match(/weight\s+(?:of\s+)?(A\d+\.\d+)\s+to\s+(\d+)/i);
  if (weight) {
    const id = weight[1]!;
    const pct = parseInt(weight[2]!, 10);
    return {
      reply: `Proposing to set ${id}'s weight to ${pct}%.`,
      note: 'instructor asked to change a weight',
      ops: [{ type: 'assessment.set_weight', id, weightPct: pct }],
    };
  }
  const retitle = message.match(/(?:rename|retitle)\s+(S\d+)\s+to\s+["“]?([^"”]+)["”]?$/i);
  if (retitle) {
    return {
      reply: `Proposing to retitle ${retitle[1]} to "${retitle[2]!.trim()}".`,
      note: 'instructor asked to rename a session',
      ops: [{ type: 'session.retitle', id: retitle[1], title: retitle[2]!.trim() }],
    };
  }
  return { reply: "I can help adjust weights, titles, readings, and more — tell me what to change.", ops: [] };
}

/** The deterministic engine. usd is always 0 — a fake build spends nothing.
 *  opts.thin: author NO kernels (a deliberately content-poor build — the
 *  calibration suite's low anchor; the teachability meter must spread). */
export class FakeModelPort implements ModelPort {
  constructor(private opts: { thin?: boolean } = {}) {}
  async completeJSON(req: ModelRequest): Promise<ModelResult> {
    const usage = { inputTokens: 0, outputTokens: 0, reasoningTokens: 0 };
    let json: unknown;
    switch (req.purpose) {
      case 'authorA':
        json = fakePassA((req.payload as { brief: string }).brief);
        break;
      case 'authorB': {
        const b = fakePassB(req.payload as { sessionIndex: number; title: string });
        json = this.opts.thin ? { ...b, kernels: [] } : b;
        break;
      }
      case 'voice':
        json = fakeVoice(req.payload as { surfaceId: string; compiled: string });
        break;
      case 'chat':
        json = fakeChat((req.payload as { message: string }).message);
        break;
      case 'items':
        json = fakeItems((req.payload as { grounding: string }).grounding);
        break;
      case 'intake':
      default:
        json = {};
    }
    return { json, usage, model: 'fake-deterministic', usd: 0 };
  }
}
