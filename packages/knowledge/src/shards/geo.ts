import type { GenomeShard } from '../types.ts';

export const geo: GenomeShard = {
  id: 'geo',
  discipline: 'stem-lab',
  concepts: [
    {
      key: 'geo/minerals',
      name: 'Minerals and identification',
      aliases: ['minerals', 'mineral identification', 'mohs hardness', 'streak', 'cleavage', 'luster'],
      requires: [],
      definition:
        'A mineral is a naturally occurring, inorganic crystalline solid; hand-specimen identification keys on hardness, streak, cleavage, and luster rather than color.',
      misconceptions: [
        {
          claim: 'Color is the most reliable way to identify a mineral.',
          correction:
            'Trace impurities swing color wildly — quartz alone spans clear to purple; streak and hardness are far more diagnostic.',
        },
      ],
      workedExample: {
        setup: 'An unknown specimen scratches glass (H≈5.5) but not a steel file, leaves a white streak, and shows two cleavage planes at 90°.',
        steps: ['Hardness brackets 5.5–6.5.', 'White streak rules out metallic oxides.', 'Right-angle cleavage points to the feldspar group.'],
        answer: 'Orthoclase feldspar.',
      },
      citations: [{ title: 'CurriculumOS genome: mineral identification', source: 'genome', externalId: 'geo/minerals' }],
    },
    {
      key: 'geo/silicates',
      name: 'Silicate structures',
      aliases: ['silicates', 'silicate minerals', 'silica tetrahedron'],
      requires: ['geo/minerals'],
      definition:
        'Silicate minerals are built from silica tetrahedra; how the tetrahedra link (isolated, chains, sheets, frameworks) controls cleavage and weathering behavior.',
      misconceptions: [
        {
          claim: 'All silicates behave alike because they share the same building block.',
          correction: 'Linkage matters more than composition — sheet silicates flake while framework silicates fracture.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: silicate structures', source: 'genome', externalId: 'geo/silicates' }],
    },
    {
      key: 'geo/igneous',
      name: 'Igneous rocks and volcanism',
      aliases: ['igneous rocks', 'igneous', 'volcanism', 'magma'],
      requires: ['geo/minerals'],
      definition:
        'Igneous rocks crystallize from melt; cooling rate sets crystal size (intrusive coarse, extrusive fine) and silica content sets eruption style.',
      misconceptions: [
        {
          claim: 'Lava and magma are different substances.',
          correction: 'Same melt, different address — magma below the surface becomes lava upon eruption.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: igneous rocks', source: 'genome', externalId: 'geo/igneous' }],
    },
    {
      key: 'geo/sedimentary',
      name: 'Sedimentary rocks',
      aliases: ['sedimentary', 'depositional environments', 'sediment'],
      requires: ['geo/minerals'],
      definition:
        'Sedimentary rocks form from compacted and cemented sediment or precipitated solutes; their textures and structures record the environment that deposited them.',
      misconceptions: [
        {
          claim: 'Rock layers always formed where we find them today.',
          correction: 'Deposition, burial, uplift, and erosion relocate strata — a marine limestone on a mountaintop records history, not magic.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: sedimentary rocks', source: 'genome', externalId: 'geo/sedimentary' }],
    },
    {
      key: 'geo/metamorphic',
      name: 'Metamorphic rocks',
      aliases: ['metamorphic', 'metamorphism', 'foliation'],
      requires: ['geo/igneous', 'geo/sedimentary'],
      definition:
        'Metamorphic rocks recrystallize in the solid state under heat and pressure; directed stress produces foliation while contact heating does not.',
      misconceptions: [
        {
          claim: 'Metamorphism means the rock melted and re-froze.',
          correction: 'Melting would make it igneous — metamorphic change happens below the melting point, in the solid state.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: metamorphic rocks', source: 'genome', externalId: 'geo/metamorphic' }],
    },
    {
      key: 'geo/rock-cycle',
      name: 'The rock cycle',
      aliases: ['rock cycle'],
      requires: ['geo/igneous', 'geo/sedimentary', 'geo/metamorphic'],
      definition:
        'The rock cycle links the three rock families through melting, weathering, burial, and uplift — any rock can become any other given the right path.',
      misconceptions: [
        {
          claim: 'The rock cycle runs in one fixed order.',
          correction: 'It is a network, not a loop — an igneous rock can weather straight to sediment or metamorphose without ever melting.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: the rock cycle', source: 'genome', externalId: 'geo/rock-cycle' }],
    },
    {
      key: 'geo/plate-tectonics',
      name: 'Plate tectonics',
      aliases: ['tectonics', 'plate boundaries', 'continental drift'],
      requires: ['geo/rock-cycle'],
      definition:
        'Lithospheric plates ride on the asthenosphere; divergent, convergent, and transform boundaries explain where earthquakes, volcanoes, and mountain belts occur.',
      misconceptions: [
        {
          claim: 'Continents plow through the ocean floor.',
          correction: 'Continents are passengers on plates that include ocean floor — plate and continent move together.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: plate tectonics', source: 'genome', externalId: 'geo/plate-tectonics' }],
    },
    {
      key: 'geo/earthquakes',
      name: 'Earthquakes and seismic waves',
      aliases: ['earthquakes', 'seismic waves', 'seismology'],
      requires: ['geo/plate-tectonics'],
      definition:
        'Earthquakes release elastic strain along faults; P-waves outrun S-waves, and the lag between arrivals locates the epicenter.',
      misconceptions: [
        {
          claim: 'Earthquake magnitude scales linearly.',
          correction: 'Each whole step is ~32× more energy — a magnitude 7 releases about a thousand times the energy of a 5.',
        },
      ],
      workedExample: {
        setup: 'A station records S-waves arriving 40 s after P-waves (Vp = 6 km/s, Vs = 3.5 km/s).',
        steps: ['Lag per km = 1/3.5 − 1/6 ≈ 0.119 s.', 'Distance = 40 / 0.119.'],
        answer: '≈ 336 km from the epicenter.',
      },
      citations: [{ title: 'CurriculumOS genome: earthquakes', source: 'genome', externalId: 'geo/earthquakes' }],
    },
    {
      key: 'geo/volcanic-hazards',
      name: 'Volcanic hazards',
      aliases: ['volcanoes', 'volcanic hazard', 'pyroclastic flows'],
      requires: ['geo/igneous', 'geo/plate-tectonics'],
      definition:
        'Volcanic hazard depends on magma chemistry: silica-rich magmas trap gas and erupt explosively, while basaltic magmas tend to flow.',
      misconceptions: [
        {
          claim: 'Lava flows are the deadliest volcanic hazard.',
          correction: 'Lava is slow and avoidable; pyroclastic flows and lahars kill far more people.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: volcanic hazards', source: 'genome', externalId: 'geo/volcanic-hazards' }],
    },
    {
      key: 'geo/weathering-erosion',
      name: 'Weathering and erosion',
      aliases: ['weathering', 'erosion'],
      requires: ['geo/rock-cycle'],
      definition:
        'Weathering breaks rock down in place — mechanically or chemically — and erosion transports the products; climate sets which process dominates.',
      misconceptions: [
        {
          claim: 'Weathering and erosion are the same process.',
          correction: 'Weathering disintegrates; erosion removes — a cliff can weather for centuries before anything erodes.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: weathering and erosion', source: 'genome', externalId: 'geo/weathering-erosion' }],
    },
    {
      key: 'geo/streams-groundwater',
      name: 'Streams and groundwater',
      aliases: ['streams', 'groundwater', 'aquifers', 'hydrology'],
      requires: ['geo/weathering-erosion'],
      definition:
        'Streams shape most landscapes by transporting sediment toward base level; groundwater fills pore space and moves down hydraulic gradients through aquifers.',
      misconceptions: [
        {
          claim: 'Groundwater flows in underground rivers.',
          correction: 'Except in karst, groundwater seeps through connected pores at centimeters per day — porous medium, not pipes.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: streams and groundwater', source: 'genome', externalId: 'geo/streams-groundwater' }],
    },
    {
      key: 'geo/geologic-time',
      name: 'Geologic time and relative dating',
      aliases: ['geologic time', 'relative dating', 'stratigraphy', 'deep time'],
      requires: ['geo/sedimentary'],
      definition:
        'Relative dating orders events with superposition, cross-cutting, and inclusions; radiometric methods anchor that order to absolute ages.',
      misconceptions: [
        {
          claim: 'Radiometric dating measures the age of the whole rock since deposition.',
          correction: 'It dates crystallization of particular minerals — a sedimentary rock’s grains predate the rock itself.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: geologic time', source: 'genome', externalId: 'geo/geologic-time' }],
    },
  ],
};
