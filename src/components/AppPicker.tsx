import { useMemo, useState } from 'react';
import { APP_CATALOG, CATEGORY_LABEL, PROTECTED_APPS, customApp, looksProtected, type AppCategory, type ShieldApp } from '../engine/apps';
import { getShieldBridge } from '../platform/shieldBridge';
import { Badge } from './ui';
import AppIcon from './AppIcon';

interface Props {
  selected: string[];
  custom: ShieldApp[];
  onChange: (selected: string[], custom: ShieldApp[]) => void;
}

const ICONS = ['📱', '🎮', '🎬', '📸', '🛒', '📰', '🎧', '💘', '🃏', '🧩'];

/** Choose which apps the Distraction Shield covers. Essentials can never be picked. */
export default function AppPicker({ selected, custom, onChange }: Props) {
  const bridge = useMemo(getShieldBridge, []);
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [cat, setCat] = useState<AppCategory>('other');
  const [icon, setIcon] = useState('📱');
  const [msg, setMsg] = useState<string | null>(null);

  const all = [...custom, ...APP_CATALOG];
  const query = q.trim().toLowerCase();
  const visible = all.filter((a) => !query || a.name.toLowerCase().includes(query));
  const groups = (Object.keys(CATEGORY_LABEL) as AppCategory[])
    .map((c) => ({ c, apps: visible.filter((a) => a.category === c) }))
    .filter((g) => g.apps.length);
  const protectedHits = query ? PROTECTED_APPS.filter((p) => p.name.toLowerCase().includes(query)) : [];

  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id], custom);

  const addCustom = () => {
    const n = name.trim();
    if (!n) return;
    if (looksProtected(n)) {
      setMsg(`"${n}" looks like an essential app (calls, messages, maps, health, banking or work). Those are never shielded.`);
      return;
    }
    if (all.some((a) => a.name.toLowerCase() === n.toLowerCase())) {
      const existing = all.find((a) => a.name.toLowerCase() === n.toLowerCase())!;
      if (!selected.includes(existing.id)) onChange([...selected, existing.id], custom);
      setMsg(`${existing.name} is already in the list — selected it for you.`);
    } else {
      const app = customApp(n, cat, icon);
      onChange([...selected, app.id], [app, ...custom]);
      setMsg(`Added ${app.name}.`);
    }
    setName('');
    setAdding(false);
  };

  const pickFromPhone = async () => {
    setMsg(null);
    const picked = await bridge.pickInstalledApps();
    if (!picked.length) return setMsg('No apps were picked.');
    const fresh = picked.filter((p) => !custom.some((c) => c.id === p.id));
    onChange([...new Set([...selected, ...picked.map((p) => p.id)])], [...fresh, ...custom]);
    setMsg(`Added ${picked.length} app${picked.length > 1 ? 's' : ''} from your phone.`);
  };

  return (
    <div className="picker">
      <div className="picker__phone card">
        <div className="row">
          <b>📲 From this phone</b>
          <Badge tone={bridge.mode === 'native' ? 'real' : 'sim'}>{bridge.platformLabel}</Badge>
        </div>
        {bridge.canPickInstalledApps ? (
          <>
            <p className="tiny muted">Opens your phone's own app picker. HabitPet only receives private tokens, never your full app list.</p>
            <button className="btn btn--sm" onClick={pickFromPhone}>
              Choose installed apps
            </button>
          </>
        ) : (
          <p className="tiny muted">
            Picking straight from your installed apps needs the HabitPet phone app (iOS Screen Time or Android usage access). In the browser, pick from the list below or add any app by name.
          </p>
        )}
      </div>

      <input className="picker__search" placeholder="Search apps…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search apps" />

      {protectedHits.length > 0 && (
        <p className="tiny warn">
          {protectedHits.map((p) => p.name).join(', ')} {protectedHits.length > 1 ? 'are' : 'is'} essential and can't be shielded.
        </p>
      )}

      {groups.map((g) => (
        <div key={g.c}>
          <div className="label">{CATEGORY_LABEL[g.c]}</div>
          <div className="picker__grid">
            {g.apps.map((a) => {
              const on = selected.includes(a.id);
              return (
                <button key={a.id} className={`picker__app ${on ? 'on' : ''}`} onClick={() => toggle(a.id)} aria-pressed={on}>
                  <AppIcon id={a.id} icon={a.icon} color={a.color} className="picker__icon" />
                  <small>{a.name}</small>
                  {a.source !== 'catalog' && <em>{a.source === 'device' ? 'phone' : 'added'}</em>}
                  {on && <i>✓</i>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {groups.length === 0 && <p className="small muted">No match. Add it by name below.</p>}

      {!adding ? (
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => {
            setAdding(true);
            setName(q);
          }}
        >
          + Add another app by name
        </button>
      ) : (
        <div className="card form">
          <label>
            App name
            <input id="custom-app-name" value={name} maxLength={30} placeholder="e.g. Clash of Clans" onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Type
            <select value={cat} onChange={(e) => setCat(e.target.value as AppCategory)}>
              {(Object.keys(CATEGORY_LABEL) as AppCategory[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <div className="icon-pick">
            {ICONS.map((i) => (
              <button key={i} className={icon === i ? 'on' : ''} onClick={() => setIcon(i)}>
                {i}
              </button>
            ))}
          </div>
          <div className="row gap">
            <button className="btn btn--ghost btn--sm" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button className="btn btn--sm" onClick={addCustom} disabled={!name.trim()}>
              Add app
            </button>
          </div>
        </div>
      )}
      {msg && <p className="tiny">{msg}</p>}

      <div className="label">Never shielded</div>
      <div className="chips">
        {PROTECTED_APPS.map((a) => (
          <span key={a.id} className="chip chip--static">
            {a.icon} {a.name}
          </span>
        ))}
      </div>
      <p className="tiny muted">Calls, SOS, messaging, maps, health and work apps always stay open — no approval needed.</p>
    </div>
  );
}
