import { useState } from 'react';
import { Modal, Ring, mmss, useCountdown } from './ui';
import { useStore } from '../state/store';

/** In-app timer verification. Demo speed compresses one minute into ~3 seconds (clearly labelled). */
export default function TimerModal({ title, minutes, onDone, onClose }: { title: string; minutes: number; onDone: (min: number) => void; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [running, setRunning] = useState(true);
  const total = minutes * 60;
  const speed = state.prefs.demoSpeed ? 20 : 1;
  const left = useCountdown(total, running, speed, () => onDone(minutes));
  return (
    <Modal open onClose={onClose} title={title}>
      <div className="center">
        <Ring value={1 - left / total} size={170} stroke={12} color="var(--good)">
          <div className="timer-big">{mmss(left)}</div>
        </Ring>
        <p className="small muted">{state.prefs.demoSpeed ? '⚡ Demo speed: 1 minute ≈ 3 seconds' : 'Real-time timer'}</p>
        <div className="row center gap">
          <button className="btn btn--ghost" onClick={() => setRunning((r) => !r)}>
            {running ? 'Pause' : 'Resume'}
          </button>
          <button className="btn btn--ghost" onClick={() => dispatch({ type: 'prefs', patch: { demoSpeed: !state.prefs.demoSpeed } })}>
            {state.prefs.demoSpeed ? 'Real speed' : 'Demo speed'}
          </button>
          <button
            className="btn"
            onClick={() => {
              const done = Math.floor((total - left) / 60);
              if (done > 0) onDone(done);
              else onClose();
            }}
          >
            Stop & log
          </button>
        </div>
      </div>
    </Modal>
  );
}
