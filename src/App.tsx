import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useStore } from './state/store';
import type { Reaction } from './components/Pet';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import Routines from './screens/Routines';
import Shield from './screens/Shield';
import Missions from './screens/Missions';
import Wardrobe from './screens/Wardrobe';
import Insights from './screens/Insights';
import Settings from './screens/Settings';
import Friends from './screens/Friends';
import TimeMachine from './screens/TimeMachine';
import EvolutionReveal from './components/EvolutionReveal';
import { Badge, Confetti } from './components/ui';
import { STORYBOARD } from './engine/scenarios';
import { WEEKDAYS } from './engine/config';

export type Screen = 'home' | 'routines' | 'shield' | 'missions' | 'pet' | 'insights' | 'settings' | 'friends';

interface UICtx {
  screen: Screen;
  go: (s: Screen) => void;
  reaction: Reaction;
  reactionKey: number;
  react: (r: Reaction, ms?: number) => void;
  toast: (msg: string) => void;
  confetti: () => void;
  unlockUntil: number | null;
  unlock: (minutes: number) => void;
  lock: () => void;
  openOnboarding: () => void;
  revealEvolution: (from: number, to: number) => void;
  startPresenter: () => void;
}

const UI = createContext<UICtx | null>(null);
export const useUI = () => useContext(UI)!;

const NAV: { id: Screen; icon: string; label: string }[] = [
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'routines', icon: '✅', label: 'Routines' },
  { id: 'shield', icon: '🛡️', label: 'Shield' },
  { id: 'pet', icon: '✨', label: 'Evolve' },
  { id: 'insights', icon: '📊', label: 'Insights' },
];

export default function App() {
  const { state, dispatch, snap, journey, isDemo, day } = useStore();
  const [screen, setScreen] = useState<Screen>('home');
  const [reaction, setReaction] = useState<Reaction>(null);
  const [reactionKey, setReactionKey] = useState(0);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const [confettiKey, setConfettiKey] = useState(0);
  const [unlockUntil, setUnlockUntil] = useState<number | null>(null);
  const [onboarding, setOnboarding] = useState(!state.onboarded);
  const [evo, setEvo] = useState<{ from: number; to: number } | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [presenter, setPresenter] = useState<number | null>(null);
  const reactTimer = useRef<number>();

  const react = useCallback((r: Reaction, ms = 2200) => {
    setReaction(r);
    setReactionKey((k) => k + 1);
    window.clearTimeout(reactTimer.current);
    reactTimer.current = window.setTimeout(() => setReaction(null), ms);
  }, []);
  const toast = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  const confetti = useCallback(() => setConfettiKey((k) => k + 1), []);
  const go = useCallback((s: Screen) => {
    setScreen(s);
    document.querySelector('.phone__screen')?.scrollTo({ top: 0 });
  }, []);

  // ---- automatic pet reactions + evolution reveal when the derived state changes ----
  const journeyKey = isDemo ? `demo:${state.demo.scenarioId}` : 'live';
  const prev = useRef({ key: journeyKey, day, stage: snap.stage, cond: snap.condition, score: snap.score ?? 0, missions: snap.missionsDone });
  useEffect(() => {
    const p = prev.current;
    const cur = { key: journeyKey, day, stage: snap.stage, cond: snap.condition, score: snap.score ?? 0, missions: snap.missionsDone };
    prev.current = cur;
    if (p.key !== cur.key) return;
    if (cur.stage > p.stage) {
      setEvo({ from: p.stage, to: cur.stage });
      return;
    }
    if (cur.missions > p.missions && p.day === cur.day) return react('refreshed');
    if (p.day === cur.day) {
      if (cur.score >= 100 && p.score < 100) {
        confetti();
        return react('celebrate', 2600);
      }
      if (cur.score > p.score) return react('rejoice', 1500);
      return;
    }
    const d = cur.cond - p.cond;
    if (d >= 8) react('rejoice');
    else if (d <= -8) react(snap.condition < 35 ? 'facepalm' : 'sigh');
  }, [journeyKey, day, snap.stage, snap.condition, snap.score, snap.missionsDone, react, confetti]);

  // shield unlock window expiry
  useEffect(() => {
    if (!unlockUntil) return;
    const id = setInterval(() => {
      if (Date.now() >= unlockUntil) {
        setUnlockUntil(null);
        toast('⏰ Earned time is up — apps shielded again.');
      }
    }, 500);
    return () => clearInterval(id);
  }, [unlockUntil, toast]);
  useEffect(() => setUnlockUntil(null), [day, journeyKey]);

  const unlock = useCallback(
    (minutes: number) => setUnlockUntil(Date.now() + minutes * (state.prefs.demoSpeed ? 3000 : 60000)),
    [state.prefs.demoSpeed],
  );

  const runScene = useCallback(
    (i: number) => {
      const sc = STORYBOARD[i];
      if (state.demo.scenarioId !== 'hero' || !isDemo) dispatch({ type: 'loadScenario', id: 'hero' });
      setTimeout(() => {
        dispatch({ type: 'setViewDay', day: sc.day });
        go(sc.screen as Screen);
      }, 30);
      setPresenter(i);
    },
    [dispatch, go, isDemo, state.demo.scenarioId],
  );

  const ctx: UICtx = {
    screen,
    go,
    reaction,
    reactionKey,
    react,
    toast,
    confetti,
    unlockUntil,
    unlock,
    lock: () => setUnlockUntil(null),
    openOnboarding: () => setOnboarding(true),
    revealEvolution: (from, to) => setEvo({ from, to }),
    startPresenter: () => runScene(0),
  };

  const page = {
    home: <Home />,
    routines: <Routines />,
    shield: <Shield />,
    missions: <Missions />,
    pet: <Wardrobe />,
    insights: <Insights />,
    settings: <Settings />,
    friends: <Friends />,
  }[screen];

  return (
    <UI.Provider value={ctx}>
      <div className={`shell ${state.prefs.reducedMotion ? 'reduce-motion' : ''}`}>
        <section className="stage">
          <div className="brand">
            <span className="brand__logo">🐾</span>
            <div>
              <b>HabitPet</b>
              <small>Raise your pet. Raise your standards.</small>
            </div>
          </div>
          <div className="phone">
            <div className="phone__notch" />
            {onboarding ? (
              <Onboarding
                onDone={() => {
                  setOnboarding(false);
                  go('home');
                }}
                onSkip={() => {
                  setOnboarding(false);
                  dispatch({ type: 'loadScenario', id: 'hero' });
                  go('home');
                }}
                canCancel={state.onboarded}
              />
            ) : (
              <>
                <header className="topbar">
                  <div>
                    <div className="topbar__title">
                      {journey.profile.petName}
                      <span className="muted"> · Day {day + 1} · {WEEKDAYS[snap.weekday]}</span>
                    </div>
                    <div className="topbar__badges">
                      {isDemo ? <Badge tone="demo">DEMO DATA</Badge> : <Badge tone="real">LIVE</Badge>}
                      {snap.status === 'rest' && <Badge tone="good">Rest day</Badge>}
                      {snap.status === 'paused' && <Badge tone="good">Paused</Badge>}
                    </div>
                  </div>
                  <div className="topbar__actions">
                    <button className="icon-btn" onClick={() => go('friends')} aria-label="Friends">
                      👥
                    </button>
                    <button className="icon-btn" onClick={() => go('settings')} aria-label="Settings">
                      ⚙️
                    </button>
                  </div>
                </header>
                <main className="phone__screen" key={screen}>
                  {page}
                </main>
                <nav className="tabbar">
                  {NAV.map((n) => (
                    <button key={n.id} className={screen === n.id || (n.id === 'shield' && screen === 'missions') ? 'on' : ''} onClick={() => go(n.id)}>
                      <span>{n.icon}</span>
                      <small>{n.label}</small>
                      {n.id === 'shield' && (snap.shield === 'active' || snap.shield === 'warning') && <i className={`dot dot--${snap.shield}`} />}
                    </button>
                  ))}
                </nav>
              </>
            )}
            <div className="toasts">
              {toasts.map((t) => (
                <div key={t.id} className="toast">
                  {t.msg}
                </div>
              ))}
            </div>
            {confettiKey > 0 && !state.prefs.reducedMotion && <Confetti key={confettiKey} />}
            {evo && <EvolutionReveal from={evo.from} to={evo.to} onClose={() => setEvo(null)} />}
          </div>
        </section>

        <aside className={`panel ${panelOpen ? 'panel--open' : ''}`}>
          <button className="panel__close icon-btn" onClick={() => setPanelOpen(false)} aria-label="Close demo panel">
            ✕
          </button>
          <TimeMachine onScene={runScene} presenter={presenter} />
        </aside>
        <button className="panel-fab" onClick={() => setPanelOpen(true)}>
          ⏱ Time Machine
        </button>

        {presenter !== null && (
          <div className="presenter">
            <div className="presenter__scene">
              Scene {STORYBOARD[presenter].scene}/6 · <b>{STORYBOARD[presenter].title}</b>
            </div>
            <p>{STORYBOARD[presenter].line}</p>
            <div className="presenter__btns">
              <button className="btn btn--ghost" disabled={presenter === 0} onClick={() => runScene(presenter - 1)}>
                ← Back
              </button>
              {presenter < STORYBOARD.length - 1 ? (
                <button className="btn" onClick={() => runScene(presenter + 1)}>
                  Next scene →
                </button>
              ) : (
                <button className="btn" onClick={() => setPresenter(null)}>
                  Finish
                </button>
              )}
              <button className="icon-btn" onClick={() => setPresenter(null)} aria-label="Exit presenter">
                ✕
              </button>
            </div>
            {presenter === STORYBOARD.length - 1 && (
              <p className="presenter__close">“Your phone already knows how much time you spend looking at it. HabitPet helps you spend more time looking after yourself.”</p>
            )}
          </div>
        )}
      </div>
    </UI.Provider>
  );
}
