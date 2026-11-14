import type { Branch, Condition, PetColor } from '../engine/types';
import type { Species } from '../engine/species';

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
  species?: Species;
  stage: number;
  /** visual form; defaults to stage (Kiro has a 5th form) */
  form?: number;
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
  species = 'mochi',
  stage,
  form,
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

  const ctx: BodyCtx = { p, color, stage, form: form ?? stage, low, happy: happyReact, earTilt, tipColor, gold, branch, head };
  const cls = ['pet', `pet--${species}`, `pet--${condition}`, reaction ? `pet--react-${reaction}` : '', still ? 'pet--still' : '', silhouette ? 'pet--silhouette' : '']
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
              {species === 'mochi' && <MochiBody {...ctx} />}
              {species === 'eggling' && <EgglingBody {...ctx} />}
              {species === 'ember' && <EmberBody {...ctx} />}
              {species === 'kiro' && <KiroBody {...ctx} />}

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

// ---------------------------------------------------------------------------
// Species bodies. All draw in the same 200×200 space with the face area
// (eyes ≈ y108, mouth ≈ y132) covered by body colour, so the shared Face,
// mood effects, reactions and accessories work for every species.
// ---------------------------------------------------------------------------

type Pal = { body: string; dark: string; light: string; belly: string };
interface BodyCtx {
  p: Pal;
  color: PetColor;
  stage: number;
  form: number;
  low: boolean;
  happy: boolean;
  earTilt: number;
  tipColor: string;
  gold: string;
  branch: Branch;
  head?: string;
}

function Arms({ fill, small }: { fill: string; small?: boolean }) {
  const ry = small ? 14 : 18;
  return (
    <>
      <g className="arm arm-l" style={{ transformOrigin: '50px 120px' }}>
        <ellipse cx="44" cy="138" rx={small ? 9 : 10} ry={ry} fill={fill} stroke={INK} strokeWidth="4" />
      </g>
      <g className="arm arm-r" style={{ transformOrigin: '150px 120px' }}>
        <ellipse cx="156" cy="138" rx={small ? 9 : 10} ry={ry} fill={fill} stroke={INK} strokeWidth="4" />
      </g>
    </>
  );
}

function Grime() {
  return (
    <>
      <ellipse cx="62" cy="140" rx="6" ry="4" fill="#6b5a45" opacity="0.45" />
      <ellipse cx="136" cy="158" rx="5" ry="3" fill="#6b5a45" opacity="0.45" />
      <ellipse cx="122" cy="92" rx="4" ry="3" fill="#6b5a45" opacity="0.35" />
    </>
  );
}

function MochiBody({ p, color, stage, low, earTilt, tipColor, gold, branch }: BodyCtx) {
  return (
    <>
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
    </>
  );
}

/** Eggling — a baby in a starry eggshell. Hatchling → Sprout → Petalwing → Starbloom. */
function EgglingBody({ p, color, form, low, gold }: BodyCtx) {
  const shell = '#fffaf0';
  const droop = low ? 'rotate(28 100 60)' : undefined;
  const petal = (side: 1 | -1, big: boolean, i: number) => {
    const d = big
      ? 'M54 106 C 14 100 2 60 24 44 C 42 58 52 80 58 98 Z'
      : 'M54 106 C 24 100 16 72 32 62 C 44 72 52 86 58 98 Z';
    return (
      <path
        key={`${side}-${i}`}
        className="petal"
        d={d}
        transform={`${side === -1 ? 'translate(200 0) scale(-1 1)' : ''} ${i ? 'rotate(-24 56 100)' : ''} ${low ? 'rotate(26 56 100)' : ''}`}
        fill={i ? p.body : p.light}
        stroke={INK}
        strokeWidth="3.5"
        strokeLinejoin="round"
        opacity={low ? 0.7 : 1}
      />
    );
  };
  return (
    <>
      <defs>
        <linearGradient id={`egg-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor={p.belly} />
          <stop offset="100%" stopColor={p.light} />
        </linearGradient>
      </defs>
      {form >= 4 && <circle cx="100" cy="112" r="92" fill={`url(#aura-${color})`} className="pet-aura" />}
      {form >= 3 && [petal(1, form >= 4, 0), petal(-1, form >= 4, 0)]}
      {form >= 4 && [petal(1, true, 1), petal(-1, true, 1)]}
      <Arms fill={p.light} small />
      {form >= 2 && (
        <>
          <ellipse cx="80" cy="178" rx="14" ry="8" fill={p.light} stroke={INK} strokeWidth="4" />
          <ellipse cx="120" cy="178" rx="14" ry="8" fill={p.light} stroke={INK} strokeWidth="4" />
        </>
      )}
      <path d="M100 62 C 138 62 154 92 154 122 C 154 156 130 176 100 176 C 70 176 46 156 46 122 C 46 92 62 62 100 62 Z" fill={`url(#egg-${color})`} stroke={INK} strokeWidth="4.5" />
      <path d="M64 86 Q74 72 90 68" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.8" />
      {/* cowlick curl — droops when tired */}
      <g transform={droop}>
        <path d={form >= 3 ? 'M100 63 C 92 44 112 34 118 46 C 122 54 110 58 107 50 M100 63 C 102 48 86 44 84 54' : 'M100 63 C 96 50 108 44 112 52 C 115 58 106 60 104 54'} stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </g>
      {/* rosy cheeks are drawn by the shared face; add soft freckles */}
      <g fill={p.body} opacity="0.5">
        <circle cx="60" cy="118" r="2" />
        <circle cx="66" cy="124" r="2" />
        <circle cx="140" cy="118" r="2" />
        <circle cx="134" cy="124" r="2" />
      </g>
      {form === 1 && (
        <g>
          <path d="M36 132 L48 120 L60 134 L72 118 L84 134 L96 118 L108 134 L120 118 L132 134 L144 120 L164 132 C 164 168 136 190 100 190 C 64 190 36 168 36 132 Z" fill={shell} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <Stars p={p} />
        </g>
      )}
      {form <= 2 && (
        <g transform={form === 2 ? 'rotate(-12 100 70)' : undefined}>
          <path d="M64 80 C 70 50 130 50 136 80 L126 72 L116 84 L106 70 L96 84 L86 70 L76 84 Z" fill={shell} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <circle cx="92" cy="66" r="3" fill={p.body} />
          <circle cx="110" cy="62" r="2.4" fill={p.light} stroke={p.dark} strokeWidth="1" />
        </g>
      )}
      {form >= 4 && !low && (
        <g className="star-ring" style={{ transformOrigin: '100px 36px' }} fill={gold} stroke={INK} strokeWidth="1.5">
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2;
            const x = 100 + Math.cos(a) * 34;
            const y = 36 + Math.sin(a) * 9;
            return <path key={i} d={`M${x} ${y - 6} l2 4 l4.5 .6 l-3.3 3 l.9 4.5 l-4.1 -2.2 l-4.1 2.2 l.9 -4.5 l-3.3 -3 l4.5 -.6 Z`} />;
          })}
        </g>
      )}
      {low && <Grime />}
    </>
  );
}

function Stars({ p }: { p: Pal }) {
  const star = (x: number, y: number, r: number, f: string) => (
    <path d={`M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z`} fill={f} />
  );
  return (
    <g>
      {star(66, 156, 7, p.body)}
      {star(132, 152, 6, p.dark)}
      {star(102, 172, 5, p.light)}
      <circle cx="84" cy="146" r="3" fill={p.light} />
      <circle cx="118" cy="166" r="3.4" fill={p.body} />
      <circle cx="146" cy="138" r="2.4" fill={p.body} />
    </g>
  );
}

/** Ember — a fire-newt with a flame crest. Spark → Flicker → Blaze → Magma. */
function EmberBody({ p, color, form, low, gold }: BodyCtx) {
  const outer = low ? '#a89c8c' : '#ff6b1f';
  const inner = low ? '#d9d0c2' : '#ffd23f';
  // flame crest grows with each form; burns down to a wisp of smoke when neglected
  const flames: [number, number, number][] =
    form >= 4 ? [[100, 64, 46], [80, 70, 32], [120, 70, 32], [64, 80, 22], [136, 80, 22]] : form === 3 ? [[100, 64, 38], [82, 70, 26], [118, 70, 26]] : form === 2 ? [[100, 64, 28], [86, 70, 18], [114, 70, 18]] : [[100, 64, 20]];
  const flame = ([x, y, h]: [number, number, number], i: number) => {
    const hh = low ? h * 0.45 : h;
    const w = hh * 0.42;
    return (
      <g key={i} className="flame" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${i * 0.15}s` }}>
        <path d={`M${x} ${y - hh} C ${x + w} ${y - hh * 0.55} ${x + w * 1.1} ${y - hh * 0.2} ${x + w * 0.7} ${y} L${x - w * 0.7} ${y} C ${x - w * 1.1} ${y - hh * 0.2} ${x - w} ${y - hh * 0.55} ${x} ${y - hh} Z`} fill={outer} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d={`M${x} ${y - hh * 0.6} C ${x + w * 0.45} ${y - hh * 0.3} ${x + w * 0.5} ${y - hh * 0.1} ${x + w * 0.3} ${y} L${x - w * 0.3} ${y} C ${x - w * 0.5} ${y - hh * 0.1} ${x - w * 0.45} ${y - hh * 0.3} ${x} ${y - hh * 0.6} Z`} fill={inner} />
      </g>
    );
  };
  return (
    <>
      {form >= 4 && !low && <circle cx="100" cy="118" r="92" fill={`url(#aura-${color})`} className="pet-aura" />}
      {/* tail */}
      <g className="pet-tail" style={{ transformOrigin: '150px 160px' }}>
        <path d="M146 162 C 182 168 194 146 186 124" stroke={INK} strokeWidth="22" fill="none" strokeLinecap="round" />
        <path d="M146 162 C 182 168 194 146 186 124" stroke={p.body} strokeWidth="13" fill="none" strokeLinecap="round" />
        <circle cx="178" cy="156" r="3" fill={p.dark} />
      </g>
      {flames.map(flame)}
      {form >= 3 && (
        <g fill="#ffe9c7" stroke={INK} strokeWidth="3" strokeLinejoin="round">
          <path d="M70 80 C 58 70 56 56 62 48 C 66 60 74 66 80 72 Z" />
          <path d="M130 80 C 142 70 144 56 138 48 C 134 60 126 66 120 72 Z" />
        </g>
      )}
      <Arms fill={p.body} small />
      <ellipse cx="74" cy="178" rx="18" ry="9" fill={p.dark} stroke={INK} strokeWidth="4" />
      <ellipse cx="126" cy="178" rx="18" ry="9" fill={p.dark} stroke={INK} strokeWidth="4" />
      <path d="M100 66 C 146 66 166 98 166 130 C 166 164 136 182 100 182 C 64 182 34 164 34 130 C 34 98 54 66 100 66 Z" fill={`url(#body-${color})`} stroke={INK} strokeWidth="4.5" />
      <ellipse cx="100" cy="152" rx="36" ry="24" fill={p.belly} opacity="0.95" />
      <path d="M72 146 Q100 154 128 146 M74 158 Q100 166 126 158" stroke={p.light} strokeWidth="3" fill="none" strokeLinecap="round" />
      <g fill={p.dark} opacity="0.75">
        <circle cx="52" cy="112" r="5" />
        <circle cx="60" cy="98" r="3" />
        <circle cx="148" cy="108" r="5" />
        <circle cx="142" cy="94" r="3" />
        {form >= 2 && <circle cx="150" cy="128" r="3.5" />}
      </g>
      {form >= 4 && !low && (
        <g stroke={gold} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lava">
          <path d="M48 124 l8 8 l-3 10 l7 6" />
          <path d="M152 120 l-8 8 l4 9 l-6 7" />
          <path d="M92 170 l6 -6 l6 6" />
        </g>
      )}
      {form >= 4 && !low && (
        <g className="embers" fill="#ffb02e">
          <circle cx="60" cy="40" r="2.5" />
          <circle cx="140" cy="34" r="2" />
          <circle cx="120" cy="20" r="2.4" />
          <circle cx="78" cy="24" r="1.8" />
        </g>
      )}
      {low && <Grime />}
    </>
  );
}

/** Kiro — a martial-arts bear. Rookie → Fighter → Red Focus → Golden Surge → Silver Calm. */
function KiroBody({ p, color, form, low, gold, earTilt, head }: BodyCtx) {
  const gi = '#f6f2e8';
  const belt = form === 1 ? '#f2b705' : '#1b1530';
  const aura = form === 3 ? '#ff4d4d' : form === 4 ? gold : '#c9d4ff';
  // too tired to power up: no aura when neglected
  const showAura = form >= 3 && !low;
  return (
    <>
      {showAura && (
        <g className={`kiro-aura kiro-aura--${form}`} style={{ transformOrigin: '100px 186px' }}>
          <path
            d="M100 8 C 118 36 150 26 150 58 C 176 66 182 108 168 128 C 188 150 176 184 150 188 L50 188 C 24 184 12 150 32 128 C 18 108 24 66 50 58 C 50 26 82 36 100 8 Z"
            fill={aura}
            opacity={form === 5 ? 0.55 : 0.5}
            stroke={form === 5 ? '#9fb0ff' : aura}
            strokeWidth={form === 5 ? 4 : 3}
          />
          <path d="M100 30 C 112 50 136 46 134 70 C 152 80 154 108 146 124 L54 124 C 46 108 48 80 66 70 C 64 46 88 50 100 30 Z" fill="#fff" opacity={form === 5 ? 0.45 : 0.25} />
        </g>
      )}
      {showAura && form === 4 && (
        <g className="sparks" stroke="#fff6b0" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M30 70 l10 8 l-6 4 l10 8" />
          <path d="M170 60 l-10 8 l6 4 l-10 8" />
          <path d="M160 150 l-8 6 l5 3 l-8 6" />
        </g>
      )}
      {showAura && form === 5 && (
        <g className="motes" fill="#ffffff">
          <circle cx="34" cy="90" r="3" />
          <circle cx="168" cy="80" r="2.4" />
          <circle cx="150" cy="40" r="2" />
          <circle cx="52" cy="44" r="2.2" />
          <circle cx="176" cy="130" r="2" />
        </g>
      )}
      {/* round bear ears */}
      <g style={{ transformOrigin: '70px 76px', transform: `rotate(${-earTilt}deg)` }}>
        <circle cx="62" cy="70" r="17" fill={p.body} stroke={INK} strokeWidth="4" />
        <circle cx="62" cy="70" r="8" fill={p.belly} />
      </g>
      <g style={{ transformOrigin: '130px 76px', transform: `rotate(${earTilt}deg)` }}>
        <circle cx="138" cy="70" r="17" fill={p.body} stroke={INK} strokeWidth="4" />
        <circle cx="138" cy="70" r="8" fill={p.belly} />
      </g>
      <Arms fill={p.body} />
      <ellipse cx="76" cy="178" rx="16" ry="9" fill={p.dark} stroke={INK} strokeWidth="4" />
      <ellipse cx="124" cy="178" rx="16" ry="9" fill={p.dark} stroke={INK} strokeWidth="4" />
      <path d="M100 58 C 142 58 160 90 160 126 C 160 162 134 180 100 180 C 66 180 40 162 40 126 C 40 90 58 58 100 58 Z" fill={`url(#body-${color})`} stroke={INK} strokeWidth="4.5" />
      <path d="M62 84 Q72 70 88 66" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.5" />
      {/* gi + belt */}
      <path d="M43 138 C 50 134 70 132 84 136 L100 158 L116 136 C 130 132 150 134 157 138 C 160 164 134 180 100 180 C 66 180 40 164 43 138 Z" fill={gi} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M84 136 L100 158 L120 142" stroke={INK} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      <path d="M46 156 Q100 172 154 156 L153 166 Q100 182 47 166 Z" fill={belt} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M110 168 l-6 16 l8 -2 M114 168 l8 15 l4 -6" fill={belt} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      {form >= 2 && (
        <g fill="#e5466a" stroke={INK} strokeWidth="2.5">
          <rect x="34" y="146" width="20" height="8" rx="3" className="arm-band" />
          <rect x="146" y="146" width="20" height="8" rx="3" className="arm-band" />
        </g>
      )}
      {form >= 2 && !head && (
        <g>
          <path d="M48 92 Q100 72 152 92 L151 101 Q100 82 49 101 Z" fill="#e5466a" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M150 94 L170 88 L164 100 L172 110 L152 100 Z" fill="#e5466a" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        </g>
      )}
      {low && <Grime />}
    </>
  );
}
