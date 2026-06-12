import { useState } from 'react';
import { getArtifact, type EditResult } from '../api.ts';
import { ArtifactView } from './ArtifactView.tsx';

/** The Course — the artifact set as ONE continuous document, not eleven tabs.
 *  The course map is its table of contents; each session unfolds its plan,
 *  deck, briefs, rubric, readings inline (founding §6). */
const SESSION_ARTIFACTS: { kind: string; label: string }[] = [
  { kind: 'lessonPlans', label: 'plan' },
  { kind: 'slideDecks', label: 'deck' },
  { kind: 'studyGuides', label: 'study guide' },
  { kind: 'discussions', label: 'discussion' },
  { kind: 'quizBank', label: 'quiz' },
];

export function CourseDoc({
  course,
  glowIds,
  onWeightEdit,
}: {
  course: any;
  glowIds: Set<string>;
  onWeightEdit: (id: string, weightPct: number) => void;
}) {
  const sessions = [...course.graph.sessions].sort((a: any, b: any) => a.index - b.index);
  const graded = course.graph.assessments.filter((a: any) => a.weightPct !== null);
  const total = graded.reduce((s: number, a: any) => s + a.weightPct, 0);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>{course.graph.courseTitle}</h2>
      <p className="muted">
        {course.graph.discipline} · {sessions.length} sessions · {course.graph.concepts.length} concepts ·{' '}
        {course.graph.assessments.length} assessments · {course.graph.bridges.length} prerequisite bridges
      </p>

      {/* Grading table — the editable surface where the four-second sync moment starts */}
      <div className={`block ${[...glowIds].some((g) => g.startsWith('A')) ? 'glow' : ''}`} style={{ marginBottom: 20 }}>
        <h4>
          Grading table{' '}
          {graded.length > 0 && Math.abs(total - 100) > 0.5 && <span className="queue-tag">sums to {total.toFixed(0)}%</span>}
        </h4>
        {graded.length === 0 && (
          <p className="muted">No weights stated in the brief — the syllabus prints “weighting per instructor” (weights are never invented).</p>
        )}
        {graded.length > 0 && (
        <table className="grid">
          <tbody>
            <tr>
              <th>Id</th>
              <th>Assessment</th>
              <th>Weight</th>
            </tr>
            {graded.map((a: any) => (
              <tr key={a.id} className={glowIds.has(a.id) ? 'glow' : ''}>
                <td>
                  <span className="id-badge">{a.id}</span>
                </td>
                <td>{a.title}</td>
                <td>
                  <input
                    type="number"
                    value={a.weightPct}
                    min={0}
                    max={100}
                    style={{ width: 64, padding: '3px 6px', border: '1px solid var(--slate-300)', borderRadius: 'var(--radius-sm)' }}
                    onChange={(e) => onWeightEdit(a.id, Number(e.target.value))}
                  />
                  %
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {sessions.map((s: any) => (
        <SessionBlock key={s.id} course={course} session={s} glowIds={glowIds} />
      ))}
    </div>
  );
}

function SessionBlock({ course, session, glowIds }: { course: any; session: any; glowIds: Set<string> }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState<Record<string, any>>({});
  const outcomes = course.graph.outcomes.filter((o: any) => o.sessionId === session.id);
  const due = course.graph.assessments.filter((a: any) => a.dueSessionId === session.id);
  const readings = course.graph.readings.filter((r: any) => r.sessionIds.includes(session.id));
  const bridge = course.graph.bridges.find((b: any) => b.beforeSessionId === session.id);

  async function show(kind: string) {
    if (loaded[kind]) {
      setLoaded((m) => ({ ...m, [kind]: m[kind].__hidden ? loaded[kind] : { ...m[kind], __hidden: !m[kind].__hidden } }));
      return;
    }
    const art = await getArtifact(course.id, kind, session.id);
    setLoaded((m) => ({ ...m, [kind]: art }));
  }

  return (
    <details className="session" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary>
        <span className="id-badge">{session.id}</span>
        <span className="session-title">{session.title}</span>
        {bridge && <span className="queue-tag" title="prerequisite primer">⚑ bridge</span>}
        <span className="count-pill" style={{ marginLeft: 'auto' }}>{outcomes.length}</span>
      </summary>
      <div className="artifact-row">
        {SESSION_ARTIFACTS.map((a) => (
          <button className="artifact-chip" key={a.kind} onClick={() => show(a.kind)}>
            {a.label}
          </button>
        ))}
      </div>
      <div className="session-body">
        {outcomes.length > 0 && (
          <div className="block">
            <h4>Outcomes</h4>
            <ul>
              {outcomes.map((o: any) => (
                <li key={o.id}>
                  <span className="id-badge">{o.id}</span> {o.text} <span className="muted">({o.bloom})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {due.length > 0 && (
          <div className="block">
            <h4>Due this session</h4>
            {due.map((a: any) => (
              <div key={a.id} className={glowIds.has(a.id) ? 'glow' : ''}>
                <span className="id-badge">{a.id}</span> {a.title} {a.weightPct != null && <span className="muted">— {a.weightPct}%</span>}
              </div>
            ))}
          </div>
        )}
        {readings.length > 0 && (
          <div className="block">
            <h4>Readings</h4>
            {readings.map((r: any) => (
              <div key={r.id}>
                <span className="id-badge">{r.id}</span> {r.author ? `${r.author}, ` : ''}
                {r.title} {r.locator && <span className="muted">({r.locator})</span>}
              </div>
            ))}
          </div>
        )}
        {Object.entries(loaded).map(([kind, art]: [string, any]) =>
          art.__hidden ? null : <ArtifactView key={kind} artifact={art} glowIds={glowIds} />,
        )}
      </div>
    </details>
  );
}
