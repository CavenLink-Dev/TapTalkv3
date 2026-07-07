# TapTalk v3 — Principal Review

*I've been shipping code since before you were born, and I've been the one holding the switch when an AAC app crashed mid-sentence. This is the review you didn't want but need. I found real problems in your tree — no hypotheticals.*

---

## The Damning Ones (fix before anything else)

### 1. `app/(tabs)/talk.tsx` is 6,464 lines. In a single file.

This is your **primary communication surface** — the one screen a nonverbal user cannot afford to have regress. It imports `Animated` and `Reanimated` and `Gesture` and `Svg` and `FlatList` and `LayoutAnimation` and roughly 193 hook calls. Nobody can review this. Nobody can safely change it. Every accessibility fix is one careless memoization away from silently breaking scan focus for a kid who has no other way to speak.

**Fix:**
- Extract screens by responsibility: `BoardSurface`, `EditModeController`, `MessageStripController`, `TileInteraction`, `KeyboardOverlay`. Aim for ≤ 500 lines per file.
- Move state out of the screen. The screen renders — a hook or store decides.
- Set an ESLint rule: `max-lines` = 600 in `app/**` with a CI failure. No exceptions.

### 2. `supportsTablet: false` in `app.json`.

Every serious AAC user in North America is on an **iPad in a mount**. You have just excluded your entire real user base. This one flag makes the app unshippable to the community it claims to serve.

**Fix:**
```json
"ios": {
  "supportsTablet": true,
  "requireFullScreen": false,
  "bundleIdentifier": "com.taptalk.app",
  "deploymentTarget": "16.0"
}
```
Then audit every board layout math constant in `src/features/board/layout.ts` for hardcoded phone widths. Test on iPad Pro 12.9" landscape mounted at head height — that's the real deployment.

### 3. `orientation: "portrait"` locked.

Head-mounted eye-gaze and switch users **cannot rotate their device**. Landscape support isn't optional; it's the default posture in a classroom or wheelchair mount.

**Fix:** `"orientation": "default"`, then verify board reflow via `reflowLayoutSlots` handles the aspect flip without losing pinned tiles.

### 4. Only ONE `ErrorBoundary` — at the root.

If any downstream component throws, the **entire app dies**. For an AAC user this equals "loss of voice" until a caregiver relaunches. That is a safety event.

**Fix:**
- Wrap each tab route in its own `<ErrorBoundary fallback={<EmergencyBoard />}>`.
- Ship a minimal, static `EmergencyBoard` — 6 core phrases, no state, no dependencies — that renders when *anything* upstream fails. This is the "loss-of-voice mitigator" and it must exist.

### 5. Alerts everywhere. 22 files call `Alert.alert`/`Alert.prompt`.

Native alerts **hijack the accessibility focus tree** and are hostile to switch-scanning. A scan pattern locked to your custom `ScanningController` won't traverse system alerts predictably. This is the single most common way switch users get "trapped" in an app.

**Fix:**
- Introduce an in-app `<DialogController>` that renders inside `ScanScope` so alerts participate in the same scan cycle.
- Ban `Alert` in `app/**` via ESLint `no-restricted-imports`.
- Every dialog must have: a default focused action, an escape route, and be reachable by every configured switch mode (auto, step, dwell).

### 6. Auth on Supabase, but AAC must work offline.

`src/lib/supabase.ts` gates auth on network. `EXPO_PUBLIC_*` keys are shipped in the JS bundle — anyone can extract them and hit your quotas. Worse: what happens to a nonverbal child on a school bus with no signal whose vocabulary is behind sign-in?

**Fix:**
- Make sign-in **optional and deferred**. First launch → straight to a working board with local-only vocab.
- Local-first: SQLite (`expo-sqlite` is already installed) is source of truth. Cloud sync is a *background reconciler*, never a blocker.
- Move project-quota-sensitive calls behind Edge Functions with per-user rate limits. The publishable key alone is not a threat model.

### 7. Fonts don't scale for the people who need it most.

Only 11 files set `maxFontSizeMultiplier`. Your root `_layout.tsx` injects a fixed `fontFamily` default but no default `allowFontScaling` policy. Meanwhile 72 files hardcode `fontSize:` numbers. Dynamic Type — mandated in your own project instructions — is **not actually implemented app-wide**.

**Fix:**
- One typed `<Text>` wrapper: `src/components/native/AppText.tsx`. `allowFontScaling` on by default, `maxFontSizeMultiplier` bounded by role (`heading`, `body`, `caption`).
- Replace `import { Text } from 'react-native'` with the wrapper. Codemod, then ESLint-ban the raw import.
- Verify at 310% Dynamic Type. Boards should reflow, not clip.

### 8. State is one giant reducer.

`AppContext` holds accessibility settings, board layouts, tile tap counts, tasks, lists, habits, sentence history, the n-gram model, passport, parent lock — **and every mutation triggers a re-render of every consumer**. The debounced writes (300 ms hot / 800 ms cold) mean a crash mid-edit loses the user's custom tile. For an AAC parent who spent 20 minutes wiring a new vocabulary, that's rage-quit territory.

**Fix:**
- Split state by concern. At minimum: `useAccessibilityStore`, `useBoardStore`, `useSessionStore`. Use Zustand or Jotai — both are compatible with your stack and give per-slice subscriptions.
- Persist board edits **synchronously to SQLite on commit**, not debounced to AsyncStorage. The 300 ms window is where user work dies.
- Add an on-device backup: write `taptalk-backup-YYYYMMDD.json` to the app's document dir daily. One file, easy to email a caregiver if the device breaks.

### 9. No dwell / hold-to-activate as first-class input.

Scanning is here (`src/features/scanning`) — good. But motor-impaired users who can point but not tap cleanly need **dwell select**: hover for N ms → activate. It's a distinct input mode from tap-to-select and switch scan, and it's absent.

**Fix:** Add `dwellSelect: { enabled, dwellMs, dwellRadius }` to accessibility state. Implement as a Reanimated-driven ring that fills on `PointerEnter` and fires on completion. This is one of the three canonical AAC input modes; you have two.

### 10. Registration is 9 steps *before the user can say a single word*.

`registration/01-who` through `09-profile`. For an AAC user who is having a meltdown at the pharmacy, this app is unusable out of the box. The first tile tap must happen in **under 30 seconds** from install, or the caregiver will delete you.

**Fix:**
- Straight-to-board first launch. No registration. Seed the board with a universal core-word set (Fitzgerald key already exists — use it).
- Registration becomes a *nudge* the caregiver dismisses. Account creation is for sync — nothing else.
- Move consent/legal to a settings gate, not a prerequisite.

---

## The Ones That Will Bite Soon

### 11. LayoutAnimation and Reanimated in the same file.

`talk.tsx` imports both. LayoutAnimation ignores `useReduceMotion` on Android and interacts badly with FlatList recycling. You'll get janky, non-consistent motion — and users who set Reduce Motion will still see LayoutAnimation transitions.

**Fix:** Drop LayoutAnimation. One motion system (Reanimated) with a `useReduceMotion()` gate at the root of every animation. Your project instructions specifically call for spring settling — LayoutAnimation cannot do that.

### 12. No E2E tests. 17 unit tests total for a safety-critical app.

`src/features/board/layout.test.ts` and a handful of component tests. That is a shocking amount of untested surface for an app whose failure mode is *someone can't communicate*.

**Fix:**
- Detox or Maestro for E2E. Minimum smoke tests: first-launch → tap 3 tiles → speak sentence; enable switch scan → complete a message; enable dwell → complete a message; enable 310% Dynamic Type → board still readable.
- Snapshot the scan-order for every board layout — a scan-order regression is silent otherwise.

### 13. 25 files typed `any`.

`AppContext.tsx` line 115 is telling: `(storedState as any).favouritesByMode` for a *migration path*. That's fine as a comment, not as a type. Your state shape is your product's shape. If it's untyped it's untrustworthy.

**Fix:** Zod schemas at every persistence boundary. Parse on read, throw on invalid, fall back to `initialState` gracefully. Delete every `any`.

### 14. Bleeding-edge stack for a safety-critical app.

React 19.1, RN 0.81, Reanimated 4.1, Expo 54. Each of these is a rev or two ahead of production-grade for something a disabled child relies on. New Architecture bugs are still shaking out.

**Fix:** Pick a version pair known-good on-device for both iOS 16+ (your deployment target) and current Android 14/15. Pin exact versions. Set up EAS with a **canary track** — real disabled users on the canary, general population one release behind.

### 15. `favouritesByMode` typed as `Partial<Record<string, string[]>>` with any-cast hydration.

This will silently lose a user's favourites across a rename. Favourites are emotional — a kid's most-used tiles.

**Fix:** Schema-versioned persistence. `schemaVersion: N` at the top of the cold slice. On mismatch, run a typed migration; on migration failure, keep the raw payload in a `taptalk-recovery.json` for support to inspect. Never silently drop.

### 16. Splash screen is 455 lines of code.

`app/onboarding/splash.tsx`. A splash. Should be a static asset the native splash renders. Any JS work at splash time is JS work that can crash before your ErrorBoundary mounts.

**Fix:** Replace with `expo-splash-screen` + a single static image. All hydration work happens on the first real screen, wrapped in `<ErrorBoundary>`.

### 17. Long-press contextual previews — missing.

Your project instructions call for "contextual menu previews via a long press". I don't see `useContextMenu` wiring in the tile renderer. For a caregiver editing a board, long-press peek is the fastest edit affordance and it's not there.

**Fix:** Wire iOS `ContextMenuButton` (via `react-native-context-menu-view` or the built-in `ActionSheetIOS` for a peek). Android: haptic-triggered radial menu. Same three actions everywhere: *Edit*, *Duplicate*, *Hide*.

### 18. Only 142 references to `hitSlop`/`minHeight:44`.

For an app about touch. Half of your interactive surfaces are almost certainly under the 44pt guideline your own instructions demand. A single grep-to-count doesn't prove regression, but the ratio is suspicious given the size of the codebase.

**Fix:** Audit script: `scripts/auditTouchTargets.ts` — parses every `<Pressable>`, resolves computed style at design-time, fails CI if any is < 44×44.

### 19. `console.log` scattered in production paths.

8 hits. Not many, but every `console.log` on RN 0.81 with New Architecture has a non-trivial bridge cost, and any of them running inside the scan loop degrades scan timing perceptibly for the user.

**Fix:** Wrap in a `logger.debug()` that no-ops in `__DEV__ === false`. Remove all bare `console.*` from `src/features/scanning/**` first.

### 20. No dyslexia-friendly typography option, no symbol-only mode toggle for pre-literate users.

Two of the biggest AAC use cases (post-stroke and pre-literate) each need their own text treatment. Your accessibility slice has `textSize`, `theme`, `highContrast`, `colorScheme` — but no `dyslexicFont`, no `symbolsOnly`, no `readingLevel`.

**Fix:** Add all three to the accessibility slice. Dyslexic font = OpenDyslexic bundled locally (offline). Symbols-only hides tile labels. Reading level scales word complexity in n-gram/prediction outputs.

---

## Implementation Plan (order matters)

**Phase 0 — Stop the bleeding (this sprint):**
1. Flip `supportsTablet: true` and `orientation: "default"`. Ship.
2. Wrap every tab route in its own `ErrorBoundary` with a static `EmergencyBoard` fallback.
3. Delete `Alert.*` from any screen a scanner can reach; substitute with an in-scope dialog.

**Phase 1 — Structural (next 2 sprints):**
4. Extract `talk.tsx` into ≤ 500-line units. Add `max-lines` ESLint rule.
5. Split `AppContext` into per-concern stores. Introduce SQLite-backed board persistence with synchronous commits.
6. Ship the `AppText` wrapper and codemod all raw `<Text>` usage.

**Phase 2 — Right the input model (2 sprints):**
7. Implement dwell-select as a first-class input mode.
8. Add long-press peek/contextual menus on tiles.
9. Add offline-first: registration deferred, straight-to-board first launch.

**Phase 3 — Test the safety net (ongoing):**
10. Detox/Maestro smoke suite + scan-order snapshots. Gate CI on green.
11. Zod schemas + versioned migrations at every persistence boundary.
12. On-device daily backup file.

**Phase 4 — Broaden the audience:**
13. Dyslexic font, symbols-only, reading-level toggles.
14. iPad-native layouts (landscape default when mounted).
15. Canary release track with real disabled testers.

---

*I don't hate this app because it's bad. I hate it because it wants to be important and it's cutting corners on the exact things that make an AAC product trustworthy. The people who need it can't tell you when it fails them. Build like they can.*
