import type { CapacitorConfig } from '@capacitor/cli';

// Native iPhone shell for HabitPet. The web app in dist/ runs inside it and
// talks to Apple Health + Screen Time through the HabitPetNative plugin
// (ios/App/App/HabitPetNativePlugin.swift). Setup: docs/IOS_SETUP.md
const config: CapacitorConfig = {
  appId: 'com.example.habitpet',
  appName: 'HabitPet',
  webDir: 'dist',
  ios: { contentInset: 'never' },
};

export default config;
