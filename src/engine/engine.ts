import { ACCOUNTABILITY, RULES } from './config';
import type {
  Branch,
  Condition,
  DayLog,
  DayStatus,
  Habit,
  HabitCategory,
  HabitResult,
  Profile,
  ShieldState,
  Slot,
  Snapshot,
} from './types';

// ---------------------------------------------------------------------------
// Deterministic rules engine (spec §10.5): scores, condition, streaks, XP,
// evolution and shield decisions are pure functions of the logged history.
// Replaying the same history always yields the same pet.
// ---------------------------------------------------------------------------

export const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export function versionFor(habit: Habit, day: number) {
  let v = habit.versions[0];
  for (const ver of habit.versions) if (ver.fromDay <= day) v = ver;
  return v;
}

export function targetFor(habit: Habit, day: number): number {
  return versionFor(habit, day).target;
}

export function slotFor(habit: Habit, day: number, weekday: number): Slot {
  return habit.slotByDay?.[weekday] ?? versionFor(habit, day).slot;
}

export function weekdayOf(profile: Profile, day: number) {
  return (profile.startWeekday + day) % 7;
}

export function conditionOf(score: number): Condition {
  if (score >= 85) return 'thriving';
  if (score >= 60) return 'stable';
  if (score >= 35) return 'struggling';
  if (score >= 15) return 'neglected';
  return 'recovery';
}

export function stageFor(qualifyingDays: number): number {
  const t = RULES.stageThresholds;
  let s = 1;
  for (let i = 0; i < t.length; i++) if (qualifyingDays >= t[i]) s = i + 1;
  return s;
}

export function nextStageAt(stage: number): number | null {
  return stage < RULES.stageThresholds.length ? RULES.stageThresholds[stage] : null;
}

export function dayStatus(profile: Profile, log: DayLog, weekday: number, hasScheduled: boolean): DayStatus {
  if (log.paused) return 'paused';
  if (log.rest || profile.restDays.includes(weekday)) return 'rest';
  const anyEntry = Object.keys(log.entries).length > 0 || log.missions.length > 0;
  if (!anyEntry && hasScheduled) return 'inactive';
  return 'active';
}

/** Daily Health Score = 100 × Σ(wᵢ·cᵢ) / Σ(eligible wᵢ). Unknown data is excluded, not zeroed. */
export function scoreDay(
  profile: Profile,
  habits: Habit[],
  log: DayLog,
): { status: DayStatus; score: number | null; results: HabitResult[]; weekday: number } {
  const weekday = weekdayOf(profile, log.day);
  const scheduledHabits = habits.filter((h) => h.schedule.includes(weekday));
  const status = dayStatus(profile, log, weekday, scheduledHabits.length > 0);
  let wSum = 0;
  let wc = 0;
  const results: HabitResult[] = habits.map((h) => {
    const scheduled = h.schedule.includes(weekday);
    const entry = log.entries[h.id];
    const unknown = !!entry && entry.value === null;
    const target = targetFor(h, log.day);
    const value = entry ? entry.value : null;
    const completion = value == null ? 0 : clamp(value / target, 0, 1);
    const eligible = scheduled && !unknown && (status === 'active' || status === 'inactive');
    if (eligible) {
      wSum += h.weight;
      wc += h.weight * completion;
    }
    return { habitId: h.id, eligible, scheduled, unknown, completion, value, target, slot: slotFor(h, log.day, weekday) };
  });
  const score = wSum > 0 ? Math.round((100 * wc) / wSum) : null;
  return { status, score, results, weekday };
}

function branchGroup(c: HabitCategory): Exclude<Branch, 'none'> | null {
  if (c === 'steps' || c === 'exercise') return 'athlete';
  if (c === 'mindfulness' || c === 'reading' || c === 'study' || c === 'sleep') return 'sage';
  if (c === 'hydration' || c === 'nutrition') return 'aqua';
  return null;
}

export function unlockedCosmetics(s: Pick<Snapshot, 'stage' | 'bestStreak' | 'totalMissions' | 'xp' | 'qualifyingDays'>): string[] {
  const u = ['bow'];
  if (s.stage >= 2) u.push('scarf', 'plant');
  if (s.bestStreak >= 3) u.push('shades');
  if (s.totalMissions >= 1) u.push('headband');
  if (s.xp >= 300) u.push('rug');
  if (s.qualifyingDays >= 5) u.push('lamp');
  if (s.stage >= 3) u.push('poster');
  if (s.xp >= 600) u.push('headphones');
  if (s.stage >= 4) u.push('crown');
  return u;
}

export interface SimInput {
  profile: Profile;
  habits: Habit[];
  days: DayLog[];
  /** index of the in-progress day (live mode): penalties are not applied until it closes */
  openDay?: number;
}

export function simulate({ profile, habits, days, openDay }: SimInput): Snapshot[] {
  const acc = ACCOUNTABILITY[profile.accountability];
  const shieldOn = profile.shield.enabled && profile.shield.apps.length > 0;
  const out: Snapshot[] = [];

  let condition: number = RULES.startCondition;
  let streak = 0;
  let bestStreak = 0;
  let xp = 0;
  let qualifyingDays = 0;
  let credits = 0;
  let totalMissions = 0;
  let inactiveRun = 0;
  let branch: Branch = 'none';
  const branchTotals: Record<string, number> = { athlete: 0, sage: 0, aqua: 0 };
  // rolling window of eligible-day outcomes; true = miss (missions can forgive a miss)
  const window: boolean[] = [];

  for (const log of days) {
    const isOpen = openDay === log.day;
    const { status, score, results, weekday } = scoreDay(profile, habits, log);
    const events: string[] = [];
    const prevStage = stageFor(qualifyingDays);
    let xpGained = 0;
    let creditsEarned = 0;

    const qualifying = status === 'active' && score !== null && score >= RULES.qualifyingScore;
    const missed = !isOpen && (status === 'active' || status === 'inactive') && score !== null && score < RULES.missedScore;

    // ----- welcome back (spec §4.3) -----
    const welcomeBack = status === 'active' && inactiveRun >= RULES.inactiveDaysForWelcomeBack;

    // ----- temporary condition -----
    let delta = 0;
    if (status === 'paused') {
      delta = 0;
      events.push('Pause day — no penalties, streak protected.');
    } else if (status === 'rest') {
      delta = RULES.restDelta;
      events.push('Planned rest day — excluded from scoring.');
    } else if (status === 'inactive') {
      delta = isOpen ? 0 : RULES.inactiveDelta;
    } else if (score === null) {
      delta = 0;
      events.push('All readings unknown (sync issue) — not counted as neglect.');
    } else {
      delta = RULES.conditionDelta(score);
    }
    if (isOpen && delta < 0) delta = 0; // the day isn't over yet
    const missionsToday = log.missions.length;
    delta += missionsToday * RULES.missionConditionBoost;
    if (welcomeBack && log.welcomeBackDone) {
      delta += RULES.welcomeBackBoost;
      events.push('Welcome-back quest complete — same pet, fresh start.');
    }
    condition = clamp(condition + delta);

    // ----- streaks -----
    if (qualifying) {
      streak += 1;
      if (streak > 0 && streak % RULES.xpStreakBonusEvery === 0) {
        xpGained += RULES.xpStreakBonus;
        events.push(`${streak}-day streak bonus!`);
      }
    } else if (status === 'rest' || status === 'paused' || score === null || isOpen) {
      // protected / undecided
    } else {
      if (streak > 0) events.push(`Streak of ${streak} reset — earned progress stays.`);
      streak = 0;
    }
    bestStreak = Math.max(bestStreak, streak);

    // ----- permanent XP & evolution -----
    if (status === 'active' && score !== null) xpGained += Math.round((score / 100) * 60);
    if (qualifying) {
      xpGained += RULES.xpQualifyingDay;
      qualifyingDays += 1;
      const h = habits;
      results.forEach((r, i) => {
        const g = branchGroup(h[i].category);
        if (g && r.eligible) branchTotals[g] += r.completion * h[i].weight;
      });
    }
    xpGained += missionsToday * RULES.xpMission;
    if (welcomeBack && log.welcomeBackDone) xpGained += 25;
    xp += xpGained;
    totalMissions += missionsToday;
    const stage = stageFor(qualifyingDays);
    if (stage > prevStage) events.push(`Evolved to stage ${stage}!`);
    if (stage >= 3 && branch === 'none') {
      branch = (Object.entries(branchTotals).sort((a, b) => b[1] - a[1])[0][0] as Branch) ?? 'athlete';
      events.push(`Evolution branch locked in: ${branch}.`);
    }

    // ----- shield (deterministic, opt-in) -----
    if (!isOpen && (status === 'active' || status === 'inactive') && score !== null) {
      window.push(missed);
      while (window.length > acc.window) window.shift();
    }
    const missCount = () => window.filter(Boolean).length;
    const stateFor = (n: number): ShieldState => (n >= acc.activeAt ? 'active' : n >= acc.warnAt ? 'warning' : 'normal');
    const pre = stateFor(missCount());
    for (let m = 0; m < missionsToday; m++) {
      const idx = window.lastIndexOf(true);
      if (idx >= 0) window[idx] = false; // a recovery mission forgives one miss
    }
    let shield: ShieldState = stateFor(missCount());
    if (pre === 'active' && missionsToday > 0) shield = 'unlocked';
    if (!shieldOn) shield = 'off';
    if (pre === 'warning' && !isOpen) events.push('Shield warning: several recent misses.');
    if (pre === 'active') events.push(shieldOn ? 'Distraction Shield activated (opt-in rule).' : 'Shield would activate, but it is disabled.');
    if (shield === 'unlocked') events.push('Recovery mission completed — access restored.');

    // ----- credits (capped) -----
    if (qualifying) {
      const mult = Math.min(RULES.creditStreakMaxMultiplier, 1 + RULES.creditStreakStep * (streak - 1));
      creditsEarned += Math.round(RULES.creditBase * mult);
    }
    for (const m of log.missions) creditsEarned += m.credit;
    credits = clamp(credits + creditsEarned - log.creditsSpent, 0, RULES.creditCap);

    inactiveRun = status === 'inactive' && !isOpen ? inactiveRun + 1 : status === 'active' ? 0 : inactiveRun;

    const snap: Snapshot = {
      day: log.day,
      weekday,
      status,
      score,
      qualifying,
      missed,
      habits: results,
      condition,
      conditionState: conditionOf(condition),
      streak,
      bestStreak,
      xp,
      xpGained,
      qualifyingDays,
      stage,
      branch,
      shield,
      recentMisses: missCount(),
      credits,
      creditsEarned,
      unlocked: [],
      welcomeBack,
      missionsDone: missionsToday,
      totalMissions,
      events,
    };
    snap.unlocked = unlockedCosmetics(snap);
    out.push(snap);
  }
  return out;
}

export function emptyDay(day: number): DayLog {
  return { day, entries: {}, missions: [], creditsSpent: 0, overrides: 0 };
}
