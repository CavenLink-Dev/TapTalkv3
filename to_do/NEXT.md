# TapTalk - Current State

> Read `RULES.md` first. Then `git status` / `git log -10`.
> Completed architecture + locked decisions live in `NEXT-ARCHIVE.md`.
> Building or editing an activity? `activity_implementation_rules.md` is binding.

---

## Current Snapshot

Date: 2026-07-02

Latest committed baseline:
- `36fa545 v1.0.0 PR - feat(activities): enhance activity tracking and user interface`
- Working tree has local cleanup edits only. Do not commit or push unless the user asks.

Live app shape:
- Bottom nav: Talk, Activities, Tools, Me.
- Calendar remains inside Tools, not a bottom tab.
- Talk Board has the contextual bottom dock and board control bar.
- Activities currently expose Shape Match, Colour Pop, Memory Match, and the progress screen.
- Profile already links legal/privacy/data documents.
- Symbol search and Talk Board use Mulberry symbols through the generated asset map and bundled symbol database.
- `npx tsc --noEmit` passes cleanly after the cleanup.

---

## Cleanup Pass - Local

Purpose: trim files that are not touched by a full app run, without weakening AAC, disability access, or future symbol safety.

Already removed in this local cleanup:
- Backup/temp/system files: `.DS_Store`, `.tmp`, `app/(tabs)/tools.tsx.bak`.
- Old standalone planning/design files now folded into this file or no longer used by runtime.
- Unused bottom-tab Calendar SVGs after removing the unused Calendar icon entry from `BottomNavIcon`.
- Unused Figma/export artwork folders that are not imported by app code.
- Unused old activity/card/icon/loading images that no route imports.
- Unloaded SF Compact font files. Keep only the five files registered in `src/theme/fonts.ts`.
- Orphan source modules that are not reached from any Expo route import graph.
- Keep `src/assets/icons/setting-board.png`; it is still used by the board settings icon.

Protected - do not delete:
- `src/assets/symbols/mulberry/svg/`
- `src/assets/symbols/mulberry/svg-normalised/`
- `src/data/imports/mulberry/`
- `src/data/mulberryAssetMap.generated.ts`
- `assets/databases/taptalk_symbol_brain.db`

Mulberry note:
- Mulberry is core AAC content. Keep both original and normalised SVG sets unless the user explicitly approves a storage change.
- Runtime currently uses `svg-normalised` via `src/data/mulberryAssetMap.generated.ts`.
- The original `svg` set is still kept as source/attachment material for rebuilds and review.
- Duplicate check found no second downloaded Mulberry library elsewhere in the workspace.
- Counts to preserve: 3,436 files in `svg/` and 3,436 files in `svg-normalised/`.
- Folder convention after cleanup: `assets/` holds normal runtime app assets; `src/assets/` is Mulberry-only.

Cleanup verification:
```bash
npx tsc --noEmit   # passes
```

---

## TypeScript Baseline

Current baseline after cleanup: 0 errors from `npx tsc --noEmit`.

---

## Next Small Fixes

These are still worth doing before a wider redesign:

1. Add a shared `touchTarget` token in `src/theme/tokens.ts` for 44 x 44 icon/header controls.
2. Sweep remaining sub-44 interactive controls in Quick Talk, Step by Step, Calendar, activity headers, onboarding, and shared native rows.
3. Replace remaining non-SF timer fonts in Visual Timer with `fonts.displayBold` or `fonts.displayHeavy`.
4. Check that activity completion recording and `app/activities/progress.tsx` read/write the same real progress data.
5. Keep `ActivityProgressBar` and `activity_implementation_rules.md` aligned. Code now draws the progress bar inline while the rules still mention SVG assets.

Verification after these:
```bash
npx tsc --noEmit
rg "width:\s*(2[0-9]|3[0-9])\b" app/ src/components/ --glob "*.tsx"
rg "height:\s*(2[0-9]|3[0-9])\b" app/ src/components/ --glob "*.tsx"
rg "Courier New|monospace|sans-serif|fontFamily:\s*undefined" app/ src/ --glob "*.tsx"
```

---

## Implementation Ideas For User Approval

Ask the user yes/no before implementing any of these.

1. **Board Focus Mode**
   - Hide the bottom tab bar only while the user is actively communicating, with an obvious exit control.
   - Keeps stable navigation normally while giving AAC more screen space.
   - Supports Rule 4, Rule 5, Rule 20, Rule 30.

2. **Remove Board Top Nav From The First View**
   - Move Talk, Quick, Edit, and Clear into the contextual dock or a More menu.
   - The first Talk screen becomes just message strip, symbol grid, and essential controls.
   - Supports Rule 1, Rule 2, Rule 10, Rule 29.

3. **Emergency And Help Phrases**
   - Add a protected quick folder for phrases such as "I use AAC", "Please wait", "I need help", "I am in pain", and "Call my support person".
   - For South Australia, verify exact emergency/support wording before shipping.
   - Supports Rule 7, Rule 12, Rule 13, Rule 21.

4. **Adelaide Daily Places Board**
   - Add a starter folder for GP, pharmacy, hospital, bus, train, tram, home, support worker, NDIS appointment, and family contact.
   - Keep it editable so users can localise their own real places.
   - Supports Rule 2, Rule 5, Rule 27.

5. **My Communication Passport**
   - Profile page that explains how the user communicates, what helps, what overwhelms them, trusted contacts, access needs, and emergency notes.
   - Useful for support workers, therapists, hospital visits, and disability services.
   - Supports Rule 21, Rule 22, Rule 23, Rule 30.

6. **Motor Access Mode**
   - Larger controls, fewer columns, no required drag-only actions, and tap alternatives for reorder/resize.
   - Good for tremor, one-handed use, switch access planning, and fatigue.
   - Supports Rule 20, Rule 21, Rule 25, Rule 30.

7. **Mulberry Add Symbol Flow**
   - Finish the Add Symbol and Add Folder flow using Mulberry search, category suggestions, and simple folder placement.
   - This is the highest-value AAC growth feature.
   - Supports Rule 5, Rule 7, Rule 28, Rule 29.

8. **Therapist Progress Export**
   - Export activity sessions and communication practice as a plain, readable summary.
   - Keep language non-judgmental: progress, support, and observations, not scores that shame the user.
   - Supports Rule 13, Rule 21, Rule 30.

9. **Reduce Sensory Load Setting**
   - One switch that quiets shimmer, particles, sound effects, haptics, and non-essential animation.
   - This should layer on top of system Reduce Motion, not replace it.
   - Supports Rule 14, Rule 15, Rule 18, Rule 19.

10. **AAC-First Onboarding**
    - Let the user try a tiny Talk Board immediately before account/profile setup.
    - Registration still exists, but the app proves its value as a voice first.
    - Supports Rule 1, Rule 5, Rule 13, Rule 30.

---

## Repo Conventions

- Routes in `app/<area>/`. Co-locate `_layout.tsx` + `index.tsx` per area.
- Reusable UI in `src/components/native/` or `src/components/<feature>/`.
- Feature state in `src/features/<feature>/store.ts` using `useSyncExternalStore` + AsyncStorage.
- Tokens from `src/theme/tokens.ts`. Do not hardcode hex unless geometry, game art, or symbol/category colour requires it.
- Every interactive element needs `accessibilityRole`, `accessibilityLabel`, and `accessibilityState` where relevant.

---

## Branching And Pushing

User pushes from their own editor. Make local edits only. Do not run `git push`; do not create commits unless explicitly asked.
