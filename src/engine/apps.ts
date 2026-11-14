// Apps the user can put behind the Distraction Shield.
//
// In the web build the user picks from this catalog (or adds their own by
// name). In a native build the OS picker returns the phone's real installed
// apps through the bridge in `src/platform/shieldBridge.ts`; those come back
// as `source: 'device'` entries with an opaque OS token.
//
// Icons are generic emoji on purpose — we never reproduce other apps' logos.

export type AppCategory = 'social' | 'video' | 'games' | 'news' | 'shopping' | 'dating' | 'other';

/** Categories that can never be shielded (spec §9.4). */
export type ProtectedCategory = 'communication' | 'navigation' | 'health' | 'work' | 'emergency';

export interface ShieldApp {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: AppCategory;
  source: 'catalog' | 'custom' | 'device';
  /** opaque token from the OS app picker (native builds only) */
  token?: string;
}

export const CATEGORY_LABEL: Record<AppCategory, string> = {
  social: 'Social',
  video: 'Video & streaming',
  games: 'Games',
  news: 'News & forums',
  shopping: 'Shopping',
  dating: 'Dating',
  other: 'Other',
};

const c = (id: string, name: string, icon: string, color: string, category: AppCategory): ShieldApp => ({ id, name, icon, color, category, source: 'catalog' });

export const APP_CATALOG: ShieldApp[] = [
  c('instagram', 'Instagram', '📸', '#e1306c', 'social'),
  c('tiktok', 'TikTok', '🎵', '#222222', 'social'),
  c('snapchat', 'Snapchat', '👻', '#f5d90a', 'social'),
  c('facebook', 'Facebook', '👍', '#3b5bdb', 'social'),
  c('x', 'X', '✖️', '#333333', 'social'),
  c('threads', 'Threads', '🧵', '#444444', 'social'),
  c('pinterest', 'Pinterest', '📌', '#d6336c', 'social'),
  c('bereal', 'BeReal', '📷', '#2b2b2b', 'social'),
  c('youtube', 'YouTube', '▶️', '#e03131', 'video'),
  c('netflix', 'Netflix', '🎬', '#c92a2a', 'video'),
  c('twitch', 'Twitch', '🎮', '#7048e8', 'video'),
  c('primevideo', 'Prime Video', '📺', '#1c7ed6', 'video'),
  c('disneyplus', 'Disney+', '🏰', '#364fc7', 'video'),
  c('hulu', 'Hulu', '📼', '#2f9e44', 'video'),
  c('candycrush', 'Candy Crush', '🍬', '#f76707', 'games'),
  c('roblox', 'Roblox', '🧱', '#495057', 'games'),
  c('clashroyale', 'Clash Royale', '👑', '#1971c2', 'games'),
  c('pokemongo', 'Pokémon GO', '⚡', '#f59f00', 'games'),
  c('reddit', 'Reddit', '👽', '#ff4500', 'news'),
  c('newsapp', 'News', '📰', '#868e96', 'news'),
  c('amazon', 'Amazon Shopping', '📦', '#f08c00', 'shopping'),
  c('temu', 'Temu', '🛍️', '#fd7e14', 'shopping'),
  c('shein', 'SHEIN', '👗', '#212529', 'shopping'),
  c('tinder', 'Tinder', '🔥', '#ff6b6b', 'dating'),
  c('hinge', 'Hinge', '💬', '#5c5f66', 'dating'),
  c('bumble', 'Bumble', '🐝', '#fab005', 'dating'),
];

/** Always reachable, never selectable — no matter the mode or the contact's decision. */
export const PROTECTED_APPS: { id: string; name: string; icon: string; why: ProtectedCategory }[] = [
  { id: 'phone', name: 'Phone', icon: '📞', why: 'emergency' },
  { id: 'sos', name: 'Emergency SOS', icon: '🆘', why: 'emergency' },
  { id: 'messages', name: 'Messages', icon: '💬', why: 'communication' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '📱', why: 'communication' },
  { id: 'maps', name: 'Maps', icon: '🗺️', why: 'navigation' },
  { id: 'health', name: 'Health', icon: '❤️', why: 'health' },
  { id: 'mail', name: 'Mail', icon: '✉️', why: 'work' },
  { id: 'teams', name: 'Work chat', icon: '💼', why: 'work' },
];

const PROTECTED_WORDS = ['phone', 'call', 'sos', 'emergency', '911', '112', 'message', 'sms', 'whatsapp', 'signal', 'telegram', 'map', 'navigation', 'uber', 'lyft', 'health', 'doctor', 'pharmacy', 'hospital', 'insulin', 'bank', 'mail', 'outlook', 'gmail', 'slack', 'teams', 'zoom', 'authenticator', 'wallet'];

/** True when a custom app name looks like something essential — we refuse to shield it. */
export function looksProtected(name: string) {
  const n = name.toLowerCase();
  return PROTECTED_WORDS.some((w) => n.includes(w));
}

const PALETTE = ['#7b93f2', '#ff6b1f', '#9cbc12', '#e5466a', '#845ef7', '#15aabf', '#f59f00'];

export function customApp(name: string, category: AppCategory, icon = '📱'): ShieldApp {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'app';
  return {
    id: `custom-${slug}-${Date.now().toString(36)}`,
    name: name.trim(),
    icon,
    color: PALETTE[name.length % PALETTE.length],
    category,
    source: 'custom',
  };
}

/** Resolve selected ids to app records (catalog + the user's custom/device apps). */
export function resolveApps(ids: string[], extra: ShieldApp[] = []): ShieldApp[] {
  const all = [...APP_CATALOG, ...extra];
  return ids.map((id) => all.find((a) => a.id === id)).filter((a): a is ShieldApp => !!a);
}
