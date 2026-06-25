# TapTalk — Pickup Notes for the Next AI Session

> **Read this first. Then read `RULES.md`. Then run `git status` / `git log -10` to see where things actually are. Do not skip the rules file — the user has reaffirmed it every turn.**
>
> **Building a game in `app/activities/`?** Read `activity_implementation_rules.md` in this folder before writing code. Those rules are binding for every Activity game (Shape Match is the reference implementation).

---

## What TapTalk is

iOS AAC (Augmentative and Alternative Communication) app for adults with speech impairments and disabilities — autism, ADHD, post-stroke aphasia, motor differences, etc. Built with React Native + Expo SDK 54 + expo-router. The app is mid-rebuild: the symbol grid Board is being replaced by a letter keyboard, and tools are being reorganised into a dedicated Tools tab.

The primary user is an adult who relies on this app as their voice in real-world conversation. Speed, predictability, and accessibility take precedence over visual flourish.

---

## Stack

- React Native 0.81, Expo SDK 54, expo-router v6, **TypeScript strict + `noUncheckedIndexedAccess`**
- `react-native-reanimated` 4.x, `react-native-gesture-handler` 2.x (root wrapped with `GestureHandlerRootView` in `app/_layout.tsx`)
- `@react-native-async-storage/async-storage` for persistence
- `expo-speech`, `expo-haptics`, `expo-notifications`
- Design tokens at `src/theme/tokens.ts`
  - `colors` (semantic), `radii`, `spacing`, `typography`, `shadows` (zeroed — flat surfaces)
  - **Rule: no shadows, no glows, minimal decorative borders.**

---

## Architecture (current target state)

```
Bottom nav (stable): Board · Activities · Tools · Profile

Tools tab (NEW — built Step 3):
  Tools list = vertical cards
    · Calendar       → /calendar
    · Step by Step   → /first-then     (rename pending in Step 5)
    · Visual Timer   → /visual-timer   (stub today, full build in Step 4)
  Star pins a card. Pinned cards move to a "Favourites" section above "Tools".
  Swipe right-to-left on a card reveals the same star action (rubber-band).

Board (top nav reshape — Step 7):
  4 tabs: TAPTALK · QUICK · EDIT · CLEAR
    · TAPTALK opens a NEW page (keyboard view with message strip).
    · QUICK   opens Quick Talk overlay/page (saved phrases list).
    · EDIT    opens overlay/page — stub for now, no behaviour.
    · CLEAR   clears the message strip in place (action, not navigation).
  Top nav defaults to CLOSED — chevron-only until user taps.
  No tab is auto-pressed.

Calendar (Step 6 — currently the relocated Planner):
  Today header → monthly grid → Today's Plan card → day timeline.
  Plan creator: symbol picker → name → date → description → steps (start + duration, auto-numbered, drag to reorder).
  Day timeline: 96 px per hour, 30-min subdivisions, tick to complete (dims to 30%).
```

---

## Implementation order

| # | Step | Status | Notes |
|---|------|--------|-------|
| 9 | Polish pass (animations, haptics audit, Reduce Motion check) | PENDING | Final |

All structural work is in. Only the polish pass remains.

---

## Locked decisions (do not re-litigate)

These were settled across several rounds of questions. Pull from this list before asking the user anything.

### Navigation
- Bottom nav (4 slots, stable): Board · Activities · Tools · Profile.
- Top nav inside Board: 4 tabs — TAPTALK · QUICK · EDIT · CLEAR. **Default closed**, no auto-press, opens only when user taps the chevron.
- Calendar lives **inside Tools** as a tool card, **not** in the bottom nav.

### Board / TapTalk keyboard
- Layout: A–Z (alphabetical, not QWERTY), plus Space and Backspace.
- Punctuation `. , ! ?` always visible at the **bottom** of the keyboard in a muted/less-prominent style. See `board_speech_rules.md` for speech behavior.
- Symbol grid is **kept** but accessible via a small Letters ↔ Symbols toggle on the keyboard surface (not via a top-nav tab — top nav is for the 4 tabs above).
- Letter keystroke → speak that letter immediately.
- Punctuation key → silent themselves, but **modify** how the full message speaks (period = pause, comma = short pause, ! = louder, ? = rising tone).
- Space and Backspace → silent.
- Full message speak triggered by tapping the message strip.
- TAPTALK tab opens a **new page** with rectangular input strip (5 px corner radius) + keyboard below. Back button always present.
- If user has typed 3+ words and taps Back → iOS `Alert.alert("Are you sure you want to go back?", "Yes / No")` (unsaved work warning).

### Tools list
- Cards: Calendar · Step by Step · Visual Timer.
- Multiple pins allowed. Pinned cards move to a "Favourites" section at the top (most recently pinned first).
- Star icon on each card: gold filled when pinned, muted outline when not. Toggle by tap.
- Swipe right-to-left on a card reveals the same Star action (rubber-band overshoot via `Swipeable` from gesture-handler).
- Pins persist via AsyncStorage at `@taptalk/tools/favourites/v1`.

### Step by Step (formerly First & Then)
- Rename: **Step by Step**. Inside the page, labels stay **First / Then / Lastly** so caregivers recognise the concept.
- "Lastly" only appears when there are 3+ steps. Two-step sequence reads as First → Then.
- Per-step timer: full **h/m/s** wheel pickers (iOS-native).
- Drag-to-reorder via 3-line burger handle (press-hold).
- "Move on automatically when timer ends" toggle (off by default). When off, Skip button is disabled if the step has no timer (or timer is 0).
- Sequence-complete: confetti animation + "Done" card (~1.6 s burst from bottom).

### Calendar
- Monthly grid. Swipe horizontally for month change. Tap month/year header → year picker (iOS native).
- Today's Plan card below the grid; tap → day timeline.
- Day timeline: **96 px per hour** (48 px per 30 min), vertical strip, time labels left.
- Plan creator: symbol/picture → name → date → description (optional) → steps. Each step: symbol + name + **start time** + **duration**. End time computed and shown read-only ("Ends at 9:30 AM").
- No 24-hour cap logic; the time picker naturally enforces valid times.
- Auto-numbered steps (Step 1, Step 2…).
- Tick to complete: card dims to 30% brightness, auto-scroll to next step.

### Visual Timer
- Rename done (was "Visual Clock" in user's original spec; we settled on "Visual Timer").
- Two faces v1: **digital + analog**.
- No preset durations at top level; optional `Preset Duration ›` disclosure if needed.
- Default duration: 0.
- Lock is a **pre-start toggle**, not a runtime mode. Focus is **automatic** when Start is tapped.

### Quick Talk
- Saved phrases (sentences). Max **25 items**. When full, user sees "Quick Talk is full" sheet with link to the list in edit mode.
- Vertical list. Each row: burger drag handle (left) + phrase text.
- Press-hold on a row → action sheet with Edit / Delete (iOS-native).
- Persist via AsyncStorage.

### Design system rules (already enforced)
- Flat surfaces — `shadows.card` / `shadows.pop` / `shadows.cardRaise` are zeroed in `tokens.ts`. Do not re-introduce shadow opacity, glow, or `elevation > 0`.
- Outlines only where they communicate state (focus ring, secondary/ghost button affordance, status feedback). No decorative borders on cards.
- Every input has a **label above** (eyebrow style) and a **real example in the placeholder** (`e.g. Alex`, not `Display name`).
- Every main `ScrollView` has `bounces / alwaysBounceVertical / overScrollMode="always"`.
- Bottom nav: icon size 48 px, tab bar height 78 px, padding (4, 18). Cross-fade transition between selected and unselected via `BottomNavIcon`.
- Use existing tokens for new code (`colors.primary`, `colors.text`, `radii.card`, `spacing.lg`, `typography.heading`, etc.). Don't hardcode hex or magic numbers unless the geometry requires it (circle radii, etc.).

---

## iOS-native components — use these everywhere

User has explicitly asked for iOS-native patterns. Reach for these before reinventing:

| Need | Use |
|------|-----|
| Confirm / yes-no prompts | `Alert.alert` |
| Date / time selection | `@react-native-community/datetimepicker` (add dep when needed) |
| Wheel pickers (number, choices) | `@react-native-picker/picker` (add dep when needed) |
| Notifications, chimes | `expo-notifications` + `expo-av` |
| Haptics | `expo-haptics` via `src/utils/haptics.ts` helpers |
| Action sheets (long-press menus) | `ActionSheetIOS` |
| Modals / sheets | `Modal` from `react-native` with `presentationStyle="formSheet"` for sheet feel |
| Speech | `expo-speech` via `src/hooks/useSpeech.ts` |

---

## Repo conventions

- Routes live in `app/<area>/`. Co-locate `_layout.tsx` + `index.tsx` per area.
- Reusable UI in `src/components/native/` (cross-screen primitives) or `src/components/<feature>/`.
- Feature state in `src/features/<feature>/store.ts` (module-level + `useSyncExternalStore` is the established pattern; AsyncStorage for persistence).
- Tokens always imported from `src/theme/tokens.ts`. No hex literals unless geometry demands.
- File header comment explaining what the screen does and which Tools-list card it lives behind.
- Accessibility on every interactive element: `accessibilityRole`, `accessibilityLabel`, and `accessibilityState` where applicable.

---

## Pre-existing tech debt to be aware of

- `app/activities/*` files have **17 pre-existing typecheck errors** related to `noUncheckedIndexedAccess` + `borderColor` literal typing. Not introduced by recent work; flag for an `activities/` polish round if you touch them.
- `app/(tabs)/talk.tsx` references `wordBackgroundForTile` (line ~218) which isn't defined — this was introduced by an upstream edit during the rebuild. **Do not silently rip it out.** When Step 7 lands, the function either gets defined or that whole code path is replaced.
- `src/data/aacBoards.ts` is not imported anywhere. It's stale fixture data full of emoji symbols. Either delete in Step 7 or wire up properly to the Symbols mode.

---

## How to start

1. Read `RULES.md` end-to-end.
2. Read `board_speech_rules.md` if you're working on Step 7.
3. Run `git status` and `git log -n 20 --oneline` to see what's actually committed.
4. Run `npx tsc --noEmit` to see the baseline error count (should be ~18 pre-existing; **do not introduce more**).
5. Confirm with the user which step to tackle. They want planning + clarifying questions **before** implementation on big changes — small polish edits can go straight in.

---

## Branching and pushing

User pushes from their own editor. Make local edits only. Do **not** run `git push`, do **not** create commits unless explicitly asked.

---

Last updated: end of session that completed Steps 1–8 (full structural build — Tools tab, Visual Timer, Step by Step, Calendar with monthly grid + day timeline + plan creator, Board keyboard with clause-tokenised speech, Quick Talk persistence with edit mode). Only Step 9 polish remains.
