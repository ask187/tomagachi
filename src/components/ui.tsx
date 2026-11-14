import React, { useEffect, useRef, useState } from 'react';

export function Badge({ tone = 'neutral', children, title }: { tone?: 'neutral' | 'demo' | 'real' | 'warn' | 'bad' | 'good' | 'ai' | 'sim'; children: React.ReactNode; title?: string }) {
  return (
    <span className={`badge badge--${tone}`} title={title}>
      {children}
    </span>
  );
}

export function Meter({ value, max = 100, color, label, sub }: { value: number; max?: number; color?: string; label?: React.ReactNode; sub?: React.ReactNode }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="meter">
      {(label || sub) && (
        <div className="meter__head">
          <span>{label}</span>
          <span className="muted">{sub}</span>
        </div>
      )}
      <div className="meter__track" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max}>
        <div className="meter__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function Ring({ value, size = 64, stroke = 7, color = 'var(--accent)', children }: { value: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--track)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <div className="ring__label">{children}</div>
    </div>
  );
}

export function Modal({ open, onClose, children, title, wide }: { open: boolean; onClose: () => void; children: React.ReactNode; title?: string; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className={`modal__card ${wide ? 'modal__card--wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="modal__head">
            <h3>{title}</h3>
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Confetti({ n = 36 }: { n?: number }) {
  const colors = ['#ffd94a', '#7c5cff', '#ff6fb1', '#3ecf8e', '#4aa8ff', '#ff8a5c'];
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 97) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 12) * 0.06}s`,
            animationDuration: `${1.4 + (i % 5) * 0.25}s`,
            transform: `rotate(${i * 37}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/** Countdown that can run at demo speed. Returns seconds remaining. */
export function useCountdown(totalSec: number, running: boolean, speed: number, onDone?: () => void) {
  const [left, setLeft] = useState(totalSec);
  const done = useRef(false);
  useEffect(() => {
    setLeft(totalSec);
    done.current = false;
  }, [totalSec]);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((l) => {
        const n = Math.max(0, l - speed * 0.1);
        if (n === 0 && !done.current) {
          done.current = true;
          setTimeout(() => onDone?.(), 0);
        }
        return n;
      });
    }, 100);
    return () => clearInterval(id);
  }, [running, speed, onDone]);
  return left;
}

export const mmss = (sec: number) => {
  const s = Math.ceil(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: React.ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={o.value === value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode; desc?: React.ReactNode }) {
  return (
    <label className="toggle">
      <span>
        <b>{label}</b>
        {desc && <small className="muted">{desc}</small>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}
