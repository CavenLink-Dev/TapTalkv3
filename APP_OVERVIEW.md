# TapTalk — App Overview

> **What this document is:** A complete, ground-truth summary of what TapTalk is, who it's for, what it actually does today, and how it's built. No aspirational features — only what exists in the codebase right now.

---

## What Is TapTalk?

TapTalk is an **iOS AAC (Augmentative and Alternative Communication) app** built with React Native and Expo SDK 54. It's designed for people with disabilities — including autism, ADHD, speech differences, and other conditions where spoken communication may be difficult — as well as their families, caregivers, and therapists.

The app gives users a **tap-to-speak word board** (AAC grid) where tapping symbols builds sentences that are spoken aloud via the device's text-to-speech engine. Beyond communication, it includes daily planning tools (calendar, tasks, First-Then boards, lists), activities, progress tracking with goals, and caregiver controls.

---

## Who Is It For?

| User | Role in App |
|------|-------------|
| **End user** (child/young person) | Uses the AAC board, activities, daily tools |
| **Parent / Guardian** | Sets up parental lock, timeout, email verification |
| **Support person / therapist** | Can set up on behalf of the user |
| **Caregiver** | Uses lock controls, enables/disables activities, exports data |

---

## What Actually Exists Today

### Core Architecture

- **Framework:** React Native 0.81.5 + Expo SDK 54 + TypeScript
- **Navigation:** Expo Router (file-based routing in `app/`)
- **State:** `useReducer` in `AppContext` with `AsyncStorage` persistence
- **Platform:** iOS only (portrait, iPhone 16.0+, no iPad)
- **Bundle ID:** `com.taptalk.app`
- **Version:** 0.1.0

### Tab Structure (5 Tabs)

| Tab | File | What It Does |
|-----|------|--------------|
| **Talk** | `app/(tabs)/talk.tsx` | AAC word board + keyboard mode. Tap symbols to build sentences; speaker button speaks via `expo-speech`. |
| **Today** | `app/(tabs)/today.tsx` | Calendar, tasks, First-Then board, and list tools. |
| **Activities** | `app/(tabs)/activities.tsx` | Activity selection screen with playable activities. |
| **Progress** | `app/(tabs)/progress.tsx` | Stats overview + goals list with step tracking. |
| **Me** | `app/(tabs)/me.tsx` | Profile, settings, caregiver controls, and library entry. |

### Onboarding Flow (Implemented)

When a user first opens the app, they go through an **8-step animated onboarding wizard**:

1. **Splash** — Animated mascot fade-in, logo slide-up, loading dots → auto-navigates after 2.8s
2. **Welcome / Name** — Speech bubble typewriter intro, first name + last name + display name entry
3. **Guardian Handoff** — "Please give device to a grown-up" screen
4. **Parental Controls** — Toggle parental lock, set 6-digit PIN, enter parent email + verification code
5. **Timeout** — Set inactivity lock timeout in hours
6. **Verification** — Enter 6-digit code (currently a stub — accepts any 6 digits)
7. **Theme & Text Size** — Choose sunset/ocean/forest theme; pick text scale (0.25x / 1.0x / 2.0x)
8. **App Mode** — Select Simple / Guided / Advanced interface complexity

### Age Consent Screen (Implemented)

A separate screen (`app/onboarding/age-consent.tsx`) handles **legal compliance** across jurisdictions:

- **Australia:** Under 15 blocked without verified guardian
- **US COPPA:** Under 13 requires verifiable parental consent
- **EU GDPR:** Default 16, floor 13

It covers **28 variant combinations** (Myself vs Someone Else × 4 age ranges × guardian yes/no × blocked/allowed outcomes). Uses 8 reusable animated components with spring animations, haptics, and Reduce Motion accessibility support.

### Authentication (Mock)

- `app/auth/login.tsx` — Login screen
- `app/auth/sign-up.tsx` — Sign-up screen
- `app/pay.tsx` — Subscription screen

These are **local mock flows**. Supabase is **intentionally not connected yet** (per README).

### AAC Talk Screen (Implemented)

- Word board with color-coded cells (pronouns, verbs, folders, etc.)
- Message strip at top showing tapped words
- Tap word → append to sentence + haptic feedback
- Speaker button → speaks full sentence via `expo-speech`
- Keyboard mode toggle → QWERTY typing with same speak functionality
- Folder navigation (e.g., "Food" folder expands to apple, banana, pizza, water, milk)

### Data Model (Real)

The app stores and persists:

- User profile (legal name, display name, nickname, age, role, email, use cases)
- Parent/guardian settings (lock enabled, hashed PIN, email, timeout hours)
- AAC message words and current board selection
- Tasks with tags, due dates, reminders, completion status
- Named lists with completable items
- First-Then selections
- Goals with nameable steps and completion tracking
- Talk stats (total words, sessions today, streak days)
- Activity stats (games played, minutes today)

All stored in `AsyncStorage` via `AppContext` reducer with hydration on app launch.

---

## Tech Stack (What's Actually Installed)

| Concern | Package |
|---------|---------|
| Framework | `expo` ~54.0.0, `react-native` 0.81.5 |
| Router | `expo-router` ~6.0.0 |
| Storage | `@react-native-async-storage/async-storage` 2.2.0 |
| TTS | `expo-speech` ~14.0.7 |
| Haptics | `expo-haptics` ~15.0.7 |
| Crypto | `expo-crypto` ^56.0.4 |
| Notifications | `expo-notifications` ~0.32.12 |
| Animation | `react-native-reanimated` ^3.16.7 + React Native `Animated` |
| Gestures | `react-native-gesture-handler` ~2.28.0 |
| Safe Area | `react-native-safe-area-context` ~5.6.0 |
| Testing | `jest-expo`, `@testing-library/react-native` |

---

## Key Animation Systems (Implemented)

| Animation | Where | Tech |
|-----------|-------|------|
| Splash mascot/logo fade + slide | `app/onboarding/splash.tsx` | `Animated.sequence` + `Animated.parallel` |
| Speech bubble typewriter | `src/components/SpeechBubble.tsx` | `setInterval` (38ms/char) + spring pop-in |
| Loading dots pulse | `src/components/LoadingDots.tsx` | `Animated.loop` with staggered delays (0ms, 220ms, 440ms) |
| Step transitions | `app/onboarding/index.tsx` | Parallel fade (260ms) + spring slide (±24px) |
| Card slide-up | `app/onboarding/index.tsx` | Spring from 160px below after speech bubble completes |
| Progress bar fill | `src/components/native/ProgressBar.tsx` | Two-phase liquid pills with spring width |
| Verification bounce | `app/onboarding/index.tsx` (inline `BounceCircle`) | Spring scale 0 → 1 |
| Age consent buttons | `src/components/native/*.tsx` | Reanimated spring press feedback, progressive disclosure |

---

## Mascot System

The app uses a mascot named **"Clo"** with **29 static PNG emotion states**:

- `excited_wave` (splash screen)
- `happy_smile` (step 1 welcome)
- `happy_grin` (step 2 guardian handoff)
- `sleeping` (step 3 parental controls)
- `thinking_puzzled` (step 4 timeout)
- `sad_worried` (step 5 verification failed)
- `happy_looking_up`, `winking_smile`, `neutral_curious`, and many more

All are rendered via `MascotImage.tsx` as static `<Image>` components with accessibility labels.

---

## What Is NOT Built Yet

These are in the implementation plan but **do not exist** in the codebase:

- `src/data/` directory (AAC word lists, activity metadata, documents)
- Full AAC grid with Mulberry symbols (currently uses emoji placeholders)
- Backend integration (Supabase is not connected)
- Real email verification (6-digit code check is a stub)
- Subscription billing logic
- Real authentication backend
- Symbol picker for First-Then board
- Activity games (selection screen exists, individual activities are shells)
- Documentation library content
- Export / data sharing features

---

## File Layout (Real)

```
TapTalk/
├── app/
│   ├── index.tsx              # App entry: hydrate → redirect to onboarding or tabs
│   ├── _layout.tsx            # Root layout with SafeAreaProvider + AppContext
│   ├── pay.tsx                # Subscription screen (mock)
│   ├── auth/
│   │   ├── login.tsx          # Login screen
│   │   └── sign-up.tsx        # Sign-up screen
│   ├── onboarding/
│   │   ├── _layout.tsx        # Onboarding stack layout
│   │   ├── splash.tsx         # Animated splash screen
│   │   ├── index.tsx          # 8-step onboarding wizard (main file, ~660 lines)
│   │   ├── age-consent.tsx    # Age/guardian consent screen (401 lines)
│   │   └── test-age-consent.tsx
│   └── (tabs)/
│       ├── _layout.tsx        # Tab bar layout (5 tabs)
│       ├── talk.tsx           # AAC board + keyboard
│       ├── today.tsx          # Calendar, tasks, tools
│       ├── activities.tsx     # Activity selection
│       ├── progress.tsx       # Stats + goals
│       └── me.tsx             # Profile, settings, caregiver controls
├── src/
│   ├── context/
│   │   ├── AppContext.tsx     # Global state + AsyncStorage persistence
│   │   └── types.ts           # All TypeScript interfaces
│   ├── hooks/
│   │   ├── useAppContext.ts
│   │   └── useSpeech.ts       # expo-speech wrapper
│   ├── components/
│   │   ├── MascotImage.tsx    # 29-emotion mascot registry
│   │   ├── SpeechBubble.tsx   # Typewriter speech bubble
│   │   ├── LoadingDots.tsx    # Animated loading indicator
│   │   ├── TapTalkMascot.tsx  # Alternate mascot component
│   │   └── native/            # 15+ reusable UI components
│   ├── styles/
│   ├── utils/
│   └── theme/tokens.ts        # Colors, spacing, typography, radii, shadows
├── asset/                     # 29 mascot PNGs + splash images
├── plans/                     # Implementation plan documents
├── AGE_CONSENT_*.md           # Age consent documentation
├── app.json                   # Expo config
├── babel.config.js            # Reanimated plugin included
└── package.json
```

---

## How to Run It

```bash
npm install
npx expo start
# Scan QR with Expo Go on iPhone
```

Target: iPhone 15 Pro (393×852pt) primary, iPhone SE secondary. Runs in Expo Go without ejecting.

---

## Legal / Compliance Notes

- Age consent logic handles **Australia (15+)**, **US COPPA (13+)**, and **EU GDPR (13–16)** frameworks
- PIN is hashed with **SHA256 + salt** via `expo-crypto` before storage
- No microphone access — app only **outputs** speech via TTS, never records audio
- Notification permission requested during onboarding (no microphone prompt)

---

*This document reflects the actual state of the codebase as of the latest commit. It was generated by reading every significant file, not by guessing.*
