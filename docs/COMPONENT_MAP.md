# TapTalk UI Component Map

Main user-visible components only. Each entry: what it looks like, where it sits on screen, file path, and what lives inside it. `**AI guidance:**` lines give implementation-critical constraints for future changes.

---

### ◆ ROOT APP SHELL
`app/_layout.tsx`

Wraps every screen. Provider order (outermost → in): `GestureHandlerRootView` → `ErrorBoundary` → `SafeAreaProvider` → `AppProvider` → `ThemeShell` (`expo-router` `Stack` + `StatusBar`). Blocks first paint until SF Compact fonts load; sets default font on `Text`/`TextInput`.

**AI guidance:** Never remove the gesture root (breaks board drag/drop) or reorder providers — `AppProvider` must sit inside safe-area but outside the Stack. Add global providers here, not per-screen. StatusBar style derives from `useTheme().isDark`.

---

### ◆ BOTTOM NAVIGATION BAR
`app/(tabs)/_layout.tsx`

Full-width bar fixed to the very bottom of every main screen. 78 pt tall. Four equal tabs, each with a custom SVG icon (selected/unselected variants) and a small label. Switches the active tab on tap with haptic feedback.

**Contains:** Talk tab · Activities tab · Tools tab · Me tab

**AI guidance:** Keep 78 pt height / 48 pt icons (locked). Bar collapse is driven by `useTabBarHidden()` from `src/features/board/chromeVisibility.ts` — do not add a second hide mechanism. Do not reorder or rename tabs (principle 4).

---

### ◆ TAP BOARD (Talk Screen)
`app/(tabs)/talk.tsx` — ~6 400 lines, orchestrator only; presentational leaves live under `src/features/board/components/`

The main AAC screen. Takes up the full display between the status bar and the bottom nav bar. Manages all board state: which board is active, edit mode, drag-and-drop layout, dock visibility, and speech.

**Contains:** Message Strip · Top Nav Panel · Board Grid · Bottom Control Bar · Add Symbol Modal · Add Folder Modal · Custom Symbol Editor

**Presentational leaves extracted** (God-screen split, problem #1 — see `docs/COMPONENT_MAP.md` entries below): tile renderers → `TileRenderer.tsx` · edit-mode overlays → `EditModeOverlay.tsx` · "way back" pill → `DockPeekPill.tsx` · pure layout math → `src/features/board/layout.ts` (unit-tested in `layout.test.ts`).

**AI guidance:** Import presentational leaves — do NOT re-inline them. Keep `TalkScreen()` as the state orchestrator (context reads, dispatches, refs, gestures); push any new pure/prop-only component into `src/features/board/components/`. Speak via `useSpeech` + `buildMessageUtterances` (never call `expo-speech` directly). Board/custom tiles persist through `AppContext`. Prewarm symbols with `prewarmMulberryAssets`. Gate all animation on `useReduceMotion()`. Do NOT duplicate layout math from `layout.ts` — import it.

---

### ◆ MESSAGE STRIP
`src/components/talk/TalkMessageStrip.tsx`

Horizontal bar pinned to the top of the Tap Board, below the status bar. Fixed height (~80 pt). Holds up to 4 word chips side by side showing the sentence being built. Right side has a Speak button (tapping the strip itself triggers speech) and a Backspace button. Far-right chevron toggles the Top Nav Panel open or closed.

**Contains:** Word Chip (×0–4) · Speak button · Backspace button · Top Nav toggle chevron

**AI guidance:** Presentational — parent owns the word array and speech. Tapping the strip must speak the full composed sentence through `buildMessageUtterances` (punctuation-aware). Keep every control ≥44 pt with `accessibilityRole`/`Label`. Height ~80 pt is layout-load-bearing for the grid below.

---

### ◆ TOP NAV PANEL
`app/(tabs)/talk.tsx` — `TopNav` component

A collapsible tab bar that slides in directly below the Message Strip when the chevron is tapped. Hidden by default. Contains four action tabs in a row. Each tab is labelled with an icon and text.

**Contains:** Edit tab · Layout tab · Saved tab · Settings tab

**AI guidance:** Defined as `TopNav` inside `talk.tsx`. Saved tab routes to `app/board/quick-talk`, and the keyboard entry to `app/board/keyboard`. Collapsed by default; animate open/closed with a Reduce-Motion fallback (fade).

---

### ◆ BOARD GRID
`app/(tabs)/talk.tsx` — `BoardGrid` / `ScrollView`

Scrollable grid of tiles filling the main area of the Tap Board between the Message Strip and the Bottom Control Bar. Columns and tile size adjust based on the board layout setting. In edit mode a dashed grid overlay appears over empty slots and tiles jiggle.

**Contains:** Word Tiles · Folder Tiles · (edit mode) Grid Overlay · Drag Placeholder · Source Ghost

**AI guidance:** Columns/tile size derive from the layout setting — never hardcode dimensions. Tiles carry row/col + span; preserve slot math when adding drag/resize/reorder. Wrap edit/layout/select/move/delete/favourite in edit mode (principle 25) and register reversible ops for Undo (principle 26). Keep the ScrollView's `bounces`/`overScrollMode="always"`.

---

### ◆ WORD TILE
`src/features/board/components/TileRenderer.tsx` — `BoardWordTile` (mounted inside `BoardTileButton` in `talk.tsx`)

A coloured square tile on the Board Grid. Has a tinted background, a Mulberry symbol image in the upper portion, and a one-word label at the bottom. Minimum 88 × 88 pt, can span 2× or 3× columns/rows. Tap speaks the word and appends it to the Message Strip with a flying ghost animation.

**Contains:** Background fill · Mulberry symbol · Label text · (edit mode) Resize handles · Selection indicator · Favourite star badge

**AI guidance:** Tile label is ONE word (locked) — full spoken phrase goes in the tile `speech` field. Render the pictogram only via `<MulberrySymbol>`. Tap speaks + appends to the strip. Keep the tinted background as the Fitzgerald word-type colour. Min 88×88 pt; forgiving hit area (principle 20). Component is a pure prop leaf — never add context reads or dispatches here; do it in the `BoardTileButton` wrapper in `talk.tsx`.

---

### ◆ FOLDER TILE
`src/features/board/components/TileRenderer.tsx` — `BoardFolderTile` (mounted inside `BoardTileButton` in `talk.tsx`)

A tile visually distinguished by a small tabbed corner at the top, signalling it opens a sub-board. Has a symbol icon and a one-word label. Same sizing rules as Word Tile. Tap navigates into the folder's child board; the Bottom Control Bar gains a Back button.

**Contains:** Tab corner shape · Symbol icon · Label text · (edit mode) same handles as Word Tile

**AI guidance:** Folders are always icon + one-word label — never text-only (locked). Tap pushes the child board and the dock switches to Folder mode (adds Back). Keep the tabbed-corner shape as the only visual signal distinguishing folders from word tiles. Same purity rule as Word Tile — presentational only.

---

### ◆ TILE RENDERER BUNDLE
`src/features/board/components/TileRenderer.tsx`

Extracted from `app/(tabs)/talk.tsx` (God-screen split, problem #1). Bundles every pure, prop-only board-tile leaf so the tile grid can re-render one tile at a time without dragging the whole screen with it.

**Exports:** `TileSymbol` (Mulberry mount) · `BoardFolderTile` · `CustomTilePicture` (user-photo tile) · `BoardWordTile` · `GhostTileClone` (tile-fly Reanimated clone) · `TILE_ASSETS` (background PNG map) · `WORD_TYPE_COLOR` / `wordTypeColour` (Fitzgerald palette) · `wordBackgroundForTile`.

**AI guidance:** These components are LEAVES. Never add `useAppContext`, `useSpeech`, `useRouter`, dispatches, or AsyncStorage here — that lives in `talk.tsx`. Styles are duplicated locally by intent (never import styles across screen boundaries). Types (`BoardTile`, `GhostTile`) come from `src/features/board/types.ts`.

---

### ◆ EDIT-MODE OVERLAY LAYERS
`src/features/board/components/EditModeOverlay.tsx`

Extracted from `app/(tabs)/talk.tsx` (God-screen split, problem #1). The four Reanimated-driven overlays that render behind, over, and around tiles while the board is in Edit / Move mode. All animation runs on the UI thread via `SharedValue` reads.

**Exports:** `GridOverlay` (dashed slot outlines) · `DragPlaceholder` (multi-cell snap highlight) · `MultiCell` (one cell inside DragPlaceholder) · `SourceGhost` (dashed outline at the vacated slot).

**AI guidance:** Parent (`talk.tsx`) owns the shared values — `snapSlot`, `dragFw`/`dragFh`, `dragSourceSlot`, `opacity`. Thread them in as props. Do NOT read context from these components — they must remain pure so drag/resize doesn't remount the grid. Layout constants come from `src/features/board/constants.ts` (`MAX_FW`, `TILE_CORNER_RADIUS`).

---

### ◆ DOCK PEEK PILL
`src/features/board/components/DockPeekPill.tsx`

Extracted from `app/(tabs)/talk.tsx` (God-screen split, problem #1). Floating "way back" affordance that appears at the left edge when the bottom control bar is hidden. Springs in from off-screen; instant under Reduce Motion.

**Contains:** Blob pill background · Three-bar vertical grip · Tap / long-press handlers (owned by parent).

**AI guidance:** Pure prop leaf — parent owns both `onPress` (restore controls) and `onLongPress` (open partial-hide popover). Bottom offset derives from `DOCK_BOTTOM_GAP` + `DOCK_ACTION_SIZE` in `constants.ts`; do not hard-code. Popover itself still lives in `talk.tsx` (owns state).

---

### ◆ BOARD LAYOUT MATH (PURE)
`src/features/board/layout.ts` · tests: `src/features/board/layout.test.ts`

The pure functions that decide where a tile ends up on the grid — anchor slots, coarse-cell footprints, collision detection, push-aside reflow. Zero React, zero Reanimated, zero side effects. Runs in unit tests without mounting a component tree.

**Exports:** `coarseCols` / `coarseRows` · `footprintAt` · `footprintsOverlap` · `reflowLayoutSlots` · `reflowAroundPinned` · types `TilePlacement`, `BoardLayout`, `CellFootprint`.

**AI guidance:** Any change to slot-packing must also update `layout.test.ts`. Never inline these calculations in `talk.tsx` — the tests are the safety net. Constants (`BOARD_COLUMNS`, `MAX_FW`) come from `./constants`.

---

### ◆ BOTTOM CONTROL BAR
`app/(tabs)/talk.tsx` — `BoardDock`

Contextual toolbar pinned to the bottom of the Tap Board, directly above the bottom navigation bar. Horizontally scrollable. Completely changes its set of buttons depending on the current mode. Can be partially or fully hidden; when fully hidden only the Dock Peek Pill remains.

**Modes and their buttons:**
- Home: Add · Sort · Quick · Hide · Settings
- Folder: Back · Add · Sort · Hide
- Edit Controls: Undo · Select · Move · Save · Cancel
- Add Flow: Symbol · Custom · Folder · Close
- Quick Manage: Done · Create

**Contains:** Action buttons · Dock Popover (sort/hide/select/move sub-menus) · Dock Peek Pill (when hidden)

**AI guidance:** `BoardDock` in `talk.tsx`. Button set is mode-driven — extend by adding to a mode's set, never by stacking always-on buttons (principles 1–2). Full-hide toggles the tab bar via `setTabBarHidden` (`chromeVisibility.ts`); leave the Peek Pill as the only re-show affordance. Separate destructive actions and confirm them (principle 12).

---

### ◆ ADD SYMBOL MODAL
`src/components/talk/AddSymbolModal.tsx`

Full form-sheet modal (slides up from the bottom). Two-step flow. Step 1: search field at the top, horizontal category filter chips below, a Recently Added row, and a scrollable results grid. Symbol Pack browser accessible via a folder icon. Step 2 (after selecting a symbol): live tile preview, label text field, word-type picker (sets Fitzgerald colour), and a colour override option.

**Contains:** Search field · Category filter chips · Recent symbols row · Symbol results grid · Symbol Pack browser · Tile preview · Label field · Word-type colour picker · Colour picker sheet

**AI guidance:** Search results resolve through the Symbol Brain (`resolveSymbolForKeyword` / symbol search service) — do not query the asset map directly. Word-type selection sets the Fitzgerald colour; colour override reuses the shared `ColorPickerSheet`. Enforce one-word labels on commit.

---

### ◆ ADD FOLDER MODAL
`src/components/talk/AddFolderModal.tsx`

Form-sheet modal for creating a new folder tile. Name text field at top (auto-focused). Below: a live full-size folder tile preview updating in real time. Icon picker opens an inline symbol search. Colour swatch opens the colour wheel sheet. Placement picker (which board to add it to) uses a native ActionSheet.

**Contains:** Name field · Folder tile preview · Icon search sheet · Colour picker sheet · Placement picker

**AI guidance:** Placement picker must stay a native `ActionSheetIOS` (locked iOS-native rule). Preview renders the real `<FolderTile>` so it can't drift from the board. Icon search reuses the Symbol Brain path; one-word folder name required.

---

### ◆ CUSTOM SYMBOL EDITOR
`src/components/talk/CustomSymbolEditor.tsx`

Full-screen modal for creating a tile backed by a user photo instead of a Mulberry symbol. Photo picker at top (camera or library). Label field and a separate Speech field (spoken text can differ from label). Background colour swatch and outline colour swatch each open the colour wheel. Advanced disclosure reveals opacity sliders.

**Contains:** Photo picker · Label field · Speech field · Background colour picker · Outline colour picker · Advanced disclosure

**AI guidance:** Backs a tile with a user photo instead of a Mulberry symbol — the tile renderer must branch on the custom-image source. Keep the separate Speech field (spoken text ≠ label) so full phrases are spoken. Opacity sliders stay behind the Advanced disclosure (principle 3).

---

### ◆ QUICK TALK (SAVED PHRASES)
`app/board/quick-talk/index.tsx` · store: `src/features/quick-talk/store.ts`

Full screen reached from the board's Saved/Quick tab. Flat list of saved phrases; tap speaks the phrase, long-press opens an Edit/Delete/Move ActionSheet, Edit mode exposes inline reorder/delete.

**AI guidance:** Phrase data lives ONLY in the `quick-talk/store` (`useSyncExternalStore`, AsyncStorage, cap `QUICK_TALK_MAX` = 25) — never duplicate it in component state. Tapping stops current speech first, then speaks via `useSpeech`. Long-press menu must stay `ActionSheetIOS`. Show the "list full" state at the cap.

---

### ◆ TAPTALK KEYBOARD
`app/board/keyboard/index.tsx`

Full-screen letter keyboard opened from the board's TAPTALK top-nav tab. Header (Back/title/Save), a tap-to-speak message strip, and a fixed A–Z + punctuation + space/backspace layout.

**AI guidance:** Letter keys speak on press; punctuation/space/backspace are silent and only shape the full read. Full-sentence speech MUST go through `buildMessageUtterances` (shared with the board for identical punctuation tone). Save routes into the Quick Talk store (respect the 25 cap). Keep the 3+ word back-guard `Alert`.

---

### ◆ ACTIVITIES SCREEN
`app/(tabs)/activities.tsx`

Full-screen scrollable card list. If any activity is starred a Favourites section appears at the top. Each card is a tall rounded rectangle with a hero image band, title, subtitle, and a circular play button with the activity's accent colour. Star button top-right of each card.

**Contains:** Activity Card (×N) · Favourites section header · Star burst animation on favourite tap

---

### ◆ TOOLS SCREEN
`app/(tabs)/tools.tsx`

Identical layout to Activities Screen. Scrollable card list of tools. Same Favourites section logic.

**Contains:** Tool Card (×N) · Favourites section header

---

### ◆ CALENDAR
`app/calendar/index.tsx` · New Plan: `app/calendar/new-plan.tsx` · Day detail: `app/calendar/day/index.tsx`

Month-view calendar screen. Top strip shows month name and left/right arrow chevrons. Below is a 7-column × 6-row date grid; today's cell is highlighted, selected date has an outline, days with plans show a small colour dot underneath. A "Today's Plan" card sits below the grid showing plans for the selected date.

**Contains:** Month header + nav arrows · Date grid · Plan dot indicators · Today's Plan card · New Plan button

---

### ◆ STEP BY STEP
`app/first-then/index.tsx` · Add step: `app/first-then/add-step.tsx`

Two-mode screen. Build mode: a vertical list of steps each labelled First / Then / Lastly, with an optional timer badge, a drag handle, and a delete affordance in edit mode. A Start button at the bottom launches run mode. Run mode: a full-screen modal with the current step displayed large in the centre, upcoming steps listed below in a dimmed smaller size, and Next/Skip controls at the bottom. Confetti plays on completion.

**Contains:** Step rows · Template picker · Settings disclosure · Run mode modal (current step display · upcoming steps · controls)

---

### ◆ VISUAL TIMER
`app/visual-timer/index.tsx`

Two-mode screen. Setup mode: three WheelPickers for hours, minutes, seconds; optional delay picker; end-sound picker; lock toggle; clock face style picker; preset durations disclosure; Start button. Run mode: a focus overlay dims everything except a large central clock face (three style options: modern digital, old-school digital, analogue SVG sweep hand). Unfocus and Pause/Resume buttons sit at the top.

**Contains:** Duration wheel pickers · Sound picker · Lock toggle · Clock face (3 variants) · Focus overlay · Preset durations disclosure

---

### ◆ ME SCREEN
`app/(tabs)/me.tsx`

iOS Settings-style profile hub. Scrollable. Account card at top (name, email, chevron to Account Settings). Below are grouped sections separated by all-caps section headers, each containing SettingsRow items that navigate to sub-pages or toggle settings in place.

**Contains:** Account card · Settings groups (General · Accessibility · Privacy & Data · Caregiver · Support) · each group contains SettingsRow items

---

### ◆ COMMUNICATION PASSPORT
`app/passport.tsx`

A sharable plain-text profile the user fills in to explain their communication style to support workers, teachers, or hospital staff. Five free-text section cards (How I communicate · What helps · What overwhelms · My access needs · Important to know) and a Trusted Contacts section. Share button at the bottom exports everything as a readable text document via the system share sheet.

**Contains:** Five text field sections · Trusted contacts list · Share button

---

### ◆ DISPLAY & ACCESSIBILITY SETTINGS
`app/settings/display.tsx`

The main accessibility control panel, reached from Me → Accessibility. Quick Setup preset pills at the top let the user apply one-tap bundles. Below are individual controls grouped into Vision (text size, theme, high contrast), Motor (button size, haptics), and Sensory (reduce motion, reduce sensory load, activity sounds). An Advanced section behind a toggle adds symbol colour scheme, motor access mode, and usage heatmap.

**Contains:** Quick Setup presets · Text size picker · Theme picker · Button size picker · Haptics controls · Reduce Motion toggle · Sensory Load toggle · Advanced disclosure

---

### ◆ SETTINGS ROW
`src/components/native/SettingsRow.tsx`

Reusable iOS-style list row used in the Me screen and all settings sub-pages. Has five types: **navigation** (chevron, taps to a new page), **toggle** (on/off switch), **action** (runs a function, no chevron), **expandable** (reveals inline content below), **static** (read-only). Each row has an icon badge, a label, and an optional value or hint string.

**Used in:** Me screen · Display Settings · Voice Settings · Account Settings · Board Settings · Pronunciation Settings

---

### ◆ COLOR PICKER SHEET
`src/components/native/ColorPickerSheet.tsx`

A form-sheet modal (slides up). Contains a circular colour wheel where the user drags to pick hue and saturation, a brightness bar below it, and a hex value input. Cancel keeps the previous colour; Done commits it.

**Used in:** Add Symbol Modal · Add Folder Modal · Custom Symbol Editor · Board Settings

---

### ◆ WHEEL PICKER
`src/components/native/WheelPicker.tsx`

An iOS drum-roll style picker rendered natively. The selected item sits in the centre of a fixed-height drum, items above and below fade out. Tap or drag to scroll. Used wherever a number or option must be chosen from a bounded list.

**Used in:** Visual Timer (hours/minutes/seconds/delay) · Voice Settings (fine-tune rate) · Step by Step (step duration)

---

### ◆ TOKEN SOURCE & THEME HOOK
`src/theme/tokens.ts` · `src/theme/useTheme.ts`

`tokens.ts` is the single source for every colour, spacing value, border radius, typography size, and animation duration used in the app. `useTheme()` is called at the top of every component to get the resolved token set for the active theme (light/dark). Changing a value here changes it everywhere.

**AI guidance:** Never hardcode hex/spacing/radius — pull from tokens via `useTheme()`. `shadows.*` are intentionally zeroed (flat design, locked); do not add shadow/elevation. Add new design values here once, not inline.

---

### ◆ MULBERRY SYMBOL RENDERER
`src/components/symbols/MulberrySymbol.tsx`

The only component that draws Mulberry pictograms (word tiles, folder tiles, previews, pickers).

**AI guidance:** Always render pictograms via `<MulberrySymbol symbolId=… />` (preferred) or legacy `name`; both resolve through `MULBERRY_ASSET_MAP`. Uses a session URI cache — call `prewarmMulberryAssets()` for visible board symbols to avoid pop-in. Square 1:1 frame guarantees uniform sizing; don't override aspect. Mulberry CC BY-SA attribution must remain shown in-app.

---

### ◆ SPEECH ENGINE
`src/hooks/useSpeech.ts` · rules: `src/utils/speechRules.ts`

The single TTS path for the whole app (board, keyboard, Quick Talk).

**AI guidance:** Speak only through `useSpeech().speak/stop` (wraps `expo-speech` with error surfacing) — never call `expo-speech` directly. Build utterance chains with `buildMessageUtterances(text, rate, pitch, opts)` so punctuation pauses/intonation and pronunciation overrides stay identical everywhere. Known vocab words ALWAYS speak directly (never spelled) — emergency-communication safety, do not regress. Stop current speech before starting a new utterance.

---

### ◆ SYMBOL BRAIN RESOLVER
`src/features/symbol-brain/resolveSymbolForKeyword.ts`

Maps any keyword to a guaranteed Mulberry symbol for search/auto-suggest in the Add Symbol and Add Folder flows.

**AI guidance:** Use this (not raw asset-map lookups) whenever a word needs a symbol. Returns a `tier` (exact→unknown) + score; render a subtle indicator for non-exact matches. It always resolves something (category exemplar → unknown fallback). LRU-cached and context/sentence-token aware; call `clearResolveCache()` after vocabulary/guardian-override changes.

---

### ◆ HAPTICS
`src/utils/haptics.ts`

App-wide haptic feedback helpers over `expo-haptics`.

**AI guidance:** Use the named helpers (`hapticSelection`/`hapticLight`/`hapticMedium`/`hapticSuccess`/`hapticWarning`/`hapticError`) — never call `expo-haptics` directly. They already no-op when disabled and honour the global strength preference (wired at root from `state.accessibility`). Use sparingly: selection on tap, success/error on completion (principle 19).

---

### ◆ REDUCE MOTION
`src/hooks/useReduceMotion.ts`

Effective Reduce Motion flag = system setting OR the in-app override.

**AI guidance:** Gate every non-essential animation on `useReduceMotion()` (principle 18) and provide a fade/no-motion fallback for floating/zoom/bounce. Use `useSystemReduceMotion()` only when the in-app override must be ignored.

---

### ◆ APP STATE / CONTEXT
`src/context/AppContext.tsx` · types: `src/context/types.ts`

Global reducer store (provided at the root shell) holding board tiles, custom tiles, favourites, profile, and all accessibility settings.

**AI guidance:** Read via `useAppContext()`/`useAppSelector`; mutate only by dispatching typed actions from `types.ts` — never mutate state directly. Persistence is split hot/cold and debounced automatically. Accessibility changes here fan out to haptics (`setHapticsEnabled`/`setHapticStrength`), speech (`setPronunciations`), and Reduce Motion; keep those sync points intact. This is the source of truth for daily-use board/speech behaviour.

---

### ◆ CHROME VISIBILITY STORE
`src/features/board/chromeVisibility.ts`

Tiny module-level store bridging the board's "Hide" feature and the tab navigator.

**AI guidance:** Board calls `setTabBarHidden(bool)`; the tab layout subscribes with `useTabBarHidden()`. Use this store for any full-screen/hide-chrome behaviour — do not thread a new context or add a parallel hide flag.
