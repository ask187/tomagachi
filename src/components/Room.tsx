import type { Condition } from '../engine/types';

// The environment mirrors the pet's TEMPORARY condition (spec §6.4):
// brightness, colour, weather, clutter and plant health all track it.

function mix(a: string, b: string, t: number) {
  const pa = a.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  const pb = b.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

interface Props {
  condition: number;
  state: Condition;
  stage: number;
  items: string[]; // equipped & unlocked room cosmetics
}

export default function Room({ condition, state, stage, items }: Props) {
  const t = 1 - condition / 100; // 0 = pristine, 1 = gloomiest
  const legendary = stage >= 4 && condition >= 60;
  const wallTop = legendary ? '#3b2a7a' : mix('#ffe8c7', '#3a3f55', t);
  const wallBot = legendary ? '#7a4fd1' : mix('#ffd3a8', '#2a2e40', t);
  const floor = mix('#c98b5a', '#4a3b33', t);
  const floorDark = mix('#a86f43', '#3a2e28', t);
  const sky = legendary ? '#1b1450' : mix('#8fd8ff', '#5a6378', t);
  const rainy = state === 'neglected' || state === 'recovery';
  const cloudy = state === 'struggling' || rainy;
  const clutter = state === 'recovery' ? 4 : state === 'neglected' ? 3 : state === 'struggling' ? 1 : 0;
  const plantSad = state === 'neglected' || state === 'recovery';

  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" className="room" aria-hidden="true">
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={wallTop} />
          <stop offset="1" stopColor={wallBot} />
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={floor} />
          <stop offset="1" stopColor={floorDark} />
        </linearGradient>
        <radialGradient id="lampglow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff6c2" stopOpacity="0.8" />
          <stop offset="1" stopColor="#fff6c2" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="300" fill="url(#wall)" />
      {/* wallpaper dots */}
      <g fill="#fff" opacity={0.12 * (1 - t)}>
        {Array.from({ length: 40 }).map((_, i) => (
          <circle key={i} cx={(i % 10) * 42 + 12 + (Math.floor(i / 10) % 2) * 20} cy={Math.floor(i / 10) * 44 + 18} r="3" />
        ))}
      </g>
      {legendary && (
        <g fill="#fff" className="stars">
          {Array.from({ length: 22 }).map((_, i) => (
            <circle key={i} cx={(i * 73) % 400} cy={(i * 37) % 200} r={i % 3 === 0 ? 2 : 1.2} opacity={0.5 + (i % 4) / 8} />
          ))}
        </g>
      )}

      {/* window */}
      <g transform="translate(36 34)">
        <rect width="104" height="92" rx="8" fill={mix('#ffffff', '#7a7f90', t)} />
        <rect x="6" y="6" width="92" height="80" rx="4" fill={sky} />
        {!cloudy && !legendary && <circle cx="70" cy="30" r="14" fill="#ffd94a" className="sun" />}
        {legendary && <circle cx="68" cy="28" r="12" fill="#fff4c4" />}
        {legendary && <circle cx="74" cy="24" r="11" fill={sky} />}
        {cloudy && (
          <g fill={rainy ? '#8a90a3' : '#e9eef7'} className="clouds">
            <ellipse cx="38" cy="30" rx="20" ry="11" />
            <ellipse cx="56" cy="26" rx="16" ry="12" />
            <ellipse cx="70" cy="34" rx="16" ry="9" />
          </g>
        )}
        {rainy && (
          <g stroke="#b8d4ff" strokeWidth="2" strokeLinecap="round" className="rain">
            {[18, 34, 50, 66, 82, 26, 58, 74].map((x, i) => (
              <line key={i} x1={x} y1={44 + (i % 3) * 8} x2={x - 4} y2={54 + (i % 3) * 8} />
            ))}
          </g>
        )}
        <path d="M52 6 V86 M6 46 H98" stroke={mix('#ffffff', '#7a7f90', t)} strokeWidth="5" />
        {state === 'recovery' && <path d="M8 8 L30 30 M8 20 L18 8" stroke="#ddd" strokeWidth="1" opacity="0.7" />}
      </g>

      {/* poster */}
      {items.includes('poster') && (
        <g transform={`translate(272 40) rotate(${state === 'neglected' || state === 'recovery' ? 9 : 0})`}>
          <rect width="76" height="96" rx="4" fill="#fff" stroke="#e2d6ff" strokeWidth="3" />
          <rect x="8" y="8" width="60" height="58" rx="3" fill="#7c5cff" />
          <path d="M14 58 L32 30 L44 46 L52 36 L64 58 Z" fill="#b9a6ff" />
          <circle cx="54" cy="22" r="6" fill="#ffd94a" />
          <text x="38" y="82" fontSize="10" textAnchor="middle" fontWeight="900" fill="#3a2b80">YOU GOT</text>
          <text x="38" y="92" fontSize="10" textAnchor="middle" fontWeight="900" fill="#3a2b80">THIS</text>
        </g>
      )}

      {/* shelf */}
      <g transform="translate(176 88)">
        <rect width="74" height="6" rx="2" fill={mix('#8a5a34', '#3c2f2a', t)} />
        <rect x="6" y="-20" width="10" height="20" fill="#ff7a59" />
        <rect x="18" y="-24" width="9" height="24" fill="#4ab0ff" />
        <rect x="29" y="-18" width="12" height="18" fill="#3ecf8e" />
        <circle cx="58" cy="-8" r="8" fill={stage >= 2 ? '#ffd94a' : '#ddd'} stroke="#c99400" strokeWidth="2" />
        <text x="58" y="-4" fontSize="9" textAnchor="middle" fontWeight="900" fill="#7a5600">{stage}</text>
      </g>

      {/* floor */}
      <path d="M0 214 H400 V300 H0 Z" fill="url(#floor)" />
      <path d="M0 214 H400" stroke={mix('#8a5a34', '#2a221e', t)} strokeWidth="4" />
      <g stroke={floorDark} strokeWidth="1.5" opacity="0.5">
        {[240, 266, 292].map((y) => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} />
        ))}
      </g>

      {items.includes('rug') && <ellipse cx="200" cy="262" rx="120" ry="24" fill={mix('#e7f3ff', '#8b93a8', t)} stroke={mix('#b9dcff', '#6a7085', t)} strokeWidth="4" />}

      {/* moon lamp */}
      {items.includes('lamp') && (
        <g transform="translate(330 150)">
          <circle cx="20" cy="22" r="46" fill="url(#lampglow)" opacity={0.4 + 0.6 * t} />
          <circle cx="20" cy="22" r="18" fill="#fff6c2" stroke="#e8d27a" strokeWidth="2" />
          <circle cx="14" cy="18" r="3" fill="#e8d27a" opacity="0.6" />
          <circle cx="25" cy="27" r="2" fill="#e8d27a" opacity="0.6" />
          <rect x="14" y="40" width="12" height="26" rx="3" fill="#6d5aa6" />
          <rect x="4" y="64" width="32" height="6" rx="3" fill="#4a3c7a" />
        </g>
      )}

      {/* plant */}
      {items.includes('plant') && (
        <g transform="translate(36 168)">
          <g className={plantSad ? '' : 'plant-sway'} style={{ transformOrigin: '26px 50px' }}>
            {plantSad ? (
              <>
                <path d="M26 48 C 20 30 6 34 0 46" stroke="#8a7d4a" strokeWidth="4" fill="none" />
                <path d="M26 48 C 34 30 48 36 54 50" stroke="#8a7d4a" strokeWidth="4" fill="none" />
                <ellipse cx="2" cy="48" rx="9" ry="5" fill="#a08a52" />
                <ellipse cx="52" cy="52" rx="9" ry="5" fill="#a08a52" />
                <ellipse cx="26" cy="30" rx="7" ry="10" fill="#9c8f5a" />
              </>
            ) : (
              <>
                <path d="M26 50 C 20 24 4 18 0 30 C 8 40 18 40 26 50 Z" fill="#3ecf6a" />
                <path d="M26 50 C 32 20 50 14 54 26 C 46 36 36 38 26 50 Z" fill="#2fb85a" />
                <path d="M26 50 C 22 22 26 6 30 2 C 36 16 34 34 26 50 Z" fill="#49d878" />
              </>
            )}
          </g>
          <path d="M8 48 H44 L40 76 H12 Z" fill="#ff8a5c" stroke="#d6633a" strokeWidth="2" />
        </g>
      )}

      {/* clutter grows with neglect */}
      {clutter >= 1 && (
        <g>
          <path d="M290 250 q8 -10 16 0 q-2 8 -8 8 q-6 0 -8 -8 z" fill="#f2f2f2" stroke="#bbb" />
          <path d="M100 262 l14 -4 l3 8 l-15 4 z" fill="#e85d75" />
        </g>
      )}
      {clutter >= 2 && (
        <g>
          <rect x="300" y="226" width="48" height="10" rx="2" fill="#d9a066" stroke="#9c6b3a" />
          <rect x="304" y="218" width="40" height="10" rx="2" fill="#e8b077" stroke="#9c6b3a" />
          <circle cx="76" cy="236" r="6" fill="#9a9a9a" opacity="0.7" />
          <circle cx="84" cy="238" r="4" fill="#9a9a9a" opacity="0.7" />
        </g>
      )}
      {clutter >= 3 && (
        <g>
          <path d="M360 0 L400 0 L400 40 Z M360 0 L400 40 M370 0 L400 30 M380 0 L400 20" stroke="#ccc" strokeWidth="1" fill="none" opacity="0.6" />
          <path d="M0 0 L36 0 L0 36 Z M0 0 L36 36" stroke="#ccc" strokeWidth="1" fill="none" opacity="0.5" />
          <ellipse cx="250" cy="282" rx="12" ry="6" fill="#9a9a9a" opacity="0.6" />
          <path d="M140 278 l18 -2 l-2 10 l-16 0 z" fill="#f5f5f5" stroke="#aaa" />
          <g className="flies" fill="#222">
            <circle cx="320" cy="200" r="2" />
            <circle cx="330" cy="192" r="2" />
          </g>
        </g>
      )}
      {clutter >= 4 && (
        <g>
          <path d="M60 280 q10 -14 22 0 z" fill="#7b8a5a" opacity="0.8" />
          <rect x="196" y="58" width="30" height="20" fill="#ffe6a8" opacity="0.8" transform="rotate(-8 210 68)" />
          <text x="211" y="72" fontSize="8" textAnchor="middle" fill="#7a5600" transform="rotate(-8 210 68)">
            todo?
          </text>
        </g>
      )}

      {/* overall gloom */}
      <rect width="400" height="300" fill="#0b0d1a" opacity={Math.max(0, t - 0.25) * 0.55} />
    </svg>
  );
}
