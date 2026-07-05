/**
 * Symbol Packs — ready-made category folders the user can drop onto a board
 * from the Add flow (+ → Pack). Each pack becomes a folder tile whose child
 * board is pre-filled with one-word tiles. Symbols are auto-resolved from the
 * label by the board's symbol resolver, so packs only carry labels + a word
 * type (which drives the Fitzgerald tile colour). Speech = the label.
 *
 * Temporary demo set. Keep labels ONE word (board rule); anything longer
 * belongs in speech, not on a tile.
 */

export type PackWordType = 'noun' | 'verb' | 'adjective' | 'social' | 'interjection';

export interface SymbolPack {
  id: string;
  name: string;      // folder label (one/two words)
  wordType: PackWordType; // default type → colour for the pack's tiles
  words: string[];   // one-word tile labels
}

export const SYMBOL_PACKS: SymbolPack[] = [
  { id: 'core', name: 'Core', wordType: 'verb', words: ['Yes', 'No', 'More', 'Want', 'Help', 'Hello'] },
  { id: 'feelings', name: 'Feelings', wordType: 'adjective', words: ['Happy', 'Sad', 'Angry', 'Worried'] },
  { id: 'food', name: 'Food', wordType: 'noun', words: ['Apple', 'Bread', 'Water', 'Pizza'] },
  { id: 'activities', name: 'Activities', wordType: 'verb', words: ['Play', 'Draw', 'Swim', 'Dance'] },
];
