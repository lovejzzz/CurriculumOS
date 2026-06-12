import { useState } from 'react';
import { chat, type TAProposal, type EditResult } from '../api.ts';

/** The TA — proactive but polite. Its tools are EditOps, so everything it does
 *  arrives as a proposal with a diff and a fresh grade, reviewed in the Queue.
 *  Nothing auto-applies (founding §6, ADR-12: one edit pathway). */
type Msg = { who: 'me' | 'them'; text: string };

export function TA({
  courseId,
  queue,
  onApply,
}: {
  courseId: string;
  queue: { id: number; summary: string; diff: EditResult['diff']; cost?: number }[];
  onApply: (ops: any[], note?: string) => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { who: 'them', text: 'I’m your TA. Ask me to rebalance weights, rename a session, add a reading — I’ll propose the edit for your review.' },
  ]);
  const [input, setInput] = useState('');
  const [proposal, setProposal] = useState<TAProposal | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setMsgs((m) => [...m, { who: 'me', text }]);
    setInput('');
    setBusy(true);
    try {
      const p = await chat(courseId, text);
      setMsgs((m) => [...m, { who: 'them', text: p.reply }]);
      setProposal(p.ops.length ? p : null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>
        The TA {queue.length > 0 && <span className="count-pill">{queue.length}</span>}
      </h3>

      {queue.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div className="queue-tag">review queue</div>
          {queue.map((q) => (
            <div className="queue-item" key={q.id}>
              <div className="ops">{q.summary}</div>
              {q.diff.map((d, i) => (
                <div className="diff-card" key={i}>
                  {d.artifact} · {d.summary}
                </div>
              ))}
              {q.cost != null && <div className="muted">re-graded · ${q.cost.toFixed(2)}</div>}
            </div>
          ))}
        </div>
      )}

      <div>
        {msgs.map((m, i) => (
          <div key={i} className={`ta-msg ${m.who}`}>
            {m.text}
          </div>
        ))}
        {proposal && (
          <div className="queue-item">
            <div className="queue-tag">proposed edit</div>
            <div className="ops">{proposal.ops.map((o) => o.type).join(', ')}</div>
            {proposal.preview?.diff.map((d, i) => (
              <div className="diff-card" key={i}>
                {d.artifact} · {d.summary}
              </div>
            ))}
            {proposal.preview && (
              <div className="muted">
                would re-grade → {proposal.preview.grade.structural.score}/{proposal.preview.grade.structural.letter} · teachable{' '}
                {proposal.preview.grade.teachability.score10}/10
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="cta" onClick={() => { onApply(proposal.ops, proposal.note); setProposal(null); }}>
                Accept
              </button>
              <button className="cta ghost" onClick={() => setProposal(null)}>
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="ta-input">
        <input
          value={input}
          placeholder="e.g. set weight of A8.1 to 25"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          disabled={busy}
        />
        <button className="cta" onClick={send} disabled={busy}>
          {busy ? '…' : 'Ask'}
        </button>
      </div>
    </div>
  );
}
