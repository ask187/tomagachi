import { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import { useUI } from '../App';
import { SCENARIOS, STORYBOARD } from '../engine/scenarios';
import { Badge } from '../components/ui';
import { WEEKDAYS } from '../engine/config';
import { fmt } from '../engine/insights';
import PetScene, { MOOD_TAG } from '../components/PetScene';
import Pet from '../components/Pet';
import type { Condition } from '../engine/types';

const ORDER: Condition[] = ['thriving', 'stable', 'struggling', 'neglected', 'recovery'];

const SCEN = SCENARIOS.map((f) => f());

/** Demo Time Machine (spec §14) — hackathon-only control surface. */
export default function TimeMachine({ onScene, presenter }: { onScene: (i: number) => void; presenter: number | null }) {
  const { state, dispatch, journey, snap, snaps, isDemo, day } = useStore();
  const ui = useUI();
  const [playing, setPlaying] = useState(false);
  const sc = SCEN.find((s) => s.id === state.demo.scenarioId)!;
  const max = state.demo.days.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (state.viewDay >= max) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => dispatch({ type: 'setViewDay', day: state.viewDay + 1 }), 900);
    return () => clearTimeout(id);
  }, [playing, state.viewDay, max, dispatch]);

  // the first day the journey reaches each mood, so the strip reads in story order
  const moodDays = ORDER.map((c) => {
    const first = snaps.find((x) => x.conditionState === c);
    return first ? { c, snap: first } : null;
  }).filter((x): x is { c: Condition; snap: (typeof snaps)[number] } => !!x);

  const jump = (d: number, screen?: Parameters<typeof ui.go>[0]) => {
    if (!isDemo) dispatch({ type: 'setMode', mode: 'demo' });
    dispatch({ type: 'setViewDay', day: d });
    if (screen) ui.go(screen);
  };

  return (
    <div className="tm">
      <div className="tm__head">
        <h3>⏱ Demo Time Machine</h3>
        <Badge tone="demo">hackathon only</Badge>
      </div>
      <p className="tiny muted">Simulates weeks of use in seconds. Everything injected here is labelled demo data.</p>

      <div className="tm__preview">
        <PetScene compact showCaption={false} />
        <div className="tm__meter">
          <div className="tm__meter-bar">
            <i style={{ width: `${snap.condition}%` }} className={`tm__fill--${snap.conditionState}`} />
          </div>
          <small>
            Day {day + 1} · condition {Math.round(snap.condition)} · score {snap.score ?? '—'}
          </small>
        </div>
      </div>

      {isDemo && moodDays.length > 1 && (
        <div className="tm__block">
          <div className="label">Jump to a mood</div>
          <div className="moods">
            {moodDays.map(({ c, snap: s }) => (
              <button key={c} className={`mood ${snap.conditionState === c ? 'on' : ''}`} onClick={() => jump(s.day, 'home')} title={`Day ${s.day + 1}`}>
                <Pet color={journey.profile.petColor} stage={s.stage} condition={c} branch={s.branch} still size={48} />
                <small>{MOOD_TAG[c].label}</small>
                <em>Day {s.day + 1}</em>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="segmented">
        <button className={isDemo ? 'on' : ''} onClick={() => dispatch({ type: 'setMode', mode: 'demo' })}>
          Demo journey
        </button>
        <button
          className={!isDemo ? 'on' : ''}
          onClick={() => (state.live ? dispatch({ type: 'setMode', mode: 'live' }) : ui.openOnboarding())}
        >
          {state.live ? 'My live pet' : '+ Create my pet'}
        </button>
      </div>

      <div className="tm__block">
        <div className="label">🎬 Presenter mode — 3-minute storyboard</div>
        <div className="tm__scenes">
          {STORYBOARD.map((s, i) => (
            <button key={s.scene} className={`chip ${presenter === i ? 'on' : ''}`} onClick={() => onScene(i)}>
              {s.scene}. {s.title}
            </button>
          ))}
        </div>
      </div>

      <div className={`tm__block ${!isDemo ? 'tm__block--dim' : ''}`}>
        <div className="label">Scenario</div>
        <select value={state.demo.scenarioId} onChange={(e) => dispatch({ type: 'loadScenario', id: e.target.value })}>
          {SCEN.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <p className="tiny muted">{sc.blurb}</p>

        <div className="tm__scrub">
          <button className="icon-btn" onClick={() => jump(Math.max(0, state.viewDay - 1))} aria-label="Previous day">
            ◀
          </button>
          <input type="range" min={0} max={max} value={state.viewDay} onChange={(e) => jump(Number(e.target.value))} aria-label="Simulated day" />
          <button className="icon-btn" onClick={() => jump(Math.min(max, state.viewDay + 1))} aria-label="Next day">
            ▶
          </button>
        </div>
        <div className="row">
          <b>
            Day {state.viewDay + 1} / {max + 1}
          </b>
          <button className="btn btn--sm" onClick={() => (state.viewDay >= max ? (jump(0), setPlaying(true)) : setPlaying((p) => !p))}>
            {playing ? '⏸ Pause' : '▶ Play journey'}
          </button>
        </div>
        <div className="tm__milestones">
          {sc.milestones.map((m) => (
            <button key={m.day} className={`chip ${state.viewDay === m.day ? 'on' : ''}`} onClick={() => jump(m.day)}>
              {m.label}
            </button>
          ))}
        </div>

        {sc.id === 'hero' && (
          <div className="tm__quick">
            <button className="btn btn--sm btn--ghost" onClick={() => jump(12, 'home')}>
              🥀 Neglected state
            </button>
            <button className="btn btn--sm btn--ghost" onClick={() => jump(29, 'home')}>
              🌟 Recovered state
            </button>
            <button className="btn btn--sm btn--ghost" onClick={() => jump(12, 'shield')}>
              🛡️ Restriction demo
            </button>
            <button
              className="btn btn--sm btn--ghost"
              onClick={() => {
                jump(29, 'home');
                setTimeout(() => ui.revealEvolution(3, 4), 60);
              }}
            >
              ✨ Evolution reveal
            </button>
          </div>
        )}
      </div>

      <div className="tm__block">
        <div className="label">Underlying data · Day {day + 1} ({WEEKDAYS[snap.weekday]})</div>
        <table className="tm__table">
          <tbody>
            {journey.habits.map((h, i) => {
              const r = snap.habits[i];
              if (!r) return null;
              return (
                <tr key={h.id}>
                  <td>
                    {h.icon} {h.name}
                  </td>
                  <td>{!r.scheduled ? <span className="muted">not scheduled</span> : r.unknown ? <span className="warn">unknown</span> : `${fmt(r.value ?? 0)} / ${fmt(r.target)}`}</td>
                  <td>{r.eligible ? `${Math.round(r.completion * 100)}%` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="tm__grid">
          <span>Status</span>
          <b>{snap.status}</b>
          <span>Daily score</span>
          <b>{snap.score ?? 'n/a'}</b>
          <span>Condition</span>
          <b>
            {Math.round(snap.condition)} · {snap.conditionState}
          </b>
          <span>Streak / best</span>
          <b>
            {snap.streak} / {snap.bestStreak}
          </b>
          <span>Qualifying days</span>
          <b>{snap.qualifyingDays}</b>
          <span>Stage · branch</span>
          <b>
            {snap.stage} · {snap.branch}
          </b>
          <span>XP</span>
          <b>{fmt(snap.xp)}</b>
          <span>Shield</span>
          <b>
            {snap.shield} ({snap.recentMisses} misses)
          </b>
          <span>Credits</span>
          <b>{snap.credits} min</b>
        </div>
        {snap.events.length > 0 && (
          <ul className="tm__events">
            {snap.events.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
