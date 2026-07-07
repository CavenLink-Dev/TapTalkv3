/**
 * Low-tech backup: render the current vocabulary to a printable PDF.
 * The device may die; the printed page still communicates.
 *
 *   const uri = await exportBoardPdf(tiles, { title: 'Ella — TapTalk' });
 *   await Sharing.shareAsync(uri);
 *
 * Requires expo-print + expo-sharing (already in the Expo SDK 54 tree).
 */
import * as Print from 'expo-print';
import type { BoardTile } from './types';

type Options = {
  title?: string;
  columns?: number;
};

export async function exportBoardPdf(
  tiles: BoardTile[],
  { title = 'TapTalk vocabulary', columns = 4 }: Options = {},
): Promise<string> {
  const cells = tiles.map(renderCell).join('');
  const html = `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  @page { margin: 24px; }
  body  { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #202020; }
  h1    { font-size: 20pt; margin: 0 0 12px; }
  .grid { display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 8px; }
  .cell { border: 1px solid #cccccc; border-radius: 6px; padding: 10px; text-align: center; break-inside: avoid; }
  .label { font-size: 14pt; font-weight: 700; margin-bottom: 4px; }
  .meta  { font-size: 9pt; color: #666666; text-transform: uppercase; letter-spacing: 0.4px; }
</style></head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="grid">${cells}</div>
</body></html>`;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

function renderCell(t: BoardTile): string {
  const bg = escapeHtml(t.color || '#ffffff');
  return `<div class="cell" style="background:${bg}22;border-color:${bg}">
    <div class="label">${escapeHtml(t.label)}</div>
    ${t.wordType ? `<div class="meta">${escapeHtml(t.wordType)}</div>` : ''}
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );
}
