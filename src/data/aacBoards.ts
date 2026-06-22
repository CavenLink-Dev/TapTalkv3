/**
 * AAC core word board data — Fitzgerald Key colour coded.
 *
 * Layout: each board renders as a 5-column grid. Folder cells navigate to a
 * sub-board with the same `id` defined below.
 *
 * Word-type taxonomy maps directly to `symbolColors` in `src/theme/tokens.ts`,
 * so each cell's colour is sourced from the same Figma variables that drive
 * the rest of the design system.
 */

import { symbolColors } from '../theme/tokens';

export type WordType =
  | 'pronoun'
  | 'verb'
  | 'adjective'
  | 'preposition'
  | 'question'
  | 'negation'
  | 'social'
  | 'article'
  | 'conjunction'
  | 'interjection'
  | 'noun'
  | 'folder';

export type CellKind = 'word' | 'folder';

export interface AACCell {
  id:        string;
  label:     string;
  /** Optional emoji glyph shown alongside the label. */
  emoji?:    string;
  wordType:  WordType;
  kind:      CellKind;
  /** When `kind === 'folder'`, the id of the board to open. */
  targetId?: string;
}

export interface AACBoard {
  id:    string;
  title: string;
  cells: AACCell[];
}

/** Map a word-type to its Fitzgerald-key background colour. */
export function colourFor(type: WordType): string {
  switch (type) {
    case 'pronoun':      return symbolColors.pronoun;
    case 'verb':         return symbolColors.verb;
    case 'adjective':    return symbolColors.adjective;
    case 'preposition':  return symbolColors.preposition;
    case 'question':     return symbolColors.question;
    case 'negation':     return symbolColors.negation;
    case 'social':       return symbolColors.social;
    case 'article':      return symbolColors.article;
    case 'conjunction':  return symbolColors.conjunction;
    case 'interjection': return symbolColors.interjection;
    case 'noun':         return symbolColors.noun;
    case 'folder':       return symbolColors.folder;
  }
}

// ─── Cell builders ────────────────────────────────────────────────────────────

const w = (id: string, label: string, wordType: WordType, emoji?: string): AACCell => ({
  id, label, wordType, kind: 'word', emoji,
});

const folder = (id: string, label: string, targetId: string, emoji = '📁'): AACCell => ({
  id, label, wordType: 'folder', kind: 'folder', targetId, emoji,
});

// ─── MAIN BOARD ───────────────────────────────────────────────────────────────
// 5 cols × 11 rows = 55 cells, Fitzgerald-ordered.

const main: AACBoard = {
  id: 'main',
  title: 'Main',
  cells: [
    // Row 1 — pronouns
    w('p-i',     'I',     'pronoun', '🧍'),
    w('p-you',   'you',   'pronoun', '👉'),
    w('p-he',    'he',    'pronoun', '👨'),
    w('p-she',   'she',   'pronoun', '👩'),
    w('p-we',    'we',    'pronoun', '👥'),
    // Row 2 — pronouns
    w('p-it',    'it',    'pronoun', '🔲'),
    w('p-this',  'this',  'pronoun', '👆'),
    w('p-that',  'that',  'pronoun', '👇'),
    w('p-they',  'they',  'pronoun', '👫'),
    w('p-them',  'them',  'pronoun', '👤'),
    // Row 3 — verbs
    w('v-want',  'want',  'verb', '🤲'),
    w('v-like',  'like',  'verb', '👍'),
    w('v-need',  'need',  'verb', '🙏'),
    w('v-go',    'go',    'verb', '➡️'),
    w('v-come',  'come',  'verb', '⬅️'),
    // Row 4 — verbs
    w('v-see',   'see',   'verb', '👁️'),
    w('v-do',    'do',    'verb', '✋'),
    w('v-help',  'help',  'verb', '🆘'),
    w('v-play',  'play',  'verb', '🎮'),
    w('v-eat',   'eat',   'verb', '🍽️'),
    // Row 5 — verbs + qualifier
    w('v-make',  'make',  'verb', '🛠️'),
    w('v-look',  'look',  'verb', '🔎'),
    w('a-more',  'more',  'adjective', '➕'),
    w('a-done',  'all done', 'adjective', '✅'),
    w('a-good',  'good',  'adjective', '😊'),
    // Row 6 — adjectives + negation
    w('a-bad',   'bad',   'adjective', '😞'),
    w('a-big',   'big',   'adjective', '🟦'),
    w('a-little','little','adjective', '▫️'),
    w('a-hot',   'hot',   'adjective', '🔥'),
    w('n-not',   'not',   'negation', '🚫'),
    // Row 7 — prepositions
    w('pr-in',   'in',    'preposition', '📥'),
    w('pr-on',   'on',    'preposition', '🔼'),
    w('pr-to',   'to',    'preposition', '🎯'),
    w('pr-with', 'with',  'preposition', '🤝'),
    w('pr-out',  'out',   'preposition', '📤'),
    // Row 8 — questions
    w('q-what',  'what',  'question', '❓'),
    w('q-where', 'where', 'question', '📍'),
    w('q-who',   'who',   'question', '🧑'),
    w('q-why',   'why',   'question', '💭'),
    w('q-how',   'how',   'question', '🛠️'),
    // Row 9 — social + interjection
    w('s-yes',   'yes',   'social', '👍'),
    w('s-no',    'no',    'social', '👎'),
    w('s-please','please','social', '🙇'),
    w('s-thanks','thanks','social', '🙏'),
    w('i-stop',  'stop',  'interjection', '🛑'),
    // Row 10 — articles + conjunctions
    w('ar-the',  'the',   'article', ''),
    w('ar-a',    'a',     'article', ''),
    w('c-and',   'and',   'conjunction', '➕'),
    w('c-but',   'but',   'conjunction', '↩️'),
    w('c-or',    'or',    'conjunction', '↔️'),
    // Row 11 — extra useful words
    w('x-here',  'here',  'preposition', '📍'),
    w('x-there', 'there', 'preposition', '👉'),
    w('x-up',    'up',    'preposition', '⬆️'),
    w('x-down',  'down',  'preposition', '⬇️'),
    w('x-mine',  'mine',  'pronoun', '🙋'),
  ],
};

// ─── SUB-BOARDS — concise vocabulary grouped by category ──────────────────────

const actions: AACBoard = {
  id: 'actions',
  title: 'Actions',
  cells: [
    w('ac-run',   'run',   'verb', '🏃'),
    w('ac-walk',  'walk',  'verb', '🚶'),
    w('ac-jump',  'jump',  'verb', '🤸'),
    w('ac-sit',   'sit',   'verb', '🪑'),
    w('ac-stand', 'stand', 'verb', '🧍'),
    w('ac-drink', 'drink', 'verb', '🥤'),
    w('ac-sleep', 'sleep', 'verb', '😴'),
    w('ac-read',  'read',  'verb', '📖'),
    w('ac-write', 'write', 'verb', '✍️'),
    w('ac-draw',  'draw',  'verb', '🎨'),
    w('ac-sing',  'sing',  'verb', '🎤'),
    w('ac-dance', 'dance', 'verb', '💃'),
    w('ac-wash',  'wash',  'verb', '🧼'),
    w('ac-open',  'open',  'verb', '📂'),
    w('ac-close', 'close', 'verb', '🔒'),
  ],
};

const feelings: AACBoard = {
  id: 'feelings',
  title: 'Feelings',
  cells: [
    w('fe-happy',   'happy',   'adjective', '😊'),
    w('fe-sad',     'sad',     'adjective', '😢'),
    w('fe-angry',   'angry',   'adjective', '😠'),
    w('fe-tired',   'tired',   'adjective', '😴'),
    w('fe-excited', 'excited', 'adjective', '🤩'),
    w('fe-scared',  'scared',  'adjective', '😨'),
    w('fe-sick',    'sick',    'adjective', '🤒'),
    w('fe-hungry',  'hungry',  'adjective', '🍽️'),
    w('fe-thirsty', 'thirsty', 'adjective', '💧'),
    w('fe-bored',   'bored',   'adjective', '😑'),
    w('fe-calm',    'calm',    'adjective', '😌'),
    w('fe-proud',   'proud',   'adjective', '😎'),
    w('fe-loved',   'loved',   'adjective', '🥰'),
    w('fe-nervous', 'nervous', 'adjective', '😬'),
    w('fe-ok',      'ok',      'adjective', '👌'),
  ],
};

const food: AACBoard = {
  id: 'food',
  title: 'Food',
  cells: [
    w('fo-water',   'water',   'noun', '💧'),
    w('fo-milk',    'milk',    'noun', '🥛'),
    w('fo-juice',   'juice',   'noun', '🧃'),
    w('fo-bread',   'bread',   'noun', '🍞'),
    w('fo-apple',   'apple',   'noun', '🍎'),
    w('fo-banana',  'banana',  'noun', '🍌'),
    w('fo-pasta',   'pasta',   'noun', '🍝'),
    w('fo-pizza',   'pizza',   'noun', '🍕'),
    w('fo-rice',    'rice',    'noun', '🍚'),
    w('fo-egg',     'egg',     'noun', '🥚'),
    w('fo-chicken', 'chicken', 'noun', '🍗'),
    w('fo-fish',    'fish',    'noun', '🐟'),
    w('fo-cookie',  'cookie',  'noun', '🍪'),
    w('fo-icecream','ice cream','noun', '🍦'),
    w('fo-snack',   'snack',   'noun', '🥨'),
  ],
};

const social: AACBoard = {
  id: 'social',
  title: 'Social',
  cells: [
    w('so-hello',      'hello',         'social', '👋'),
    w('so-bye',        'bye',           'social', '👋'),
    w('so-please',     'please',        'social', '🙇'),
    w('so-thanks',     'thank you',     'social', '🙏'),
    w('so-sorry',      'sorry',         'social', '😔'),
    w('so-yes',        'yes',           'social', '👍'),
    w('so-no',         'no',            'social', '👎'),
    w('so-ok',         'okay',          'social', '👌'),
    w('so-how',        'how are you',   'social', '❓'),
    w('so-good',       "I'm good",      'social', '😊'),
    w('so-help',       'I need help',   'social', '🆘'),
    w('so-love',       'I love you',    'social', '❤️'),
    w('so-friend',     'be my friend',  'social', '🤝'),
    w('so-myname',     'my name is',    'social', '🪪'),
    w('so-nicemeet',   'nice to meet',  'social', '🌟'),
  ],
};

// ─── Board registry ───────────────────────────────────────────────────────────

export const BOARDS: Record<string, AACBoard> = {
  main,
  actions,
  feelings,
  food,
  social,
};

/** Categories shown in the pill row, in display order. */
export const CATEGORY_ORDER: { id: string; label: string }[] = [
  { id: 'main',     label: 'Main' },
  { id: 'actions',  label: 'Actions' },
  { id: 'feelings', label: 'Feelings' },
  { id: 'food',     label: 'Food' },
  { id: 'social',   label: 'Social' },
];

export const HOME_BOARD_ID = 'main';
