# TapTalk — iPhone App Implementation Plan (React Native / Expo SDK 54)

## Context
Build a complete iPhone-first React Native app called **TapTalk** for users with disabilities (AAC, autism, ADHD, etc.), their families, caregivers, and therapists. Primary source of truth: `src/imports/pasted_text/tap-talk-design-brief.md`. Mascot images: `image.png` (brain head), `image-1.png` (business suit), `image-2.png` (astronaut suit). **Structure and logic only — no design decisions. All visual design comes from Figma.**

---

## Corrections Applied to Previous Plan
- **iPhone only** — iPhone 15 Pro primary (393×852pt), iPhone SE secondary check. No iPad.
- **React Native + Expo SDK 54** — no web APIs, no browser libraries.
- **Expo Router** — file-based navigation. No React Router, no createBrowserRouter.
- **App name: TapTalk** — not Squid.
- **No shadcn, no react-day-picker, no canvas-confetti, no localStorage, no Web Speech API.**
- **No design decisions** — no colours, spacing, radius, or tokens in this plan.
- **Notification permission only** in onboarding — no microphone (TapTalk outputs speech via expo-speech; it does not record).
- **Today tab now includes First-Then and List tools** in addition to calendar/tasks.
- **Progress tab includes Goals** — they are combined, not separate.
- **Me tab** contains settings, profile, caregiver controls, and the Library/Documentation entry.

---

## Tech Stack

| Concern | Package |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Navigation | Expo Router (file-based, `app/` directory) |
| Language | TypeScript |
| Storage | `@react-native-async-storage/async-storage` |
| TTS (output only) | `expo-speech` |
| Haptics | `expo-haptics` |
| Notifications | `expo-notifications` |
| Builds | EAS (Expo Application Services) |

---

## Project Setup

This is a **new React Native / Expo project** — not built inside the existing web scaffold.

```bash
npx create-expo-app@latest TapTalk --template blank-typescript
cd TapTalk
npx expo install expo-router expo-speech expo-haptics expo-notifications \
  @react-native-async-storage/async-storage \
  react-native-safe-area-context react-native-screens
```

`app.json` must include: `scheme`, `expo-router` plugin, `expo-notifications` plugin.

---

## Tab Bar — 5 Tabs

| Tab | Label | Route |
|---|---|---|
| 1 | Talk | `/(tabs)/talk` |
| 2 | Today | `/(tabs)/today` |
| 3 | Activities | `/(tabs)/activities` |
| 4 | Progress | `/(tabs)/progress` |
| 5 | Me | `/(tabs)/me` |

---

## Expo Router File Structure

```
app/
├── _layout.tsx                      ← Root layout: AppContext provider + SafeAreaProvider
├── index.tsx                        ← Entry: reads AsyncStorage, redirects to onboarding or tabs
├── onboarding/
│   ├── _layout.tsx                  ← Stack navigator; holds accumulated onboarding state via context
│   ├── splash.tsx
│   ├── step-1.tsx                   ← "Welcome to TapTalk" + astronaut mascot
│   ├── step-2.tsx                   ← "Talk your way." + business mascot
│   ├── step-3.tsx                   ← "Play and grow." + head mascot
│   ├── step-4.tsx                   ← "Own your day." + astronaut mascot
│   ├── step-5.tsx                   ← "First, a few quick questions." (no illustration)
│   ├── step-6.tsx                   ← Name input (Continue disabled until non-empty)
│   ├── step-7.tsx                   ← Nickname input
│   ├── step-8.tsx                   ← Age input (number or scroll wheel)
│   ├── step-9.tsx                   ← Role selector — 3 single-select cards
│   ├── step-10.tsx                  ← Use-case multi-select — 4 cards, Continue when ≥1
│   ├── step-11.tsx                  ← Notifications permission only (NOT microphone)
│   └── step-12.tsx                  ← "You are all set. Welcome to TapTalk, [nickname]." + Let's go
└── (tabs)/
    ├── _layout.tsx                  ← Tabs navigator (5 tabs)
    ├── talk/
    │   ├── index.tsx                ← AAC board screen (mode toggled locally: board vs keyboard)
    │   └── board.tsx                ← TalkBoard keyboard mode (or sub-view within index)
    ├── today/
    │   ├── index.tsx                ← Today hub: calendar/tasks + tool access (First-Then, List)
    │   ├── first-then.tsx           ← First-Then tool
    │   └── list.tsx                 ← List tool (create named lists with items)
    ├── activities/
    │   ├── index.tsx                ← Activities selection screen
    │   └── [activityId].tsx         ← Dynamic route for each activity screen
    ├── progress/
    │   ├── index.tsx                ← Progress overview + Goals hub
    │   ├── new-goal.tsx             ← Create goal form
    │   └── [goalId].tsx             ← Goal detail + steps
    └── me/
        ├── index.tsx                ← Me hub: profile, settings, caregiver controls, Library entry
        └── library/
            ├── index.tsx            ← Documentation list screen
            └── [docId].tsx          ← Full-screen document reader

src/
├── context/
│   ├── AppContext.tsx               ← useReducer + AsyncStorage persistence
│   ├── OnboardingContext.tsx        ← Accumulated answers during onboarding flow
│   └── types.ts                    ← All shared TypeScript interfaces
├── hooks/
│   ├── useAppContext.ts             ← Typed useContext shorthand
│   ├── useSpeech.ts                ← expo-speech: speak(text), stop(), isSpeakingAsync()
│   ├── useHaptics.ts               ← expo-haptics: light(), medium(), success(), error()
│   └── useNotifications.ts         ← expo-notifications: requestPermission(), schedule(), cancel()
├── data/
│   ├── aacWords.ts                 ← Word list: { id, label, wordType, emoji? }
│   ├── aacCategories.ts            ← Category folder definitions
│   ├── activities.ts               ← Activity metadata: { id, name, description, activityType }
│   └── documents.ts                ← Static documentation library data
├── components/
│   ├── TapTalkMascot.tsx           ← Image component, variant: 'head' | 'business' | 'astronaut'
│   ├── talk/
│   │   ├── MessageBar.tsx          ← Horizontal ScrollView of word chips + X clear button
│   │   ├── BoardSubheader.tsx      ← Board name + home icon + share icon
│   │   ├── AACGrid.tsx             ← Grid of AACCell — ~4 cols × 5–6 rows on iPhone
│   │   ├── AACCell.tsx             ← Pressable: label area top, empty image area below, wordType drives style
│   │   ├── CategoryRow.tsx         ← Horizontal ScrollView of folder category shells
│   │   ├── BoardToolbar.tsx        ← 5 evenly-spaced icon Pressables at bottom
│   │   ├── MessageCard.tsx         ← Large card with "Tap to start…" + backspace/speaker/+ buttons
│   │   └── CustomKeyboard.tsx      ← Numbers row + 3 QWERTY rows + action row (Undo/Space/Clear All)
│   ├── today/
│   │   ├── MonthCalendar.tsx       ← Custom month grid: View + Pressable cells, dot tags under dates
│   │   ├── TaskPanel.tsx           ← Animated.View sliding open below selected date
│   │   ├── TaskList.tsx            ← FlatList of TaskItem; completed sorted to bottom
│   │   ├── TaskItem.tsx            ← Row: ○ Pressable + label; tap toggles complete state
│   │   ├── AddTaskModal.tsx        ← Modal (animationType="slide") with full task form
│   │   ├── FirstThenBoard.tsx      ← Two slot shells (First | Then) + reset control
│   │   ├── ListScreen.tsx          ← Named list with items, ○ checkbox, + to add items, reminders
│   │   └── TodayToolMenu.tsx       ← Entry point to First-Then and List tools from Today hub
│   ├── activities/
│   │   ├── ActivityCard.tsx        ← Card: name, description, Play button
│   │   ├── ActivitySelection.tsx   ← Grid/list of ActivityCard components
│   │   └── GameLayout.tsx          ← Shared wrapper: exit/pause/back button, header, spacious content area
│   ├── progress/
│   │   ├── ProgressOverview.tsx    ← Talk + Activity stats; encouraging language, no scoreboards
│   │   ├── TalkStatsCard.tsx
│   │   ├── ActivityStatsCard.tsx
│   │   ├── MascotEncouragement.tsx ← Mascot + motivational copy
│   │   ├── GoalsList.tsx           ← List of GoalCard components; empty state "What's Your Goal?" + +
│   │   ├── GoalCard.tsx            ← Goal name, encouragement message, vertical steps list
│   │   ├── GoalForm.tsx            ← Create/edit goal: all fields + Steps section + + button
│   │   ├── StepBottomSheet.tsx     ← Modal from bottom: step name, how, achievable by, Save
│   │   └── StepItem.tsx            ← ○ Pressable; on complete: stays in place, completed state, celebration Modal
│   ├── me/
│   │   ├── ProfileHeader.tsx       ← User name, avatar, edit
│   │   ├── CaregiverControls.tsx   ← Lock, activity enable/disable, export, sequence/timer setup
│   │   ├── LibraryEntry.tsx        ← Prominent entry card/button to Library screen
│   │   └── library/
│   │       ├── DocSearchBar.tsx
│   │       ├── CategoryPills.tsx   ← Horizontal ScrollView of filter chips (All active by default)
│   │       ├── DocCard.tsx         ← Card: icon area, title, description, metadata row, optional new badge
│   │       ├── VideoGuideRow.tsx   ← Horizontal ScrollView of video thumbnail shells
│   │       └── DocReaderView.tsx   ← ScrollView: large title, body text, inline diagrams, floating action
│   └── shared/
│       ├── CelebrationModal.tsx    ← Overlay: mascot + "Great work…" message, dismiss
│       └── EmptyState.tsx          ← Mascot + heading + subtext reusable empty state shell

assets/
├── mascot-head.png                 ← image.png (brain head only)
├── mascot-business.png             ← image-1.png (business suit)
└── mascot-astronaut.png            ← image-2.png (astronaut suit)
```

---

## State Management

### AppContext (`src/context/AppContext.tsx`)
`useReducer` + `useEffect` that serialises to `AsyncStorage` on every state change. Root layout reads from AsyncStorage on mount and dispatches `HYDRATE` to populate the store.

### State Shape (`src/context/types.ts`)

```ts
interface AppState {
  onboardingComplete: boolean;
  user: {
    name: string;
    nickname: string;
    age: number | null;
    role: 'myself' | 'parent' | 'support' | null;
    useCases: string[];
  };

  // Talk
  messageWords: AACWord[];
  currentBoard: string;

  // Today — Tasks
  tasks: Task[];

  // Today — Lists (List tool)
  lists: TapTalkList[];

  // Today — First-Then (persists last selection)
  firstThen: { first: string | null; then: string | null };

  // Progress / Goals
  goals: Goal[];
  talkStats: { totalWords: number; sessionsToday: number; streakDays: number };
  activityStats: { gamesPlayed: number; minutesToday: number };
}

interface AACWord {
  id: string;
  label: string;
  wordType: 'pronoun' | 'verb' | 'preposition' | 'qualifier' | 'core' | 'folder';
  emoji?: string; // placeholder until Mulberry symbols loaded
}

interface Task {
  id: string;
  name: string;
  description: string;
  tags: TaskTag[];           // { id: string; color: string }
  dueDate: string | null;    // ISO date string
  startDate: string | null;
  reminders: Reminder[];     // { id: string; dateTime: string; notificationId?: string }
  completed: boolean;
  completedAt: string | null;
}

interface TapTalkList {
  id: string;
  name: string;
  items: ListItem[];
}

interface ListItem {
  id: string;
  text: string;
  completed: boolean;
  reminder: string | null;   // ISO date-time string
  notificationId?: string;
}

interface Goal {
  id: string;
  name: string;
  description: string;
  why: string;
  deadline: string | null;
  reminder: string | null;
  notificationId?: string;
  encouragementMessage: string;
  steps: GoalStep[];
}

interface GoalStep {
  id: string;
  name: string;
  howToAchieve: string;
  achieveBy: string | null;
  completed: boolean;
}
```

### Reducer Actions
`HYDRATE`, `SET_USER`, `COMPLETE_ONBOARDING`, `APPEND_WORD`, `CLEAR_WORDS`, `REMOVE_LAST_WORD`, `SET_BOARD`, `ADD_TASK`, `TOGGLE_TASK`, `DELETE_TASK`, `ADD_LIST`, `ADD_LIST_ITEM`, `TOGGLE_LIST_ITEM`, `SET_FIRST_THEN`, `CLEAR_FIRST_THEN`, `ADD_GOAL`, `UPDATE_GOAL`, `TOGGLE_STEP`, `ADD_STEP`, `INCREMENT_TALK_STATS`, `INCREMENT_ACTIVITY_STATS`

---

## OnboardingContext (`src/context/OnboardingContext.tsx`)
Separate lightweight context scoped to the `app/onboarding/_layout.tsx`. Accumulates answers as user moves through steps. On step-12 "Let's go": dispatches `COMPLETE_ONBOARDING` + `SET_USER` to `AppContext`, then calls `router.replace('/(tabs)/talk')`.

---

## Navigation Logic

### `app/index.tsx`
Reads `onboardingComplete` from `AppContext` (already hydrated). If false → `router.replace('/onboarding/splash')`. If true → `router.replace('/(tabs)/talk')`.

### Onboarding (`app/onboarding/_layout.tsx`)
`Stack` navigator. Each screen uses `useOnboardingContext()` to read/write accumulated answers and call `goNext()` / `goBack()`. Back arrow visible from step-1 onward (splash has none).

### Talk Mode Toggle
`app/(tabs)/talk/index.tsx` keeps `mode: 'board' | 'keyboard'` in local `useState`. Renders `<AACGrid />` tree or `<TalkBoardView />` based on mode — no route push, preserving `messageWords` state.

### Today Tools
First-Then and List are pushed routes (`router.push('/(tabs)/today/first-then')` etc.) accessible via a tool menu button on the Today index screen.

### Goal Detail
Navigates to `/(tabs)/progress/[goalId]` with goal id. New goal creation pushes `/(tabs)/progress/new-goal`.

### Library / Documentation
Accessible from `/(tabs)/me` as a prominent entry. Navigates to `/(tabs)/me/library`. Tap a doc card → `/(tabs)/me/library/[docId]`.

---

## Component Logic Details

### AAC Grid (`AACGrid.tsx`)
- ~4 columns × 5–6 rows on iPhone portrait — implemented as nested `View` rows or `FlatList` with `numColumns={4}`
- Each `AACCell` is a `Pressable` (min 80pt height)
- On press: dispatch `APPEND_WORD` + `useHaptics().light()`
- `CategoryRow`: horizontal `ScrollView` of folder shells
- `MessageBar`: horizontal `ScrollView` of word chips; single tap X → `REMOVE_LAST_WORD`; long-press X (via `onLongPress`) → `CLEAR_WORDS`

### TalkBoard Keyboard (`CustomKeyboard.tsx`)
- Numbers row + 3 QWERTY rows + action row built as `View` rows of `Pressable` keys
- Undo and Clear All are destructive-styled buttons
- Speaker button: `useSpeech().speak(builtSentence)` — expo-speech only, no microphone
- Backspace, speaker, and + buttons on right edge of `MessageCard`

### Month Calendar (`MonthCalendar.tsx`)
- Fully custom — 7-column `View` grid, no third-party calendar library
- Day cells are `Pressable`
- Dot tags under days: filter `tasks` by date match, render small `View` dots per tag color
- On day press: store selected date in local `useState`, show `TaskPanel`
- `TaskPanel`: `Animated.Value` animates height 0 → measured height (via `onLayout`) below the calendar

### Add Task Modal (`AddTaskModal.tsx`)
- `Modal` (React Native built-in, `animationType="slide"`)
- `ScrollView` form: `TextInput` for name + description, colour dot tag selector (`Pressable` circles), date inputs, reminders list with `+` to add entries
- On save: dispatch `ADD_TASK`, schedule notifications via `useNotifications().schedule()`, close modal

### First-Then Tool (`FirstThenBoard.tsx`)
- Two slot shells: First | Then — each is a `Pressable` rounded card with blank image area + label
- Dispatch `SET_FIRST_THEN` on slot fill (symbol picker implemented later in Cursor)
- Reset button dispatches `CLEAR_FIRST_THEN`

### List Tool (`ListScreen.tsx`)
- FlatList of `TapTalkList` items from context
- Each list is expandable showing its `ListItem` entries
- Each item: text + `○` Pressable to complete + optional reminder badge
- `+` FAB to add a new list or new item within a list
- Reminders scheduled via `useNotifications().schedule()`

### Goal Step Completion (`StepItem.tsx`)
- `Pressable` circle checkbox
- On press: dispatch `TOGGLE_STEP`, `useHaptics().success()`
- Step **stays in place** (does not move to bottom)
- Show `CelebrationModal` with mascot + "Great work on completing your first step. The journey begins!"
- Note: Native confetti is not available in Expo Go without ejecting — use animated celebration UI (e.g. burst of colored `View` elements with `Animated` scale/opacity, or a React Native confetti package compatible with Expo Go such as `react-native-confetti-cannon` if available without native modules, otherwise pure Animated approach)

### Notifications (`useNotifications.ts`)
- `requestPermissionsAsync()` — called on onboarding step-11 (notifications only)
- `scheduleNotificationAsync()` — trigger type `date`, stores identifier in state
- `cancelScheduledNotificationAsync(id)` — called on task/goal/list-item delete or reminder removal

### Speech (`useSpeech.ts`)
- `speak(text, options?)` → `Speech.speak()`
- `stop()` → `Speech.stop()`
- `isSpeakingAsync()` → `Speech.isSpeakingAsync()`
- TapTalk outputs speech only — no audio recording anywhere in the app

### Mascot (`TapTalkMascot.tsx`)
```ts
type MascotVariant = 'head' | 'business' | 'astronaut';
// 'head'       → require('../../assets/mascot-head.png')
// 'business'   → require('../../assets/mascot-business.png')
// 'astronaut'  → require('../../assets/mascot-astronaut.png')
```
Used on: splash (head), onboarding steps 1–4 (alternating), step-12 (business), Progress empty state, Goal celebration modal (head), Today/List/First-Then empty states.

### Me Tab (`me/index.tsx`)
- `ProfileHeader` — name, avatar, edit
- `LibraryEntry` — prominent card/button navigating to `/me/library`
- `CaregiverControls` — Caregiver Lock toggle, activity enable/disable list, export, sequence/timer setup
- Settings entries (accessibility, Dynamic Type support passthrough, etc.)

### Documentation Library (`/me/library/`)
- `index.tsx`: `DocSearchBar` + `CategoryPills` + `FlatList` of `DocCard` with section headers for Video Guides and Recently Updated
- Filter: local `useState` for activeCategory and searchQuery; filter `documents` from `src/data/documents.ts`
- `[docId].tsx`: `ScrollView` with large title, body text, floating action button (download/share/bookmark) — content from `documents.ts` by id

---

## Onboarding Screens

| Route | Content | Back? |
|---|---|---|
| `splash` | Mascot head (brain only) + "TapTalk" + tagline + Continue | No |
| `step-1` | Astronaut mascot + "Welcome to TapTalk" + warm sentence + Continue | Yes |
| `step-2` | Business mascot + "Talk your way." + AAC description + Continue | Yes |
| `step-3` | Head mascot + "Play and grow." + Activities description + Continue | Yes |
| `step-4` | Astronaut mascot + "Own your day." + Planning description + Continue | Yes |
| `step-5` | "First, a few quick questions." + subtext, no illustration + Continue | Yes |
| `step-6` | "What is your name?" + TextInput — Continue disabled until non-empty | Yes |
| `step-7` | "What should we call you?" + TextInput | Yes |
| `step-8` | "How old are you?" + numeric TextInput or scroll wheel | Yes |
| `step-9` | "Who is setting this up?" + 3 single-select Pressable cards | Yes |
| `step-10` | "What would you like to use TapTalk for?" + 4 multi-select cards | Yes |
| `step-11` | Notifications permission row only — Allow + Skip. **No microphone row.** | Yes |
| `step-12` | Celebration + mascot + "You are all set." + "Welcome to TapTalk, [nickname]." + Let's go | Yes |

---

## Implementation Order

1. Expo project init + package installs + EAS config + asset copy
2. `src/context/types.ts` — all interfaces
3. `src/context/AppContext.tsx` + `OnboardingContext.tsx` + `useAppContext.ts`
4. `src/hooks/useSpeech.ts`, `useHaptics.ts`, `useNotifications.ts`
5. `src/data/aacWords.ts`, `aacCategories.ts`, `activities.ts`, `documents.ts`
6. `app/_layout.tsx` (root), `app/index.tsx` (redirect logic)
7. `src/components/TapTalkMascot.tsx`, `shared/CelebrationModal.tsx`, `shared/EmptyState.tsx`
8. Onboarding: `app/onboarding/_layout.tsx` + all 13 screens (splash → step-12)
9. `app/(tabs)/_layout.tsx` + Tab bar
10. **Talk tab** — all talk components + AAC grid + TalkBoard mode
11. **Today tab** — calendar, tasks, First-Then, List tool
12. **Activities tab** — selection screen + GameLayout + individual activity screens
13. **Progress tab** — overview stats + Goals list + Goal form + Step logic
14. **Me tab** — profile, caregiver controls, Library/Documentation

---

## Verification Checklist
- Runs in **Expo Go** on a physical iPhone without ejecting
- Onboarding: back arrow visible from step-1 onward; nickname from step-7 appears on step-12
- Notification permission requested on step-11 (notifications only — no microphone prompt)
- After onboarding, AsyncStorage marks complete; re-opening app skips directly to Talk tab
- Tapping AAC cells appends word chips to MessageBar; long-press X clears all, single tap removes last
- Speaker button in TalkBoard calls expo-speech (text output only)
- expo-haptics fires on AAC cell tap, task complete, step complete
- Adding a task schedules a notification via expo-notifications; task persists after app restart
- Task completion toggles state, moves completed tasks below active tasks; tap again undoes
- First-Then board shows two slots; reset clears them
- List tool allows creating named lists with completable items and reminders
- Goal step completion: step stays in place, turns completed state, CelebrationModal shows
- All activity screens wrap in GameLayout with visible exit/back control
- Documentation search and category filter narrow the list correctly
- Progress stats update after Talk and Activity usage
- App handles iPhone SE screen size without layout overflow
