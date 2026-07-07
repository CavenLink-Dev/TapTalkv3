# talk.tsx refactor — Codex handoff plan

## Status after this pass
- Baseline: 6,464 lines.
- Now: **6,127 lines** in `app/(tabs)/talk.tsx` (−337).
- New files (pure, no runtime side effects):
  - `src/features/board/talk/types.ts` — all Talk-surface types (BoardTile, DockMode, BoardUndoEntry, etc.)
  - `src/features/board/talk/constants.ts` — layout sizes, symbol palette, TOP_TAB_META, QUICK_TAGS_STORAGE_KEY, HANDLE_* consts
  - `src/features/board/talk/boardTiles.ts` — HOME_TILES, EMERGENCY_TILES, BOARD_TILES, BACK_TILE, helpers
- `BOARD_TILES` re-exported from `talk.tsx` — existing importers in `app/board/health.tsx` and `app/board/hidden-tiles.tsx` untouched.
- `tsc` clean for `talk.tsx` and all new files (pre-existing errors elsewhere are unrelated).

## Remaining shape of talk.tsx (6,127 lines)
| Range | Section | Lines |
|---|---|---|
| 1–199 | Imports + Phase 4 chrome TODO | 199 |
| 201–241 | `BoardNavTile` (memo) | 40 |
| 243–425 | `BoardDockAction` (memo) | 182 |
| 427–556 | `DockPopover` | 129 |
| 557–658 | `DockSubControls` | 101 |
| 659–1129 | `ResizeHandles` | 470 |
| 1130–1688 | `BoardTileButton` + memo | 558 |
| 1689–1786 | `BoardTileCell` (memo) | 97 |
| 1787–1899 | `TopNavTab` (memo) | 112 |
| 1900–1949 | `TopNav` (memo) | 49 |
| **1950–5538** | **`TalkScreen`** (40 useState, 129 useCallback/useMemo/useEffect) | **3,588** |
| — inside — 4646–4991 | `dockRenderers` (9 branches) | ~346 |
| 5539–6127 | `styles` (StyleSheet.create) | 588 |

## Audit findings (before starting)

Every sub-component I proposed to lift reads from the shared `styles` StyleSheet declared at the BOTTOM of talk.tsx (lines 5539–6127). If you extract sub-components first, they can't compile — `styles` won't exist in their scope.

**Fix: do Phase F FIRST**, then Phases A–D. Revised order below.

Other confirmed facts from the audit:
- `TOP_TABS` (line 1891, module scope) moves with `TopNav`.
- `BoardTileButton` depends on `ResizeHandles`. Extract `ResizeHandles` before `BoardTileButton`.
- `styles` uses `colors` **0 times** — grep confirmed. Only `spacing`, `radii`, `boardSizes`, `CHROME_SEPARATOR_WIDTH`, and the `MESSAGE_/DOCK_/TILE_/BOARD_TOP_GAP/TOP_NAV_HEIGHT` constants (all already exported from `talk/constants.ts`).
- `dockRenderers` (4646–4991) closes over **244 distinct identifiers** including 28+ handler callbacks. Extracting it as a single factory function creates a giant `ctx` type surface. **Downgraded from "extract" to "consider splitting into per-DockMode helpers only if a hook refactor makes it easy". Don't attempt in isolation.**

## Plan for Codex (execute in order; run `tsc` after each phase)

### Phase F (do first) — lift `styles` (~588 lines out)
Move `StyleSheet.create` block at lines 5539–6127 to `src/features/board/talk/styles.ts` and `export const styles = StyleSheet.create({...})`. Add `import { styles } from '../../src/features/board/talk/styles';` at the top of talk.tsx.

Zero closures. Purely mechanical. Verify no key was renamed by grepping `styles\.` count before vs. after (must match).

### Phase A — lift the 4 pure sub-components (~950 lines out)
Each takes only props; no closure over `TalkScreen` state. All import `styles` from the file created in Phase F.

1. `src/features/board/components/BoardNavTile.tsx` ← lines 201–241.
   - Deps: `styles`, `colors`, `useTheme`, `BackOutIcon`, `BoardHomeIcon`, `BoardTile` type.
2. `src/features/board/components/BoardDockAction.tsx` ← 243–425.
   - Deps: `styles`, `colors`, `spacing`, `useTheme`, `Icon`, `DOCK_*` constants.
3. `src/features/board/components/DockPopover.tsx` ← 427–556.
   - Deps: `styles`, `colors`, `spacing`, `useTheme`, `useReduceMotion`.
4. `src/features/board/components/DockSubControls.tsx` ← 557–658.
   - Deps: `styles`, `spacing`, `BoardDockAction` (#2), `useReduceMotion`, `DOCK_ACTION_SIZE`.

### Phase B — lift `ResizeHandles` (~470 lines out)
5. `src/features/board/components/ResizeHandles.tsx` ← 659–1129.
   - Prop signature confirmed: `{ editMode, width, height, fw, fh, fineUnit, onResize, isDragging: SharedValue<number>, tileLabel }`.
   - Deps: `useTheme`, `useReduceMotion`, `useSharedValue`, `useMemo`, `Gesture.Pan`, `runOnJS`, `hapticSelection`, `withTiming`, `MAX_FW` (in constants.ts), `styles`.
   - `isDragging: SharedValue<number>` prop is currently unused (`_isDragging`). Keep the prop to match the caller signature — do NOT prune.

### Phase C — lift the tile button (~660 lines out)
6. `src/features/board/components/BoardTileButton.tsx` ← 1130–1786 (button + memo + `BoardTileCell`).
   - `BoardTileButtonProps` interface confirmed self-contained (all fields are primitives, shared values, or callbacks).
   - Deps: `styles`, `colors`, `animation`, `useTheme`, `useReduceMotion`, `hapticSelection`, `Icon`, `BOARD_COLUMNS`, `TILE_GAP`, `TILE_V_GAP` (in constants.ts), `BoardFolderTile`, `BoardWordTile` (already in `TileRenderer`), `ResizeHandles` (from Phase B).
   - Keep `MemoBoardTileButton` next to `BoardTileButton` in the same file.
   - `BoardTileCell` (1689–1786) has its own small prop surface — extract in the same file to keep the tile group together.

### Phase D — lift the top nav (~160 lines out)
7. `src/features/board/components/TopNav.tsx` ← 1787–1949.
   - Move `TOP_TABS` (line 1891) with it. Both `TopNavTab` and `TopNav` live in this file.
   - Deps: `Ionicons`, `useTheme`, `useReduceMotion`, `animation`, `colors`, `styles`, `TOP_TAB_META` (in constants.ts), `TopTab` type (in types.ts).

### Phase E — split `TalkScreen` internals (biggest win, highest care)
By this point talk.tsx is roughly 3,700 lines and the whole god-component is what's left.

**Do NOT attempt `dockRenderers` extraction as a single factory.** It closes over 244 identifiers including 28+ handler callbacks. Best treatment: leave inline for now, or split lazily per-DockMode after the state hooks below shrink the closure count.

8. `src/features/board/talk/useBoardLayoutState.ts` — extract `layouts`, `layoutDirty`, `layoutSnapshotRef`, `selectedLayoutTileId`, `boardAreaHeight`, and their setters + persistence effect (~150 lines).
9. `src/features/board/talk/useEditMode.ts` — `editMode`, `editControlsOpen`, `activeEditTool`, `selectedTileIds`, `editFocusTileId`, `undoStack`, `undoToast`, `undoTimerRef`, the enter/exit/save/cancel callbacks (~250 lines).
10. `src/features/board/talk/useQuickManage.ts` — `quickTaggedIds`, `quickViewActive`, `quickDockMode`, `quickManageOpen`, `manageSelectedIds`, `manageCreatedTag`, hydration effect, shake/tint shared values (~200 lines).
11. `src/features/board/talk/useSpeechQueue.ts` — `speakRunIdRef`, `speechQueueRef`, `drainSpeechQueue`, `enqueueSpeech`, `flushSpeechQueue`, refs for rate/pitch (~80 lines).
12. `src/features/board/talk/useDockVisibility.ts` — `navHidden`, `dockHidden`, `dockSlide`, `dockFade`, `peekMenuVisible`, `hideMenuVisible` (~100 lines).
13. `src/features/board/talk/dockRenderers.tsx` — extract the `dockRenderers` record (lines 4646–4991, ~346 lines). Signature: `(ctx: DockRenderCtx) => Record<DockMode, () => React.ReactNode>` where `DockRenderCtx` is the exact set of state/callbacks each branch reads. Build the ctx type by grepping the block's identifiers first.

### Target end state
`talk.tsx` should land **~600–900 lines**: imports, the `TalkScreen` component body composed of hooks and JSX, and nothing else.

## Honest guarantee level
This plan will NOT be 100% error-free on execution. What I can promise:
- **Phases F, A, B, D**: very high confidence. Pure sub-components with confirmed prop signatures and closure-free bodies. Codex should breeze through these.
- **Phase C**: high confidence. Complex but the props interface is already declared and the outer identifiers are all imports/constants I've verified exist.
- **Phase E hooks**: medium confidence. Extracting a hook from an interleaved 3,588-line function body requires attention to state ordering (React hook rules), effect dependencies, and refs shared across hooks. Codex should extract ONE hook at a time and run tsc after each.
- **`dockRenderers`**: do not attempt as a factory. Marked as skip.

The pre-existing tsc errors (VocabularyBackupSection, BoardGrid, exportPdf, mergeTiles.test, corePredictor, sanitizeImage, utteranceLog) are noise unrelated to this refactor — Codex should baseline them before starting and compare against the same list after each phase.

## Rules for Codex
- One phase per commit. Run `npx tsc --noEmit` after each; only proceed if no NEW errors appear in `talk.tsx` or the new files. Ignore pre-existing errors in `VocabularyBackupSection.tsx`, `BoardGrid.tsx`, `exportPdf.ts`, `mergeTiles.test.ts`, `corePredictor.ts`, `sanitizeImage.ts`, `utteranceLog.ts`.
- Do NOT touch behaviour. Prop signatures may be tightened (fewer optional params) but no logic edits.
- Keep the `export { BOARD_TILES }` re-export until `hidden-tiles.tsx` and `health.tsx` are updated to import from `src/features/board/talk/boardTiles` — that's a follow-up sweep, not part of the refactor.
- For hook extractions (Phase E), the hook must expose the SAME identifiers the god-component uses today so the JSX inside `TalkScreen` doesn't move — only its state declarations do.
- Reanimated shared values pass by reference; return them from hooks directly. Don't wrap them in `useMemo`.
- If a phase's diff exceeds ~600 lines added/removed net, split the phase.

## Rollback story
Each new file is additive. If a phase breaks:
- `git checkout -- app/\(tabs\)/talk.tsx` restores the god component.
- The new files under `src/features/board/talk/` and `src/features/board/components/` can be deleted safely — no other code depends on them until the corresponding phase's talk.tsx edit lands.
