import { useRef, useState } from 'react';
import { build, getCourse, patch, type EditResult, type MachineState } from './api.ts';
import { Door } from './components/Door.tsx';
import { Spine } from './components/Spine.tsx';
import { CourseDoc } from './components/CourseDoc.tsx';
import { TA } from './components/TA.tsx';
import { Seal } from './components/Seal.tsx';

type QueueItem = { id: number; summary: string; diff: EditResult['diff']; cost?: number };

export function App() {
  const [view, setView] = useState<'door' | 'desk'>('door');
  const [course, setCourse] = useState<any>(null);
  const [machine, setMachine] = useState<MachineState | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [cost, setCost] = useState(0);
  const [building, setBuilding] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [glowIds, setGlowIds] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const queueId = useRef(0);
  const weightTimer = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  async function onBuild(brief: string, voice: boolean) {
    setView('desk');
    setBuilding(true);
    setBlocked(null);
    setSeen(new Set());
    setCost(0);
    setCourse(null);
    const result = await build(brief, { voice }, (s, c) => {
      setMachine(s);
      setCost(c);
      setSeen((prev) => new Set(prev).add(s.state));
      if (s.state === 'blocked') setBlocked(s.reason ?? 'unknown');
    });
    setBuilding(false);
    if (result) {
      setCourse(result);
      if (result.receipts?.builds?.at(-1)?.terminal === 'blocked') setBlocked(result.receipts.builds.at(-1).blockedReason);
    }
  }

  function flashGlow(ids: string[]) {
    setGlowIds(new Set(ids));
    setTimeout(() => setGlowIds(new Set()), 4000); // the four-second sync moment
  }

  async function applyOps(ops: any[], note?: string) {
    if (!course) return;
    try {
      const res = await patch(course.id, ops, note ? 'ta' : 'instructor');
      const fresh = await getCourse(course.id);
      setCourse(fresh);
      const touchedIds = ops.map((o) => o.id).filter(Boolean);
      flashGlow(touchedIds);
      const summary =
        res.diff
          .slice(0, 3)
          .map((d) => d.summary)
          .join(' · ') || ops.map((o) => o.type).join(', ');
      setQueue((q) => [{ id: queueId.current++, summary, diff: res.diff, cost: res.cost.usd }, ...q].slice(0, 6));
    } catch (e: any) {
      setQueue((q) => [{ id: queueId.current++, summary: `blocked: ${e.code ?? e.message}`, diff: [] }, ...q].slice(0, 6));
    }
  }

  function onWeightEdit(id: string, weightPct: number) {
    // optimistic local update so the input stays responsive
    setCourse((c: any) => {
      const next = structuredClone(c);
      const a = next.graph.assessments.find((x: any) => x.id === id);
      if (a) a.weightPct = weightPct;
      return next;
    });
    clearTimeout(weightTimer.current[id]);
    weightTimer.current[id] = setTimeout(() => applyOps([{ type: 'assessment.set_weight', id, weightPct }]), 600);
  }

  if (view === 'door') return <Door onBuild={onBuild} />;

  return (
    <div className="desk">
      <Spine current={machine} cost={cost} seen={seen} />
      <div className="desk-main">
        <div className="course-pane">
          {blocked && (
            <div className="notice blocked" style={{ marginBottom: 16 }}>
              ⛔ Build blocked: {blocked}. The receipt preserves what was reached.
            </div>
          )}
          {!course && building && <p className="muted">Building… the Spine above narrates each stage.</p>}
          {course && <CourseDoc course={course} glowIds={glowIds} onWeightEdit={onWeightEdit} />}
        </div>
        <div className="ta-pane">{course && <TA courseId={course.id} queue={queue} onApply={applyOps} />}</div>
      </div>
      {course && <Seal courseId={course.id} grade={course.receipts?.quality} />}
    </div>
  );
}
