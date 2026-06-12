import type { GenomeShard } from '../types.ts';

/** Philosophy shard (V0.0.8, workstream E). Intro-philosophy graded
 *  generically until now. Discipline 'humanities' (the brief classifier sends
 *  philosophy there); excerpts are public-domain primary texts so argument-
 *  analysis lessons point at actual arguments. */
export const philosophy: GenomeShard = {
  id: 'philosophy',
  discipline: 'humanities',
  concepts: [
    {
      key: 'philosophy/argument',
      name: 'Philosophical argument',
      aliases: ['what philosophy is and how to read an argument', 'what philosophy is', 'how to read an argument', 'argument analysis', 'premises and conclusion'],
      requires: [],
      definition:
        'Philosophy proceeds by argument: a conclusion supported by premises whose truth would make it rational to accept. Reading philosophically means reconstructing that structure — find the conclusion, list the premises, locate the inference — before agreeing or objecting.',
      misconceptions: [
        {
          claim: 'Philosophy is opinion, so every view is equally defensible.',
          correction: 'Positions are graded by the arguments behind them: a view whose premises are false or whose inference fails is WORSE, demonstrably — disagreement persists, but not all disagreement is reasonable.',
        },
        {
          claim: 'An argument is a quarrel — winning means the other side gives up.',
          correction: 'An argument is a structure of support; the aim is truth, not victory. Refuting a person and refuting their premises are different acts, and only the second advances the question.',
        },
      ],
      workedExample: {
        setup: 'Reconstruct: "We should not fear death, for where death is, we are not; and where we are, death is not." (Epicurus)',
        steps: ['Conclusion: death should not be feared.', 'Premise 1: harm requires a subject who exists to be harmed.', 'Premise 2: when death occurs, the subject no longer exists.', 'Inference: so death harms no one — challenge a premise (is deprivation a harm without a subject?) to engage it.'],
        answer: 'The reconstruction exposes exactly where to push: premise 1 is the live target — deprivation accounts of harm deny it.',
      },
      excerpt: {
        work: 'Apology (Plato)',
        text: 'The unexamined life is not worth living.',
        locator: '38a, Socrates at trial',
      },
      citations: [{ title: 'CurriculumOS genome: philosophical argument', source: 'genome', externalId: 'philosophy/argument' }],
    },
    {
      key: 'philosophy/validity',
      name: 'Validity and soundness',
      aliases: ['logic and the structure of valid arguments', 'valid arguments', 'validity', 'soundness', 'deductive logic'],
      requires: ['philosophy/argument'],
      definition:
        'An argument is valid when the conclusion MUST be true if the premises are — a property of form, not content. It is sound when it is valid AND the premises are actually true. Validity is the logic; soundness is the logic plus the world.',
      misconceptions: [
        {
          claim: 'A valid argument is one with a true conclusion.',
          correction: 'Validity is about the LINK, not the verdict: "All fish fly; trout are fish; so trout fly" is perfectly valid with a false conclusion — and an invalid argument can stumble onto a true one.',
        },
        {
          claim: 'If you reject the conclusion, the argument must contain a logical error.',
          correction: 'A valid argument with a conclusion you reject forces a choice: deny a premise or accept the conclusion — "the argument is valid but unsound" is the honest exit, and it names WHICH premise fails.',
        },
      ],
      workedExample: {
        setup: 'Test: "If it rained, the ground is wet. The ground is wet. So it rained."',
        steps: ['Identify the form: if P then Q; Q; therefore P.', 'Seek a counterexample: sprinklers make the ground wet without rain.', 'Premises true, conclusion false is possible → the form is invalid (affirming the consequent).'],
        answer: 'Invalid — the counterexample method shows the premises can hold while the conclusion fails, which is all invalidity means.',
      },
      citations: [{ title: 'CurriculumOS genome: validity', source: 'genome', externalId: 'philosophy/validity' }],
    },
    {
      key: 'philosophy/skepticism',
      name: 'Knowledge and skepticism',
      aliases: ['theory of knowledge and skepticism', 'theory of knowledge', 'epistemology', 'skepticism', 'the problem of the external world'],
      requires: ['philosophy/argument'],
      definition:
        'Epistemology asks what knowledge requires beyond true belief — justification, reliability, ruling out alternatives — and the skeptic presses the hardest version: can you rule out that you are dreaming, or systematically deceived?',
      misconceptions: [
        {
          claim: 'Skepticism is the lazy refusal to believe anything.',
          correction: 'Philosophical skepticism is an ARGUMENT — if you cannot rule out the dream scenario, and knowledge requires ruling it out, you lack knowledge. Answering it requires rejecting a premise, which is real work.',
        },
        {
          claim: 'Descartes concluded that nothing can be known.',
          correction: 'Descartes deploys doubt as a method to find what survives it — the cogito is the rock the doubt cannot dissolve; he is skepticism’s most famous OPPONENT, wielding its own weapon.',
        },
      ],
      excerpt: {
        work: 'Meditations on First Philosophy (Descartes)',
        text: 'I am, I exist — that is certain; but for how long? For as long as I am thinking.',
        locator: 'Meditation II',
      },
      citations: [{ title: 'CurriculumOS genome: skepticism', source: 'genome', externalId: 'philosophy/skepticism' }],
    },
    {
      key: 'philosophy/mind-body',
      name: 'The mind-body problem',
      aliases: ['mind-body problem', 'dualism and physicalism', 'consciousness', 'philosophy of mind'],
      requires: ['philosophy/skepticism'],
      definition:
        'The mind-body problem asks how conscious experience relates to the physical brain: dualism says they are distinct substances or properties; physicalism says mind IS brain process — and consciousness (what it is LIKE to see red) is the stubborn datum each side must explain.',
      misconceptions: [
        {
          claim: 'Neuroscience has settled the question: the mind is just the brain.',
          correction: 'Correlation is agreed by everyone; the philosophical question is whether experience REDUCES to physical process — the "hard problem" (why is there something it is like?) survives every brain map so far.',
        },
        {
          claim: 'Dualism is the religious view and physicalism the scientific one.',
          correction: 'Both are argued positions: Descartes’ conceivability argument and the knowledge argument (Mary the color scientist) are reasons, not creeds — and physicalism owes an answer to them, not a dismissal.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: the mind-body problem', source: 'genome', externalId: 'philosophy/mind-body' }],
    },
    {
      key: 'philosophy/personal-identity',
      name: 'Personal identity',
      aliases: ['personal identity', 'the persistence of persons', 'the ship of theseus', 'psychological continuity'],
      requires: ['philosophy/mind-body'],
      definition:
        'Personal identity asks what makes you at eighty the SAME person as you at eight: bodily continuity, psychological continuity (memory, character, intention), or nothing so deep — with thought experiments (teleporters, fission, total amnesia) as the test rig.',
      misconceptions: [
        {
          claim: 'The question is answered by DNA or fingerprints — biology settles identity.',
          correction: 'Biological markers track the ORGANISM; the puzzle cases split organism from person — if your psychology were copied into another body, the fingerprints stay behind but the candidate for being YOU arguably leaves.',
        },
        {
          claim: 'Memory obviously makes identity: you are whoever remembers your life.',
          correction: 'Locke’s view meets hard cases head-on — circularity (genuine memory presupposes identity), gaps (the drunk forgets, the general remembers the boy only via the officer), and duplication all pressure the simple memory criterion.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: personal identity', source: 'genome', externalId: 'philosophy/personal-identity' }],
    },
    {
      key: 'philosophy/free-will',
      name: 'Free will and determinism',
      aliases: ['free will and determinism', 'free will', 'determinism', 'compatibilism', 'moral responsibility'],
      requires: ['philosophy/argument'],
      definition:
        'If every event, including choice, follows from prior causes and laws, what room is left for freedom? Hard determinists say none; libertarians deny the determinism; compatibilists redefine the freedom worth wanting as acting from your own unforced reasons.',
      misconceptions: [
        {
          claim: 'Determinism means fatalism — your choices change nothing, so why try.',
          correction: 'Determinism makes choices LINKS in the causal chain, not bypassed spectators: deliberation is among the causes of outcomes. Fatalism ("it happens regardless of what you do") is a different and far stronger claim.',
        },
        {
          claim: 'Compatibilism is cheating — redefining freedom to dodge the problem.',
          correction: 'The compatibilist argues the ordinary concept never required uncaused causes: freedom contrasts with coercion and compulsion, not with causation — that is a substantive analysis to be argued against, not a trick.',
        },
      ],
      workedExample: {
        setup: 'Sort three cases: a bank teller hands over money at gunpoint; an addict steals in withdrawal; a donor gives after reflection.',
        steps: ['All three actions are caused — determinism treats them alike.', 'Compatibilism distinguishes: coercion (gun), internal compulsion (addiction), responsiveness to one’s own reasons (donor).', 'Only the third is free in the compatibilist sense; ask whether that captures what responsibility needs.'],
        answer: 'The sorting shows the compatibilist criterion at work — and the open question is whether reason-responsiveness is enough for desert, or only for excuse-management.',
      },
      citations: [{ title: 'CurriculumOS genome: free will', source: 'genome', externalId: 'philosophy/free-will' }],
    },
    {
      key: 'philosophy/god-arguments',
      name: 'Arguments for the existence of God',
      aliases: ['arguments for and against the existence of god', 'existence of god', 'cosmological argument', 'design argument', 'ontological argument'],
      requires: ['philosophy/validity'],
      definition:
        'The classical arguments — cosmological (a first cause for a contingent world), design (apparent fine-tuning needs an orderer), ontological (a greatest conceivable being must exist) — are exercises in validity and premise-testing at the largest scale.',
      misconceptions: [
        {
          claim: 'These arguments are just faith dressed up in logic.',
          correction: 'Each is a deductive or inferential structure assessable like any other: Aquinas, Paley, and Anselm offer premises; Hume, Kant, and Russell attack specific ones — the debate is philosophy’s standard machinery, whatever one believes.',
        },
        {
          claim: 'The cosmological argument fails immediately to "then who caused God?"',
          correction: 'The argument claims contingent things need causes and concludes with a NON-contingent terminus — the retort must engage that distinction (is necessary existence coherent? why exempt anything?), which is where the serious objections live.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: arguments for God', source: 'genome', externalId: 'philosophy/god-arguments' }],
    },
    {
      key: 'philosophy/problem-of-evil',
      name: 'The problem of evil',
      aliases: ['problem of evil', 'the logical problem of evil', 'theodicy', 'evil and suffering'],
      requires: ['philosophy/god-arguments'],
      definition:
        'If God is all-powerful, all-knowing, and wholly good, why is there evil? The logical version claims the four propositions are inconsistent; the evidential version argues the AMOUNT and distribution of suffering is strong evidence against; theodicies (free will, soul-making) answer.',
      misconceptions: [
        {
          claim: 'The free-will defense settles the problem.',
          correction: 'It addresses MORAL evil at most: earthquakes, childhood cancer, and animal suffering before humans existed are untouched by it — natural evil is why the evidential problem survives the classic defense.',
        },
        {
          claim: 'The problem of evil is an emotional complaint, not an argument.',
          correction: 'Epicurus’ trilemma and Mackie’s formulation are explicit deductive structures; the grief is real, but the philosophical force is a consistency proof the theist must break by denying a premise.',
        },
      ],
      excerpt: {
        work: 'Dialogues Concerning Natural Religion (Hume)',
        text: 'Is he willing to prevent evil, but not able? then is he impotent. Is he able, but not willing? then is he malevolent.',
        locator: 'Part X, Philo speaking',
      },
      citations: [{ title: 'CurriculumOS genome: the problem of evil', source: 'genome', externalId: 'philosophy/problem-of-evil' }],
    },
    {
      key: 'philosophy/ethical-theory',
      name: 'Ethical theory and the good life',
      aliases: ['ethical theory and the good life', 'ethical theory', 'normative ethics', 'consequentialism and deontology', 'virtue and the good life'],
      requires: ['philosophy/argument'],
      definition:
        'Normative ethics systematizes right action: consequentialism grades acts by outcomes, deontology by duties and constraints that hold regardless of outcomes, virtue ethics by the character a flourishing life expresses — three lenses that disagree about hard cases on principle.',
      misconceptions: [
        {
          claim: 'Ethics reduces to culture: right just means approved-around-here.',
          correction: 'Simple relativism self-undermines — it makes moral REFORMERS automatically wrong (the abolitionist dissented from approved practice) and cross-cultural criticism meaningless; those costs are arguments, and they need answers, not shrugs.',
        },
        {
          claim: 'The theories are interchangeable routes to the same verdicts.',
          correction: 'They are built to diverge: pushing one person to save five is the textbook split — a consequentialist calculus can demand what a deontological constraint forbids; choosing a theory is choosing which verdicts to defend.',
        },
      ],
      excerpt: {
        work: 'Utilitarianism (Mill)',
        text: 'It is better to be a human being dissatisfied than a pig satisfied; better to be Socrates dissatisfied than a fool satisfied.',
        locator: 'ch. 2',
      },
      citations: [{ title: 'CurriculumOS genome: ethical theory', source: 'genome', externalId: 'philosophy/ethical-theory' }],
    },
    {
      key: 'philosophy/justice',
      name: 'Justice and political philosophy',
      aliases: ['justice and political philosophy', 'political philosophy', 'theories of justice', 'the social contract', 'rawls'],
      requires: ['philosophy/ethical-theory'],
      definition:
        'Political philosophy asks what makes power legitimate and distributions just: social-contract theory grounds authority in agreement; Rawls models fairness as the principles chosen behind a veil of ignorance; critics (Nozick, communitarians) contest the starting point itself.',
      misconceptions: [
        {
          claim: 'The social contract is a historical event the theory depends on.',
          correction: 'The contract is a justificatory DEVICE — what could be agreed to under fair conditions — not an anthropological claim; "no one ever signed" misses the argument’s hypothetical structure entirely.',
        },
        {
          claim: 'Rawls’ veil of ignorance just predicts that people vote their self-interest.',
          correction: 'The veil REMOVES the information self-interest needs (your class, talents, conception of the good), forcing impartial principles; the maximin reasoning behind the difference principle is a choice under uncertainty, not a poll.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: justice', source: 'genome', externalId: 'philosophy/justice' }],
    },
    {
      key: 'philosophy/meaning-of-life',
      name: 'The meaning of life',
      aliases: ['meaning of life', 'the meaning of life', 'absurdity and meaning', 'existentialism'],
      requires: ['philosophy/ethical-theory'],
      definition:
        'The question of meaning asks whether life’s value must be conferred from outside (a cosmic purpose) or can be built from within — through projects, relationships, and engagement; Camus’ absurd, Sartre’s self-creation, and objective-list views are the live answers.',
      misconceptions: [
        {
          claim: 'Without a cosmic purpose, life is automatically meaningless.',
          correction: 'That inference needs a suppressed premise — that only externally assigned purpose counts. Internalist accounts deny exactly that: meaning may supervene on engagement with what is genuinely worth engaging, no cosmos required.',
        },
        {
          claim: 'The question is unanswerable, so philosophy has nothing to say.',
          correction: 'Philosophy clarifies what the question ASKS (purpose? value? narrative intelligibility?), separates strands, and evaluates answers — Camus, Wolf, and Nagel make progress precisely by making the question tractable.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: the meaning of life', source: 'genome', externalId: 'philosophy/meaning-of-life' }],
    },
  ],
};
