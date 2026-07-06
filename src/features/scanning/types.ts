/**
 * ScanningController — public types.
 *
 * Phase 4 motor access. This subsystem lets users with cerebral palsy, ALS,
 * spinal cord injury, or any other condition that prevents accurate touch
 * targeting operate the whole app via one or two external switches
 * (Bluetooth switch interface, hardware volume rockers, or iOS Switch
 * Control passthrough as keyboard events).
 *
 * The controller is DELIBERATELY DECOUPLED from touch state. Both input
 * paths remain live simultaneously — a carer can hand-over-hand help a
 * user tap the screen while scanning also runs, and neither collides with
 * the other. That is a hard requirement: scanning users often share the
 * device with a communication partner.
 */

/**
 * Which phase of the row-then-column scan is currently active.
 * `idle`     — scanner is on but nothing is highlighted yet (between cycles).
 * `row`      — a whole row is highlighted; select drills into columns.
 * `column`   — a single tile within the picked row is highlighted;
 *              select fires that tile's action.
 * `paused`   — highlight loop halted (user idle, backgrounded, or long-hold).
 */
export type ScanPhase = 'idle' | 'row' | 'column' | 'paused';

/**
 * A scannable target. Any component that wants to receive scan selection
 * registers one of these with the controller. The controller stores them
 * in row-major order — rowIndex first, then columnIndex within that row.
 * IDs must be stable across renders; a churn of IDs (React key changes)
 * will drop the current highlight to `idle` on the next tick.
 */
export interface ScanTarget {
  /** Stable identity — usually the tile ID from the board layout. */
  id: string;
  /** Zero-based row within the containing scan group. */
  rowIndex: number;
  /** Zero-based column within the row. */
  columnIndex: number;
  /**
   * What runs when the switch user "selects" this target. This callback
   * is invoked on the JS thread with no arguments; it should perform the
   * same side-effect a touch tap would (speak the word, open the folder,
   * fire the edit action). Throwing here is caught by the controller and
   * logged; it will NOT crash the scan loop.
   */
  onSelect: () => void;
  /**
   * Optional VoiceOver / screen-reader label announced when the target is
   * highlighted. Falls back to `id` if omitted.
   */
  accessibilityLabel?: string;
  /**
   * Optional group name — reserved for future multi-region scanning
   * (e.g. dock vs. board). Untyped groups all scan together.
   */
  group?: string;
}

/**
 * Input actions the switch layer emits into the controller. Volume-up,
 * space bar, and a Bluetooth switch's first button all map to `advance`;
 * volume-down or the second switch button maps to `select`. Long-hold
 * emits `pause` for accidental-hit recovery.
 */
export type ScanInputAction = 'advance' | 'select' | 'pause' | 'resume' | 'reset';

/** Public API surface exposed via the ScanningContext. */
export interface ScanningContextValue {
  /** True whenever the user has flipped scanning on in settings. */
  enabled: boolean;
  /** Whether the highlight loop is currently ticking. */
  running: boolean;
  /** Row-then-column phase machine state. */
  phase: ScanPhase;
  /** Currently highlighted row (null when phase !== 'row' && phase !== 'column'). */
  activeRow: number | null;
  /** Currently highlighted column within `activeRow` (null unless phase === 'column'). */
  activeColumn: number | null;
  /** Currently highlighted target's ID, for the overlay ring to key off. */
  activeTargetId: string | null;
  /** Register a scannable target. Returns an unregister fn (call in useEffect cleanup). */
  registerTarget: (target: ScanTarget) => () => void;
  /** Fire a switch input event. Safe to call from anywhere. */
  dispatchInput: (action: ScanInputAction) => void;
  /** Manually pause/resume the loop (settings screen, backgrounding, etc.). */
  pause: () => void;
  resume: () => void;
  /** Return the highlight to row-selection state at row 0. */
  reset: () => void;
  /** Row count / column count in the active grid — exposed for overlays. */
  rowCount: number;
  columnCount: number;
}
