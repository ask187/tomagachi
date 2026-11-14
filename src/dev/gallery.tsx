// Dev-only visual check: every species × form × mood. Open /gallery.html in `npm run dev`.
import React from 'react';
import ReactDOM from 'react-dom/client';
import Pet from '../components/Pet';
import { SPECIES_LIST } from '../engine/species';
import type { Condition } from '../engine/types';
import '../styles.css';

const MOODS: Condition[] = ['thriving', 'stable', 'struggling', 'neglected', 'recovery'];

function Gallery() {
  return (
    <div style={{ padding: 16, display: 'grid', gap: 16, background: 'var(--bg)' }}>
      {SPECIES_LIST.map((sp) => (
        <div key={sp.id} className="card">
          <h3>{sp.name}</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {sp.forms.map((f, i) => (
              <figure key={f} style={{ margin: 0, textAlign: 'center' }}>
                <Pet color={sp.defaultColor} species={sp.id} stage={Math.min(i + 1, 4)} form={i + 1} condition="thriving" still size={120} />
                <figcaption className="tiny">{f}</figcaption>
              </figure>
            ))}
            {MOODS.slice(1).map((m) => (
              <figure key={m} style={{ margin: 0, textAlign: 'center' }}>
                <Pet color={sp.defaultColor} species={sp.id} stage={3} form={3} condition={m} still size={120} />
                <figcaption className="tiny">{m}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Gallery />
  </React.StrictMode>,
);
