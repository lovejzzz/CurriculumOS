/** author/itemContracts.ts — the assessment-item contracts (V0.0.3). The judge
 *  scored quizzes 1–4/10: "templated distractors, placeholder keys, tests
 *  recognition of canned statements." These lints make a genuine item the only
 *  thing that ships — a violation falls back to the compiled item, counted.
 *
 *  Linted at the boundary where Pass C output enters the system; a violation
 *  retries once with the rule quoted (the 020-contracts pattern), then falls
 *  back. */
import type { AssessmentItem, Kernel } from '../schema/courseObject.ts';
import { wordCount } from '../util.ts';

export interface ItemCheck {
  ok: boolean;
  violations: string[];
}

const STOP = new Set(['the', 'a', 'an', 'of', 'is', 'are', 'to', 'and', 'or', 'in', 'on', 'for', 'with', 'that', 'this', 'it', 'as', 'be', 'by']);
function contentWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP.has(w)),
  );
}
function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const w of a) if (b.has(w)) n++;
  return n;
}

/** Validate one authored item against its grounding kernel. */
export function checkItem(item: AssessmentItem, kernel: Kernel | undefined): ItemCheck {
  const v: string[] = [];

  if (!item.stem || wordCount(item.stem) < 4) v.push('item-stem: too short to be a real question');

  if (item.kind === 'mc') {
    const opts = item.options ?? [];
    if (opts.length !== 4) v.push(`item-mc: needs exactly 4 options (got ${opts.length})`);
    const correct = opts.filter((o) => o.correct);
    if (correct.length !== 1) v.push(`item-mc: exactly ONE option may be correct (got ${correct.length})`);
    // no answer leakage: the correct option's content words must not all sit in the stem
    const stemWords = contentWords(item.stem);
    if (correct[0]) {
      const cw = contentWords(correct[0].text);
      if (cw.size >= 2 && overlap(cw, stemWords) === cw.size) v.push('item-mc: the stem leaks the answer');
    }
    // distractors must be DISTINCT from each other and from the correct option
    const texts = opts.map((o) => o.text.trim().toLowerCase());
    if (new Set(texts).size !== texts.length) v.push('item-mc: duplicate options');
    // distractors must be plausible: each shares some vocabulary with the concept (not generic filler)
    if (kernel) {
      const conceptWords = contentWords([kernel.definition, ...kernel.misconceptions.flatMap((m) => [m.claim, m.correction])].join(' '));
      const distractors = opts.filter((o) => !o.correct);
      const generic = distractors.filter((d) => overlap(contentWords(d.text), conceptWords) === 0);
      if (generic.length > 1) v.push(`item-mc: ${generic.length} distractors are generic filler (no concept vocabulary)`);
    }
  }

  if (!item.answerKey || wordCount(item.answerKey) < 2) v.push('item-key: missing or trivial answer key');
  if (/\b(TBD|TODO|placeholder|answer here|xxx)\b/i.test(item.answerKey)) v.push('item-key: placeholder key');

  return { ok: v.length === 0, violations: v };
}

/** A set of items for a session must cover varied Bloom levels and not repeat
 *  the same stem shape (the templating the judge flagged). */
export function checkItemSet(items: AssessmentItem[]): ItemCheck {
  const v: string[] = [];
  if (items.length < 4) v.push(`item-set: needs >=4 items (got ${items.length})`);
  const blooms = new Set(items.map((i) => i.bloom));
  if (blooms.size < 2) v.push('item-set: Bloom levels not varied (need >= Understand + Apply)');
  // stem shape = first 4 content words; >half identical shapes is templating
  const shapes = items.map((i) => [...contentWords(i.stem)].slice(0, 4).join(' '));
  const dupes = shapes.length - new Set(shapes).size;
  if (dupes > Math.floor(items.length / 2)) v.push('item-set: stems are templated (too many identical shapes)');
  return { ok: v.length === 0, violations: v };
}
