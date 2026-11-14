import { useRef, useState } from 'react';
import { useStore } from '../state/store';
import { useUI } from '../App';
import HabitQuickRow from '../components/HabitQuickRow';
import HabitEditor from '../components/HabitEditor';
import { Badge, Modal } from '../components/ui';
import { HABIT_TEMPLATES, habitFromTemplate } from '../engine/config';
import { usePedometer } from '../components/usePedometer';
import AppleHealthCard from '../components/AppleHealthCard';
import type { Habit } from '../engine/types';

export default function Routines() {
  const { journey, snap, dispatch, isDemo, day } = useStore();
  const ui = useUI();
  const [editing, setEditing] = useState<Habit | null>(null);
  const [adding, setAdding] = useState(false);
  const photoFor = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const ped = usePedometer();
  const walk = journey.habits.find((h) => h.category === 'steps');
  const log = journey.days[day];

  return (
    <div className="screen">
      <h2>My routines</h2>
      <p className="muted small">
        Day {day + 1} · score {snap.score ?? '—'} · eligible weight excludes rest, pauses and unknown data.
      </p>

      <div className="row gap wrap">
        <button className={`chip ${log?.rest ? 'on' : ''}`} onClick={() => dispatch({ type: 'toggleRest' })}>
          🛋️ {log?.rest ? 'Rest day (on)' : 'Mark rest day'}
        </button>
        <button className={`chip ${log?.paused ? 'on' : ''}`} onClick={() => dispatch({ type: 'togglePause' })}>
          🤒 {log?.paused ? 'Paused (on)' : 'Sick / travel pause'}
        </button>
      </div>

      <AppleHealthCard compact />

      {walk && (
        <div className="card sensor">
          <div className="row">
            <div>
              <b>👟 Step sensor</b> <Badge tone="real">Real · on-device</Badge>
              <p className="tiny muted">
                Counts steps from this phone's motion sensor. Raw motion data never leaves the device.
                {ped.perm === 'unsupported' && ' This browser has no motion sensor — use the simulated walk below.'}
                {ped.perm === 'denied' && ' Permission denied — you can still log manually.'}
                {ped.active && !ped.receiving && ' Waiting for motion data… (desktop browsers usually have none)'}
              </p>
            </div>
            <div className="sensor__count">{ped.steps}</div>
          </div>
          <div className="row gap wrap">
            {!ped.active ? (
              <button className="btn btn--sm" disabled={ped.perm === 'unsupported'} onClick={() => ped.start()}>
                Start counting
              </button>
            ) : (
              <button className="btn btn--sm btn--ghost" onClick={ped.stop}>
                Stop
              </button>
            )}
            <button
              className="btn btn--sm btn--ghost"
              disabled={ped.steps === 0}
              onClick={() => {
                dispatch({ type: 'log', habitId: walk.id, add: ped.steps, source: 'sensor' });
                ui.toast(`Synced ${ped.steps} real steps`);
                ped.reset();
              }}
            >
              Sync to {walk.name}
            </button>
            <button
              className="btn btn--sm btn--ghost"
              onClick={() => {
                dispatch({ type: 'log', habitId: walk.id, add: 1500, source: 'simulated-sensor' });
                ui.toast('Simulated sensor: +1,500 steps (labelled)');
              }}
            >
              Simulate +1.5k <Badge tone="sim">SIM</Badge>
            </button>
            <button
              className="btn btn--sm btn--ghost"
              onClick={() => {
                dispatch({ type: 'log', habitId: walk.id, set: null, source: 'sensor' });
                ui.toast('Sync failure simulated — steps marked unknown, not missed');
              }}
            >
              Simulate sync failure
            </button>
          </div>
        </div>
      )}

      <div className="list">
        {journey.habits.map((h, i) =>
          snap.habits[i] ? (
            <div key={h.id} className="habit-wrap">
              <HabitQuickRow habit={h} result={snap.habits[i]} detailed />
              <div className="habit-wrap__more">
                {!snap.habits[i].scheduled && <Badge>not scheduled today</Badge>}
                {h.verification === 'photo' && (
                  <button
                    className="link small"
                    onClick={() => {
                      photoFor.current = h.id;
                      fileRef.current?.click();
                    }}
                  >
                    📷 Add photo (optional)
                  </button>
                )}
                <button className="link small" onClick={() => setEditing(h)}>
                  ✏️ Edit goal
                </button>
              </div>
            </div>
          ) : null,
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const id = photoFor.current;
          if (id && e.target.files?.length) {
            const h = journey.habits.find((x) => x.id === id)!;
            dispatch({ type: 'log', habitId: id, add: h.step, source: 'photo', evidence: true });
            ui.toast('📷 Photo check-in recorded (image stays on your device, not stored)');
          }
          e.target.value = '';
        }}
      />

      <button className="btn btn--ghost btn--block" onClick={() => setAdding(true)}>
        + Add a habit
      </button>
      <p className="tiny muted center">Targets are examples, not prescriptions. Pick what fits your body and schedule.</p>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit routine">
        {editing && (
          <HabitEditor
            habit={editing}
            fromDay={day}
            onCancel={() => setEditing(null)}
            onSave={(h) => {
              dispatch({ type: 'upsertHabit', habit: h });
              setEditing(null);
              ui.toast('Saved — history keeps old targets');
            }}
            onDelete={
              journey.habits.length > 1
                ? () => {
                    dispatch({ type: 'removeHabit', id: editing.id });
                    setEditing(null);
                  }
                : undefined
            }
          />
        )}
      </Modal>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add a habit">
        <div className="tpl-grid">
          {HABIT_TEMPLATES.map((t) => (
            <button
              key={t.category}
              className="tpl"
              onClick={() => {
                setAdding(false);
                setEditing(habitFromTemplate(t, { versions: [{ fromDay: day, target: t.target, slot: 'any' }] }));
              }}
            >
              <span>{t.icon}</span>
              <b>{t.name}</b>
              <small>{t.hint}</small>
            </button>
          ))}
          <button
            className="tpl"
            onClick={() => {
              setAdding(false);
              setEditing(habitFromTemplate({ category: 'custom', name: 'My habit', icon: '🌱', unit: 'done', target: 1, step: 1, weight: 1, verification: 'manual', hint: '' }, { versions: [{ fromDay: day, target: 1, slot: 'any' }] }));
            }}
          >
            <span>🌱</span>
            <b>Custom</b>
            <small>Anything you like</small>
          </button>
        </div>
      </Modal>
      {isDemo && <p className="tiny muted center">You're editing the demo journey — changes replay the whole timeline instantly.</p>}
    </div>
  );
}
