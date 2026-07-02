# TapTalk — Current State

> **Read `RULES.md` first. Then `git status` / `git log -10`. Then start here.**
> Completed architecture + locked decisions → `NEXT-ARCHIVE.md`.
> Building an activity? → `activity_implementation_rules.md` is binding (Shape Match is the reference).

---

## Current status

### Step 9 — Polish pass (complete)

- [x] **Animations audit** - activity screens, onboarding, registration, Visual Timer, and Step by Step motion reviewed for purposeful motion (Rule 15).
- [x] **Haptics audit** - strict import check confirms raw `expo-haptics` is only imported by `src/utils/haptics.ts`; callers use helpers (Rule 19).
- [x] **Speech audit** - raw `expo-speech` only imported by `src/hooks/useSpeech.ts`; Quick Talk and Voice Settings use `useSpeech`.
- [x] **Reduce Motion sweep** - registration/onboarding animation points use `useReduceMotion` (Rule 18).
- [x] **Activity completion overlay** - soft-corner card with stats, Again, Cancel.

### Step 10 — Uncommitted changes (not yet committed — July 2, 2026)

45 files changed. Key additions:

| Area | What landed |
|------|-------------|
| `app/(tabs)/talk.tsx` | Contextual dock actions, board control bar (+934 lines) |
| `app/(tabs)/activities.tsx` | Progress tracking hooks (+48) |
| `app/(tabs)/me.tsx` | Profile section refinements (+170) |
| `app/activities/progress.tsx` | **New** — therapist-friendly progress screen (+383) |
| `app/board/settings.tsx` | **New** — board customisation settings (+542) |
| `app/calendar/index.tsx` | Calendar UI improvements (+247) |
| `app/legal/*` | **New** — privacy, terms, medical disclaimer, data choices (+5 files) |
| `src/components/native/Icon.tsx` | **New** — custom SVG icon system (+136) |
| `src/components/native/HelperCaption.tsx` | **New** — form helper text component (+39) |
| `src/features/activities/progress-store.ts` | **New** — session history store (+93) |
| `src/features/activities/sound-settings.ts` | **New** — activity sound config (+68) |
| `src/screens/LegalDocumentScreen.tsx` | **New** — shared legal doc scaffold (+142) |
| `src/features/calendar/store.ts` | Calendar store additions (+46) |
| `src/components/activities/ActivityCompletionOverlay.tsx` | Overlay refinements (+31) |

---

## TypeScript baseline

`npx tsc --noEmit` last run: **2026-07-02**. Baseline is **4 pre-existing errors** — none in files above.

| Error | File |
|-------|------|
| `PrimaryButtonProps` does not accept `accessibilityHint` | `app/(tabs)/me.tsx:998` |
| Object possibly undefined (×2) | `src/features/symbol-brain/__tests__/resolveSymbolForKeyword.test.ts:453,454` |
| `string \| undefined` assigned to `string` | `src/features/symbol-brain/resolveSymbolForKeyword.ts:116` |

Do **not** add new errors.

---

## Implementation plan — Step 11

> 30 candidates generated, filtered to the 10 highest-impact items. Full fix spec in `to_do/touch-font-fix-plan.md`. Sweep subagent at `.cursor/agents/touch-sweeper.md`.

### 1. Add `touchTarget` token _(unblocks everything below — do first)_
**File:** `src/theme/tokens.ts`
Add `touchTarget` export with `min: 44`, `icon` and `headerIcon` style spreads.
Prevents the same drift from recurring on new screens.

### 2. Fix edit-mode delete + reorder controls _(critical — smallest targets in the app)_
**Files:** `app/board/quick-talk/index.tsx`, `app/first-then/index.tsx`
- `deleteHandle` 28×28 → 44×44
- `arrowBtn` 32×32 → 44×44
- `editHandles` column width 36 → 44
- `burgerHit` 36×36 → 44×44

### 3. Fix contradictory play-button styles _(the code claims 44pt but overrides to 38)_
**Files:** `app/(tabs)/activities.tsx`, `app/(tabs)/tools.tsx`
- `playButton` width/height 38 → 44 (remove conflict with `iconButton: minHeight 44`)
- `doneChip` minHeight 30 → 44

### 4. Fix login back button + all activity game headers + overlay cancel
**Files:** `app/auth/login.tsx`, `app/activities/colour-pop.tsx`, `app/activities/memory-match.tsx`, `app/activities/shape-match.tsx`, `src/components/activities/ActivityCompletionOverlay.tsx`
- `backBtn` 32×32 → 44×44
- `headerIconBtn` 40×40 → 44×44 (three games)
- `cancelBtn` 32×32 → 44×44 (one fix, all games benefit)

### 5. Fix calendar & board keyboard navigation
**Files:** `app/calendar/day/[date].tsx`, `app/board/keyboard/index.tsx`, `app/calendar/index.tsx`
- `headerIconBtn` width 36 → 44 (two files)
- `clearBtn` 36×36 → 44×44
- `monthNavBtn` 36×36 → 44×44

### 6. Fix shared components _(one fix, many screens)_
**Files:** `src/components/native/Pill.tsx`, `src/components/native/DisclosureRow.tsx`
- `Pill` hit area: minHeight 34 → 44
- `DisclosureRow` iconChip: 36×36 → 44×44

### 7. Visual timer fonts _(design system compliance — needs decision first)_
**File:** `app/visual-timer/index.tsx`
- ModernFace: `fontFamily: undefined` → `fonts.displayHeavy`
- OldSchoolFace: `Courier New` → **decision required**: keep retro Courier (add design-exception comment) or switch to `fonts.displayBold` + `fontVariant: ['tabular-nums']`

### 8. Wire legal screens to Profile _(screens exist but no navigation entry point)_
**File:** `app/(tabs)/me.tsx`
Add tappable rows in the Profile section that push to `app/legal/privacy-policy`, `terms-of-use`, `medical-disclaimer`, `data-choices`. Use `DisclosureRow` or the existing `rowTouchable` pattern. All legal screens are built and ready.

### 9. Connect ActivityCompletionOverlay → progress-store _(pipeline exists but may be incomplete)_
**Files:** `src/components/activities/ActivityCompletionOverlay.tsx`, `app/activities/progress.tsx`
Verify `ActivityCompletionOverlay` calls `recordSession()` from `progress-store.ts` with the correct `ActivitySession` shape on completion. Check `progress.tsx` reads from the store and renders real data (not stubs). Wire any gaps.

### 10. Fix onboarding + dev screen remaining targets
**Files:** `app/onboarding/tour.tsx`, `src/features/guardian-settings/GuardianSymbolOverrideScreen.tsx`
- `skipBtn` / `prevBtn`: add `minHeight: 44, justifyContent: 'center'`
- GuardianSymbolOverride `button`: add `minHeight: 44`

---

## Verification for Step 11

After all 10 items:
```bash
npx tsc --noEmit   # must stay at 4 pre-existing errors
```
Then grep for remaining sub-44 interactive sizes:
```bash
rg "width:\s*(2[0-9]|3[0-9])\b" app/ src/components/ --include="*.tsx"
rg "height:\s*(2[0-9]|3[0-9])\b" app/ src/components/ --include="*.tsx"
```
Audit each hit — most will be icons or decorative views, not touch targets.

---

## Polish rules reminder

| Rule | Summary |
|------|---------|
| 15 | Every animation must serve a purpose — no decorative motion. |
| 18 | **Reduce Motion is required.** `useReduceMotion()` must gate all non-trivial animations. |
| 19 | Haptics sparingly — selection on tap, success/error on outcomes only. |
| 20 | **44×44 pt minimum touch target.** Primary actions ≥60 pt where layout allows. |

---

## iOS-native components reference

| Need | Use |
|------|-----|
| Confirm / yes-no prompts | `Alert.alert` |
| Date / time selection | `@react-native-community/datetimepicker` |
| Wheel pickers (number, choices) | `@react-native-picker/picker` |
| Notifications, chimes | `expo-notifications` + `expo-av` |
| Haptics | `expo-haptics` via `src/utils/haptics.ts` helpers |
| Action sheets (long-press menus) | `ActionSheetIOS` |
| Modals / sheets | `Modal` with `presentationStyle="formSheet"` |
| Speech | `expo-speech` via `src/hooks/useSpeech.ts` |

---

## Repo conventions

- Routes in `app/<area>/`. Co-locate `_layout.tsx` + `index.tsx` per area.
- Reusable UI in `src/components/native/` or `src/components/<feature>/`.
- Feature state in `src/features/<feature>/store.ts` (`useSyncExternalStore` + AsyncStorage).
- Tokens from `src/theme/tokens.ts`. No hex literals unless geometry demands.
- Accessibility on every interactive element: `accessibilityRole`, `accessibilityLabel`, `accessibilityState`.

---

## Branching and pushing

User pushes from their own editor. Make local edits only. Do **not** run `git push`, do **not** create commits unless explicitly asked.
