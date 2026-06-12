import type { GenomeShard } from '../types.ts';

export const stats: GenomeShard = {
  id: 'stats',
  discipline: 'stem-quant',
  concepts: [
    {
      key: 'stats/data-provenance',
      name: 'Data provenance',
      aliases: ['how the data were collected', 'data collection'],
      requires: [],
      definition:
        'Every analysis inherits the strengths and biases of how its data were collected; provenance — who measured what, when, and why — comes before any computation.',
      misconceptions: [
        { claim: 'A big enough sample fixes bad collection.', correction: 'Bias does not average out — a million biased rows estimate the wrong quantity precisely.' },
      ],
      citations: [{ title: 'CurriculumOS genome: data provenance', source: 'genome', externalId: 'stats/data-provenance' }],
    },
    {
      key: 'stats/confounding',
      name: 'Confounding variables',
      aliases: ['confounding', 'observational studies', 'spurious association', 'lurking variables'],
      requires: ['stats/data-provenance'],
      definition:
        'A confounder influences both the explanatory and response variables, manufacturing association where no causal link runs between them.',
      misconceptions: [
        { claim: 'Adjusting for more variables always reduces confounding.', correction: 'Adjusting for a variable on the causal path, or a collider, can create bias rather than remove it.' },
      ],
      citations: [{ title: 'CurriculumOS genome: confounding', source: 'genome', externalId: 'stats/confounding' }],
    },
    {
      key: 'stats/sampling-distribution',
      name: 'Sampling distribution',
      aliases: ['sampling distribution of the sample mean', 'sampling variability'],
      requires: ['stats/data-provenance'],
      definition:
        'The sampling distribution describes how a statistic would vary across repeated samples — it is the bridge from one observed sample to claims about the population.',
      misconceptions: [
        { claim: 'The sampling distribution is the distribution of the data.', correction: 'It is the distribution of a statistic across hypothetical repeated samples — a different object entirely.' },
      ],
      citations: [{ title: 'CurriculumOS genome: sampling distributions', source: 'genome', externalId: 'stats/sampling-distribution' }],
    },
    {
      key: 'stats/central-limit-theorem',
      name: 'Central limit theorem',
      aliases: ['CLT'],
      requires: ['stats/sampling-distribution'],
      definition:
        'For large samples, the sampling distribution of the mean is approximately normal regardless of the population shape, with spread shrinking as √n grows.',
      misconceptions: [
        { claim: 'The CLT says large datasets become normally distributed.', correction: 'The data keep their shape — it is the distribution of the sample MEAN that normalizes.' },
      ],
      workedExample: {
        setup: 'Household incomes are right-skewed with σ = $40,000. You sample n = 400.',
        steps: ['The mean’s sampling distribution is ≈ normal by CLT.', 'Standard error = 40,000 / √400 = 2,000.'],
        answer: 'The sample mean varies with SE ≈ $2,000, nearly normal despite the skewed population.',
      },
      citations: [{ title: 'CurriculumOS genome: central limit theorem', source: 'genome', externalId: 'stats/central-limit-theorem' }],
    },
    {
      key: 'stats/p-value',
      name: 'P-value',
      aliases: ['significance probability', 'p values'],
      requires: ['stats/sampling-distribution'],
      definition:
        'A p-value is the probability, computed under the null hypothesis, of data at least as extreme as observed — a measure of surprise, not of truth.',
      misconceptions: [
        { claim: 'p = 0.03 means a 3% chance the null hypothesis is true.', correction: 'The p-value conditions ON the null — it cannot be the probability OF the null; that inversion is the field’s most common error.' },
      ],
      citations: [{ title: 'CurriculumOS genome: the p-value', source: 'genome', externalId: 'stats/p-value' }],
    },
    {
      key: 'stats/hypothesis-testing',
      name: 'Hypothesis testing',
      aliases: ['significance testing', 'null hypothesis'],
      requires: ['stats/p-value'],
      definition:
        'A hypothesis test pits observed data against a null model, controlling how often a true null gets rejected (α) at the price of sometimes missing real effects (power).',
      misconceptions: [
        { claim: 'Failing to reject the null proves there is no effect.', correction: 'Absence of evidence is not evidence of absence — low power makes real effects invisible.' },
      ],
      citations: [{ title: 'CurriculumOS genome: hypothesis testing', source: 'genome', externalId: 'stats/hypothesis-testing' }],
    },
    {
      key: 'stats/statistical-model',
      name: 'Statistical model',
      aliases: ['model assumptions', 'the statistical model'],
      requires: ['stats/sampling-distribution'],
      definition:
        'A statistical model is a set of assumptions about how data arise; every inference is conditional on those assumptions holding well enough.',
      misconceptions: [
        { claim: 'Software output is valid regardless of assumptions.', correction: 'The formulas assume the model — violated assumptions silently invalidate the printed intervals and p-values.' },
      ],
      citations: [{ title: 'CurriculumOS genome: statistical models', source: 'genome', externalId: 'stats/statistical-model' }],
    },
    {
      key: 'stats/regression',
      name: 'Regression and least squares',
      aliases: ['regression model', 'least squares', 'linear regression'],
      requires: ['stats/statistical-model'],
      definition:
        'Least-squares regression fits the line minimizing squared vertical errors, estimating how the mean response shifts per unit of the predictor.',
      misconceptions: [
        { claim: 'The regression slope tells you what happens if you intervene on x.', correction: 'Observational slopes describe association — intervention claims need causal assumptions or experiments.' },
      ],
      workedExample: {
        setup: 'Fitted line: exam = 40 + 5 × hours_studied.',
        steps: ['Slope 5: each extra hour associates with 5 more points on average.', 'Intercept 40: predicted score at zero hours.'],
        answer: 'A student studying 6 hours has predicted score 70 — an average, not a guarantee.',
      },
      citations: [{ title: 'CurriculumOS genome: regression', source: 'genome', externalId: 'stats/regression' }],
    },
    {
      key: 'stats/correlation-causation',
      name: 'Correlation versus causation',
      aliases: ['correlation', 'causation'],
      requires: ['stats/confounding', 'stats/regression'],
      definition:
        'Correlation measures linear co-movement; causal claims additionally require ruling out confounding, reverse causation, and selection — design does that work, not the coefficient.',
      misconceptions: [
        { claim: 'A strong correlation is evidence of causation.', correction: 'Strength is symmetric and confounders are strong too — ice cream sales and drownings correlate at r ≈ 0.9 through summer.' },
      ],
      citations: [{ title: 'CurriculumOS genome: correlation vs causation', source: 'genome', externalId: 'stats/correlation-causation' }],
    },
    {
      key: 'stats/visualization',
      name: 'Data visualization',
      aliases: ['data visualizations', 'charts and graphs', 'producing data visualizations'],
      requires: ['stats/data-provenance'],
      definition:
        'A good graphic encodes data in positions and lengths the eye decodes accurately; truncated axes and area encodings are where charts learn to lie.',
      misconceptions: [
        { claim: 'A chart is neutral because it shows the raw numbers.', correction: 'Axis ranges, binning, and aspect ratio are choices — the same data can whisper or scream.' },
      ],
      citations: [{ title: 'CurriculumOS genome: data visualization', source: 'genome', externalId: 'stats/visualization' }],
    },
    {
      key: 'stats/confidence-interval',
      name: 'Confidence intervals',
      aliases: ['confidence interval', 'interval estimation'],
      requires: ['stats/central-limit-theorem'],
      definition:
        'A 95% confidence interval comes from a procedure that captures the true parameter in 95% of repeated samples; any single interval either contains it or does not.',
      misconceptions: [
        { claim: 'There is a 95% probability the parameter lies inside this interval.', correction: 'The 95% describes the procedure across repetitions — the realized interval has no probability left in it.' },
      ],
      citations: [{ title: 'CurriculumOS genome: confidence intervals', source: 'genome', externalId: 'stats/confidence-interval' }],
    },
    {
      key: 'stats/survey-bias',
      name: 'Survey design and collection bias',
      aliases: ['survey design', 'data collection bias', 'nonresponse bias', 'sampling bias'],
      requires: ['stats/data-provenance'],
      definition:
        'Surveys fail through frame errors, nonresponse, and question wording long before sampling error matters; randomization of selection is the only cure for selection bias.',
      misconceptions: [
        { claim: 'A huge voluntary online poll beats a small random sample.', correction: 'The 1936 Literary Digest poll had 2.4 million responses and missed by 19 points — volunteers are not a random sample.' },
      ],
      citations: [{ title: 'CurriculumOS genome: survey bias', source: 'genome', externalId: 'stats/survey-bias' }],
    },
  ],
};
