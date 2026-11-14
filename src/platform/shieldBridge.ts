import type { ShieldApp } from '../engine/apps';
import type { ShieldSettings } from '../engine/types';

// ---------------------------------------------------------------------------
// Platform bridge for REAL app restrictions.
//
// A web page cannot list or block other apps. A native shell (Capacitor /
// WKWebView on iOS, WebView on Android) can, and exposes it to this web app as
// `window.HabitPetNative`. See docs/NATIVE_SHIELD.md for the contract and the
// iOS (FamilyControls + ManagedSettings) / Android (UsageStats +
// Accessibility) implementation notes.
//
// Without the native shell the app falls back to the clearly-labelled
// simulation that the hackathon demo uses.
// ---------------------------------------------------------------------------

export interface NativeShieldAPI {
  platform: 'ios' | 'android';
  /** Ask for Screen Time / usage-access permission. */
  requestAuthorization(): Promise<'approved' | 'denied'>;
  /** Show the OS app picker; resolves with the apps the user chose. */
  pickApps(): Promise<{ token: string; name?: string }[]>;
  /** Shield (or un-shield) the given app tokens. */
  setShield(active: boolean, tokens: string[]): Promise<void>;
  /** Lift the shield for N minutes, then re-apply it automatically. */
  unlockFor(minutes: number, tokens: string[]): Promise<void>;
}

declare global {
  interface Window {
    HabitPetNative?: NativeShieldAPI;
  }
}

export interface ShieldBridge {
  mode: 'native' | 'simulated';
  platformLabel: string;
  canPickInstalledApps: boolean;
  pickInstalledApps(): Promise<ShieldApp[]>;
  apply(active: boolean, apps: ShieldApp[]): Promise<void>;
  unlockFor(minutes: number, apps: ShieldApp[]): Promise<void>;
}

const tokensOf = (apps: ShieldApp[]) => apps.map((a) => a.token).filter((t): t is string => !!t);

export function getShieldBridge(): ShieldBridge {
  const n = typeof window !== 'undefined' ? window.HabitPetNative : undefined;
  if (n) {
    return {
      mode: 'native',
      platformLabel: n.platform === 'ios' ? 'iOS Screen Time' : 'Android usage access',
      canPickInstalledApps: true,
      async pickInstalledApps() {
        if ((await n.requestAuthorization()) !== 'approved') return [];
        const picked = await n.pickApps();
        return picked.map((p, i) => ({
          id: `device-${p.token}`,
          token: p.token,
          // iOS hides real app names from third parties; the OS renders them in its own UI
          name: p.name ?? `Selected app ${i + 1}`,
          icon: '📱',
          color: '#7b93f2',
          category: 'other' as const,
          source: 'device' as const,
        }));
      },
      apply: (active, apps) => n.setShield(active, tokensOf(apps)),
      unlockFor: (minutes, apps) => n.unlockFor(minutes, tokensOf(apps)),
    };
  }
  return {
    mode: 'simulated',
    platformLabel: 'Web demo (simulated)',
    canPickInstalledApps: false,
    pickInstalledApps: async () => [],
    apply: async () => undefined,
    unlockFor: async () => undefined,
  };
}

/** Apps picked from this phone (they carry Screen Time tokens) that are still on the shield list. */
export function deviceApps(shield?: ShieldSettings): ShieldApp[] {
  if (!shield) return [];
  return (shield.custom ?? []).filter((a) => a.source === 'device' && a.token && shield.apps.includes(a.id));
}

/** Real apps always come from the user's own (live) pet, also during Time Machine demos. */
export function realShieldSettings(live: { profile: { shield: ShieldSettings } } | null, current: ShieldSettings): ShieldSettings {
  return live?.profile.shield ?? current;
}
