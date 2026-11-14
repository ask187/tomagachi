import { Capacitor, registerPlugin } from '@capacitor/core';
import type { NativeShieldAPI } from './shieldBridge';

// Connects the web app to the iPhone app's Swift plugin
// (ios/App/App/HabitPetNativePlugin.swift). In a normal browser nothing is
// installed and the app keeps its simulated shield and manual logging.

export interface HealthToday {
  available: boolean;
  steps?: number;
  exerciseMin?: number;
  waterMl?: number;
  sleepHours?: number;
  mindfulMin?: number;
}

interface HabitPetNativePlugin {
  requestHealth(): Promise<{ available: boolean; granted: boolean }>;
  healthToday(): Promise<HealthToday>;
  requestScreenTime(): Promise<{ status: 'approved' | 'denied' }>;
  pickApps(): Promise<{ apps: { token: string }[]; categories: number; cancelled: boolean }>;
  setShield(o: { active: boolean; tokens: string[] }): Promise<{ active: boolean }>;
  unlockFor(o: { minutes: number; tokens: string[] }): Promise<{ until: number; backgroundRelock: boolean }>;
}

export interface HealthAPI {
  request(): Promise<boolean>;
  today(): Promise<HealthToday>;
}

declare global {
  interface Window {
    HabitPetHealth?: HealthAPI;
  }
}

export const isNativeApp = () => Capacitor.isNativePlatform();

export function installNativeBridge() {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return;
  const p = registerPlugin<HabitPetNativePlugin>('HabitPetNative');
  const shield: NativeShieldAPI = {
    platform: 'ios',
    requestAuthorization: async () => (await p.requestScreenTime()).status,
    pickApps: async () => {
      const r = await p.pickApps();
      return r.apps;
    },
    setShield: async (active, tokens) => {
      await p.setShield({ active, tokens });
    },
    unlockFor: async (minutes, tokens) => {
      await p.unlockFor({ minutes, tokens });
    },
  };
  window.HabitPetNative = shield;
  window.HabitPetHealth = {
    request: async () => (await p.requestHealth()).available,
    today: () => p.healthToday(),
  };
}

export const getHealth = (): HealthAPI | undefined => (typeof window !== 'undefined' ? window.HabitPetHealth : undefined);
