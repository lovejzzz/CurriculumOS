import type { GenomeShard } from '../types.ts';

export const nutrition: GenomeShard = {
  id: 'nutrition',
  discipline: 'health',
  concepts: [
    {
      key: 'nutrition/nutrient-classes',
      name: 'The six classes of nutrients',
      aliases: ['six classes of nutrients', 'macronutrients and micronutrients', 'nutrients'],
      requires: [],
      definition:
        'The six nutrient classes are carbohydrates, lipids, proteins, vitamins, minerals, and water; the first three supply energy, the rest enable its use.',
      misconceptions: [
        { claim: 'Vitamins and minerals provide energy.', correction: 'Micronutrients carry no calories — they are cofactors that let energy metabolism run, not fuel.' },
      ],
      citations: [{ title: 'CurriculumOS genome: nutrient classes', source: 'genome', externalId: 'nutrition/nutrient-classes' }],
    },
    {
      key: 'nutrition/carbohydrates',
      name: 'Carbohydrates',
      aliases: ['carbohydrates', 'simple and complex carbohydrates', 'carbs'],
      requires: ['nutrition/nutrient-classes'],
      definition:
        'Carbohydrates range from simple sugars to complex starches; chain length and fiber content shape how fast blood glucose rises.',
      misconceptions: [
        { claim: 'All carbohydrates spike blood sugar equally.', correction: 'Fiber and structure slow digestion — lentils and candy are both carbs with very different glycemic responses.' },
      ],
      citations: [{ title: 'CurriculumOS genome: carbohydrates', source: 'genome', externalId: 'nutrition/carbohydrates' }],
    },
    {
      key: 'nutrition/fiber',
      name: 'Dietary fiber',
      aliases: ['dietary fiber', 'soluble and insoluble fiber', 'fiber'],
      requires: ['nutrition/carbohydrates'],
      definition:
        'Fiber is indigestible carbohydrate: soluble fiber forms gels that slow absorption and lower cholesterol, insoluble fiber adds bulk and speeds transit.',
      misconceptions: [
        { claim: 'Fiber has no effect because the body cannot digest it.', correction: 'Indigestibility is the point — fiber regulates transit, satiety, and the gut microbiome.' },
      ],
      citations: [{ title: 'CurriculumOS genome: dietary fiber', source: 'genome', externalId: 'nutrition/fiber' }],
    },
    {
      key: 'nutrition/proteins',
      name: 'Proteins and amino acids',
      aliases: ['proteins', 'amino acids'],
      requires: ['nutrition/nutrient-classes'],
      definition:
        'Proteins are chains of amino acids; nine are essential and must come from diet, and protein quality reflects how well a source supplies them.',
      misconceptions: [
        { claim: 'More dietary protein builds proportionally more muscle.', correction: 'Above need, surplus protein is oxidized or stored as fat — synthesis is capped by stimulus, not just intake.' },
      ],
      citations: [{ title: 'CurriculumOS genome: proteins', source: 'genome', externalId: 'nutrition/proteins' }],
    },
    {
      key: 'nutrition/lipids',
      name: 'Lipids',
      aliases: ['lipids', 'fats', 'saturated, unsaturated, and trans fats'],
      requires: ['nutrition/nutrient-classes'],
      definition:
        'Dietary lipids include triglycerides, phospholipids, and sterols; fatty-acid saturation and trans configuration drive their effects on cardiovascular risk.',
      misconceptions: [
        { claim: 'All dietary fat is bad for you.', correction: 'Unsaturated fats are protective; the problematic ones are trans fats and excess saturated fat — type matters more than total.' },
      ],
      citations: [{ title: 'CurriculumOS genome: lipids', source: 'genome', externalId: 'nutrition/lipids' }],
    },
    {
      key: 'nutrition/vitamins',
      name: 'Fat-soluble and water-soluble vitamins',
      aliases: ['vitamins', 'fat-soluble and water-soluble vitamins'],
      requires: ['nutrition/lipids'],
      definition:
        'Water-soluble vitamins (B, C) wash out and need regular intake; fat-soluble vitamins (A, D, E, K) store in tissue and can reach toxic levels.',
      misconceptions: [
        { claim: 'You cannot overdose on vitamins.', correction: 'Fat-soluble vitamins accumulate — excess vitamin A or D is genuinely toxic.' },
      ],
      citations: [{ title: 'CurriculumOS genome: vitamins', source: 'genome', externalId: 'nutrition/vitamins' }],
    },
    {
      key: 'nutrition/minerals',
      name: 'Major minerals and electrolytes',
      aliases: ['minerals', 'major minerals and electrolytes'],
      requires: ['nutrition/nutrient-classes'],
      definition:
        'Minerals are inorganic elements with structural and regulatory roles; electrolytes like sodium and potassium govern fluid balance and nerve signaling.',
      misconceptions: [
        { claim: 'Sodium is simply unhealthy and should be eliminated.', correction: 'Sodium is an essential electrolyte — the problem is chronic excess, not its presence.' },
      ],
      citations: [{ title: 'CurriculumOS genome: minerals', source: 'genome', externalId: 'nutrition/minerals' }],
    },
    {
      key: 'nutrition/water',
      name: 'Water and hydration',
      aliases: ['water', 'hydration'],
      requires: ['nutrition/minerals'],
      definition:
        'Water is the medium for every metabolic reaction and the regulator of temperature and volume; needs vary with activity, climate, and diet.',
      misconceptions: [
        { claim: 'Everyone needs exactly eight glasses of water a day.', correction: 'Requirements vary widely and food contributes substantial water — thirst and urine color guide better than a fixed count.' },
      ],
      citations: [{ title: 'CurriculumOS genome: water and hydration', source: 'genome', externalId: 'nutrition/water' }],
    },
    {
      key: 'nutrition/digestion',
      name: 'Digestion and absorption',
      aliases: ['digestion and absorption', 'GI tract', 'digestion'],
      requires: ['nutrition/nutrient-classes'],
      definition:
        'Digestion mechanically and enzymatically breaks food into absorbable units along the GI tract; the small intestine is where most absorption occurs.',
      misconceptions: [
        { claim: 'The stomach does most of the digestion and absorption.', correction: 'The stomach mostly stores and acidifies — most enzymatic digestion and nearly all absorption happen in the small intestine.' },
      ],
      citations: [{ title: 'CurriculumOS genome: digestion', source: 'genome', externalId: 'nutrition/digestion' }],
    },
    {
      key: 'nutrition/energy-balance',
      name: 'Energy balance and metabolism',
      aliases: ['energy balance', 'metabolism', 'calories in versus calories out', 'kcal'],
      requires: ['nutrition/carbohydrates', 'nutrition/lipids', 'nutrition/proteins'],
      definition:
        'Body weight tracks the balance between energy consumed and energy expended (basal metabolism, activity, and the thermic effect of food).',
      misconceptions: [
        { claim: 'A calorie of any food affects weight identically.', correction: 'Energy balance holds, but macronutrient source changes satiety, thermic effect, and what you eat next — calories are not behaviorally interchangeable.' },
      ],
      workedExample: {
        setup: 'Intake 2,200 kcal/day; expenditure 2,600 kcal/day.',
        steps: ['Deficit = 2,600 − 2,200 = 400 kcal/day.', '~7,700 kcal ≈ 1 kg fat, so weekly deficit ≈ 2,800 kcal.'],
        answer: 'About 0.36 kg/week loss, all else equal.',
      },
      citations: [{ title: 'CurriculumOS genome: energy balance', source: 'genome', externalId: 'nutrition/energy-balance' }],
    },
    {
      key: 'nutrition/eating-patterns',
      name: 'Healthy eating patterns',
      aliases: ['healthy eating patterns', 'myplate', 'dietary guidelines'],
      requires: ['nutrition/energy-balance'],
      definition:
        'Dietary guidance has shifted from single nutrients to overall patterns — MyPlate emphasizes proportions of vegetables, grains, protein, and fruit.',
      misconceptions: [
        { claim: 'A healthy diet is defined by avoiding specific bad foods.', correction: 'Overall pattern and proportion matter more than any single villain food.' },
      ],
      citations: [{ title: 'CurriculumOS genome: eating patterns', source: 'genome', externalId: 'nutrition/eating-patterns' }],
    },
    {
      key: 'nutrition/food-labels',
      name: 'Reading a Nutrition Facts label',
      aliases: ['nutrition facts label', 'percent daily value', 'reading labels'],
      requires: ['nutrition/eating-patterns'],
      definition:
        'The Nutrition Facts label reports amounts per a stated serving with %Daily Value benchmarks; serving size is the hidden multiplier most readers miss.',
      misconceptions: [
        { claim: 'The numbers on a label describe the whole package.', correction: 'They describe one serving — a package may hold several, multiplying every number.' },
      ],
      citations: [{ title: 'CurriculumOS genome: food labels', source: 'genome', externalId: 'nutrition/food-labels' }],
    },
  ],
};
