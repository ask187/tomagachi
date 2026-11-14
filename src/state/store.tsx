import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { emptyDay, simulate } from '../engine/engine';
import { SCENARIOS } from '../engine/scenarios';
import type { Suggestion } from '../engine/insights';
import type { EmergencyRequest } from '../engine/emergency';
import type { DayLog, Entry, EntrySource, Habit, Profile, Snapshot } from '../engine/types';

export interface Equipped {
  head?: string;
  face?: string;
  neck?: string;
  room: string[];
}

export interface Journey {
  profile: Profile;
  habits: Habit[];
  days: DayLog[];
  equipped: Equipped;
}

export interface MemoryItem {
  id: string;
  at: string;
  text: string;
}

export interface Prefs {
  reducedMotion: boolean;
  captions: boolean;
  demoSpeed: boolean; // accelerate timers (1 minute ≈ 3 seconds)
}

export type Mode = 'live' | 'demo';

export interface AppState {
  version: 2;
  onboarded: boolean;
  mode: Mode;
  live: Journey | null;
  demo: Journey & { scenarioId: string };
  viewDay: number;
  prefs: Prefs;
  memory: MemoryItem[]; // AI memory: user-approved goals & preferences (reviewable, deletable)
  dismissed: string[];
  /** emergency-access requests to the recovery contact (kept for review/history) */
  emergency: EmergencyRequest[];
}

const KEY = 'habitpet:v1';

function scenarioJourney(id: string): Journey & { scenarioId: string } {
  const make = SCENARIOS.find((s) => s().id === id) ?? SCENARIOS[0];
  const sc = make();
  return {
    scenarioId: sc.id,
    profile: sc.profile,
    habits: sc.habits,
    days: sc.days,
    equipped: { head: 'crown', face: 'shades', neck: 'scarf', room: ['plant', 'lamp', 'poster', 'rug'] },
  };
}

function initial(): AppState {
  return {
    version: 2,
    onboarded: false,
    mode: 'demo',
    live: null,
    demo: scenarioJourney('hero'),
    viewDay: 0,
    prefs: {
      reducedMotion: typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
      captions: true,
      demoSpeed: true,
    },
    memory: [],
    dismissed: [],
    emergency: [],
  };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as AppState;
      if (s.version === 2) return { ...initial(), ...s };
      if ((s.version as number) === 1) {
        // v1 used fictional app names; map them to real ones and refresh the demo journey
        const map: Record<string, string> = { shorts: 'youtube', feed: 'instagram', stream: 'netflix', games: 'candycrush', chat: 'x', news: 'reddit' };
        const live = s.live && { ...s.live, profile: { ...s.live.profile, shield: { ...s.live.profile.shield, apps: s.live.profile.shield.apps.map((a) => map[a] ?? a) } } };
        return { ...initial(), ...s, version: 2, live, demo: scenarioJourney(s.demo?.scenarioId ?? 'hero'), emergency: [] };
      }
    }
  } catch {
    /* storage unavailable — fall back to a fresh state */
  }
  return initial();
}

export type Action =
  | { type: 'finishOnboarding'; profile: Profile; habits: Habit[] }
  | { type: 'setMode'; mode: Mode }
  | { type: 'loadScenario'; id: string }
  | { type: 'setViewDay'; day: number }
  | { type: 'log'; habitId: string; add?: number; set?: number | null; source: EntrySource; evidence?: boolean }
  | { type: 'mission'; missionId: string; credit: number; source: EntrySource; habitBonus?: { category: string; amount: number } }
  | { type: 'spendCredits'; minutes: number }
  | { type: 'override' }
  | { type: 'toggleRest' }
  | { type: 'togglePause' }
  | { type: 'welcomeBack' }
  | { type: 'advanceDay' }
  | { type: 'upsertHabit'; habit: Habit }
  | { type: 'removeHabit'; id: string }
  | { type: 'profile'; patch: Partial<Profile> }
  | { type: 'equip'; slot: 'head' | 'face' | 'neck' | 'room'; id: string }
  | { type: 'applySuggestion'; suggestion: Suggestion; insightId: string; text: string }
  | { type: 'dismissInsight'; id: string }
  | { type: 'forget'; id: string }
  | { type: 'prefs'; patch: Partial<Prefs> }
  | { type: 'emergencyCreate'; request: EmergencyRequest }
  | { type: 'emergencyUpdate'; id: string; patch: Partial<EmergencyRequest> }
  | { type: 'reset' };

function curDay(s: AppState): number {
  const j = s.mode === 'live' ? s.live : s.demo;
  if (!j) return 0;
  return s.mode === 'live' ? j.days.length - 1 : Math.min(s.viewDay, j.days.length - 1);
}

function updateJourney(s: AppState, fn: (j: Journey, day: number) => Journey): AppState {
  const day = curDay(s);
  if (s.mode === 'live') return s.live ? { ...s, live: fn(s.live, day) } : s;
  return { ...s, demo: { ...s.demo, ...fn(s.demo, day) } };
}

function updateDay(s: AppState, fn: (d: DayLog, j: Journey) => DayLog): AppState {
  return updateJourney(s, (j, day) => ({ ...j, days: j.days.map((d) => (d.day === day ? fn(d, j) : d)) }));
}

const nowStamp = () => new Date().toLocaleString();

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'finishOnboarding':
      return {
        ...s,
        onboarded: true,
        mode: 'live',
        live: { profile: a.profile, habits: a.habits, days: [emptyDay(0)], equipped: { head: 'bow', room: [] } },
        memory: [
          { id: 'onboard', at: nowStamp(), text: `Goals set: ${a.habits.map((h) => `${h.name} ${h.versions[0].target} ${h.unit}`).join(', ')}` },
          { id: 'mode', at: nowStamp(), text: `Accountability: ${a.profile.accountability}; shield ${a.profile.shield.enabled ? 'on' : 'off'}` },
        ],
      };
    case 'setMode':
      if (a.mode === 'live' && !s.live) return s;
      return { ...s, mode: a.mode };
    case 'loadScenario':
      return { ...s, mode: 'demo', demo: scenarioJourney(a.id), viewDay: 0 };
    case 'setViewDay':
      return { ...s, viewDay: Math.max(0, Math.min(a.day, s.demo.days.length - 1)) };
    case 'log':
      return updateDay(s, (d, j) => {
        const h = j.habits.find((x) => x.id === a.habitId);
        if (!h) return d;
        const prev: Entry | undefined = d.entries[a.habitId];
        let value: number | null;
        if (a.set !== undefined) value = a.set;
        else value = Math.max(0, (prev?.value ?? 0) + (a.add ?? 0));
        return {
          ...d,
          entries: { ...d.entries, [a.habitId]: { value, source: a.source, evidence: a.evidence || prev?.evidence } },
        };
      });
    case 'mission':
      return updateDay(s, (d, j) => {
        const entries = { ...d.entries };
        if (a.habitBonus) {
          const h = j.habits.find((x) => x.category === a.habitBonus!.category);
          if (h) entries[h.id] = { value: (entries[h.id]?.value ?? 0) + a.habitBonus.amount, source: a.source };
        }
        return { ...d, entries, missions: [...d.missions, { missionId: a.missionId, credit: a.credit, source: a.source }] };
      });
    case 'spendCredits':
      return updateDay(s, (d) => ({ ...d, creditsSpent: d.creditsSpent + a.minutes }));
    case 'override':
      return updateDay(s, (d) => ({ ...d, overrides: d.overrides + 1 }));
    case 'toggleRest':
      return updateDay(s, (d) => ({ ...d, rest: !d.rest, paused: false }));
    case 'togglePause':
      return updateDay(s, (d) => ({ ...d, paused: !d.paused, rest: false }));
    case 'welcomeBack':
      return updateDay(s, (d) => ({ ...d, welcomeBackDone: true }));
    case 'advanceDay':
      if (s.mode !== 'live' || !s.live) return s;
      return { ...s, live: { ...s.live, days: [...s.live.days, emptyDay(s.live.days.length)] } };
    case 'upsertHabit':
      return updateJourney(s, (j) => {
        const exists = j.habits.some((h) => h.id === a.habit.id);
        return { ...j, habits: exists ? j.habits.map((h) => (h.id === a.habit.id ? a.habit : h)) : [...j.habits, a.habit] };
      });
    case 'removeHabit':
      return updateJourney(s, (j) => ({ ...j, habits: j.habits.filter((h) => h.id !== a.id) }));
    case 'profile':
      return updateJourney(s, (j) => ({ ...j, profile: { ...j.profile, ...a.patch } }));
    case 'equip':
      return updateJourney(s, (j) => {
        const e = { ...j.equipped, room: [...j.equipped.room] };
        if (a.slot === 'room') e.room = e.room.includes(a.id) ? e.room.filter((x) => x !== a.id) : [...e.room, a.id];
        else e[a.slot] = e[a.slot] === a.id ? undefined : a.id;
        return { ...j, equipped: e };
      });
    case 'applySuggestion': {
      const next = updateJourney(s, (j, day) => {
        const sg = a.suggestion;
        if (sg.type === 'restDay') return { ...j, profile: { ...j.profile, restDays: [...new Set([...j.profile.restDays, sg.weekday])] } };
        const fromDay = day + 1; // versioned: history keeps the old goal
        return {
          ...j,
          habits: j.habits.map((h) => {
            if (h.id !== sg.habitId) return h;
            const last = h.versions[h.versions.length - 1];
            if (sg.type === 'retarget') return { ...h, versions: [...h.versions, { ...last, fromDay, target: sg.target }] };
            const slotByDay = { ...(h.slotByDay ?? {}) };
            sg.weekdays.forEach((w) => (slotByDay[w] = sg.toSlot));
            return { ...h, slotByDay, versions: [...h.versions, { ...last, fromDay, slot: sg.toSlot }] };
          }),
        };
      });
      return { ...next, dismissed: [...next.dismissed, a.insightId], memory: [{ id: `${a.insightId}-${Date.now()}`, at: nowStamp(), text: `Approved: ${a.text}` }, ...next.memory] };
    }
    case 'dismissInsight':
      return { ...s, dismissed: [...s.dismissed, a.id] };
    case 'forget':
      return { ...s, memory: s.memory.filter((m) => m.id !== a.id) };
    case 'prefs':
      return { ...s, prefs: { ...s.prefs, ...a.patch } };
    case 'emergencyCreate':
      return { ...s, emergency: [a.request, ...s.emergency].slice(0, 50) };
    case 'emergencyUpdate':
      return { ...s, emergency: s.emergency.map((r) => (r.id === a.id ? { ...r, ...a.patch } : r)) };
    case 'reset':
      try {
        localStorage.removeItem(KEY);
      } catch {
        /* ignore */
      }
      return initial();
  }
}

interface Ctx {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  journey: Journey;
  snaps: Snapshot[];
  snap: Snapshot;
  day: number;
  isDemo: boolean;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore quota / privacy mode */
    }
  }, [state]);

  const isDemo = state.mode === 'demo' || !state.live;
  const journey: Journey = isDemo ? state.demo : state.live!;
  const day = curDay({ ...state, mode: isDemo ? 'demo' : 'live' });
  const snaps = useMemo(
    () => simulate({ ...journey, openDay: isDemo ? undefined : journey.days.length - 1 }),
    [journey, isDemo],
  );
  const snap = snaps[Math.min(day, snaps.length - 1)];
  const value = useMemo(() => ({ state, dispatch, journey, snaps, snap, day, isDemo }), [state, journey, snaps, snap, day, isDemo]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore outside provider');
  return c;
}

export function useHabitIndex() {
  const { journey } = useStore();
  return useCallback((id: string) => journey.habits.findIndex((h) => h.id === id), [journey.habits]);
}
