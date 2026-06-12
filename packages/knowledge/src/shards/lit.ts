import type { GenomeShard } from '../types.ts';

/** Literature shard (V0.0.4). The prototype's lit shard was famously thin (2
 *  concepts; world-lit linked 0/14 — documented gap in the fixtures). This one
 *  covers the world-literature canon's TEACHING concepts, with public-domain
 *  excerpts so close-reading lessons point at actual lines (the judge: "no
 *  actual poem"). Excerpts are from works/translations in the public domain. */
export const lit: GenomeShard = {
  id: 'lit',
  discipline: 'humanities',
  concepts: [
    {
      key: 'lit/world-literature',
      name: 'World literature',
      aliases: ['what counts as world literature', 'world literature as a category'],
      requires: [],
      definition:
        'World literature names works that circulate beyond their culture of origin — gaining, as Damrosch argues, new meaning in translation and new contexts of reading.',
      misconceptions: [
        {
          claim: 'World literature is simply the sum of all national literatures.',
          correction: 'It is a mode of circulation and reading: a work enters world literature when it lives outside its home tradition, usually through translation.',
        },
        {
          claim: 'Reading in translation is a degraded substitute for the original.',
          correction: 'Translation is itself an interpretive act the field studies — what survives, shifts, or is gained in translation is part of the work’s worldly life.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: world literature', source: 'genome', externalId: 'lit/world-literature' }],
    },
    {
      key: 'lit/oral-epic',
      name: 'The oral epic tradition',
      aliases: ['oral epic', 'epic tradition', 'gilgamesh', 'homeric epic', 'the odyssey'],
      requires: [],
      definition:
        'Oral epics like Gilgamesh and the Homeric poems were composed in performance using formulas, epithets, and type-scenes — features that survive as the genre’s signature even in written form.',
      misconceptions: [
        {
          claim: 'Repeated epithets ("rosy-fingered dawn") are lazy or filler writing.',
          correction: 'Formulas are the engine of oral composition — metrical building blocks that let a singer compose at speed; their repetition is structure, not laziness.',
        },
        {
          claim: 'Epics have a single original text an author wrote down.',
          correction: 'Oral epics existed as living performance traditions; the texts we read are late crystallizations of many tellings.',
        },
      ],
      workedExample: {
        setup: 'A student notices "swift-footed Achilles" recurs even when Achilles is sitting still.',
        steps: ['Identify the phrase as a fixed epithet filling a metrical slot.', 'Check: does it characterize across the poem rather than the moment?', 'Read it as oral formula, not scene description.'],
        answer: 'The epithet marks oral-formulaic composition; its job is metrical and mnemonic, not momentary description.',
      },
      excerpt: {
        work: 'The Epic of Gilgamesh',
        text: 'He who saw the Deep, the country’s foundation, who knew the proper ways, was wise in all things.',
        locator: 'Tablet I, opening lines',
      },
      citations: [{ title: 'CurriculumOS genome: the oral epic', source: 'genome', externalId: 'lit/oral-epic' }],
    },
    {
      key: 'lit/tragedy',
      name: 'Classical tragedy',
      aliases: ['classical drama', 'greek tragedy', 'sophocles', 'antigone'],
      requires: [],
      definition:
        'Greek tragedy stages an irreconcilable collision of legitimate claims — Antigone’s divine law against Creon’s civic law — driving toward recognition (anagnorisis) and reversal (peripeteia).',
      misconceptions: [
        {
          claim: 'The tragic hero falls because of a character flaw ("fatal flaw" reading of hamartia).',
          correction: 'Hamartia is better read as a mistake or missing-the-mark within a collision of duties; Antigone is not "flawed" — her two duties cannot both be met.',
        },
        {
          claim: 'The chorus is background commentary that can be skipped.',
          correction: 'The chorus frames the ethical stakes and enacts the city’s voice — tragedy’s meaning often lives in the odes.',
        },
      ],
      excerpt: {
        work: 'Antigone (Sophocles)',
        text: 'Wonders are many, and none is more wonderful than man.',
        locator: 'First stasimon ("Ode to Man"), l. 332',
      },
      citations: [{ title: 'CurriculumOS genome: classical tragedy', source: 'genome', externalId: 'lit/tragedy' }],
    },
    {
      key: 'lit/tang-poetry',
      name: 'Tang poetry',
      aliases: ['tang poetry', 'li bai', 'du fu', 'regulated verse'],
      requires: ['lit/close-reading'],
      definition:
        'Tang-dynasty poetry, especially regulated verse (lüshi), works within strict tonal and parallelism rules — five or seven characters per line, with middle couplets in strict grammatical and imagistic parallel — making compression and juxtaposition its core expressive devices.',
      misconceptions: [
        {
          claim: 'Chinese poems are free-form impressions of nature.',
          correction: 'Regulated verse is among the most formally constrained poetry ever written; the "natural" feel is achieved inside rigid tonal and parallel structures.',
        },
        {
          claim: 'A translation that reads smoothly is faithful.',
          correction: 'Parallelism and tonal contour rarely survive translation — comparing translations against the constraints reveals what each sacrifices.',
        },
      ],
      workedExample: {
        setup: 'Read the parallel couplet from Du Fu’s "Spring View": 感时花溅泪 / 恨别鸟惊心 (gǎn shí huā jiàn lèi / hèn bié niǎo jīng xīn).',
        steps: ['Align the couplet word-for-word: feel-time / flower-splash-tears against hate-parting / bird-startle-heart.', 'Note the grammatical parallel (verb-object mirror) and the emotional escalation.', 'Ask what the juxtaposition implies that neither line states.'],
        answer: 'The parallelism makes nature mourn with the poet — grief is distributed across the couplet’s mirrored syntax, not stated.',
      },
      excerpt: {
        work: 'Spring View (Du Fu)',
        text: '国破山河在 — The state is shattered; mountains and rivers remain.',
        locator: 'l. 1 (春望)',
      },
      citations: [{ title: 'CurriculumOS genome: Tang poetry', source: 'genome', externalId: 'lit/tang-poetry' }],
    },
    {
      key: 'lit/frame-narrative',
      name: 'Frame narrative',
      aliases: ['frame narratives', 'the thousand and one nights', 'story within a story'],
      requires: [],
      definition:
        'A frame narrative embeds stories inside a containing story — in the Thousand and One Nights, Shahrazad’s nightly telling is the frame, and narration itself becomes the plot’s survival mechanism.',
      misconceptions: [
        {
          claim: 'The frame is mere packaging for the "real" stories inside.',
          correction: 'The frame thematizes storytelling — in the Nights, every embedded tale argues for narrative’s power to defer death; frame and tales interpret each other.',
        },
      ],
      excerpt: {
        work: 'The Thousand and One Nights',
        locator: 'The frame: Shahrazad and Shahriyar, opening night',
      },
      citations: [{ title: 'CurriculumOS genome: frame narrative', source: 'genome', externalId: 'lit/frame-narrative' }],
    },
    {
      key: 'lit/allegorical-journey',
      name: 'The allegorical journey',
      aliases: ['dante', 'inferno', 'medieval journey narrative', 'the medieval journey'],
      requires: [],
      definition:
        'Dante’s Commedia fuses literal journey with moral allegory: the pilgrim’s descent maps a taxonomy of sin where each punishment is a contrapasso — the sin’s own logic turned back on the sinner.',
      misconceptions: [
        {
          claim: 'Allegory means every detail stands for one hidden meaning.',
          correction: 'Medieval reading worked on multiple levels at once (literal, moral, anagogical); the literal journey stays real even as it signifies.',
        },
      ],
      excerpt: {
        work: 'Inferno (Dante)',
        text: 'Midway upon the journey of our life I found myself within a forest dark, for the straightforward pathway had been lost.',
        locator: 'Canto I, ll. 1–3 (Longfellow translation)',
      },
      citations: [{ title: 'CurriculumOS genome: the allegorical journey', source: 'genome', externalId: 'lit/allegorical-journey' }],
    },
    {
      key: 'lit/close-reading',
      name: 'Close reading',
      aliases: ['close reading methods', 'comparative reading', 'comparative reading methods'],
      requires: [],
      definition:
        'Close reading builds interpretation from the verifiable surface of the text — diction, syntax, image, sound, form — so that every claim cites words on the page.',
      misconceptions: [
        {
          claim: 'Interpretation is opinion, so any reading is as good as another.',
          correction: 'Readings are arguments judged by textual evidence — a claim the passage’s words cannot support fails, however sincere.',
        },
        {
          claim: 'Close reading means hunting hidden symbols.',
          correction: 'It means describing what the language demonstrably does — pattern, tension, turn — before deciding what it means.',
        },
      ],
      workedExample: {
        setup: 'Claim: "the opening of the Inferno presents being lost as both fact and condition."',
        steps: ['Quote the line: "I found myself within a forest dark."', 'Note "found myself" — discovery, not decision; the passive drift into error.', 'Tie the image (dark forest) to the stated cause ("the straightforward pathway had been lost").'],
        answer: 'The diction of involuntary discovery supports the claim — the speaker wakes inside error rather than choosing it.',
      },
      citations: [{ title: 'CurriculumOS genome: close reading', source: 'genome', externalId: 'lit/close-reading' }],
    },
    {
      key: 'lit/postcolonial',
      name: 'Postcolonial literature',
      aliases: ['postcolonial', 'achebe', 'things fall apart', 'writing back'],
      requires: ['lit/close-reading'],
      definition:
        'Postcolonial literature contests the colonial archive — Achebe’s Things Fall Apart answers novels like Heart of Darkness by narrating Igbo life from within, making the "writing back" itself a formal strategy.',
      misconceptions: [
        {
          claim: 'Postcolonial novels are anthropology in fiction’s clothing.',
          correction: 'They are crafted counter-narratives; Achebe’s proverb-laden style and tragic structure are literary choices arguing against the colonial gaze, not ethnographic reportage.',
        },
      ],
      excerpt: {
        work: 'Things Fall Apart (Achebe)',
        locator: 'ch. 1 — Okonkwo’s introduction; and the District Commissioner’s closing paragraph',
      },
      citations: [{ title: 'CurriculumOS genome: postcolonial literature', source: 'genome', externalId: 'lit/postcolonial' }],
    },
    {
      key: 'lit/magical-realism',
      name: 'Magical realism',
      aliases: ['garcía márquez', 'one hundred years of solitude', 'lo real maravilloso'],
      requires: ['lit/close-reading'],
      definition:
        'Magical realism narrates the impossible in the same even tone as the everyday — in García Márquez, levitations and plagues of insomnia arrive without narrative surprise, collapsing the hierarchy between fact and wonder.',
      misconceptions: [
        {
          claim: 'Magical realism is fantasy with literary prestige.',
          correction: 'Fantasy builds a separate world with its own rules; magical realism inserts the marvelous into THIS world’s history and politics, narrated as fact.',
        },
      ],
      excerpt: {
        work: 'One Hundred Years of Solitude (García Márquez)',
        locator: 'ch. 1 — the ice; the matter-of-fact narration of wonders',
      },
      citations: [{ title: 'CurriculumOS genome: magical realism', source: 'genome', externalId: 'lit/magical-realism' }],
    },
    {
      key: 'lit/modernist-poetry',
      name: 'Modernist poetry',
      // NOTE: bare "modernism" deliberately absent — exact aliases may cross
      // disciplines, and art-history modernism is not modernist poetry
      aliases: ['the waste land', 'eliot', 'literary modernism', 'fragmentation in poetry'],
      requires: ['lit/close-reading'],
      definition:
        'Modernist poetry replaces narrative continuity with juxtaposed fragments, allusion, and shifting voices — The Waste Land asks the reader to assemble coherence the poem refuses to supply.',
      misconceptions: [
        {
          claim: 'If a modernist poem feels broken, the reader has failed to find the hidden story.',
          correction: 'Fragmentation IS the method — the gaps between fragments carry meaning; the poem performs a broken culture rather than describing one.',
        },
      ],
      excerpt: {
        work: 'The Waste Land (Eliot)',
        text: 'April is the cruellest month, breeding lilacs out of the dead land, mixing memory and desire.',
        locator: 'I. The Burial of the Dead, ll. 1–3',
      },
      citations: [{ title: 'CurriculumOS genome: modernist poetry', source: 'genome', externalId: 'lit/modernist-poetry' }],
    },
    {
      key: 'lit/the-fantastic',
      name: 'The fantastic',
      aliases: ['borges', 'the library of babel', 'the fantastic and the infinite'],
      requires: ['lit/close-reading'],
      definition:
        'Borges’s fictions are thought experiments in narrative form — The Library of Babel literalizes an idea (a universe of all possible books) and follows its logic until metaphysics becomes plot.',
      misconceptions: [
        {
          claim: 'Borges’s stories are puzzles with a single solution to decode.',
          correction: 'They are engines for paradox; the point is the experience of an idea’s consequences, not a hidden answer.',
        },
      ],
      excerpt: {
        work: 'The Library of Babel (Borges)',
        locator: 'opening paragraph — the universe as library',
      },
      citations: [{ title: 'CurriculumOS genome: the fantastic', source: 'genome', externalId: 'lit/the-fantastic' }],
    },
    {
      key: 'lit/translation',
      name: 'Translation and cultural mediation',
      aliases: ['translation studies', 'reading in translation'],
      requires: ['lit/world-literature'],
      definition:
        'Translation is interpretation under constraint: every version chooses among fidelity to sense, sound, form, and effect — comparing translations exposes the original’s pressure points.',
      misconceptions: [
        {
          claim: 'There is one correct translation a good translator finds.',
          correction: 'Translations are arguments about the work; systematic differences between strong versions mark genuine interpretive choices, not errors.',
        },
      ],
      workedExample: {
        setup: 'Compare two openings of the Odyssey: "Sing in me, Muse" (Fitzgerald) vs "Tell me about a complicated man" (Wilson).',
        steps: ['Identify what each privileges: invocation’s ritual register vs plain-spoken characterization.', 'Trace the choice back to the Greek polytropos ("of many turns").', 'State what each version makes easy and hard to see.'],
        answer: 'Neither is "right": Fitzgerald keeps the epic frame, Wilson foregrounds the hero’s doubleness — the comparison teaches the original’s ambiguity.',
      },
      citations: [{ title: 'CurriculumOS genome: translation', source: 'genome', externalId: 'lit/translation' }],
    },
  ],
};
