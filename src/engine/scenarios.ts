import { HABIT_TEMPLATES, habitFromTemplate } from './config';
import { emptyDay } from './engine';
import type { DayLog, Habit, Profile } from './types';

// ---------------------------------------------------------------------------
// Demo Time Machine scenarios (spec §14). Every entry is tagged source 'demo'
// so the UI can label it as injected sample data.
// ---------------------------------------------------------------------------

export interface Scenario {
  id: string;
  name: string;
  blurb: string;
  profile: Profile;
  habits: Habit[];
  days: DayLog[];
  milestones: { day: number; label: string; scene?: string }[];
}

const tpl = (c: string) => HABIT_TEMPLATES.find((t) => t.category === c)!;

function demoHabits(): Habit[] {
  return [
    habitFromTemplate(tpl('steps'), { id: 'walk', versions: [{ fromDay: 0, target: 8000, slot: 'any' }] }),
    habitFromTemplate(tpl('hydration'), { id: 'water' }),
    habitFromTemplate(tpl('exercise'), {
      id: 'workout',
      schedule: [1, 3, 5, 6],
      versions: [{ fromDay: 0, target: 30, slot: 'evening' }],
      slotByDay: { 6: 'morning' },
    }),
    habitFromTemplate(tpl('sleep'), { id: 'sleep' }),
  ];
}

const baseProfile = (over: Partial<Profile> = {}): Profile => ({
  petName: 'Mochi',
  petColor: 'violet',
  accountability: 'balanced',
  shield: { enabled: true, apps: ['tiktok', 'instagram', 'youtube'] },
  // sample recovery contact so the emergency-access flow works in the demo
  recovery: { name: 'Sam', reach: '+1 555 0142', relation: 'Sister', status: 'active', inviteCode: 'DEMO42', key: 'DEMOPAIRINGKEY01', since: 0 },
  startWeekday: 1, // day 0 = Monday
  restDays: [0], // Sundays are planned rest days
  ...over,
});

type Row = [walk: number | null, water: number, workout: number, sleep: number];

function build(rows: (Row | 'rest' | 'pause' | 'inactive')[], extras: Record<number, Partial<DayLog>> = {}): DayLog[] {
  return rows.map((r, day) => {
    const d = emptyDay(day);
    if (r === 'rest') d.rest = true;
    else if (r === 'pause') d.paused = true;
    else if (r !== 'inactive') {
      const [walk, water, workout, sleep] = r;
      d.entries.walk = { value: walk, source: 'demo' }; // null = step sync failed
      d.entries.water = { value: water, source: 'demo' };
      d.entries.workout = { value: workout, source: 'demo' };
      d.entries.sleep = { value: sleep, source: 'demo' };
    }
    return { ...d, ...extras[day] };
  });
}

const mission = (missionId: string, credit: number) => ({ missionId, credit, source: 'demo' as const });

// Day 0 = Monday. Workouts: Mon/Wed/Fri evenings, Saturday mornings.
export function heroScenario(): Scenario {
  const days = build(
    [
      // 1–3: strong start
      [9200, 2250, 22, 8], //  d1 Mon (evening workout cut short)
      [8600, 2000, 0, 7.5], // d2 Tue
      [10100, 2300, 18, 7.5], // d3 Wed
      // 4–9: slipping
      [3800, 750, 0, 5.5], //  d4 Thu
      [5200, 1250, 10, 6], //  d5 Fri
      [2000, 500, 35, 5], //   d6 Sat (morning workout done!)
      'rest', //               d7 Sun
      [4000, 1000, 10, 6], //  d8 Mon
      [3600, 750, 0, 6], //    d9 Tue
      // 10–14: neglect → shield
      [1800, 500, 0, 5], //    d10 Wed
      [1500, 250, 0, 5], //    d11 Thu
      [2500, 500, 0, 5], //    d12 Fri
      [2100, 500, 0, 5], //    d13 Sat
      'rest', //               d14 Sun
      // 15–22: recovery missions
      [3500, 1250, 5, 6], //   d15 Mon
      [5200, 1500, 0, 6.5], // d16 Tue
      [null, 1750, 15, 7], //  d17 Wed — step sync failed (unknown, not neglect)
      [7200, 2000, 0, 7], //   d18 Thu
      [8100, 2000, 20, 7.5], // d19 Fri
      [8400, 2250, 40, 8], //  d20 Sat
      'rest', //               d21 Sun
      [9000, 2000, 30, 7.5], // d22 Mon
      // 23–30: consistency → evolution
      [9800, 2250, 0, 8], //   d23 Tue
      [8800, 2000, 30, 7.5], // d24 Wed
      [10400, 2500, 0, 8], //  d25 Thu
      [9100, 2000, 30, 7.5], // d26 Fri
      [11000, 2250, 45, 8], // d27 Sat
      'rest', //               d28 Sun
      [9500, 2000, 30, 8], //  d29 Mon
      [10200, 2500, 0, 8], //  d30 Tue
    ],
    {
      14: { missions: [mission('breathe', 10)] },
      15: { missions: [mission('walk', 15)] },
      16: { missions: [mission('drink', 5)] },
      17: { missions: [mission('stretch', 10)] },
    },
  );
  return {
    id: 'hero',
    name: '30-day hero journey',
    blurb: 'Strong start → neglect → Distraction Shield → recovery missions → Legendary evolution.',
    profile: baseProfile(),
    habits: demoHabits(),
    days,
    milestones: [
      { day: 0, label: 'Day 1 · Fresh start', scene: 'Meet your virtual self' },
      { day: 2, label: 'Day 3 · First evolution', scene: 'Meet your virtual self' },
      { day: 8, label: 'Day 9 · Slipping', scene: 'Neglect changes everything' },
      { day: 10, label: 'Day 11 · Shield warning', scene: 'Neglect changes everything' },
      { day: 11, label: 'Day 12 · Shield active', scene: 'Distraction Shield activates' },
      { day: 12, label: 'Day 13 · Rock bottom', scene: 'Distraction Shield activates' },
      { day: 14, label: 'Day 15 · Recovery', scene: 'Earn back access' },
      { day: 16, label: 'Day 17 · Sync failure', scene: 'Earn back access' },
      { day: 22, label: 'Day 23 · Ascended', scene: 'Evolution reveal' },
      { day: 29, label: 'Day 30 · Legendary', scene: 'Evolution reveal' },
    ],
  };
}

export function comebackScenario(): Scenario {
  const days = build(
    [
      [9000, 2000, 30, 8],
      [8800, 2250, 0, 7.5],
      [9500, 2000, 35, 8],
      [8400, 2000, 0, 7.5],
      [9100, 2250, 30, 8],
      'inactive',
      'rest',
      'inactive',
      'inactive',
      'inactive',
      [4000, 1000, 10, 7],
      [7000, 1750, 0, 7.5],
      [8600, 2000, 30, 8],
    ],
    {},
  );
  days[10].welcomeBackDone = true;
  return {
    id: 'comeback',
    name: 'Long break & welcome back',
    blurb: 'Five great days, a week away, then a welcome-back quest. Streak resets — evolution and cosmetics stay.',
    profile: baseProfile({ petName: 'Mochi', petColor: 'mint' }),
    habits: demoHabits(),
    days,
    milestones: [
      { day: 4, label: 'Day 5 · Streak of 5' },
      { day: 9, label: 'Day 10 · Away for a while' },
      { day: 10, label: 'Day 11 · Welcome back!' },
      { day: 12, label: 'Day 13 · Back on track' },
    ],
  };
}

export function careScenario(): Scenario {
  const days = build(
    [
      [9000, 2000, 30, 8],
      [8200, 2000, 0, 7.5],
      [8800, 2250, 30, 8],
      'pause',
      'pause',
      'pause',
      'rest',
      [null, 2000, 20, 8],
      [8100, 2000, 0, 7.5],
      [9000, 2250, 30, 8],
    ],
    {},
  );
  return {
    id: 'care',
    name: 'Sick days & sync failures',
    blurb: 'Illness pause and a failed step sync. Nothing is counted as neglect; the streak is protected.',
    profile: baseProfile({ petColor: 'peach' }),
    habits: demoHabits(),
    days,
    milestones: [
      { day: 2, label: 'Day 3 · Healthy routine' },
      { day: 4, label: 'Day 5 · Sick pause' },
      { day: 7, label: 'Day 8 · Steps unknown' },
      { day: 9, label: 'Day 10 · Streak intact' },
    ],
  };
}

export const SCENARIOS = [heroScenario, comebackScenario, careScenario];

// Presenter storyboard (spec §15): each scene jumps the Time Machine + screen.
export const STORYBOARD = [
  { scene: 1, title: 'Meet your virtual self', day: 2, screen: 'home', line: 'One lifelong companion. Your routines are its world. It is also extremely sarcastic.' },
  { scene: 2, title: 'Neglect visibly changes everything', day: 10, screen: 'home', line: 'Skip routines and Mochi gets tired, the room gets gloomy — temporary, never permanent.' },
  { scene: 3, title: 'Distraction Shield activates', day: 12, screen: 'shield', line: 'After repeated misses, the opt-in shield covers only the apps you chose. Essentials are never touched.' },
  { scene: 4, title: 'Earn back access', day: 12, screen: 'missions', line: 'Pick a recovery mission. Finish it, Mochi revives, XP rises, the app unlocks for a set time.' },
  { scene: 5, title: 'Evolution reveal', day: 29, screen: 'home', line: 'Consistency drives permanent evolution. Bad weeks can dim the room, but can never undo this.' },
  { scene: 6, title: 'The AI notices patterns', day: 29, screen: 'insights', line: 'Evening workouts keep slipping; mornings work. HabitPet suggests a change — you approve it.' },
] as const;
