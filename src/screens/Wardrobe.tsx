import { useStore } from '../state/store';
import { useUI } from '../App';
import Pet from '../components/Pet';
import PetScene from '../components/PetScene';
import { Badge } from '../components/ui';
import { COSMETICS, RULES, STAGES } from '../engine/config';

const BRANCHES = {
  none: { label: 'Not yet decided', desc: 'Your branch locks in at Ascended, based on your strongest habit group.' },
  athlete: { label: '⚡ Athlete', desc: 'Steps & exercise led the way.' },
  sage: { label: '🔮 Sage', desc: 'Mindfulness, reading & sleep led the way.' },
  aqua: { label: '🌊 Aqua', desc: 'Hydration & nutrition led the way.' },
};

export default function Wardrobe() {
  const { journey, snap, dispatch } = useStore();
  const ui = useUI();
  const eq = journey.equipped;
  const isOn = (slot: string, id: string) => (slot === 'room' ? eq.room.includes(id) : (eq as unknown as Record<string, string | undefined>)[slot] === id);

  return (
    <div className="screen">
      <PetScene compact showCaption={false} />
      <h2>Evolution</h2>
      <div className="stages">
        {STAGES.map((s) => {
          const reached = snap.stage >= s.stage;
          return (
            <div key={s.stage} className={`stage-card ${reached ? 'on' : ''} ${snap.stage === s.stage ? 'cur' : ''}`}>
              <Pet color={journey.profile.petColor} stage={s.stage} condition="stable" branch={snap.branch} silhouette={!reached} still size={64} />
              <b>{s.name}</b>
              <small>{reached ? '✓ unlocked' : `${RULES.stageThresholds[s.stage - 1]} qual. days`}</small>
            </div>
          );
        })}
      </div>
      <div className="card small">
        <b>Branch: {BRANCHES[snap.branch].label}</b>
        <p className="muted">{BRANCHES[snap.branch].desc}</p>
        <p className="muted">
          {snap.qualifyingDays} qualifying days (score ≥ {RULES.qualifyingScore}). Evolution is permanent — missed days never take it away.
        </p>
        <button className="btn btn--sm btn--ghost" disabled={snap.stage < 2} onClick={() => ui.revealEvolution(Math.max(1, snap.stage - 1), snap.stage)}>
          ▶ Replay evolution
        </button>
      </div>

      <h3>Wardrobe & room</h3>
      <div className="cosmetics">
        {COSMETICS.map((c) => {
          const unlocked = snap.unlocked.includes(c.id);
          const on = unlocked && isOn(c.slot, c.id);
          return (
            <button
              key={c.id}
              className={`cosmetic ${unlocked ? '' : 'cosmetic--locked'} ${on ? 'on' : ''}`}
              disabled={!unlocked}
              onClick={() => {
                dispatch({ type: 'equip', slot: c.slot, id: c.id });
                if (!on) ui.react('rejoice', 1400);
              }}
            >
              <span>{unlocked ? c.icon : '🔒'}</span>
              <b>{c.name}</b>
              <small>{unlocked ? (on ? 'Equipped' : c.slot === 'room' ? 'Place in room' : 'Wear') : c.unlock}</small>
            </button>
          );
        })}
      </div>
      <p className="tiny muted center">
        <Badge>{snap.unlocked.length}/{COSMETICS.length} unlocked</Badge> Cosmetics are permanent collectibles, separate from screen-time credits.
      </p>
    </div>
  );
}
