import type { MachineState } from '../api.ts';

/** The Spine — the single narrator. Renders machine states verbatim (Law 7).
 *  Carries the cost ticker (Law 9). Nothing else in the product announces
 *  status, ever. */
const ORDER = ['intake', 'author', 'link', 'judge', 'compile', 'voice', 'verify', 'grade', 'ready'];

export function Spine({ current, cost, seen }: { current: MachineState | null; cost: number; seen: Set<string> }) {
  const activeIdx = current ? ORDER.indexOf(current.state) : -1;
  return (
    <div className="spine">
      {ORDER.map((s, i) => {
        const done = seen.has(s) && (activeIdx === -1 || i < activeIdx || current?.state === 'ready');
        const active = current?.state === s && current?.state !== 'ready';
        return (
          <span key={s} className={`step ${active ? 'active' : done ? 'done' : ''}`}>
            <span className="dot" />
            <span className="marker">{s}</span>
            {done && <span aria-hidden>✓</span>}
          </span>
        );
      })}
      <span className="ticker">${cost.toFixed(4)}</span>
    </div>
  );
}
