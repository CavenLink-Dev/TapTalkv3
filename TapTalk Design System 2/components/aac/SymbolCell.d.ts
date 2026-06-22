import * as React from 'react';

export type WordType =
  | 'conjunction' | 'noun' | 'pronoun' | 'verb' | 'adjective'
  | 'preposition' | 'negation' | 'question' | 'social'
  | 'article' | 'interjection' | 'folder';

export interface SymbolCellProps {
  /** Word shown on the cell (also the accessible label). */
  label: string;
  /** Word-type colour (Fitzgerald key). @default 'noun' */
  tone?: WordType;
  /** Emoji / character symbol (used when no image). */
  symbol?: string;
  /** Resolved URL to a real AAC symbol PNG (overrides symbol). */
  image?: string;
  /** Layout kind. @default 'word' */
  kind?: 'word' | 'folder' | 'article' | 'question';
  /** Square cell size in px. @default 76 */
  size?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Colour-coded AAC symbol tile for the Talk board. Tap to add the word to the
 * sentence strip. Folders open sub-boards. The core building block of TapTalk.
 */
export function SymbolCell(props: SymbolCellProps): JSX.Element;
