/** voice/contracts.ts — the voice contracts (020-contracts §W), as lints.
 *  Violations after one retry → fallback to compiled skeleton (W4); a voice
 *  failure can never make a package worse than no voice at all. */
import { numbersIn, wordCount } from '../util.ts';

export interface VoiceCheck {
  ok: boolean;
  violations: string[];
}

const PROPER_NOUN_RE = /\b[A-Z][a-zA-Z’'-]+\b/g;

/** Extract proper-noun CLAIMS — capitalized words that assert an entity.
 *  A word capitalized because it begins a sentence is grammatically required,
 *  not a claim, so the FIRST capitalized token of each sentence is exempt.
 *  This is the calibration the prototype's grader needed (trap #10): a check
 *  that flags honest variation is worse than no check. New numbers are caught
 *  separately, so a genuine new fact rarely hides in a sentence-initial word. */
function properNouns(text: string, skipSentenceInitial: boolean): Set<string> {
  const out = new Set<string>();
  for (const s of text.split(/(?<=[.!?])\s+/)) {
    const words = s.match(PROPER_NOUN_RE) ?? [];
    // for VOICED text, skip the sentence-opening capitalized word (grammar, not
    // a claim); for the GROUNDING set, capture everything so voiced text may
    // reuse any grounded name regardless of where it sat.
    (skipSentenceInitial ? words.slice(1) : words).forEach((w) => out.add(w));
  }
  return out;
}

export interface VoiceContractInput {
  voiced: string;
  compiled: string;
  /** frozen substrings that must survive verbatim (ids, titles, requirement lines) */
  frozen: string[];
  /** W2 grounding set — the facts the surface may draw on (compiled text PLUS
   *  the session's kernel/concepts/readings). Defaults to compiled. */
  grounding?: string;
  minWords?: number;
  maxWords?: number;
}

/** Validate one voiced surface against the W-contracts. */
export function checkVoice(input: VoiceContractInput): VoiceCheck {
  const { voiced, compiled, frozen } = input;
  const grounding = input.grounding ?? compiled;
  const violations: string[] = [];
  const min = input.minWords ?? 60;
  const max = input.maxWords ?? 140;

  // W3 — bounds
  const wc = wordCount(voiced);
  if (wc < min) violations.push(`W3-bounds: ${wc} words < ${min}`);
  if (wc > max) violations.push(`W3-bounds: ${wc} words > ${max}`);
  // W3 — no headers inside surfaces
  if (/^#{1,6}\s|\n#{1,6}\s/.test(voiced)) violations.push('W3-headers: heading markup inside surface');
  // W3 — complete prose: a surface must END (campaign day 1: a voiced deck
  // hook trailing off mid-clause was a P1 in the rendered bytes) and may not
  // carry placeholder tokens (a literal "[]" in a lesson plan was the P0
  // that blocked cs-python)
  if (!/[.!?:。！？"’”)]\s*$/.test(voiced.trim())) violations.push('W3-truncation: surface ends mid-clause (no terminal punctuation)');
  if (/\[\]|\bTBD\b|\{\{|\bXXX\b|\blorem\b|\bplaceholder\b/i.test(voiced)) violations.push('W3-placeholder: placeholder token in surface');

  // W1 — frozen text survives verbatim
  for (const f of frozen) {
    if (f && !voiced.includes(f)) violations.push(`W1-frozen: lost "${f.slice(0, 40)}"`);
  }

  // W2 — no new facts: no number absent from the grounding set
  const groundedNums = numbersIn(grounding);
  for (const n of numbersIn(voiced)) {
    if (!groundedNums.has(n)) violations.push(`W2-no-new-facts: new number "${n}"`);
  }
  // W2 — no new proper nouns absent from the grounding set. Matching is
  // lemma-level and case-insensitive: a discipline term the grounding carries
  // lowercase ("the demand curve") may legitimately appear capitalized in
  // voiced prose ("Demand", "Curve") — that is style, not a new fact. Only a
  // name with NO lemma in the grounding is a claim (trap #10 calibration).
  const groundingLower = grounding.toLowerCase();
  const lemma = (w: string): string => w.toLowerCase().replace(/(ies|es|s|ed|ing)$/u, '');
  const isGrounded = (name: string): boolean => {
    const lower = name.toLowerCase();
    if (groundingLower.includes(lower)) return true;
    const stem = lemma(name);
    return stem.length >= 3 && groundingLower.includes(stem);
  };
  for (const name of properNouns(voiced, true)) {
    if (!isGrounded(name)) violations.push(`W2-no-new-facts: new name "${name}"`);
  }

  return { ok: violations.length === 0, violations };
}
