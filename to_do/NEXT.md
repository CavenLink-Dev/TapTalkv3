# TapTalk — Current State

> **Read `RULES.md` first. Then `git status` / `git log -10`. Then start here.**
> Completed architecture + locked decisions → `NEXT-ARCHIVE.md`.
> Building an activity? → `activity_implementation_rules.md` is binding (Shape Match is the reference).

---

## Current status

### Step 9 — Polish pass

- [x] **Animations audit** - activity screens, onboarding, registration, Visual Timer, and Step by Step motion have been reviewed for purposeful motion (Rule 15).
- [x] **Haptics audit** - strict import check confirms raw `expo-haptics` is only imported by `src/utils/haptics.ts`; callers use helpers including `hapticWarning` (Rule 19).
- [x] **Speech audit** - strict import check confirms raw `expo-speech` is only imported by `src/hooks/useSpeech.ts`; Quick Talk and Voice Settings now use `useSpeech`.
- [x] **Reduce Motion sweep** - registration/onboarding animation points now use `useReduceMotion`; previously completed screens keep their existing reduced-motion fallbacks (Rule 18).
- [x] **Activity completion overlay** - final game overlay uses the soft-corner square card pattern with stats, easy Again access, and Cancel.

### Completed cleanup

- [x] `wordBackgroundForTile` exists in `app/(tabs)/talk.tsx`.
- [x] `src/data/aacBoards.ts` has been removed.
- [x] `@taptalk/tools/favourites/v1` is the AsyncStorage key in `src/features/tools/favourites-store.ts`.

### Verification

- [x] `npx tsc --noEmit` run on 2026-07-02. Current baseline is **4 pre-existing errors**, none in files touched by the polish pass:
  - `app/(tabs)/me.tsx(998,11)` - `PrimaryButtonProps` does not accept `accessibilityHint`.
  - `src/features/symbol-brain/__tests__/resolveSymbolForKeyword.test.ts(453,12)` - object possibly undefined.
  - `src/features/symbol-brain/__tests__/resolveSymbolForKeyword.test.ts(454,47)` - object possibly undefined.
  - `src/features/symbol-brain/resolveSymbolForKeyword.ts(116,12)` - `string | undefined` assigned to `string`.
- [x] Strict raw import checks pass:
  - `expo-speech` import: `src/hooks/useSpeech.ts` only.
  - `expo-haptics` import: `src/utils/haptics.ts` only.

---

## Polish rules reminder

| Rule | Summary |
|------|---------|
| 15 | Every animation must serve a purpose — no decorative motion. |
| 18 | **Reduce Motion is required.** `useReduceMotion()` must gate all non-trivial animations. |
| 19 | Haptics sparingly — selection on tap, success/error on outcomes only. |

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
