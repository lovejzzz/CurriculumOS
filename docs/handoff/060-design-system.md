# 060-design-system.md — the visual law, carried over

_The v0.14.4 "Calm Surface" system, distilled to what CI enforces. The scans catch their own author (Law 10) — they did, twice, in one day. Prototype reference: `src/index.css` (the `.dark` layer ~300–760), `tests/v0144-tokens*.jsx` (the codified scans)._

## Color semantics (the accent rule)

- **slate** = structure (chrome, borders, labels, tables)
- **indigo** = interactive (links, primary affordances, active states)
- **amber / green / red** = status ONLY (warning / healthy / blocking) — never decoration
- One accent per surface; emerald appears only on verified-good states (the Seal, ready cards).

## Type

- **12px reading floor** for all prose and labels. The ONLY sub-12px allowance is the **counted 10px badge scale** — identity badges (ids, list-prefix chips, count pills), maintained as an explicit per-file count ledger in the scan test; adding one is a deliberate ledger edit, not a style choice.
- Body rhythm 13px/1.55 in dense surfaces (tables); sentence case everywhere — no Title Case labels, no ALL-CAPS except 10px tracked section markers.

## Shape & rhythm

- One radius scale: `lg` (cards/containers) / `md` (buttons/inputs) / `sm` (chips). No bespoke radii.
- Hairline borders (`*/50` opacities) + soft shadows; no hard outlines.
- Status communicated by icon + tone pairs, never color alone (a11y).

## Dark mode

- A **global `.dark` layer** owns dark styling; per-element `dark:` classes only for what the layer can't reach. The landing is light-default, not dark-native (pinned in tests).
- Contrast: WCAG AA measured on composited colors (the prototype verified 6.9:1+ in-browser; the new repo measures in CI).

## Components that earned their names (the Desk vocabulary)

| Component     | Contract                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------- |
| **The Spine** | sole status narrator; renders machine states verbatim; carries the cost ticker            |
| **The Seal**  | the grade pair (Quality + Teachable); always current; click = full receipt                |
| **The Queue** | the ONE review surface — TA proposals, sync diffs, observations; nothing auto-applies     |
| **The CTA**   | one morphing primary verb (`Build → Building… → Review N → Download`); all else disclosed |
| NoticeBanner  | the one attention shell (amber); never two attention components for one fact              |

## CI scans (port the pattern, not just the values)

1. No 8/9/11px text in owned chrome; 10px only per the counted ledger.
2. Accent-rule scan: amber/green/red classnames only in status-bearing components.
3. Radius-scale scan; sentence-case label scan.
4. Dark-parity audit against the global layer.
5. Bundle budgets per chunk with dated comments (raising a budget is a reviewed change).
