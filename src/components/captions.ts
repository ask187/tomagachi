import type { Snapshot } from '../engine/types';

// Optional UI-level captions. The pet itself never speaks (spec §6.1) — these
// narrate its gestures with a cheeky tone, never shaming the user.

const pick = <T,>(arr: T[], seed: number) => arr[Math.abs(seed) % arr.length];

export function captionFor(s: Snapshot, name: string): string {
  const seed = s.day * 7 + Math.round(s.condition);
  if (s.status === 'paused') return pick([`${name} tucks you in with a tiny blanket. Get well — nothing counts today.`, `${name} brews imaginary tea. Pause mode: no penalties.`], seed);
  if (s.status === 'rest') return pick([`${name} is horizontal on purpose. It's a rest day.`, `${name} declares today a Certified Lazy Day™. Rest is part of the plan.`], seed);
  if (s.welcomeBack) return `${name} pretends not to have missed you, then sprints over anyway. Welcome back!`;
  if (s.shield === 'active') return pick([`${name} has confiscated your scroll apps and is sitting on them.`, `${name} taps the Shield sign. Then taps your sneakers.`], seed);
  if (s.shield === 'unlocked') return `${name} hands back your apps with a dramatic bow. Earned it.`;
  switch (s.conditionState) {
    case 'thriving':
      return pick(
        [`${name} is doing victory laps. Show-off energy: maximum.`, `${name} flexes at the mirror. Then at you. Mostly at the mirror.`, `${name} moonwalks across the rug. Your routines are carrying.`],
        seed,
      );
    case 'stable':
      return pick([`${name} raises one eyebrow. Decent. Not legendary. Decent.`, `${name} is vibing. Cautiously.`, `${name} glances at your water bottle. Subtly. Not subtly.`], seed);
    case 'struggling':
      return pick([`${name} sighs dramatically and points at the clock.`, `${name} is wearing yesterday's fur. Just saying.`, `${name} slowly slides off the couch.`], seed);
    case 'neglected':
      return pick([`${name} facepalms. The room has developed a smell.`, `${name} is building a fort out of pizza boxes. A recovery mission would help.`], seed);
    case 'recovery':
      return `${name} has collapsed in theatrical exhaustion. One tiny mission revives them — nothing is ever lost.`;
  }
}
