import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { useUI } from '../App';
import { SCENARIOS, STORYBOARD } from '../engine/scenarios';
import { WEEKDAYS } from '../engine/config';
import { fmt } from '../engine/insights';
import { simulate } from '../engine/engine';
import PetScene, { MOOD_TAG } from '../components/PetScene';
import Pet from '../components/Pet';
import type { Condition } from '../engine/types';
import { SPECIES_LIST, formOf } from '../engine/species';

const ORDER: Condition[] = ['thriving', 'stable', 'struggling', 'neglected', 'recovery'];

const SCEN = SCENARIOS.map((f) => f());
// untouched copies, to tell when the presenter has edited a journey
const SCEN_FRESH: Record<string, { days: string; habits: string }> = Object.fromEntries(
  SCENARIOS.map((f) => f()).map((s) => [s.id, { days: JSON.stringify(s.days), habits: JSON.stringify(s.habits) }]),
);

/** Time Machine (spec §14): replay a scripted journey in seconds. */
export default function TimeMachine({ onScene, presenter, onLeave }: { onScene: (i: number) => void; presenter: number | null; onLeave?: () => void }) {
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
  // the mood strip always describes the DEMO journey, even while the live pet is on screen
  const demoSnaps = useMemo(() => (isDemo ? snaps : simulate(state.demo)), [isDemo, snaps, state.demo]);
  const demoSpecies = state.demo.profile.species ?? 'mochi';
  const pristine = useMemo(() => SCEN_FRESH[state.demo.scenarioId], [state.demo.scenarioId]);
  const edited = !!pristine && (JSON.stringify(state.demo.days) !== pristine.days || JSON.stringify(state.demo.habits) !== pristine.habits);
  const moodDays = ORDER.map((c) => {
    const first = demoSnaps.find((x) => x.conditionState === c);
    return first ? { c, snap: first } : null;
  }).filter((x): x is { c: Condition; snap: (typeof demoSnaps)[number] } => !!x);

  const jump = (d: number, screen?: Parameters<typeof ui.go>[0], leave = !!screen) => {
    if (!isDemo) dispatch({ type: 'setMode', mode: 'demo' });
    dispatch({ type: 'setViewDay', day: d });
    if (screen) ui.go(screen);
    // buttons that jump to a moment close the phone-sized sheet so the main screen is visible;
    // the slider and ◀ ▶ keep it open (the sheet has its own live preview)
    if (leave) onLeave?.();
  };

  return (
    <div className="tm">
      <div className="tm__head">
        <h3>⏱ Demo Time Machine</h3>
      </div>
      <p className="tiny muted">Replays weeks of habits in seconds.</p>

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

      {!isDemo && <p className="tm__live-note">You're viewing your live pet. Any control below switches to the demo journey.</p>}

      {moodDays.length > 1 && (
        <div className="tm__block">
          <div className="label">Jump to a mood</div>
          <div className="moods">
            {moodDays.map(({ c, snap: s }) => (
              <button key={c} className={`mood ${isDemo && snap.conditionState === c ? 'on' : ''}`} onClick={() => jump(s.day, 'home')} title={`Day ${s.day + 1}`}>
                <Pet color={state.demo.profile.petColor} species={demoSpecies} form={formOf(demoSpecies, s.stage, s.streak)} stage={s.stage} condition={c} branch={s.branch} still size={48} />
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
            <button key={s.scene} className={`chip ${presenter === i ? 'on' : ''}`} onClick={() => { onScene(i); onLeave?.(); }}>
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
        {edited && (
          <div className="tm__edited">
            <span className="tiny">✏️ You changed this journey (missions, logs or goals). Reset it before a fresh demo.</span>
            <button className="btn btn--sm btn--ghost" onClick={() => dispatch({ type: 'loadScenario', id: state.demo.scenarioId })}>
              ↺ Reset journey
            </button>
          </div>
        )}
        <div className="label">Companion</div>
        <div className="chips">
          {SPECIES_LIST.map((sp) => (
            <button
              key={sp.id}
              className={`chip ${(state.demo.profile.species ?? 'mochi') === sp.id ? 'on' : ''}`}
              onClick={() => {
                if (!isDemo) dispatch({ type: 'setMode', mode: 'demo' });
                dispatch({ type: 'profile', patch: { species: sp.id, petColor: sp.defaultColor, petName: sp.defaultName } });
              }}
            >
              {sp.icon} {sp.name}
            </button>
          ))}
        </div>

        <div className="tm__scrub">
          <button className="icon-btn" onClick={() => jump(Math.max(0, state.viewDay - 1))} aria-label="Previous day">
            ◀
          </button>
          <input type="range" min={0} max={max} value={state.viewDay} onChange={(e) => jump(Number(e.target.value))} aria-label="Day" />
          <button className="icon-btn" onClick={() => jump(Math.min(max, state.viewDay + 1))} aria-label="Next day">
            ▶
          </button>
        </div>
        <div className="row">
          <b>
            Day {state.viewDay + 1} / {max + 1}
          </b>
          <button
            className="btn btn--sm"
            onClick={() => {
              if (playing) return setPlaying(false);
              jump(state.viewDay >= max ? 0 : state.viewDay, 'home', false);
              setPlaying(true);
            }}
          >
            {playing ? '⏸ Pause' : '▶ Play journey'}
          </button>
        </div>
        <div className="tm__milestones">
          {sc.milestones.map((m) => (
            <button key={m.day} className={`chip ${state.viewDay === m.day ? 'on' : ''}`} onClick={() => jump(m.day, undefined, true)}>
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
