/**
 * Curated Symbol Pack tree — prebuilt folders of Mulberry symbols for the
 * Add Symbol browse flow. Folders can nest; leaf nodes are symbol references
 * (IDs only — no duplicated assets). All symbolId values exist in
 * mulberryAssetMap.generated.ts.
 */

export type SymbolPackSymbol = {
  type: 'symbol';
  label: string;
  symbolId: string;
  wordType?: string;
  speech?: string;
};

export type SymbolPackFolder = {
  type: 'folder';
  id: string;
  label: string;
  iconId?: string;
  children: SymbolPackNode[];
};

export type SymbolPackNode = SymbolPackSymbol | SymbolPackFolder;

function sym(
  label: string,
  symbolId: string,
  wordType?: string,
  speech?: string,
): SymbolPackSymbol {
  return { type: 'symbol', label, symbolId, wordType, speech };
}

function folder(
  id: string,
  label: string,
  iconId: string | undefined,
  children: SymbolPackNode[],
): SymbolPackFolder {
  return { type: 'folder', id, label, iconId, children };
}

/** Top-level Symbol Pack folders shown at the browse root. */
export const SYMBOL_PACK_ROOT: SymbolPackFolder[] = [
  folder('core', 'Core', 'mulberry_good_eluzd6', [
    sym('Yes', 'mulberry_good_eluzd6', 'interjection', 'yes'),
    sym('No', 'mulberry_bad_12s0dym', 'interjection', 'no'),
    sym('More', 'mulberry_more_1r3s2f0', 'adjective', 'more'),
    sym('Want', 'mulberry_want_16yheia', 'verb', 'want'),
    sym('Help', 'mulberry_help_1g1ppr', 'verb', 'help'),
    sym('Hello', 'mulberry_hello_1jyrbjf', 'social', 'hello'),
  ]),
  folder('feelings', 'Feelings', 'mulberry_happy_man_d75g78', [
    sym('Happy', 'mulberry_happy_man_d75g78', 'emotion', 'happy'),
    sym('Sad', 'mulberry_sad_man_1xt7bsy', 'emotion', 'sad'),
    sym('Angry', 'mulberry_angry_man_1g31prr', 'emotion', 'angry'),
    sym('Worried', 'mulberry_worried_man_fzvxd0', 'emotion', 'worried'),
  ]),
  folder('food', 'Food', 'mulberry_food_atkyaz', [
    sym('Apple', 'mulberry_apple_1ogqpa9', 'noun', 'apple'),
    sym('Bread', 'mulberry_bread_t6g6ux', 'noun', 'bread'),
    sym('Water', 'mulberry_water_139tuvw', 'noun', 'water'),
    sym('Pizza', 'mulberry_pizza_rdymwh', 'noun', 'pizza'),
  ]),
  folder('activities', 'Activities', 'mulberry_play_juloe2', [
    sym('Play', 'mulberry_play_juloe2', 'verb', 'play'),
    sym('Draw', 'mulberry_draw_19hlq66', 'verb', 'draw'),
    sym('Swim', 'mulberry_swim_1konnmm', 'verb', 'swim'),
    sym('Dance', 'mulberry_dance_rdll6b', 'verb', 'dance'),
  ]),
];

/** Walk the pack tree by folder id path segments (empty = root). */
export function resolvePackFolder(folderPath: string[]): SymbolPackFolder | null {
  if (folderPath.length === 0) return null;
  let nodes: SymbolPackNode[] = SYMBOL_PACK_ROOT;
  let current: SymbolPackFolder | null = null;
  for (const segment of folderPath) {
    const next = nodes.find(
      (n): n is SymbolPackFolder => n.type === 'folder' && n.id === segment,
    );
    if (!next) return null;
    current = next;
    nodes = next.children;
  }
  return current;
}

export function folderChildCount(node: SymbolPackFolder): { folders: number; symbols: number } {
  let folders = 0;
  let symbols = 0;
  for (const child of node.children) {
    if (child.type === 'folder') folders += 1;
    else symbols += 1;
  }
  return { folders, symbols };
}

export function packFolderSubtitle(node: SymbolPackFolder): string {
  const { folders, symbols } = folderChildCount(node);
  const parts: string[] = [];
  if (folders > 0) parts.push(folders === 1 ? '1 folder' : `${folders} folders`);
  if (symbols > 0) parts.push(symbols === 1 ? '1 symbol' : `${symbols} symbols`);
  return parts.join(', ') || 'Empty';
}
