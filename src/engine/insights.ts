import { MISSIONS, type Mission, WEEKDAYS } from './config';
import { targetFor } from './engine';
import type { DayLog, Habit, Slot, Snapshot } from './types';

// ---------------------------------------------------------------------------
// Insight Engine — the "behavioral intelligence layer" (spec §10).
// Runs on-device over the logged history. It only RECOMMENDS: every suggestion
// must be approved by the user before the rules engine sees a new goal version.
// Findings are correlations, never presented as verified causal predictions.
// ---------------------------------------------------------------------------

export type Suggestion =
  | { type: 'moveSlot'; habitId: string; fromSlot: Slot; toSlot: Slot; weekdays: number[] }
  | { type: 'retarget'; habitId: string; target: number }
  | { type: 'restDay'; weekday: number };

export interface Insight {
  id: string;
  kind: 'pattern' | 'difficulty' | 'risk' | 'weekly';
  icon: string;
  title: string;
  detail: string;
  evidence: string;
  confidence: 'low' | 'medium' | 'high';
  suggestion?: Suggestion;
  suggestionLabel?: string;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
const conf = (n: number): Insight['confidence'] => (n >= 8 ? 'high' : n >= 5 ? 'medium' : 'low');

export function detectInsights(habits: Habit[], snaps: Snapshot[], upToDay: number): Insight[] {
  const hist = snaps.filter((s) => s.day <= upToDay && s.status !== 'rest' && s.status !== 'paused');
  const insights: Insight[] = [];
  if (hist.length < 4) return insights;

  habits.forEach((h, hi) => {
    const rows = hist.map((s) => ({ s, r: s.habits[hi] })).filter((x) => x.r && x.r.eligible);
    if (rows.length < 4) return;

    // 1. time-of-day pattern (spec §10.1 example: evening workouts missed, mornings succeed)
    const bySlot: Partial<Record<Slot, { n: number; ok: number; weekdays: Set<number> }>> = {};
    rows.forEach(({ s, r }) => {
      const b = (bySlot[r.slot] ??= { n: 0, ok: 0, weekdays: new Set() });
      b.n += 1;
      if (r.completion >= 1) b.ok += 1;
      b.weekdays.add(s.weekday);
    });
    const slots = Object.entries(bySlot) as [Slot, { n: number; ok: number; weekdays: Set<number> }][];
    const bad = slots.filter(([, b]) => b.n >= 3 && b.ok / b.n <= 0.4).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n)[0];
    const good = slots.filter(([, b]) => b.n >= 2 && b.ok / b.n >= 0.6).sort((a, b) => b[1].ok / b[1].n - a[1].ok / a[1].n)[0];
    if (bad && good && bad[0] !== good[0]) {
      const [bs, bb] = bad;
      const [gs, gb] = good;
      const wd = [...bb.weekdays].sort();
      insights.push({
        id: `slot-${h.id}`,
        kind: 'pattern',
        icon: '🕰️',
        title: `${cap(bs)} ${h.name.toLowerCase()}s often slip — ${gs} ones succeed`,
        detail: `You fully completed ${bb.ok} of ${bb.n} ${bs} sessions (${pct(bb.ok / bb.n)}) versus ${gb.ok} of ${gb.n} ${gs} sessions (${pct(gb.ok / gb.n)}).`,
        evidence: `${bb.n + gb.n} scheduled sessions analysed`,
        confidence: conf(bb.n + gb.n),
        suggestion: { type: 'moveSlot', habitId: h.id, fromSlot: bs, toSlot: gs, weekdays: wd },
        suggestionLabel: `Move ${wd.map((d) => WEEKDAYS[d]).join('/')} ${h.name.toLowerCase()} to the ${gs}`,
      });
    }

    // 2. goal difficulty (spec §10.3)
    const recent = rows.slice(-10);
    const avg = recent.reduce((a, x) => a + x.r.completion, 0) / recent.length;
    const full = recent.filter((x) => x.r.completion >= 1).length / recent.length;
    const target = targetFor(h, upToDay);
    if (recent.length >= 5 && avg >= 0.3 && avg < 0.75 && full < 0.35) {
      const vals = recent.map((x) => x.r.value ?? 0);
      const typical = vals.reduce((a, b) => a + b, 0) / vals.length;
      const proposed = roundTo(Math.max(typical * 1.15, target * 0.6), h.step);
      if (proposed < target) {
        insights.push({
          id: `hard-${h.id}`,
          kind: 'difficulty',
          icon: '🎚️',
          title: `${h.name} target may be a stretch right now`,
          detail: `Average ${pct(avg)} of target over the last ${recent.length} scheduled days; full completion only ${pct(full)}. A smaller, winnable goal tends to rebuild momentum.`,
          evidence: `Typical: ${fmt(typical)} ${h.unit} vs target ${fmt(target)} ${h.unit}`,
          confidence: conf(recent.length),
          suggestion: { type: 'retarget', habitId: h.id, target: proposed },
          suggestionLabel: `Set ${h.name.toLowerCase()} to ${fmt(proposed)} ${h.unit} (old days keep the old target)`,
        });
      }
    } else if (recent.length >= 8 && full === 1) {
      const proposed = roundTo(target * 1.1, h.step);
      insights.push({
        id: `easy-${h.id}`,
        kind: 'difficulty',
        icon: '📈',
        title: `${h.name} is on autopilot`,
        detail: `100% completion on the last ${recent.length} scheduled days. Want a slightly bigger challenge? Totally optional.`,
        evidence: `${recent.length}/${recent.length} complete`,
        confidence: 'medium',
        suggestion: { type: 'retarget', habitId: h.id, target: proposed },
        suggestionLabel: `Nudge to ${fmt(proposed)} ${h.unit}`,
      });
    }
  });

  // 3. weekday vs weekend
  const wkend = hist.filter((s) => (s.weekday === 0 || s.weekday === 6) && s.score !== null);
  const wkday = hist.filter((s) => s.weekday > 0 && s.weekday < 6 && s.score !== null);
  if (wkend.length >= 3 && wkday.length >= 5) {
    const a = avgScore(wkend);
    const b = avgScore(wkday);
    if (b - a >= 25) {
      insights.push({
        id: 'weekend',
        kind: 'weekly',
        icon: '🗓️',
        title: 'Weekends run on a different clock',
        detail: `Weekend days average ${Math.round(a)} vs ${Math.round(b)} on weekdays. Planning Sunday as a rest day keeps it from counting against you.`,
        evidence: `${wkend.length} weekend vs ${wkday.length} weekday days`,
        confidence: conf(wkend.length + 2),
        suggestion: { type: 'restDay', weekday: 0 },
        suggestionLabel: 'Make Sunday a planned rest day',
      });
    }
  }

  // 4. tomorrow risk indicator (correlation only)
  const tomorrowWd = ((hist[hist.length - 1]?.weekday ?? 0) + 1) % 7;
  let worst: { name: string; rate: number; n: number } | null = null;
  habits.forEach((h, hi) => {
    const rows = hist.filter((s) => s.weekday === tomorrowWd && s.habits[hi]?.eligible);
    if (rows.length < 2) return;
    const rate = rows.filter((s) => s.habits[hi].completion >= 1).length / rows.length;
    if (rate <= 0.5 && (!worst || rate < worst.rate)) worst = { name: h.name, rate, n: rows.length };
  });
  if (worst) {
    const w = worst as { name: string; rate: number; n: number };
    insights.push({
      id: 'risk',
      kind: 'risk',
      icon: '⚠️',
      title: `Heads-up for ${WEEKDAYS[tomorrowWd]}: ${w.name.toLowerCase()}`,
      detail: `Historically completed ${pct(w.rate)} of the time on ${WEEKDAYS[tomorrowWd]}s. An earlier reminder could help — this is a pattern, not a prophecy.`,
      evidence: `${w.n} past ${WEEKDAYS[tomorrowWd]}s`,
      confidence: conf(w.n * 2),
    });
  }

  return insights;
}

export interface RankedMission extends Mission {
  reason: string;
  aiPick?: boolean;
}

/** Adaptive recovery missions (spec §10.2): several safe options, ranked, always including non-exercise ones. */
export function recommendMissions(habits: Habit[], snaps: Snapshot[], days: DayLog[], upToDay: number): RankedMission[] {
  const recent = snaps.filter((s) => s.day <= upToDay).slice(-5);
  const missRate: Record<string, number> = {};
  habits.forEach((h, hi) => {
    const rows = recent.filter((s) => s.habits[hi]?.eligible);
    if (!rows.length) return;
    missRate[h.category] = Math.max(missRate[h.category] ?? 0, 1 - rows.reduce((a, s) => a + s.habits[hi].completion, 0) / rows.length);
  });
  const pastSuccess: Record<string, number> = {};
  days.filter((d) => d.day <= upToDay).forEach((d) => d.missions.forEach((m) => (pastSuccess[m.missionId] = (pastSuccess[m.missionId] ?? 0) + 1)));
  const lowEnergy = (snaps.find((s) => s.day === upToDay)?.condition ?? 50) < 30;

  const ranked: RankedMission[] = MISSIONS.map((m) => {
    let score = (missRate[m.category] ?? 0) * 3 + (pastSuccess[m.id] ?? 0) * 0.5;
    if (lowEnergy && m.nonExercise) score += 1.5;
    if (m.effort === 'tiny') score += 0.3;
    const reasons: string[] = [];
    if ((missRate[m.category] ?? 0) > 0.5) reasons.push(`targets your most-missed area`);
    if (pastSuccess[m.id]) reasons.push(`you've done this ${pastSuccess[m.id]}× before`);
    if (lowEnergy && m.nonExercise) reasons.push('low-energy friendly');
    if (!reasons.length) reasons.push(m.nonExercise ? 'no exercise needed' : 'quick and gentle');
    return { ...m, reason: reasons.join(' · '), _s: score } as RankedMission & { _s: number };
  })
    .sort((a, b) => (b as unknown as { _s: number })._s - (a as unknown as { _s: number })._s)
    .map((m) => m as RankedMission);

  // Personalised "tiny version" of the most-missed habit
  const worstCat = Object.entries(missRate).sort((a, b) => b[1] - a[1])[0]?.[0];
  const worstHabit = habits.find((h) => h.category === worstCat);
  if (worstHabit && (missRate[worstCat!] ?? 0) > 0.3) {
    ranked.unshift({
      id: `ai-${worstHabit.id}`,
      name: `Tiny ${worstHabit.name.toLowerCase()}`,
      icon: '✨',
      kind: 'timer',
      requirement: `2-minute starter version of ${worstHabit.name.toLowerCase()}`,
      amount: 120,
      credit: 8,
      effort: 'tiny',
      nonExercise: !['steps', 'exercise'].includes(worstHabit.category),
      category: worstHabit.category,
      reason: 'Suggested for you: shrinks your most-missed habit to a 2-minute win',
      aiPick: true,
    });
  }
  return ranked;
}

function avgScore(s: Snapshot[]) {
  return s.reduce((a, x) => a + (x.score ?? 0), 0) / s.length;
}
function roundTo(v: number, step: number) {
  return Math.max(step, Math.round(v / step) * step);
}
function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
export function fmt(n: number) {
  return n >= 1000 ? n.toLocaleString('en-US') : String(Math.round(n * 10) / 10);
}
