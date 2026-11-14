import { useState } from 'react';
import { useStore } from '../state/store';
import { useUI } from '../App';
import { Badge } from './ui';
import { fmt } from '../engine/insights';
import type { Habit, HabitResult } from '../engine/types';
import TimerModal from './TimerModal';

export const VERIFY_LABEL: Record<string, { label: string; tone: 'real' | 'neutral' | 'demo' | 'sim' | 'warn' }> = {
  sensor: { label: 'Sensor', tone: 'real' },
  'simulated-sensor': { label: 'Simulated sensor', tone: 'sim' },
  timer: { label: 'Timer-verified', tone: 'real' },
  manual: { label: 'Self-reported', tone: 'neutral' },
  photo: { label: 'Photo check-in', tone: 'real' },
  demo: { label: 'Demo data', tone: 'demo' },
};

export default function HabitQuickRow({ habit, result, detailed }: { habit: Habit; result: HabitResult; detailed?: boolean }) {
  const { journey, dispatch, isDemo, day } = useStore();
  const ui = useUI();
  const [timer, setTimer] = useState(false);
  const entry = journey.days[day]?.entries[habit.id];
  const done = result.completion >= 1;
  const src = isDemo && !entry ? 'demo' : entry?.source;

  const log = (add: number) => {
    dispatch({ type: 'log', habitId: habit.id, add, source: isDemo ? 'demo' : 'manual' });
    if (!done && (result.value ?? 0) + add >= result.target) ui.toast(`${habit.icon} ${habit.name} complete!`);
  };

  return (
    <div className={`habit ${done ? 'habit--done' : ''} ${result.unknown ? 'habit--unknown' : ''}`}>
      <div className="habit__icon" data-cat={habit.category}>
        {habit.icon}
      </div>
      <div className="habit__body">
        <div className="habit__top">
          <b>{habit.name}</b>
          <span className="small muted">
            {result.unknown ? 'unknown' : `${fmt(result.value ?? 0)} / ${fmt(result.target)} ${habit.unit === 'done' ? '' : habit.unit}`}
          </span>
        </div>
        <div className="meter__track">
          <div className="meter__fill" style={{ width: `${result.completion * 100}%`, background: done ? 'var(--good)' : undefined }} />
        </div>
        <div className="habit__tags">
          {result.unknown ? (
            <Badge tone="warn" title="Missing data is excluded from scoring, never treated as a miss">
              Sync failed · excluded
            </Badge>
          ) : (
            src && <Badge tone={VERIFY_LABEL[src]?.tone ?? 'neutral'}>{VERIFY_LABEL[src]?.label ?? src}</Badge>
          )}
          {entry?.evidence && <Badge tone="real">📷 evidence</Badge>}
          {detailed && result.slot !== 'any' && <Badge>{result.slot}</Badge>}
          {detailed && <Badge>weight {habit.weight}</Badge>}
        </div>
      </div>
      <div className="habit__actions">
        {habit.verification === 'timer' && !done && (
          <button className="btn btn--sm btn--ghost" onClick={() => setTimer(true)} aria-label={`Start ${habit.name} timer`}>
            ▶
          </button>
        )}
        <button className="btn btn--sm" onClick={() => log(habit.step)} aria-label={`Log ${habit.name}`}>
          +{habit.unit === 'done' ? '✓' : fmt(habit.step)}
        </button>
      </div>
      {timer && (
        <TimerModal
          title={`${habit.icon} ${habit.name}`}
          minutes={Math.max(1, result.target - (result.value ?? 0))}
          onClose={() => setTimer(false)}
          onDone={(min) => {
            dispatch({ type: 'log', habitId: habit.id, add: min, source: isDemo ? 'demo' : 'timer' });
            ui.toast(`⏱ ${min} min verified by timer`);
            setTimer(false);
          }}
        />
      )}
    </div>
  );
}
