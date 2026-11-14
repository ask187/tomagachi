import { useStore } from '../state/store';
import { useUI } from '../App';
import PetScene from '../components/PetScene';
import { Badge, Meter, Ring } from '../components/ui';
import { RULES, STAGES } from '../engine/config';
import { nextStageAt } from '../engine/engine';
import { fmt } from '../engine/insights';
import HabitQuickRow from '../components/HabitQuickRow';
import Doodles from '../components/Doodles';
import WeekDots from '../components/WeekDots';

const MOOD_LINE = {
  thriving: 'Unstoppable today. Mildly insufferable.',
  stable: "Let's make today count.",
  struggling: 'A small win would really help.',
  neglected: 'Things are getting messy in here.',
  recovery: 'One tiny mission brings them back.',
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

const STATE_LABEL = {
  thriving: { label: 'Thriving', color: 'var(--good)', icon: '🌟' },
  stable: { label: 'Stable', color: 'var(--accent)', icon: '🙂' },
  struggling: { label: 'Struggling', color: 'var(--warn)', icon: '😮‍💨' },
  neglected: { label: 'Neglected', color: 'var(--bad)', icon: '🥀' },
  recovery: { label: 'Recovery needed', color: 'var(--bad)', icon: '🩹' },
};

export default function Home() {
  const { snap, journey, isDemo, dispatch, snaps, day } = useStore();
  const ui = useUI();
  const st = STATE_LABEL[snap.conditionState];
  const next = nextStageAt(snap.stage);
  const prevAt = RULES.stageThresholds[snap.stage - 1] ?? 0;
  const scheduled = journey.habits.filter((_, i) => snap.habits[i]?.scheduled);
  const yesterday = snaps[day - 1];

  return (
    <div className="screen home">
      <div className="hero">
        <Doodles />
        <div className="hero__top">
          <div>
            <small className="hero__hi">{greeting()} 👋</small>
            <h1 className="hero__title">{journey.profile.petName}'s Day</h1>
            <p className="hero__sub">{MOOD_LINE[snap.conditionState]}</p>
          </div>
          <div className="streak-badge" aria-label={`${snap.streak} day streak`}>
            <b>🔥 {snap.streak}</b>
            <small>day streak</small>
          </div>
        </div>
        <PetScene />
      </div>

      <div className="stats">
        <div className="stat">
          <Ring value={(snap.score ?? 0) / 100} color={(snap.score ?? 0) >= 80 ? 'var(--good)' : 'var(--accent)'}>
            <b>{snap.score ?? '–'}</b>
          </Ring>
          <small>Today's score</small>
        </div>
        <div className="stat">
          <div className="stat__big" style={{ color: st.color }}>
            {st.icon} {Math.round(snap.condition)}
          </div>
          <small>{st.label}</small>
        </div>
        <div className="stat">
          <div className="stat__big">🔥 {snap.streak}</div>
          <small>Streak</small>
        </div>
        <div className="stat">
          <div className="stat__big">🎟️ {snap.credits}</div>
          <small>Credit min</small>
        </div>
      </div>

      <div className="card">
        <Meter
          value={next ? snap.qualifyingDays - prevAt : 1}
          max={next ? next - prevAt : 1}
          color="linear-gradient(90deg,#ffcf3f,#ff8a5c)"
          label={
            <>
              Stage {snap.stage} · <b>{STAGES[snap.stage - 1].name}</b>
            </>
          }
          sub={next ? `${snap.qualifyingDays}/${next} qualifying days` : 'Max stage reached'}
        />
        <div className="row muted small">
          <span>⭐ {fmt(snap.xp)} XP (permanent)</span>
          {snap.xpGained > 0 && <span className="good">+{snap.xpGained} today</span>}
        </div>
      </div>

      {snap.welcomeBack && !journey.days[day]?.welcomeBackDone && (
        <div className="card card--quest">
          <h4>👋 Welcome-back quest</h4>
          <p className="small">Same {journey.profile.petName}, same evolutions and outfits. Your streak reset — that's all. Start small:</p>
          <ul className="small">
            <li>Drink one glass of water</li>
            <li>Take a 2-minute stretch or walk</li>
          </ul>
          <button
            className="btn"
            onClick={() => {
              dispatch({ type: 'welcomeBack' });
              const water = journey.habits.find((h) => h.category === 'hydration');
              if (water) dispatch({ type: 'log', habitId: water.id, add: 250, source: isDemo ? 'demo' : 'manual' });
              ui.toast('Welcome back! +15 condition, +25 XP');
              ui.react('rejoice');
            }}
          >
            I did both — let's go
          </button>
        </div>
      )}

      {snap.shield !== 'off' && snap.shield !== 'normal' && (
        <button className={`banner banner--${snap.shield}`} onClick={() => ui.go(snap.shield === 'active' ? 'missions' : 'shield')}>
          {snap.shield === 'warning' && (
            <>
              <b>⚠️ Shield warning</b>
              <span>{snap.recentMisses} recent misses. One more and your chosen apps get shielded. Tap for options.</span>
            </>
          )}
          {snap.shield === 'active' && (
            <>
              <b>🛡️ Distraction Shield active</b>
              <span>Pick a quick recovery mission to earn your apps back →</span>
            </>
          )}
          {snap.shield === 'unlocked' && (
            <>
              <b>🔓 Access restored</b>
              <span>Recovery mission complete. Nice.</span>
            </>
          )}
        </button>
      )}

      <WeekDots />

      <div className="section-head">
        <h3>Today's routines</h3>
        <button className="link" onClick={() => ui.go('routines')}>
          Manage →
        </button>
      </div>
      {snap.status === 'rest' || snap.status === 'paused' ? (
        <div className="card muted small">
          {snap.status === 'rest' ? '🛋️ Planned rest day — nothing is scored today.' : '🤒 Paused (illness/travel) — no penalties, streak protected.'}
        </div>
      ) : scheduled.length === 0 ? (
        <div className="card muted small">Nothing scheduled today.</div>
      ) : (
        <div className="list list--card">
          {journey.habits.map((h, i) => (snap.habits[i]?.scheduled ? <HabitQuickRow key={h.id} habit={h} result={snap.habits[i]} /> : null))}
        </div>
      )}

      {snap.events.length > 0 && (
        <div className="card rules">
          <h4>
            Rules engine <Badge>deterministic</Badge>
          </h4>
          <ul className="small">
            {snap.events.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {!isDemo && (
        <div className="card">
          <div className="row">
            <div>
              <b>End of day</b>
              <p className="small muted">Close today and jump to tomorrow (simulated time jump). Penalties only apply to closed days.</p>
            </div>
            <button
              className="btn btn--ghost"
              onClick={() => {
                dispatch({ type: 'advanceDay' });
                ui.toast(`Day ${day + 1} closed · score ${snap.score ?? '—'}`);
              }}
            >
              Next day ⏭
            </button>
          </div>
        </div>
      )}
      {yesterday && isDemo && (
        <p className="tiny muted center">
          Yesterday: score {yesterday.score ?? '—'} · condition {Math.round(yesterday.condition)} → {Math.round(snap.condition)}
        </p>
      )}
    </div>
  );
}
