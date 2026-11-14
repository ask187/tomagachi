/** Hand-drawn doodles scattered over header bands. Purely decorative. */
export default function Doodles() {
  return (
    <svg className="doodles" viewBox="0 0 360 200" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
      <g stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M214 10 l4 8 l9 1.5 l-6.5 6 l1.5 9 l-8 -4.5 l-8 4.5 l1.5 -9 l-6.5 -6 l9 -1.5 Z" fill="var(--lime)" />
        <path d="M18 150 q10 -16 20 0 t20 0" fill="none" stroke="var(--paper)" opacity="0.8" />
        <path d="M300 160 c0 -8 12 -8 12 0 c0 -8 12 -8 12 0 c0 9 -12 15 -12 18 c0 -3 -12 -9 -12 -18 Z" fill="var(--orange)" />
        <g stroke="var(--paper)" opacity="0.9">
          <path d="M250 14 v14 M243 21 h14 M245 16 l10 10 M255 16 l-10 10" />
        </g>
      </g>
    </svg>
  );
}
