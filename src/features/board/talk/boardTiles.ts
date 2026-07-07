// Board tile data extracted from app/(tabs)/talk.tsx.
// The default vocabulary for each BoardMode plus small helpers for
// converting user-defined custom tiles into the board shape.

import type { CustomBoardTile } from '../../../context/types';
import type { BoardMode, BoardTile } from './types';
import {
  SYMBOL_BLUE,
  SYMBOL_GREEN,
  SYMBOL_ORANGE,
  SYMBOL_PURPLE,
  SYMBOL_RED,
  SYMBOL_YELLOW,
} from './constants';

export function boardTileFromCustomTile(tile: CustomBoardTile): BoardTile {
  const isFolder = tile.kind === 'folder';
  return {
    id: tile.id,
    label: tile.label,
    kind: isFolder ? 'folder' : 'word',
    target: isFolder ? (tile.target as BoardMode | undefined) : undefined,
    color: tile.color,
    speech: isFolder ? undefined : (tile.speech ?? tile.label),
    wordType: tile.wordType,
    mulberrySymbolId: tile.mulberrySymbolId,
    customImageUri: tile.customImageUri,
    backgroundOpacity: tile.backgroundOpacity,
    outlineColor: tile.outlineColor,
    outlineOpacity: tile.outlineOpacity,
  };
}

export function labelForBoardTile(label: string): string {
  const words = label.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
  return words[0] ?? 'Symbol';
}

// Mulberry symbols selected to match the existing tile labels. Asset-map
// IDs (production-quality bundled SVGs) are preferred; curated `name`
// fallbacks are used where the asset-map naming isn't a clean match.
export const HOME_TILES: BoardTile[] = [
  // Category folders + 50 home-grid words (56 tiles — scrolls on the default screen).
  { id: 'people', label: 'People', kind: 'folder', target: 'quick',   color: '#1DCDFF', mulberrySymbolId: 'mulberry_family_excv0f' },
  { id: 'foods',  label: 'Foods',  kind: 'folder', target: 'foods',   color: '#1DCDFF', mulberrySymbolId: 'mulberry_food_atkyaz' },
  { id: 'places', label: 'Places', kind: 'folder', target: 'places', color: '#1DCDFF', mulberrySymbolId: 'mulberry_house_1ice1xp' },
  { id: 'actions',label: 'Actions',kind: 'folder', target: 'tools',   color: '#1DCDFF', mulberrySymbolId: 'mulberry_run_1l6fpg7' },
  { id: 'feelings-folder', label: 'Feelings', kind: 'folder', target: 'feelings', color: '#1DCDFF', mulberrySymbolId: 'mulberry_happy_man_d75g78' },
  { id: 'emergency-folder', label: 'Help', kind: 'folder', target: 'emergency', color: '#1DCDFF', isProtected: true, mulberrySymbolId: 'mulberry_help_1g1ppr' },
  // Home-screen core words.
  { id: 'home-hello',   label: 'Hello',   kind: 'word', color: SYMBOL_GREEN,  speech: 'hello',   mulberrySymbolId: 'mulberry_hello_1jyrbjf',     wordType: 'social' },
  { id: 'home-mum',     label: 'Mum',     kind: 'word', color: SYMBOL_PURPLE, speech: 'mum',     mulberrySymbolId: 'mulberry_mum_parent_36g4lb', wordType: 'noun' },
  { id: 'home-dad',     label: 'Dad',     kind: 'word', color: SYMBOL_BLUE,   speech: 'dad',     mulberrySymbolId: 'mulberry_dad_parent_1u2b52j', wordType: 'noun' },
  { id: 'home-teacher', label: 'Teacher', kind: 'word', color: SYMBOL_ORANGE, speech: 'teacher', mulberrySymbolId: 'mulberry_teacher_1a_6kba0a', wordType: 'noun' },
  { id: 'home-good',    label: 'Good',    kind: 'word', color: SYMBOL_GREEN,  speech: 'good',    mulberrySymbolId: 'mulberry_good_eluzd6',       wordType: 'adjective' },
  { id: 'home-car',     label: 'Car',     kind: 'word', color: SYMBOL_YELLOW, speech: 'car',     mulberrySymbolId: 'mulberry_car_1m0ff95',       wordType: 'noun' },
  { id: 'home-apple',   label: 'Apple',   kind: 'word', color: SYMBOL_RED,    speech: 'apple',   mulberrySymbolId: 'mulberry_apple_1ogqpa9',     wordType: 'noun' },
  { id: 'home-pizza',   label: 'Pizza',   kind: 'word', color: SYMBOL_ORANGE, speech: 'pizza',   mulberrySymbolId: 'mulberry_pizza_rdymwh',      wordType: 'noun' },
  { id: 'home-cat',     label: 'Cat',     kind: 'word', color: SYMBOL_ORANGE, speech: 'cat',     mulberrySymbolId: 'mulberry_cat_1lz3nun',       wordType: 'noun' },
  { id: 'home-dog',     label: 'Dog',     kind: 'word', color: SYMBOL_GREEN,  speech: 'dog',     mulberrySymbolId: 'mulberry_dog_1bfmoh1',       wordType: 'noun' },
  { id: 'home-bus',     label: 'Bus',     kind: 'word', color: SYMBOL_YELLOW, speech: 'bus',     mulberrySymbolId: 'mulberry_bus_1abvtwt',       wordType: 'noun' },
  { id: 'home-book',    label: 'Book',    kind: 'word', color: SYMBOL_PURPLE, speech: 'book',    mulberrySymbolId: 'mulberry_read_book_nw97ne',  wordType: 'noun' },
  { id: 'home-fish',    label: 'Fish',    kind: 'word', color: SYMBOL_BLUE,   speech: 'fish',    mulberrySymbolId: 'mulberry_fish_1u95ovx',      wordType: 'noun' },
  { id: 'home-ice',     label: 'Icecream', kind: 'word', color: SYMBOL_YELLOW, speech: 'ice cream', mulberrySymbolId: 'mulberry_ice_cream_1lbnd6p', wordType: 'noun' },
  // Extra home-grid demo words.
  { id: 'home-bird',    label: 'Bird',    kind: 'word', color: SYMBOL_BLUE,   speech: 'bird',    mulberrySymbolId: 'mulberry_bird_13ztxas',       wordType: 'noun' },
  { id: 'home-rabbit',  label: 'Rabbit',  kind: 'word', color: SYMBOL_PURPLE, speech: 'rabbit',  mulberrySymbolId: 'mulberry_rabbit_sjorvr',      wordType: 'noun' },
  { id: 'home-horse',   label: 'Horse',   kind: 'word', color: SYMBOL_ORANGE, speech: 'horse',   mulberrySymbolId: 'mulberry_horse_c0o22y',       wordType: 'noun' },
  { id: 'home-cow',     label: 'Cow',     kind: 'word', color: SYMBOL_GREEN,  speech: 'cow',     mulberrySymbolId: 'mulberry_cow_1pwmwc2',        wordType: 'noun' },
  { id: 'home-sheep',   label: 'Sheep',   kind: 'word', color: SYMBOL_YELLOW, speech: 'sheep',   mulberrySymbolId: 'mulberry_sheep_k1gt9e',       wordType: 'noun' },
  { id: 'home-duck',    label: 'Duck',    kind: 'word', color: SYMBOL_GREEN,  speech: 'duck',    mulberrySymbolId: 'mulberry_duck_4lgl4g',        wordType: 'noun' },
  { id: 'home-bread',   label: 'Bread',   kind: 'word', color: SYMBOL_ORANGE, speech: 'bread',   mulberrySymbolId: 'mulberry_bread_t6g6ux',       wordType: 'noun' },
  { id: 'home-cheese',  label: 'Cheese',  kind: 'word', color: SYMBOL_YELLOW, speech: 'cheese',  mulberrySymbolId: 'mulberry_cheese_qsgfck',      wordType: 'noun' },
  { id: 'home-banana',  label: 'Banana',  kind: 'word', color: SYMBOL_YELLOW, speech: 'banana',  mulberrySymbolId: 'mulberry_banana_rcoei',       wordType: 'noun' },
  { id: 'home-milk',    label: 'Milk',    kind: 'word', color: SYMBOL_BLUE,   speech: 'milk',    mulberrySymbolId: 'mulberry_milk_1pcjn1m',       wordType: 'noun' },
  { id: 'home-water',   label: 'Water',   kind: 'word', color: SYMBOL_BLUE,   speech: 'water',   mulberrySymbolId: 'mulberry_water_139tuvw',      wordType: 'noun' },
  { id: 'home-orange',  label: 'Orange',  kind: 'word', color: SYMBOL_ORANGE, speech: 'orange',  mulberrySymbolId: 'mulberry_orange_tfdxfd',      wordType: 'noun' },
  { id: 'home-house',   label: 'House',   kind: 'word', color: SYMBOL_ORANGE, speech: 'house',   mulberrySymbolId: 'mulberry_house_1ice1xp',      wordType: 'noun' },
  { id: 'home-school',  label: 'School',  kind: 'word', color: SYMBOL_BLUE,   speech: 'school',  mulberrySymbolId: 'mulberry_school_7v1fml',      wordType: 'noun' },
  { id: 'home-park',    label: 'Park',    kind: 'word', color: SYMBOL_GREEN,  speech: 'park',    mulberrySymbolId: 'mulberry_park_18ux2ty',       wordType: 'noun' },
  { id: 'home-beach',   label: 'Beach',   kind: 'word', color: SYMBOL_YELLOW, speech: 'beach',   mulberrySymbolId: 'mulberry_beach_drxxqc',       wordType: 'noun' },
  { id: 'home-shop',    label: 'Shop',    kind: 'word', color: SYMBOL_GREEN,  speech: 'shop',    mulberrySymbolId: 'mulberry_shop_8euq19',        wordType: 'noun' },
  { id: 'home-train',   label: 'Train',   kind: 'word', color: SYMBOL_BLUE,   speech: 'train',   mulberrySymbolId: 'mulberry_train_6zo4kp',       wordType: 'noun' },
  { id: 'home-plane',   label: 'Plane',   kind: 'word', color: SYMBOL_BLUE,   speech: 'plane',   mulberrySymbolId: 'mulberry_plane_1pir8pr',      wordType: 'noun' },
  { id: 'home-toilet',  label: 'Toilet',  kind: 'word', color: SYMBOL_BLUE,   speech: 'toilet',  mulberrySymbolId: 'mulberry_toilet_1t82u6e',     wordType: 'noun' },
  { id: 'home-yes',     label: 'Yes',     kind: 'word', color: SYMBOL_GREEN,  speech: 'yes',     mulberryName: 'good',                          wordType: 'interjection' },
  { id: 'home-no',      label: 'No',      kind: 'word', color: SYMBOL_RED,    speech: 'no',      mulberryName: 'bad',                           wordType: 'interjection' },
  { id: 'home-want',    label: 'Want',    kind: 'word', color: SYMBOL_BLUE,   speech: 'want',    mulberrySymbolId: 'mulberry_want_16yheia',       wordType: 'verb' },
  { id: 'home-more',    label: 'More',    kind: 'word', color: SYMBOL_GREEN,  speech: 'more',    mulberrySymbolId: 'mulberry_more_1r3s2f0',       wordType: 'adjective' },
  { id: 'home-eat',     label: 'Eat',     kind: 'word', color: SYMBOL_ORANGE, speech: 'eat',     mulberrySymbolId: 'mulberry_eat_18rupbi',        wordType: 'verb' },
  { id: 'home-drink',   label: 'Drink',   kind: 'word', color: SYMBOL_PURPLE, speech: 'drink',   mulberrySymbolId: 'mulberry_drink_16zxzpv',      wordType: 'verb' },
  { id: 'home-run',     label: 'Run',     kind: 'word', color: SYMBOL_GREEN,  speech: 'run',     mulberrySymbolId: 'mulberry_run_1l6fpg7',        wordType: 'verb' },
  { id: 'home-walk',    label: 'Walk',    kind: 'word', color: SYMBOL_BLUE,   speech: 'walk',    mulberrySymbolId: 'mulberry_walk_usrwun',        wordType: 'verb' },
  { id: 'home-play',    label: 'Play',    kind: 'word', color: SYMBOL_YELLOW, speech: 'play',    mulberrySymbolId: 'mulberry_play_juloe2',        wordType: 'verb' },
  { id: 'home-sleep',   label: 'Sleep',   kind: 'word', color: SYMBOL_BLUE,   speech: 'sleep',   mulberrySymbolId: 'mulberry_sleep_male_1s97unf', wordType: 'verb' },
  { id: 'home-swim',    label: 'Swim',    kind: 'word', color: SYMBOL_BLUE,   speech: 'swim',    mulberrySymbolId: 'mulberry_swim_1konnmm',       wordType: 'verb' },
  { id: 'home-jump',    label: 'Jump',    kind: 'word', color: SYMBOL_ORANGE, speech: 'jump',    mulberrySymbolId: 'mulberry_jump_apgvlo',        wordType: 'verb' },
  { id: 'home-sit',     label: 'Sit',     kind: 'word', color: SYMBOL_PURPLE, speech: 'sit',     mulberrySymbolId: 'mulberry_sit_1aksru8',        wordType: 'verb' },
  { id: 'home-happy',   label: 'Happy',   kind: 'word', color: SYMBOL_YELLOW, speech: 'happy',   mulberrySymbolId: 'mulberry_happy_man_d75g78',   wordType: 'adjective' },
  { id: 'home-sad',     label: 'Sad',     kind: 'word', color: SYMBOL_BLUE,   speech: 'sad',     mulberrySymbolId: 'mulberry_sad_man_1xt7bsy',    wordType: 'adjective' },
  { id: 'home-help',    label: 'Help',    kind: 'word', color: SYMBOL_BLUE,   speech: 'help',    mulberrySymbolId: 'mulberry_help_1g1ppr',        wordType: 'verb' },
];

// ── Emergency & Help (Priority 4) ───────────────────────────────────────────
// One-word tile labels + symbols; full phrases live in `speech`. Non-deletable
// in edit mode. Longer sentences belong in Quick Text, not on board labels.
export const EMERGENCY_TILES: BoardTile[] = [
  { id: 'emer-aac',  label: 'AAC',  kind: 'word', color: '#FF3B30', speech: 'I use A A C to communicate',      isProtected: true, wordType: 'phrase', mulberrySymbolId: 'mulberry_communication_device_m2l9ji' },
  { id: 'emer-wait', label: 'Wait', kind: 'word', color: '#FF9500', speech: 'Please wait',                   isProtected: true, wordType: 'phrase', mulberrySymbolId: 'mulberry_wait_17bhqut' },
  { id: 'emer-help', label: 'Help', kind: 'word', color: '#FF3B30', speech: 'I need help',                   isProtected: true, wordType: 'phrase', mulberrySymbolId: 'mulberry_help_1g1ppr' },
  { id: 'emer-pain', label: 'Pain', kind: 'word', color: '#FF3B30', speech: 'I am in pain',                  isProtected: true, wordType: 'phrase', mulberrySymbolId: 'mulberry_stomach_ache_16rpjjq' },
  { id: 'emer-call', label: 'Call', kind: 'word', color: '#FF9500', speech: 'Please call my support person', isProtected: true, wordType: 'phrase', mulberrySymbolId: 'mulberry_telephone_mobile_npvlt1' },
  { id: 'back-emergency', label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF', mulberrySymbolId: 'mulberry_house_1ice1xp' },
];

export const BOARD_TILES: Record<BoardMode, BoardTile[]> = {
  home: HOME_TILES,
  foods: [
    { id: 'cheese', label: 'Cheese', kind: 'word', color: SYMBOL_YELLOW, speech: 'cheese', mulberrySymbolId: 'mulberry_cheese_qsgfck', wordType: 'noun' },
    { id: 'apple',  label: 'Apple',  kind: 'word', color: SYMBOL_RED,    speech: 'apple',  mulberrySymbolId: 'mulberry_apple_1ogqpa9',  wordType: 'noun' },
    { id: 'bread',  label: 'Bread',  kind: 'word', color: SYMBOL_ORANGE, speech: 'bread',  mulberrySymbolId: 'mulberry_bread_t6g6ux',   wordType: 'noun' },
    { id: 'banana', label: 'Banana', kind: 'word', color: SYMBOL_YELLOW, speech: 'banana', mulberrySymbolId: 'mulberry_banana_rcoei',   wordType: 'noun' },
    { id: 'milk',   label: 'Milk',   kind: 'word', color: SYMBOL_BLUE,   speech: 'milk',   mulberrySymbolId: 'mulberry_milk_1pcjn1m',   wordType: 'noun' },
    { id: 'water',  label: 'Water',  kind: 'word', color: SYMBOL_BLUE,   speech: 'water',  mulberrySymbolId: 'mulberry_water_139tuvw',  wordType: 'noun' },
    { id: 'pizza',  label: 'Pizza',  kind: 'word', color: SYMBOL_ORANGE, speech: 'pizza',  mulberrySymbolId: 'mulberry_pizza_rdymwh',   wordType: 'noun' },
    { id: 'orange', label: 'Orange', kind: 'word', color: SYMBOL_ORANGE, speech: 'orange', mulberrySymbolId: 'mulberry_orange_tfdxfd',  wordType: 'noun' },
    { id: 'egg',    label: 'Egg',    kind: 'word', color: SYMBOL_YELLOW, speech: 'egg',    mulberrySymbolId: 'mulberry_egg_1u25ooc',    wordType: 'noun' },
    { id: 'carrot', label: 'Carrot', kind: 'word', color: SYMBOL_ORANGE, speech: 'carrot', mulberrySymbolId: 'mulberry_carrot_keil00',  wordType: 'noun' },
    { id: 'potato', label: 'Potato', kind: 'word', color: SYMBOL_YELLOW, speech: 'potato', mulberrySymbolId: 'mulberry_potato_167a7ko', wordType: 'noun' },
    { id: 'biscuit',label: 'Biscuit',kind: 'word', color: SYMBOL_ORANGE, speech: 'biscuit',mulberrySymbolId: 'mulberry_biscuits_209lah',wordType: 'noun' },
    { id: 'juice',  label: 'Juice',  kind: 'word', color: SYMBOL_ORANGE, speech: 'juice',  mulberrySymbolId: 'mulberry_orange_juice_vav8xi', wordType: 'noun' },
    { id: 'chicken',label: 'Chicken',kind: 'word', color: SYMBOL_YELLOW, speech: 'chicken',mulberrySymbolId: 'mulberry_chicken_live_2os875', wordType: 'noun' },
    { id: 'back-foods', label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF', mulberrySymbolId: 'mulberry_house_1ice1xp' },
  ],
  places: [
    { id: 'school', label: 'School', kind: 'word', color: SYMBOL_BLUE,   speech: 'school', mulberrySymbolId: 'mulberry_school_7v1fml',  wordType: 'noun' },
    { id: 'shop',   label: 'Shop',   kind: 'word', color: SYMBOL_GREEN,  speech: 'shop',   mulberrySymbolId: 'mulberry_shop_8euq19',    wordType: 'noun' },
    { id: 'park',   label: 'Park',   kind: 'word', color: SYMBOL_GREEN,  speech: 'park',   mulberrySymbolId: 'mulberry_park_18ux2ty',   wordType: 'noun' },
    { id: 'beach',  label: 'Beach',  kind: 'word', color: SYMBOL_YELLOW, speech: 'beach',  mulberrySymbolId: 'mulberry_beach_drxxqc',   wordType: 'noun' },
    { id: 'house',  label: 'House',  kind: 'word', color: SYMBOL_ORANGE, speech: 'house',  mulberrySymbolId: 'mulberry_house_1ice1xp',  wordType: 'noun' },
    { id: 'car',    label: 'Car',    kind: 'word', color: SYMBOL_YELLOW, speech: 'car',    mulberrySymbolId: 'mulberry_car_1m0ff95',    wordType: 'noun' },
    { id: 'toilet', label: 'Toilet', kind: 'word', color: SYMBOL_BLUE,   speech: 'toilet', mulberrySymbolId: 'mulberry_toilet_1t82u6e', wordType: 'noun' },
    { id: 'doctor', label: 'Doctor', kind: 'word', color: SYMBOL_PURPLE, speech: 'doctor', mulberrySymbolId: 'mulberry_doctor_1a_lcuwh3', wordType: 'noun' },
    { id: 'train',  label: 'Train',  kind: 'word', color: SYMBOL_BLUE,   speech: 'train',  mulberrySymbolId: 'mulberry_train_6zo4kp',   wordType: 'noun' },
    { id: 'plane',  label: 'Plane',  kind: 'word', color: SYMBOL_BLUE,   speech: 'plane',  mulberrySymbolId: 'mulberry_plane_1pir8pr',    wordType: 'noun' },
    { id: 'bus-place', label: 'Bus', kind: 'word', color: SYMBOL_YELLOW, speech: 'bus',    mulberrySymbolId: 'mulberry_bus_1abvtwt',      wordType: 'noun' },
    { id: 'church', label: 'Church', kind: 'word', color: SYMBOL_PURPLE, speech: 'church', mulberrySymbolId: 'mulberry_church_1t13yb2', wordType: 'noun' },
    { id: 'swim-place', label: 'Swim', kind: 'word', color: SYMBOL_BLUE, speech: 'swim', mulberrySymbolId: 'mulberry_swimming_class_fnsmmt', wordType: 'noun' },
    { id: 'horse',  label: 'Horse',  kind: 'word', color: SYMBOL_ORANGE, speech: 'horse', mulberrySymbolId: 'mulberry_horse_c0o22y',  wordType: 'noun' },
    { id: 'back-places', label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF', mulberrySymbolId: 'mulberry_house_1ice1xp' },
  ],
  tools: [
    { id: 'run',        label: 'Run',        kind: 'word', color: SYMBOL_GREEN,  speech: 'run',         mulberrySymbolId: 'mulberry_run_1l6fpg7',        wordType: 'verb' },
    { id: 'walk',       label: 'Walk',       kind: 'word', color: SYMBOL_BLUE,   speech: 'walk',        mulberrySymbolId: 'mulberry_walk_usrwun',        wordType: 'verb' },
    { id: 'jump',       label: 'Jump',       kind: 'word', color: SYMBOL_ORANGE, speech: 'jump',        mulberrySymbolId: 'mulberry_jump_apgvlo',        wordType: 'verb' },
    { id: 'sit',        label: 'Sit',        kind: 'word', color: SYMBOL_PURPLE, speech: 'sit',         mulberrySymbolId: 'mulberry_sit_1aksru8',        wordType: 'verb' },
    { id: 'play',       label: 'Play',       kind: 'word', color: SYMBOL_YELLOW, speech: 'play',        mulberrySymbolId: 'mulberry_play_juloe2',        wordType: 'verb' },
    { id: 'sleep',      label: 'Sleep',      kind: 'word', color: SYMBOL_BLUE,   speech: 'sleep',       mulberrySymbolId: 'mulberry_sleep_male_1s97unf', wordType: 'verb' },
    { id: 'wash-hands', label: 'Wash', kind: 'word', color: SYMBOL_BLUE,   speech: 'wash hands',  mulberrySymbolId: 'mulberry_wash_hands_zcbt6k',  wordType: 'verb' },
    { id: 'open',       label: 'Open',       kind: 'word', color: SYMBOL_GREEN,  speech: 'open',        mulberrySymbolId: 'mulberry_open_6n4556',        wordType: 'verb' },
    { id: 'close',      label: 'Close',      kind: 'word', color: SYMBOL_RED,    speech: 'close',       mulberrySymbolId: 'mulberry_close_l7weaw',       wordType: 'verb' },
    { id: 'dance',      label: 'Dance',      kind: 'word', color: SYMBOL_PURPLE, speech: 'dance',       mulberrySymbolId: 'mulberry_dance_rdll6b',       wordType: 'verb' },
    { id: 'read',       label: 'Read',       kind: 'word', color: SYMBOL_BLUE,   speech: 'read',        mulberrySymbolId: 'mulberry_read_1gmx20c',       wordType: 'verb' },
    { id: 'write',      label: 'Write',      kind: 'word', color: SYMBOL_GREEN,  speech: 'write',       mulberrySymbolId: 'mulberry_write_17xcc0z',      wordType: 'verb' },
    { id: 'sing',       label: 'Sing',       kind: 'word', color: SYMBOL_YELLOW, speech: 'sing',        mulberrySymbolId: 'mulberry_sing_v5z66l',        wordType: 'verb' },
    { id: 'draw',       label: 'Draw',       kind: 'word', color: SYMBOL_ORANGE, speech: 'draw',        mulberrySymbolId: 'mulberry_draw_19hlq66',       wordType: 'verb' },
    { id: 'look',       label: 'Look',       kind: 'word', color: SYMBOL_BLUE,   speech: 'look',        mulberrySymbolId: 'mulberry_look_1r6a5uh',       wordType: 'verb' },
    { id: 'back-tools', label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF', mulberrySymbolId: 'mulberry_house_1ice1xp' },
  ],
  quick: [
    // Curated fallbacks: the Mulberry asset map has no plain 'yes'/'no'
    // pictograms, so we lean on the curated `good` / `bad` glyphs which
    // ship as inline SVG strings.
    { id: 'yes',  label: 'Yes',  kind: 'word', color: SYMBOL_GREEN, speech: 'yes',  mulberryName: 'good', wordType: 'interjection' },
    { id: 'no',   label: 'No',   kind: 'word', color: SYMBOL_RED,   speech: 'no',   mulberryName: 'bad',  wordType: 'interjection' },
    { id: 'help', label: 'Help', kind: 'word', color: SYMBOL_BLUE,  speech: 'help', mulberrySymbolId: 'mulberry_help_1g1ppr', wordType: 'verb' },
    { id: 'stop', label: 'Stop', kind: 'word', color: SYMBOL_RED,   speech: 'stop', wordType: 'verb' },
    { id: 'more', label: 'More', kind: 'word', color: SYMBOL_GREEN, speech: 'more', mulberrySymbolId: 'mulberry_more_1r3s2f0', wordType: 'adjective' },
    { id: 'want', label: 'Want', kind: 'word', color: SYMBOL_BLUE,  speech: 'want', mulberrySymbolId: 'mulberry_want_16yheia', wordType: 'verb' },
    { id: 'eat',  label: 'Eat',  kind: 'word', color: SYMBOL_ORANGE, speech: 'eat',  mulberrySymbolId: 'mulberry_eat_18rupbi',  wordType: 'verb' },
    { id: 'drink',label: 'Drink',kind: 'word', color: SYMBOL_PURPLE, speech: 'drink', mulberrySymbolId: 'mulberry_drink_16zxzpv', wordType: 'verb' },
    { id: 'go',     label: 'Go',   kind: 'word', color: SYMBOL_GREEN,  speech: 'go',    mulberrySymbolId: 'mulberry_go_19b4gza',    wordType: 'verb' },
    { id: 'wait',   label: 'Wait', kind: 'word', color: SYMBOL_ORANGE, speech: 'wait',  mulberrySymbolId: 'mulberry_wait_17bhqut',  wordType: 'verb' },
    { id: 'hug',    label: 'Hug',  kind: 'word', color: SYMBOL_PURPLE, speech: 'hug',   mulberrySymbolId: 'mulberry_hug_1dc7yxw',   wordType: 'verb' },
    { id: 'share',  label: 'Share',kind: 'word', color: SYMBOL_BLUE,   speech: 'share', mulberrySymbolId: 'mulberry_share_1xz6lbn', wordType: 'verb' },
    { id: 'loud',   label: 'Loud', kind: 'word', color: SYMBOL_ORANGE, speech: 'loud',  mulberrySymbolId: 'mulberry_loud_1kbu7nf',  wordType: 'adjective' },
    { id: 'brother',label: 'Brother',kind:'word', color: SYMBOL_BLUE,   speech: 'brother',mulberrySymbolId: 'mulberry_brother_1jo99rx', wordType: 'noun' },
    { id: 'sister', label: 'Sister', kind: 'word', color: SYMBOL_PURPLE, speech: 'sister', mulberrySymbolId: 'mulberry_sister_1bahkrn', wordType: 'noun' },
    { id: 'baby',   label: 'Baby', kind: 'word', color: SYMBOL_YELLOW, speech: 'baby',  mulberrySymbolId: 'mulberry_baby_1cxo7l',   wordType: 'noun' },
    { id: 'grandma',label: 'Grandma',kind:'word', color: SYMBOL_GREEN,  speech: 'grandma',mulberrySymbolId: 'mulberry_grandmother_1h16pum', wordType: 'noun' },
    { id: 'grandpa',label: 'Grandpa',kind:'word', color: SYMBOL_GREEN,  speech: 'grandpa',mulberrySymbolId: 'mulberry_grandfather_1dr1fzv', wordType: 'noun' },
    { id: 'back-quick', label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF', mulberrySymbolId: 'mulberry_house_1ice1xp' },
  ],
  feelings: [
    { id: 'happy',    label: 'Happy',    kind: 'word', color: SYMBOL_YELLOW, speech: 'happy',    mulberrySymbolId: 'mulberry_happy_man_d75g78',    wordType: 'adjective' },
    { id: 'sad',      label: 'Sad',      kind: 'word', color: SYMBOL_BLUE,   speech: 'sad',      mulberrySymbolId: 'mulberry_sad_man_1xt7bsy',     wordType: 'adjective' },
    { id: 'angry',    label: 'Angry',    kind: 'word', color: SYMBOL_RED,    speech: 'angry',    mulberrySymbolId: 'mulberry_angry_man_1g31prr',   wordType: 'adjective' },
    { id: 'excited',  label: 'Excited',  kind: 'word', color: SYMBOL_ORANGE, speech: 'excited',  mulberrySymbolId: 'mulberry_excited_man_5aqbg6',  wordType: 'adjective' },
    { id: 'worried',  label: 'Worried',  kind: 'word', color: SYMBOL_PURPLE, speech: 'worried',  mulberrySymbolId: 'mulberry_worried_man_fzvxd0',  wordType: 'adjective' },
    { id: 'love',     label: 'Love',     kind: 'word', color: SYMBOL_RED,    speech: 'love',     mulberrySymbolId: 'mulberry_heart_9841r7',        wordType: 'noun' },
    { id: 'tired',    label: 'Tired',    kind: 'word', color: SYMBOL_BLUE,   speech: 'tired',    mulberrySymbolId: 'mulberry_sleep_male_1s97unf',  wordType: 'adjective' },
    { id: 'quiet',    label: 'Quiet',    kind: 'word', color: SYMBOL_GREEN,  speech: 'quiet',    mulberrySymbolId: 'mulberry_quiet_4csbx1',        wordType: 'adjective' },
    { id: 'hot',      label: 'Hot',      kind: 'word', color: SYMBOL_RED,    speech: 'hot',      mulberrySymbolId: 'mulberry_hot_person_3moowg', wordType: 'adjective' },
    { id: 'hungry',   label: 'Hungry',   kind: 'word', color: SYMBOL_ORANGE, speech: 'hungry',   mulberrySymbolId: 'mulberry_hungry_sp7py',        wordType: 'adjective' },
    { id: 'thirsty',  label: 'Thirsty',  kind: 'word', color: SYMBOL_BLUE,   speech: 'thirsty',  mulberrySymbolId: 'mulberry_thirsty_j9fv0w',      wordType: 'adjective' },
    { id: 'surprised',label: 'Surprised',kind: 'word', color: SYMBOL_YELLOW, speech: 'surprised',mulberrySymbolId: 'mulberry_surprised_man_580cux',wordType: 'adjective' },
    { id: 'cold',     label: 'Cold',     kind: 'word', color: SYMBOL_BLUE,   speech: 'cold',     mulberrySymbolId: 'mulberry_snow_i6crm4',       wordType: 'adjective' },
    { id: 'upset',    label: 'Upset',    kind: 'word', color: SYMBOL_RED,    speech: 'upset',    mulberrySymbolId: 'mulberry_bad_12s0dym',       wordType: 'adjective' },
    { id: 'back-feelings', label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF', mulberrySymbolId: 'mulberry_house_1ice1xp' },
  ],
  settings: [
    { id: 'hide-nav',        label: 'Hide',     kind: 'action', color: SYMBOL_PURPLE },
    { id: 'clear-settings',  label: 'Clear',    kind: 'action', color: SYMBOL_RED    },
    { id: 'home-settings',   label: 'Home',     kind: 'folder', target: 'home', color: '#1DCDFF', mulberrySymbolId: 'mulberry_house_1ice1xp' },
    { id: 'repeat-settings', label: 'Repeat',   kind: 'action', color: SYMBOL_GREEN  },
  ],
  emergency: EMERGENCY_TILES,
};

export const BACK_TILE: BoardTile = { id: 'back', label: 'Back', kind: 'action', color: '#6B7580' };
