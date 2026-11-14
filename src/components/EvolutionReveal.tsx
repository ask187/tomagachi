import { useEffect, useState } from 'react';
import Pet from './Pet';
import { Confetti } from './ui';
import { SPECIES } from '../engine/species';
import { useStore } from '../state/store';

/** The dramatic evolution sequence (spec §8, §15 scene 5). */
export default function EvolutionReveal({ from, to, onClose }: { from: number; to: number; onClose: () => void }) {
  const { journey, snap, state } = useStore();
  const [phase, setPhase] = useState<'charge' | 'flash' | 'reveal'>(state.prefs.reducedMotion ? 'reveal' : 'charge');
  useEffect(() => {
    if (state.prefs.reducedMotion) return;
    const a = setTimeout(() => setPhase('flash'), 1700);
    const b = setTimeout(() => setPhase('reveal'), 2200);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [state.prefs.reducedMotion]);
  const species = journey.profile.species ?? 'mochi';
  const sp = SPECIES[species];
  const toStage = Math.min(to, 4);
  const fromStage = Math.min(from, 4);
  const info = { name: sp.forms[to - 1] ?? sp.forms[sp.forms.length - 1], blurb: sp.formBlurbs[to - 1] ?? '' };
  const eq = journey.equipped;
  const has = (id?: string) => (id && snap.unlocked.includes(id) ? id : undefined);
  return (
    <div className={`evo evo--${phase}`} role="dialog" aria-label="Evolution">
      <div className="evo__rays" />
      <div className="evo__pet">
        {phase === 'charge' ? (
          <Pet color={journey.profile.petColor} species={species} stage={fromStage} form={from} condition="thriving" silhouette title="Evolving" />
        ) : (
          <Pet
            color={journey.profile.petColor}
            species={species}
            stage={toStage}
            form={to}
            condition="thriving"
            branch={snap.branch}
            head={has(eq.head)}
            face={has(eq.face)}
            neck={has(eq.neck)}
            reaction="celebrate"
            title={`${info.name} form`}
          />
        )}
      </div>
      {phase === 'flash' && <div className="evo__flash" />}
      {phase === 'reveal' && (
        <div className="evo__text">
          <small>{journey.profile.petName} evolved!</small>
          <h2>
            {to === 5 ? 'Special form' : `Stage ${to}`}: {info.name}
          </h2>
          <p>{info.blurb}</p>
          {species === 'mochi' && to >= 3 && snap.branch !== 'none' && (
            <p className="evo__branch">
              Branch: <b>{{ athlete: '⚡ Athlete', sage: '🔮 Sage', aqua: '🌊 Aqua', none: '' }[snap.branch]}</b> — shaped by your strongest habits
            </p>
          )}
          <p className="muted">Permanent. A bad week can dim the room, but never undo this.</p>
          <button className="btn btn--big" onClick={onClose}>
            Let's go
          </button>
        </div>
      )}
      {phase === 'reveal' && !state.prefs.reducedMotion && <Confetti n={60} />}
      {phase === 'charge' && (
        <button className="btn btn--ghost evo__skip" onClick={() => setPhase('reveal')}>
          Skip
        </button>
      )}
    </div>
  );
}
