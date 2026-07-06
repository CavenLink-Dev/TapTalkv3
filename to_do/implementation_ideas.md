# TapTalk Implementation Ideas & Improvements

A prioritised list of architectural fixes, missing features, and polish tasks to bring TapTalk from prototype to production-ready AAC app.

### 1. talk.tsx is a 271KB abomination

That is not a file. That is a filing cabinet that fell down a staircase. Board tile data, gesture logic, animation state, dock controls, grid math, drag placeholders — all in one file that exceeds the Read tool's own maximum size limit. You literally cannot read it in one shot.

Split it: boardData.ts, BoardTile.tsx, DockControls.tsx, EditMode.tsx, GestureHandlers.tsx. Right now, fixing one tile label requires navigating 1,400+ lines of rendering code to find where HOME_TILES lives.

### 2. The system theme check is a shipped bug

In 08-accessibility.tsx line 83 the isDark check has false hardcoded. A user who selects System theme on the accessibility setup screen gets the light theme always. The Appearance.getColorScheme() call is one line. This is not a TODO — it is a bug in the screen specifically designed to set accessibility preferences.

### 3. The TTS has no queue — rapid taps produce garbage

Speech.speak has no utterance queue. Tap I, tap want, tap pizza quickly — what does the user hear? Overlapping fragments, cancellations, or silence, depending on the device. There is no finish current word then speak next strategy, no interrupt and speak full sentence mode. For an AAC user building a sentence, this is the entire point of the app. Fix it with a proper speech queue that either queues utterances or waits for sentence-level speak on the strip.

### 4. VoiceOver does not hear the message strip update

When a user taps a tile and a word is appended to the message strip, VoiceOver users get no announcement. There is no accessibilityLiveRegion polite on the strip container, and the word chips do not announce their own addition. A VoiceOver user tapping tiles has no confirmation that their tap registered in the strip. For a non-verbal user who also has low vision, this is the core interaction loop — and it is silent.

### 5. reflowAroundPinned has a magic 500 limit with silent failure

The reflow loop has for let s = other.slot + 1; s < 500; s++. Where does 500 come from? If a user has a large custom board and this loop runs out of bounds, the tile gets left in place overlapping another — silently. The bound should be derived from actual board capacity. And the failure path give up gracefully keep in original slot may overlap unlikely is not graceful. It is a layout corruption with a friendly comment on top.

### 6. No switch access or scanning mode — unforgivable for an AAC app

NEXT.md lists Motor Access Mode as an idea to ask the user about. Many people who need AAC also have significant motor impairments — cerebral palsy, ALS, spinal cord injury — and use single or dual switch scanning to navigate interfaces. Without row-column scanning, you have excluded the most severely communication-impaired users. The people who need this app the most cannot use it. Every drag-and-drop action in edit mode, every long-press context menu — none of that exists for a switch user.

### 7. AsyncStorage is a single point of failure for custom vocabulary

A user with non-verbal autism who has spent six months building their custom tile set — their mum's photo, their specific hospital tile, their personal phrases — lives entirely in AsyncStorage. One hard reset. One corrupted storage write under a crash. One upgrade gone wrong. Gone.

There is no export, no iCloud backup, no file share, no send to therapist. The sentenceHistory, customBoardTiles, pronunciations — all of it. You are asking the most vulnerable users to trust a key-value store with their entire communication vocabulary. That is not acceptable. At minimum: export to JSON, iCloud Ubiquity, or even email the file.

### 8. The ngramModel in state appears to do nothing

state.ngramModel is tracked, persisted, and hydrated. The buildMessageUtterances utility exists. But there is zero evidence of next-word prediction actually appearing in the UI.

Word prediction is not a nice-to-have in AAC — it is a communication rate multiplier. I suggests want, need, feel. I want suggests water, toilet, help. Every study on AAC communication rate improvement points here. You have the data structure. Wire it up.

### 9. TTS voice selector

The Voice & Speech screen exposes rate and pitch only. Surface expo-speech voices with per-voice preview so users can choose a voice that matches their identity and preference.

### 10. Section and StaticSection are identical twins

In 08-accessibility.tsx the Section and StaticSection functions are byte-for-byte identical in implementation. Someone copy-pasted and forgot to finish. Delete one, use the other. This is not critical — but it tells me this screen has not had a proper review pass. And this is the accessibility setup screen.

### 11. The DockPeekPill accessibility hint is wrong

The hint says Double tap to bring back the control bar. In VoiceOver, every action is a double tap. Saying double tap in a hint is redundant and reads aloud to every VoiceOver user every time. Apple HIG says hints should describe the result, not the gesture. Change it to Restores the control bar and navigation. Also — if a motor-impaired user accidentally triggers the hide feature, they now have to find and precisely tap a small pill hugging the screen edge. That is a trap.

### 12. Animals vocabulary board and pack

Populate the freed animals board key and an Animals symbol pack with 79+ verified Mulberry animal symbols. Wire a Home folder for it.

### 13. Persisted custom tiles for moved or grouped boards

Cross-board moves and group boards currently live in memory via userTilesRef and BOARD_TILES mutation and do not fully survive relaunch. Move them into the persisted reducer state.

### 14. Quick view filtered-only mode

Optional toggle that shows only tagged symbols in Quick view as a true filter, not dim, completing the BOARD_QUICK_TAGGED_VISIBILITY intent.

### 15. Full activity dark-mode sweep

The remaining light-only chips and pills in the three game screens with hardcoded colours like E6F4FD, F1F5F9, FFF4E0 mapped to tokens, plus ActivityCompletionOverlay.

### 16. Board text-size support

Tile labels, folder labels and dock labels currently use fixed sizes. Scale them with t.textScale the way the message strip now does.

### 17. Real verification backend

Email and SMS one-time codes via Supabase. The registration UI stubs this today. Add duplicate-email check.

### 18. Sweep-select polish

Marquee visual during drag, VoiceOver custom actions alternative for sweep, and Select All across scrolled-out tiles confirmation.

### 19. Role-aware caregiver features

Now that therapist exists, gate guardian-only flows like PIN and consent editing vs therapist flows like progress export explicitly.

### 20. Board virtualisation

Large custom boards render every tile. Windowing the grid or FlashList keeps 60fps as user boards grow past 100 tiles.

---

## Page Index

| Page | File |
|---|---|
| Splash | `app/onboarding/splash.tsx` |
| Get Started | `app/onboarding/get-started.tsx` |
| Tour | `app/onboarding/tour.tsx` |
| Login | `app/auth/login.tsx` |
| Forgot Password | `app/auth/forgot-password.tsx` |
| Registration (9 steps) | `app/registration/01-who.tsx` → `09-profile.tsx` |
| Talk / AAC Board | `app/(tabs)/talk.tsx` |
| Activities | `app/(tabs)/activities.tsx` |
| Tools | `app/(tabs)/tools.tsx` |
| Me / Profile | `app/(tabs)/me.tsx` |
| Board Settings | `app/board/settings.tsx` |
| Quick Talk | `app/board/quick-talk/index.tsx` |
| Board Keyboard | `app/board/keyboard/index.tsx` |
| Hidden Tiles | `app/board/hidden-tiles.tsx` |
| Shape Match | `app/activities/shape-match.tsx` |
| Colour Pop | `app/activities/colour-pop.tsx` |
| Memory Match | `app/activities/memory-match.tsx` |
| Activity Progress | `app/activities/progress.tsx` |
| Activity Progress Detail | `app/activities/progress-detail.tsx` |
| Calendar | `app/calendar/index.tsx` |
| New Plan | `app/calendar/new-plan.tsx` |
| Day Timeline | `app/calendar/day/index.tsx` |
| Step by Step | `app/first-then/index.tsx` |
| Add Step | `app/first-then/add-step.tsx` |
| Visual Timer | `app/visual-timer/index.tsx` |
| Voice Settings | `app/settings/voice.tsx` |
| Display & Accessibility | `app/settings/display.tsx` |
| Account Settings | `app/settings/account.tsx` |
| Pronunciation | `app/settings/pronunciation.tsx` |
| Communication Passport | `app/passport.tsx` |
| Guardian Symbol Override | `app/guardian-symbol-override.tsx` |
| Legal (5 pages) | `app/legal/` |

---

## Most-Used Shared Components

These appear across nearly every screen — update them carefully.

- `useTheme()` — theme tokens, used in every single component
- `useAppContext()` — global state (board, accessibility, message words)
- `Card` — surface container (`src/components/native/Card.tsx`)
- `SettingsRow` — settings list row, 5 types (`src/components/native/SettingsRow.tsx`)
- `PrimaryButton` — main CTA button (`src/components/native/PrimaryButton.tsx`)
- `DisclosureRow` — expand/collapse row (`src/components/native/DisclosureRow.tsx`)
- `WheelPicker` — drum-roll picker (`src/components/native/WheelPicker.tsx`)
- `ColorPickerSheet` — colour wheel modal (`src/components/native/ColorPickerSheet.tsx`)
- `MulberrySymbol` — Mulberry SVG renderer (`src/components/symbols/MulberrySymbol.tsx`)
- `hapticSelection / hapticSuccess` — haptic feedback (`src/utils/haptics.ts`)
- `useReduceMotion()` — motion preference (`src/hooks/useReduceMotion.ts`)
