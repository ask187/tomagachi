import type { Accountability, Habit, HabitCategory, Verification } from './types';

// All numbers are ILLUSTRATIVE prototype parameters (spec §2 "Still open" #4).
// They live in one place so they can be tuned after playtesting.

export const RULES = {
  qualifyingScore: 80, // spec §7.4 example
  missedScore: 50, // a scheduled day under this counts as a miss
  startCondition: 65,
  conditionDelta(score: number): number {
    if (score >= 90) return 12;
    if (score >= 80) return 9;
    if (score >= 60) return 3;
    if (score >= 50) return -10;
    if (score >= 30) return -11;
    return -12;
  },
  inactiveDelta: -14,
  restDelta: 3, // gentle recovery on rest days, never a penalty
  missionConditionBoost: 12,
  welcomeBackBoost: 15,
  // XP is permanent and never removed
  xpPerCompletion: 40, // × habit weight share
  xpQualifyingDay: 30,
  xpMission: 20,
  xpStreakBonusEvery: 5,
  xpStreakBonus: 50,
  // Credits (entertainment minutes) — capped so we never incentivise screen time
  creditBase: 10,
  creditStreakStep: 0.1,
  creditStreakMaxMultiplier: 2,
  creditCap: 90,
  // Demo-tuned evolution thresholds in qualifying days (spec proposes 5 / 15 / 30;
  // tuned down so a 30-day Time Machine journey reaches the Legendary reveal).
  stageThresholds: [0, 3, 8, 14] as const,
  inactiveDaysForWelcomeBack: 3,
};

export const STAGES = [
  { stage: 1, name: 'Newborn', blurb: 'Fresh out of the egg. Already judging you.' },
  { stage: 2, name: 'Companion', blurb: 'Grew ears and opinions.' },
  { stage: 3, name: 'Ascended', blurb: 'A major glow-up shaped by your strongest habits.' },
  { stage: 4, name: 'Legendary', blurb: 'Radiant, smug, and fully earned.' },
];

/** Shield escalation per accountability mode: misses counted over the last `window` eligible days. */
export const ACCOUNTABILITY: Record<
  Accountability,
  { label: string; desc: string; window: number; warnAt: number; activeAt: number; overrideCooldown: number }
> = {
  gentle: {
    label: 'Gentle',
    desc: 'Nudges only after a rough stretch. Override instantly.',
    window: 6,
    warnAt: 3,
    activeAt: 5,
    overrideCooldown: 0,
  },
  balanced: {
    label: 'Balanced',
    desc: 'Warning after 2 misses, shield after 3 of the last 5 days. 10s reflection before override.',
    window: 5,
    warnAt: 2,
    activeAt: 3,
    overrideCooldown: 10,
  },
  strict: {
    label: 'Strict',
    desc: 'Warning after 1 miss, shield after 2. 30s reflection before override (always available).',
    window: 4,
    warnAt: 1,
    activeAt: 2,
    overrideCooldown: 30,
  },
};

export interface HabitTemplate {
  category: HabitCategory;
  name: string;
  icon: string;
  unit: string;
  target: number;
  step: number;
  weight: number;
  verification: Verification;
  hint: string;
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  { category: 'steps', name: 'Walk', icon: '👟', unit: 'steps', target: 8000, step: 1000, weight: 3, verification: 'sensor', hint: 'Motion sensor or manual' },
  { category: 'exercise', name: 'Workout', icon: '🏋️', unit: 'min', target: 30, step: 10, weight: 3, verification: 'timer', hint: 'In-app timer' },
  { category: 'hydration', name: 'Hydrate', icon: '💧', unit: 'ml', target: 2000, step: 250, weight: 2, verification: 'manual', hint: 'Log each glass' },
  { category: 'sleep', name: 'Sleep', icon: '😴', unit: 'h', target: 7.5, step: 0.5, weight: 2, verification: 'manual', hint: 'Log hours slept' },
  { category: 'mindfulness', name: 'Meditate', icon: '🧘', unit: 'min', target: 10, step: 5, weight: 1, verification: 'timer', hint: 'Breathing timer' },
  { category: 'reading', name: 'Read', icon: '📚', unit: 'min', target: 20, step: 10, weight: 1, verification: 'timer', hint: 'Reading timer' },
  { category: 'nutrition', name: 'Eat a real lunch', icon: '🥗', unit: 'done', target: 1, step: 1, weight: 1, verification: 'photo', hint: 'Optional photo check-in' },
  { category: 'study', name: 'Focus session', icon: '🎯', unit: 'min', target: 25, step: 25, weight: 1, verification: 'timer', hint: 'Focus timer' },
];

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

let idCounter = 0;
export function habitFromTemplate(t: HabitTemplate, overrides: Partial<Habit> = {}): Habit {
  idCounter += 1;
  return {
    id: overrides.id ?? `${t.category}-${Date.now().toString(36)}-${idCounter}`,
    name: t.name,
    category: t.category,
    icon: t.icon,
    unit: t.unit,
    weight: t.weight,
    schedule: ALL_DAYS,
    verification: t.verification,
    versions: [{ fromDay: 0, target: t.target, slot: 'any' }],
    step: t.step,
    ...overrides,
  };
}

export type MissionKind = 'steps' | 'drink' | 'timer' | 'breath';

export interface Mission {
  id: string;
  name: string;
  icon: string;
  kind: MissionKind;
  requirement: string;
  amount: number; // steps, ml, or seconds
  credit: number;
  effort: 'tiny' | 'light' | 'moderate';
  nonExercise: boolean;
  category: HabitCategory;
}

// spec §9.2 — always several manageable alternatives, incl. non-exercise ones
export const MISSIONS: Mission[] = [
  { id: 'walk', name: 'Short walk', icon: '🚶', kind: 'steps', requirement: '500 steps', amount: 500, credit: 15, effort: 'light', nonExercise: false, category: 'steps' },
  { id: 'drink', name: 'Hydration break', icon: '🥤', kind: 'drink', requirement: 'Log a glass of water', amount: 250, credit: 5, effort: 'tiny', nonExercise: true, category: 'hydration' },
  { id: 'stretch', name: 'Guided stretch', icon: '🤸', kind: 'timer', requirement: '5 minutes', amount: 300, credit: 10, effort: 'light', nonExercise: false, category: 'exercise' },
  { id: 'breathe', name: 'Mindful minute ×5', icon: '🌬️', kind: 'breath', requirement: '5-minute breathing', amount: 300, credit: 10, effort: 'tiny', nonExercise: true, category: 'mindfulness' },
];

export interface Cosmetic {
  id: string;
  name: string;
  icon: string;
  slot: 'head' | 'face' | 'neck' | 'room';
  unlock: string;
}

export const COSMETICS: Cosmetic[] = [
  { id: 'bow', name: 'Starter Bow', icon: '🎀', slot: 'head', unlock: 'Complete onboarding' },
  { id: 'scarf', name: 'Cozy Scarf', icon: '🧣', slot: 'neck', unlock: 'Reach Companion stage' },
  { id: 'shades', name: 'Smug Shades', icon: '🕶️', slot: 'face', unlock: '3-day streak' },
  { id: 'headband', name: 'Sweatband', icon: '🎽', slot: 'head', unlock: 'Finish a recovery mission' },
  { id: 'headphones', name: 'Lo-fi Headphones', icon: '🎧', slot: 'head', unlock: 'Earn 600 XP' },
  { id: 'crown', name: 'Legendary Crown', icon: '👑', slot: 'head', unlock: 'Reach Legendary stage' },
  { id: 'plant', name: 'Monstera', icon: '🪴', slot: 'room', unlock: 'Reach Companion stage' },
  { id: 'lamp', name: 'Moon Lamp', icon: '🌙', slot: 'room', unlock: '5 qualifying days' },
  { id: 'poster', name: 'Motivational Poster', icon: '🖼️', slot: 'room', unlock: 'Reach Ascended stage' },
  { id: 'rug', name: 'Cloud Rug', icon: '☁️', slot: 'room', unlock: 'Earn 300 XP' },
];
