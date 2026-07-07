import { StyleSheet } from 'react-native';
import { boardSizes, CHROME_SEPARATOR_WIDTH, radii, spacing } from '../../../theme/tokens';
import {
  BOARD_TOP_GAP,
  DOCK_ACTION_SIZE,
  DOCK_BOTTOM_GAP,
  DOCK_GAP,
  DOCK_ICON_ACTION,
  DOCK_ICON_ROW,
  DOCK_ICON_TOGGLE,
  DOCK_TOGGLE_SIZE,
  MESSAGE_CHIP_SIZE,
  MESSAGE_HEIGHT,
  MESSAGE_SLOT_GAP,
  TILE_CORNER_RADIUS,
  TILE_GAP,
  TOP_NAV_HEIGHT,
} from './constants';

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  screenRoot: {
    flex: 1,
  },
  errorBanner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  errorText: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  messageArea: {
    height: MESSAGE_HEIGHT,
    paddingLeft: 21,
    paddingRight: 17,
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 18,
    borderBottomWidth: 1.4,
  },
  messageButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    position: 'relative',
  },
  messageText: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  messagePlaceholder: {
    fontWeight: '400',
  },
  messageSlotRow: {
    position: 'absolute',
    left: 0,
    top: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: MESSAGE_SLOT_GAP,
  },
  messageSlotRowHidden: {
    opacity: 0,
  },
  messageSlot: {
    width: MESSAGE_CHIP_SIZE,
    height: MESSAGE_CHIP_SIZE,
  },
  messageChip: {
    width: MESSAGE_CHIP_SIZE,
    height: MESSAGE_CHIP_SIZE,
    position: 'relative',
  },
  messageChipBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: MESSAGE_CHIP_SIZE,
    height: MESSAGE_CHIP_SIZE,
  },
  messageChipLabel: {
    position: 'absolute',
    left: 3,
    right: 3,
    top: 5,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  backspace: {
    width: 58,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  topNavSlot: {
    position: 'relative',
    zIndex: 2,
    overflow: 'hidden',
  },
  topNavPanel: {
    marginHorizontal: 0,
    height: TOP_NAV_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 16,
    paddingRight: 16,
  },
  // Full-width bottom border of the top nav. Rendered as a view rather than
  // a border so it isn't clipped by the animated slot's overflow:hidden.
  topNavBottomBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: CHROME_SEPARATOR_WIDTH,
  },
  // 68×52 sits inside the 50–56 target range while trimming the previous
  // 72×57 footprint. Press feedback is the animated scale, not opacity.
  topTab: {
    minWidth: 52,
    height: boardSizes.topNavItemHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  topTabContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    width: '100%',
    paddingTop: 4,
    paddingBottom: 3,
  },
  // Selected-state pill — rounded fill behind the active tab's icon+label.
  topTabPill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 12,
  },
  topTabIconMount: {
    height: boardSizes.topNavIcon,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  topTabLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  board: {
    flex: 1,
  },
  boardContent: {
    // Tiles are absolutely positioned inside the grid container View.
    // This contentContainerStyle only provides the outer padding.
    paddingTop: BOARD_TOP_GAP,
    paddingBottom: 10,
    alignItems: 'flex-start',
  },
  tilePressable: {
    width: '100%',
    height: '100%',
  },
  // tilePressed removed — spring scale on onPressIn/Out is the sole press feedback
  deleteBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  // ── Select Mode: circular indicator on the tile corner. Draws a soft
  // outlined circle when unselected and a filled primary-blue circle with
  // a tick when selected, without covering the symbol and label.
  selectIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8,
  },
  // ── Move Mode: dashed primary outline that appears on folder tiles
  // while the user is choosing a destination.
  moveDestinationOutline: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    borderRadius: TILE_CORNER_RADIUS,
    zIndex: 4,
  },
  tileEditOutline: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: TILE_CORNER_RADIUS,
  },
  tileShell: {
    position: 'relative',
  },
  customTilePicture: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderTab: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderTopLeftRadius: TILE_CORNER_RADIUS,
    borderTopRightRadius: TILE_CORNER_RADIUS,
    // Folder outline is now barely visible (Phase 3 — Folder Outline Pass):
    // hairline stroke so the board reads as a field of symbols first.
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
  },
  folderFace: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: TILE_CORNER_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
  },
  // Label sits in a small band at the bottom (Phase 3 — Symbol/Label
  // Hierarchy). Symbol occupies the top ~75% of the tile; label the
  // bottom ~22%. adjustsFontSizeToFit still handles long labels.
  folderLabel: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 4,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Symbol mount now claims the top ~75% of the tile so the pictogram
  // reads as the primary visual (Phase 3). Label lives in the bottom band
  // (bottom:4 + 16pt line-height + a hair of breathing room = ~22pt).
  symbolMount: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 4,
    bottom: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordTile: {
    position: 'relative',
  },
  // Flat coloured fill behind the symbol/label. Rounded corners match the
  // optical weight of the folder PNGs so word and folder tiles share a
  // visual rhythm.
  wordTileFallbackBorder: {
    borderRadius: TILE_CORNER_RADIUS,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  wordTileCustomOutline: {
    borderRadius: TILE_CORNER_RADIUS,
    borderWidth: 2,
  },
  wordTileFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: TILE_CORNER_RADIUS,
  },
  // Typography mirrors `folderLabel` so words and folders read as one
  // family (Phase 3 — Symbol/Label Hierarchy: label at bottom, small).
  wordLabel: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 4,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  ghostOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  ghostTile: {
    position: 'absolute',
  },
  boardArea: {
    flex: 1,
  },
  boardDock: {
    paddingTop: spacing.sm,
    // Float over the board with no fill — the grey board shows through so the
    // control bar reads as floating rather than sitting on a solid strip.
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  dockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: DOCK_GAP,
  },
  // Collapsed control bar: the hugging/peeking toggle matches the control
  // bar item height so the way back is as easy to hit as the bar itself.
  collapsedDockMount: {
    width: DOCK_TOGGLE_SIZE,
    height: DOCK_TOGGLE_SIZE,
    overflow: 'visible',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  collapsedDockPeek: {
    transform: [{ translateX: -34 }],
  },
  // ── DockPopover (Sort / Hide options) ───────────────────────────────────
  // Sits just above the control bar, aligned with its anchor button.
  // Calm: soft border, no heavy shadow, generous 48pt rows.
  dockPopover: {
    position: 'absolute',
    bottom: DOCK_BOTTOM_GAP + DOCK_ACTION_SIZE + spacing.sm,
    borderRadius: 14,
    borderWidth: 1.6,
    paddingVertical: 6,
    paddingHorizontal: 6,
    overflow: 'hidden',
    minWidth: 110,
  },
  dockPopoverDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 4,
  },
  dockPopoverItem: {
    minHeight: boardSizes.subOptionMinHeight,
    borderRadius: 10,
    paddingHorizontal: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dockPopoverItemLabel: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  dockPopoverCheck: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Favourite star — small calm badge, top-left of pinned tiles.
  favouriteBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9,
  },
  // ── Top Sub Control (item 5) ─────────────────────────────────────────────
  // Even spacing from left, right, and top of the board area. Light pill —
  // soft border, no shadow — so it reads as guidance, not another toolbar.
  topSubControl: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  topSubControlText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  // ── DockPeekPill (item 4 v2) ─────────────────────────────────────────
  // Soft blob hugging the left edge, vertically centred in the dock's
  // former position. Flat left side (flush with the edge), 20pt rounded
  // right side, subtle floating shadow. 44×56pt ≥ minimum touch target.
  dockPeekPillMount: {
    position: 'absolute',
    left: 0,
    bottom: DOCK_BOTTOM_GAP + Math.max(0, (DOCK_ACTION_SIZE - 56) / 2),
  },
  dockPeekPill: {
    width: 44,
    height: 56,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1.6,
    borderLeftWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle drop shadow so it reads as floating above the board.
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  dockPeekGrip: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dockPeekGripBar: {
    width: 14,
    height: 2.5,
    borderRadius: 1.25,
  },
  // ── Quick feature ────────────────────────────────────────────────────
  // Lightning badge — top-right of Quick-tagged tiles, always visible.
  quickBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    zIndex: 10,
  },
  // Per-tile Quick view highlight (absolute fill, above tile content but
  // pointerEvents:none so interaction is untouched).
  quickTileOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: TILE_CORNER_RADIUS,
    zIndex: 8,
  },
  quickRemoveStrike: {
    position: 'absolute',
    left: '6%',
    right: '6%',
    top: '50%',
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#FF3B30',
    opacity: 0.8,
    transform: [{ rotate: '-24deg' }],
  },
  // Reusable sub-controls layer — one column of square sub-buttons that
  // hovers directly above whichever dock button owns the anchor. Sized so
  // each sub-button aligns 1:1 with the parent (Phase 2 sub-control layer).
  dockSubControls: {
    position: 'absolute',
    bottom: DOCK_BOTTOM_GAP + DOCK_ACTION_SIZE + spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  dockSubControlSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Faint red blend over the Quick button on the newcomer error shake
  // (animated opacity 0 → 0.25 — never a hard colour switch).
  quickErrorTint: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    backgroundColor: '#FF3B30',
  },
  dockAction: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockActionLabel: {
    fontSize: boardSizes.controlBarLabel,
    lineHeight: boardSizes.controlBarLabel + 4,
    fontWeight: '700',
    textAlign: 'center',
  },
  dockAddToggleLabel: {
    fontSize: boardSizes.controlBarLabel,
    lineHeight: boardSizes.controlBarLabel + 3,
    fontWeight: '700',
    textAlign: 'center',
  },
  dockIconOnlyMount: {
    width: DOCK_ICON_TOGGLE + 4,
    height: DOCK_ICON_TOGGLE + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  dockIconRowGlyph: {
    width: DOCK_ICON_ROW + 2,
    height: DOCK_ICON_ROW + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockRowLabel: {
    fontSize: boardSizes.controlBarLabel,
    lineHeight: boardSizes.controlBarLabel + 3,
    fontWeight: '700',
    textAlign: 'left',
  },
  dockIconStack: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dockIconStackGlyph: {
    width: DOCK_ICON_ACTION + 2,
    height: DOCK_ICON_ACTION + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRow: {
    flexDirection: 'row',
    gap: TILE_GAP,
    marginTop: 0,
  },
  navTileShell: {
    position: 'relative',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTileIconMount: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTileLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingBottom: 6,
  },
  // ── Undo toast ──────────────────────────────────────────────────────────
  undoToast: {
    position: 'absolute',
    bottom: 100,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#323232',
    borderRadius: radii.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  undoToastText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  undoToastButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  undoToastButtonText: {
    color: '#62C1FF',
    fontSize: 15,
    fontWeight: '700',
  },
});

