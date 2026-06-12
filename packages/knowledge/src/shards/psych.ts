import type { GenomeShard } from '../types.ts';

export const psych: GenomeShard = {
  id: 'psych',
  discipline: 'social-science',
  concepts: [
    {
      key: 'psych/classical-conditioning',
      name: 'Classical conditioning',
      aliases: ['pavlovian learning', 'pavlovian conditioning'],
      requires: [],
      definition:
        'Classical conditioning pairs a neutral stimulus with one that already triggers a response until the neutral stimulus triggers it alone.',
      misconceptions: [
        { claim: 'Classical conditioning teaches new voluntary behaviors.', correction: 'It transfers existing reflexive responses to new signals — voluntary behavior change is operant territory.' },
      ],
      citations: [{ title: 'CurriculumOS genome: classical conditioning', source: 'genome', externalId: 'psych/classical-conditioning' }],
    },
    {
      key: 'psych/operant-conditioning',
      name: 'Operant conditioning',
      aliases: ['reinforcement and punishment', 'reinforcement', 'operant learning'],
      requires: ['psych/classical-conditioning'],
      definition:
        'Operant conditioning shapes voluntary behavior through consequences: reinforcement raises a behavior’s frequency, punishment lowers it.',
      misconceptions: [
        { claim: 'Negative reinforcement is punishment.', correction: 'Negative reinforcement REMOVES something aversive to strengthen behavior — it increases the behavior, punishment decreases it.' },
      ],
      citations: [{ title: 'CurriculumOS genome: operant conditioning', source: 'genome', externalId: 'psych/operant-conditioning' }],
    },
    {
      key: 'psych/observational-learning',
      name: 'Observational learning',
      aliases: ['modeling', 'social learning'],
      requires: ['psych/operant-conditioning'],
      definition:
        'Observational learning acquires behavior by watching models and their consequences — attention, retention, reproduction, and motivation gate whether imitation happens.',
      misconceptions: [
        { claim: 'People imitate whatever they see.', correction: 'Imitation tracks the model’s outcomes — children in Bandura’s studies copied rewarded aggression far more than punished aggression.' },
      ],
      citations: [{ title: 'CurriculumOS genome: observational learning', source: 'genome', externalId: 'psych/observational-learning' }],
    },
    {
      key: 'psych/memory-encoding',
      name: 'Memory encoding, storage, and retrieval',
      aliases: ['memory encoding', 'encoding', 'retrieval'],
      requires: [],
      definition:
        'Memory is not a recorder: encoding transforms experience, storage consolidates it, and retrieval reconstructs it — each stage can alter the trace.',
      misconceptions: [
        { claim: 'Vivid, confident memories are accurate memories.', correction: 'Confidence and accuracy dissociate — flashbulb memories feel photographic and drift like any other.' },
      ],
      citations: [{ title: 'CurriculumOS genome: memory encoding', source: 'genome', externalId: 'psych/memory-encoding' }],
    },
    {
      key: 'psych/working-memory',
      name: 'Short-term and working memory',
      aliases: ['working memory', 'short-term memory'],
      requires: ['psych/memory-encoding'],
      definition:
        'Working memory actively manipulates a small number of items (~4 chunks) for seconds; chunking, not capacity growth, is how experts hold more.',
      misconceptions: [
        { claim: 'Short-term memory holds seven items for everyone.', correction: 'The classic 7±2 measured chunks, and modern estimates are nearer 4 — capacity depends on what counts as a chunk.' },
      ],
      citations: [{ title: 'CurriculumOS genome: working memory', source: 'genome', externalId: 'psych/working-memory' }],
    },
    {
      key: 'psych/long-term-memory',
      name: 'Long-term memory systems',
      aliases: ['explicit and implicit memory', 'long-term memory', 'episodic memory', 'procedural memory'],
      requires: ['psych/memory-encoding'],
      definition:
        'Long-term memory divides into explicit systems (episodic events, semantic facts) and implicit systems (skills, priming) with distinct neural bases.',
      misconceptions: [
        { claim: 'Amnesia erases all kinds of memory equally.', correction: 'Patients like H.M. lost new episodic memory yet still learned motor skills — the systems are separable.' },
      ],
      citations: [{ title: 'CurriculumOS genome: long-term memory', source: 'genome', externalId: 'psych/long-term-memory' }],
    },
    {
      key: 'psych/forgetting-curve',
      name: 'The forgetting curve and interference',
      aliases: ['forgetting curve', 'ebbinghaus', 'interference', 'retrieval failure', 'forgetting'],
      requires: ['psych/long-term-memory'],
      definition:
        'Ebbinghaus showed retention drops steeply then levels off; spaced review resets the curve, and interference from similar material drives much of the loss.',
      misconceptions: [
        { claim: 'Forgetting means the memory is gone.', correction: 'Much forgetting is retrieval failure — cues and context can resurrect traces that seemed lost.' },
      ],
      citations: [{ title: 'CurriculumOS genome: the forgetting curve', source: 'genome', externalId: 'psych/forgetting-curve' }],
    },
    {
      key: 'psych/piaget',
      name: 'Piaget’s stages of cognitive development',
      aliases: ['piaget', 'cognitive development'],
      requires: [],
      definition:
        'Piaget proposed that children construct understanding through sensorimotor, preoperational, concrete operational, and formal operational stages, each with characteristic reasoning limits.',
      misconceptions: [
        { claim: 'Children are mini-adults who just know less.', correction: 'Piaget’s conservation tasks show children reason DIFFERENTLY, not merely with fewer facts.' },
      ],
      citations: [{ title: 'CurriculumOS genome: Piaget', source: 'genome', externalId: 'psych/piaget' }],
    },
    {
      key: 'psych/erikson',
      name: 'Erikson’s psychosocial development',
      aliases: ['erikson', 'psychosocial stages'],
      requires: [],
      definition:
        'Erikson framed development as eight lifelong crises — trust vs mistrust through integrity vs despair — each resolving into a strength or a lasting vulnerability.',
      misconceptions: [
        { claim: 'Development ends at adulthood.', correction: 'Erikson’s later stages (generativity, integrity) place major developmental work in middle and late life.' },
      ],
      citations: [{ title: 'CurriculumOS genome: Erikson', source: 'genome', externalId: 'psych/erikson' }],
    },
    {
      key: 'psych/intelligence',
      name: 'Theories of intelligence',
      aliases: ['general intelligence', 'multiple intelligences', 'intelligence'],
      requires: [],
      definition:
        'Intelligence research spans a general factor g that predicts across domains and proposals like Gardner’s multiple intelligences that dispute a single axis.',
      misconceptions: [
        { claim: 'IQ is fixed at birth.', correction: 'Heritability is not immutability — schooling, nutrition, and the Flynn effect all move measured IQ.' },
      ],
      citations: [{ title: 'CurriculumOS genome: intelligence', source: 'genome', externalId: 'psych/intelligence' }],
    },
    {
      key: 'psych/motivation',
      name: 'Intrinsic and extrinsic motivation',
      aliases: ['overjustification effect', 'motivation'],
      requires: ['psych/operant-conditioning'],
      definition:
        'Intrinsic motivation comes from the activity itself, extrinsic from outcomes; piling rewards on an already-loved activity can undercut it (overjustification).',
      misconceptions: [
        { claim: 'Rewards always increase motivation.', correction: 'Expected tangible rewards for intrinsically enjoyed tasks reliably reduce later free-choice engagement.' },
      ],
      citations: [{ title: 'CurriculumOS genome: motivation', source: 'genome', externalId: 'psych/motivation' }],
    },
    {
      key: 'psych/problem-solving',
      name: 'Problem-solving strategies',
      aliases: ['algorithms and heuristics', 'problem solving', 'heuristics'],
      requires: ['psych/working-memory'],
      definition:
        'Algorithms guarantee solutions by exhaustive procedure; heuristics trade that guarantee for speed — and their systematic failures are predictable biases.',
      misconceptions: [
        { claim: 'Heuristics are flaws in thinking.', correction: 'They are adaptive shortcuts that are usually right — bias is the tail, not the distribution.' },
      ],
      citations: [{ title: 'CurriculumOS genome: problem solving', source: 'genome', externalId: 'psych/problem-solving' }],
    },
    {
      key: 'psych/functional-fixedness',
      name: 'Functional fixedness and mental set',
      aliases: ['functional fixedness', 'mental set'],
      requires: ['psych/problem-solving'],
      definition:
        'Functional fixedness locks an object to its customary use; mental set locks the solver to a previously successful method — both block restructuring the problem.',
      misconceptions: [
        { claim: 'Experience always improves problem solving.', correction: 'The Luchins water-jar studies show practiced procedures persist even when a simpler path exists — expertise can entrench sets.' },
      ],
      citations: [{ title: 'CurriculumOS genome: functional fixedness', source: 'genome', externalId: 'psych/functional-fixedness' }],
    },
  ],
};
