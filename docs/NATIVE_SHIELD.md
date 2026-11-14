# Real app restrictions (native build)

A web page can't list the apps on a phone or block them, so the browser build of HabitPet simulates the Distraction Shield. The parts that are already real in the browser:

- choosing which apps go on the shield (from a catalog of common apps, or any app added by name)
- the rules for when the shield turns on and off
- the recovery-contact flow for emergency access

To block apps for real, wrap the web app in a thin native shell (for example Capacitor or a plain WKWebView / Android WebView). The shell then injects `window.HabitPetNative`. The web app detects it automatically (`src/platform/shieldBridge.ts`) and switches from **SIMULATED** to **ON-DEVICE**.

> Status: the iOS app is in `ios/` (Capacitor + `HabitPetNativePlugin.swift`). Setup is in [IOS_SETUP.md](IOS_SETUP.md). It has **not** been compiled or run yet. Android isn't built.

## Bridge contract

```ts
interface NativeShieldAPI {
  platform: 'ios' | 'android';
  requestAuthorization(): Promise<'approved' | 'denied'>;
  pickApps(): Promise<{ token: string; name?: string }[]>; // OS picker
  setShield(active: boolean, tokens: string[]): Promise<void>;
  unlockFor(minutes: number, tokens: string[]): Promise<void>; // re-shields itself afterwards
}
```

The web app calls these methods as follows:
- `pickApps` when the user taps **Choose installed apps**.
- `setShield(true, …)` whenever the rules engine decides the shield should be on, and `setShield(false, …)` when it should be off.
- `unlockFor` after a recovery mission, after spending banked credits, after an override, or after an approved emergency request.

## iOS: Screen Time API

The iOS side uses three frameworks:
- **FamilyControls**: `AuthorizationCenter.shared.requestAuthorization(for: .individual)` asks for permission, and `FamilyActivityPicker` lets the user pick apps.
- **ManagedSettings**: `ManagedSettingsStore().shield.applications = selection.applicationTokens` applies the block.
- **DeviceActivity**: a `DeviceActivityMonitor` extension re-applies the shield when an unlock window ends, even if HabitPet is closed.

Notes:
- iOS never tells third-party apps the names of the chosen apps. You only get opaque `ApplicationToken`s, and the OS draws the names and icons itself (for example in a `Label(token)` view). That's why device-picked apps show up as "Selected app 1, 2…" in the web layer.
- Using FamilyControls needs the `com.apple.developer.family-controls` entitlement, and Apple must approve it for App Store distribution.
- A **ShieldConfiguration** extension can style the lock screen ("Mochi is sitting on this app") and a **ShieldAction** extension can send "Ask Sam" taps back into HabitPet.

```swift
// sketch — not compiled
@objc func pickApps(_ call: CAPPluginCall) {
  let picker = FamilyActivityPicker(selection: $selection)   // present in a sheet
  // on dismiss:
  let tokens = selection.applicationTokens.map { encode($0) } // keep the encoded token as the id
  call.resolve(["apps": tokens.map { ["token": $0] }])
}
@objc func setShield(_ call: CAPPluginCall) {
  let store = ManagedSettingsStore()
  store.shield.applications = call.getBool("active") == true ? decode(call.getArray("tokens")) : nil
  call.resolve()
}
```

## Android

Android has no single public "shield" API. The usual approach:
- **UsageStatsManager** (the user grants Usage Access in Settings) to find out which app is in the foreground.
- `PackageManager.getInstalledApplications` with a `<queries>` declaration, so `pickApps` can show **real app names** (use the package name as the token).
- An **AccessibilityService** or a foreground service with an overlay that shows the HabitPet shield screen when a shielded package opens.

Notes:
- Google Play reviews apps that use Accessibility and `QUERY_ALL_PACKAGES` closely. The listing must state the purpose clearly.

## Emergency access in production

In the browser build, the recovery contact's side runs on the same device, so it can be demoed without a server. In production:
1. The contact accepts an invite link, and the two devices share the pairing key (`RecoveryContact.key`).
2. The request goes to the contact by push notification or SMS through a small backend.
3. The contact approves or declines on their own phone. The approval code is still `approvalCode(key, requestId, minutes)`, so the user's device can check it offline.
4. Essential apps (calls, SOS, messages, maps, health, work) are never shielded, so a real emergency never waits for anyone's approval.
