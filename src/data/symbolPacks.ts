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
  folder('singles', 'Singles', 'mulberry_good_eluzd6', [
    sym('Yes', 'mulberry_good_eluzd6', 'interjection', 'yes'),
    sym('No', 'mulberry_bad_12s0dym', 'interjection', 'no'),
    sym('More', 'mulberry_more_1r3s2f0', 'adjective', 'more'),
    sym('Want', 'mulberry_want_16yheia', 'verb', 'want'),
    sym('Help', 'mulberry_help_1g1ppr', 'verb', 'help'),
    sym('Hello', 'mulberry_hello_1jyrbjf', 'social', 'hello'),
    sym('Wait', 'mulberry_wait_17bhqut', 'verb', 'wait'),
    sym('Good', 'mulberry_good_eluzd6', 'adjective', 'good'),
    sym('Bad', 'mulberry_bad_12s0dym', 'adjective', 'bad'),
    sym('Finished', 'mulberry_finish_1kq32d6', 'adjective', 'finished'),
  ]),
  folder('responses', 'Responses', 'mulberry_good_eluzd6', [
    sym('Yes', 'mulberry_good_eluzd6', 'interjection', 'yes'),
    sym('No', 'mulberry_bad_12s0dym', 'interjection', 'no'),
    sym('More', 'mulberry_more_1r3s2f0', 'adjective', 'more'),
    sym('Good', 'mulberry_good_eluzd6', 'adjective', 'good'),
    sym('Bad', 'mulberry_bad_12s0dym', 'adjective', 'bad'),
    sym('Finished', 'mulberry_finish_1kq32d6', 'adjective', 'finished'),
  ]),
  folder('feelings', 'Feelings', 'mulberry_happy_man_d75g78', [
    folder('feelings-happy', 'Happy', 'mulberry_happy_man_d75g78', [
      sym('Happy', 'mulberry_happy_man_d75g78', 'emotion', 'happy'),
      sym('Excited', 'mulberry_excited_man_5aqbg6', 'emotion', 'excited'),
    ]),
    folder('feelings-sad', 'Sad', 'mulberry_sad_man_1xt7bsy', [
      sym('Sad', 'mulberry_sad_man_1xt7bsy', 'emotion', 'sad'),
      sym('Worried', 'mulberry_worried_man_fzvxd0', 'emotion', 'worried'),
    ]),
    folder('feelings-angry', 'Upset', 'mulberry_angry_man_1g31prr', [
      sym('Angry', 'mulberry_angry_man_1g31prr', 'emotion', 'angry'),
      sym('Afraid', 'mulberry_afraid_man_6i29yl', 'emotion', 'afraid'),
    ]),
  ]),
  folder('actions', 'Actions', 'mulberry_run_1l6fpg7', [
    folder('actions-move', 'Movement', 'mulberry_walk_usrwun', [
      sym('Run', 'mulberry_run_1l6fpg7', 'verb', 'run'),
      sym('Walk', 'mulberry_walk_usrwun', 'verb', 'walk'),
      sym('Jump', 'mulberry_jump_apgvlo', 'verb', 'jump'),
      sym('Sit', 'mulberry_sit_1aksru8', 'verb', 'sit'),
      sym('Swim', 'mulberry_swim_1konnmm', 'verb', 'swim'),
    ]),
    folder('actions-daily', 'Daily', 'mulberry_eat_18rupbi', [
      sym('Eat', 'mulberry_eat_18rupbi', 'verb', 'eat'),
      sym('Drink', 'mulberry_drink_16zxzpv', 'verb', 'drink'),
      sym('Sleep', 'mulberry_sleep_male_1s97unf', 'verb', 'sleep'),
      sym('Wash', 'mulberry_wash_hands_zcbt6k', 'verb', 'wash hands'),
      sym('Play', 'mulberry_play_juloe2', 'verb', 'play'),
    ]),
  ]),
  folder('people', 'People', 'mulberry_family_excv0f', [
    sym('Mum', 'mulberry_mum_parent_36g4lb', 'noun', 'mum'),
    sym('Dad', 'mulberry_dad_parent_1u2b52j', 'noun', 'dad'),
    sym('Teacher', 'mulberry_teacher_1a_6kba0a', 'noun', 'teacher'),
    sym('Doctor', 'mulberry_doctor_1a_lcuwh3', 'noun', 'doctor'),
    sym('Family', 'mulberry_family_excv0f', 'noun', 'family'),
  ]),
  folder('places', 'Places', 'mulberry_house_1ice1xp', [
    folder('places-home', 'Home', 'mulberry_house_1ice1xp', [
      sym('House', 'mulberry_house_1ice1xp', 'noun', 'house'),
      sym('Bed', 'mulberry_bed_four_poster_gdyxt7', 'noun', 'bed'),
      sym('Kitchen', 'mulberry_cooker_vil7sm', 'noun', 'kitchen'),
      sym('Toilet', 'mulberry_toilet_1t82u6e', 'noun', 'toilet'),
    ]),
    folder('places-community', 'Community', 'mulberry_school_7v1fml', [
      sym('School', 'mulberry_school_7v1fml', 'noun', 'school'),
      sym('Shop', 'mulberry_shop_8euq19', 'noun', 'shop'),
      sym('Park', 'mulberry_park_18ux2ty', 'noun', 'park'),
      sym('Beach', 'mulberry_beach_drxxqc', 'noun', 'beach'),
    ]),
  ]),
  folder('transport', 'Transport', 'mulberry_car_1m0ff95', [
    sym('Car', 'mulberry_car_1m0ff95', 'noun', 'car'),
    sym('Bus', 'mulberry_bus_1abvtwt', 'noun', 'bus'),
    sym('Train', 'mulberry_train_6zo4kp', 'noun', 'train'),
    sym('Plane', 'mulberry_plane_1pir8pr', 'noun', 'plane'),
  ]),
  folder('food', 'Food', 'mulberry_food_atkyaz', [
    folder('food-fruits', 'Fruits', 'mulberry_apple_1ogqpa9', [
      sym('Apple', 'mulberry_apple_1ogqpa9', 'noun', 'apple'),
      sym('Banana', 'mulberry_banana_rcoei', 'noun', 'banana'),
      sym('Orange', 'mulberry_orange_tfdxfd', 'noun', 'orange'),
    ]),
    folder('food-meals', 'Meals', 'mulberry_pizza_rdymwh', [
      sym('Pizza', 'mulberry_pizza_rdymwh', 'noun', 'pizza'),
      sym('Bread', 'mulberry_bread_t6g6ux', 'noun', 'bread'),
      sym('Chicken', 'mulberry_chicken_live_2os875', 'noun', 'chicken'),
    ]),
    folder('food-drinks', 'Drinks', 'mulberry_water_139tuvw', [
      sym('Water', 'mulberry_water_139tuvw', 'noun', 'water'),
      sym('Milk', 'mulberry_milk_1pcjn1m', 'noun', 'milk'),
      sym('Juice', 'mulberry_orange_juice_vav8xi', 'noun', 'juice'),
    ]),
  ]),
  folder('animals', 'Animals', 'mulberry_dog_1bfmoh1', [
    sym('Dog', 'mulberry_dog_1bfmoh1', 'noun', 'dog'),
    sym('Cat', 'mulberry_cat_1lz3nun', 'noun', 'cat'),
    sym('Bird', 'mulberry_bird_13ztxas', 'noun', 'bird'),
    sym('Horse', 'mulberry_horse_c0o22y', 'noun', 'horse'),
    sym('Fish', 'mulberry_fish_1u95ovx', 'noun', 'fish'),
  ]),
  folder('health', 'Health', 'mulberry_doctor_1a_lcuwh3', [
    sym('Doctor', 'mulberry_doctor_1a_lcuwh3', 'noun', 'doctor'),
    sym('Hospital', 'mulberry_porter_hospital_1a_vgfxj7', 'noun', 'hospital'),
    sym('Medicine', 'mulberry_medicine_14fp0lp', 'noun', 'medicine'),
    sym('Pain', 'mulberry_stomach_ache_16rpjjq', 'noun', 'pain'),
  ]),
  folder('safety', 'Safety', 'mulberry_help_1g1ppr', [
    sym('Help', 'mulberry_help_1g1ppr', 'verb', 'help'),
    sym('AAC', 'mulberry_communication_device_m2l9ji', 'phrase', 'I use A A C to communicate'),
    sym('Fire', 'mulberry_fire_1q1gv9t', 'noun', 'fire'),
    sym('Police', 'mulberry_police_1a_142d3y2', 'noun', 'police'),
  ]),
  folder('school', 'School', 'mulberry_school_7v1fml', [
    sym('School', 'mulberry_school_7v1fml', 'noun', 'school'),
    sym('Book', 'mulberry_read_book_nw97ne', 'noun', 'book'),
    sym('Write', 'mulberry_write_17xcc0z', 'verb', 'write'),
    sym('Read', 'mulberry_read_1gmx20c', 'verb', 'read'),
    sym('Teacher', 'mulberry_teacher_1a_6kba0a', 'noun', 'teacher'),
  ]),
  folder('activities', 'Activities', 'mulberry_play_juloe2', [
    sym('Play', 'mulberry_play_juloe2', 'verb', 'play'),
    sym('Draw', 'mulberry_draw_19hlq66', 'verb', 'draw'),
    sym('Sing', 'mulberry_sing_v5z66l', 'verb', 'sing'),
    sym('Dance', 'mulberry_dance_rdll6b', 'verb', 'dance'),
    sym('Swim', 'mulberry_swim_1konnmm', 'verb', 'swim'),
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
