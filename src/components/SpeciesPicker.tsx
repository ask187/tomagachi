import Pet from './Pet';
import { SPECIES_LIST, type Species } from '../engine/species';
import type { PetColor } from '../engine/types';

/** Choose a companion. Each card shows the first and final forms side by side. */
export default function SpeciesPicker({ value, color, onChange }: { value: Species; color?: PetColor; onChange: (s: Species) => void }) {
  return (
    <div className="species" role="radiogroup" aria-label="Choose your companion">
      {SPECIES_LIST.map((sp) => {
        const on = sp.id === value;
        const c = on && color ? color : sp.defaultColor;
        const last = sp.forms.length;
        return (
          <button key={sp.id} role="radio" aria-checked={on} className={`species__card ${on ? 'on' : ''}`} onClick={() => onChange(sp.id)}>
            <span className="species__pets">
              <Pet color={c} species={sp.id} stage={1} condition="thriving" still size={52} />
              <i>→</i>
              <Pet color={c} species={sp.id} stage={4} form={last} condition="thriving" still size={52} />
            </span>
            <b>
              {sp.icon} {sp.name}
            </b>
            <small>{sp.forms.join(' · ')}</small>
          </button>
        );
      })}
    </div>
  );
}
