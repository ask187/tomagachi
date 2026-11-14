# Run HabitPet on your iPhone (Apple Health + real app blocking)

The `ios/` folder holds a native iPhone app that wraps the HabitPet web app (via Capacitor) and adds a Swift plugin for:

- **Apple Health** (HealthKit), read-only: today's steps, exercise minutes, water, last night's sleep and mindful minutes. These fill in the matching habits on your live pet automatically.
- **Screen Time** (FamilyControls / ManagedSettings / DeviceActivity): pick real apps with Apple's picker, block them when the shield is on, and unblock them for a set time after a mission, credits, an override or an approved emergency request.

> ⚠️ This native code was written without a Mac or an iPhone and has **never been compiled or run**. Expect to fix a few small errors in Xcode the first time. The web half is tested against a fake plugin; the Swift half isn't.

## What you need

- A **Mac** with **Xcode 15 or newer** and [CocoaPods](https://cocoapods.org) (`brew install cocoapods`)
- An **iPhone on iOS 16 or newer**, plus a USB cable or the same Wi‑Fi network
- An **Apple Developer Program** membership ($99/yr). The Family Controls (Screen Time) capability isn't available to free accounts. For development builds on your own phone, Xcode's "Family Controls (Development)" works without Apple's approval. TestFlight and the App Store need Apple to approve the entitlement first.

## 1. Build the web app and sync it into iOS

```bash
git clone https://github.com/ask187/tomagachi.git
cd tomagachi
npm install
npm run ios          # = build + copy into ios/ + open Xcode
```

The first time, also install the native dependencies:

```bash
cd ios/App && pod install && cd ../..
```

Always open **`ios/App/App.xcworkspace`** (not `.xcodeproj`).

## 2. Signing and bundle ID

In Xcode, select the **App** project → **App** target → **Signing & Capabilities**:

1. Set **Team** to your developer team.
2. Change **Bundle Identifier** from `com.example.habitpet` to something unique, like `com.yourname.habitpet`.

## 3. Capabilities (App target)

The project already points at `App/App.entitlements`. On the **Signing & Capabilities** tab, click **+ Capability** and add these, so your provisioning profile includes them:

- **HealthKit**
- **Family Controls**
- **App Groups**: add `group.com.yourname.habitpet`

If your App Group isn't `group.com.example.habitpet`, update it in three places:
- `ios/App/App/ShieldStore.swift` (`appGroup`)
- `ios/App/App/App.entitlements`
- `ios/App/ShieldMonitor/ShieldMonitor.entitlements`

## 4. Add the background re-lock extension

This extension re-blocks your apps when an unlock window ends, even if HabitPet is closed.

1. **File ▸ New ▸ Target… ▸ Device Activity Monitor Extension**, name it **ShieldMonitor**, and embed it in **App**. If Xcode asks to activate the scheme, choose Cancel.
2. Replace the Swift file Xcode generated with `ios/App/ShieldMonitor/DeviceActivityMonitorExtension.swift`.
3. Select `ios/App/App/ShieldStore.swift`. In the File inspector → **Target Membership**, tick **ShieldMonitor** as well as **App**.
4. On the ShieldMonitor target:
   - add the **Family Controls** and **App Groups** capabilities (same group ID)
   - set **Code Signing Entitlements** to `ShieldMonitor/ShieldMonitor.entitlements`
   - set the deployment target to **iOS 16.0**

Without this extension, the app still works. Apps just re-lock only when you come back to HabitPet.

## 5. Run on your phone

1. Plug in the iPhone and pick it as the run destination.
2. On the phone, turn on **Settings ▸ Privacy & Security ▸ Developer Mode** (iOS 16+).
3. Press **Run** (⌘R). The first time, trust the developer under **Settings ▸ General ▸ VPN & Device Management**.

## 6. Demo script on the phone

**Real data on your own pet**
1. Choose **Hatch my pet**. On the **Connect health data** step, tap **Connect Apple Health** and allow every category.
2. On Home, the habits fill in from Apple Health, tagged **Apple Health**. They re-sync each time you open the app.

**Real app blocking**
1. Go to **Shield ▸ Edit apps ▸ Choose installed apps**, allow Screen Time, and pick a few apps (for example Instagram and TikTok).
2. Fastest demo: on **Shield ▸ Real apps on this iPhone**, tap **Block now (test)**. Go to the home screen and open Instagram: iOS shows the Screen Time shield.
3. Come back to HabitPet and complete a **recovery mission**. The apps unlock for the earned time, then re-lock.

**With the Time Machine**
1. Switch to **Demo journey** and turn on **Shield ▸ Block real apps during the demo**.
2. Open the Time Machine and choose **🛡️ Restriction demo**. Your real apps are blocked while the demo shield is on.
3. Do a mission, or use **🚨 Ask Sam** for emergency access, and they unlock.
4. Turn the toggle off, or tap **Unblock now**, when you're done.

## Good to know

- **App names:** iOS never tells other apps which apps you picked. HabitPet only gets private tokens, so phone-picked apps show as "Selected app 1, 2…". iOS still shows the real names on its own shield screen.
- **15-minute minimum:** iOS background schedules must last at least 15 minutes, so a shorter unlock re-locks in the background after 15 minutes. If you're back in HabitPet before then, it re-locks right away.
- **Health permissions:** iOS doesn't say whether read access was granted. If nothing syncs, check **Settings ▸ Health ▸ Data Access & Devices ▸ HabitPet**.
- **Essential apps:** Phone, Messages and emergency calls can't be blocked by Screen Time shields anyway, and HabitPet never tries.
- **Emergency contact:** the contact's approval still runs on the same phone ("Open Sam's view"). Sending it to their phone needs a small backend (see `docs/NATIVE_SHIELD.md`).
- **After changing web code:** run `npm run ios`, or `npm run build && npx cap sync ios`, then run again from Xcode.
- **Custom shield screen:** to change the text on the shield ("Mochi is sitting on this app"), add a **Shield Configuration Extension** target. It isn't included yet.
