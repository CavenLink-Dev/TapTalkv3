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

**AI guidance:** Folders are always icon + one-word label — never text-only (locked). Tap pushes the child board and the dock switches to Folder mode (adds Back). Keep the tabbed `useTheme()`. `shadows.*` are intentionally zeroed (flat design, locked); do not add shadow/elevation. Add new design values here once, not inline.

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
