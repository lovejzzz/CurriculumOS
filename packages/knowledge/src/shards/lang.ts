import type { GenomeShard } from '../types.ts';

/** Language shard (V0.0.4) — first-semester Mandarin teaching concepts. The
 *  prototype never had a 'lang' shard (mandarin linked 0/15, documented in the
 *  fixtures). Kernels carry real hanzi WITH tone-marked pinyin (K2, and the
 *  verdict-ledger case "no-study-guide-pairs-hanzi-with-tone-marked-pinyin"). */
export const lang: GenomeShard = {
  id: 'lang',
  discipline: 'language',
  concepts: [
    {
      key: 'lang/pinyin-tones',
      name: 'Pinyin and the four tones',
      aliases: ['the pinyin system and the four tones', 'pinyin system', 'four tones', 'tones'],
      requires: [],
      definition:
        'Pinyin romanizes Mandarin sounds; the four tones (plus neutral) are pitch contours that distinguish word meaning — mā (妈, mother), má (麻, hemp), mǎ (马, horse), mà (骂, scold).',
      misconceptions: [
        {
          claim: 'Tones are optional expressiveness, like intonation in English.',
          correction: 'Tones are phonemic — changing the tone changes the WORD; 买 mǎi (buy) and 卖 mài (sell) differ only by tone.',
        },
        {
          claim: 'Pinyin letters sound like English letters.',
          correction: 'Pinyin is its own system: c = ts, q = ch (front), x = sh (front), zh/ch/sh are retroflex — map sounds, not spellings.',
        },
      ],
      workedExample: {
        setup: 'Distinguish 买 mǎi and 卖 mài in the sentence frame 我要___水果 (wǒ yào ___ shuǐguǒ).',
        steps: ['Say both with exaggerated contours: dip-rise (3rd) vs fall (4th).', 'Insert each into the frame and check meaning: buy fruit vs sell fruit.', 'Minimal-pair drill with a partner until the contour is automatic.'],
        answer: '我要买水果 (wǒ yào mǎi shuǐguǒ) = I want to BUY fruit; the falling tone flips it to selling.',
      },
      romanization: { 妈: 'mā', 麻: 'má', 马: 'mǎ', 骂: 'mà', 买: 'mǎi', 卖: 'mài' },
      excerpt: { work: 'tone minimal pairs', text: '妈 mā · 麻 má · 马 mǎ · 骂 mà', locator: 'the classic four-tone set' },
      citations: [{ title: 'CurriculumOS genome: pinyin and tones', source: 'genome', externalId: 'lang/pinyin-tones' }],
    },
    {
      key: 'lang/greetings',
      name: 'Greetings and self-introductions',
      aliases: ['greetings', 'self-introductions', 'introducing yourself'],
      requires: ['lang/pinyin-tones'],
      definition:
        'Basic greetings (你好 nǐ hǎo) and self-introduction follow the pattern 我叫… (wǒ jiào…, I am called…) / 我是… (wǒ shì…, I am…), with 您 nín as the respectful you.',
      misconceptions: [
        {
          claim: '你好吗 (nǐ hǎo ma) is how Chinese speakers normally greet each other.',
          correction: 'It is textbook-real but conversation-rare; 你好, 早 (zǎo), or situational greetings (吃了吗 chī le ma) are far more natural.',
        },
      ],
      workedExample: {
        setup: 'Introduce yourself to a new classmate.',
        steps: ['你好 (nǐ hǎo) — greeting.', '我叫王明 (wǒ jiào Wáng Míng) — name.', '认识你很高兴 (rènshi nǐ hěn gāoxìng) — pleased to meet you.'],
        answer: '你好，我叫王明，认识你很高兴。',
      },
      romanization: { 你好: 'nǐ hǎo', 我叫: 'wǒ jiào', 您: 'nín', 认识你很高兴: 'rènshi nǐ hěn gāoxìng' },
      excerpt: { work: 'dialogue model', text: '你好，我叫王明。— nǐ hǎo, wǒ jiào Wáng Míng.', locator: 'introduction frame' },
      citations: [{ title: 'CurriculumOS genome: greetings', source: 'genome', externalId: 'lang/greetings' }],
    },
    {
      key: 'lang/classroom-language',
      name: 'Classroom language',
      aliases: ['classroom expressions', 'classroom language'],
      requires: ['lang/greetings'],
      definition:
        'High-frequency classroom phrases — 请再说一遍 (qǐng zài shuō yí biàn, please say it again), 我不懂 (wǒ bù dǒng, I don’t understand), 怎么说 (zěnme shuō, how do you say) — let learners manage the class IN Mandarin from week one.',
      misconceptions: [
        {
          claim: 'You need vocabulary and grammar first, then you can speak.',
          correction: 'Interaction phrases are learnable as fixed chunks immediately — fluency grows from using them before the grammar is understood.',
        },
      ],
      romanization: { 请再说一遍: 'qǐng zài shuō yí biàn', 我不懂: 'wǒ bù dǒng', 怎么说: 'zěnme shuō' },
      citations: [{ title: 'CurriculumOS genome: classroom language', source: 'genome', externalId: 'lang/classroom-language' }],
    },
    {
      key: 'lang/numbers-dates',
      name: 'Numbers, age, and dates',
      aliases: ['numbers', 'age and dates', 'telling dates'],
      requires: ['lang/pinyin-tones'],
      definition:
        'Mandarin numbers compose decimally (二十三 èrshísān = 23); dates stack large-to-small (年 month 月 day 日/号), and age uses 岁 (suì) — 我二十岁 (wǒ èrshí suì).',
      misconceptions: [
        {
          claim: '二 (èr) and 两 (liǎng) are interchangeable for "two."',
          correction: '两 appears before measure words (两个人 liǎng ge rén); 二 is for counting and compound numbers (十二 shí’èr).',
        },
      ],
      workedExample: {
        setup: 'Say "March 8, 2026" in Mandarin.',
        steps: ['Order large-to-small: year, month, day.', '二零二六年 (èr líng èr liù nián) + 三月 (sān yuè) + 八号 (bā hào).'],
        answer: '二零二六年三月八号 (èr líng èr liù nián sān yuè bā hào).',
      },
      romanization: { 二十三: 'èrshísān', 两: 'liǎng', 岁: 'suì', 年: 'nián', 月: 'yuè', 号: 'hào' },
      citations: [{ title: 'CurriculumOS genome: numbers and dates', source: 'genome', externalId: 'lang/numbers-dates' }],
    },
    {
      key: 'lang/de-possession',
      name: 'Possession with 的',
      aliases: ['family members and possession with 的', 'possession with de', '的'],
      requires: ['lang/pinyin-tones'],
      definition:
        '的 (de) links a possessor to what it possesses — 我的书 (wǒ de shū, my book) — but drops for close relationships and institutions: 我妈妈 (wǒ māma), 我们学校 (wǒmen xuéxiào).',
      misconceptions: [
        {
          claim: '的 is required wherever English uses "’s" or "my/your".',
          correction: 'Kinship and close-belonging phrases idiomatically omit 的 — 我妈妈, not 我的妈妈, in natural speech.',
        },
      ],
      workedExample: {
        setup: 'Translate: "my mother’s friend’s book".',
        steps: ['Chain possessors left to right: 我妈妈 (no 的 — kinship).', 'Add 的 between non-kin links: 我妈妈的朋友 (wǒ māma de péngyou).', 'Final link: …的书 (de shū).'],
        answer: '我妈妈的朋友的书 (wǒ māma de péngyou de shū).',
      },
      romanization: { 的: 'de', 我的书: 'wǒ de shū', 我妈妈: 'wǒ māma', 朋友: 'péngyou' },
      excerpt: { work: 'pattern frame', text: '我的书 wǒ de shū · 我妈妈 wǒ māma (no 的)', locator: 'possession contrast pair' },
      citations: [{ title: 'CurriculumOS genome: 的 possession', source: 'genome', externalId: 'lang/de-possession' }],
    },
    {
      key: 'lang/time-routines',
      name: 'Daily routines and telling time',
      aliases: ['daily routines', 'telling time'],
      requires: ['lang/numbers-dates'],
      definition:
        'Time expressions come BEFORE the verb (我七点起床 wǒ qī diǎn qǐchuáng, I get up at seven) — time-when phrases occupy the pre-verbal slot, unlike English.',
      misconceptions: [
        {
          claim: 'Time goes at the end of the sentence, as in English ("I get up at 7").',
          correction: 'Mandarin places time-when before the verb (often after the subject): 我七点起床, never *我起床七点.',
        },
      ],
      romanization: { 七点: 'qī diǎn', 起床: 'qǐchuáng', 半: 'bàn', 现在: 'xiànzài' },
      citations: [{ title: 'CurriculumOS genome: time and routines', source: 'genome', externalId: 'lang/time-routines' }],
    },
    {
      key: 'lang/svo-negation',
      name: 'SVO patterns with 不 and 没',
      aliases: ['core svo sentence patterns', 'svo sentence patterns', 'negation', '不', '没'],
      requires: ['lang/pinyin-tones'],
      definition:
        'Mandarin core order is Subject–Verb–Object; negation chooses 不 (bù, habitual/future/volitional) or 没 (méi, completed/past and for 有) — 我不喝咖啡 vs 我没喝咖啡.',
      misconceptions: [
        {
          claim: '不 and 没 are interchangeable "not".',
          correction: '不 negates habits, intentions, and the future; 没 negates completed events and 有 — 我没去 (I didn’t go) vs 我不去 (I’m not going).',
        },
        {
          claim: 'Mandarin needs verb conjugation for tense.',
          correction: 'Verbs never conjugate; aspect particles (了, 过) and time words carry what English does with tense.',
        },
      ],
      workedExample: {
        setup: 'Negate correctly: "I didn’t eat breakfast" vs "I don’t eat breakfast".',
        steps: ['Completed event → 没: 我没吃早饭 (wǒ méi chī zǎofàn).', 'Habit → 不: 我不吃早饭 (wǒ bù chī zǎofàn).'],
        answer: '没 for the missed meal this morning; 不 for the standing habit.',
      },
      romanization: { 不: 'bù', 没: 'méi', 我不喝咖啡: 'wǒ bù hē kāfēi', 我没吃早饭: 'wǒ méi chī zǎofàn' },
      citations: [{ title: 'CurriculumOS genome: SVO and negation', source: 'genome', externalId: 'lang/svo-negation' }],
    },
    {
      key: 'lang/ma-questions',
      name: 'Questions with 吗',
      aliases: ['questions with ma', '吗 questions', 'yes-no questions'],
      requires: ['lang/svo-negation'],
      definition:
        'Appending 吗 (ma) to a statement makes a yes–no question without word-order change — 你是学生吗？ — while A-not-A (你是不是学生？) asks the same thing emphatically.',
      misconceptions: [
        {
          claim: 'Questions need inversion or a question word, as in English.',
          correction: 'Statement word order is preserved; the particle does all the work — 你忙吗？ is exactly 你忙 + 吗.',
        },
      ],
      romanization: { 吗: 'ma', 你是学生吗: 'nǐ shì xuésheng ma', 是不是: 'shì bu shì' },
      citations: [{ title: 'CurriculumOS genome: 吗 questions', source: 'genome', externalId: 'lang/ma-questions' }],
    },
    {
      key: 'lang/characters',
      name: 'Basic characters and radicals',
      aliases: ['basic characters', 'character writing', 'short reading passages', 'hanzi'],
      requires: ['lang/pinyin-tones'],
      definition:
        'Characters compose from radicals (semantic hints) and phonetic components — 妈 (mā) = 女 (woman) + 马 (mǎ, sound) — so analysis beats rote memorization at scale.',
      misconceptions: [
        {
          claim: 'Every character must be memorized as an arbitrary picture.',
          correction: 'Over 80% of characters are semantic-phonetic compounds; learning radicals and phonetics turns memorization into decomposition.',
        },
        {
          claim: 'Stroke order is pedantic tradition.',
          correction: 'Consistent stroke order makes characters legible, writable at speed, and look-up-able — it is motor grammar, not etiquette.',
        },
      ],
      romanization: { 妈: 'mā', 女: 'nǚ', 马: 'mǎ', 好: 'hǎo' },
      excerpt: { work: 'radical decomposition', text: '妈 = 女 (meaning) + 马 (sound) → mā', locator: 'semantic-phonetic compound example' },
      citations: [{ title: 'CurriculumOS genome: characters and radicals', source: 'genome', externalId: 'lang/characters' }],
    },
    {
      key: 'lang/food-dining',
      name: 'Food and dining',
      aliases: ['food and dining', 'ordering food'],
      requires: ['lang/svo-negation', 'lang/numbers-dates'],
      definition:
        'Ordering uses 要 (yào, want) and 点 (diǎn, order) with measure words — 我要一碗面 (wǒ yào yì wǎn miàn, I want a bowl of noodles); 碗/杯/盘 classify by container.',
      misconceptions: [
        {
          claim: 'Measure words are optional politeness.',
          correction: 'A number cannot touch a noun directly — *一面 is ungrammatical; the measure word (一碗面) is structurally required.',
        },
      ],
      romanization: { 要: 'yào', 点: 'diǎn', 一碗面: 'yì wǎn miàn', 杯: 'bēi', 好吃: 'hǎochī' },
      citations: [{ title: 'CurriculumOS genome: food and dining', source: 'genome', externalId: 'lang/food-dining' }],
    },
    {
      key: 'lang/shopping-money',
      name: 'Shopping and money',
      aliases: ['shopping and money', 'prices', 'bargaining'],
      requires: ['lang/numbers-dates'],
      definition:
        'Prices use 块 (kuài, colloquial yuan) and 多少钱 (duōshao qián, how much) — 这个多少钱？ 三十五块。 — with 太…了 (tài…le) for "too …" in bargaining.',
      misconceptions: [
        {
          claim: '元 (yuán) is what speakers say for prices.',
          correction: '元 is the written/formal unit; spoken Mandarin overwhelmingly uses 块 (kuài) — like "bucks" vs "dollars."',
        },
      ],
      romanization: { 多少钱: 'duōshao qián', 块: 'kuài', 太贵了: 'tài guì le', 便宜: 'piányi' },
      citations: [{ title: 'CurriculumOS genome: shopping and money', source: 'genome', externalId: 'lang/shopping-money' }],
    },
    {
      key: 'lang/directions-transport',
      name: 'Transportation and directions',
      aliases: ['transportation and directions', 'asking directions', 'getting around'],
      requires: ['lang/svo-negation'],
      definition:
        'Directions use 怎么去 (zěnme qù, how to get to) and verbs of conveyance with 坐 (zuò, ride) — 坐地铁 (zuò dìtiě, take the subway) — plus location words 在…旁边/对面 (beside/opposite).',
      misconceptions: [
        {
          claim: '坐 only means "to sit."',
          correction: 'With vehicles 坐 means "to ride/take" — 坐公共汽车 (take the bus); the literal "sit" reading misparses transport sentences.',
        },
      ],
      romanization: { 怎么去: 'zěnme qù', 坐地铁: 'zuò dìtiě', 旁边: 'pángbiān', 对面: 'duìmiàn' },
      citations: [{ title: 'CurriculumOS genome: directions and transport', source: 'genome', externalId: 'lang/directions-transport' }],
    },
    {
      key: 'lang/health-feelings',
      name: 'Health and feelings',
      aliases: ['health and feelings', 'how you feel', 'illness'],
      requires: ['lang/svo-negation'],
      definition:
        'Feelings take 很 (hěn) by default — 我很累 (wǒ hěn lèi, I’m tired) — because adjectives are stative verbs; bare adjectives imply contrast, and 不舒服 (bù shūfu) covers feeling unwell.',
      misconceptions: [
        {
          claim: '很 always means "very."',
          correction: 'Pre-adjective 很 is usually a structural filler — 我很忙 is neutral "I’m busy"; intensity needs 非常 or stress.',
        },
      ],
      romanization: { 很: 'hěn', 我很累: 'wǒ hěn lèi', 不舒服: 'bù shūfu', 头疼: 'tóuténg' },
      citations: [{ title: 'CurriculumOS genome: health and feelings', source: 'genome', externalId: 'lang/health-feelings' }],
    },
  ],
};
