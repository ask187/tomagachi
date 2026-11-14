import { useState } from 'react';
import { WEEKDAYS } from '../engine/config';
import type { Habit, Slot } from '../engine/types';
import { Segmented } from './ui';

const ICONS = ['👟', '🏋️', '💧', '😴', '🧘', '📚', '🥗', '🎯', '🎸', '🪥', '🌱', '✍️', '🧹', '💊'];

/** Edit targets, frequency, weights and time slots. Target edits are versioned from `fromDay`. */
export default function HabitEditor({ habit, fromDay, onSave, onCancel, onDelete }: { habit: Habit; fromDay: number; onSave: (h: Habit) => void; onCancel: () => void; onDelete?: () => void }) {
  const v = habit.versions[habit.versions.length - 1];
  const [h, setH] = useState<Habit>(habit);
  const [target, setTarget] = useState(v.target);
  const [slot, setSlot] = useState<Slot>(v.slot);

  const save = () => {
    const last = h.versions[h.versions.length - 1];
    let versions = h.versions;
    if (last.target !== target || last.slot !== slot) {
      versions = last.fromDay === fromDay ? [...h.versions.slice(0, -1), { fromDay, target, slot }] : [...h.versions, { fromDay, target, slot }];
    }
    onSave({ ...h, versions });
  };

  return (
    <div className="form">
      <label>
        Name
        <input value={h.name} onChange={(e) => setH({ ...h, name: e.target.value })} />
      </label>
      <div className="icon-pick">
        {ICONS.map((i) => (
          <button key={i} className={h.icon === i ? 'on' : ''} onClick={() => setH({ ...h, icon: i })}>
            {i}
          </button>
        ))}
      </div>
      <div className="grid2">
        <label>
          Target
          <input type="number" min={0} step={h.step} value={target} onChange={(e) => setTarget(Number(e.target.value))} />
        </label>
        <label>
          Unit
          <input value={h.unit} onChange={(e) => setH({ ...h, unit: e.target.value })} />
        </label>
        <label>
          Quick-log step
          <input type="number" min={0} value={h.step} onChange={(e) => setH({ ...h, step: Number(e.target.value) })} />
        </label>
        <label>
          Priority weight
          <input type="range" min={1} max={5} value={h.weight} onChange={(e) => setH({ ...h, weight: Number(e.target.value) })} />
          <small className="muted">{h.weight} / 5</small>
        </label>
      </div>
      <div>
        <div className="label">Schedule</div>
        <div className="chips">
          {WEEKDAYS.map((d, i) => (
            <button
              key={d}
              className={`chip ${h.schedule.includes(i) ? 'on' : ''}`}
              onClick={() => setH({ ...h, schedule: h.schedule.includes(i) ? h.schedule.filter((x) => x !== i) : [...h.schedule, i].sort() })}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="label">Preferred time</div>
        <Segmented<Slot>
          value={slot}
          onChange={setSlot}
          options={[
            { value: 'any', label: 'Any' },
            { value: 'morning', label: 'Morning' },
            { value: 'afternoon', label: 'Afternoon' },
            { value: 'evening', label: 'Evening' },
          ]}
        />
      </div>
      <div>
        <div className="label">Verification</div>
        <Segmented
          value={h.verification}
          onChange={(verification) => setH({ ...h, verification })}
          options={[
            { value: 'manual', label: 'Check-in' },
            { value: 'timer', label: 'Timer' },
            { value: 'sensor', label: 'Sensor' },
            { value: 'photo', label: 'Photo (opt.)' },
          ]}
        />
      </div>
      <p className="tiny muted">Target changes apply from day {fromDay + 1} onward — past days keep the goal they were scored against.</p>
      <div className="row gap">
        {onDelete && (
          <button className="btn btn--ghost btn--danger" onClick={onDelete}>
            Delete
          </button>
        )}
        <span className="grow" />
        <button className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn" onClick={save} disabled={!h.name.trim() || h.schedule.length === 0 || target <= 0}>
          Save
        </button>
      </div>
    </div>
  );
}
