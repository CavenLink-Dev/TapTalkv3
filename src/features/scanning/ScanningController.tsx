/**
 * ScanningController — row-then-column switch-access scan loop.
 *
 * Architecture: this is a pure React context that runs a `setInterval`-driven
 * highlight machine. It never touches the touch pipeline, never captures
 * pointer events, and never mutates children — it only publishes highlight
 * state and receives switch-input dispatches. That decoupling is why the
 * controller can coexist with normal touch input on the same tiles.
 *
 * State model:
 *   Phase `idle`      — nothing highlighted, waiting for the first tick.
 *   Phase `row`       — highlight sweeps top→bottom, one row per tick.
 *   Phase `column`    — user selected a row; highlight sweeps left→right
 *                        through the tiles in that row, one per tick.
 *   Phase `paused`    — loop halted (idle-time, backgrounded, or user pause).
 *
 * A "select" while in `row` phase drills into `column` phase at the
 * highlighted row. A "select" while in `column` phase fires the tile's
 * `onSelect` callback and returns to `row` phase at row 0. If the user
 * ignores a full scan cycle (all rows swept N times without a select),
 * the loop auto-pauses; that stops the highlight from cycling forever
 * when the user has stepped away — a real problem on iPads used by
 * schools and care homes.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState as RNAppState, InteractionManager } from 'react-native';
import { useAppSelector } from '../../hooks/useAppContext';
import type { ScanInputAction, ScanPhase, ScanTarget, ScanningContextValue } from './types';

const ScanningContext = createContext<ScanningContextValue | null>(null);

/**
 * Small utility — group registered targets by row, sort within each row by
 * column. Called on every registration change; the target set is small
 * (<= a few hundred tiles) so an O(n log n) sort per mutation is fine.
 */
function buildGrid(targets: Map<string, ScanTarget>): ScanTarget[][] {
  const rows = new Map<number, ScanTarget[]>();
  for (const t of targets.values()) {
    const bucket = rows.get(t.rowIndex);
    if (bucket) bucket.push(t);
    else rows.set(t.rowIndex, [t]);
  }
  const rowIndices = Array.from(rows.keys()).sort((a, b) => a - b);
  return rowIndices.map((idx) => {
    const list = rows.get(idx) ?? [];
    return list.slice().sort((a, b) => a.columnIndex - b.columnIndex);
  });
}

export function ScanningProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const enabled = useAppSelector((s) => s.accessibility.scanningEnabled);
  const scanRate = useAppSelector((s) => s.accessibility.scanRate);
  const autoPauseCycles = useAppSelector((s) => s.accessibility.scanAutoPauseCycles);

  // Registered scan targets — the source of truth for the grid geometry.
  // A ref (not state) because target mutations happen inside effects and
  // the reducer version of grid is derived; we bump a version counter to
  // trigger a re-derive without cascading renders on every tile mount.
  const targetsRef = useRef<Map<string, ScanTarget>>(new Map());
  const [targetsVersion, setTargetsVersion] = useState(0);

  const grid = useMemo(() => buildGrid(targetsRef.current), [targetsVersion]);
  const rowCount = grid.length;
  // Column count varies row-by-row (last row may be partial); expose the
  // widest row so overlays can size a container that fits every phase.
  const columnCount = useMemo(
    () => grid.reduce((max, r) => (r.length > max ? r.length : max), 0),
    [grid],
  );

  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [activeColumn, setActiveColumn] = useState<number | null>(null);

  // Track how many complete row-sweep cycles have elapsed without a select;
  // when we hit `autoPauseCycles`, we suspend the loop until switch input
  // resumes it. Reset on any advance/select the user actually issues.
  const idleCyclesRef = useRef(0);

  // Interval handle; typed as `number | null` since RN's setInterval returns
  // a number-like handle on both platforms via the polyfill.
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTicker = useCallback(() => {
    if (tickerRef.current != null) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  }, []);

  const running = enabled && phase !== 'paused';

  // The advance step — pure function of current phase + grid geometry.
  const advance = useCallback(() => {
    if (rowCount === 0) {
      // No targets registered yet (e.g. board still mounting). Keep the
      // ticker alive so it picks up automatically once tiles register,
      // but don't burn any state changes.
      return;
    }
    setPhase((prevPhase) => {
      if (prevPhase === 'paused') return prevPhase;
      if (prevPhase === 'idle') {
        setActiveRow(0);
        setActiveColumn(null);
        return 'row';
      }
      if (prevPhase === 'row') {
        setActiveRow((r) => {
          const next = r == null ? 0 : r + 1;
          if (next >= rowCount) {
            // Completed one full row sweep — bump idle counter.
            idleCyclesRef.current += 1;
            if (idleCyclesRef.current >= autoPauseCycles) {
              // Auto-pause: user has stepped away or is not engaging.
              setPhase('paused');
              return null;
            }
            return 0;
          }
          return next;
        });
        return 'row';
      }
      if (prevPhase === 'column') {
        setActiveColumn((c) => {
          const rowTiles = activeRow != null ? grid[activeRow] : undefined;
          const cols = rowTiles ? rowTiles.length : 0;
          if (cols === 0) {
            // Row emptied out (tile hidden mid-scan?) — bail to row phase.
            setPhase('row');
            return null;
          }
          const next = c == null ? 0 : c + 1;
          // On overflow, wrap. We do NOT bump the idle counter here — a
          // stalled column sweep usually means the user is still deciding.
          return next >= cols ? 0 : next;
        });
        return 'column';
      }
      return prevPhase;
    });
  }, [rowCount, autoPauseCycles, activeRow, grid]);

  // Kick / stop the interval based on running flag + rate changes. If the
  // user drags the speed slider mid-scan, we tear the old ticker down and
  // start a fresh one so the new rate is picked up immediately.
  useEffect(() => {
    clearTicker();
    if (!running) return;
    if (rowCount === 0 && phase !== 'idle') {
      // Grid emptied — reset before starting the ticker so we don't index
      // into stale coordinates on the first tick.
      setPhase('idle');
      setActiveRow(null);
      setActiveColumn(null);
    }
    tickerRef.current = setInterval(advance, Math.max(100, Math.min(2000, scanRate)));
    return clearTicker;
  }, [running, scanRate, advance, clearTicker, rowCount, phase]);

  // When scanning is turned off entirely, drop all highlight state so a
  // stale ring doesn't linger on the board.
  useEffect(() => {
    if (!enabled) {
      clearTicker();
      setPhase('idle');
      setActiveRow(null);
      setActiveColumn(null);
      idleCyclesRef.current = 0;
    }
  }, [enabled, clearTicker]);

  // Suspend when the app backgrounds — no reason to tick a highlight the
  // user cannot see, and it saves battery. Resume on return to foreground
  // in the same phase we left off in.
  useEffect(() => {
    if (!enabled) return;
    const sub = RNAppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        clearTicker();
      } else if (running) {
        // Restart ticker on the next JS frame — waiting for interactions
        // to settle avoids fighting expo-router's navigation animation.
        InteractionManager.runAfterInteractions(() => {
          clearTicker();
          tickerRef.current = setInterval(advance, Math.max(100, Math.min(2000, scanRate)));
        });
      }
    });
    return () => sub.remove();
  }, [enabled, running, advance, scanRate, clearTicker]);

  // Selection handler — invoke the highlighted target's callback, guard
  // against thrown errors so a bad tile handler cannot crash the scanner.
  const performSelect = useCallback(() => {
    if (phase === 'row') {
      if (activeRow == null) return;
      const row = grid[activeRow];
      if (!row || row.length === 0) return;
      idleCyclesRef.current = 0;
      setActiveColumn(0);
      setPhase('column');
      return;
    }
    if (phase === 'column' && activeRow != null && activeColumn != null) {
      const row = grid[activeRow];
      const tile = row ? row[activeColumn] : undefined;
      if (tile) {
        try {
          tile.onSelect();
        } catch (err) {
          // Never let a caller's onSelect implementation take the scanner
          // down — a broken tile still needs to be scannable next tick.
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.warn('[ScanningController] tile.onSelect threw', err);
          }
        }
      }
      idleCyclesRef.current = 0;
      setActiveRow(0);
      setActiveColumn(null);
      setPhase('row');
      return;
    }
    if (phase === 'idle' || phase === 'paused') {
      idleCyclesRef.current = 0;
      setActiveRow(0);
      setActiveColumn(null);
      setPhase('row');
    }
  }, [phase, activeRow, activeColumn, grid]);

  const dispatchInput = useCallback(
    (action: ScanInputAction) => {
      if (!enabled) return;
      switch (action) {
        case 'advance':
          idleCyclesRef.current = 0;
          if (phase === 'paused') {
            setPhase('row');
            setActiveRow(0);
            setActiveColumn(null);
            return;
          }
          advance();
          return;
        case 'select':
          performSelect();
          return;
        case 'pause':
          clearTicker();
          setPhase('paused');
          return;
        case 'resume':
          idleCyclesRef.current = 0;
          setPhase((p) => (p === 'paused' ? 'row' : p));
          return;
        case 'reset':
          idleCyclesRef.current = 0;
          setActiveRow(0);
          setActiveColumn(null);
          setPhase('row');
          return;
        default:
          return;
      }
    },
    [enabled, phase, advance, performSelect, clearTicker],
  );

  const pause = useCallback(() => dispatchInput('pause'), [dispatchInput]);
  const resume = useCallback(() => dispatchInput('resume'), [dispatchInput]);
  const reset = useCallback(() => dispatchInput('reset'), [dispatchInput]);

  const registerTarget = useCallback((target: ScanTarget) => {
    if (!target || typeof target.id !== 'string' || target.id.length === 0) {
      // Malformed registration — silently no-op rather than throwing into
      // whatever component is mounting. Return a no-op unregister so
      // callers using it in useEffect don't blow up on cleanup.
      return () => undefined;
    }
    targetsRef.current.set(target.id, target);
    setTargetsVersion((v) => v + 1);
    return () => {
      const existing = targetsRef.current.get(target.id);
      // Only remove if the same registration is still present — a stale
      // cleanup from a previous mount must not clobber a fresh registration
      // that reused the same ID.
      if (existing === target) {
        targetsRef.current.delete(target.id);
        setTargetsVersion((v) => v + 1);
      }
    };
  }, []);

  const activeTargetId = useMemo(() => {
    if (phase !== 'column') return null;
    if (activeRow == null || activeColumn == null) return null;
    const row = grid[activeRow];
    if (!row) return null;
    const tile = row[activeColumn];
    return tile ? tile.id : null;
  }, [phase, activeRow, activeColumn, grid]);

  const value = useMemo<ScanningContextValue>(
    () => ({
      enabled,
      running,
      phase,
      activeRow,
      activeColumn,
      activeTargetId,
      registerTarget,
      dispatchInput,
      pause,
      resume,
      reset,
      rowCount,
      columnCount,
    }),
    [
      enabled,
      running,
      phase,
      activeRow,
      activeColumn,
      activeTargetId,
      registerTarget,
      dispatchInput,
      pause,
      resume,
      reset,
      rowCount,
      columnCount,
    ],
  );

  return <ScanningContext.Provider value={value}>{children}</ScanningContext.Provider>;
}

/**
 * Consumer hook. Returns null when called outside the provider so touch-only
 * screens don't have to conditionally render — they just get a stable null
 * and skip highlight rendering.
 */
export function useScanning(): ScanningContextValue | null {
  return useContext(ScanningContext);
}

/**
 * Convenience hook — register a scan target for the lifetime of the caller.
 * `deps` controls when the registration updates; pass the tile ID plus any
 * data that changes what `onSelect` should do.
 */
export function useScanTarget(target: ScanTarget | null, deps: React.DependencyList): void {
  const ctx = useContext(ScanningContext);
  useEffect(() => {
    if (!ctx || !target) return;
    const unregister = ctx.registerTarget(target);
    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
