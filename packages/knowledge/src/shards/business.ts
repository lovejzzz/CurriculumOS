import type { GenomeShard } from '../types.ts';

/** Business-ethics shard (V0.0.8, workstream E). The business-ethics stranger
 *  graded generically until now. Worked examples are mini-cases — the
 *  discipline is taught by case discussion, so kernels carry decidable
 *  scenarios rather than excerpts. */
export const business: GenomeShard = {
  id: 'business',
  discipline: 'business',
  concepts: [
    {
      key: 'business/business-ethics',
      name: 'Business ethics',
      aliases: ['what business ethics is and why it matters', 'what business ethics is', 'ethics in business', 'why business ethics matters'],
      requires: [],
      definition:
        'Business ethics applies moral reasoning to commerce: what firms and the people inside them owe customers, employees, investors, and society — beyond what law compels and even when it costs.',
      misconceptions: [
        {
          claim: 'If it is legal, it is ethical.',
          correction: 'Law is a floor, late and local: legal conduct can be plainly wrong (pre-regulation asbestos sales) and illegal conduct occasionally defensible — the ethical question survives full legal compliance.',
        },
        {
          claim: '"Business ethics" is a contradiction — business simply maximizes profit.',
          correction: 'Markets themselves presuppose ethics (promise-keeping, honest disclosure, trust); without those norms contracts and exchange collapse — ethics is commerce’s infrastructure, not its opponent.',
        },
      ],
      workedExample: {
        setup: 'A landlord learns a unit has non-dangerous but unpleasant plumbing noise. Disclosure is not legally required. Tell prospective tenants?',
        steps: ['Separate the questions: what does law require, and what does honesty require?', 'Test by roles: would you accept non-disclosure as the tenant?', 'Price the candor: disclosure may cost rent but builds the reputation the business runs on.'],
        answer: 'The legal floor and the ethical answer diverge — the case shows why "is it legal?" cannot be the whole decision procedure.',
      },
      citations: [{ title: 'CurriculumOS genome: business ethics', source: 'genome', externalId: 'business/business-ethics' }],
    },
    {
      key: 'business/ethical-frameworks',
      name: 'Ethical frameworks for business',
      aliases: ['major ethical frameworks', 'utilitarianism, deontology, and virtue ethics', 'ethical frameworks', 'ethical decision frameworks'],
      requires: ['business/business-ethics'],
      definition:
        'Three frameworks structure business cases: utilitarian analysis weighs total welfare across all affected; deontology tests duties and rights that hold regardless of payoff (no deception, no mere-means use of persons); virtue ethics asks what the honest, just practitioner would do.',
      misconceptions: [
        {
          claim: 'Utilitarianism is just cost-benefit analysis with the firm’s numbers.',
          correction: 'Utilitarian welfare counts EVERYONE affected — workers, neighbors, future customers — not shareholder dollars; a project profitable to the firm and net-harmful to the world flatly fails the utilitarian test.',
        },
        {
          claim: 'Pick whichever framework supports the decision you already prefer.',
          correction: 'Framework-shopping is rationalization, the thing the tools exist to prevent: rigor means running ALL three and treating disagreement between them as the signal that the case is genuinely hard.',
        },
      ],
      workedExample: {
        setup: 'A manager can hit quarter targets by quietly reducing package contents at the same price ("shrinkflation") with a tiny label update.',
        steps: ['Utilitarian: small per-customer loss × millions of customers vs one firm’s gain — likely net negative.', 'Deontological: the design relies on customers NOT noticing — engineered non-consent fails the deception test.', 'Virtue: would an honest merchant be proud to explain the practice aloud?'],
        answer: 'All three frameworks converge on no — convergence is the strongest verdict the toolkit gives.',
      },
      citations: [{ title: 'CurriculumOS genome: ethical frameworks', source: 'genome', externalId: 'business/ethical-frameworks' }],
    },
    {
      key: 'business/csr',
      name: 'Corporate social responsibility',
      aliases: ['corporate social responsibility', 'csr', 'the social responsibility of business', 'corporate citizenship'],
      requires: ['business/ethical-frameworks'],
      definition:
        'CSR asks what firms owe society beyond legal profit-seeking. Friedman’s shareholder view says executives spend others’ money when they pursue social goals; the responsive view answers that firms hold social license, externalize costs, and owe the publics that bear them.',
      misconceptions: [
        {
          claim: 'CSR is philanthropy — donations and volunteer days.',
          correction: 'Giving is the smallest piece: the core questions are how the money is MADE — supply-chain labor, emissions, product safety, tax conduct; a polluter with a foundation has not answered them.',
        },
        {
          claim: 'Friedman held that business has no ethical obligations at all.',
          correction: 'His own formula requires staying "within the rules of the game... without deception or fraud" — the argument is about WHO should pursue social goals (owners and states, not managers), not a license for misconduct.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: corporate social responsibility', source: 'genome', externalId: 'business/csr' }],
    },
    {
      key: 'business/stakeholder-theory',
      name: 'Stakeholder theory',
      aliases: ['stakeholder theory', 'stakeholders versus shareholders', 'stakeholder management', 'freeman'],
      requires: ['business/csr'],
      definition:
        'Stakeholder theory (Freeman) holds that managers owe consideration to every group whose cooperation the firm needs or whose interests it puts at risk — employees, customers, suppliers, communities, investors — and that trade-offs among them are management’s real job.',
      misconceptions: [
        {
          claim: 'Stakeholder theory means every group gets an equal vote on every decision.',
          correction: 'The claim is about whose interests COUNT in managerial reasoning, not governance mechanics: weighing affected interests seriously is compatible with ordinary authority structures.',
        },
        {
          claim: 'Shareholder and stakeholder views always prescribe different actions.',
          correction: 'Over long horizons they often converge (mistreating customers destroys shareholder value too); the live disagreements are at the margins — plant closures, one-shot windfalls — where time horizon and who-bears-risk diverge.',
        },
      ],
      workedExample: {
        setup: 'A profitable plant can be closed and production offshored for a 4% margin gain. Map the decision as a stakeholder analysis.',
        steps: ['List stakes: 800 jobs and a town’s tax base; customers (unchanged); shareholders (+4%); the acquiring region (new jobs).', 'Identify the asymmetry: shareholders are diversified, the town is not — concentrated harm vs dispersed gain.', 'Generate options between the extremes: phased transition, retraining funds, sale to operators.'],
        answer: 'Stakeholder analysis does not forbid the closure; it forbids pretending the only number is the 4%.',
      },
      citations: [{ title: 'CurriculumOS genome: stakeholder theory', source: 'genome', externalId: 'business/stakeholder-theory' }],
    },
    {
      key: 'business/whistleblowing',
      name: 'Whistleblowing and organizational loyalty',
      aliases: ['whistleblowing and organizational loyalty', 'whistleblowing', 'organizational loyalty', 'internal reporting'],
      requires: ['business/ethical-frameworks'],
      definition:
        'Whistleblowing is the disclosure of organizational wrongdoing to parties able to act on it. The standard view justifies it when the harm is serious, internal channels are exhausted or futile, and the evidence would convince a reasonable observer — loyalty sets the bar, harm clears it.',
      misconceptions: [
        {
          claim: 'Whistleblowing is betrayal — loyal employees keep problems inside.',
          correction: 'Loyalty to an organization is loyalty to its legitimate purposes, not to its cover-ups; when internal channels are exhausted and harm is grave, disclosure can BE the loyal act — the one that serves what the firm claims to stand for.',
        },
        {
          claim: 'If you see anything questionable, go straight to the press.',
          correction: 'The justification is structured: severity, evidence, and exhausted internal remedies come first — skipping functional channels harms colleagues and weakens the case; the ethics covers HOW one blows the whistle, not just whether.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: whistleblowing', source: 'genome', externalId: 'business/whistleblowing' }],
    },
    {
      key: 'business/conflicts-of-interest',
      name: 'Conflicts of interest',
      aliases: ['conflicts of interest', 'conflict of interest', 'self-dealing', 'disclosure and recusal'],
      requires: ['business/business-ethics'],
      definition:
        'A conflict of interest exists when a private interest could bias judgment someone else is entitled to trust — the conflict is the SITUATION, not the misconduct; the remedies are disclosure, recusal, and structural separation, in rising order of strength.',
      misconceptions: [
        {
          claim: 'Having a conflict of interest means you did something wrong.',
          correction: 'The conflict is a state of affairs (your brother’s firm is bidding); wrongdoing begins when it is concealed or acted on — which is why the duty is to DISCLOSE the situation, not to apologize for it.',
        },
        {
          claim: 'Disclosure fixes everything.',
          correction: 'Disclosure transfers the problem to the person told; biased judgment can persist after announcement (and research shows disclosure can even license it) — serious conflicts require recusal, not narration.',
        },
      ],
      workedExample: {
        setup: 'A procurement officer’s evaluation shortlist includes a vendor founded by her former business partner.',
        steps: ['Name the situation: a relationship that could bias scoring others must trust.', 'Disclose to the decision owner BEFORE scoring.', 'Apply the stronger remedy: recuse from this evaluation; structural fix if it recurs.'],
        answer: 'Disclosure then recusal — the officer who says "I can stay objective" has misunderstood that the conflict, not her character, is the problem.',
      },
      citations: [{ title: 'CurriculumOS genome: conflicts of interest', source: 'genome', externalId: 'business/conflicts-of-interest' }],
    },
    {
      key: 'business/workplace-rights',
      name: 'Fair employment and workplace rights',
      aliases: ['fair employment and workplace rights', 'fair employment', 'workplace rights', 'employment at will', 'workplace discrimination'],
      requires: ['business/ethical-frameworks'],
      definition:
        'Workplace ethics covers hiring and firing justice (what at-will employment may and may not mean), discrimination and its remedies, privacy against monitoring, and due process — the question is which employee claims are RIGHTS rather than perks.',
      misconceptions: [
        {
          claim: 'At-will employment means any dismissal is ethically fine.',
          correction: 'At-will is a legal default riddled with exceptions (retaliation, discrimination), and the ethical question stands apart: dismissal without notice or reason can be legal and still fail every fairness test the firm itself uses elsewhere.',
        },
        {
          claim: 'Discrimination only means intentional, stated bias.',
          correction: 'Neutral-seeming practices with unjustified disparate impact (a strength test irrelevant to the job) are the harder, commoner case — intent is one route to wrong, not its definition.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: workplace rights', source: 'genome', externalId: 'business/workplace-rights' }],
    },
    {
      key: 'business/consumer-protection',
      name: 'Consumer protection and product safety',
      aliases: ['consumer protection and product safety', 'consumer protection', 'product safety', 'duty to warn', 'product recalls'],
      requires: ['business/ethical-frameworks'],
      definition:
        'Firms owe consumers safety proportional to what they cannot inspect for themselves: a duty to warn of known hazards, to not externalize discoverable risks, and to recall when field evidence turns statistical — caveat emptor fails wherever information is asymmetric.',
      misconceptions: [
        {
          claim: 'Meeting the regulatory safety standard discharges the duty.',
          correction: 'Standards lag the firm’s OWN knowledge: when internal testing reveals a hazard regulators have not codified, the knowledge itself creates the duty — compliance with yesterday’s rule does not answer for today’s data.',
        },
        {
          claim: 'A recall decision is just expected-cost arithmetic.',
          correction: 'The Pinto memo is the canon counterexample: pricing burn deaths against a $11 part treated customers’ lives as the firm’s money — rights-based limits exist exactly to block that trade, and the market punished it too.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: consumer protection', source: 'genome', externalId: 'business/consumer-protection' }],
    },
    {
      key: 'business/sustainability',
      name: 'Environmental responsibility and sustainability',
      aliases: ['environmental responsibility and sustainability', 'environmental responsibility', 'sustainability', 'externalities and the environment', 'triple bottom line'],
      requires: ['business/csr'],
      definition:
        'Environmental ethics in business starts from externalities — costs (emissions, depletion) pushed onto parties outside the transaction — and asks what firms owe when law does not yet price them: internalize, disclose honestly, and weigh obligations to people not yet born.',
      misconceptions: [
        {
          claim: 'Sustainability is a marketing posture — green claims are interchangeable.',
          correction: 'The difference between audited reduction targets and adjective-laden advertising is the difference between accounting and greenwash; vague claims ("eco-friendly") that imply unearned virtue are a deception problem, not a style choice.',
        },
        {
          claim: 'If a pollutant is legal to emit, emitting it raises no ethical question.',
          correction: 'Legality does not price the harm — the neighbors breathing it did not consent and were not paid; an uncompensated, known externality is the textbook case of legal-but-wrong.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: sustainability', source: 'genome', externalId: 'business/sustainability' }],
    },
    {
      key: 'business/marketing-ethics',
      name: 'Ethics in marketing and advertising',
      aliases: ['ethics in marketing and advertising', 'marketing ethics', 'advertising ethics', 'deceptive advertising', 'dark patterns'],
      requires: ['business/consumer-protection'],
      definition:
        'Marketing ethics draws the line between persuasion and manipulation: deception (false or misleading claims), exploitation of vulnerable audiences (children, the desperate), and dark patterns that engineer choices users would not endorse on reflection.',
      misconceptions: [
        {
          claim: 'Everyone knows ads exaggerate, so nothing in advertising deceives.',
          correction: 'Puffery ("world’s best coffee") is licensed precisely because no one relies on it; specific factual claims ("clinically proven", "0% APR") invite reliance — the doctrine and the ethics both turn on which kind of claim is made.',
        },
        {
          claim: 'A dark pattern is just persuasive design that works.',
          correction: 'The test is endorsement on reflection: persuasion gives reasons a customer would accept if examined; a cancellation maze or pre-ticked box succeeds ONLY while attention fails — design that depends on its own non-detection is manipulation.',
        },
      ],
      workedExample: {
        setup: 'A subscription service requires one click to join and a phone call plus retention script to cancel.',
        steps: ['Apply the symmetry test: is exit as easy as entry?', 'Apply the reflection test: would customers endorse the friction if described plainly at signup?', 'Note the revenue is real — which is exactly why the test cannot be profitability.'],
        answer: 'The asymmetry is a dark pattern: it monetizes inattention rather than consent, failing both tests regardless of its conversion metrics.',
      },
      citations: [{ title: 'CurriculumOS genome: marketing ethics', source: 'genome', externalId: 'business/marketing-ethics' }],
    },
    {
      key: 'business/global-ethics',
      name: 'Global business and cross-cultural ethics',
      aliases: ['global business and cross-cultural ethics', 'cross-cultural ethics', 'global business ethics', 'sweatshop labor', 'bribery and corruption'],
      requires: ['business/ethical-frameworks'],
      definition:
        'Operating across cultures forces the relativism question concretely: which home standards travel (safety, anti-bribery, child-labor limits) and which local differences deserve deference (gift customs, wage levels relative to local markets) — with "when in Rome" and moral imperialism as the twin errors.',
      misconceptions: [
        {
          claim: 'When in Rome: local practice settles what is permissible.',
          correction: 'Pure deference collapses under its own cases — if local practice tolerated bribery or unsafe factories, the standard would justify anything entrenched; some norms (basic safety, non-deception) are defended as threshold, not taste.',
        },
        {
          claim: 'Paying less than home-country wages abroad is automatically exploitation.',
          correction: 'The serious analysis compares against local alternatives and asks about consent, safety, and bargaining power — a wage above the local market in a safe plant differs morally from coerced labor at any wage; outrage needs the right baseline.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: global business ethics', source: 'genome', externalId: 'business/global-ethics' }],
    },
  ],
};
