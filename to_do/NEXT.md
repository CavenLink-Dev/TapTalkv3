# TapTalk — Pending Tasks

> **Read `RULES.md` first. Then `git status` / `git log -10`. Then start here.**
> Completed architecture + locked decisions → `NEXT-ARCHIVE.md`.
> Building an activity? → `activity_implementation_rules.md` is binding (Shape Match is the reference).

---

## Pending tasks

### Step 9 — Polish pass

- [ ] **Animations audit** — walk every screen that uses `Reanimated` or `Animated`; verify spring vs. linear is used intentionally, no gratuitous motion (Rule 15).
- [ ] **Haptics audit** — verify all haptic calls go through `src/utils/haptics.ts` helpers, not raw `expo-haptics` imports. Check no over-use (Rule 19).
- [ ] **Reduce Motion sweep** — `app/onboarding/splash.tsx`, `src/components/activities/ActivityProgressBar.tsx`, and `app/activities/shape-match.tsx` already handle `useReduceMotion`. Audit every other animated screen and add `reduceMotion` fallbacks where missing (Rule 18).

### Tech debt (resolve during polish)

- [ ] **17 typecheck errors in `app/activities/*`** — `noUncheckedIndexedAccess` + `borderColor` literal typing. Pre-existing; address during the activities polish round. Do not introduce more.
- [ ] **`wordBackgroundForTile` undefined in `app/(tabs)/talk.tsx`** (~line 218) — introduced during rebuild. Do **not** silently rip it out. Define the function or replace the code path in the talk screen polish pass.
- [ ] **`src/data/aacBoards.ts` is stale + unimported** — either delete it, or wire it up to the Letters ↔ Symbols toggle on the keyboard surface. Do not leave it dangling.

### Verification

- [ ] Run `npx tsc --noEmit` — baseline should be ~18 errors. Do not introduce more.
- [ ] Confirm `@taptalk/tools/favourites/v1` AsyncStorage key is read correctly in `src/features/tools/favourites-store.ts`.

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
