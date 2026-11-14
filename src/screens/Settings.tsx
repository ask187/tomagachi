import { useStore } from '../state/store';
import { useUI } from '../App';
import { Badge, Toggle } from '../components/ui';
import { PET_COLORS, petSwatch } from '../components/Pet';
import { WEEKDAYS } from '../engine/config';

export default function Settings() {
  const { state, dispatch, journey, isDemo } = useStore();
  const ui = useUI();
  const p = journey.profile;

  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'habitpet-data.json';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      ui.toast('Export not available here');
    }
  };

  return (
    <div className="screen">
      <h2>Settings & privacy</h2>

      <div className="card">
        <h4>Your pet {isDemo && <Badge tone="demo">editing demo</Badge>}</h4>
        <label className="form">
          Name
          <input value={p.petName} maxLength={16} onChange={(e) => dispatch({ type: 'profile', patch: { petName: e.target.value } })} />
        </label>
        <div className="swatches">
          {PET_COLORS.map((c) => (
            <button key={c} className={`swatch ${p.petColor === c ? 'on' : ''}`} style={{ background: petSwatch(c) }} onClick={() => dispatch({ type: 'profile', patch: { petColor: c } })} aria-label={c} />
          ))}
        </div>
        <div className="label">Planned rest days</div>
        <div className="chips">
          {WEEKDAYS.map((d, i) => (
            <button
              key={d}
              className={`chip ${p.restDays.includes(i) ? 'on' : ''}`}
              onClick={() => dispatch({ type: 'profile', patch: { restDays: p.restDays.includes(i) ? p.restDays.filter((x) => x !== i) : [...p.restDays, i] } })}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h4>Experience</h4>
        <Toggle checked={state.prefs.reducedMotion} onChange={(v) => dispatch({ type: 'prefs', patch: { reducedMotion: v } })} label="Reduce motion" desc="Calmer pet, no confetti." />
        <Toggle checked={state.prefs.captions} onChange={(v) => dispatch({ type: 'prefs', patch: { captions: v } })} label="Pet captions" desc="Narration of your pet's antics. The pet itself never talks." />
        <Toggle checked={state.prefs.demoSpeed} onChange={(v) => dispatch({ type: 'prefs', patch: { demoSpeed: v } })} label="Demo speed timers" desc="1 minute ≈ 3 seconds. Clearly labelled when on." />
      </div>

      <div className="card">
        <h4>🔒 Privacy</h4>
        <ul className="small">
          <li>Everything is stored only in this browser (localStorage). No account, no server, no tracking.</li>
          <li>Step counting runs on-device; only the step count is saved.</li>
          <li>Photo check-ins are never stored — only the fact that one was made.</li>
          <li>Insights are computed locally from your logs; you can review and delete what's remembered in Insights.</li>
          <li>Friends would only ever see opted-in achievements — never raw health data.</li>
        </ul>
        <div className="row gap wrap">
          <button className="btn btn--ghost btn--sm" onClick={exportData}>
            Export my data
          </button>
          <button
            className="btn btn--ghost btn--sm btn--danger"
            onClick={() => {
              if (confirm('Delete all HabitPet data on this device? Your pet will start over.')) {
                dispatch({ type: 'reset' });
                ui.openOnboarding();
              }
            }}
          >
            Delete all data
          </button>
        </div>
      </div>

      <div className="card">
        <h4>About this build</h4>
        <ul className="small">
          <li>
            <Badge tone="real">Real</Badge> rules engine, scoring, streaks, XP, evolution, timers, on-device step sensor (phones).
          </li>
          <li>
            <Badge tone="sim">Simulated</Badge> app blocking (needs OS entitlements), "simulate" sensor buttons, time jumps.
          </li>
          <li>
            <Badge tone="demo">Demo data</Badge> Time Machine scenarios and sample friends.
          </li>
        </ul>
        <button className="btn btn--ghost btn--sm" onClick={ui.openOnboarding}>
          {state.live ? 'Re-run onboarding (new pet)' : 'Create your own pet'}
        </button>
      </div>
    </div>
  );
}
