import { packageUrl } from '../api.ts';

/** The Seal — the grade, always current (a stale seal is unrepresentable;
 *  every edit re-grades). Two numbers, deliberately: structural quality AND
 *  teachability. One click from the package download (founding §6). */
export function Seal({ courseId, grade }: { courseId: string; grade: any }) {
  if (!grade) return null;
  const s = grade.structural;
  const t = grade.teachability;
  return (
    <div className="seal">
      <div className={`meter ${s.score >= 90 ? 'good' : ''}`}>
        <span className="sub">quality</span>
        <span className="val">
          {s.score} · {s.letter}
        </span>
      </div>
      <div className={`meter ${t.score10 >= 7 ? 'good' : ''}`}>
        <span className="sub">teachable</span>
        <span className="val">{t.score10}/10</span>
      </div>
      <div className="muted">
        {s.findings.length} finding{s.findings.length === 1 ? '' : 's'} · sameness {t.dimensions.sameness} · specificity{' '}
        {t.dimensions.specificity} · arc {t.dimensions.arc}
      </div>
      <a className="cta grow" href={packageUrl(courseId)} download>
        Download ▾
      </a>
    </div>
  );
}
