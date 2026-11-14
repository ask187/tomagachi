// Core data model for HabitPet (spec §19.3).
// Everything the game shows is *derived* from these records by the deterministic
// rules engine in `engine.ts` — AI/insights only ever recommend.

export type HabitCategory =
  | 'steps'
  | 'exercise'
  | 'hydration'
  | 'sleep'
  | 'nutrition'
  | 'mindfulness'
  | 'reading'
  | 'study'
  | 'custom';

export type Verification = 'sensor' | 'timer' | 'manual' | 'photo';
export type Slot = 'morning' | 'afternoon' | 'evening' | 'any';

/** A goal target. Edits create a new version so history is never rewritten (spec §5). */
export interface GoalVersion {
  fromDay: number;
  target: number;
  slot: Slot;
}

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  icon: string;
  unit: string; // 'steps', 'min', 'ml', 'h', 'done'
  weight: number; // relative priority
  /** weekdays (0=Sun..6=Sat) this habit is scheduled */
  schedule: number[];
  verification: Verification;
  versions: GoalVersion[];
  /** per-weekday slot overrides (e.g. evening workouts on Mon/Wed) */
  slotByDay?: Partial<Record<number, Slot>>;
  /** quick-add increment used by the Log button */
  step: number;
}

export type EntrySource = 'manual' | 'timer' | 'sensor' | 'photo' | 'demo' | 'simulated-sensor';

export interface Entry {
  /** null = unknown (sync failure / no data) — never silently treated as 0 */
  value: number | null;
  source: EntrySource;
  slot?: Slot;
  evidence?: boolean;
}

export type DayStatus = 'active' | 'rest' | 'paused' | 'inactive';

export interface MissionRecord {
  missionId: string;
  credit: number; // minutes of unlock credit
  source: EntrySource;
}

export interface DayLog {
  day: number; // 0-based index from the journey start
  entries: Record<string, Entry>;
  /** explicit planned rest day (excluded from scoring) */
  rest?: boolean;
  /** illness / travel / injury pause */
  paused?: boolean;
  missions: MissionRecord[];
  creditsSpent: number;
  overrides: number;
  welcomeBackDone?: boolean;
}

export type Accountability = 'gentle' | 'balanced' | 'strict';

export interface ShieldSettings {
  enabled: boolean;
  apps: string[]; // user-selected entertainment app ids
}

export type PetColor = 'violet' | 'mint' | 'peach' | 'sky';

export interface Profile {
  petName: string;
  petColor: PetColor;
  accountability: Accountability;
  shield: ShieldSettings;
  /** weekday of day 0 */
  startWeekday: number;
  restDays: number[]; // weekdays that are planned rest
}

export type Condition = 'thriving' | 'stable' | 'struggling' | 'neglected' | 'recovery';
export type ShieldState = 'off' | 'normal' | 'warning' | 'active' | 'unlocked';
export type Branch = 'none' | 'athlete' | 'sage' | 'aqua';

export interface HabitResult {
  habitId: string;
  eligible: boolean;
  scheduled: boolean;
  unknown: boolean;
  completion: number; // 0..1
  value: number | null;
  target: number;
  slot: Slot;
}

/** Fully derived game state at the end of a given day. */
export interface Snapshot {
  day: number;
  weekday: number;
  status: DayStatus;
  score: number | null; // null = nothing eligible (rest / pause / all unknown)
  qualifying: boolean;
  missed: boolean;
  habits: HabitResult[];
  condition: number; // 0..100 temporary
  conditionState: Condition;
  streak: number;
  bestStreak: number;
  xp: number; // permanent
  xpGained: number;
  qualifyingDays: number; // permanent count
  stage: number; // 1..4 permanent
  branch: Branch;
  shield: ShieldState;
  recentMisses: number;
  credits: number; // banked entertainment minutes
  creditsEarned: number;
  unlocked: string[]; // cosmetic ids (permanent)
  welcomeBack: boolean; // a welcome-back quest is offered today
  missionsDone: number;
  totalMissions: number;
  events: string[]; // human-readable rule explanations for the day
}
