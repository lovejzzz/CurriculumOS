import type { GenomeShard } from '../types.ts';

export const astro: GenomeShard = {
  id: 'astro',
  discipline: 'stem-quant',
  concepts: [
    {
      key: 'astro/diurnal-motion',
      name: 'Diurnal motion',
      aliases: ['diurnal motion', 'apparent daily motion of the sky'],
      requires: [],
      definition:
        'The daily east-to-west march of the sky is apparent motion produced by Earth’s west-to-east rotation, not by the sky itself turning.',
      misconceptions: [
        { claim: 'The Sun and stars physically orbit the Earth each day.', correction: 'Earth’s rotation creates the apparent motion — the sky is nearly fixed on human timescales.' },
      ],
      citations: [{ title: 'CurriculumOS genome: diurnal motion', source: 'genome', externalId: 'astro/diurnal-motion' }],
    },
    {
      key: 'astro/celestial-sphere',
      name: 'The celestial sphere and coordinates',
      aliases: ['celestial sphere', 'celestial coordinates'],
      requires: ['astro/diurnal-motion'],
      definition:
        'The celestial sphere is a convenient projection of the sky onto an imagined globe; right ascension and declination locate objects like longitude and latitude.',
      misconceptions: [
        { claim: 'Stars are all at the same distance on the celestial sphere.', correction: 'The sphere is a directional convenience — stars lie at vastly different real distances.' },
      ],
      citations: [{ title: 'CurriculumOS genome: celestial sphere', source: 'genome', externalId: 'astro/celestial-sphere' }],
    },
    {
      key: 'astro/seasons',
      name: 'The seasons and axial tilt',
      aliases: ['seasons', 'axial tilt', 'solstice and equinox'],
      requires: ['astro/diurnal-motion'],
      definition:
        'Seasons arise from Earth’s 23.5° axial tilt changing the directness of sunlight and day length, not from changing distance to the Sun.',
      misconceptions: [
        { claim: 'Summer happens because Earth is closer to the Sun.', correction: 'Earth is actually nearest the Sun in January — tilt, not distance, drives the seasons.' },
      ],
      citations: [{ title: 'CurriculumOS genome: the seasons', source: 'genome', externalId: 'astro/seasons' }],
    },
    {
      key: 'astro/moon-phases',
      name: 'Phases of the Moon',
      aliases: ['moon phases', 'phases of the moon', 'lunar phases'],
      requires: ['astro/diurnal-motion'],
      definition:
        'Lunar phases come from the changing geometry between Sun, Moon, and Earth, which shows us varying fractions of the Moon’s lit half.',
      misconceptions: [
        { claim: 'Phases are caused by Earth’s shadow on the Moon.', correction: 'That is a lunar eclipse — phases are about viewing angle on the always-half-lit Moon.' },
      ],
      citations: [{ title: 'CurriculumOS genome: moon phases', source: 'genome', externalId: 'astro/moon-phases' }],
    },
    {
      key: 'astro/keplers-laws',
      name: 'Kepler’s laws of planetary motion',
      aliases: ['keplers third law', 'laws of planetary motion', 'kepler'],
      requires: ['astro/celestial-sphere'],
      definition:
        'Kepler’s laws describe elliptical orbits, equal areas in equal times, and the period–distance relation P² ∝ a³.',
      misconceptions: [
        { claim: 'Planets move at constant speed in circular orbits.', correction: 'Orbits are ellipses and speed varies — fastest at perihelion, slowest at aphelion.' },
      ],
      workedExample: {
        setup: 'A planet orbits at a = 4 AU. Find its period.',
        steps: ['P² = a³ = 4³ = 64.', 'P = √64 = 8.'],
        answer: 'Period ≈ 8 years.',
      },
      citations: [{ title: 'CurriculumOS genome: Kepler’s laws', source: 'genome', externalId: 'astro/keplers-laws' }],
    },
    {
      key: 'astro/em-spectrum',
      name: 'The electromagnetic spectrum',
      aliases: ['electromagnetic spectrum', 'wavelengths of light'],
      requires: [],
      definition:
        'Light spans radio to gamma rays; wavelength sets energy, and each band reveals different physics, which is why astronomers observe across the whole spectrum.',
      misconceptions: [
        { claim: 'Visible light is the only light worth observing.', correction: 'Visible is a thin slice — radio, infrared, and X-ray reveal cold gas, dust, and hot plasma the eye misses.' },
      ],
      citations: [{ title: 'CurriculumOS genome: the EM spectrum', source: 'genome', externalId: 'astro/em-spectrum' }],
    },
    {
      key: 'astro/spectral-lines',
      name: 'Spectral lines',
      aliases: ['spectral lines', 'absorption and emission spectra'],
      requires: ['astro/em-spectrum'],
      definition:
        'Atoms absorb and emit light at characteristic wavelengths, so a star’s spectrum is a fingerprint of its composition, temperature, and motion.',
      misconceptions: [
        { claim: 'A star’s color tells you what it is made of.', correction: 'Color reveals temperature; composition comes from the precise spectral lines, not the overall hue.' },
      ],
      citations: [{ title: 'CurriculumOS genome: spectral lines', source: 'genome', externalId: 'astro/spectral-lines' }],
    },
    {
      key: 'astro/telescopes',
      name: 'Telescope light-gathering power',
      aliases: ['telescope', 'light-gathering power', 'aperture'],
      requires: ['astro/em-spectrum'],
      definition:
        'A telescope’s most important number is aperture: light-gathering power scales with the square of diameter, far outweighing magnification.',
      misconceptions: [
        { claim: 'Magnification is what makes a telescope powerful.', correction: 'Aperture rules — it gathers light and sets resolution; magnification beyond that just enlarges a blur.' },
      ],
      citations: [{ title: 'CurriculumOS genome: telescopes', source: 'genome', externalId: 'astro/telescopes' }],
    },
    {
      key: 'astro/parallax',
      name: 'Stellar parallax',
      aliases: ['parallax', 'stellar parallax', 'parsecs'],
      requires: ['astro/celestial-sphere'],
      definition:
        'Parallax measures distance from the tiny annual shift in a nearby star’s position; distance in parsecs is one over the parallax angle in arcseconds.',
      misconceptions: [
        { claim: 'Parallax works for stars at any distance.', correction: 'The angle shrinks with distance into the noise — parallax is reliable only for relatively nearby stars.' },
      ],
      workedExample: {
        setup: 'A star shows a parallax angle of 0.05 arcseconds.',
        steps: ['d (pc) = 1 / p (arcsec) = 1 / 0.05.'],
        answer: '20 parsecs away.',
      },
      citations: [{ title: 'CurriculumOS genome: parallax', source: 'genome', externalId: 'astro/parallax' }],
    },
    {
      key: 'astro/magnitude',
      name: 'Apparent magnitude',
      aliases: ['apparent magnitude', 'brightness of stars', 'magnitude'],
      requires: ['astro/parallax'],
      definition:
        'Apparent magnitude is a reverse logarithmic brightness scale — smaller numbers are brighter, and five magnitudes equal a hundredfold difference in flux.',
      misconceptions: [
        { claim: 'A higher magnitude number means a brighter star.', correction: 'The scale runs backward — magnitude 1 is far brighter than magnitude 6.' },
      ],
      citations: [{ title: 'CurriculumOS genome: apparent magnitude', source: 'genome', externalId: 'astro/magnitude' }],
    },
    {
      key: 'astro/solar-nebula',
      name: 'The solar nebula hypothesis',
      aliases: ['solar nebula hypothesis', 'formation of the solar system', 'solar nebula'],
      requires: ['astro/keplers-laws'],
      definition:
        'The solar system condensed from a rotating cloud of gas and dust; conservation of angular momentum flattened it into the disk the planets share.',
      misconceptions: [
        { claim: 'The planets formed independently and were captured by the Sun.', correction: 'Planets and Sun condensed together from one disk — the shared orbital plane is the evidence.' },
      ],
      citations: [{ title: 'CurriculumOS genome: solar nebula', source: 'genome', externalId: 'astro/solar-nebula' }],
    },
    {
      key: 'astro/hubbles-law',
      name: 'Hubble’s law and the expanding universe',
      aliases: ['hubbles law', 'expanding universe', 'redshift'],
      requires: ['astro/spectral-lines'],
      definition:
        'Hubble’s law says recession velocity rises with distance, evidence that space itself expands — galaxies recede because the space between them grows.',
      misconceptions: [
        { claim: 'Galaxies fly apart through space from a central explosion.', correction: 'Space between galaxies expands; there is no center and no edge the galaxies are flying from.' },
      ],
      citations: [{ title: 'CurriculumOS genome: Hubble’s law', source: 'genome', externalId: 'astro/hubbles-law' }],
    },
  ],
};
