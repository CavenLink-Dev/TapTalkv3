# TapTalk — Completed Context Archive

> This file preserves structural decisions and architecture notes from the original `NEXT.md`. All items here are **implemented and done**. Locked decisions are **non-negotiable** — do not re-litigate them.

---

## What TapTalk is

iOS AAC (Augmentative and Alternative Communication) app for adults with speech impairments and disabilities — autism, ADHD, post-stroke aphasia, motor differences, etc. Built with React Native + Expo SDK 54 + expo-router.

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

## Architecture (implemented)

```
Bottom nav (stable): Board · Activities · Tools · Profile

Tools tab (built Step 3):
  Tools list = vertical cards
    · Calendar       → /calendar
    · Step by Step   → /first-then
    · Visual Timer   → /visual-timer
  Star pins a card. Pinned cards move to a "Favourites" section above "Tools".
  Swipe right-to-left on a card reveals the same star action (rubber-band).

Board (top nav — built Step 7):
  4 tabs: TAPTALK · QUICK · EDIT · CLEAR
    · TAPTALK opens /board/keyboard (keyboard view with message strip).
    · QUICK   opens /board/quick-talk (saved phrases list).
    · EDIT    stub — no behaviour yet.
    · CLEAR   clears the message strip in place (action, not navigation).
  Top nav defaults to CLOSED — chevron-only until user taps.
  No tab is auto-pressed.

Calendar (built Step 6):
  Today header → monthly grid → Today's Plan card → day timeline.
  Plan creator: symbol picker → name → date → description → steps (start + duration, auto-numbered).
  Day timeline: 96 px per hour, 30-min subdivisions, tick to complete (dims to 30%).
```

---

## Implementation order — all steps complete

| # | Step | Status |
|---|------|--------|
| 1 | Tools tab scaffold + favourites | DONE |
| 2 | Visual Timer stub | DONE |
| 3 | Step by Step (First & Then rename) | DONE |
| 4 | Visual Timer full build | DONE |
| 5 | Step by Step rename + labels | DONE |
| 6 | Calendar (monthly grid + day timeline + plan creator) | DONE |
| 7 | Board keyboard + Quick Talk + speech rules | DONE |
| 8 | Activities (Memory Match, Picture Match, Count Along, Shape Match) | DONE |
| 9 | Polish pass (animations, haptics, Reduce Motion) | **PENDING** — see `NEXT.md` |

---

## Locked decisions (do not re-litigate)

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
