import type { GenomeShard } from '../types.ts';

/** Econ shard. The price-elasticity → demand-curve prerequisite edge is the
 *  Crucible's seeded gap (050-fixtures): a course that teaches elasticity
 *  before the demand curve MUST be diagnosed and bridged. */
export const econ: GenomeShard = {
  id: 'econ',
  discipline: 'social-science',
  concepts: [
    {
      key: 'econ/economic-model',
      name: 'Economic model',
      aliases: ['the economic model', 'simplifying assumptions', 'economic models'],
      requires: [],
      definition:
        'An economic model is a deliberately simplified representation of how people and markets behave, built to isolate one mechanism at a time.',
      misconceptions: [
        {
          claim: 'A model with unrealistic assumptions is useless.',
          correction:
            'Models trade realism for clarity; the test of a model is whether its predictions survive contact with data, not whether its assumptions photograph the world.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: economic modeling', source: 'genome', externalId: 'econ/economic-model' }],
    },
    {
      key: 'econ/opportunity-cost',
      name: 'Opportunity cost',
      aliases: ['trade-offs', 'opportunity costs'],
      requires: [],
      definition:
        'The opportunity cost of a choice is the value of the best alternative given up, not the money spent on the choice itself.',
      misconceptions: [
        {
          claim: 'Opportunity cost equals the price paid.',
          correction:
            'Price is part of it, but opportunity cost is the whole foregone alternative — a free concert still costs the evening you could have spent studying.',
        },
      ],
      workedExample: {
        setup: 'You can spend Saturday working a shift that pays $90 or studying for an exam you value at $120 of grade improvement.',
        steps: [
          'List the alternatives: work ($90) vs study (valued $120).',
          'Choose study; the opportunity cost is the $90 shift you gave up.',
        ],
        answer: 'Opportunity cost of studying = $90 (the foregone shift), not $120.',
      },
      citations: [{ title: 'CurriculumOS genome: opportunity cost', source: 'genome', externalId: 'econ/opportunity-cost' }],
    },
    {
      key: 'econ/comparative-advantage',
      name: 'Comparative advantage',
      aliases: ['gains from trade', 'absolute advantage'],
      requires: ['econ/opportunity-cost'],
      definition:
        'A producer has comparative advantage in a good when they can produce it at lower opportunity cost than others, which is what makes trade mutually beneficial.',
      misconceptions: [
        {
          claim: 'A country that is worse at producing everything gains nothing from trade.',
          correction:
            'Gains from trade follow comparative, not absolute, advantage — even an absolutely less productive country has a lowest-opportunity-cost good to export.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: comparative advantage', source: 'genome', externalId: 'econ/comparative-advantage' }],
    },
    {
      key: 'econ/utility-maximization',
      name: 'Utility maximization',
      aliases: ['consumer choice', 'utility', 'marginal utility'],
      requires: ['econ/opportunity-cost'],
      definition:
        'Consumers maximize utility by allocating their budget so the marginal utility per dollar is equal across goods.',
      misconceptions: [
        {
          claim: 'Maximizing utility means buying the most of what you like best.',
          correction:
            'It means equalizing marginal utility per dollar — past some quantity, another unit of your favorite good buys less satisfaction than a dollar elsewhere.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: utility maximization', source: 'genome', externalId: 'econ/utility-maximization' }],
    },
    {
      key: 'econ/demand-curve',
      name: 'Demand curve',
      aliases: ['law of demand', 'the demand curve', 'demand'],
      requires: [],
      definition:
        'The demand curve maps each price to the quantity buyers are willing and able to purchase; the law of demand says this relationship slopes downward.',
      misconceptions: [
        {
          claim: 'A price change shifts the demand curve.',
          correction:
            'A price change moves you along the curve; only non-price factors (income, tastes, substitutes) shift the curve itself.',
        },
      ],
      workedExample: {
        setup: 'At $5 a café sells 200 lattes a day; at $4 it sells 260.',
        steps: [
          'Plot the two price–quantity pairs.',
          'Falling price, rising quantity demanded — a movement along a downward-sloping curve.',
        ],
        answer: 'The two observations trace the demand curve; nothing shifted.',
      },
      citations: [{ title: 'CurriculumOS genome: the demand curve', source: 'genome', externalId: 'econ/demand-curve' }],
    },
    {
      key: 'econ/price-elasticity-of-demand',
      name: 'Price elasticity of demand',
      aliases: ['elasticity', 'elastic versus inelastic', 'price elasticity'],
      requires: ['econ/demand-curve'],
      definition:
        'Price elasticity of demand measures how strongly quantity demanded responds to price: the percent change in quantity divided by the percent change in price.',
      misconceptions: [
        {
          claim: 'Elasticity is the same as the slope of the demand curve.',
          correction:
            'Elasticity is a ratio of percentage changes, so it varies along a straight-line demand curve even though the slope is constant.',
        },
      ],
      workedExample: {
        setup: 'A 10% price increase cuts ticket sales by 25%.',
        steps: ['Elasticity = %ΔQ / %ΔP = −25% / 10%.', 'Magnitude 2.5 > 1, so demand is elastic.'],
        answer: 'Elasticity = −2.5; revenue falls when price rises.',
      },
      citations: [{ title: 'CurriculumOS genome: price elasticity of demand', source: 'genome', externalId: 'econ/price-elasticity-of-demand' }],
    },
    {
      key: 'econ/supply-curve',
      name: 'Supply curve',
      aliases: ['law of supply', 'supply'],
      requires: [],
      definition:
        'The supply curve maps each price to the quantity sellers are willing to produce; it slopes upward because higher prices cover higher marginal costs.',
      misconceptions: [
        {
          claim: 'Sellers always supply more when they want more money.',
          correction:
            'Supply responds to price against marginal cost — wanting revenue does not lower the cost of producing the next unit.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: the supply curve', source: 'genome', externalId: 'econ/supply-curve' }],
    },
    {
      key: 'econ/market-equilibrium',
      name: 'Market equilibrium',
      aliases: ['supply and demand balance', 'equilibrium price'],
      requires: ['econ/demand-curve', 'econ/supply-curve'],
      definition:
        'Equilibrium is the price at which quantity demanded equals quantity supplied; surpluses push price down toward it and shortages push price up.',
      misconceptions: [
        {
          claim: 'Equilibrium means the market outcome is fair or optimal for everyone.',
          correction:
            'Equilibrium is a balance of plans, not a verdict on fairness — markets can clear at prices society finds troubling.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: market equilibrium', source: 'genome', externalId: 'econ/market-equilibrium' }],
    },
    {
      key: 'econ/externalities',
      name: 'Externalities',
      aliases: ['spillover costs', 'externality', 'spillovers'],
      requires: ['econ/market-equilibrium'],
      definition:
        'An externality is a cost or benefit that lands on someone outside the transaction, so the market price fails to carry the full social cost.',
      misconceptions: [
        {
          claim: 'If pollution is legal, it is not an economic problem.',
          correction:
            'Legality does not internalize cost — unpriced spillovers still push output past the socially efficient level.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: externalities', source: 'genome', externalId: 'econ/externalities' }],
    },
    {
      key: 'econ/monopoly',
      name: 'Monopoly',
      aliases: ['market power', 'monopolist'],
      requires: ['econ/market-equilibrium'],
      definition:
        'A monopolist faces the whole market demand curve and restricts output to raise price above marginal cost, creating deadweight loss.',
      misconceptions: [
        {
          claim: 'Monopolies can charge any price they like.',
          correction:
            'Even a monopolist is disciplined by demand — raise price and quantity sold falls; the chosen price maximizes profit, not greed.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: monopoly and market power', source: 'genome', externalId: 'econ/monopoly' }],
    },
    {
      key: 'econ/circular-flow',
      name: 'Circular flow of income',
      aliases: ['circular flow', 'circular flow diagram'],
      requires: [],
      definition:
        'The circular flow model traces spending and income between households and firms through product and factor markets — every expenditure is someone’s income.',
      misconceptions: [
        {
          claim: 'Money leaves the economy when it is spent.',
          correction: 'Spending is income on the other side of the same flow; leakages and injections, not spending itself, change the loop.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: circular flow', source: 'genome', externalId: 'econ/circular-flow' }],
    },
    {
      key: 'econ/capital-accumulation',
      name: 'Capital accumulation',
      aliases: ['net investment', 'capital stock'],
      requires: ['econ/circular-flow'],
      definition:
        'Capital accumulates when gross investment exceeds depreciation; net investment is what actually grows the capital stock.',
      misconceptions: [
        {
          claim: 'All investment grows the economy.',
          correction: 'Investment that merely replaces worn-out capital holds the stock constant — only net investment adds capacity.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: capital accumulation', source: 'genome', externalId: 'econ/capital-accumulation' }],
    },
    {
      key: 'econ/unemployment-classification',
      name: 'Labor force classification',
      aliases: ['who counts as unemployed', 'unemployment rate', 'labor force'],
      requires: [],
      definition:
        'The unemployed are those without work who actively searched recently; discouraged workers who stopped searching leave the labor force entirely.',
      misconceptions: [
        {
          claim: 'The unemployment rate counts everyone without a job.',
          correction:
            'Students, retirees, and discouraged workers are out of the labor force — the rate can fall because people gave up, not because they found work.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: labor force classification', source: 'genome', externalId: 'econ/unemployment-classification' }],
    },
    {
      key: 'econ/natural-experiment',
      name: 'Natural experiment',
      aliases: ['policy evaluation', 'natural experiments'],
      requires: ['econ/economic-model'],
      definition:
        'A natural experiment exploits a policy change or external shock that assigns treatment as-if randomly, letting economists estimate causal effects without a lab.',
      misconceptions: [
        {
          claim: 'Comparing outcomes before and after a policy proves the policy caused the change.',
          correction:
            'Before–after comparisons absorb every other contemporaneous change; a credible natural experiment needs a comparison group the shock missed.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: natural experiments', source: 'genome', externalId: 'econ/natural-experiment' }],
    },
  ],
};
