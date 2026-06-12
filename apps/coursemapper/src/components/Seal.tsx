import { useState } from 'react';
import { packageUrl, receipt } from '../api.ts';

/** The Seal — the grade, always current. Two numbers, deliberately. Click =
 *  the full receipt: findings, cost ledger, provenance, build history
 *  (founding §6: always one click from its proof). */
export function Seal({ courseId, grade }: { courseId: string; grade: any }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  if (!grade) return null;
  const s = grade.structural;
  const t = grade.teachability;

  async function toggle() {
    if (!open && !data) setData(await receipt(courseId));
    setOpen((o) => !o);
  }

  return (
    <>
      {open && data && (
        <div className="receipt-panel">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <h3 style={{ margin: 0 }}>The receipt</h3>
            <span className="muted">every answer proves itself — grade, provenance, price</span>
            <button className="cta ghost" style={{ marginLeft: 'auto' }} onClick={() => setOpen(false)}>
              close
            </button>
          </div>
          <div className="receipt-grid">
            <section>
              <h4>Findings ({s.findings.length})</h4>
              {s.findings.length === 0 && <p className="muted">No findings — structurally clean.</p>}
              {s.findings.slice(0, 8).map((f: any) => (
                <div className="diff-card" key={f.id}>
                  <strong>{f.severity}</strong> [{f.dimension}] {f.detail}
                </div>
              ))}
            </section>
            <section>
              <h4>Cost ledger</h4>
              <table className="grid">
                <tbody>
                  <tr>
                    <th>stage</th>
                    <th>model</th>
                    <th>calls</th>
                    <th>tokens in/out</th>
                    <th>usd</th>
                  </tr>
                  {(data.cost?.entries ?? []).map((e: any) => (
                    <tr key={e.stage}>
                      <td>{e.stage}</td>
                      <td>{e.model}</td>
                      <td>{e.calls}</td>
                      <td>
                        {e.inputTokens}/{e.outputTokens}
                      </td>
                      <td>${e.usd.toFixed(4)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={4}>
                      <strong>total</strong>
                    </td>
                    <td>
                      <strong>${(data.cost?.totalUsd ?? 0).toFixed(4)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
            <section>
              <h4>Provenance</h4>
              <ProvenanceSummary provenance={data.provenance ?? {}} />
            </section>
            <section>
              <h4>Builds</h4>
              {(data.builds ?? []).map((b: any) => (
                <p className="muted" key={b.buildId}>
                  {b.buildId.slice(0, 12)} · {b.terminal}
                  {b.blockedReason ? ` (${b.blockedReason})` : ''} · ${b.costUsd.toFixed(4)} · {b.states.length} states
                </p>
              ))}
            </section>
          </div>
        </div>
      )}
      <div className="seal">
        <button className="meter-btn" onClick={toggle} title="open the full receipt">
          <div className={`meter ${s.score >= 90 ? 'good' : ''}`}>
            <span className="sub">quality</span>
            <span className="val">
              {s.score} · {s.letter}
            </span>
          </div>
        </button>
        <button className="meter-btn" onClick={toggle} title="open the full receipt">
          <div className={`meter ${t.score10 >= 7 ? 'good' : ''}`}>
            <span className="sub">teachable</span>
            <span className="val">{t.score10}/10</span>
          </div>
        </button>
        <div className="muted">
          {s.findings.length} finding{s.findings.length === 1 ? '' : 's'} · sameness {t.dimensions.sameness} · specificity{' '}
          {t.dimensions.specificity} · arc {t.dimensions.arc}
        </div>
        <a className="cta grow" href={packageUrl(courseId)} download>
          Download ▾
        </a>
      </div>
    </>
  );
}

function ProvenanceSummary({ provenance }: { provenance: Record<string, { source: string }> }) {
  const counts: Record<string, number> = {};
  for (const mark of Object.values(provenance)) counts[mark.source] = (counts[mark.source] ?? 0) + 1;
  return (
    <p className="muted">
      {Object.entries(counts)
        .map(([source, n]) => `${source}: ${n}`)
        .join(' · ') || 'no provenance marks'}
    </p>
  );
}
