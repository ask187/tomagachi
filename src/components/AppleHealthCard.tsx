import { useState } from 'react';
import { useStore } from '../state/store';
import { getHealth } from '../platform/native';
import { useSyncHealthNow } from '../platform/useHealthSync';
import { Badge } from './ui';

/** Connect / sync Apple Health. Only works inside the HabitPet iPhone app. */
export default function AppleHealthCard({ compact }: { compact?: boolean }) {
  const { state } = useStore();
  const health = getHealth();
  const sync = useSyncHealthNow();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!health) {
    return (
      <div className="card">
        <div className="row">
          <b>❤️ Apple Health</b>
          <Badge>iPhone app</Badge>
        </div>
        <p className="tiny muted">Steps, workouts, water, sleep and mindful minutes sync automatically in the HabitPet iPhone app. In the browser, log them here or use the step sensor.</p>
      </div>
    );
  }

  const connect = async () => {
    setBusy(true);
    try {
      const ok = await health.request();
      if (!ok) setStatus('Apple Health is not available on this device.');
      else if (!state.live) setStatus('Connected. Your data will sync once you start your own pet.');
      else {
        const n = await sync();
        setStatus(n ? `Synced ${n} habit${n > 1 ? 's' : ''} from Apple Health.` : 'Connected. No new data for today yet (or access was not allowed — check Settings ▸ Health ▸ Data Access).');
      }
    } catch (e) {
      setStatus(`Couldn't read Apple Health: ${(e as Error).message}`);
    }
    setBusy(false);
  };

  return (
    <div className="card">
      <div className="row">
        <b>❤️ Apple Health</b>
        <Badge tone="real">Real · on-device</Badge>
      </div>
      {!compact && <p className="tiny muted">Reads today's steps, exercise minutes, water, last night's sleep and mindful minutes. Read-only, stays on your phone.</p>}
      <button className="btn btn--sm" disabled={busy} onClick={connect}>
        {busy ? 'Syncing…' : state.live ? 'Connect & sync now' : 'Connect Apple Health'}
      </button>
      {state.mode === 'demo' && state.live && <p className="tiny muted">Syncs into your live pet, not the demo journey.</p>}
      {status && <p className="tiny">{status}</p>}
    </div>
  );
}
