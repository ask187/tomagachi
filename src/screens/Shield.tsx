import { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import { useUI } from '../App';
import { ACCOUNTABILITY, ENTERTAINMENT_APPS, ESSENTIAL_APPS, RULES } from '../engine/config';
import { Badge, Modal, Segmented, Toggle, mmss } from '../components/ui';
import type { Accountability } from '../engine/types';

const FLOW = [
  { id: 'normal', label: 'Normal' },
  { id: 'warning', label: 'Warning' },
  { id: 'active', label: 'Shield' },
  { id: 'recovery', label: 'Recovery' },
  { id: 'unlocked', label: 'Unlocked' },
];

export default function Shield() {
  const { journey, snap, dispatch, state } = useStore();
  const ui = useUI();
  const prof = journey.profile;
  const acc = ACCOUNTABILITY[prof.accountability];
  const [locked, setLocked] = useState<string | null>(null);
  const [opened, setOpened] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const windowLeft = ui.unlockUntil ? Math.max(0, (ui.unlockUntil - now) / (state.prefs.demoSpeed ? 3000 : 60000)) : 0;
  const effective = snap.shield === 'active' && windowLeft > 0 ? 'unlocked' : snap.shield;
  const shieldOn = snap.shield !== 'off';
  const isLocked = (id: string) => effective === 'active' && prof.shield.apps.includes(id);

  return (
    <div className="screen">
      <div className="row">
        <h2>Distraction Shield</h2>
        <Badge tone="sim" title="Browsers cannot block other apps. On iOS this would use Screen Time / Family Controls entitlements; Android has its own APIs. Not promised as universally supported.">
          SIMULATED
        </Badge>
      </div>
      <p className="small muted">Opt-in. Only apps you pick. Essentials are never shielded, and an override is always available.</p>

      <div className="flow">
        {FLOW.map((f, i) => {
          const cur = (effective === "off" ? "normal" : effective) === f.id;
          return (
            <div key={f.id} className={`flow__step ${cur ? 'on' : ''}`}>
              <i>{i + 1}</i>
              <small>{f.label}</small>
            </div>
          );
        })}
      </div>
      <div className="small center muted">
        {shieldOn ? (
          <>
            {snap.recentMisses} miss{snap.recentMisses === 1 ? '' : 'es'} in last {acc.window} scored days · warning at {acc.warnAt}, shield at {acc.activeAt} ({acc.label})
          </>
        ) : (
          'Shield is off — you will only see gentle warnings.'
        )}
      </div>

      {/* Simulated phone home screen */}
      <div className={`mockphone ${effective === 'active' ? 'mockphone--shielded' : ''}`}>
        <div className="mockphone__status">
          <span>9:41</span>
          <span>
            {effective === 'active' && '🛡️ Shield on'}
            {effective === 'unlocked' && windowLeft > 0 && `🔓 ${mmss(windowLeft * 60)} earned time`}
            {effective === 'unlocked' && windowLeft === 0 && '🔓 Access restored'}
          </span>
        </div>
        <div className="mockphone__grid">
          {ENTERTAINMENT_APPS.map((a) => {
            const sel = prof.shield.apps.includes(a.id);
            const l = isLocked(a.id);
            return (
              <button key={a.id} className={`app ${l ? 'app--locked' : ''}`} onClick={() => (l ? setLocked(a.id) : setOpened(a.id))}>
                <span className="app__icon" style={{ background: a.color }}>
                  {a.icon}
                  {l && <em>🔒</em>}
                </span>
                <small>{a.name}</small>
                {sel && <i className="app__sel" title="Selected for shield" />}
              </button>
            );
          })}
        </div>
        <div className="mockphone__dock">
          {ESSENTIAL_APPS.map((a) => (
            <button key={a.id} className="app" onClick={() => ui.toast(`${a.name} is essential — never shielded.`)}>
              <span className="app__icon app__icon--ess">{a.icon}</span>
              <small>{a.name}</small>
            </button>
          ))}
        </div>
        <div className="tiny muted center">Dock = essential apps: always available</div>
      </div>

      {effective === 'active' && (
        <button className="btn btn--big btn--block" onClick={() => ui.go('missions')}>
          🏃 Choose a recovery mission
        </button>
      )}
      {snap.credits >= 15 && effective === 'active' && (
        <button
          className="btn btn--ghost btn--block"
          onClick={() => {
            dispatch({ type: 'spendCredits', minutes: 15 });
            ui.unlock(15);
            ui.toast('Spent 15 banked minutes');
          }}
        >
          🎟️ Spend 15 of {snap.credits} banked minutes
        </button>
      )}

      <div className="card">
        <h4>🎟️ Earned screen time</h4>
        <p className="small">
          <b>{snap.credits}</b> banked minutes (cap {RULES.creditCap}). Qualifying days earn {RULES.creditBase} min × streak multiplier (max ×{RULES.creditStreakMaxMultiplier}). Missions add more.
        </p>
      </div>

      <div className="card">
        <h4>Settings</h4>
        <Toggle
          checked={prof.shield.enabled}
          onChange={(v) => dispatch({ type: 'profile', patch: { shield: { ...prof.shield, enabled: v } } })}
          label="Enable Distraction Shield"
          desc="You can turn this off any time."
        />
        <div className="label">Apps to shield (entertainment only)</div>
        <div className="chips">
          {ENTERTAINMENT_APPS.map((a) => (
            <button
              key={a.id}
              className={`chip ${prof.shield.apps.includes(a.id) ? 'on' : ''}`}
              onClick={() =>
                dispatch({
                  type: 'profile',
                  patch: { shield: { ...prof.shield, apps: prof.shield.apps.includes(a.id) ? prof.shield.apps.filter((x) => x !== a.id) : [...prof.shield.apps, a.id] } },
                })
              }
            >
              {a.icon} {a.name}
            </button>
          ))}
        </div>
        <div className="label">Accountability</div>
        <Segmented<Accountability>
          value={prof.accountability}
          onChange={(v) => dispatch({ type: 'profile', patch: { accountability: v } })}
          options={(['gentle', 'balanced', 'strict'] as const).map((k) => ({ value: k, label: ACCOUNTABILITY[k].label }))}
        />
        <p className="tiny muted">{acc.desc}</p>
      </div>

      <LockedSheet appId={locked} onClose={() => setLocked(null)} />
      <Modal open={!!opened} onClose={() => setOpened(null)} title={ENTERTAINMENT_APPS.find((a) => a.id === opened)?.name}>
        <div className="fakeapp">
          <div className="fakeapp__feed">
            {[1, 2, 3].map((i) => (
              <div key={i} className="fakeapp__post" />
            ))}
          </div>
          <p className="small center">
            {effective === 'unlocked' ? 'Enjoy your earned time 🎉' : 'Not shielded right now.'} <Badge tone="sim">simulated app</Badge>
          </p>
        </div>
      </Modal>
    </div>
  );
}

function LockedSheet({ appId, onClose }: { appId: string | null; onClose: () => void }) {
  const { journey, snap, dispatch } = useStore();
  const ui = useUI();
  const acc = ACCOUNTABILITY[journey.profile.accountability];
  const [reflect, setReflect] = useState<number | null>(null);
  const [why, setWhy] = useState('');
  useEffect(() => {
    if (reflect === null || reflect <= 0) return;
    const id = setTimeout(() => setReflect((r) => (r ?? 0) - 1), 1000);
    return () => clearTimeout(id);
  }, [reflect]);
  useEffect(() => {
    if (!appId) {
      setReflect(null);
      setWhy('');
    }
  }, [appId]);
  const app = ENTERTAINMENT_APPS.find((a) => a.id === appId);
  return (
    <Modal open={!!appId} onClose={onClose} title={`${app?.icon} ${app?.name} is shielded`}>
      <p className="small">
        {journey.profile.petName} is sitting on this app. You missed {snap.recentMisses} recent routines — a tiny mission earns it back. <Badge tone="sim">simulated block</Badge>
      </p>
      <button
        className="btn btn--block"
        onClick={() => {
          onClose();
          ui.go('missions');
        }}
      >
        Pick a recovery mission
      </button>
      {reflect === null ? (
        <button className="btn btn--ghost btn--block" onClick={() => setReflect(acc.overrideCooldown)}>
          Override anyway
        </button>
      ) : (
        <div className="card">
          <p className="small">Quick reflection (optional): what do you need right now?</p>
          <input placeholder="e.g. I need to unwind for 10 min" value={why} onChange={(e) => setWhy(e.target.value)} />
          <button
            className="btn btn--ghost btn--block"
            disabled={reflect > 0}
            onClick={() => {
              dispatch({ type: 'override' });
              ui.unlock(15);
              ui.toast('Override used — no penalty. 15 min unlocked.');
              onClose();
            }}
          >
            {reflect > 0 ? `Override available in ${reflect}s` : 'Unlock for 15 minutes'}
          </button>
          <p className="tiny muted">Overrides are always available, never punished — just tracked so you can see your own patterns.</p>
        </div>
      )}
    </Modal>
  );
}
