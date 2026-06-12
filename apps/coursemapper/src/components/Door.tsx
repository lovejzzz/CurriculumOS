import { useEffect, useState } from 'react';
import { intake, type Heard } from '../api.ts';

/** The Door — one screen, one decision. As the instructor types, intake
 *  reflects back the entities it hears (founding §6). Trust starts before the
 *  first build; transcription errors get caught at the door. */
export function Door({ onBuild }: { onBuild: (brief: string, voice: boolean) => void }) {
  const [brief, setBrief] = useState('');
  const [heard, setHeard] = useState<Heard | null>(null);
  const [voice, setVoice] = useState(true);

  useEffect(() => {
    if (brief.trim().length < 12) {
      setHeard(null);
      return;
    }
    const t = setTimeout(() => {
      intake(brief).then(setHeard).catch(() => setHeard(null));
    }, 350);
    return () => clearTimeout(t);
  }, [brief]);

  return (
    <div className="door">
      <div className="brand">CourseMapper · built on CurriculumOS</div>
      <h1>What course are we building?</h1>
      <textarea
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        placeholder="Intro to Microeconomics, 14 weeks, two midterms, weekly problem sets, we read Freakonomics ch. 1–4 in week 3…"
      />

      {heard && (
        <div className="heard">
          <span className="label">heard so far:</span>
          {heard.weeks != null && <span className="chip">{heard.weeks} weeks</span>}
          {heard.discipline && <span className="chip">{heard.discipline}</span>}
          {heard.assessments.map((a) => (
            <span className="chip" key={a}>
              {a}
            </span>
          ))}
          {heard.readings.map((r) => (
            <span className="chip reading" key={r}>
              📖 {r}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8 }}>
        <button className="cta" disabled={brief.trim().length < 12} onClick={() => onBuild(brief, voice)}>
          Build my course
        </button>
        <label className="muted" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} /> voice pass
        </label>
      </div>
    </div>
  );
}
