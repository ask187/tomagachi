import { simulate, scoreDay, emptyDay, conditionOf } from './engine';
import { heroScenario, comebackScenario, careScenario } from './scenarios';
import { detectInsights, recommendMissions } from './insights';

describe('hero scenario', () => {
  const sc = heroScenario();
  const snaps = simulate(sc);
  it('drops to recovery-needed before the shield, then recovers', () => {
    expect(snaps[12].conditionState).toBe('recovery');
    expect(snaps[12].shield).toBe('active');
  });
  it('starts strong and evolves early', () => {
    expect(snaps[2].stage).toBe(2);
  });
  it('warns before activating the shield', () => {
    const firstWarn = snaps.findIndex((s) => s.shield === 'warning');
    const firstActive = snaps.findIndex((s) => s.shield === 'active');
    expect(firstWarn).toBeGreaterThan(-1);
    expect(firstActive).toBeGreaterThan(firstWarn);
  });
  it('reaches a neglected state mid-journey and unlocks via mission', () => {
    expect(snaps.some((s) => s.condition < 35)).toBe(true);
    expect(snaps[14].shield).toBe('unlocked');
  });
  it('ends legendary and thriving', () => {
    expect(snaps[29].stage).toBe(4);
    expect(snaps[29].conditionState).toBe('thriving');
    expect(snaps[29].unlocked).toContain('crown');
  });
  it('xp never decreases', () => {
    for (let i = 1; i < snaps.length; i++) expect(snaps[i].xp).toBeGreaterThanOrEqual(snaps[i - 1].xp);
  });
  it('detects the evening workout pattern', () => {
    const ins = detectInsights(sc.habits, snaps, 29);
    expect(ins.find((i) => i.id === 'slot-workout')).toBeTruthy();
  });
  it('recommends multiple missions incl. non-exercise', () => {
    const m = recommendMissions(sc.habits, snaps, sc.days, 12);
    expect(m.length).toBeGreaterThanOrEqual(2);
    expect(m.some((x) => x.nonExercise)).toBe(true);
  });
});

describe('fairness rules', () => {
  it('unknown data is excluded rather than counted as zero', () => {
    const sc = heroScenario();
    const r = scoreDay(sc.profile, sc.habits, sc.days[16]);
    expect(r.results[0].unknown).toBe(true);
    expect(r.results[0].eligible).toBe(false);
  });
  it('rest and pause days do not break streaks', () => {
    const snaps = simulate(careScenario());
    expect(snaps[9].streak).toBeGreaterThanOrEqual(5);
    expect(snaps.slice(3, 6).every((s) => s.condition >= snaps[2].condition)).toBe(true);
  });
  it('long break resets streak but keeps stage, and offers welcome-back', () => {
    const snaps = simulate(comebackScenario());
    expect(snaps[4].streak).toBe(5);
    expect(snaps[10].welcomeBack).toBe(true);
    expect(snaps[9].streak).toBe(0);
    expect(snaps[9].stage).toBe(snaps[4].stage);
  });
  it('open day applies no penalties', () => {
    const sc = heroScenario();
    const days = [...sc.days.slice(0, 3), emptyDay(3)];
    const snaps = simulate({ ...sc, days, openDay: 3 });
    expect(snaps[3].condition).toBe(snaps[2].condition);
    expect(snaps[3].streak).toBe(snaps[2].streak);
  });
  it('condition buckets', () => {
    expect(conditionOf(90)).toBe('thriving');
    expect(conditionOf(10)).toBe('recovery');
  });
});
