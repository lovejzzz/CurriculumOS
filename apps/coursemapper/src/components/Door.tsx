import { useEffect, useState } from 'react';
import { intake, type Heard, type MaterialIn } from '../api.ts';

/** The Door — one screen, one decision. As the instructor types OR DROPS A
 *  SYLLABUS, intake reflects back the entities it hears (founding §6). Trust
 *  starts before the first build; transcription errors get caught here. */
export function Door({ onBuild }: { onBuild: (brief: string, voice: boolean, materials: MaterialIn[]) => void }) {
  const [brief, setBrief] = useState('');
  const [heard, setHeard] = useState<Heard | null>(null);
  const [voice, setVoice] = useState(true);
  const [materials, setMaterials] = useState<MaterialIn[]>([]);
  const [fileStates, setFileStates] = useState<{ name: string; extracted: boolean }[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (brief.trim().length < 12 && materials.length === 0) {
      setHeard(null);
      return;
    }
    const t = setTimeout(() => {
      intake(brief, materials)
        .then((r) => {
          setHeard(r.heard);
          setFileStates(r.files ?? []);
          setNotes(r.notes ?? []);
        })
        .catch(() => setHeard(null));
    }, 350);
    return () => clearTimeout(t);
  }, [brief, materials]);

  async function addFiles(list: FileList | File[]) {
    const next: MaterialIn[] = [];
    for (const f of Array.from(list)) {
      const buf = await f.arrayBuffer();
      let bin = '';
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i += 0x8000) {
        bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      next.push({ name: f.name, contentBase64: btoa(bin) });
    }
    setMaterials((m) => [...m, ...next]);
  }

  return (
    <div className="door">
      <div className="brand">CourseMapper · built on CurriculumOS</div>
      <h1>What course are we building?</h1>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void addFiles(e.dataTransfer.files);
        }}
      >
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          style={dragging ? { outline: '2px dashed var(--indigo-500)' } : undefined}
          placeholder="Intro to Microeconomics, 14 weeks, two midterms, weekly problem sets, we read Freakonomics ch. 1–4 in week 3… (or drop your old syllabus here)"
        />
      </div>

      <div className="heard" style={{ marginTop: 4 }}>
        <label className="chip" style={{ cursor: 'pointer' }}>
          ⎘ drop files or browse
          <input
            type="file"
            multiple
            accept=".txt,.md,.docx,.pdf"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files && void addFiles(e.target.files)}
          />
        </label>
        {fileStates.map((f) => (
          <span className={`chip ${f.extracted ? 'reading' : ''}`} key={f.name} title={f.extracted ? 'text extracted' : 'could not extract'}>
            {f.extracted ? '📄' : '⚠️'} {f.name}
          </span>
        ))}
      </div>
      {notes.map((note) => (
        <div className="notice" key={note} style={{ marginBottom: 8 }}>
          {note}
        </div>
      ))}

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
        <button className="cta" disabled={brief.trim().length < 12 && materials.length === 0} onClick={() => onBuild(brief, voice, materials)}>
          Build my course
        </button>
        <label className="muted" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} /> voice pass
        </label>
      </div>
    </div>
  );
}
