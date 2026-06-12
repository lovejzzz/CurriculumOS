import type { GenomeShard } from '../types.ts';

/** Arts shard (V0.0.8, the 10/10 plan workstream E). Covers the two arts
 *  strangers that graded generically until now: the art-history survey and
 *  music-theory fundamentals. Art-history concepts anchor on nameable works
 *  (the "primary text" of an art course is the object); music concepts carry
 *  worked examples because theory is learned by spelling, not reading. */
export const arts: GenomeShard = {
  id: 'arts',
  discipline: 'arts',
  concepts: [
    // ── art history ─────────────────────────────────────────────────────────
    {
      key: 'arts/formal-analysis',
      name: 'Formal analysis',
      aliases: ['how to look at and describe a work of art', 'visual analysis', 'describing a work of art', 'looking at art'],
      requires: [],
      definition:
        'Formal analysis builds an account of a work from its observable elements — line, color, composition, scale, material — so that every claim about meaning points back at something in the object.',
      misconceptions: [
        {
          claim: 'Describing what a picture depicts is the analysis.',
          correction: 'Subject matter is iconography; formal analysis asks HOW the work shows it — where the light falls, what the composition makes you see first — and those choices carry the argument.',
        },
        {
          claim: 'Judging a work means saying whether you like it.',
          correction: 'Taste is a starting point, not a method: the discipline asks what the work does and how, claims a viewer can check against the object.',
        },
      ],
      workedExample: {
        setup: 'Describe Vermeer’s Woman Holding a Balance without naming its subject.',
        steps: ['Track the light: one window, falling on the hand and the empty scales.', 'Map the composition: the balance point sits at the painting’s exact center.', 'Now connect: the form stages a weighing — of pearls, and of souls in the painting-within-the-painting.'],
        answer: 'The formal structure (centered balance, directed light) IS the meaning; description done carefully becomes interpretation.',
      },
      citations: [{ title: 'CurriculumOS genome: formal analysis', source: 'genome', externalId: 'arts/formal-analysis' }],
    },
    {
      key: 'arts/ancient-near-eastern',
      name: 'Prehistoric and Ancient Near Eastern art',
      aliases: ['prehistoric and ancient near eastern art', 'prehistoric art', 'ancient near eastern art', 'mesopotamian art', 'cave painting'],
      requires: ['arts/formal-analysis'],
      definition:
        'The earliest surviving art — cave painting, carved figurines, Mesopotamian relief and ziggurat — shows symbolic behavior and state power in visual form long before writing could record either.',
      misconceptions: [
        {
          claim: 'Prehistoric art is primitive — early attempts by people who could not draw well.',
          correction: 'The Chauvet and Lascaux animals show controlled foreshortening and shading; "prehistoric" dates the work, it does not grade the skill.',
        },
        {
          claim: 'We know what cave paintings meant to their makers.',
          correction: 'Every account (hunting magic, shamanic vision, record-keeping) is inference from context; honest art history marks the difference between evidence and interpretation.',
        },
      ],
      excerpt: { work: 'The Standard of Ur', locator: 'British Museum — "War" and "Peace" registers, c. 2500 BCE' },
      citations: [{ title: 'CurriculumOS genome: ancient Near Eastern art', source: 'genome', externalId: 'arts/ancient-near-eastern' }],
    },
    {
      key: 'arts/egyptian-art',
      name: 'Egyptian art and architecture',
      aliases: ['egyptian art', 'egyptian architecture', 'art of ancient egypt', 'pyramids and tombs'],
      requires: ['arts/formal-analysis'],
      definition:
        'Egyptian art served permanence: the composite pose, the canonical grid of proportions, and tomb architecture were conventions for making an image that functions forever, not portraits of a moment.',
      misconceptions: [
        {
          claim: 'The twisted "composite" pose shows that Egyptian artists could not handle perspective.',
          correction: 'The pose is a deliberate convention: each body part appears at its most identifiable angle, because the image had to WORK eternally for the person it preserved.',
        },
        {
          claim: 'Three thousand years of similar style means a lack of imagination.',
          correction: 'Stability was the point — the canon guaranteed ritual efficacy; periods of deliberate change (Amarna) prove the conventions were chosen, not inevitable.',
        },
      ],
      excerpt: { work: 'The Palette of Narmer', locator: 'Egyptian Museum, Cairo — both faces, c. 3000 BCE' },
      citations: [{ title: 'CurriculumOS genome: Egyptian art', source: 'genome', externalId: 'arts/egyptian-art' }],
    },
    {
      key: 'arts/greek-roman',
      name: 'Greek and Roman art',
      aliases: ['greek and roman art', 'classical sculpture', 'greek sculpture', 'roman portraiture', 'the parthenon'],
      requires: ['arts/formal-analysis'],
      definition:
        'Greek art pursued the idealized body in motion — contrapposto, canonical proportion — while Roman art turned those means to portraiture, propaganda, and concrete engineering at imperial scale.',
      misconceptions: [
        {
          claim: 'Classical statues were pure white marble.',
          correction: 'They were brightly painted; the white-marble ideal is a Renaissance and Neoclassical misreading of weathered survivals — pigment traces survive and reconstructions exist.',
        },
        {
          claim: 'Roman art is just copying of Greek originals.',
          correction: 'Romans copied what they admired AND invented what they needed: veristic portraiture, historical relief, concrete vaulting — the Pantheon has no Greek precedent.',
        },
      ],
      excerpt: { work: 'Doryphoros (Polykleitos)', locator: 'Roman marble copy, Naples — the canon of contrapposto' },
      citations: [{ title: 'CurriculumOS genome: Greek and Roman art', source: 'genome', externalId: 'arts/greek-roman' }],
    },
    {
      key: 'arts/byzantine',
      name: 'Early Christian and Byzantine art',
      aliases: ['early christian and byzantine art', 'byzantine art', 'byzantine mosaics', 'icons and iconoclasm'],
      requires: ['arts/greek-roman'],
      definition:
        'Early Christian and Byzantine art turned classical means toward the sacred: gold-ground mosaic and the icon flatten space deliberately, presenting figures for veneration rather than illusion.',
      misconceptions: [
        {
          claim: 'Byzantine flatness shows that artists forgot how to render space.',
          correction: 'The same culture preserved classical technique; flatness and gold ground are theological choices — the image opens onto eternity, not a room.',
        },
        {
          claim: 'Icons are pictures to be admired like any painting.',
          correction: 'An icon is a devotional instrument with rules of making and use; the Iconoclasm controversy was fought precisely over what such images DO.',
        },
      ],
      excerpt: { work: 'Justinian and His Attendants', locator: 'San Vitale, Ravenna — apse mosaic, c. 547' },
      citations: [{ title: 'CurriculumOS genome: Byzantine art', source: 'genome', externalId: 'arts/byzantine' }],
    },
    {
      key: 'arts/gothic',
      name: 'Medieval and Gothic art',
      aliases: ['medieval and gothic art', 'gothic art', 'gothic architecture', 'gothic cathedrals', 'stained glass'],
      requires: ['arts/byzantine'],
      definition:
        'Gothic architecture is a structural argument — pointed arch, rib vault, flying buttress — that lets walls dissolve into stained glass, making the cathedral a diagram of light as divinity.',
      misconceptions: [
        {
          claim: '"Gothic" was the style’s own proud name.',
          correction: 'It began as a Renaissance insult ("barbarous, like the Goths"); the builders called their manner opus francigenum — naming reveals who writes the history.',
        },
        {
          claim: 'Flying buttresses are decoration on the outside of cathedrals.',
          correction: 'They are load paths: by carrying the vaults’ thrust outside the wall, they free the wall to become glass — remove them and Chartres falls.',
        },
      ],
      excerpt: { work: 'Chartres Cathedral', locator: 'nave elevation and the Blue Virgin window, 13th c.' },
      citations: [{ title: 'CurriculumOS genome: Gothic art', source: 'genome', externalId: 'arts/gothic' }],
    },
    {
      key: 'arts/italian-renaissance',
      name: 'The Italian Renaissance',
      aliases: ['italian renaissance', 'renaissance art', 'high renaissance', 'linear perspective', 'michelangelo'],
      requires: ['arts/greek-roman'],
      definition:
        'The Italian Renaissance fused revived antiquity with new method — Brunelleschi’s linear perspective, anatomical study, oil refinement — recasting the artist as intellectual and the picture as a measured view onto constructed space.',
      misconceptions: [
        {
          claim: 'The Renaissance was a sudden awakening after a thousand dark years.',
          correction: 'Medieval art was neither asleep nor unskilled; "rebirth" is the period’s own self-promotion — continuity (workshops, guilds, patronage) carried as much as rupture.',
        },
        {
          claim: 'Linear perspective made painting objectively better.',
          correction: 'Perspective is one representational system with costs — a single frozen viewpoint; calling it progress mistakes a convention for truth.',
        },
      ],
      excerpt: {
        work: 'Lives of the Artists (Vasari)',
        text: 'Design is the father of our three arts: architecture, sculpture, and painting.',
        locator: 'Preface to Part III, 1568',
      },
      citations: [{ title: 'CurriculumOS genome: the Italian Renaissance', source: 'genome', externalId: 'arts/italian-renaissance' }],
    },
    {
      key: 'arts/northern-renaissance',
      name: 'The Northern Renaissance',
      aliases: ['northern renaissance', 'flemish painting', 'van eyck', 'dürer'],
      requires: ['arts/italian-renaissance'],
      definition:
        'The Northern Renaissance built a parallel revolution on oil technique and microscopic observation — van Eyck’s layered glazes, Dürer’s print revolution — where meaning hides in rendered things.',
      misconceptions: [
        {
          claim: 'The North merely imported the Italian Renaissance late.',
          correction: 'Flemish oil painting predates its Italian adoption and pursued different ends: surface and symbol over idealized bodies — exchange ran in both directions.',
        },
        {
          claim: 'Northern realism means the pictures are neutral records.',
          correction: 'The rendered objects argue — the Arnolfini mirror, the single candle, the shoes set aside are read as disguised symbolism; precision is rhetoric.',
        },
      ],
      excerpt: { work: 'The Arnolfini Portrait (van Eyck)', locator: 'National Gallery, London, 1434 — the mirror and inscription' },
      citations: [{ title: 'CurriculumOS genome: the Northern Renaissance', source: 'genome', externalId: 'arts/northern-renaissance' }],
    },
    {
      key: 'arts/baroque',
      name: 'Baroque art',
      aliases: ['baroque', 'caravaggio', 'rembrandt', 'bernini', 'tenebrism'],
      requires: ['arts/italian-renaissance'],
      definition:
        'Baroque art weaponizes drama — Caravaggio’s raking light, Bernini’s arrested motion, Rembrandt’s psychological dark — pulling the viewer into the scene as Counter-Reformation persuasion and theater.',
      misconceptions: [
        {
          claim: 'Baroque just means over-decorated.',
          correction: 'The core is staged engagement, not ornament: tenebrism, diagonal composition, and the beholder’s implied position are calculated rhetorical machinery.',
        },
        {
          claim: 'Caravaggio’s dark paintings are unlit paintings.',
          correction: 'Tenebrism is selective illumination — one directed light against dark ground — which edits the scene to its moral crux; the darkness is composed, not missing.',
        },
      ],
      excerpt: { work: 'The Calling of Saint Matthew (Caravaggio)', locator: 'Contarelli Chapel, Rome, c. 1600 — the light’s diagonal' },
      citations: [{ title: 'CurriculumOS genome: Baroque art', source: 'genome', externalId: 'arts/baroque' }],
    },
    {
      key: 'arts/rococo-neoclassicism',
      name: 'Rococo and Neoclassicism',
      aliases: ['rococo and neoclassicism', 'rococo', 'neoclassicism', 'neoclassical art', 'david'],
      requires: ['arts/baroque'],
      definition:
        'Rococo’s intimate aristocratic pleasure (Fragonard’s gardens) and Neoclassicism’s moralized antiquity (David’s oaths and deaths) are a paired argument about what art is FOR on the eve of revolution.',
      misconceptions: [
        {
          claim: 'Neoclassicism is just imitation of Greek and Roman art.',
          correction: 'It is antiquity deployed as politics: David’s Oath of the Horatii stages civic sacrifice against Rococo privacy — the style is a program, not a costume.',
        },
        {
          claim: 'Rococo is trivial because its subjects are pleasure.',
          correction: 'Its handling — dissolved contour, pastel light, the swing’s erotic geometry — built a visual language of intimacy the period prized and the Revolution condemned; judging it requires reading it first.',
        },
      ],
      excerpt: { work: 'Oath of the Horatii (David)', locator: 'Louvre, 1784 — three arches, three logics' },
      citations: [{ title: 'CurriculumOS genome: Rococo and Neoclassicism', source: 'genome', externalId: 'arts/rococo-neoclassicism' }],
    },
    {
      key: 'arts/romanticism-realism',
      name: 'Romanticism and Realism',
      aliases: ['romanticism and realism', 'romanticism', 'realism in painting', 'courbet', 'goya'],
      requires: ['arts/rococo-neoclassicism'],
      definition:
        'Romanticism stakes art on extremity — sublime nature, Goya’s horrors, the imagination’s authority — while Realism (Courbet) answers with the unidealized present: laborers and burials at history-painting scale.',
      misconceptions: [
        {
          claim: 'Romanticism means romance — pictures about love.',
          correction: 'It names a stance: feeling and imagination as truth-bearing against academic rule — shipwrecks, madness, and revolutions are its home subjects.',
        },
        {
          claim: 'Realism means maximum photographic detail.',
          correction: 'Realism is a SUBJECT-matter ethics — ordinary life granted the scale of history painting; Courbet’s handling is often rough, and detail alone (van Eyck) is not Realism.',
        },
      ],
      excerpt: { work: 'The Third of May 1808 (Goya)', locator: 'Prado — the lantern and the white shirt' },
      citations: [{ title: 'CurriculumOS genome: Romanticism and Realism', source: 'genome', externalId: 'arts/romanticism-realism' }],
    },
    {
      key: 'arts/impressionism',
      name: 'Impressionism and Post-Impressionism',
      aliases: ['impressionism', 'post-impressionism', 'monet', 'van gogh', 'cézanne'],
      requires: ['arts/romanticism-realism'],
      definition:
        'Impressionism painted perception itself — broken color, modern leisure, the moment’s light — and Post-Impressionism (Cézanne, van Gogh, Seurat) rebuilt structure, feeling, and system on top of that liberated color.',
      misconceptions: [
        {
          claim: 'Impressionist paintings are quick and careless.',
          correction: 'The sketch-like surface is a worked technique for rendering transient light; Monet repainted the same motif in series precisely because the effect is hard-won.',
        },
        {
          claim: 'Post-Impressionism is just later Impressionism.',
          correction: 'It is a set of corrections TO Impressionism: Cézanne restores structure, Seurat systematizes color, van Gogh turns it expressive — three roads out, not a continuation.',
        },
      ],
      excerpt: { work: 'Impression, Sunrise (Monet)', locator: 'Musée Marmottan, 1872 — the painting that named the movement' },
      citations: [{ title: 'CurriculumOS genome: Impressionism', source: 'genome', externalId: 'arts/impressionism' }],
    },
    {
      key: 'arts/avant-garde',
      name: 'Modernism and the avant-garde',
      aliases: ['twentieth-century avant-garde', 'avant-garde', 'cubism', 'abstraction in art', 'duchamp'],
      requires: ['arts/impressionism'],
      definition:
        'The twentieth-century avant-garde made the means the subject: Cubism fractures viewpoint, abstraction abandons depiction, and Duchamp’s readymade asks whether the art is in the object or the proposition.',
      misconceptions: [
        {
          claim: 'Abstract art abandons skill — "my kid could paint that."',
          correction: 'Abstraction abandons depiction, not judgment: composition, color logic, and scale remain decisions one can get wrong — and the historical move itself (what to abandon, when) was the hard part.',
        },
        {
          claim: 'The avant-garde means anything goes.',
          correction: 'Each movement is a discipline with stakes — Cubism’s rules of fracture, De Stijl’s grammar of relation; the freedom is from one convention INTO another, arguable one.',
        },
      ],
      excerpt: { work: 'Les Demoiselles d’Avignon (Picasso)', locator: 'MoMA, 1907 — the fractured threshold picture' },
      citations: [{ title: 'CurriculumOS genome: the avant-garde', source: 'genome', externalId: 'arts/avant-garde' }],
    },
    {
      key: 'arts/contemporary-global',
      name: 'Contemporary and global art',
      aliases: ['contemporary and global art', 'contemporary art', 'global art', 'installation art', 'the biennial'],
      requires: ['arts/avant-garde'],
      definition:
        'Contemporary art is a global discourse of sites and mediums — installation, performance, video, the biennial circuit — where the question "why is this art?" is often the work’s own material.',
      misconceptions: [
        {
          claim: 'Contemporary art is simply whatever is being made now.',
          correction: 'It names a discourse with institutions, canons, and debates (roughly post-1960s/1989 globalization); a landscape painted today is current, but not thereby "contemporary art" in the field’s sense.',
        },
        {
          claim: 'Global art means Western art adopted worldwide.',
          correction: 'The global turn decenters the West: biennials from Havana to Gwangju, and histories that read modernisms in Lagos or Bombay as originals, not echoes.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: contemporary art', source: 'genome', externalId: 'arts/contemporary-global' }],
    },

    // ── music theory ────────────────────────────────────────────────────────
    {
      key: 'arts/staff-notation',
      name: 'Pitch notation on the staff',
      aliases: ['reading pitch on the staff and clefs', 'the staff and clefs', 'staff notation', 'clefs', 'treble and bass clef'],
      requires: [],
      definition:
        'The staff maps pitch to vertical position, and a clef fixes the map: treble places G above middle C on the second line, bass places F below it on the fourth — same staff, different assignments.',
      misconceptions: [
        {
          claim: 'A clef changes how the notes sound.',
          correction: 'The clef changes which pitches the lines NAME, not any sound; the same written ball means E in treble and G in bass because the map differs.',
        },
        {
          claim: 'Treble is for the right hand and bass for the left, always.',
          correction: 'Clefs follow range, not hands: a cello reads tenor clef when high, a piano left hand reads treble when it crosses — the clef serves legibility.',
        },
      ],
      workedExample: {
        setup: 'Find middle C in both clefs.',
        steps: ['Treble: middle C sits on the first ledger line BELOW the staff.', 'Bass: middle C sits on the first ledger line ABOVE the staff.', 'Check: the two ledger-line Cs are the same key on the piano.'],
        answer: 'Middle C is one pitch written in two places — the grand staff joins the clefs around it.',
      },
      citations: [{ title: 'CurriculumOS genome: staff notation', source: 'genome', externalId: 'arts/staff-notation' }],
    },
    {
      key: 'arts/rhythm-durations',
      name: 'Note durations and rhythm',
      aliases: ['note durations and rhythm', 'note durations', 'rhythmic values', 'note values', 'dotted rhythms'],
      requires: ['arts/staff-notation'],
      definition:
        'Durations are proportional, not absolute: a half note is two quarters, a dot adds half the value again — how long any of them LASTS depends entirely on the tempo of the beat.',
      misconceptions: [
        {
          claim: 'A quarter note lasts about one second.',
          correction: 'A quarter note lasts one BEAT’s worth at the current tempo — at ♩=60 it is a second, at ♩=120 half a second; notation encodes ratios, tempo supplies time.',
        },
        {
          claim: 'A dotted note is "a bit longer."',
          correction: 'The dot is exact arithmetic: it adds half the note’s own value — a dotted half equals three quarters, not "roughly more than two."',
        },
      ],
      workedExample: {
        setup: 'How many eighth notes fill a dotted quarter?',
        steps: ['A quarter holds two eighths.', 'The dot adds half a quarter — one more eighth.', 'Total: 2 + 1.'],
        answer: 'Three eighth notes — which is why the dotted quarter is the beat of 6/8.',
      },
      citations: [{ title: 'CurriculumOS genome: note durations', source: 'genome', externalId: 'arts/rhythm-durations' }],
    },
    {
      key: 'arts/time-signatures',
      name: 'Time signatures and meter',
      aliases: ['time signatures and meter', 'time signatures', 'simple and compound meter', 'meter and measure'],
      requires: ['arts/rhythm-durations'],
      definition:
        'Meter is the felt grouping of beats; the signature encodes it two ways — in simple meter the top counts beats, but in compound meter (6/8, 9/8) the felt beat is the dotted quarter and the top counts its divisions.',
      misconceptions: [
        {
          claim: 'The top number is always the number of beats per measure.',
          correction: 'Only in simple meter: 6/8 is FELT in two (two dotted-quarter beats of three eighths each), not in six — compound signatures count divisions, not beats.',
        },
        {
          claim: '3/4 and 6/8 are the same because both hold six eighth notes.',
          correction: 'Same total, different grouping: 3/4 groups 2+2+2 (three beats), 6/8 groups 3+3 (two beats) — accent pattern, conducting, and feel all differ.',
        },
      ],
      workedExample: {
        setup: 'Is "America" from West Side Story in 3/4 or 6/8?',
        steps: ['Clap the bar: it alternates ONE-two-three-FOUR-five-six and ONE-and-a-TWO-and-a.', 'The first bar groups 3+3 (6/8), the next 2+2+2 (3/4).', 'The signature alternates — that alternation is the hook.'],
        answer: 'Both, in alternation — the example proves grouping (meter) is something you hear, not just a fraction you read.',
      },
      citations: [{ title: 'CurriculumOS genome: time signatures', source: 'genome', externalId: 'arts/time-signatures' }],
    },
    {
      key: 'arts/major-scales',
      name: 'Major scales and key signatures',
      aliases: ['major scales and key signatures', 'major scales', 'key signatures', 'circle of fifths', 'whole and half steps'],
      requires: ['arts/staff-notation'],
      definition:
        'A major scale is the interval pattern W-W-H-W-W-W-H from any tonic; the key signature collects the accidentals that pattern forces, and the circle of fifths orders keys by how many it forces.',
      misconceptions: [
        {
          claim: 'Sharps in a key signature are decorations that sometimes apply.',
          correction: 'The signature applies to EVERY occurrence of that letter in any octave for the whole piece — it is the scale’s spelling made standing law, canceled only by accidentals.',
        },
        {
          claim: 'You memorize each major scale as its own arbitrary list of notes.',
          correction: 'One pattern generates all of them: W-W-H-W-W-W-H from the tonic — D major’s F♯ and C♯ are not facts to memorize but consequences to derive.',
        },
      ],
      workedExample: {
        setup: 'Build the D major scale from the pattern.',
        steps: ['Start at D: D +W→ E +W→ F♯ (F is only a half step from E).', 'Continue: +H→ G +W→ A +W→ B +W→ C♯ +H→ D.', 'Collect the accidentals: F♯ and C♯.'],
        answer: 'D–E–F♯–G–A–B–C♯–D; the key signature of D major is exactly those two sharps.',
      },
      citations: [{ title: 'CurriculumOS genome: major scales', source: 'genome', externalId: 'arts/major-scales' }],
    },
    {
      key: 'arts/minor-scales',
      name: 'Minor scales',
      aliases: ['minor scales', 'natural minor', 'harmonic minor', 'melodic minor', 'relative minor'],
      requires: ['arts/major-scales'],
      definition:
        'Natural minor is the major pattern started from scale degree 6 (the relative minor shares its key signature); harmonic minor raises 7 to restore a leading tone, and melodic minor smooths the resulting gap going up.',
      misconceptions: [
        {
          claim: 'Minor keys always sound sad.',
          correction: 'Mode sets a palette, not an emotion: fast dance music in minor (tarantellas, klezmer) is exuberant — tempo, rhythm, and context do as much expressive work as mode.',
        },
        {
          claim: 'Harmonic minor is the "real" minor and the others are variants.',
          correction: 'All three forms are one practice viewed from different needs: natural is the signature, harmonic serves the dominant chord, melodic serves the ascending line — composers mix them within a single phrase.',
        },
      ],
      workedExample: {
        setup: 'Find the relative minor of E♭ major.',
        steps: ['Count down to scale degree 6: E♭ → D → C.', 'C natural minor uses E♭ major’s signature (3 flats).', 'Harmonic form raises the 7th: B♭ → B♮.'],
        answer: 'C minor — same three flats, with B♮ appearing as an accidental whenever the dominant needs it.',
      },
      citations: [{ title: 'CurriculumOS genome: minor scales', source: 'genome', externalId: 'arts/minor-scales' }],
    },
    {
      key: 'arts/intervals',
      name: 'Intervals',
      aliases: ['intervals', 'musical intervals', 'interval quality', 'perfect fifth', 'major third'],
      requires: ['arts/major-scales'],
      definition:
        'An interval has a number (count the letter names, inclusive) and a quality (compare to the major scale of the lower note); both are required — C to E and C to E♭ are both thirds, but major and minor.',
      misconceptions: [
        {
          claim: 'You find an interval by counting half steps on the keyboard.',
          correction: 'Half steps alone confuse spellings: C–D♯ and C–E♭ are three half steps each, but one is an augmented second and the other a minor third — letter names decide the number first.',
        },
        {
          claim: 'C to C is "zero" — no interval.',
          correction: 'Interval numbers count both endpoints: C to the same C is a unison (1), to the next C an octave (8) — there is no zero in interval arithmetic.',
        },
      ],
      workedExample: {
        setup: 'Name the interval from C up to A.',
        steps: ['Count letters inclusively: C-D-E-F-G-A = 6 → a sixth.', 'Is A in C major? Yes → major quality.', 'Check the inversion: A up to C is a minor third; 6+3=9 and major↔minor — consistent.'],
        answer: 'A major sixth.',
      },
      citations: [{ title: 'CurriculumOS genome: intervals', source: 'genome', externalId: 'arts/intervals' }],
    },
    {
      key: 'arts/triads',
      name: 'Triads and chord qualities',
      aliases: ['triads and chord qualities', 'triads', 'chord qualities', 'major and minor triads', 'diminished triad'],
      requires: ['arts/intervals'],
      definition:
        'A triad stacks two thirds: the qualities of those thirds give four chord types — major (M3+m3), minor (m3+M3), diminished (m3+m3), augmented (M3+M3) — spelled root, third, fifth.',
      misconceptions: [
        {
          claim: 'Any three notes played together form a triad.',
          correction: 'A triad is a specific structure of stacked thirds; C–D–G is a chord (a cluster or sus2 sonority) but not a triad — the term names architecture, not just "three notes."',
        },
        {
          claim: 'Chord quality is a feeling — major happy, minor sad.',
          correction: 'Quality is measurable interval content; the mood association is real but contextual — a minor chord in a bright progression carries no sadness, and the definition never mentions emotion.',
        },
      ],
      workedExample: {
        setup: 'Spell the G major triad, then make it minor.',
        steps: ['Root G; a major third up is B; a minor third above that is D.', 'G–B–D is the major triad.', 'Lower the third: G–B♭–D is minor — only the middle note moved.'],
        answer: 'G–B–D major, G–B♭–D minor: quality lives in the third.',
      },
      citations: [{ title: 'CurriculumOS genome: triads', source: 'genome', externalId: 'arts/triads' }],
    },
    {
      key: 'arts/seventh-chords',
      name: 'Seventh chords',
      aliases: ['seventh chords', 'dominant seventh', 'major seventh chord', 'half-diminished'],
      requires: ['arts/triads'],
      definition:
        'A seventh chord adds a third above the triad’s fifth; quality compounds (triad type + seventh type), and the dominant seventh — major triad with a minor seventh, built on scale degree 5 — drives tonal motion home.',
      misconceptions: [
        {
          claim: 'Any chord containing a seventh is "a dominant seventh."',
          correction: 'Dominant seventh names one specific quality (major triad + minor 7th) AND its home function (built on 5̂); Cmaj7 contains a seventh but is a different chord with a different job.',
        },
        {
          claim: 'The seventh is an optional color note you can ignore in analysis.',
          correction: 'The seventh creates the tritone (with the chord’s third) whose resolution defines the dominant function — drop it and V7→I loses exactly the tension being analyzed.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: seventh chords', source: 'genome', externalId: 'arts/seventh-chords' }],
    },
    {
      key: 'arts/diatonic-harmony',
      name: 'Diatonic harmony and Roman numerals',
      aliases: ['diatonic harmony and roman numerals', 'diatonic harmony', 'roman numeral analysis', 'roman numerals', 'chord function'],
      requires: ['arts/triads', 'arts/major-scales'],
      definition:
        'Roman numerals name chords by scale degree relative to the key — uppercase major, lowercase minor, ° diminished — so I–IV–V–I describes a function in ANY key, which is the notation’s whole point.',
      misconceptions: [
        {
          claim: 'Roman numerals are alternative names for specific chords like C or G7.',
          correction: 'They are RELATIVE names: V means "the chord on scale degree 5 of the current key" — G in C major, D in G major; the numeral encodes function, the letter encodes pitch.',
        },
        {
          claim: 'Uppercase versus lowercase is a typographic preference.',
          correction: 'Case IS the chord quality (IV major vs iv minor) — in C major, IV is F and iv is Fm, audibly different chords; the case carries analytical information.',
        },
      ],
      workedExample: {
        setup: 'Label the progression C–F–G–C in C major, then move it to D major.',
        steps: ['C is I, F is IV (degree 4), G is V, back to I.', 'The analysis I–IV–V–I has no key in it.', 'In D major the same numerals spell D–G–A–D.'],
        answer: 'I–IV–V–I — one function, any key; that transferability is why analysts use numerals.',
      },
      citations: [{ title: 'CurriculumOS genome: diatonic harmony', source: 'genome', externalId: 'arts/diatonic-harmony' }],
    },
    {
      key: 'arts/cadences',
      name: 'Cadences',
      aliases: ['cadences', 'authentic cadence', 'half cadence', 'plagal cadence', 'deceptive cadence'],
      requires: ['arts/diatonic-harmony'],
      definition:
        'A cadence is harmony’s punctuation: authentic (V–I) closes like a period, half (ending ON V) suspends like a comma, deceptive (V–vi) swerves from the promised close, plagal (IV–I) seals after the close.',
      misconceptions: [
        {
          claim: 'A cadence is wherever the music stops.',
          correction: 'Cadence is a specific harmonic-melodic formula at a phrase ending; music can pause without cadencing and cadence without stopping — the chord pattern, not the silence, defines it.',
        },
        {
          claim: 'A half cadence is a weaker, incomplete mistake.',
          correction: 'Ending on V is a structural question mark the form needs — antecedent phrases end on half cadences precisely so consequents can answer; it is punctuation, not failure.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: cadences', source: 'genome', externalId: 'arts/cadences' }],
    },
    {
      key: 'arts/voice-leading',
      name: 'Voice leading',
      aliases: ['voice leading', 'voice leading basics', 'parallel fifths', 'four-part writing'],
      requires: ['arts/triads'],
      definition:
        'Voice leading connects chords as four independent melodic lines: keep common tones, move each voice the shortest way, resolve tendency tones — the prohibitions (parallel fifths/octaves) protect the independence.',
      misconceptions: [
        {
          claim: 'Parallel fifths are banned because they sound bad.',
          correction: 'They sound fine (power chords are parallel fifths); the common-practice rule protects VOICE INDEPENDENCE — two voices in parallel perfect intervals fuse into one — it is a style contract, not acoustics.',
        },
        {
          claim: 'Good voice leading means each voice leaps to the nearest chord tone you like.',
          correction: 'Tendency tones are not free: the leading tone resolves up to the tonic, the seventh resolves down — function constrains the line beyond mere proximity.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: voice leading', source: 'genome', externalId: 'arts/voice-leading' }],
    },
    {
      key: 'arts/non-chord-tones',
      name: 'Non-chord tones',
      aliases: ['non-chord tones', 'passing tones', 'suspensions', 'neighbor tones', 'embellishing tones'],
      requires: ['arts/diatonic-harmony'],
      definition:
        'Non-chord tones are melodic notes outside the sounding harmony, classified by approach and resolution — passing (step-step through), neighbor (step away and back), suspension (held over, resolving down).',
      misconceptions: [
        {
          claim: 'Notes outside the chord are wrong notes the analysis should ignore.',
          correction: 'They are catalogued, named devices — the suspension’s prepared dissonance and downward resolution is centuries of expressive practice; analysis labels them precisely because they carry the line’s interest.',
        },
        {
          claim: 'A suspension is just any held note.',
          correction: 'A suspension has three named phases — preparation (consonant), suspension (dissonant against the new chord), resolution (down by step); a held note that stays consonant is a common tone, not a suspension.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: non-chord tones', source: 'genome', externalId: 'arts/non-chord-tones' }],
    },
    {
      key: 'arts/phrase-form',
      name: 'Form and phrase structure',
      aliases: ['basic form and phrase structure', 'phrase structure', 'musical form', 'period and sentence', 'binary and ternary form'],
      requires: ['arts/cadences'],
      definition:
        'Phrases are harmony-bounded units of melody (closed by cadences); they pair into periods (antecedent–consequent) or build as sentences (presentation–continuation), and those units assemble binary, ternary, and rondo forms.',
      misconceptions: [
        {
          claim: 'Form is a rigid mold the composer fills in.',
          correction: 'Forms are conventions composers play WITH — the interest of a sonata movement is where it bends the expected scheme; analysis maps the dialogue, not a checklist.',
        },
        {
          claim: 'A phrase is any four measures.',
          correction: 'Phrases are defined by cadential goal, not bar count: a phrase ends where the harmony punctuates — four bars is common, but five- and three-bar phrases are everywhere once you listen for the cadence.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: phrase structure', source: 'genome', externalId: 'arts/phrase-form' }],
    },
  ],
};
