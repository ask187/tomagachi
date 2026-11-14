// Emergency access through a trusted recovery contact.
//
// When the shield is on, the user can ask their recovery contact to open the
// locked apps. The request must say why; the CONTACT decides whether the
// reason is valid. If they approve, they hand back a one-time 6-digit code
// that unlocks the apps for the approved time.
//
// The code is derived from a pairing key both sides got when the contact
// accepted the invite, so the user can't make one up. (A real build would
// deliver requests by push/SMS through a backend; this prototype runs the
// contact's side on the same device, clearly labelled.)
//
// Essential apps (calls, SOS, messages, maps, health) never need this — they
// are never locked in the first place.

export type ContactStatus = 'invited' | 'active';

export interface RecoveryContact {
  name: string;
  reach: string; // phone or email, as typed by the user
  relation: string;
  status: ContactStatus;
  inviteCode: string;
  key: string; // shared pairing secret
  since: number;
}

export type ReasonKind = 'medical' | 'family' | 'safety' | 'work' | 'other';

export const REASONS: { id: ReasonKind; label: string; icon: string; hint: string }[] = [
  { id: 'medical', label: 'Medical or health', icon: '🩺', hint: 'e.g. a clinic sends updates through an app that is locked' },
  { id: 'family', label: 'Family needs me', icon: '👪', hint: 'e.g. a relative only replies in a locked app' },
  { id: 'safety', label: 'Safety or travel', icon: '🧭', hint: 'e.g. travel updates or a safety group in a locked app' },
  { id: 'work', label: 'Work or school', icon: '🎓', hint: 'e.g. a class or shift is organised in a locked app' },
  { id: 'other', label: 'Something else', icon: '📝', hint: 'Explain clearly — your contact decides' },
];

export type RequestStatus = 'pending' | 'approved' | 'denied' | 'cancelled' | 'expired';

export interface EmergencyRequest {
  id: string;
  at: number;
  reason: ReasonKind;
  detail: string;
  minutes: number;
  apps: string[];
  status: RequestStatus;
  decidedAt?: number;
  approvedMinutes?: number;
  note?: string;
  usedAt?: number;
}

export const EMERGENCY = {
  durations: [15, 30, 60, 120],
  minDetail: 15,
  maxPerDay: 3,
  pendingExpiryMs: 30 * 60 * 1000,
};

/** FNV-1a — small, deterministic, good enough for a demo pairing code. */
function fnv(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function randomKey(len = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  const rnd = typeof crypto !== 'undefined' && crypto.getRandomValues ? crypto.getRandomValues(new Uint32Array(len)) : null;
  for (let i = 0; i < len; i++) out += chars[(rnd ? rnd[i] : Math.floor(Math.random() * 2 ** 32)) % chars.length];
  return out;
}

export function makeContact(name: string, reach: string, relation: string): RecoveryContact {
  return { name: name.trim(), reach: reach.trim(), relation: relation.trim(), status: 'invited', inviteCode: randomKey(6), key: randomKey(16), since: Date.now() };
}

/** The code the contact reads out after approving. Bound to the request and the approved duration. */
export function approvalCode(key: string, requestId: string, minutes: number) {
  return String(fnv(`${key}:${requestId}:${minutes}`) % 1_000_000).padStart(6, '0');
}

export function checkCode(key: string, req: EmergencyRequest, code: string) {
  return req.status === 'approved' && !!req.approvedMinutes && approvalCode(key, req.id, req.approvedMinutes) === code.replace(/\D/g, '');
}

export function validateRequest(reason: ReasonKind | null, detail: string, minutes: number, recentCount: number): string | null {
  if (!reason) return 'Pick the reason that fits best.';
  if (detail.trim().length < EMERGENCY.minDetail) return `Add a short explanation (at least ${EMERGENCY.minDetail} characters) so your contact can judge it.`;
  if (!EMERGENCY.durations.includes(minutes)) return 'Pick how long you need.';
  if (recentCount >= EMERGENCY.maxPerDay) return `You've sent ${EMERGENCY.maxPerDay} requests in the last 24 hours. Essential apps stay open; your contact can still help you directly.`;
  return null;
}

export function requestsInLastDay(list: EmergencyRequest[], now = Date.now()) {
  return list.filter((r) => now - r.at < 24 * 60 * 60 * 1000 && r.status !== 'cancelled').length;
}

/** Mark stale pending requests as expired. */
export function withExpiry(list: EmergencyRequest[], now = Date.now()): EmergencyRequest[] {
  return list.map((r) => (r.status === 'pending' && now - r.at > EMERGENCY.pendingExpiryMs ? { ...r, status: 'expired' } : r));
}

/** Text the user can send their contact by any channel. */
export function requestMessage(userPet: string, contact: RecoveryContact, r: EmergencyRequest, appNames: string[]) {
  const reason = REASONS.find((x) => x.id === r.reason)?.label ?? r.reason;
  return `Hi ${contact.name}, it's me (HabitPet: ${userPet}). I'm asking for emergency access to ${appNames.join(', ') || 'my locked apps'} for ${r.minutes} min.\nReason: ${reason}\n"${r.detail.trim()}"\nRequest ID: ${r.id}. If you think it's valid, open HabitPet's recovery-contact view and approve it to get a code.`;
}
