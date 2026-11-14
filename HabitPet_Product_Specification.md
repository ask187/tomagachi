# HabitPet — Product Specification & Hackathon Blueprint

**Project:** HabitPet (working title)  
**Event:** Keytos Hackathon — Health Track  
**Version:** 1.0 — November 14, 2026  
**Status:** Product concept and demo plan; proposed mechanics require prototyping and validation  
**Tagline (proposed):** *Raise your pet. Raise your standards.*

> **One-line pitch:** HabitPet is a gamified wellness app where your real-world habits shape the appearance, mood, environment, and evolution of one lifelong virtual companion. With user consent, repeated missed routines can trigger a digital distraction shield, and completing personalized recovery challenges earns access back.

---

## 1. Vision and problem

### The problem

Many people want to build healthier routines—walking, exercising, drinking water, sleeping well, meditating—but struggle to maintain them. Conventional habit trackers can become passive checklists. Entertainment apps can consume time that users intended to spend on self-care.

### The solution

Turn habit formation into a light virtual-pet game. A user's routine completion affects a companion with an expressive personality and a persistent evolution path. Positive consistency unlocks character development and cosmetic rewards. Repeated neglect causes **temporary, reversible** changes in mood, appearance, and surroundings. An optional **Distraction Shield** links selected entertainment-app access to achievable recovery challenges.

### Positioning

- **Primary purpose:** Build sustainable healthy daily habits.
- **Secondary benefits:** Reduce unwanted distraction, increase self-awareness, and make self-improvement engaging.
- **Emotional hook:** *My pet is a reflection of myself* and *I want to see it grow and evolve*.
- **Differentiating loop:** Real-world activity → pet response → earned rewards/digital freedom → healthier behavior.
- **Product principle:** Accountability, not punishment. The experience should motivate without shaming, overexertion, or restricting essential functions.

### Primary audience

- Working adults ages approximately 25–40.
- People struggling with consistency in wellness routines.
- People who want to cut down on distracting social media or entertainment apps.
- Fitness enthusiasts who enjoy progress and game mechanics.

The product may expand beyond these groups, but this is the initial positioning.

---

## 2. Confirmed product decisions from the questionnaire

| Area | User-selected direction |
|---|---|
| Goal | Build healthy daily habits |
| Personality | Funny, mischievous, sarcastic |
| Emotional hook | Pet reflects the user; pet grows and evolves |
| Companion | One lifelong companion with evolving forms |
| Neglect reactions | Facial/mood changes, tired or unkempt appearance, gloomy/messy surroundings, gradual progression |
| Maximum deterioration | Dramatic but never permanent death |
| Pet communication | Animations and facial expressions only |
| Habit scope | Steps, exercise, hydration, nutrition, sleep, recovery, meditation, mental wellness, reading, studying, and custom routines |
| Goal setting | AI recommendations combined with user control |
| Verification | Some activities require evidence such as timers or photos |
| Missed-goal handling | Consider context, rest days, and individual progress; user-configurable accountability |
| Routine schedule | User-defined schedules plus AI recommendations |
| Shield trigger | Several missed routines, not an immediate single miss |
| Shield recovery | Choice among multiple recovery challenges |
| Rewarded screen time | Progressively larger rewards for streaks |
| Override preference | User preferred emergencies and essential apps only; see safeguard recommendation below |
| Rewards | Evolution, new forms, clothes, accessories, customization |
| Evolution trigger | Consistent daily habits |
| Long break | Streak may reset; earned pet progress persists; user receives a welcome-back recovery quest |
| In-app gameplay | Minimal interactions beyond health tracking |
| Social | View friends' pets/achievements, leaderboards, cooperative challenges |
| AI | Detect/predict missed goals; generate adaptive recovery challenges |
| AI memory | Preferences, long-term goals, behavior patterns, and optionally conversation context |
| AI proactive behavior | Notice patterns and suggest interventions |
| Strongest demo | Dramatic pet transformation, app restriction/unlock, evolution, combined interactive showcase |
| Hackathon objective | Memorable, winning online demo |
| Scope strategy | Ambitious showcase; clearly labeled simulations acceptable when necessary |

### Still open / not explicitly decided

1. **Visual style:** 2D cartoon, stylized 3D, or retro pixel art. **Proposed default:** stylized 3D, for a compelling online demo.
2. **Accountability intensity (question not answered):** gentle / balanced / strict. **Proposed default:** balanced and explicitly opt-in.
3. **Evolution structure:** linear, branching by dominant habits, or user choice. **Proposed default:** branching evolution based on consistency and habit profile.
4. **Specific point values, streak thresholds, and timer durations:** all numbers in this document are **illustrative design parameters**, not finalized or scientifically validated.
5. **Final product name, brand identity, and pet species:** HabitPet is a working title.

---

## 3. Key design principles

1. **Real life is the main game.** The app requires only quick interactions; health and routine actions drive progress.
2. **One lifelong companion.** The pet is never permanently killed or deleted by missed goals.
3. **Separate temporary condition from permanent achievement.** A missed week can change the pet's mood but cannot erase earned evolutions.
4. **Gradual, recoverable consequences.** The pet changes progressively and has an encouraging recovery path.
5. **User agency.** Users define routines, edit goals, schedule rest days, opt into restrictions, and retain essential phone access.
6. **Transparent rules.** A deterministic scoring/rules engine applies rewards and restrictions; AI recommends rather than arbitrarily punishes.
7. **Accessible personalization.** Goals reflect ability, schedules, illness, recovery days, and available health data.
8. **Privacy by default.** Seek granular permissions, minimize stored data, and explain how AI uses information.
9. **A delightful, silent character.** Express mood with animation, expression, gesture, and environment; optional interface captions are not voice interaction.
10. **Demonstrable impact.** Measure routine consistency and distraction changes without claiming clinical outcomes.

---

## 4. Core user journey

### 4.1 Onboarding

1. Introduce HabitPet and its purpose.
2. Create the pet and choose its starting look/name (optional).
3. Choose health and custom habit categories.
4. Configure targets, frequencies, and schedule by day.
5. See AI-suggested goals; edit and accept/decline them.
6. Configure rest days, accommodations, and pause rules.
7. Connect permitted health-data sources; offer manual tracking when data is unavailable.
8. Decide whether to enable **Distraction Shield**; select only user-approved entertainment apps.
9. Select accountability intensity (proposed: Balanced default) and understand overrides.
10. Start Day 1 and meet the animated pet.

### 4.2 Daily experience

1. Open the app to see the pet in its room, with today's routine status.
2. Real-world activity records and permitted manual logs update habits.
3. The pet reacts to activity completion with animated emotions and gestures.
4. The user earns condition improvements, experience points, cosmetics, and—if enabled—screen-time credits.
5. Repeated misses produce warnings and progressive pet/environment changes.
6. If opted in and criteria are met, Distraction Shield may activate for selected nonessential apps.
7. The user chooses a short recovery challenge; completion unlocks a defined window of access.
8. Consistency over time triggers pet evolution and unlockable customization.

### 4.3 Return after inactivity

- Welcome the user back with the same pet, not a replacement.
- Permit the consistency streak to reset while preserving unlocked evolutions, accessories, and achievements.
- Provide a personalized, small recovery quest rather than requiring all missed tasks to be made up.
- Offer goal recalibration and rest/recovery accommodations.

---

## 5. Supported habits and goal management

| Habit area | Examples | Potential verification |
|---|---|---|
| Walking | 10,000 steps/day or personalized target | Health data step count |
| Exercise | 30 minutes/day or scheduled workout | Workout records or in-app timer |
| Hydration | Example: 3 L/day, personalized as appropriate | Health record or manual logging |
| Sleep/recovery | Personalized sleep duration; rest days | Available sleep data and user logs |
| Nutrition | Meal routines and nutrition behaviors | Manual entry; optional health integrations |
| Mindfulness | 10-minute meditation | In-app timer or logged activity |
| Reading | 20 minutes/day | In-app timer or user check-in |
| Studying | Focus sessions | Focus timer or user check-in |
| Custom habits | Any user-defined behavior | Configurable manual, timer, or evidence-based check-in |

**Safety and scope:** 10,000 steps, 3 liters, and 30-minute workouts are examples, **not** prescriptions. Never assume a single target fits everyone. Avoid encouraging excessive exercise, hydration, sleep deprivation, or unhealthy restrictions.

### Routine configuration features

- Daily, selected weekday, or custom frequency.
- Target units: steps, minutes, volume, sessions, or simple completion.
- Reminder windows and preferred times.
- Weights or priorities for individual goals.
- Planned rest/recovery days.
- Temporary pause for illness, injury, travel, or unusual schedules.
- Optional AI suggestions based on historical completion patterns.
- Versioned goal edits so changing a target does not unfairly rewrite old history.

### Evidence and verification

- Prefer automatic health integrations when the user consents.
- Support manual check-off for subjective/nonintegrated habits.
- Support timer-based verification where useful.
- Optionally allow photo evidence for some routines, but do not make sensitive imagery mandatory.
- Clearly distinguish self-reported, timer-based, verified, and simulated/demo activity.
- Handle missing data or device sync failure as **unknown**, not automatic neglect.

---

## 6. Pet and environment systems

### 6.1 Pet identity

- One persistent character throughout the user's journey.
- Expressive, humorous, mischievous, and sarcastic personality.
- No spoken conversations required.
- Gestures, expressions, movement, and environmental interactions communicate feelings.
- Optional UI-level captions/notifications can carry short humorous messages without making the pet a voice chatbot.

### 6.2 Condition states (proposed)

| Condition score | State | Pet reaction | Environment |
|---|---|---|---|
| 85–100 | Thriving | Energetic, playful, confident | Bright, lively, tidy |
| 60–84 | Stable | Normal, cheeky | Normal room |
| 35–59 | Struggling | Tired, slow, annoyed | Slightly messy/dim |
| 15–34 | Neglected | Disheveled, visibly low energy | Gloomy, messy |
| 0–14 | Recovery needed | Dramatically exhausted but recoverable | Very gloomy; recovery cues present |

All thresholds are **prototype defaults**, subject to testing and change.

### 6.3 Reactions and animations

- Rejoices after a goal is completed.
- Celebrates a perfect or strong routine day.
- Facepalms after repeated missed goals.
- Dramatically sighs, slouches, or glances at neglected goals.
- Looks refreshed after recovery challenges.
- Reacts to rewards, clothing changes, room upgrades, and evolution.
- Uses mood-specific idle loops and transitions.
- Never displays permanent death or irreversible harm from neglect.

### 6.4 Environment response

- Brightness, background color, clutter, objects, and ambience correlate with temporary condition.
- Environment restoration provides immediate visual reward for resuming activity.
- Room customization can be unlocked with achievements and XP.

---

## 7. Scoring, streaks, and progression

### 7.1 Three separate measurements

**Daily Health Score (0–100):** Weighted completion of today's eligible scheduled routines.

**Consistency Score:** Rolling pattern of successful routine days, excluding approved rest days and pauses. Used to drive temporary condition and accountability decisions.

**Evolution XP:** Permanent progress earned through eligible habit completion, consistency, challenges, and milestones. Not removed for missed days.

### 7.2 Illustrative weighted routine

| Activity | Example weight |
|---|---:|
| Walking | 30% |
| Hydration | 20% |
| Scheduled exercise | 30% |
| Sleep | 20% |

Proposed formula: `Daily Score = 100 × Σ(weight_i × completion_i) / Σ(eligible weight_i)`, with each completion value capped from 0 to 1. Unknown/unavailable data must be handled explicitly and not silently interpreted as 0.

### 7.3 Neglect logic

- A single missed habit should not activate app restrictions.
- Repeated missed **scheduled** routines may trigger escalating warnings.
- Consider recent consistency, approved rest days, goal difficulty, and available verification.
- Let users choose their accountability configuration.
- AI may *recommend* threshold adjustments, but the app should apply clear, explainable rules.
- Temporary condition recovers when the user resumes achievable habits.

### 7.4 Streak mechanics

- Track consecutive qualifying days or qualifying scheduled days.
- Example qualifying day: 80% of eligible weighted routine completion.
- Streaks produce XP and progressively larger, **capped** discretionary entertainment credits.
- A break can reset the streak but must not remove pet forms or accessories.
- Avoid using streak pressure to discourage rest or medical recovery.

---

## 8. Evolution and cosmetics

### Permanent evolution track

| Proposed stage | Example milestone | Illustrative unlocks |
|---|---|---|
| Stage 1: Newborn | Complete onboarding | Starter pet, starting room |
| Stage 2: Companion | 5 qualifying days | New animations and accessories |
| Stage 3: Ascended | 15 qualifying days | Major character transformation |
| Stage 4: Legendary | 30 qualifying days | Premium-looking form, special environment |

The timeline is illustrative, not fixed. The user's pet remains recognizably the same creature across stages.

### Evolution design options

- **Linear:** One shared progression path.
- **Branching (recommended):** Forms or traits reflect consistency and the user's strongest habit patterns.
- **Choice-based:** User selects an unlocked form.

### Rewards

- Clothing and accessories.
- Character skins and decorative details.
- Environment and room upgrades.
- Unique animations and emotes.
- Milestone badges, XP, achievements, and cosmetics.
- Optional entertainment-app credits, separate from permanent collectibles.

### Gameplay scope

Keep active pet care minimal. Do **not** require complex feeding, battles, or grinding just to maintain daily participation. The real-life routines should remain the principal source of progress.

---

## 9. Distraction Shield and screen-time credits

**Signature mechanic:** Allow users to voluntarily link selected entertainment-app access to routine consistency and short recovery challenges.

### 9.1 Shield states

1. **Normal:** Habits are on track; no additional shield activated by neglect.
2. **Warning:** Several missed eligible routines; visual and notification prompts to recover.
3. **Shield Active:** After repeated misses and subject to opt-in rules, selected distracting apps may be temporarily restricted.
4. **Recovery:** User selects and completes one of several manageable challenges.
5. **Unlocked:** The selected entertainment app(s) become accessible for a defined duration, subject to platform support and user settings.

### 9.2 Recovery challenge examples

| Challenge | Example requirement | Illustrative unlock credit |
|---|---|---|
| Short walk | 500 steps | 15 minutes |
| Hydration | Log a drink | 5 minutes |
| Guided stretch | 5 minutes | 10 minutes |
| Mindfulness | 5-minute session | 10 minutes |
| Personal challenge | AI-suggested, user-approved | Depends on effort and accessibility |

The challenge must be safe, context-aware, achievable, and provide multiple alternatives. The values are initial gameplay suggestions.

### 9.3 Earned screen time

- Completion of routines can bank optional entertainment-use credits.
- Consecutive qualifying days can increase reward multipliers or allowances.
- Cap credit accumulation to avoid incentivizing excessive screen use.
- Consider expiring daily credits or a maximum carryover balance.
- Explain clearly how credits are calculated, spent, and restored.

### 9.4 Restrictions and overrides — unresolved product tension

The questionnaire selected **“Only for emergencies and essential apps”** for overrides. That is a strong-accountability preference, but a total non-emergency lockout can be harmful, inaccessible, and difficult to enforce responsibly.

**Recommended implementation:**

- Restrict only apps explicitly selected by the user.
- Never shield emergency calling, communication, health services, navigation, required work functions, or other essential access.
- Provide a clearly visible override for any reason, possibly with a brief reflection prompt or cooldown, but without coercion or punishment.
- Let users turn off the feature and change goals and accountability settings.
- Offer Gentle, Balanced, and Strict opt-in modes, with **Balanced** as the proposed default.
- Restrict entertainment, not access to medical assistance or safety-critical tools.
- Label simulated restrictions as simulated during the hackathon demo.

**Technical/platform caveat:** Phone operating systems impose permissions and policy limitations on controlling other apps. iOS Screen Time/Family Controls mechanisms and Android alternatives may have different capabilities. Actual blocking must be validated; it should not be promised as universally supported.

---

## 10. AI functionality

AI is a **behavioral intelligence layer**, not a mandatory chat interface.

### 10.1 Pattern recognition and missed-goal prediction

- Analyze past completion patterns and preferred routine times.
- Surface tendencies, e.g., “evening workouts are often missed but morning workouts succeed.”
- Suggest earlier reminders, rearranged schedule windows, or smaller routines.
- Do not represent speculative correlations as verified causal predictions.

### 10.2 Adaptive recovery missions

- Propose multiple recovery challenges based on missed habits, available time, prior success, and accessibility settings.
- Prefer low-effort, safe tasks that help the user re-engage.
- Let the user accept, replace, or skip AI recommendations.
- Do not prescribe aggressive exercise or medically inappropriate hydration/food targets.

### 10.3 Personalized routine recommendations

- Suggest achievable goals during onboarding.
- Recommend target adjustments when routines are consistently too difficult or too easy.
- Account for chosen rest days, missed-data states, schedule constraints, and long-term progress.
- Require user approval for important changes.

### 10.4 Long-term memory

- Store user-approved goals, preferences, selected accountability mode, and long-term habit trends.
- Optionally retain context from conversations or feedback if such features are added.
- Give users a way to review and delete this information.
- Avoid exposing detailed health records to social features by default.

### 10.5 AI and rules boundary

- **AI does:** insights, recommendations, predicted risk indicators, personalized challenge proposals, optional creative text.
- **Deterministic system does:** score calculation, state changes, streaks, XP, evolution unlock checks, and permissioned shield decisions.

### Illustrative AI scenario

1. User misses 3 of the last 4 evening workout sessions.
2. Pattern detector identifies lower evening completion.
3. AI suggests moving one workout to the morning or shortening the session.
4. Pet performs a humorous, nonverbal “point at clock / flex / facepalm” sequence.
5. User approves the adjusted schedule.
6. Subsequent performance is monitored and visualized.

---

## 11. Social and multiplayer features — post-MVP

### Friends and showcases

- View friends' pets, cosmetics, evolution stages, and shared achievements.
- Privacy controls determine which progress is visible.

### Leaderboards and competitions

- Friendly leaderboards around consistency or progress toward personal goals.
- Avoid ranking users solely by absolute step counts or exercise volume because abilities and circumstances vary.
- Optional challenges and celebratory milestones.

### Cooperative play

- Shared wellness missions between friends.
- Combined progress toward cosmetic rewards or companion/environment events.
- Opt-in participation and graceful handling if a teammate misses activities.

These are planned expansion features, not necessary for the primary hackathon demonstration.

---

## 12. Primary screens and user experience

### MVP screens

1. **Welcome / onboarding:** Value proposition, initial avatar selection, permissions, goals.
2. **Pet Home:** Animated pet, room, condition, daily score, quick status.
3. **My Routines:** Habit cards, current progress, schedule, logs, verification.
4. **Habit Setup / Edit:** Targets, units, frequency, weights, reminders, rest days.
5. **Distraction Shield Setup:** Selected apps, modes, rule explanations, overrides.
6. **Recovery Mission Picker:** Multiple tasks, verification requirements, available unlock credit.
7. **Mission Result / Unlock:** Success animation, rewards, access state, timer.
8. **Evolution / Wardrobe:** Stages, locked/unlocked cosmetics, equipped appearance.
9. **Progress / Insights:** Streaks, consistency trend, AI suggestions, rest-day exclusions.
10. **Demo Time Machine (hackathon-only):** Switch between scripted multi-day scenarios.

### Future screens

- Friend profiles and showcases.
- Cooperative challenges.
- Leaderboards.
- Advanced history, AI insights, and long-term goal planning.
- Expanded avatar customization and room decoration.

### Visual tone

- Whimsical, expressive, and polished.
- Distinct character poses and environmental transformation at each condition level.
- Funny/mischievous attitude, without humiliating or shaming users.
- Prefer a single recognizable silhouette that evolves, rather than inconsistent character replacements.
- Proposed visual direction: **stylized 3D**; still open until confirmed.

---

## 13. Hackathon scope and priorities

The goal is to create a memorable online demo. AI-assisted development is allowed. The implementation stack is intentionally **not prescribed** in this specification.

### P0 — Essential showcase

- [ ] User onboarding with selectable routines and editable goals.
- [ ] One recognizable animated virtual companion.
- [ ] Dynamic pet moods and condition states.
- [ ] Dynamic environment deterioration/restoration.
- [ ] Daily scoring and multi-day neglect logic.
- [ ] At least one functioning health-data integration or clearly identified mocked input.
- [ ] User-approved distraction shield interface.
- [ ] Restriction and unlock flow (real if supported, otherwise transparently simulated).
- [ ] Multiple recovery challenges with progress and reward states.
- [ ] A scripted **Demo Time Machine** for condition and evolution transitions.

### P1 — High-value additions

- [ ] AI analysis of user habit patterns (can use a labeled sample history).
- [ ] AI suggestions for recovery challenges.
- [ ] At least one visually polished evolution sequence.
- [ ] Two or more accessories / cosmetic changes.
- [ ] Progress and consistency dashboard.
- [ ] Welcome-back quest and persistent progression across missed days.

### P2 — Expansion / roadmap

- [ ] Friends and pet showcase.
- [ ] Cooperative challenges.
- [ ] Leaderboards.
- [ ] Full integration of sleep, nutrition, and mindfulness data.
- [ ] More evolution branches and environments.
- [ ] Richer long-term AI personalization and memories.
- [ ] Stronger verification and anti-cheat handling.

### What **not** to prioritize for the demo

- A complex backend or many integrations for their own sake.
- Deep avatar minigames unrelated to real wellness actions.
- Competitive multiplayer before the primary gameplay loop works.
- An elaborate AI chat interface in conflict with silent pet communication.

---

## 14. Demo Time Machine

**Purpose:** Simulate a 30-day user journey in seconds so judges can observe features that would normally take weeks.

### Example scripted journey

| Simulated day | Scenario | Expected visible result |
|---|---|---|
| 1–3 | User starts strong | Happy pet; normal room; initial XP |
| 4–9 | User repeatedly misses routines | Tired animations; deteriorating environment |
| 10–14 | Repeated misses cross an opted-in threshold | Distraction Shield warning and active state |
| 15–22 | User completes recovery missions | Access restored, mood improves, XP rises |
| 23–30 | User maintains consistency | Evolved pet, brighter room, new accessory |

### Time Machine controls

- Scrub or jump between day milestones.
- Show underlying habit data and condition score for each simulated state.
- Animate pet and environment transitions.
- Toggle between recovered and neglected states.
- Trigger restriction/unlock demonstration.
- Trigger evolution reveal.
- Clearly label all injected/simulated events as **demo data**.

### Real versus simulated

A real health-data read is desirable. If OS permissions or integration complexities prevent real app restrictions, show the full user experience as a **clearly described simulation**, not a falsely claimed OS-level block.

---

## 15. Three-minute online demo storyboard

### Scene 1 — Meet your virtual self (0:00–0:30)

Create the pet, select walking/hydration/exercise routines, and choose an optional distracting app. Show the pet's mischievous personality.

### Scene 2 — Neglect visibly changes everything (0:30–1:05)

Use the Time Machine to advance through missed goals. Pet looks exhausted; room becomes gloomy/messy; scores drop.

### Scene 3 — Distraction Shield activates (1:05–1:35)

Show the selected entertainment-app restriction (real where possible, otherwise labeled simulation). User is offered recovery mission choices.

### Scene 4 — Earn back access (1:35–2:10)

Complete a quick walking or mindfulness challenge, with real or labeled sample data. Pet revives; XP increases; entertainment app becomes accessible for an allotted time.

### Scene 5 — Evolution reveal (2:10–2:40)

Advance through successful days. Trigger a dramatic character evolution and an upgraded environment/cosmetic unlock.

### Scene 6 — Reveal AI value (2:40–3:00)

Show a concrete detected pattern—e.g., missing evening workouts—and an adaptive, user-approved schedule suggestion.

**Suggested closing line:** “Your phone already knows how much time you spend looking at it. HabitPet helps you spend more time looking after yourself.”

### Demo best practices

- Use one consistent animated character across all scenes.
- Make the before/after transformation immediately obvious on a video call.
- Keep narration focused on the product problem and the effect on behavior.
- Prepare both a live happy path and a backup recorded walkthrough.
- Label mock health readings, artificial time jumps, and simulated blocking.
- Avoid claiming the project has proven health efficacy without user-study evidence.

---

## 16. Product success metrics

| Metric | Proposed definition | Why it matters |
|---|---|---|
| Habit completion rate | Completed eligible goal weight / total eligible goal weight | Routine adherence |
| Weekly consistency | Count of qualifying scheduled days | Sustainable engagement |
| Recovery engagement | Recovery missions accepted and completed | Effectiveness of re-entry loop |
| Distracting-app time | Daily minutes in user-selected entertainment apps | Digital well-being effect |
| Retention | Users who continue active participation across periods | Product stickiness |
| Goal sustainability | Whether targets are maintained or sensibly recalibrated | Avoid unsustainable pressure |
| Self-reported well-being | Opt-in feedback on stress, helpfulness, and motivation | Check for beneficial versus harmful experience |

Treat these as **metrics to test**, not demonstrated outcomes. If time allows, run brief usability tests with a few participants and report actual observations.

---

## 17. Safeguards, privacy, and accessibility

### Behavioral safety

- Never permanently kill the pet or erase long-term achievements.
- Never require unhealthy exertion to unlock essential phone access.
- Include rest days, illness modes, injury accommodations, and alternative challenges.
- Avoid shame-based copy, coercive patterns, and harmful comparisons.
- Provide accessible overrides and ability to disable Distraction Shield.
- Do not encourage unsafe hydration, sleep, exercise, or nutrition behaviors.

### Privacy

- Request only necessary health and app-usage permissions.
- Distinguish sensitive health records from derived game scores.
- Minimize retention of raw health data where feasible.
- Allow users to delete stored behavioral history and preferences.
- Share only opted-in achievements with friends, not raw medical data.
- Make AI data use and processing transparent.

### Inclusive UX

- Personalize routine targets; do not assume equal ability.
- Offer non-exercise recovery alternatives.
- Support users without wearables or with incomplete data.
- Provide accessible contrast, motion-reduction options, and understandable controls.
- Ensure reminders and game consequences are not excessively intrusive.

### Feasibility constraints

- Health-data read permissions depend on device, operating system, and available sources.
- Screen-time restrictions depend on platform entitlements, permissions, and app policies.
- Demo simulations are allowed as part of the scope strategy but must be disclosed.

---

## 18. Proposed acceptance criteria for the P0 MVP

- [ ] A new user can create a pet and configure at least three daily or scheduled habits.
- [ ] Completion changes a visible habit progress indicator and pet reaction.
- [ ] The pet has at least four clearly different condition appearances/animation sets.
- [ ] The environment changes with the temporary pet condition.
- [ ] Multiple simulated missed days trigger warnings before any shield state.
- [ ] The user has opted into and chosen distraction targets before restrictions are shown.
- [ ] A recovery screen displays at least two valid challenge options.
- [ ] Completing a challenge updates pet state, rewards, and access state.
- [ ] At least one major evolution animation can be triggered from earned or demo progress.
- [ ] Earned evolution/cosmetics persist when the pet temporarily deteriorates.
- [ ] The demo can move among scripted milestones in seconds.
- [ ] The screen clearly distinguishes actual OS restrictions/health integrations from simulated states.
- [ ] Rest days and missing health data do not silently count as failures.

---

## 19. Recommended immediate production sequence

1. **Lock the creative direction:** final name, pet silhouette, animation style, and visual evolution stages.
2. **Storyboard the hero interaction:** missed goals → pet transforms → distraction shield → recovery mission → access restored → evolution.
3. **Define a small coherent data model:** habits, schedules, daily observations, scores, pet conditions, streaks, XP, challenges, unlock credits, and permissions.
4. **Create a deterministic prototype:** scripted 30-day activity data and state transitions.
5. **Polish the pet and room transitions:** the primary emotional and visual differentiator.
6. **Implement the single end-to-end challenge:** from selection to verification to reward/unlock.
7. **Add one genuine integration if feasible:** proof of real-world activity affecting the pet.
8. **Add an AI insight based on a concrete historical pattern.**
9. **Prepare the online demo and backup walkthrough.**
10. **Perform a small usability pass** to ensure the experience is motivating, understandable, and not overly punitive.

---

## 20. One-paragraph pitch for judges

HabitPet transforms healthy habit formation into an emotionally engaging game. Instead of checking off tasks, users raise a lifelong virtual companion whose appearance, personality, environment, and evolution respond to real-world activity. Consistent routines unlock new forms and cosmetics; repeated missed goals cause temporary deterioration and can activate an optional distraction shield for user-selected entertainment apps. AI identifies patterns behind missed goals and proposes personalized recovery missions, making it easier to re-engage. HabitPet brings together wellness tracking, a memorable virtual character, digital well-being, and adaptive behavioral support in one feedback loop.

---

## 21. Open decisions checklist

- [ ] Confirm final name: HabitPet or another brand.
- [ ] Confirm art direction: 2D, stylized 3D, or pixel art.
- [ ] Confirm evolution system: linear, branching, or chosen form.
- [ ] Select Gentle/Balanced/Strict default and final override interaction.
- [ ] Agree on neglect thresholds, streak rules, credit caps, and XP values.
- [ ] Choose the first real health-data source and demonstration device.
- [ ] Confirm whether OS-level app restriction is viable for the showcase.
- [ ] Finalize the exact companion designs and evolution animations.
- [ ] Decide which demo scenes are real integrations and which are simulated.
- [ ] Select one AI pattern-detection use case to demonstrate convincingly.

---

*Document notes: This specification consolidates the discussed product vision and the user's questionnaire responses. Recommended mechanics are labeled as proposals where they were not explicitly selected. No technology stack has been imposed; the hackathon permits AI-assisted development.*
