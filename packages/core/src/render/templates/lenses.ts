/** render/templates/lenses.ts — per-discipline lens data (DATA, ADR-10 exempt).
 *  Templates are data, not code (030-ports kill list): the 18k-line compiler's
 *  knowledge becomes versioned data modules consumed by a small render engine. */
import type { DisciplineLens } from '../../schema/courseObject.ts';

export interface Lens {
  /** human label for the discipline line on the syllabus header */
  label: string;
  /** what the practice/lab activity is typically called */
  activity: string;
  /** noun for the core deliverable students produce */
  deliverable: string;
  /** verbs that signal the discipline's habits of mind */
  signatureVerbs: string[];
  /** discipline-specific session-arc activity frames (`%s` = topic). The
   *  generic pools in phrasing.ts are the fallback; these are what make a cs
   *  session read like cs and a lab session read like a lab (the judge's
   *  "would a professor teach from this" question, answered per discipline). */
  arc?: { warmup: string[]; core: string[]; practice: string[]; closing: string[] };
}

export const LENSES: Record<DisciplineLens, Lens> = {
  'stem-quant': {
    label: 'Quantitative STEM',
    activity: 'problem set',
    deliverable: 'solution write-up',
    signatureVerbs: ['derive', 'compute', 'prove', 'estimate'],
    arc: {
      warmup: [
        'Estimation opener: students guess an order of magnitude related to %s, then defend it',
        'Show a wrong worked solution touching %s; students hunt the first bad step',
        'Quick poll with a deliberately tempting trap answer about %s',
        'Students sketch, without computing, what a graph of %s should look like',
      ],
      core: [
        'Derive the key relationship behind %s step by step, with students supplying each move',
        'Work a canonical problem on %s twice: once numerically, once symbolically',
        'Build intuition for %s through limiting cases — what happens at zero, at infinity?',
        'Translate %s between representations: words, equation, graph, table',
      ],
      practice: [
        'Board work in pairs: a fresh %s problem one notch harder than the worked example',
        'Error analysis: grade a fictional student’s %s solution against the rubric',
        'Speed round of small %s computations, then one transfer problem',
        'Groups set up (without solving) three differently-worded %s problems',
      ],
      closing: [
        'Exit ticket: one %s computation plus one sentence on when the method fails',
        'Students write the “check your answer” test they would apply to %s results',
        'Muddiest point: which step of today’s %s derivation is least convincing?',
        'Predict tomorrow: how does %s behave when the assumptions loosen?',
      ],
    },
  },
  'stem-lab': {
    label: 'Laboratory science',
    activity: 'lab',
    deliverable: 'lab report',
    signatureVerbs: ['observe', 'identify', 'measure', 'classify'],
    arc: {
      warmup: [
        'Pass around a specimen or image of %s; students record three observations before any terms are introduced',
        'Show two contrasting samples relevant to %s and ask which is which, and how they decided',
        'Demo a quick bench test connected to %s; students predict the result first',
        'Project a field photo involving %s and have students annotate what they notice',
      ],
      core: [
        'Guided identification: work through the diagnostic features of %s with real or pictured samples',
        'Build the process model of %s on the board from student observations',
        'Walk the classification key that distinguishes %s from its look-alikes',
        'Connect the bench-scale evidence to the field-scale story of %s',
      ],
      practice: [
        'Station rotation: small groups apply the %s procedure to fresh specimens and log results',
        'Students run the identification protocol for %s and defend their call against a skeptic partner',
        'Measurement drill: collect and tabulate data on %s, flagging anomalies',
        'Groups sketch and label the mechanism of %s from an unlabeled diagram',
      ],
      closing: [
        'Each bench reports its %s result and one source of uncertainty',
        'Exit ticket: which diagnostic feature of %s is most reliable, and why?',
        'Students write the one-sentence lab-notebook summary for today’s work on %s',
        'Predict: what would you expect to observe if %s were absent from tomorrow’s sample?',
      ],
    },
  },
  cs: {
    label: 'Computer science',
    activity: 'coding lab',
    deliverable: 'program',
    signatureVerbs: ['implement', 'debug', 'trace', 'test'],
    arc: {
      warmup: [
        'Live-code a tiny example of %s and have students predict the output before running it',
        'Show a two-line snippet using %s with a planted bug; students spot it in pairs',
        'Ask students to trace %s by hand on the board before touching a keyboard',
        'Run a quick REPL exploration of %s, narrating each evaluation',
      ],
      core: [
        'Code-along: build up a worked program using %s, pausing for predictions at each step',
        'Refactor a clumsy version into one that uses %s properly, discussing each change',
        'Contrast a correct and a subtly-broken implementation of %s side by side',
        'Derive the rules of %s from runnable examples, testing each hypothesis live',
      ],
      practice: [
        'Pair lab: students implement a function exercising %s against provided test cases',
        'Bug hunt: a short program misusing %s — find, fix, and explain all defects',
        'Students extend the class example of %s to a new input shape and defend their change',
        'Code review rotation: critique a peer solution that uses %s',
      ],
      closing: [
        'Exit ticket: predict the output of a three-line %s snippet without running it',
        'One-minute write: where would %s break, and how would you detect it?',
        'Students name the error message they would expect from misusing %s',
        'Commit ritual: write the docstring that explains today’s %s solution to a stranger',
      ],
    },
  },
  humanities: {
    label: 'Humanities',
    activity: 'close reading',
    deliverable: 'essay',
    signatureVerbs: ['interpret', 'argue', 'contextualize', 'compare'],
    arc: {
      warmup: [
        'Read a short passage bearing on %s aloud; students mark the single word that does the most work',
        'Project two translations or versions of a line relevant to %s and ask what changed',
        'Free-write: first impressions of %s before any framing is given',
        'Students bring one question the reading raised about %s; collect three on the board',
      ],
      core: [
        'Close reading: move line by line through the key passage for %s, building the interpretation together',
        'Set %s in its historical and cultural moment, then ask what survives translation to ours',
        'Stage the strongest two rival readings of %s and weigh the textual evidence for each',
        'Trace how %s develops across the work — openings, turns, and the closing movement',
      ],
      practice: [
        'Seminar table: students defend a claim about %s using only quoted evidence',
        'Paragraph workshop: draft a thesis sentence on %s and stress-test it in pairs',
        'Comparison exercise: set %s beside an earlier text and argue the relationship',
        'Students annotate a fresh passage for %s unassisted, then compare margins',
      ],
      closing: [
        'Exit line: quote one phrase on %s and say in a sentence why it matters',
        'Students revise their opening impression of %s in light of the discussion',
        'One-sentence claim about %s a future essay could defend',
        'Name what the text refuses to resolve about %s — and why that might be deliberate',
      ],
    },
  },
  'social-science': {
    label: 'Social science',
    activity: 'problem set',
    deliverable: 'analysis',
    signatureVerbs: ['model', 'explain', 'evaluate', 'predict'],
    arc: {
      warmup: [
        'Open with a headline or price students have seen this week that %s explains',
        'Two-sided poll: students take a position on a question %s will adjudicate',
        'Show a chart from real data and ask what %s predicts it should look like',
        'Students recall a personal decision that %s describes, in one sentence',
      ],
      core: [
        'Build the %s model on the board, naming every assumption as it enters',
        'Run a comparative-statics story through %s: shock it, trace the consequences',
        'Confront %s with a real dataset or case — where does the model bend?',
        'Develop %s twice: in words for intuition, then in the formal apparatus',
      ],
      practice: [
        'Problem-set preview: groups work a %s exercise and post solutions for critique',
        'Policy clinic: apply %s to a proposed policy and forecast the side effects',
        'Students construct a counterexample where naive %s reasoning misleads',
        'Data exercise: test a %s prediction against the provided table',
      ],
      closing: [
        'Exit ticket: one real-world observation %s explains and one it cannot',
        'Students state the assumption of %s they find least believable, and why',
        'One-minute forecast: what does %s predict about next week’s topic?',
        'Summarize %s for a policymaker in exactly two sentences',
      ],
    },
  },
  language: {
    label: 'Language',
    activity: 'speaking practice',
    deliverable: 'oral performance',
    signatureVerbs: ['produce', 'comprehend', 'pronounce', 'converse'],
    arc: {
      warmup: [
        'Choral echo: students repeat the target forms of %s after the model, exaggerating the hard parts',
        'Listening discrimination: minimal pairs drawn from %s — students signal what they hear',
        'Quick retrieval: students produce yesterday’s forms before %s introduces new ones',
        'Picture prompt: students name what they can about the scene using %s so far',
      ],
      core: [
        'Present %s in context first — a short dialogue — then surface the pattern from it',
        'Build the form-meaning map of %s with both script and romanization visible',
        'Contrast %s with the English habit it displaces; drill the difference',
        'Model and decompose %s: tones, strokes or morphology, then rebuild it together',
      ],
      practice: [
        'Pair conversation task requiring %s, with role cards and a twist halfway',
        'Information gap: partners must use %s to complete each other’s missing details',
        'Writing drill: students produce the characters or forms of %s from sound alone',
        'Speed rounds: rotate partners, reuse %s in a new mini-context each round',
      ],
      closing: [
        'Exit performance: each student produces one unprompted sentence using %s',
        'Self-check: students mark which form of %s still feels unstable',
        'One-line dialogue completion using %s, written from memory',
        'Preview tomorrow by asking a question that needs both %s and next session’s forms',
      ],
    },
  },
  arts: {
    label: 'Arts',
    activity: 'studio',
    deliverable: 'portfolio piece',
    signatureVerbs: ['create', 'critique', 'compose', 'perform'],
  },
  business: {
    label: 'Business',
    activity: 'case discussion',
    deliverable: 'case analysis',
    signatureVerbs: ['analyze', 'recommend', 'justify', 'assess'],
  },
  health: {
    label: 'Health science',
    activity: 'clinical case study',
    deliverable: 'case write-up',
    signatureVerbs: ['assess', 'explain', 'apply', 'evaluate'],
    arc: {
      warmup: [
        'Open with a one-paragraph patient vignette where %s is the hidden explanation',
        'Vital-signs snapshot: students flag what is abnormal before %s is named',
        'Quick poll: what would you assess first in a patient where %s is suspected?',
        'Students recall where %s appeared in a prior case, in one sentence',
      ],
      core: [
        'Trace the physiology of %s from normal function to the failure the clinic sees',
        'Walk the case timeline: how %s presents, progresses, and responds',
        'Connect %s to its assessment findings — what the numbers and signs actually mean',
        'Map %s onto the nursing process: assess, diagnose, plan, implement, evaluate',
      ],
      practice: [
        'Case conference: small groups work a fresh %s scenario to a care plan',
        'Prioritization drill: order interventions for a deteriorating %s presentation',
        'Documentation practice: chart the %s findings in proper clinical language',
        'Students teach %s back as they would explain it to a patient’s family',
      ],
      closing: [
        'Exit ticket: the first sign of %s you would watch for on the next shift',
        'One-sentence safety takeaway about %s for the handoff report',
        'Students name the red flag that distinguishes %s from its mimics',
        'Self-test: which %s value ranges can you state from memory?',
      ],
    },
  },
  education: {
    label: 'Education',
    activity: 'practicum',
    deliverable: 'lesson plan',
    signatureVerbs: ['design', 'reflect', 'adapt', 'evaluate'],
  },
  general: {
    label: 'General',
    activity: 'activity',
    deliverable: 'assignment',
    signatureVerbs: ['explain', 'apply', 'analyze', 'create'],
  },
};
