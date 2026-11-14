import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { useUI } from '../App';
import { recommendMissions, type RankedMission } from '../engine/insights';
import { simulate } from '../engine/engine';
import { RULES } from '../engine/config';
import { Badge, Ring, mmss, useCountdown } from '../components/ui';
import { usePedometer } from '../components/usePedometer';
import PetScene from '../components/PetScene';

export default function Missions() {
  const { journey, snaps, day, snap } = useStore();
  const ui = useUI();
  const options = useMemo(() => recommendMissions(journey.habits, snaps, journey.days, day), [journey, snaps, day]);
  const [active, setActive] = useState<RankedMission | null>(null);
  const [result, setResult] = useState<{ m: RankedMission; before: number; after: number; xp: number } | null>(null);

  if (result) return <MissionResult {...result} onDone={() => ui.go('shield')} />;
  if (active)
    return (
      <MissionRunner
        mission={active}
        onCancel={() => setActive(null)}
        onComplete={(r) => {
          setActive(null);
          setResult(r);
        }}
      />
    );

  return (
    <div className="screen">
      <button className="link" onClick={() => ui.go('shield')}>
        ← Shield
      </button>
      <h2>Recovery missions</h2>
      <p className="small muted">
        Pick any one. All are short, safe, and you can swap or skip. Each completion: +{RULES.missionConditionBoost} condition, +{RULES.xpMission} XP, forgives one miss
        {snap.shield === 'active' ? ', and unlocks your shielded apps.' : '.'}
      </p>
      <div className="list">
        {options.map((m) => (
          <button key={m.id} className={`mission ${m.aiPick ? 'mission--ai' : ''}`} onClick={() => setActive(m)}>
            <span className="mission__icon">{m.icon}</span>
            <span className="mission__body">
              <b>
                {m.name} {m.aiPick && <Badge tone="ai">✨ AI pick</Badge>}
              </b>
              <small>{m.requirement}</small>
              <small className="muted">{m.reason}</small>
              <span className="habit__tags">
                <Badge>{m.effort}</Badge>
                {m.nonExercise && <Badge tone="good">no exercise needed</Badge>}
              </span>
            </span>
            <span className="mission__credit">
              +{m.credit}
              <small>min</small>
            </span>
          </button>
        ))}
      </div>
      <p className="tiny muted center">Recommendations come from your recent misses, past successes and energy level. They never prescribe intense exercise.</p>
    </div>
  );
}

function MissionRunner({ mission, onCancel, onComplete }: { mission: RankedMission; onCancel: () => void; onComplete: (r: { m: RankedMission; before: number; after: number; xp: number }) => void }) {
  const { journey, dispatch, isDemo, state, day, snap } = useStore();
  const ui = useUI();
  const ped = usePedometer();
  const [simSteps, setSimSteps] = useState(0);
  const [running, setRunning] = useState(mission.kind === 'timer' || mission.kind === 'breath');
  const speed = state.prefs.demoSpeed ? 20 : 1;

  const finish = (source: 'sensor' | 'timer' | 'manual' | 'demo' | 'simulated-sensor') => {
    const before = snap.condition;
    const bonus =
      mission.kind === 'steps' ? { category: 'steps', amount: mission.amount } : mission.kind === 'drink' ? { category: 'hydration', amount: 250 } : undefined;
    // predict the after-state with the same pure engine
    const days = journey.days.map((d) => (d.day === day ? { ...d, missions: [...d.missions, { missionId: mission.id, credit: mission.credit, source }] } : d));
    const after = simulate({ ...journey, days, openDay: isDemo ? undefined : journey.days.length - 1 })[day];
    dispatch({ type: 'mission', missionId: mission.id, credit: mission.credit, source: isDemo ? 'demo' : source, habitBonus: bonus });
    if (snap.shield === 'active') ui.unlock(mission.credit);
    ui.confetti();
    onComplete({ m: mission, before, after: after.condition, xp: RULES.xpMission });
  };

  const left = useCountdown(mission.amount, running, speed, () => finish('timer'));
  const steps = ped.steps + simSteps;
  useEffect(() => {
    if (mission.kind === 'steps' && steps >= mission.amount) finish(ped.steps > 0 ? 'sensor' : 'simulated-sensor');
  }, [steps]);

  const breathPhase = Math.floor((mission.amount - left) / 4) % 2 === 0 ? 'Breathe in' : 'Breathe out';
  const stretches = ['🙆 Reach up tall', '🤸 Side bend left', '🤸‍♂️ Side bend right', '🧎 Gentle hip opener', '🙇 Forward fold (soft knees)', '💆 Neck rolls'];
  const stretch = stretches[Math.floor(((mission.amount - left) / mission.amount) * stretches.length) % stretches.length];

  return (
    <div className="screen mission-run">
      <button className="link" onClick={onCancel}>
        ← Choose a different mission
      </button>
      <h2>
        {mission.icon} {mission.name}
      </h2>
      <p className="small muted">{mission.requirement}</p>

      {mission.kind === 'steps' && (
        <div className="center">
          <Ring value={steps / mission.amount} size={180} stroke={14} color="var(--good)">
            <div className="timer-big">{steps}</div>
            <small>/ {mission.amount} steps</small>
          </Ring>
          <div className="row gap center wrap">
            {!ped.active ? (
              <button className="btn" disabled={ped.perm === 'unsupported'} onClick={() => ped.start()}>
                📱 Count real steps
              </button>
            ) : (
              <Badge tone="real">{ped.receiving ? 'Sensor live' : 'Waiting for motion…'}</Badge>
            )}
            <button className="btn btn--ghost" onClick={() => setSimSteps((s) => s + 125)}>
              Simulate walking <Badge tone="sim">SIM</Badge>
            </button>
          </div>
          {ped.perm === 'unsupported' && <p className="tiny muted">No motion sensor in this browser — open on a phone for real counting.</p>}
        </div>
      )}

      {mission.kind === 'drink' && (
        <div className="center">
          <div className="glass" />
          <p className="small">Pour a glass of water and drink it. No need to chug — sip.</p>
          <button className="btn btn--big" onClick={() => finish('manual')}>
            💧 I drank a glass
          </button>
          <p className="tiny muted">Self-reported check-in.</p>
        </div>
      )}

      {mission.kind === 'timer' && (
        <div className="center">
          <Ring value={1 - left / mission.amount} size={180} stroke={14} color="var(--accent)">
            <div className="timer-big">{mmss(left)}</div>
          </Ring>
          <p className="stretch-cue">{mission.id.startsWith('ai-') ? 'Just start. Two minutes is a win.' : stretch}</p>
          <p className="tiny muted">Move gently and stop if anything hurts. {state.prefs.demoSpeed && '⚡ Demo speed on.'}</p>
          <button className="btn btn--ghost" onClick={() => setRunning((r) => !r)}>
            {running ? 'Pause' : 'Resume'}
          </button>
        </div>
      )}

      {mission.kind === 'breath' && (
        <div className="center">
          <div className={`breath ${running ? 'breath--run' : ''}`} style={{ animationDuration: `${8 / speed}s` }}>
            <span>{breathPhase}</span>
          </div>
          <div className="timer-big">{mmss(left)}</div>
          <p className="tiny muted">{state.prefs.demoSpeed && '⚡ Demo speed on.'}</p>
          <button className="btn btn--ghost" onClick={() => setRunning((r) => !r)}>
            {running ? 'Pause' : 'Resume'}
          </button>
        </div>
      )}
      {isDemo && <p className="tiny muted center">Demo journey — the result is recorded as demo data.</p>}
    </div>
  );
}

function MissionResult({ m, before, after, xp, onDone }: { m: RankedMission; before: number; after: number; xp: number; onDone: () => void }) {
  const { snap } = useStore();
  return (
    <div className="screen">
      <PetScene reaction="refreshed" showCaption={false} />
      <div className="card center result">
        <h2>Mission complete! 🎉</h2>
        <p>
          {m.icon} {m.name}
        </p>
        <div className="result__grid">
          <div>
            <b>
              {Math.round(before)} → {Math.round(after)}
            </b>
            <small>Condition</small>
          </div>
          <div>
            <b>+{xp}</b>
            <small>XP</small>
          </div>
          <div>
            <b>+{m.credit}</b>
            <small>min credit</small>
          </div>
        </div>
        <p className="small">
          Shield: <b>{snap.shield === 'unlocked' ? 'Access restored 🔓' : snap.shield}</b>
        </p>
        <button className="btn btn--big" onClick={onDone}>
          Back to my apps
        </button>
      </div>
    </div>
  );
}
