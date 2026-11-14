import { approvalCode, checkCode, validateRequest, withExpiry, EMERGENCY, type EmergencyRequest } from './emergency';
import { looksProtected, resolveApps, customApp } from './apps';

const req = (over: Partial<EmergencyRequest> = {}): EmergencyRequest => ({
  id: 'R1',
  at: Date.now(),
  reason: 'family',
  detail: 'Grandma only replies on this app',
  minutes: 30,
  apps: ['instagram'],
  status: 'pending',
  ...over,
});

describe('emergency access', () => {
  it('approval codes are 6 digits, deterministic and bound to request + duration', () => {
    const a = approvalCode('KEY', 'R1', 30);
    expect(a).toMatch(/^\d{6}$/);
    expect(approvalCode('KEY', 'R1', 30)).toBe(a);
    expect(approvalCode('KEY', 'R1', 60)).not.toBe(a);
    expect(approvalCode('OTHER', 'R1', 30)).not.toBe(a);
  });
  it('only an approved request accepts the right code', () => {
    const code = approvalCode('KEY', 'R1', 30);
    expect(checkCode('KEY', req(), code)).toBe(false);
    expect(checkCode('KEY', req({ status: 'approved', approvedMinutes: 30 }), code)).toBe(true);
    expect(checkCode('KEY', req({ status: 'approved', approvedMinutes: 30 }), '000000')).toBe(code === '000000');
    expect(checkCode('KEY', req({ status: 'denied', approvedMinutes: 30 }), code)).toBe(false);
  });
  it('requires a reason, an explanation and stays under the daily limit', () => {
    expect(validateRequest(null, 'long enough explanation', 30, 0)).toBeTruthy();
    expect(validateRequest('other', 'short', 30, 0)).toBeTruthy();
    expect(validateRequest('other', 'a long enough explanation', 45, 0)).toBeTruthy();
    expect(validateRequest('other', 'a long enough explanation', 30, EMERGENCY.maxPerDay)).toBeTruthy();
    expect(validateRequest('medical', 'clinic messages me in this app', 30, 0)).toBeNull();
  });
  it('expires stale pending requests', () => {
    const old = req({ at: Date.now() - EMERGENCY.pendingExpiryMs - 1000 });
    expect(withExpiry([old])[0].status).toBe('expired');
    expect(withExpiry([req()])[0].status).toBe('pending');
  });
});

describe('shield apps', () => {
  it('refuses to shield essential-looking custom apps', () => {
    expect(looksProtected('My Bank')).toBe(true);
    expect(looksProtected('Google Maps')).toBe(true);
    expect(looksProtected('Clash of Clans')).toBe(false);
  });
  it('resolves catalog and custom ids', () => {
    const mine = customApp('Wordle Unlimited', 'games');
    const r = resolveApps(['tiktok', mine.id, 'missing'], [mine]);
    expect(r.map((a) => a.name)).toEqual(['TikTok', 'Wordle Unlimited']);
  });
});
