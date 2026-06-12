import type { GenomeShard } from '../types.ts';

export const nursing: GenomeShard = {
  id: 'nursing',
  discipline: 'health',
  concepts: [
    {
      key: 'nursing/homeostasis',
      name: 'Homeostasis and negative feedback',
      aliases: ['homeostasis', 'negative feedback'],
      requires: [],
      definition:
        'Homeostasis keeps internal variables within survivable ranges; negative feedback loops sense a deviation and drive an opposing correction.',
      misconceptions: [
        { claim: 'Homeostasis means the body holds values perfectly constant.', correction: 'Regulated variables oscillate around a set point — homeostasis is dynamic balance, not stasis.' },
      ],
      citations: [{ title: 'CurriculumOS genome: homeostasis', source: 'genome', externalId: 'nursing/homeostasis' }],
    },
    {
      key: 'nursing/structural-organization',
      name: 'Levels of structural organization',
      aliases: ['levels of structural organization', 'cells to organ systems'],
      requires: ['nursing/homeostasis'],
      definition:
        'The body organizes from chemicals to cells, tissues, organs, organ systems, and the organism — each level emerges from and constrains the one below.',
      misconceptions: [
        { claim: 'Organ systems work in isolation.', correction: 'Systems are interdependent — the cardiovascular system fails without the respiratory gases it carries.' },
      ],
      citations: [{ title: 'CurriculumOS genome: structural organization', source: 'genome', externalId: 'nursing/structural-organization' }],
    },
    {
      key: 'nursing/blood',
      name: 'Blood components and function',
      aliases: ['blood', 'blood components'],
      requires: ['nursing/structural-organization'],
      definition:
        'Blood is plasma plus formed elements: erythrocytes carry gases, leukocytes defend, platelets clot — together transport, regulation, and protection.',
      misconceptions: [
        { claim: 'Red blood cells are the only cells in blood.', correction: 'Leukocytes and platelets are essential formed elements — immunity and clotting depend on them.' },
      ],
      citations: [{ title: 'CurriculumOS genome: blood', source: 'genome', externalId: 'nursing/blood' }],
    },
    {
      key: 'nursing/cardiac-cycle',
      name: 'The cardiac cycle and cardiac output',
      aliases: ['cardiac cycle', 'cardiac output', 'stroke volume'],
      requires: ['nursing/blood'],
      definition:
        'The cardiac cycle alternates systole and diastole; cardiac output equals heart rate times stroke volume, the volume ejected per beat.',
      misconceptions: [
        { claim: 'A faster heart rate always raises cardiac output.', correction: 'Beyond a point, short diastole cuts filling and stroke volume, so output falls despite the higher rate.' },
      ],
      workedExample: {
        setup: 'Heart rate 72 bpm, stroke volume 70 mL.',
        steps: ['CO = HR × SV = 72 × 70 mL.', 'Convert to liters: 5040 mL/min.'],
        answer: 'Cardiac output ≈ 5.0 L/min.',
      },
      citations: [{ title: 'CurriculumOS genome: cardiac cycle', source: 'genome', externalId: 'nursing/cardiac-cycle' }],
    },
    {
      key: 'nursing/blood-pressure',
      name: 'Blood pressure and its regulation',
      aliases: ['blood pressure', 'blood pressure regulation'],
      requires: ['nursing/cardiac-cycle'],
      definition:
        'Blood pressure is the force blood exerts on vessel walls, set by cardiac output and peripheral resistance and tuned by baroreceptor and hormonal feedback.',
      misconceptions: [
        { claim: 'Blood pressure is a single number.', correction: 'It is systolic over diastolic — the cycle’s peak and trough — and pulse pressure is their difference.' },
      ],
      citations: [{ title: 'CurriculumOS genome: blood pressure', source: 'genome', externalId: 'nursing/blood-pressure' }],
    },
    {
      key: 'nursing/gas-exchange',
      name: 'Gas exchange in the lungs',
      aliases: ['gas exchange', 'alveolar diffusion', 'respiration'],
      requires: ['nursing/blood'],
      definition:
        'Gas exchange moves oxygen and carbon dioxide across the alveolar membrane by diffusion down partial-pressure gradients.',
      misconceptions: [
        { claim: 'The lungs actively pump oxygen into the blood.', correction: 'Exchange is passive diffusion down partial-pressure gradients — no active transport at the alveolus.' },
      ],
      citations: [{ title: 'CurriculumOS genome: gas exchange', source: 'genome', externalId: 'nursing/gas-exchange' }],
    },
    {
      key: 'nursing/fluid-electrolyte',
      name: 'Fluid and electrolyte balance',
      aliases: ['fluid and electrolyte balance', 'electrolytes', 'fluid balance'],
      requires: ['nursing/homeostasis'],
      definition:
        'Fluid balance distributes water across compartments by osmosis; electrolytes set the osmotic gradients and the excitability of nerve and muscle.',
      misconceptions: [
        { claim: 'Drinking more water always corrects an electrolyte imbalance.', correction: 'Excess free water can dilute sodium into dangerous hyponatremia — balance, not volume, is the target.' },
      ],
      citations: [{ title: 'CurriculumOS genome: fluid and electrolyte balance', source: 'genome', externalId: 'nursing/fluid-electrolyte' }],
    },
    {
      key: 'nursing/immunity',
      name: 'Innate versus adaptive immunity',
      aliases: ['innate immunity', 'adaptive immunity', 'immunity'],
      requires: ['nursing/blood'],
      definition:
        'Innate immunity responds fast and nonspecifically; adaptive immunity is slower, specific, and remembers — vaccines exploit that memory.',
      misconceptions: [
        { claim: 'A stronger immune response is always better.', correction: 'Overreaction causes allergy and autoimmunity — regulation matters as much as strength.' },
      ],
      citations: [{ title: 'CurriculumOS genome: immunity', source: 'genome', externalId: 'nursing/immunity' }],
    },
    {
      key: 'nursing/inflammation',
      name: 'Inflammation and the cardinal signs',
      aliases: ['inflammation', 'cardinal signs'],
      requires: ['nursing/immunity'],
      definition:
        'Inflammation is the innate response to injury — redness, heat, swelling, pain, and lost function — driven by vasodilation and increased permeability.',
      misconceptions: [
        { claim: 'Inflammation is always harmful and should be suppressed.', correction: 'It is a protective, healing response; blanket suppression can impair clearance and repair.' },
      ],
      citations: [{ title: 'CurriculumOS genome: inflammation', source: 'genome', externalId: 'nursing/inflammation' }],
    },
    {
      key: 'nursing/bacterial-structure',
      name: 'Bacterial cell structure and the Gram stain',
      aliases: ['bacterial cell structure', 'gram stain', 'bacteria'],
      requires: ['nursing/structural-organization'],
      definition:
        'Bacteria are prokaryotes whose cell-wall peptidoglycan thickness determines Gram-stain result, which in turn guides antibiotic choice.',
      misconceptions: [
        { claim: 'Gram-positive and Gram-negative refer to whether bacteria are harmful.', correction: 'The stain reflects cell-wall structure, not pathogenicity — both groups contain dangerous and harmless species.' },
      ],
      citations: [{ title: 'CurriculumOS genome: bacterial structure', source: 'genome', externalId: 'nursing/bacterial-structure' }],
    },
    {
      key: 'nursing/viral-replication',
      name: 'Viral replication',
      aliases: ['viral replication', 'viral life cycle', 'viruses'],
      requires: ['nursing/bacterial-structure'],
      definition:
        'Viruses are obligate intracellular parasites that hijack host machinery to replicate, which is why antibiotics do nothing against them.',
      misconceptions: [
        { claim: 'Antibiotics treat viral infections like colds and flu.', correction: 'Antibiotics target bacterial machinery viruses lack — using them for viruses only breeds resistance.' },
      ],
      citations: [{ title: 'CurriculumOS genome: viral replication', source: 'genome', externalId: 'nursing/viral-replication' }],
    },
    {
      key: 'nursing/antimicrobial-resistance',
      name: 'Antimicrobial resistance',
      aliases: ['antimicrobial resistance', 'antibiotic resistance'],
      requires: ['nursing/bacterial-structure', 'nursing/viral-replication'],
      definition:
        'Resistance arises when selective pressure from antimicrobial use favors organisms carrying resistance traits, which then spread.',
      misconceptions: [
        { claim: 'A patient’s body becomes resistant to antibiotics.', correction: 'The bacteria evolve resistance, not the patient — stopping a course early selects for the survivors.' },
      ],
      citations: [{ title: 'CurriculumOS genome: antimicrobial resistance', source: 'genome', externalId: 'nursing/antimicrobial-resistance' }],
    },
    {
      key: 'nursing/disease-transmission',
      name: 'Modes of disease transmission',
      aliases: ['disease transmission', 'chain of infection'],
      requires: ['nursing/immunity'],
      definition:
        'The chain of infection links pathogen, reservoir, portal of exit, transmission mode, portal of entry, and susceptible host — breaking any link prevents spread.',
      misconceptions: [
        { claim: 'Hand hygiene matters only for visibly dirty hands.', correction: 'Transmission breaks at the hands regardless of visible soil — it is the single most effective link to sever.' },
      ],
      citations: [{ title: 'CurriculumOS genome: disease transmission', source: 'genome', externalId: 'nursing/disease-transmission' }],
    },
  ],
};
