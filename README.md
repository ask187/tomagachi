# 🐾 HabitPet

**Raise your pet. Raise your standards.**

A gamified wellness app where your real-world habits shape the mood, room, and evolution of one lifelong virtual companion. If you opt in, missing routines several times can trigger a **Distraction Shield** on the entertainment apps you choose. You get them back by finishing a short recovery mission.

Built from [`HabitPet_Product_Specification.md`](./HabitPet_Product_Specification.md) for the Keytos Hackathon (Health Track).

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # rules-engine tests
npm run build    # static build in dist/ (works on any static host)
```

On a desktop browser the app shows in a phone frame, with the **Demo Time Machine** panel beside it. On a phone it fills the screen, and the Time Machine opens from the floating **⏱** button.

## 3-minute demo script

Open the app, choose **Explore the 30-day demo journey**, then click the **Presenter mode** scenes in the Time Machine panel in order:

| # | Scene | What judges see |
|---|---|---|
| 1 | Meet your virtual self | Happy pet, bright room, first evolution (Newborn → Companion) |
| 2 | Neglect changes everything | The room turns gloomy and rainy with clutter, the pet slumps and facepalms, the shield warning shows |
| 3 | Distraction Shield activates | A simulated phone home screen with the chosen apps locked; essential apps are never shielded |
| 4 | Earn back access | Pick a recovery mission (walk / water / stretch / breathe / AI "tiny" mission). The pet revives, XP rises and apps unlock on a timer |
| 5 | Evolution reveal | A full-screen evolution sequence to the **Legendary** form, with an upgraded room and cosmetics |
| 6 | The AI notices patterns | "Evening workouts often slip — morning ones succeed", with a one-tap, user-approved schedule change |

Other ways to show the same features: the scenario picker (**Long break & welcome back**, **Sick days & sync failures**), the day slider, ▶ Play journey, and the quick buttons for the neglected state, recovered state, restriction demo and evolution.

To try it as a real user, choose **Hatch my pet**. Onboarding walks through the pet, habits, AI-suggested goals, rest days, health data, the shield and accountability mode. After that you log habits for real and use **Next day** to close each day.

## What's real vs simulated

| | Status |
|---|---|
| Rules engine: score, condition, streaks, XP, evolution, branching, shield state, credits | ✅ Real, deterministic, unit-tested (`src/engine`) |
| Step counting from the phone's motion sensor (DeviceMotion) | ✅ Real, on-device (phone + HTTPS) |
| Timer-verified habits & missions | ✅ Real (with a labelled "demo speed" option) |
| Insight Engine (pattern detection, difficulty tuning, risk hints, mission ranking) | ✅ Real, runs on-device over your history. Only recommends; you approve every change |
| Blocking other apps | 🟥 **Simulated** in the browser. The bridge for a native iOS/Android shell is in place (`src/platform/shieldBridge.ts`); the native side is documented but not built |
| Recovery contact & emergency codes | ✅ Real logic (validation, limits, expiry, codes tied to each request). 🟨 The contact's approval screen runs on the same device in the demo |
| "Simulate +1.5k steps", "Simulate sync failure", time jumps, Time Machine scenarios, friends | 🟨 Demo data, labelled in the UI |

## On your iPhone: Apple Health + real app blocking

`ios/` is a native iPhone app (Capacitor) around this web app. Its Swift plugin reads **Apple Health** and blocks **real apps** with Screen Time, and the web app detects it automatically. Building it needs a Mac with Xcode and a paid Apple Developer account. Follow **[docs/IOS_SETUP.md](docs/IOS_SETUP.md)**. The Swift code has not been compiled or run yet.

## Distraction Shield: your real apps + emergency access

- **Pick your apps.** Shield → *Edit apps*. Choose from 26 common apps (Instagram, TikTok, YouTube, Netflix…), search, or add any app by name. Anything that looks essential, like banking, maps, messaging, health or work, is refused. Calls, SOS, messages, maps and health are never shielded.
- **Apps from the phone itself.** Picking from the installed apps needs the native shell (iOS Screen Time / Android usage access). The web app already talks to it through `src/platform/shieldBridge.ts` and switches from SIMULATED to ON-DEVICE when it's present. See [docs/NATIVE_SHIELD.md](docs/NATIVE_SHIELD.md).
- **Recovery contact.** Add someone you trust (name, phone/email, relationship) and send them an invite.
- **Emergency access.** From a locked app, tap *Emergency? Ask Sam*:
  1. Pick a reason (medical, family, safety/travel, work/school, other), explain it in at least 15 characters, and choose 15 min to 2 h.
  2. The contact reads the request and approves (they can approve less time) or declines with a note.
  3. If they approve, they give a one-time 6-digit code. The code only works for that request and that duration, and it unlocks the apps.
  4. You can send at most 3 requests in 24 hours. Pending requests expire after 30 minutes. Every request and decision is kept in a history list.
  5. If the contact can't be reached, the regular override still works, after a longer reflection wait. You're never locked out for good.
- In the browser demo the contact's side ("Open Sam's view") runs on the same device and is labelled **demo**. In production it would arrive by push/SMS (see the doc).

## How it maps to the spec

- **Three separate scores (§7.1).** The Daily Health Score is weighted and leaves out unknown data. Condition is a temporary 0–100 value. Evolution XP is permanent and never goes down.
- **Five condition states (§6.2).** Thriving, Stable, Struggling, Neglected and Recovery-needed each have their own face, posture, idle animation, desaturation and room. The pet is never permanently dead.
- **Fairness (§5, §17).** Rest days, illness pauses and sync failures are left out of scoring, never counted as misses. Goal edits are versioned, so past days keep the target they were scored against.
- **Shield (§9).** It is opt-in and only covers the apps you choose. You always get a warning before it activates. Gentle, Balanced and Strict modes are available. An override is always there (a short reflection with a cooldown, no penalty), and missions forgive a miss.
- **Credits (§9.3).** You earn them from streaks, up to a ×2 multiplier and a 90-minute cap. They are kept separate from cosmetics.
- **Evolution (§8).** Four stages. The form branches into Athlete, Sage or Aqua based on your strongest habit group. There are 10 cosmetics you can wear or place in the room.
- **Welcome back (§4.3).** After 3 or more inactive days, the streak resets but the pet keeps everything it earned, and you get a small welcome-back quest.
- **AI memory (§10.4).** You can review approved goals and preferences under Insights and delete any of them.
- **Privacy (§17).** Data stays in browser localStorage and nothing goes to a server. You can export or delete it in Settings. Photo check-ins are never stored.
- **Accessibility.** Reduced-motion toggle (it also follows the OS setting), dark mode, keyboard focus styles, and a table view for the charts.

All numbers (thresholds, XP, credits) are illustrative and kept in one place, `src/engine/config.ts`. Evolution thresholds are set lower than the spec's 5 / 15 / 30 days so the 30-day demo reaches Legendary.

## Project layout

```
src/engine/      pure TypeScript: types, config, rules engine, insights, demo scenarios (+ tests)
src/platform/    native shield bridge (iOS Screen Time / Android), simulated fallback
src/state/       reducer store with localStorage persistence
src/components/  Pet (SVG character), Room (SVG environment), UI kit, timers, step sensor
src/screens/     Onboarding, Home, Routines, Shield, Missions, Evolve, Insights, Friends, Settings, Time Machine
```

## Deploy

`.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages on every push to `main` (turn on Pages → "GitHub Actions" in the repo settings first). The build uses relative paths, so any static host works.
