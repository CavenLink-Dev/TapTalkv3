export type HealthSeverity = 'warning' | 'suggestion';

export interface BoardIssue {
  id: string;
  severity: HealthSeverity;
  message: string;
  boardMode: string;
  tileId?: string;
}

interface HealthTile {
  id: string;
  label: string;
  color: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const sr = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const sg = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const sb = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  return 0.2126 * sr + 0.7152 * sg + 0.0722 * sb;
}

function contrastRatio(hex1: string, hex2: string): number | null {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return null;
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const MIN_CONTRAST = 4.5;
const MAX_TILES_SUGGESTION = 20;

export function checkBoardHealth(
  boardMode: string,
  tiles: HealthTile[],
  hiddenTileIds: string[],
  textColor: string
): BoardIssue[] {
  const issues: BoardIssue[] = [];
  const visibleTiles = tiles.filter(t => !hiddenTileIds.includes(t.id));

  // 1. Contrast check (visible tiles only)
  visibleTiles.forEach(tile => {
    const ratio = contrastRatio(tile.color, textColor);
    if (ratio !== null && ratio < MIN_CONTRAST) {
      issues.push({
        id: `contrast-${boardMode}-${tile.id}`,
        severity: 'warning',
        message: `Low contrast on "${tile.label}" (${ratio.toFixed(1)}:1)`,
        boardMode,
        tileId: tile.id,
      });
    }
  });

  // 2. Duplicate labels (all tiles)
  const labelCounts: Record<string, string[]> = {};
  tiles.forEach(tile => {
    let list = labelCounts[tile.label];
    if (!list) {
      list = [];
      labelCounts[tile.label] = list;
    }
    list.push(tile.id);
  });
  Object.entries(labelCounts).forEach(([label, ids]) => {
    if (ids.length > 1) {
      issues.push({
        id: `duplicate-${boardMode}-${label}`,
        severity: 'warning',
        message: `Duplicate label "${label}" on ${ids.length} tiles`,
        boardMode,
      });
    }
  });

  // 3. Missing labels (visible tiles)
  visibleTiles.forEach(tile => {
    if (!tile.label || tile.label.trim().length === 0) {
      issues.push({
        id: `a11y-${boardMode}-${tile.id}`,
        severity: 'warning',
        message: `Missing label on tile`,
        boardMode,
        tileId: tile.id,
      });
    }
  });

  // 4. Density (visible tiles)
  if (visibleTiles.length > MAX_TILES_SUGGESTION) {
    issues.push({
      id: `density-${boardMode}`,
      severity: 'suggestion',
      message: `Board has ${visibleTiles.length} visible tiles — consider splitting into folders`,
      boardMode,
    });
  }

  return issues;
}

export function checkAllBoards(
  boards: Record<string, HealthTile[]>,
  hiddenTileIds: string[],
  textColor: string
): BoardIssue[] {
  const allIssues: BoardIssue[] = [];
  Object.entries(boards).forEach(([mode, tiles]) => {
    if (!tiles) return;
    allIssues.push(...checkBoardHealth(mode, tiles, hiddenTileIds, textColor));
  });
  return allIssues;
}
