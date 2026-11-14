import type { Branch, Condition, PetColor } from '../engine/types';

export type Reaction = 'rejoice' | 'facepalm' | 'sigh' | 'clock' | 'flex' | 'refreshed' | 'celebrate' | null;

const PALETTE: Record<PetColor, { body: string; dark: string; light: string; belly: string }> = {
  violet: { body: '#8b6cff', dark: '#5b3fd6', light: '#b9a6ff', belly: '#efe9ff' },
  mint: { body: '#36c99d', dark: '#1d9273', light: '#8ff0d2', belly: '#e3fff5' },
  peach: { body: '#ff9670', dark: '#de633e', light: '#ffc3ab', belly: '#fff1eb' },
  sky: { body: '#55b2ff', dark: '#2f80d1', light: '#a6dbff', belly: '#eaf6ff' },
};

export const PET_COLORS = Object.keys(PALETTE) as PetColor[];
export const petSwatch = (c: PetColor) => PALETTE[c].body;

interface Props {
  color: PetColor;
  stage: number;
  condition: Condition;
  branch?: Branch;
  head?: string;
  face?: string;
  neck?: string;
  reaction?: Reaction;
  reactionKey?: number;
  silhouette?: boolean;
  size?: number | string;
  still?: boolean;
  title?: string;
}

const EYE = '#1b1530';
// bold ink outline gives the character a sticker-like, hand-inked look
const INK = '#1b1530';

export default function Pet({
  color,
  stage,
  condition,
  branch = 'none',
  head,
  face,
  neck,
  reaction = null,
  reactionKey = 0,
  silhouette = false,
  size = '100%',
  still = false,
  title,
}: Props) {
  const p = PALETTE[color];
  const gold = '#ffcf3f';
  const low = condition === 'neglected' || condition === 'recovery';
  const lying = condition === 'recovery' && reaction !== 'rejoice' && reaction !== 'refreshed' && reaction !== 'celebrate';
  const happyReact = reaction === 'rejoice' || reaction === 'refreshed' || reaction === 'celebrate';
  // smaller and more slumped the worse it gets — readable at a glance on a video call
  const moodScale = happyReact ? 1 : { thriving: 1, stable: 0.98, struggling: 0.94, neglected: 0.9, recovery: 1 }[condition];
  const scale = ([0.7, 0.84, 0.97, 1.05][stage - 1] ?? 1) * moodScale;
  const posture = lying
    ? 'scale(1.18, 0.66)'
    : happyReact
      ? undefined
      : { thriving: undefined, stable: undefined, struggling: 'scale(1.03, 0.95)', neglected: 'scale(1.08, 0.86)', recovery: undefined }[condition];
  const earTilt = condition === 'thriving' ? 0 : condition === 'stable' ? 4 : condition === 'struggling' ? 14 : 28;
  const tipColor = stage >= 4 ? gold : p.dark;

  const cls = ['pet', `pet--${condition}`, reaction ? `pet--react-${reaction}` : '', still ? 'pet--still' : '', silhouette ? 'pet--silhouette' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={cls} role="img" aria-label={title ?? `Pet, ${condition}`}>
      <defs>
        <radialGradient id={`aura-${color}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={gold} stopOpacity="0.55" />
          <stop offset="60%" stopColor={p.light} stopOpacity="0.25" />
          <stop offset="100%" stopColor={p.light} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`body-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.light} />
          <stop offset="45%" stopColor={p.body} />
          <stop offset="100%" stopColor={p.dark} />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="100" cy="186" rx={lying ? 70 : 52 * scale} ry="7" fill="#000" opacity="0.18" className="pet-shadow" />

      <g key={reactionKey} className="pet-react">
        <g className="pet-bob" style={{ transformOrigin: '100px 185px' }}>
          <g transform={`translate(100 185) scale(${scale}) translate(-100 -185)`}>
            <g
              className="pet-body-wrap"
              style={{ transformOrigin: '100px 185px', transform: posture }}
            >
              {stage >= 4 && <circle cx="100" cy="115" r="95" fill={`url(#aura-${color})`} className="pet-aura" />}

              {/* wings (Legendary) */}
              {stage >= 4 && (
                <g className="pet-wings" fill="#fff" stroke={gold} strokeWidth="2.5" opacity={low ? 0.6 : 0.95}>
                  <path className="wing-l" d="M52 112 C 18 92 8 58 22 44 C 30 66 40 72 54 74 C 36 80 34 92 52 112 Z" />
                  <path className="wing-r" d="M148 112 C 182 92 192 58 178 44 C 170 66 160 72 146 74 C 164 80 166 92 148 112 Z" />
                </g>
              )}

              {/* tail */}
              {stage >= 2 && (
                <g className="pet-tail" style={{ transformOrigin: '148px 160px' }}>
                  <path d="M146 162 C 176 160 186 130 174 112" stroke={INK} strokeWidth="18" fill="none" strokeLinecap="round" />
                  <path d="M146 162 C 176 160 186 130 174 112" stroke={p.dark} strokeWidth="10" fill="none" strokeLinecap="round" />
                  <circle cx="174" cy="110" r={stage >= 3 ? 9 : 7} fill={tipColor} stroke={INK} strokeWidth="3.5" />
                </g>
              )}

              {/* ears */}
              {stage >= 2 && (
                <>
                  <g style={{ transformOrigin: '70px 72px', transform: `rotate(${-earTilt}deg)` }} className="ear-l">
                    <path d={stage >= 3 ? 'M56 86 L44 22 L92 62 Z' : 'M58 84 L52 40 L88 64 Z'} fill={p.body} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
                    <path d={stage >= 3 ? 'M60 76 L52 36 L80 62 Z' : 'M62 76 L58 50 L80 64 Z'} fill={p.belly} opacity="0.8" />
                    {stage >= 3 && <path d="M44 22 L40 12 M44 22 L50 13" stroke={tipColor} strokeWidth="3" strokeLinecap="round" />}
                  </g>
                  <g style={{ transformOrigin: '130px 72px', transform: `rotate(${earTilt}deg)` }} className="ear-r">
                    <path d={stage >= 3 ? 'M144 86 L156 22 L108 62 Z' : 'M142 84 L148 40 L112 64 Z'} fill={p.body} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
                    <path d={stage >= 3 ? 'M140 76 L148 36 L120 62 Z' : 'M138 76 L142 50 L120 64 Z'} fill={p.belly} opacity="0.8" />
                    {stage >= 3 && <path d="M156 22 L160 12 M156 22 L150 13" stroke={tipColor} strokeWidth="3" strokeLinecap="round" />}
                  </g>
                </>
              )}

              {/* arms (behind body edge) */}
              <g className="arm arm-l" style={{ transformOrigin: '50px 120px' }}>
                <ellipse cx="44" cy="138" rx="10" ry="18" fill={p.body} stroke={INK} strokeWidth="4" />
              </g>
              <g className="arm arm-r" style={{ transformOrigin: '150px 120px' }}>
                <ellipse cx="156" cy="138" rx="10" ry="18" fill={p.body} stroke={INK} strokeWidth="4" />
              </g>

              {/* feet */}
              <ellipse cx="76" cy="178" rx="16" ry="9" fill={p.dark} stroke={INK} strokeWidth="4" />
              <ellipse cx="124" cy="178" rx="16" ry="9" fill={p.dark} stroke={INK} strokeWidth="4" />

              {/* body */}
              <path
                d="M100 56 C 142 56 160 90 160 126 C 160 162 134 180 100 180 C 66 180 40 162 40 126 C 40 90 58 56 100 56 Z"
                fill={`url(#body-${color})`}
                stroke={INK}
                strokeWidth="4.5"
              />
              <ellipse cx="100" cy="148" rx="34" ry="26" fill={p.belly} opacity="0.9" />
              <path d="M62 82 Q72 68 88 64" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.55" />

              {/* branch traits (Ascended+) */}
              {stage >= 3 && branch === 'athlete' && <path d="M104 132 L94 150 L102 150 L96 166 L112 144 L104 144 L110 132 Z" fill={gold} stroke="#d39b00" strokeWidth="1.5" />}
              {stage >= 3 && branch === 'sage' && (
                <>
                  <path d="M100 76 L106 84 L100 92 L94 84 Z" fill="#6ff2ff" stroke="#fff" strokeWidth="1.5" className="gem" />
                  <circle cx="160" cy="60" r="7" fill="#c9f6ff" stroke="#6ff2ff" strokeWidth="2" className="orb" />
                </>
              )}
              {stage >= 3 && branch === 'aqua' && (
                <>
                  <path d="M42 116 L24 104 L28 126 Z" fill={p.light} stroke={p.dark} strokeWidth="1.5" />
                  <path d="M158 116 L176 104 L172 126 Z" fill={p.light} stroke={p.dark} strokeWidth="1.5" />
                  <g className="bubbles" fill="none" stroke="#bfe9ff" strokeWidth="2">
                    <circle cx="150" cy="70" r="4" />
                    <circle cx="160" cy="52" r="6" />
                    <circle cx="146" cy="38" r="3" />
                  </g>
                </>
              )}

              {/* stage 1 sprout */}
              {stage === 1 && (
                <g className="sprout" style={{ transformOrigin: '100px 58px' }}>
                  <path d="M100 58 C 100 48 101 42 102 36" stroke="#3b9d4a" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M102 38 C 112 28 124 32 122 38 C 116 44 108 42 102 38 Z" fill={low ? '#9c8f5a' : '#5ccf6a'} />
                  <path d="M101 42 C 92 34 82 38 84 43 C 90 47 96 46 101 42 Z" fill={low ? '#8a7d4a' : '#49b858'} />
                </g>
              )}

              {/* messy tufts + grime */}
              {low && (
                <>
                  <path d="M78 62 L82 48 L89 60 L95 44 L101 58 L108 45 L113 60 L120 50 L123 64" fill="none" stroke={p.dark} strokeWidth="3" strokeLinejoin="round" />
                  <ellipse cx="62" cy="140" rx="6" ry="4" fill="#6b5a45" opacity="0.45" />
                  <ellipse cx="136" cy="158" rx="5" ry="3" fill="#6b5a45" opacity="0.45" />
                  <ellipse cx="122" cy="92" rx="4" ry="3" fill="#6b5a45" opacity="0.35" />
                </>
              )}

              <Face condition={condition} reaction={reaction} p={p} shades={face === 'shades'} lying={lying} />
              {face === 'shades' && !lying && condition !== 'thriving' && condition !== 'stable' && !happyReact && (
                // too tired to look cool: sunglasses pushed up onto the forehead so the eyes show
                <g transform="translate(100 66) scale(0.78) rotate(-8) translate(-100 -106)">
                  <path d="M66 100 H134" stroke="#111" strokeWidth="3" />
                  <rect x="66" y="98" width="30" height="16" rx="7" fill="#111" />
                  <rect x="104" y="98" width="30" height="16" rx="7" fill="#111" />
                </g>
              )}

              {/* accessories */}
              {neck === 'scarf' && (
                <g>
                  <path d="M58 150 Q100 170 142 150 L144 160 Q100 182 56 160 Z" fill="#ff5c6c" stroke="#c43347" strokeWidth="2" />
                  <path d="M120 162 L128 188 L140 184 L132 158 Z" fill="#ff5c6c" stroke="#c43347" strokeWidth="2" />
                  <path d="M70 156 L72 164 M86 160 L87 168 M102 162 L102 170 M118 160 L117 168" stroke="#fff" strokeWidth="2" opacity="0.6" />
                </g>
              )}
              {head === 'headband' && (
                <g>
                  <path d="M50 92 Q100 70 150 92 L148 102 Q100 82 52 102 Z" fill="#ff4d6d" stroke="#c42647" strokeWidth="2" />
                  <path d="M50 96 L36 90 L40 104 Z" fill="#ff4d6d" />
                </g>
              )}
              {head === 'headphones' && (
                <g>
                  <path d="M46 104 C 40 40 160 40 154 104" fill="none" stroke="#2c2c3a" strokeWidth="7" strokeLinecap="round" />
                  <rect x="34" y="94" width="18" height="30" rx="8" fill="#ff7a59" stroke="#2c2c3a" strokeWidth="3" />
                  <rect x="148" y="94" width="18" height="30" rx="8" fill="#ff7a59" stroke="#2c2c3a" strokeWidth="3" />
                </g>
              )}
              {head === 'bow' && (
                <g transform="translate(128 64) rotate(18)">
                  <path d="M0 0 L-18 -10 L-18 10 Z" fill="#ff6fb1" stroke="#d63f86" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M0 0 L18 -10 L18 10 Z" fill="#ff6fb1" stroke="#d63f86" strokeWidth="2" strokeLinejoin="round" />
                  <circle r="5" fill="#ff9fcb" stroke="#d63f86" strokeWidth="2" />
                </g>
              )}
              {head === 'crown' && (
                <g className="crown" transform={low && !happyReact ? 'rotate(16 100 44) translate(10 6)' : undefined}>
                  <path d="M72 62 L68 32 L86 46 L100 24 L114 46 L132 32 L128 62 Z" fill={gold} stroke="#c99400" strokeWidth="2.5" strokeLinejoin="round" />
                  <circle cx="100" cy="50" r="4.5" fill="#ff5c7a" />
                  <circle cx="84" cy="54" r="3" fill="#4ad7ff" />
                  <circle cx="116" cy="54" r="3" fill="#4ad7ff" />
                </g>
              )}
              {condition === 'recovery' && head !== 'crown' && head !== 'headphones' && (
                <g transform="translate(118 72) rotate(-20)">
                  <rect x="-14" y="-5" width="28" height="10" rx="3" fill="#ffe2b8" stroke="#d6a86c" strokeWidth="1.5" />
                  <path d="M-4 -5 V5 M4 -5 V5" stroke="#d6a86c" strokeWidth="1" />
                </g>
              )}
            </g>
          </g>
        </g>

        {/* reaction props (in pet-local space, not scaled) */}
        {reaction === 'sigh' && (
          <g className="fx-puff">
            <circle cx="140" cy="140" r="8" fill="#fff" opacity="0.8" />
            <circle cx="152" cy="132" r="11" fill="#fff" opacity="0.7" />
            <circle cx="166" cy="124" r="9" fill="#fff" opacity="0.6" />
          </g>
        )}
        {reaction === 'clock' && (
          <text x="26" y="44" fontSize="30" className="fx-pop">
            ⏰
          </text>
        )}
        {(reaction === 'refreshed' || reaction === 'celebrate' || reaction === 'rejoice') && (
          <g className="fx-sparkles" fill="#ffd94a">
            <path d="M30 60 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 Z" />
            <path d="M168 40 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 Z" />
            <path d="M176 120 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 Z" />
            <path d="M22 140 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 Z" />
          </g>
        )}
        {low && !happyReact && (
          <g className="fx-stink" fill="none" stroke="#9aa36a" strokeWidth="3" strokeLinecap="round" opacity="0.8">
            <path d="M58 70 q-8 -10 0 -20 q8 -10 0 -20" />
            <path d="M142 66 q-8 -10 0 -20 q8 -10 0 -20" />
          </g>
        )}
        {low && !happyReact && (
          <g className="fx-flies" fill="#222">
            <circle cx="46" cy="96" r="2.6" />
            <circle cx="158" cy="80" r="2.6" />
            <circle cx="150" cy="100" r="2.2" />
          </g>
        )}
        {condition === 'struggling' && !happyReact && (
          <path d="M150 92 Q156 104 150 110 Q144 104 150 92 Z" fill="#8fd3ff" stroke="#1b1530" strokeWidth="2" className="sweat" />
        )}
        {condition === 'recovery' && !reaction && (
          <g className="fx-zzz" fill="#cfd6ff" fontWeight="900">
            <text x="140" y="96" fontSize="16">z</text>
            <text x="152" y="80" fontSize="20">z</text>
            <text x="166" y="60" fontSize="26">Z</text>
          </g>
        )}
      </g>
    </svg>
  );
}

function Face({
  condition,
  reaction,
  p,
  shades,
  lying,
}: {
  condition: Condition;
  reaction: Reaction;
  p: { body: string; dark: string; light: string; belly: string };
  shades: boolean;
  lying: boolean;
}) {
  const happy = reaction === 'rejoice' || reaction === 'celebrate' || reaction === 'refreshed';
  const mood: Condition = happy ? 'thriving' : condition;
  const lid = { thriving: 0, stable: 0.1, struggling: 0.45, neglected: 0.6, recovery: 1 }[mood];

  const eyes = (() => {
    if (happy && reaction !== 'refreshed') {
      // ^ ^ joy eyes
      return (
        <g stroke={EYE} strokeWidth="5" fill="none" strokeLinecap="round">
          <path d="M72 112 Q82 98 92 112" />
          <path d="M108 112 Q118 98 128 112" />
        </g>
      );
    }
    if (lid >= 1 || lying) {
      return (
        <g stroke={EYE} strokeWidth="4" fill="none" strokeLinecap="round">
          <path d="M72 108 Q82 116 92 108" />
          <path d="M108 108 Q118 116 128 108" />
          <path d="M72 118 Q82 124 92 118" stroke="#7a5ea8" strokeWidth="2.5" opacity="0.6" />
          <path d="M108 118 Q118 124 128 118" stroke="#7a5ea8" strokeWidth="2.5" opacity="0.6" />
        </g>
      );
    }
    const r = mood === 'thriving' ? 12 : 10.5;
    return (
      <g className="eyes">
        <g className="blink" style={{ transformOrigin: '100px 108px' }}>
          <ellipse cx="82" cy="108" rx={r - 2} ry={r} fill={EYE} />
          <ellipse cx="118" cy="108" rx={r - 2} ry={r} fill={EYE} />
          <circle cx="85" cy="103" r="3.6" fill="#fff" />
          <circle cx="121" cy="103" r="3.6" fill="#fff" />
          {mood === 'thriving' && (
            <>
              <circle cx="79" cy="113" r="1.8" fill="#fff" />
              <circle cx="115" cy="113" r="1.8" fill="#fff" />
            </>
          )}
        </g>
        {lid > 0 && (
          <g fill={p.body}>
            <rect x="68" y={96} width="28" height={24 * lid} rx="3" />
            <rect x="104" y={96} width="28" height={24 * lid} rx="3" />
            <path d={`M70 ${96 + 24 * lid} H94 M106 ${96 + 24 * lid} H130`} stroke={p.dark} strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}
        {(mood === 'neglected' || mood === 'struggling') && (
          <g stroke="#6d4f9b" strokeWidth="2.5" fill="none" opacity={mood === 'neglected' ? 0.7 : 0.35} strokeLinecap="round">
            <path d="M72 122 Q82 127 92 122" />
            <path d="M108 122 Q118 127 128 122" />
          </g>
        )}
      </g>
    );
  })();

  const brows = (() => {
    if (lying) return null;
    const s = { stroke: p.dark, strokeWidth: 3.5, strokeLinecap: 'round' as const, fill: 'none' };
    if (mood === 'thriving') return (
      <g {...s}>
        <path d="M72 88 Q80 82 90 86" />
        <path d="M110 84 Q120 78 128 84" />
      </g>
    );
    if (mood === 'stable') return (
      <g {...s}>
        <path d="M72 92 L90 90" />
        <path d="M110 86 Q120 80 128 86" /> {/* sarcastic raised brow */}
      </g>
    );
    if (mood === 'struggling') return (
      <g {...s}>
        <path d="M72 88 L90 93" />
        <path d="M110 93 L128 88" />
      </g>
    );
    return (
      <g {...s}>
        <path d="M72 94 L90 89" />
        <path d="M110 89 L128 94" />
      </g>
    );
  })();

  const mouth = (() => {
    if (happy || mood === 'thriving')
      return (
        <g>
          <path d="M84 128 Q100 150 116 128 Z" fill={EYE} />
          <path d="M92 138 Q100 146 108 138 Q100 134 92 138 Z" fill="#ff7a9a" />
        </g>
      );
    if (mood === 'stable') return <path d="M88 132 Q102 140 114 127" stroke={EYE} strokeWidth="3.5" fill="none" strokeLinecap="round" />;
    if (mood === 'struggling') return <path d="M90 134 L112 132" stroke={EYE} strokeWidth="3.5" fill="none" strokeLinecap="round" />;
    if (mood === 'neglected')
      return <path d="M86 138 Q92 130 98 135 Q104 130 110 135 Q114 132 116 138" stroke={EYE} strokeWidth="3.5" fill="none" strokeLinecap="round" />;
    return (
      <g>
        <ellipse cx="100" cy="134" rx="7" ry="5" fill={EYE} />
        <path d="M100 136 Q104 146 108 140" fill="#ff7a9a" stroke="#d65c7a" strokeWidth="1" />
      </g>
    );
  })();

  return (
    <g className="face">
      {eyes}
      {shades && !lying && (mood === 'thriving' || mood === 'stable') && (
        <g>
          <path d="M66 100 H134" stroke="#111" strokeWidth="3" />
          <rect x="66" y="98" width="30" height="20" rx="8" fill="#111" />
          <rect x="104" y="98" width="30" height="20" rx="8" fill="#111" />
          <path d="M72 103 L80 103" stroke="#fff" strokeWidth="2.5" opacity="0.7" strokeLinecap="round" />
          <path d="M110 103 L118 103" stroke="#fff" strokeWidth="2.5" opacity="0.7" strokeLinecap="round" />
        </g>
      )}
      {brows}
      {(mood === 'thriving' || mood === 'stable') && (
        <>
          <ellipse cx="66" cy="126" rx="8" ry="5" fill="#ff7aa8" opacity="0.45" />
          <ellipse cx="134" cy="126" rx="8" ry="5" fill="#ff7aa8" opacity="0.45" />
        </>
      )}
      {mouth}
      {(mood === 'neglected' || reaction === 'facepalm') && (
        <path d="M146 86 Q152 98 146 104 Q140 98 146 86 Z" fill="#8fd3ff" stroke="#4aa8e0" strokeWidth="1.5" className="sweat" />
      )}
      {reaction === 'facepalm' && (
        <g className="palm">
          <ellipse cx="112" cy="104" rx="20" ry="15" fill={p.body} stroke={p.dark} strokeWidth="2.5" />
          <path d="M98 96 Q104 92 110 96 M104 92 Q110 88 116 92 M110 90 Q118 86 124 92" stroke={p.dark} strokeWidth="2" fill="none" />
        </g>
      )}
    </g>
  );
}
