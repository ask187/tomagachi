import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { useUI } from '../App';
import { ACCOUNTABILITY, RULES } from '../engine/config';
import { APP_CATALOG, PROTECTED_APPS, resolveApps, type ShieldApp } from '../engine/apps';
import { deviceApps, getShieldBridge, realShieldSettings } from '../platform/shieldBridge';
import { Badge, Modal, Segmented, Toggle, mmss } from '../components/ui';
import AppPicker from '../components/AppPicker';
import AppIcon from '../components/AppIcon';
import { EmergencyRequestFlow, RecoveryContactCard } from '../components/Emergency';
import type { Accountability } from '../engine/types';

// a real phone dock holds four apps; the full never-shielded list is in the app picker
const DOCK = ['phone', 'sos', 'messages', 'maps'].map((id) => PROTECTED_APPS.find((a) => a.id === id)!);

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
  const bridge = useMemo(getShieldBridge, []);
  const custom = prof.shield.custom ?? [];
  const shielded = resolveApps(prof.shield.apps, custom);
  const [locked, setLocked] = useState<ShieldApp | null>(null);
  const [opened, setOpened] = useState<ShieldApp | null>(null);
  const [picking, setPicking] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const windowLeft = ui.unlockUntil ? Math.max(0, (ui.unlockUntil - now) / (state.prefs.demoSpeed ? 3000 : 60000)) : 0;
  const effective = snap.shield === 'active' && windowLeft > 0 ? 'unlocked' : snap.shield;
  const shieldOn = snap.shield !== 'off';
  const isLocked = (id: string) => effective === 'active' && prof.shield.apps.includes(id);

  const unlock = (minutes: number, why: string) => {
    ui.unlock(minutes); // also lifts the real iPhone shield when running natively
    ui.toast(why);
  };

  // home screen: the user's shielded apps first, padded with a few others so it looks like a phone
  const homeApps = [...shielded, ...APP_CATALOG.filter((a) => !prof.shield.apps.includes(a.id))].slice(0, Math.max(6, Math.min(9, shielded.length + 3)));

  return (
    <div className="screen">
      <div className="row">
        <h2>Distraction Shield</h2>
        <Badge
          tone={bridge.mode === 'native' ? 'real' : 'sim'}
          title="Browsers cannot block other apps. The phone app uses iOS Screen Time or Android usage access."
        >
          {bridge.mode === 'native' ? 'ON-DEVICE' : 'SIMULATED'}
        </Badge>
      </div>
      <p className="small muted">Opt-in. Only apps you pick. Essentials are never shielded, and you always have a way back in.</p>

      <div className="flow">
        {FLOW.map((f, i) => (
          <div key={f.id} className={`flow__step ${(effective === 'off' ? 'normal' : effective) === f.id ? 'on' : ''}`}>
            <i>{i + 1}</i>
            <small>{f.label}</small>
          </div>
        ))}
      </div>
      <div className="small center muted">
        {shieldOn ? (
          <>
            {snap.recentMisses} miss{snap.recentMisses === 1 ? '' : 'es'} in last {acc.window} scored days · warning at {acc.warnAt}, shield at {acc.activeAt} ({acc.label})
          </>
        ) : prof.shield.apps.length === 0 ? (
          'Pick at least one app below to turn the shield on.'
        ) : (
          'Shield is off — you will only see gentle warnings.'
        )}
      </div>

      {/* Phone home screen (simulated in the browser) */}
      <div className={`mockphone ${effective === 'active' ? 'mockphone--shielded' : ''}`}>
        <div className="mockphone__status">
          <span>9:41</span>
          <span>
            {effective === 'active' && '🛡️ Shield on'}
            {effective === 'unlocked' && windowLeft > 0 && `🔓 ${mmss(windowLeft * 60)} unlocked`}
            {effective === 'unlocked' && windowLeft === 0 && '🔓 Access restored'}
          </span>
        </div>
        <div className="mockphone__grid">
          {homeApps.map((a) => {
            const sel = prof.shield.apps.includes(a.id);
            const l = isLocked(a.id);
            return (
              <button key={a.id} className={`app ${l ? 'app--locked' : ''}`} onClick={() => (l ? setLocked(a) : setOpened(a))}>
                <AppIcon id={a.id} icon={a.icon} color={a.color} className="app__icon">
                  {l && <em>🔒</em>}
                </AppIcon>
                <small>{a.name}</small>
                {sel && <i className="app__sel" title="On your shield list" />}
              </button>
            );
          })}
        </div>
        <div className="mockphone__dock">
          {DOCK.map((a) => (
            <button key={a.id} className="app" onClick={() => ui.toast(`${a.name} is essential — never shielded.`)}>
              <AppIcon id={a.id} icon={a.icon} color="rgba(255,255,255,0.92)" className="app__icon app__icon--ess" />
              <small>{a.name.replace('Emergency ', '')}</small>
            </button>
          ))}
        </div>
        <div className="tiny center mockphone__note">Dock = essential apps (calls, SOS, messages, maps, health, work): always open</div>
      </div>

      {effective === 'active' && (
        <>
          <button className="btn btn--big btn--block" onClick={() => ui.go('missions')}>
            🏃 Choose a recovery mission
          </button>
          {snap.credits >= 15 && (
            <button
              className="btn btn--ghost btn--block"
              onClick={() => {
                dispatch({ type: 'spendCredits', minutes: 15 });
                unlock(15, 'Spent 15 banked minutes');
              }}
            >
              🎟️ Spend 15 of {snap.credits} banked minutes
            </button>
          )}
          {prof.recovery?.status === 'active' && (
            <button className="btn btn--ghost btn--block" onClick={() => setEmergency(true)}>
              🚨 Ask {prof.recovery.name} for emergency access
            </button>
          )}
        </>
      )}

      {bridge.mode === 'native' && <RealShieldCard />}

      <div className="card">
        <div className="row">
          <h4>Apps on my shield</h4>
          <button className="btn btn--sm" onClick={() => setPicking(true)}>
            {shielded.length ? 'Edit apps' : '+ Add apps'}
          </button>
        </div>
        {shielded.length === 0 ? (
          <p className="small muted">No apps yet. Add the ones that steal your time — from your phone or by name.</p>
        ) : (
          <div className="shield-list">
            {shielded.map((a) => (
              <span key={a.id} className="shield-app">
                <AppIcon id={a.id} icon={a.icon} color={a.color} className="shield-app__icon" />
                {a.name}
                <button
                  className="shield-app__x"
                  aria-label={`Remove ${a.name}`}
                  onClick={() => dispatch({ type: 'profile', patch: { shield: { ...prof.shield, apps: prof.shield.apps.filter((x) => x !== a.id) } } })}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
        <Toggle
          checked={prof.shield.enabled}
          onChange={(v) => dispatch({ type: 'profile', patch: { shield: { ...prof.shield, enabled: v } } })}
          label="Enable Distraction Shield"
          desc="You can turn this off any time."
        />
        <div className="label">Accountability</div>
        <Segmented<Accountability>
          value={prof.accountability}
          onChange={(v) => dispatch({ type: 'profile', patch: { accountability: v } })}
          options={(['gentle', 'balanced', 'strict'] as const).map((k) => ({ value: k, label: ACCOUNTABILITY[k].label }))}
        />
        <p className="tiny muted">{acc.desc}</p>
      </div>

      <RecoveryContactCard />

      <div className="card">
        <h4>🎟️ Earned screen time</h4>
        <p className="small">
          <b>{snap.credits}</b> banked minutes (cap {RULES.creditCap}). Qualifying days earn {RULES.creditBase} min × streak multiplier (max ×{RULES.creditStreakMaxMultiplier}). Missions add more.
        </p>
      </div>

      <Modal open={picking} onClose={() => setPicking(false)} title="Choose apps to shield">
        <AppPicker
          selected={prof.shield.apps}
          custom={custom}
          onChange={(apps, c) => dispatch({ type: 'profile', patch: { shield: { ...prof.shield, apps, custom: c } } })}
        />
        <button className="btn btn--block" onClick={() => setPicking(false)}>
          Done · {prof.shield.apps.length} app{prof.shield.apps.length === 1 ? '' : 's'}
        </button>
      </Modal>

      <LockedSheet app={locked} onClose={() => setLocked(null)} onEmergency={() => setEmergency(true)} onOverride={() => unlock(15, 'Override used — no penalty. 15 min unlocked.')} />
      <EmergencyRequestFlow
        open={emergency}
        onClose={() => setEmergency(false)}
        onUnlocked={(m) => {
          unlock(m, `🚨 Emergency access approved: ${m} min`);
          setEmergency(false);
        }}
      />

      <Modal open={!!opened} onClose={() => setOpened(null)} title={opened?.name ?? ''}>
        <div className="fakeapp">
          <div className="fakeapp__feed">
            {[1, 2, 3].map((i) => (
              <div key={i} className="fakeapp__post" />
            ))}
          </div>
          <p className="small center">
            {effective === 'unlocked' ? 'Enjoy your earned time 🎉' : 'Not shielded right now.'} <Badge tone="sim">placeholder screen</Badge>
          </p>
        </div>
      </Modal>
    </div>
  );
}

function LockedSheet({ app, onClose, onEmergency, onOverride }: { app: ShieldApp | null; onClose: () => void; onEmergency: () => void; onOverride: () => void }) {
  const { journey, snap, dispatch } = useStore();
  const ui = useUI();
  const prof = journey.profile;
  const contact = prof.recovery?.status === 'active' ? prof.recovery : undefined;
  const acc = ACCOUNTABILITY[prof.accountability];
  // with a recovery contact set, the self-override still exists but waits longer
  const cooldown = contact ? Math.max(60, acc.overrideCooldown * 3) : acc.overrideCooldown;
  const [reflect, setReflect] = useState<number | null>(null);
  const [why, setWhy] = useState('');
  useEffect(() => {
    if (reflect === null || reflect <= 0) return;
    const id = setTimeout(() => setReflect((r) => (r ?? 0) - 1), 1000);
    return () => clearTimeout(id);
  }, [reflect]);
  useEffect(() => {
    if (!app) {
      setReflect(null);
      setWhy('');
    }
  }, [app]);
  return (
    <Modal open={!!app} onClose={onClose} title={`${app?.name} is shielded`}>
      <p className="small">
        {prof.petName} is sitting on this app. You missed {snap.recentMisses} recent routines — a tiny mission earns it back. <Badge tone="sim">simulated block</Badge>
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
      {contact ? (
        <button
          className="btn btn--ghost btn--block"
          onClick={() => {
            onClose();
            onEmergency();
          }}
        >
          🚨 Emergency? Ask {contact.name}
        </button>
      ) : (
        <p className="tiny muted">Tip: add a recovery contact on the Shield screen for emergency access.</p>
      )}
      {reflect === null ? (
        <button className="link small" onClick={() => setReflect(cooldown)}>
          {contact ? `Can't reach ${contact.name}? Override anyway` : 'Override anyway'}
        </button>
      ) : (
        <div className="card">
          <p className="small">Quick reflection (optional): what do you need right now?</p>
          <input id="override-why" placeholder="e.g. I need to unwind for 10 min" value={why} onChange={(e) => setWhy(e.target.value)} />
          <button
            className="btn btn--ghost btn--block"
            disabled={reflect > 0}
            onClick={() => {
              dispatch({ type: 'override' });
              onOverride();
              onClose();
            }}
          >
            {reflect > 0 ? `Override available in ${reflect}s` : 'Unlock for 15 minutes'}
          </button>
          <p className="tiny muted">You're never locked out for good — overrides are tracked, never punished.</p>
        </div>
      )}
    </Modal>
  );
}

/** iPhone app only: shows whether real apps are being blocked, and demo test buttons. */
function RealShieldCard() {
  const { state, dispatch, journey, isDemo, snap } = useStore();
  const ui = useUI();
  const device = deviceApps(realShieldSettings(state.live, journey.profile.shield));
  const tokens = device.map((a) => a.token!);
  const enforcing = !isDemo || !!state.prefs.realShieldInDemo;
  const test = (on: boolean) =>
    window.HabitPetNative?.setShield(on, tokens)
      .then(() => ui.toast(on ? '🛡️ Real apps blocked — try opening one' : '🔓 Real apps unblocked'))
      .catch((e: Error) => ui.toast(`Screen Time error: ${e.message}`));
  return (
    <div className="card">
      <div className="row">
        <h4>📱 Real apps on this iPhone</h4>
        <Badge tone="real">Screen Time</Badge>
      </div>
      <p className="small">
        {device.length === 0
          ? isDemo && state.live
            ? 'Pick phone apps on your own pet first (switch to My live pet ▸ Edit apps ▸ Choose installed apps). The demo uses those.'
            : 'No phone apps picked yet. Tap Edit apps ▸ Choose installed apps.'
          : `${device.length} app${device.length > 1 ? 's' : ''} from this phone. ${enforcing ? (snap.shield === 'active' ? 'Blocked right now.' : 'Will be blocked when the shield turns on.') : 'Not blocked during the demo journey.'}`}
      </p>
      {isDemo && (
        <Toggle
          checked={!!state.prefs.realShieldInDemo}
          onChange={(v) => dispatch({ type: 'prefs', patch: { realShieldInDemo: v } })}
          label="Block real apps during the demo"
          desc="When the Time Machine shows the shield, your real apps get blocked too."
        />
      )}
      <div className="row gap wrap">
        <button className="btn btn--sm" disabled={!device.length} onClick={() => test(true)}>
          Block now (test)
        </button>
        <button className="btn btn--sm btn--ghost" onClick={() => test(false)}>
          Unblock now
        </button>
      </div>
      <p className="tiny muted">Essential apps can't be blocked. Unlocks re-lock in the background after at least 15 min (an iOS limit), or right away when you return to HabitPet.</p>
    </div>
  );
}
