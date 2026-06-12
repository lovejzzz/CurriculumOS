/** render/templates/phrasing.ts — phrasing pools (DATA, not logic; ADR-10 exempt).
 *  Trap #9: any fixed sentence stamped once per session crosses the 12-repeat
 *  8-word-shingle limit at 12+ sessions. Pools rotate deterministically by
 *  entity index (util.rotate) so renders stay varied AND replay-stable. */

export const WARMUP_FRAMES = [
  'Open by surfacing what learners already believe about',
  'Begin with a quick retrieval check on',
  'Start from a concrete situation that involves',
  'Anchor the session in a short prompt about',
  'Lead with a question that exposes intuitions around',
  'Warm up by having students predict the behavior of',
];

export const CORE_FRAMES = [
  'Work through the central idea of',
  'Develop the core treatment of',
  'Build the main argument around',
  'Walk the class through the mechanics of',
  'Establish the key relationships within',
  'Unpack the structure underlying',
];

export const PRACTICE_FRAMES = [
  'Give learners a guided problem applying',
  'Move to paired practice on',
  'Set a short worked exercise targeting',
  'Have students attempt a graded-style task on',
  'Run a quick application drill for',
  'Assign in-class practice that stretches',
];

export const CLOSING_FRAMES = [
  'Close by having students restate',
  'End with a one-sentence summary of',
  'Wrap up by connecting the session back to',
  'Finish with an exit ticket on',
  'Close the loop by previewing how this feeds',
  'End by checking confidence on',
];

export const MC_CORRECT_STEMS = [
  'The best answer is',
  'Correct:',
  'The right choice is',
  'This option holds because',
  'The accurate statement is',
  'Choose this:',
];

export const MC_EXPLANATION_LEADS = [
  'This is right because',
  'It follows that',
  'The reasoning is that',
  'Here the key is that',
  'This holds since',
  'The distinction is that',
];

export const FAQ_LEADS = [
  'A common question is',
  'Students often ask',
  'You may wonder',
  'One thing learners check is',
  'A frequent point of confusion is',
  'It is worth clarifying',
];

// every lead must compose grammatically with a NOUN topic ("... on X.") — a
// lead needing a verb produced "making sure you can weathering and erosion"
// (the judge: "malformed overview sentence"). All six take a noun object.
export const GUIDE_LEADS = [
  'As you review this session, focus first on',
  'When you study this material, start with',
  'The throughline of this session is',
  'To consolidate this session, return to',
  'Reviewing here means getting comfortable with',
  'The work of this session centers on',
];

/** MC question stems rotate so an exam's items don't all open identically
 *  (trap #9). `%s` = concept name. */
export const MC_QUESTION_FRAMES = [
  'Which statement about %s is most accurate?',
  'Which of the following best describes %s?',
  'Regarding %s, which statement holds?',
  'What is true of %s?',
  'Which option correctly characterizes %s?',
  'Concerning %s, which is correct?',
];

/** Distractor frames — wrong-answer options rotate so no fixed string is
 *  stamped on every MC item (the texture rule, trap #9). `%s` = concept name. */
export const DISTRACTOR_UNRELATED = [
  'An unrelated property of %s',
  'A side effect sometimes confused with %s',
  'A neighboring idea that does not define %s',
  'A surface feature mistaken for %s',
  'A consequence rather than the meaning of %s',
  'A related term that is not %s itself',
];

export const DISTRACTOR_OTHER = [
  'A definition borrowed from a different concept',
  'A statement that belongs to another topic',
  'A claim true elsewhere but not here',
  'A definition from a later session',
  'A description of a different mechanism',
  'A rule that applies to a different case',
];

export const DISCUSSION_FRAMES = [
  'This week we turn the conversation toward',
  'Use the board to think together about',
  'Our discussion this session asks you to weigh',
  'Bring your reading to bear on',
  'The thread this session invites you into',
  'Let the discussion open up the question of',
];
