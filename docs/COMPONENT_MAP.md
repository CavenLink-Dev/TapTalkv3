# TapTalk V3 — Component Map

Source of truth for project structure. Use this to find the correct file for any task before writing code. Each entry lists the file path, what it does, what belongs there, what doesn't, and `**AI guidance:**` constraints.

---

## App Router (`app/`)

Expo Router file-based routing. Each file is a route, each `_layout.tsx` wraps its children.

### Root Shell
`app/_layout.tsx`

Wraps every screen. Provider order (outermost → in): `GestureHandlerRootView` → `ErrorBoundary` → `SafeAreaProvider` → `AppProvider` → `ScanningProvider`/`SwitchInputCapture` → `ThemeShell` (`expo-router` `Stack` + `StatusBar`). Blocks first paint until SF Compact fonts load; sets default font on `Text`/`TextInput`.

- **What goes here:** Global providers, font loading, status bar config.
- **What doesn't:** Screen-level logic, feature imports.
- **AI guidance:** Never remove the gesture root (breaks board drag/drop) or reorder providers. `AppProvider` must sit inside safe-area but outside the Stack. Add global providers here, not per-screen.

### Entry Redirect
`app/index.tsx`

Unconditionally redirects to `/onboarding/splash`. Splash plays on every cold start, then routes to Talk, Login, or Get Started based on app state.

- **What goes here:** Redirect logic only.
- **What doesn't:** Any UI.

### Tab Layout
`app/(tabs)/_layout.tsx`

Bottom tab bar with 4 tabs: Talk, Activities, Tools, Me. 78 pt tall, 48 pt icons. Hides/shows via `useTabBarHidden()`.

- **What goes here:** Tab configuration, tab bar styling, hide/show logic.
- **What doesn't:** Screen content.
- **AI guidance:** Keep 78 pt height / 48 pt icons (locked). Bar collapse driven by `useTabBarHidden()` from `src/features/board/chromeVisibility.ts` — do not add a second hide mechanism. Do not reorder or rename tabs (principle 4).

### Talk Screen (Tab 1)
`app/(tabs)/talk.tsx` — ~2,500 lines, orchestrator only

The main AAC board. Full screen between status bar and bottom nav. Manages board state, edit mode, drag-and-drop, dock, speech.

- **What goes here:** State orchestration, JSX composition, gesture wiring.
- **What doesn't:** Presentational components (use `src/features/board/components/`), stateful hooks (use `src/features/board/talk/`), layout math (use `src/features/board/layout.ts`).
- **AI guidance:** Import presentational leaves and hooks — do NOT re-inline them. Keep `TalkScreen()` as the state orchestrator composed of the 7 extracted hooks. Speak via `useSpeech` + `buildMessageUtterances`. Gate all animation on `useReduceMotion()`. Do NOT duplicate layout math from `layout.ts`. New board-talk code should import from the `talk/` versions of types/constants.

### Activities Screen (Tab 2)
`app/(tabs)/activities.tsx`

Activity hub showing available games and progress. Routes to individual activity screens.

- **What goes here:** Activity grid, navigation to activities, progress summary.
- **What doesn't:** Game logic (lives in `app/activities/` screens).

### Tools Screen (Tab 3)
`app/(tabs)/tools.tsx`

Tools hub listing available tools (calendar, first-then, visual timer, etc.).

- **What goes here:** Tool grid, navigation to tool screens.
- **What doesn't:** Tool logic (lives in respective feature folders).

### Me Screen (Tab 4)
`app/(tabs)/me.tsx`

Profile and settings hub. Links to profile, settings, legal, passport.

- **What goes here:** Profile display, settings navigation, account actions.
- **What doesn't:** Settings logic (lives in `app/settings/`).

### Onboarding
`app/onboarding/` — `splash.tsx` · `get-started.tsx` · `tour.tsx`

Splash animation plays on every cold start (~5.8s), then routes based on app state. Get-started and tour are first-run flows.

- **What goes here:** Splash animation, first-run welcome, feature tour.
- **What doesn't:** Registration logic (lives in `app/registration/`).

### Registration
`app/registration/` — 9-step flow (`01-who` through `09-profile`)

Multi-step registration wizard. Each file is one step. Uses `RegistrationContext` for shared state.

- **What goes here:** Registration step UI and form validation.
- **What doesn't:** Shared registration state (lives in `src/context/RegistrationContext.tsx`).

### Auth
`app/auth/` — `login.tsx` · `forgot-password.tsx`

Login and password reset screens.

- **What goes here:** Auth forms, Supabase auth calls.
- **What doesn't:** Session management (lives in `src/hooks/useSession.ts`).

### Board Sub-Routes
`app/board/` — `settings.tsx` · `health.tsx` · `hidden-tiles.tsx` · `keyboard/index.tsx` · `quick-talk/index.tsx`

Board settings, board health diagnostics, hidden tiles manager, keyboard entry, and Quick Talk saved phrases.

- **What goes here:** Board configuration screens, keyboard entry UI, Quick Talk UI.
- **What doesn't:** Board state (lives in `AppContext`), Quick Talk store (lives in `src/features/quick-talk/store.ts`).

### Calendar
`app/calendar/` — `index.tsx` · `new-plan.tsx` · `day/[date].tsx`

Calendar view, new plan creation, and day detail view.

- **What goes here:** Calendar UI, plan creation form, day detail.
- **What doesn't:** Calendar state (lives in `src/features/calendar/store.ts`).

### First-Then
`app/first-then/` — `index.tsx` · `add-step.tsx`

First-Then board for sequential task guidance.

- **What goes here:** First-Then board UI, step addition.
- **What doesn't:** First-Then state (lives in `src/features/first-then/store.ts`).

### Visual Timer
`app/visual-timer/index.tsx`

Visual countdown timer tool.

- **What goes here:** Timer UI, timer controls, visual progress.
- **What doesn't:** Timer state (managed locally or via feature store).

### Settings
`app/settings/` — `account.tsx` · `display.tsx` · `pronunciation.tsx` · `scanning.tsx` · `voice.tsx`

Settings sub-pages: account, display/appearance, pronunciation overrides, scanning access, voice selection.

- **What goes here:** Settings UI forms, reading/writing AppContext settings.
- **What doesn't:** Settings state (lives in `AppContext`).

### Legal
`app/legal/` — `privacy-policy.tsx` · `terms-of-use.tsx` · `medical-disclaimer.tsx` · `beliefs.tsx` · `data-choices.tsx`

Legal and policy pages. Content rendered via `src/screens/LegalDocumentScreen.tsx`.

- **What goes here:** Route files that delegate to `LegalDocumentScreen`.
- **What doesn't:** Legal content rendering logic (lives in `src/screens/`).

### Standalone Routes
- `app/passport.tsx` — Communication Passport profile page. Saves to `AppContext`. Shareable as plain text.
- `app/guardian-symbol-override.tsx` — Guardian symbol override editor. Delegates to `src/features/guardian-settings/GuardianSymbolOverrideScreen.tsx`.
- `app/symbol-attribution.tsx` — Mulberry CC BY-SA attribution page. Delegates to `src/screens/SymbolAttributionScreen.tsx`.
- `app/symbol-search.tsx` — Symbol search. Delegates to `src/screens/SymbolSearchScreen.tsx`.

---

## Feature Modules (`src/features/`)

Each feature folder owns its state, hooks, components, and utilities. Do not cross-import between features unless through a clear public API.

### Board (`src/features/board/`)
The AAC board engine — tiles, layout, edit mode, dock, drag-and-drop.

**Core files:**
- `boardData.ts` — board tile definitions, default boards, tile CRUD helpers.
- `layout.ts` — layout math (columns, tile sizing, slot positions). Has `layout.test.ts`.
- `chromeVisibility.ts` — `setTabBarHidden()` / `useTabBarHidden()`. The only tab-bar hide mechanism.
- `tileA11y.ts` — accessibility label/role helpers for board tiles.
- `exportPdf.ts` — board PDF export.
- `persistMessageBuffer.ts` — message strip persistence.
- `symbolPacks.ts` — symbol pack definitions.
- `useChromeGesture.ts` — gesture handler for chrome hide/show.
- `useMessageBufferSync.ts` — syncs message buffer to persistence.
- `useTileTap.ts` — tile tap handling (speak + append).
- `types.ts` / `constants.ts` — older board types/constants (prefer `talk/` versions for new code).

**Components** (`src/features/board/components/`):
- `BoardGrid.tsx` — scrollable grid container.
- `BoardTileButton.tsx` — exports `BoardTileCell`; internal wrapper handling tap, press, drag, resize, a11y.
- `TileRenderer.tsx` — `BoardWordTile` + `BoardFolderTile` pure leaf components.
- `TopNav.tsx` — collapsible Edit/Layout/Saved/Settings tab bar.
- `EditModeOverlay.tsx` — grid overlay, drag placeholder, source ghost.
- `ResizeHandles.tsx` — edit-mode resize handles.
- `BoardNavTile.tsx` — back/home navigation tile.
- `BoardDockAction.tsx` — dock action button with popover anchor.
- `DockPopover.tsx` — floating popover menu.
- `DockSubControls.tsx` — row of sub-buttons above dock.
- `DockPeekPill.tsx` — dock peek indicator.

**Talk hooks** (`src/features/board/talk/`):
- `useBoardLayoutState.ts` — layouts, layoutDirty, boardAreaHeight.
- `useEditMode.ts` — edit mode, selection, undo stack.
- `useQuickManage.ts` — quick-tag, quick view, manage panel.
- `useSpeechQueue.ts` — speech queue, drain/enqueue/flush.
- `useDockVisibility.ts` — dock hide/show, slide/fade animation.
- `useBoardAddFlows.ts` — add symbol/folder/custom symbol flows.
- `useBoardEditActions.ts` — delete, duplicate, move, favourite, select-all.
- `boardTiles.ts` — board tile data for talk screen.
- `styles.ts` — talk screen style definitions.
- `types.ts` / `constants.ts` — newer board-talk types/constants (prefer these).

- **AI guidance:** Import presentational leaves and hooks — do NOT re-inline them. Keep `TalkScreen()` as orchestrator. Push new pure components into `components/`, new state into `talk/` hooks. Do NOT duplicate `layout.ts` math. Two parallel type/constant sets exist — new code uses `talk/` versions.

### Activities (`src/features/activities/`)
Activity progress tracking, favourites, ordering, sound settings.

- `activity-meta.ts` — activity metadata (name, icon, description).
- `favourites-store.ts` — activity favourites persistence.
- `order-store.ts` — activity display order persistence.
- `progress-store.ts` — activity progress persistence.
- `progress-selectors.ts` — progress data selectors/aggregations.
- `sound-settings.ts` — per-activity sound settings.

### Calendar (`src/features/calendar/`)
- `store.ts` — calendar plan state, CRUD, persistence.

### First-Then (`src/features/first-then/`)
- `store.ts` — first-then board state, step CRUD, persistence.

### Profile (`src/features/profile/`)
- `AvatarView.tsx` — avatar display component.
- `avatar.ts` — avatar generation/resolution helpers.
- `pickImage.ts` — image picker wrapper.
- `sanitizeImage.ts` — image sanitization before storage.

### Scanning (`src/features/scanning/`)
Switch-access scanning for users who can't tap individual tiles.

- `ScanningController.tsx` — scanning orchestration component.
- `ScanHighlight.tsx` — visual highlight overlay for scanned items.
- `ScanScope.tsx` — scanning scope boundary component.
- `SwitchInputCapture.tsx` — captures switch input events.
- `useSwitchInput.ts` — hook for switch input handling.
- `switchInputBridge.ts` — bridges switch events to scanning.
- `types.ts` — scanning types and configuration.
- `index.ts` — public exports (`ScanningProvider`, `useScanning`, `useSwitchInput`, `SwitchInputCapture`).

- **AI guidance:** Scanning is provided at the root shell. Do not create a second scanning context. Use the public exports from `index.ts`.

### Speech (`src/features/speech/`)
Low-level speech service layer (below `useSpeech` hook).

- `SpeechService.ts` — speech service class wrapping `expo-speech`.
- `audioSession.ts` — iOS audio session configuration.
- `checkVoices.ts` — voice availability checks.
- `useSpeaking.ts` — hook for speaking state.

- **AI guidance:** App code should use `src/hooks/useSpeech.ts`, not this layer directly. This is the service implementation; `useSpeech` is the public API.

### Symbol Brain (`src/features/symbol-brain/`)
Keyword-to-symbol resolution engine.

- `resolveSymbolForKeyword.ts` — main resolver (LRU-cached, context-aware).
- `symbolSearchService.ts` — symbol search service.
- `calculateSymbolScore.ts` — scoring algorithm for symbol matches.
- `fuzzySearchService.ts` — fuzzy matching.
- `semanticSearchService.ts` — semantic matching.
- `lemmatize.ts` — word lemmatization.
- `normalizeText.ts` — text normalization.
- `australianAliases.ts` — Australian English aliases.
- `attributionService.ts` — symbol attribution tracking.
- `userPreferenceService.ts` — user symbol preference tracking.
- `types.ts` — symbol brain types.

- **AI guidance:** Use `resolveSymbolForKeyword` (not raw asset-map lookups) whenever a word needs a symbol. Call `clearResolveCache()` after vocabulary/guardian-override changes.

### Prediction (`src/features/prediction/`)
Word prediction chips for the message strip.

- `corePredictor.ts` — prediction engine (n-gram based).
- `PredictionChips.tsx` — prediction chip UI component.

### Tools (`src/features/tools/`)
- `favourites-store.ts` — tool favourites persistence.
- `order-store.ts` — tool display order persistence.

### Quick Talk (`src/features/quick-talk/`)
- `store.ts` — saved phrases state, CRUD, persistence.

### Cloud (`src/features/cloud/`)
- `sync.ts` — cloud sync logic (Supabase).
- `mergeTiles.ts` — tile merge conflict resolution.

### Guardian Settings (`src/features/guardian-settings/`)
- `GuardianSymbolOverrideScreen.tsx` — guardian symbol override editor component.

### Accessibility (`src/features/accessibility/`)
- `appMode.ts` — app mode helpers (simplified/standard).
- `motor.ts` — motor accessibility helpers.
- `sensory.ts` — sensory accessibility helpers.

### Telemetry (`src/features/telemetry/`)
- `utteranceLog.ts` — speech utterance logging for analytics.

### Experimental (`src/features/experimental/`)
- `flag.ts` — experimental feature flag toggles.

---

## Shared Components (`src/components/`)

Reusable UI components shared across features. Feature-specific components live in their feature folder.

### Native UI Kit (`src/components/native/`)
iOS-styled reusable components built on design tokens.

- `Screen.tsx` — screen wrapper with safe area + scroll.
- `Card.tsx` — flat card container.
- `PrimaryButton.tsx` — primary action button.
- `TextField.tsx` — text input with eyebrow label.
- `CheckRow.tsx` — toggle/checkbox row.
- `DisclosureRow.tsx` — expandable settings row.
- `SettingsRow.tsx` — settings list row.
- `WheelPicker.tsx` — wheel picker wrapper.
- `ColorPickerSheet.tsx` — color picker bottom sheet.
- `ColorWheel.tsx` — color wheel component.
- `PicturePicker.tsx` — image picker UI.
- `Pill.tsx` — pill/badge component.
- `Icon.tsx` — icon component (multiple icon sets).
- `ThemedText.tsx` — theme-aware text.
- `HelperCaption.tsx` — muted helper text.
- `SegmentedProgressBar.tsx` — segmented progress bar.
- `PressableTabButton.tsx` — tab button component.
- `SignInWithAppleButton.tsx` — Sign in with Apple button.

- **AI guidance:** Use these instead of building custom UI. All use design tokens from `src/theme/tokens.ts`. Keep them pure/prop-only.

### Talk Components (`src/components/talk/`)
- `TalkMessageStrip.tsx` — message strip (word chips, speak, backspace, top-nav toggle).
- `AddSymbolModal.tsx` — add symbol modal (search + symbol brain).
- `AddFolderModal.tsx` — add folder modal.
- `CustomSymbolEditor.tsx` — custom symbol editor.
- `SymbolPackBrowser.tsx` — symbol pack browser.

### Activity Components (`src/components/activities/`)
- `ActivityCompletionOverlay.tsx` — completion celebration overlay.
- `ActivityProgressBar.tsx` — progress bar for activities.

### Symbol Components (`src/components/symbols/`)
- `MulberrySymbol.tsx` — the only Mulberry pictogram renderer.

### AAC Symbol Components (`src/components/aac/symbols/`)
- `MulberrySymbol.tsx` — re-export/legacy wrapper.
- `SymbolResultCard.tsx` — symbol search result card.
- `SymbolSuggestionRow.tsx` — symbol suggestion row.

### Registration Components (`src/components/registration/`)
- `RegistrationScaffold.tsx` — registration step wrapper.
- `SelectableCard.tsx` — selectable card for registration choices.

### Settings Components (`src/components/settings/`)
- `VocabularyBackupSection.tsx` — vocabulary backup/restore UI.

### Icon Components (`src/components/icons/`)
- `BottomNavIcon.tsx` — bottom nav SVG icons (selected/unselected).
- `FigmaIcons.tsx` — Figma-exported icons.

### Other Shared Components
- `ErrorBoundary.tsx` — app-wide error boundary.
- `LoadingDots.tsx` — loading indicator.
- `DevSkip.tsx` — dev-only skip button (not in production).

---

## Screens (`src/screens/`)

Reusable screen-level components imported by route files.

- `LegalDocumentScreen.tsx` — renders legal/policy documents.
- `SymbolAttributionScreen.tsx` — Mulberry attribution screen.
- `SymbolSearchScreen.tsx` — symbol search screen.

---

## Theme (`src/theme/`)

- `tokens.ts` — all design tokens (colors, spacing, radii, typography, shadows). The source of truth for visual values.
- `useTheme.ts` — `useTheme()` hook for current theme colors, dark mode, theme switching.
- `motion.ts` — spring and timing animation presets.
- `fonts.ts` — SF Compact Rounded font family setup and `useTapTalkFonts()` hook.

- **AI guidance:** Use `colors.*`, `radii.*`, `spacing.*`, `typography.*` from tokens. Don't hardcode hex or magic numbers. `shadows.*` are intentionally zeroed (flat design). Use `motion.*` presets instead of hand-rolled animation configs.

---

## Hooks (`src/hooks/`)

Shared hooks used across features.

- `useAppContext.ts` — `useAppContext()` / `useAppSelector()` for global state.
- `useSpeech.ts` — the only TTS hook. `speak/stop` + `buildMessageUtterances()`.
- `useReduceMotion.ts` — `useReduceMotion()` / `useSystemReduceMotion()`.
- `useSession.ts` — auth session management (Supabase).
- `usePullRefresh.ts` — pull-to-refresh hook.
- `useReduceSensoryLoad.ts` — sensory load reduction flag.

---

## Utilities (`src/utils/`)

Pure helper functions shared across the app.

- `haptics.ts` — haptic feedback helpers (`hapticSelection`/`hapticLight`/etc.).
- `speechRules.ts` — pronunciation rules, `buildMessageUtterances()`.
- `sounds.ts` — sound feedback helpers.
- `color.ts` — color utilities (contrast, conversion).
- `ngram.ts` — n-gram extraction for prediction.
- `boardHealth.ts` — board health diagnostics.
- `vocabularyExport.ts` — vocabulary export/import helpers.
- `pin.ts` — PIN helpers.
- `sessionFlags.ts` — session-level flag helpers.
- `validation.ts` — validation helpers.

---

## Context & State (`src/context/`)

- `AppContext.tsx` — global reducer store. Board tiles, custom tiles, favourites, profile, accessibility settings. Provided at root shell.
- `types.ts` — all action types and state shapes for `AppContext`.
- `persistence.ts` — persistence layer (hot/cold split, debounced).
- `persistence.file.ts` — file-based persistence implementation.
- `RegistrationContext.tsx` — registration wizard shared state.

- **AI guidance:** Read via `useAppContext()`/`useAppSelector`. Mutate only by dispatching typed actions. Never mutate state directly. Accessibility changes fan out to haptics, speech, and Reduce Motion — keep those sync points intact.

---

## Data (`src/data/`)

- `mulberryAssetMap.generated.ts` — Mulberry symbol ID → asset path map. **Generated, do not edit.**
- `mulberrySymbols.generated.ts` — Mulberry symbol metadata. **Generated, do not edit.**
- `categoryExemplars.generated.ts` — category exemplar symbols. **Generated, do not edit.**
- `symbolPacks.ts` — symbol pack definitions (large file, ~95KB).
- `imports/mulberry/` — raw Mulberry symbol import sources.
- `sqlite/` — SQLite database layer:
  - `database.ts` — database connection/setup.
  - `migrations.ts` — database migrations.
  - `seedSymbolBrain.ts` — seeds symbol brain SQLite tables.
  - `repositories/` — data repositories (`concept`, `keyword`, `symbol`, `symbolTag`, `attribution`, `preference`).

- **AI guidance:** Never edit `.generated.ts` files manually. Update the source script in `scripts/` and regenerate. SQLite repositories are the data access layer for symbol brain.

---

## Other Directories

- `src/lib/supabase.ts` — Supabase client setup.
- `src/styles/authFormStyles.ts` — shared auth form styles.
- `scripts/` — build scripts for generating data files (`buildSymbolBrainDb.ts`, `buildCategoryExemplars.ts`, `auditSymbolCoverage.ts`, `auditSymbolUniformity.ts`).
- `supabase/` — Supabase migrations and edge functions.
- `assets/` — static assets (SVGs, PNGs, board tiles, activity logos, nav icons).
- `apple_sf_compact_fonts/` — SF Compact Rounded OTF font files.

---

## Implementation Updates

07/07/26 — Complete rewrite of COMPONENT_MAP.md covering all feature areas, screens, components, hooks, utilities, and data.
