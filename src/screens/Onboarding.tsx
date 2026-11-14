import { useState } from 'react';
import { useStore } from '../state/store';
import Pet, { PET_COLORS, petSwatch } from '../components/Pet';
import { ACCOUNTABILITY, ALL_DAYS, HABIT_TEMPLATES, WEEKDAYS, habitFromTemplate } from '../engine/config';
import AppPicker from '../components/AppPicker';
import AppleHealthCard from '../components/AppleHealthCard';
import SpeciesPicker from '../components/SpeciesPicker';
import { SPECIES, type Species } from '../engine/species';
import type { ShieldApp } from '../engine/apps';
import { Badge, Confetti, Segmented, Toggle } from '../components/ui';
import { usePedometer } from '../components/usePedometer';
import type { Accountability, HabitCategory, PetColor } from '../engine/types';

type Level = 'starting' | 'some' | 'active';

// "AI-recommended" starting goals: conservative, ability-aware, always editable (spec §10.3).
const SUGGEST: Record<Level, Partial<Record<HabitCategory, { target: number; days?: number[] }>>> = {
  starting: { steps: { target: 5000 }, exercise: { target: 15, days: [1, 3, 5] }, hydration: { target: 1500 }, sleep: { target: 7.5 }, mindfulness: { target: 5 }, reading: { target: 10 }, nutrition: { target: 1 }, study: { target: 25 } },
  some: { steps: { target: 8000 }, exercise: { target: 30, days: [1, 3, 5, 6] }, hydration: { target: 2000 }, sleep: { target: 7.5 }, mindfulness: { target: 10 }, reading: { target: 20 }, nutrition: { target: 1 }, study: { target: 50 } },
  active: { steps: { target: 10000 }, exercise: { target: 40, days: [1, 2, 4, 5, 6] }, hydration: { target: 2500 }, sleep: { target: 8 }, mindfulness: { target: 10 }, reading: { target: 30 }, nutrition: { target: 1 }, study: { target: 75 } },
};

const STEPS = ['Welcome', 'Hatch', 'Habits', 'Goals', 'Rest', 'Data', 'Shield', 'Meet'];

export default function Onboarding({ onDone, onSkip, canCancel }: { onDone: () => void; onSkip: () => void; canCancel: boolean }) {
  const { dispatch } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('Mochi');
  const [color, setColor] = useState<PetColor>('violet');
  const [species, setSpecies] = useState<Species>('mochi');
  const [picked, setPicked] = useState<HabitCategory[]>(['steps', 'hydration', 'exercise', 'sleep']);
  const [level, setLevel] = useState<Level>('some');
  const [targets, setTargets] = useState<Partial<Record<HabitCategory, number>>>({});
  const [restDays, setRestDays] = useState<number[]>([0]);
  const [shieldOn, setShieldOn] = useState(true);
  const [apps, setApps] = useState<string[]>(['tiktok', 'instagram']);
  const [customApps, setCustomApps] = useState<ShieldApp[]>([]);
  const [acc, setAcc] = useState<Accountability>('balanced');
  const ped = usePedometer();

  const tFor = (c: HabitCategory) => targets[c] ?? SUGGEST[level][c]?.target ?? HABIT_TEMPLATES.find((t) => t.category === c)!.target;

  const finish = () => {
    const habits = picked.map((c) => {
      const t = HABIT_TEMPLATES.find((x) => x.category === c)!;
      return habitFromTemplate(t, {
        id: c,
        schedule: SUGGEST[level][c]?.days ?? ALL_DAYS,
        versions: [{ fromDay: 0, target: tFor(c), slot: 'any' }],
      });
    });
    dispatch({
      type: 'finishOnboarding',
      profile: { petName: name.trim() || SPECIES[species].defaultName, species, petColor: color, accountability: acc, shield: { enabled: shieldOn, apps, custom: customApps }, startWeekday: new Date().getDay(), restDays },
      habits,
    });
    onDone();
  };

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const valid = step !== 2 || picked.length >= 1;

  return (
    <div className="onb">
      {step > 0 && (
        <div className="onb__progress">
          {STEPS.slice(1).map((s, i) => (
            <i key={s} className={i < step ? 'on' : ''} />
          ))}
        </div>
      )}
      <div className="onb__body">
        {step === 0 && (
          <div className="onb__welcome">
            <div className="onb__hero">
              <Pet color="violet" stage={2} condition="thriving" head="bow" reaction="rejoice" reactionKey={1} />
            </div>
            <h1>HabitPet</h1>
            <p className="tagline">Raise your pet. Raise your standards.</p>
            <p className="small">
              Your real-world habits shape one lifelong companion — its mood, its room, and how it evolves. Optional Distraction Shield links your scroll apps to tiny recovery missions.
            </p>
            <button className="btn btn--big btn--block" onClick={next}>
              🥚 Hatch my pet
            </button>
            <button className="btn btn--ghost btn--block" onClick={onSkip}>
              ⏱ Explore the 30-day demo journey
            </button>
            {canCancel && (
              <button className="link small" onClick={onDone}>
                Cancel
              </button>
            )}
          </div>
        )}

        {step === 1 && (
          <>
            <h2>Choose your companion</h2>
            <SpeciesPicker
              value={species}
              color={color}
              onChange={(sp) => {
                setSpecies(sp);
                setColor(SPECIES[sp].defaultColor);
                if (!name.trim() || Object.values(SPECIES).some((x) => x.defaultName === name)) setName(SPECIES[sp].defaultName);
              }}
            />
            <div className="onb__pet onb__pet--small">
              <Pet color={color} species={species} stage={1} condition="thriving" />
            </div>
            <label className="form">
              Name (optional)
              <input value={name} maxLength={16} onChange={(e) => setName(e.target.value)} />
            </label>
            <div className="swatches">
              {PET_COLORS.map((c) => (
                <button key={c} className={`swatch ${color === c ? 'on' : ''}`} style={{ background: petSwatch(c) }} onClick={() => setColor(c)} aria-label={c} />
              ))}
            </div>
            <p className="tiny muted center">Funny, mischievous, a little sarcastic. Communicates only with faces and gestures.</p>
          </>
        )}

        {step === 2 && (
          <>
            <h2>What do you want to build?</h2>
            <p className="small muted">Pick 3+ for the best experience. You can add custom ones later.</p>
            <div className="tpl-grid">
              {HABIT_TEMPLATES.map((t) => (
                <button key={t.category} className={`tpl ${picked.includes(t.category) ? 'on' : ''}`} onClick={() => setPicked((p) => (p.includes(t.category) ? p.filter((x) => x !== t.category) : [...p, t.category]))}>
                  <span>{t.icon}</span>
                  <b>{t.name}</b>
                  <small>{t.hint}</small>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Set your goals</h2>
            <div className="label">How active are you lately?</div>
            <Segmented<Level>
              value={level}
              onChange={(l) => {
                setLevel(l);
                setTargets({});
              }}
              options={[
                { value: 'starting', label: 'Just starting' },
                { value: 'some', label: 'Somewhat' },
                { value: 'active', label: 'Very active' },
              ]}
            />
            <p className="tiny muted">
              <Badge tone="ai">✨ AI-suggested</Badge> starting points — achievable, not prescriptions. Edit anything.
            </p>
            <div className="list">
              {picked.map((c) => {
                const t = HABIT_TEMPLATES.find((x) => x.category === c)!;
                const days = SUGGEST[level][c]?.days;
                const edited = targets[c] !== undefined;
                return (
                  <div key={c} className="goal-row">
                    <span className="habit__icon">{t.icon}</span>
                    <div className="grow">
                      <b>{t.name}</b>
                      <small className="muted">
                        {days ? days.map((d) => WEEKDAYS[d]).join(' · ') : 'Every day'} {!edited && <Badge tone="ai">suggested</Badge>}
                      </small>
                    </div>
                    <input type="number" min={t.step} step={t.step} value={tFor(c)} onChange={(e) => setTargets({ ...targets, [c]: Number(e.target.value) })} />
                    <small className="muted unit">{t.unit === 'done' ? '✓' : t.unit}</small>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2>Rest is part of the plan</h2>
            <p className="small muted">Planned rest days are excluded from scoring. Sick or travelling? Pause any day — no penalties, streak protected.</p>
            <div className="chips center">
              {WEEKDAYS.map((d, i) => (
                <button key={d} className={`chip ${restDays.includes(i) ? 'on' : ''}`} onClick={() => setRestDays((r) => (r.includes(i) ? r.filter((x) => x !== i) : [...r, i]))}>
                  {d}
                </button>
              ))}
            </div>
            <div className="card small">
              <b>Our promises</b>
              <ul>
                <li>Your pet can get grumpy — it can never die or lose its evolutions.</li>
                <li>Missing data (sync failure) is “unknown”, not a miss.</li>
                <li>Goals adapt with your approval when they're too hard or too easy.</li>
              </ul>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h2>Connect health data</h2>
            <div className="card">
              <div className="row">
                <div>
                  <b>📱 On-device step sensor</b>
                  <p className="tiny muted">Uses this phone's motion sensor. Only the step count is kept.</p>
                </div>
                <button className="btn btn--sm" disabled={ped.perm === 'unsupported' || ped.perm === 'granted'} onClick={() => ped.start().then(() => ped.stop())}>
                  {ped.perm === 'granted' ? 'Allowed ✓' : ped.perm === 'unsupported' ? 'Not available' : 'Allow'}
                </button>
              </div>
            </div>
            <div className="card">
              <b>✍️ Manual & timer tracking</b> <Badge>Always on</Badge>
              <p className="tiny muted">Log water, sleep and anything else with one tap; timers verify workouts, reading and meditation.</p>
            </div>
            <AppleHealthCard />
          </>
        )}

        {step === 6 && (
          <>
            <h2>Distraction Shield</h2>
            <p className="small muted">Optional. After several missed routines, apps you choose get shielded until you finish a tiny recovery mission.</p>
            <Toggle checked={shieldOn} onChange={setShieldOn} label="Enable Distraction Shield" desc="You can turn it off anytime." />
            {shieldOn && (
              <>
                <div className="label">Which apps distract you?</div>
                <AppPicker
                  selected={apps}
                  custom={customApps}
                  onChange={(sel, c) => {
                    setApps(sel);
                    setCustomApps(c);
                  }}
                />
                <div className="label">Accountability</div>
                <Segmented<Accountability> value={acc} onChange={setAcc} options={(['gentle', 'balanced', 'strict'] as const).map((k) => ({ value: k, label: ACCOUNTABILITY[k].label }))} />
                <p className="tiny muted">{ACCOUNTABILITY[acc].desc} An override is always one tap (plus a short reflection) away.</p>
                <p className="tiny muted">🤝 After setup you can add a recovery contact on the Shield screen. They can approve emergency access to shielded apps.</p>
              </>
            )}
          </>
        )}

        {step === 7 && (
          <div className="center onb__meet">
            <Confetti />
            <div className="onb__pet onb__pet--hatch">
              <Pet color={color} species={species} stage={1} condition="thriving" head="bow" reaction="rejoice" reactionKey={2} />
            </div>
            <h2>{name || 'Mochi'} has hatched!</h2>
            <p className="small">
              {picked.length} routines · rest on {restDays.length ? restDays.map((d) => WEEKDAYS[d]).join(', ') : 'no fixed days'} · shield {shieldOn ? `on (${ACCOUNTABILITY[acc].label})` : 'off'}
            </p>
            <p className="tiny muted">{name || 'Mochi'} is already eyeing your water bottle.</p>
            <button className="btn btn--big btn--block" onClick={finish}>
              Start Day 1
            </button>
          </div>
        )}
      </div>
      {step > 0 && step < 7 && (
        <div className="onb__nav">
          <button className="btn btn--ghost" onClick={back}>
            Back
          </button>
          <button className="btn" onClick={next} disabled={!valid}>
            {step === 6 ? 'Hatch!' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}
