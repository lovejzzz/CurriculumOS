/** ArtifactView — renders one fetched artifact's blocks (the render layer's
 *  RenderBlock shape). Reading order = teaching order; formats are just exports. */
export function ArtifactView({ artifact, glowIds }: { artifact: any; glowIds: Set<string> }) {
  if (!artifact?.blocks) return null;
  return (
    <div className="artifact-card">
      {artifact.blocks.map((b: any, i: number) => (
        <Block key={i} b={b} glowIds={glowIds} />
      ))}
    </div>
  );
}

function Block({ b, glowIds }: { b: any; glowIds: Set<string> }) {
  const glow = (b.entityId && glowIds.has(b.entityId)) || (b.kind === 'grading-table' && [...glowIds].some((g) => g.startsWith('A')));
  return (
    <div className={`block ${glow ? 'glow' : ''}`}>
      {b.heading && (
        <h4>
          {b.entityId && <span className="id-badge">{b.entityId}</span>} {b.heading}
        </h4>
      )}
      {b.text && <p style={{ whiteSpace: 'pre-wrap', margin: '4px 0' }}>{b.text}</p>}
      {b.rows && b.rows.length > 0 && (
        <table className="grid">
          <tbody>
            {b.rows.map((row: string[], r: number) => (
              <tr key={r}>
                {row.map((cell, c) =>
                  r === 0 ? <th key={c}>{cell}</th> : <td key={c}>{cell}</td>,
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {b.meta?.notes && <p className="muted">🗣 {b.meta.notes}</p>}
      {b.meta?.answer && <p className="muted">✓ {b.meta.answer}</p>}
      {b.meta?.explanation && <p className="muted">✓ {b.meta.explanation}</p>}
      {b.children?.map((c: any, i: number) => <Block key={i} b={c} glowIds={glowIds} />)}
    </div>
  );
}
