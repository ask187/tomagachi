import type { PetColor } from './types';

// Original HabitPet companions. Each one keeps the same evolution rules
// (qualifying days → stages); only the look and the form names differ.

export type Species = 'mochi' | 'eggling' | 'ember' | 'kiro';

export interface SpeciesInfo {
  id: Species;
  name: string;
  icon: string;
  blurb: string;
  forms: string[]; // form names, index 0 = stage 1
  formBlurbs: string[];
  defaultColor: PetColor;
  defaultName: string;
  special?: string;
}

export const SPECIES: Record<Species, SpeciesInfo> = {
  mochi: {
    id: 'mochi',
    name: 'Mochi',
    icon: '🐱',
    blurb: 'A squishy, sarcastic cat-blob that grows ears, a tail and finally wings.',
    forms: ['Newborn', 'Companion', 'Ascended', 'Legendary'],
    formBlurbs: ['Fresh out of the egg. Already judging you.', 'Grew ears and opinions.', 'A major glow-up shaped by your strongest habits.', 'Radiant, smug, and fully earned.'],
    defaultColor: 'violet',
    defaultName: 'Mochi',
  },
  eggling: {
    id: 'eggling',
    name: 'Eggling',
    icon: '🥚',
    blurb: 'A sleepy baby peeking out of a starry eggshell. Hatches, sprouts petal wings, then blooms into light.',
    forms: ['Hatchling', 'Sprout', 'Petalwing', 'Starbloom'],
    formBlurbs: ['Still half inside the shell. Very brave about it.', 'Out of the shell — keeps the top as a hat.', 'Grew soft petal wings and an attitude.', 'Floats in a ring of tiny stars. Insufferably serene.'],
    defaultColor: 'sky',
    defaultName: 'Pip',
  },
  ember: {
    id: 'ember',
    name: 'Ember',
    icon: '🔥',
    blurb: 'A pocket fire-newt whose flame crest burns brighter the more consistent you are.',
    forms: ['Spark', 'Flicker', 'Blaze', 'Magma'],
    formBlurbs: ['A tiny crest of flame and big ambitions.', 'Longer, spottier, warmer.', 'Grew horns and a roaring crest.', 'Molten cracks, a crown of fire, zero chill.'],
    defaultColor: 'peach',
    defaultName: 'Cinder',
  },
  kiro: {
    id: 'kiro',
    name: 'Kiro',
    icon: '🥋',
    blurb: 'A tiny martial-arts bear who powers up with every streak — from Rookie to the rare Silver Calm.',
    forms: ['Rookie', 'Fighter', 'Red Focus', 'Golden Surge', 'Silver Calm'],
    formBlurbs: ['White belt, big dreams.', 'Black belt, wristbands, serious face.', 'A red aura flares up around them.', 'Golden energy crackles everywhere.', 'Perfectly still. Silver light. The rarest form.'],
    defaultColor: 'mint',
    defaultName: 'Kiro',
    special: 'Silver Calm: reach Golden Surge and hold a 7-day streak',
  },
};

export const SPECIES_LIST = Object.values(SPECIES);

/** Visual form (1-based). Kiro has a 5th form for a sustained streak at max stage. */
export function formOf(species: Species, stage: number, streak: number): number {
  if (species === 'kiro' && stage >= 4 && streak >= 7) return 5;
  return stage;
}

export function formName(species: Species, form: number): string {
  const s = SPECIES[species];
  return s.forms[Math.min(form, s.forms.length) - 1];
}
