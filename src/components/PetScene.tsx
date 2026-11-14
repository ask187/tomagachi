import Pet, { type Reaction } from './Pet';
import Room from './Room';
import { usePetLook, useStore } from '../state/store';
import { useUI } from '../App';
import { captionFor } from './captions';
import type { Snapshot } from '../engine/types';

export const MOOD_TAG = {
  thriving: { icon: '🌟', label: 'Thriving' },
  stable: { icon: '🙂', label: 'Stable' },
  struggling: { icon: '😮‍💨', label: 'Struggling' },
  neglected: { icon: '🥀', label: 'Neglected' },
  recovery: { icon: '🩹', label: 'Recovery needed' },
};

/** Pet + its room, wired to the current derived snapshot. */
export default function PetScene({
  snapOverride,
  reaction,
  compact,
  showCaption = true,
  showMood = true,
}: {
  snapOverride?: Snapshot;
  reaction?: Reaction;
  compact?: boolean;
  showCaption?: boolean;
  showMood?: boolean;
}) {
  const { journey, snap: cur, state } = useStore();
  const ui = useUI();
  const snap = snapOverride ?? cur;
  const has = (id?: string) => (id && snap.unlocked.includes(id) ? id : undefined);
  const eq = journey.equipped;
  const roomItems = eq.room.filter((r) => snap.unlocked.includes(r));
  const r = reaction !== undefined ? reaction : ui.reaction;
  const look = usePetLook(snap);
  return (
    <div className={`scene scene--${snap.conditionState} ${compact ? 'scene--compact' : ''}`}>
      <Room condition={snap.condition} state={snap.conditionState} stage={snap.stage} items={roomItems} />
      <div className="scene__pet">
        <Pet
          color={journey.profile.petColor}
          species={look.species}
          form={look.form}
          stage={snap.stage}
          condition={snap.conditionState}
          branch={snap.branch}
          head={has(eq.head)}
          face={has(eq.face)}
          neck={has(eq.neck)}
          reaction={r}
          reactionKey={ui.reactionKey}
          still={state.prefs.reducedMotion}
        />
      </div>
      {showMood && (
        <div className={`scene__mood scene__mood--${snap.conditionState}`} key={snap.conditionState}>
          {MOOD_TAG[snap.conditionState].icon} {MOOD_TAG[snap.conditionState].label} · {Math.round(snap.condition)}
        </div>
      )}
      {showCaption && state.prefs.captions && <div className="scene__caption">{captionFor(snap, journey.profile.petName)}</div>}
    </div>
  );
}
