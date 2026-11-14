import { useCallback, useEffect, useRef, useState } from 'react';

// REAL health-data integration (spec §13 P0): a lightweight on-device step
// counter using the browser DeviceMotion API. Works on most phones over HTTPS.
// Raw accelerometer data never leaves the device; only a step count is kept.

type Perm = 'unknown' | 'granted' | 'denied' | 'unsupported';

export function usePedometer() {
  const [steps, setSteps] = useState(0);
  const [active, setActive] = useState(false);
  const [perm, setPerm] = useState<Perm>(() =>
    typeof window !== 'undefined' && 'DeviceMotionEvent' in window ? 'unknown' : 'unsupported',
  );
  const [receiving, setReceiving] = useState(false);
  const last = useRef({ t: 0, above: false, avg: 9.8 });

  const onMotion = useCallback((e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null || a.z == null) return;
    setReceiving(true);
    const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    const st = last.current;
    st.avg = st.avg * 0.95 + mag * 0.05; // adaptive baseline
    const now = performance.now();
    const above = mag > st.avg + 1.6;
    if (above && !st.above && now - st.t > 280) {
      st.t = now;
      setSteps((s) => s + 1);
    }
    st.above = above;
  }, []);

  const start = useCallback(async () => {
    if (perm === 'unsupported') return false;
    const DM = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<'granted' | 'denied'> };
    try {
      if (typeof DM.requestPermission === 'function') {
        const r = await DM.requestPermission();
        if (r !== 'granted') {
          setPerm('denied');
          return false;
        }
      }
      setPerm('granted');
      window.addEventListener('devicemotion', onMotion);
      setActive(true);
      return true;
    } catch {
      setPerm('denied');
      return false;
    }
  }, [perm, onMotion]);

  const stop = useCallback(() => {
    window.removeEventListener('devicemotion', onMotion);
    setActive(false);
  }, [onMotion]);

  useEffect(() => () => window.removeEventListener('devicemotion', onMotion), [onMotion]);

  return { steps, setSteps, active, perm, receiving, start, stop, reset: () => setSteps(0) };
}
