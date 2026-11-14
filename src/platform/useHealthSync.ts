import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import { getHealth, type HealthToday } from './native';
import type { HabitCategory } from '../engine/types';

// Pull today's Apple Health numbers into the LIVE pet's habits (iPhone app only).
// Health values never lower what the user logged by hand — we keep the larger.

const MAP: { cat: HabitCategory; key: keyof HealthToday }[] = [
  { cat: 'steps', key: 'steps' },
  { cat: 'exercise', key: 'exerciseMin' },
  { cat: 'hydration', key: 'waterMl' },
  { cat: 'sleep', key: 'sleepHours' },
  { cat: 'mindfulness', key: 'mindfulMin' },
];

export function useSyncHealthNow() {
  const { state, dispatch } = useStore();
  const live = state.live;
  return useCallback(async (): Promise<number | null> => {
    const health = getHealth();
    if (!health || !live) return null;
    const today = await health.today();
    if (!today.available) return null;
    const day = live.days[live.days.length - 1];
    let updated = 0;
    for (const { cat, key } of MAP) {
      const habit = live.habits.find((h) => h.category === cat);
      const v = Number(today[key] ?? 0);
      if (!habit || !(v > 0)) continue;
      const cur = day.entries[habit.id]?.value ?? 0;
      if (v > cur) {
        dispatch({ type: 'log', habitId: habit.id, set: Math.round(v * 10) / 10, source: 'health' });
        updated += 1;
      }
    }
    return updated;
  }, [live, dispatch]);
}

/** Auto-sync on open, when the app comes back to the foreground, and every 10 min. */
export function useHealthSync(toast: (m: string) => void) {
  const { state } = useStore();
  const sync = useSyncHealthNow();
  const syncRef = useRef(sync);
  syncRef.current = sync;
  const enabled = !!getHealth() && state.mode === 'live' && !!state.live;

  useEffect(() => {
    if (!enabled) return;
    let first = true;
    const run = () =>
      syncRef
        .current()
        .then((n) => {
          if (n && first) toast(`❤️ Synced ${n} habit${n > 1 ? 's' : ''} from Apple Health`);
          first = false;
        })
        .catch(() => undefined);
    run();
    const onVis = () => document.visibilityState === 'visible' && run();
    document.addEventListener('visibilitychange', onVis);
    const id = setInterval(run, 10 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      clearInterval(id);
    };
  }, [enabled, toast]);
}
