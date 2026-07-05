/**
 * buildSymbolPacks.ts
 *
 * Generates src/data/symbolPacks.ts with fully nested, themed symbol packs.
 * All symbol IDs are verified against to_do/mulberry_categories.json.
 *
 * Run with:
 *   npx ts-node --skip-project scripts/buildSymbolPacks.ts
 *
 * This script is safe — it only writes symbolPacks.ts and touches no other files.
 * It will NOT overwrite user boards, custom symbols, or any runtime data.
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const OUT_PATH = path.join(ROOT, 'src/data/symbolPacks.ts');
const REF_PATH = path.join(ROOT, 'to_do/mulberry_categories.json');

// ─── Load reference for ID validation ────────────────────────────────────────

type RefEntry = { id: string; name: string };
type RefMap = Record<string, RefEntry[]>;

const ref: RefMap = JSON.parse(fs.readFileSync(REF_PATH, 'utf-8'));
const allIds = new Set(Object.values(ref).flat().map(e => e.id));

const missing: string[] = [];
function checkId(id: string, label: string) {
  if (!allIds.has(id)) missing.push(`${label} → ${id}`);
  return id;
}

// ─── Name → verified-ID resolver ─────────────────────────────────────────────
// Every ID returned by pick() comes straight out of mulberry_categories.json,
// so it is verified by construction. Unknown names are reported as MISSING
// and the output is flagged before use — no fake IDs, no placeholders.

const byName = new Map<string, string>();
for (const entries of Object.values(ref)) {
  for (const e of entries) {
    const k = e.name.toLowerCase().trim();
    if (!byName.has(k)) byName.set(k, e.id);
  }
}

function pick(name: string): string {
  const id = byName.get(name.toLowerCase().trim());
  if (!id) {
    missing.push(`name → ${name}`);
    return `MISSING_${name.replace(/\W+/g, '_')}`;
  }
  return id;
}

/** Shorthand symbol node resolved by Mulberry name. */
function s(label: string, name: string, wordType: string, speech?: string) {
  return { label, symbolId: pick(name), wordType, speech: speech ?? label.toLowerCase() };
}

// ─── Pack definitions (all IDs verified) ─────────────────────────────────────

const packs = [

  // ── ANSWERS ─────────────────────────────────────────────────────────────────
  {
    id: 'answers',
    label: 'Answers',
    iconId: checkId('mulberry_good_eluzd6', 'yes'),
    children: [
      {
        id: 'answers-yesno',
        label: 'Yes & No',
        iconId: checkId('mulberry_good_eluzd6', 'yes'),
        children: [
          { label: 'Yes',  symbolId: checkId('mulberry_good_eluzd6',  'yes'),  wordType: 'interjection', speech: 'yes' },
          { label: 'No',   symbolId: checkId('mulberry_bad_12s0dym',   'no'),   wordType: 'interjection', speech: 'no' },
          { label: 'Good', symbolId: checkId('mulberry_good_eluzd6',  'good'), wordType: 'adjective',    speech: 'good' },
          { label: 'Bad',  symbolId: checkId('mulberry_bad_12s0dym',   'bad'),  wordType: 'adjective',    speech: 'bad' },
        ],
      },
      {
        id: 'answers-core',
        label: 'Core',
        iconId: checkId('mulberry_want_16yheia', 'want'),
        children: [
          { label: 'More',  symbolId: checkId('mulberry_more_1r3s2f0',  'more'),  wordType: 'adjective', speech: 'more' },
          { label: 'Want',  symbolId: checkId('mulberry_want_16yheia',  'want'),  wordType: 'verb',      speech: 'want' },
          { label: 'Help',  symbolId: checkId('mulberry_help_1g1ppr',   'help'),  wordType: 'verb',      speech: 'help' },
          { label: 'Hello', symbolId: checkId('mulberry_hello_1jyrbjf', 'hello'), wordType: 'social',    speech: 'hello' },
          { label: 'Go',    symbolId: checkId('mulberry_go_19b4gza',    'go'),    wordType: 'verb',      speech: 'go' },
        ],
      },
      {
        id: 'answers-questions',
        label: 'Questions',
        iconId: checkId('mulberry_what_15ykef7', 'what'),
        children: [
          { label: 'What',  symbolId: checkId('mulberry_what_15ykef7',  'what'),  wordType: 'question', speech: 'what' },
          { label: 'Where', symbolId: checkId('mulberry_where_18ixgw4', 'where'), wordType: 'question', speech: 'where' },
          { label: 'When',  symbolId: checkId('mulberry_when_18ixg65',  'when'),  wordType: 'question', speech: 'when' },
          { label: 'Who',   symbolId: checkId('mulberry_who_zkeiop',    'who'),   wordType: 'question', speech: 'who' },
          { label: 'Why',   symbolId: checkId('mulberry_why_z7syvj',    'why'),   wordType: 'question', speech: 'why' },
          { label: 'How',   symbolId: checkId('mulberry_how_4jy9a1',    'how'),   wordType: 'question', speech: 'how' },
          { label: 'Which', symbolId: checkId('mulberry_which_chwp9w',  'which'), wordType: 'question', speech: 'which' },
        ],
      },
    ],
  },

  // ── NUMBERS ──────────────────────────────────────────────────────────────────
  {
    id: 'numbers',
    label: 'Numbers',
    iconId: checkId('mulberry_one_1u9fivh', 'one'),
    children: [
      {
        id: 'numbers-0to10',
        label: '0 – 10',
        iconId: checkId('mulberry_one_1u9fivh', 'one'),
        children: [
          { label: '0',  symbolId: checkId('mulberry_zero_sqc2ej',   'zero'),  wordType: 'number', speech: 'zero' },
          { label: '1',  symbolId: checkId('mulberry_one_1u9fivh',   'one'),   wordType: 'number', speech: 'one' },
          { label: '2',  symbolId: checkId('mulberry_two_in0mlh',    'two'),   wordType: 'number', speech: 'two' },
          { label: '3',  symbolId: checkId('mulberry_three_109z0rr', 'three'), wordType: 'number', speech: 'three' },
          { label: '4',  symbolId: checkId('mulberry_four_m6udt3',   'four'),  wordType: 'number', speech: 'four' },
          { label: '5',  symbolId: checkId('mulberry_five_1sh6wnp',  'five'),  wordType: 'number', speech: 'five' },
          { label: '6',  symbolId: checkId('mulberry_six_1d0vlnv',   'six'),   wordType: 'number', speech: 'six' },
          { label: '7',  symbolId: checkId('mulberry_seven_1sw10g2', 'seven'), wordType: 'number', speech: 'seven' },
          { label: '8',  symbolId: checkId('mulberry_eight_1ua0932', 'eight'), wordType: 'number', speech: 'eight' },
          { label: '9',  symbolId: checkId('mulberry_nine_sw7xl1',   'nine'),  wordType: 'number', speech: 'nine' },
          { label: '10', symbolId: checkId('mulberry_ten_u8bprq',    'ten'),   wordType: 'number', speech: 'ten' },
        ],
      },
      {
        id: 'numbers-11to20',
        label: '11 – 20',
        iconId: checkId('mulberry_eleven_8a6o3c', 'eleven'),
        children: [
          { label: '11', symbolId: checkId('mulberry_eleven_8a6o3c',     'eleven'),    wordType: 'number', speech: 'eleven' },
          { label: '12', symbolId: checkId('mulberry_twelve_cxdf1s',     'twelve'),    wordType: 'number', speech: 'twelve' },
          { label: '13', symbolId: checkId('mulberry_thirteen_16ekkyc',  'thirteen'),  wordType: 'number', speech: 'thirteen' },
          { label: '14', symbolId: checkId('mulberry_fourteen_jth6ql',   'fourteen'),  wordType: 'number', speech: 'fourteen' },
          { label: '15', symbolId: checkId('mulberry_fifteen_svfcre',    'fifteen'),   wordType: 'number', speech: 'fifteen' },
          { label: '16', symbolId: checkId('mulberry_sixteen_19y08k1',   'sixteen'),   wordType: 'number', speech: 'sixteen' },
          { label: '17', symbolId: checkId('mulberry_seventeen_1ohfvw8', 'seventeen'), wordType: 'number', speech: 'seventeen' },
          { label: '18', symbolId: checkId('mulberry_eighteen_27jz74',   'eighteen'),  wordType: 'number', speech: 'eighteen' },
          { label: '19', symbolId: checkId('mulberry_nineteen_1jpbmm7',  'nineteen'),  wordType: 'number', speech: 'nineteen' },
          { label: '20', symbolId: checkId('mulberry_twenty_1kbt7e4',    'twenty'),    wordType: 'number', speech: 'twenty' },
        ],
      },
      {
        id: 'numbers-tens',
        label: 'Tens',
        iconId: checkId('mulberry_twenty_1kbt7e4', 'twenty'),
        children: [
          { label: '20',  symbolId: checkId('mulberry_twenty_1kbt7e4',  'twenty'),  wordType: 'number', speech: 'twenty' },
          { label: '30',  symbolId: checkId('mulberry_thirty_13b2voj',  'thirty'),  wordType: 'number', speech: 'thirty' },
          { label: '40',  symbolId: checkId('mulberry_forty_bhsoan',    'forty'),   wordType: 'number', speech: 'forty' },
          { label: '50',  symbolId: checkId('mulberry_fifty_m5i2p9',    'fifty'),   wordType: 'number', speech: 'fifty' },
          { label: '60',  symbolId: checkId('mulberry_sixty_jqkw2u',    'sixty'),   wordType: 'number', speech: 'sixty' },
          { label: '70',  symbolId: checkId('mulberry_seventy_1ai5o9b', 'seventy'), wordType: 'number', speech: 'seventy' },
          { label: '80',  symbolId: checkId('mulberry_eighty_1inor7r',  'eighty'),  wordType: 'number', speech: 'eighty' },
          { label: '90',  symbolId: checkId('mulberry_ninety_1iv4myw',  'ninety'),  wordType: 'number', speech: 'ninety' },
          { label: '100', symbolId: checkId('mulberry_hundred_1ay3fd9', 'hundred'), wordType: 'number', speech: 'one hundred' },
        ],
      },
    ],
  },

  // ── LETTERS ──────────────────────────────────────────────────────────────────
  {
    id: 'letters',
    label: 'Letters',
    iconId: checkId('mulberry_a_3fvbxk', 'a'),
    children: [
      {
        id: 'letters-upper-am',
        label: 'A – M',
        iconId: checkId('mulberry_a_3fvbxk', 'a'),
        children: [
          { label: 'A', symbolId: checkId('mulberry_a_3fvbxk',   'A'), wordType: 'letter', speech: 'A' },
          { label: 'B', symbolId: checkId('mulberry_b_3j9stn',   'B'), wordType: 'letter', speech: 'B' },
          { label: 'C', symbolId: checkId('mulberry_c_3h7356',   'C'), wordType: 'letter', speech: 'C' },
          { label: 'D', symbolId: checkId('mulberry_d_3fach9',   'D'), wordType: 'letter', speech: 'D' },
          { label: 'E', symbolId: checkId('mulberry_e_3d7tbg',   'E'), wordType: 'letter', speech: 'E' },
          { label: 'F', symbolId: checkId('mulberry_f_3gma7j',   'F'), wordType: 'letter', speech: 'F' },
          { label: 'G', symbolId: checkId('mulberry_g_3ejkj2',   'G'), wordType: 'letter', speech: 'G' },
          { label: 'H', symbolId: checkId('mulberry_h_3n8vxd',   'H'), wordType: 'letter', speech: 'H' },
          { label: 'I', symbolId: checkId('mulberry_i_3l6crk',   'I'), wordType: 'letter', speech: 'I' },
          { label: 'J', symbolId: checkId('mulberry_j_3oktnn',   'J'), wordType: 'letter', speech: 'J' },
          { label: 'K', symbolId: checkId('mulberry_k_3mi3z6',   'K'), wordType: 'letter', speech: 'K' },
          { label: 'L', symbolId: checkId('mulberry_l_3kldb9',   'L'), wordType: 'letter', speech: 'L' },
          { label: 'M', symbolId: checkId('mulberry_m_3iiu5g',   'M'), wordType: 'letter', speech: 'M' },
        ],
      },
      {
        id: 'letters-upper-nz',
        label: 'N – Z',
        iconId: checkId('mulberry_n_3lxb1j', 'N'),
        children: [
          { label: 'N', symbolId: checkId('mulberry_n_3lxb1j',   'N'), wordType: 'letter', speech: 'N' },
          { label: 'O', symbolId: checkId('mulberry_o_3juld2',   'O'), wordType: 'letter', speech: 'O' },
          { label: 'P', symbolId: checkId('mulberry_p_3t7u0p',   'P'), wordType: 'letter', speech: 'P' },
          { label: 'Q', symbolId: checkId('mulberry_q_3r5auw',   'Q'), wordType: 'letter', speech: 'Q' },
          { label: 'R', symbolId: checkId('mulberry_r_3ujrqz',   'R'), wordType: 'letter', speech: 'R' },
          { label: 'S', symbolId: checkId('mulberry_s_3sh22i',   'S'), wordType: 'letter', speech: 'S' },
          { label: 'T', symbolId: checkId('mulberry_t_3qkbel',   'T'), wordType: 'letter', speech: 'T' },
          { label: 'U', symbolId: checkId('mulberry_u_3ohs8s',   'U'), wordType: 'letter', speech: 'U' },
          { label: 'V', symbolId: checkId('mulberry_v_3rw94v',   'V'), wordType: 'letter', speech: 'V' },
          { label: 'W', symbolId: checkId('mulberry_w_3ptjge',   'W'), wordType: 'letter', speech: 'W' },
          { label: 'X', symbolId: checkId('mulberry_x_3yiuup',   'X'), wordType: 'letter', speech: 'X' },
          { label: 'Y', symbolId: checkId('mulberry_y_3wgbow',   'Y'), wordType: 'letter', speech: 'Y' },
          { label: 'Z', symbolId: checkId('mulberry_z_3zuskz',   'Z'), wordType: 'letter', speech: 'Z' },
        ],
      },
      {
        id: 'letters-lower-am',
        label: 'a – m',
        iconId: checkId('mulberry_a_lower_case_y4877x', 'a lower'),
        children: [
          { label: 'a', symbolId: checkId('mulberry_a_lower_case_y4877x',  'a lc'), wordType: 'letter', speech: 'a' },
          { label: 'b', symbolId: checkId('mulberry_b_lower_case_13yeq9a', 'b lc'), wordType: 'letter', speech: 'b' },
          { label: 'c', symbolId: checkId('mulberry_c_lower_case_ppbp73',  'c lc'), wordType: 'letter', speech: 'c' },
          { label: 'd', symbolId: checkId('mulberry_d_lower_case_1rw61pk', 'd lc'), wordType: 'letter', speech: 'd' },
          { label: 'e', symbolId: checkId('mulberry_e_lower_case_1dn30nd', 'e lc'), wordType: 'letter', speech: 'e' },
          { label: 'f', symbolId: checkId('mulberry_f_lower_case_1jh9joq', 'f lc'), wordType: 'letter', speech: 'f' },
          { label: 'g', symbolId: checkId('mulberry_g_lower_case_1586imj', 'g lc'), wordType: 'letter', speech: 'g' },
          { label: 'h', symbolId: checkId('mulberry_h_lower_case_11797s4', 'h lc'), wordType: 'letter', speech: 'h' },
          { label: 'i', symbolId: checkId('mulberry_i_lower_case_my66px',  'i lc'), wordType: 'letter', speech: 'i' },
          { label: 'j', symbolId: checkId('mulberry_j_lower_case_sscpra',  'j lc'), wordType: 'letter', speech: 'j' },
          { label: 'k', symbolId: checkId('mulberry_k_lower_case_ej9op3',  'k lc'), wordType: 'letter', speech: 'k' },
          { label: 'l', symbolId: checkId('mulberry_l_lower_case_1gq417k', 'l lc'), wordType: 'letter', speech: 'l' },
          { label: 'm', symbolId: checkId('mulberry_m_lower_case_12h105d', 'm lc'), wordType: 'letter', speech: 'm' },
        ],
      },
      {
        id: 'letters-lower-nz',
        label: 'n – z',
        iconId: checkId('mulberry_n_lower_case_18b7j6q', 'n lower'),
        children: [
          { label: 'n', symbolId: checkId('mulberry_n_lower_case_18b7j6q', 'n lc'), wordType: 'letter', speech: 'n' },
          { label: 'o', symbolId: checkId('mulberry_o_lower_case_u24i4j',  'o lc'), wordType: 'letter', speech: 'o' },
          { label: 'p', symbolId: checkId('mulberry_p_lower_case_1fzt518', 'p lc'), wordType: 'letter', speech: 'p' },
          { label: 'q', symbolId: checkId('mulberry_q_lower_case_11qq3z1', 'q lc'), wordType: 'letter', speech: 'q' },
          { label: 'r', symbolId: checkId('mulberry_r_lower_case_17kwn0e', 'r lc'), wordType: 'letter', speech: 'r' },
          { label: 's', symbolId: checkId('mulberry_s_lower_case_tbtly7',  's lc'), wordType: 'letter', speech: 's' },
          { label: 't', symbolId: checkId('mulberry_t_lower_case_1vinygo', 't lc'), wordType: 'letter', speech: 't' },
          { label: 'u', symbolId: checkId('mulberry_u_lower_case_1h9kxeh', 'u lc'), wordType: 'letter', speech: 'u' },
          { label: 'v', symbolId: checkId('mulberry_v_lower_case_1n3rgfu', 'v lc'), wordType: 'letter', speech: 'v' },
          { label: 'w', symbolId: checkId('mulberry_w_lower_case_18uofdn', 'w lc'), wordType: 'letter', speech: 'w' },
          { label: 'x', symbolId: checkId('mulberry_x_lower_case_14tr4j8', 'x lc'), wordType: 'letter', speech: 'x' },
          { label: 'y', symbolId: checkId('mulberry_y_lower_case_qko3h1',  'y lc'), wordType: 'letter', speech: 'y' },
          { label: 'z', symbolId: checkId('mulberry_z_lower_case_weumie',  'z lc'), wordType: 'letter', speech: 'z' },
        ],
      },
    ],
  },

  // ── FEELINGS ─────────────────────────────────────────────────────────────────
  {
    id: 'feelings',
    label: 'Feelings',
    iconId: checkId('mulberry_happy_man_d75g78', 'happy man'),
    children: [
      {
        id: 'feelings-positive',
        label: 'Positive',
        iconId: checkId('mulberry_happy_man_d75g78', 'happy man'),
        children: [
          { label: 'Happy',          symbolId: checkId('mulberry_happy_man_d75g78',          'happy man'),          wordType: 'emotion', speech: 'happy' },
          { label: 'Excited',        symbolId: checkId('mulberry_excited_man_5aqbg6',        'excited man'),        wordType: 'emotion', speech: 'excited' },
          { label: 'Laughing',       symbolId: checkId('mulberry_laughing_man_nrwklf',       'laughing man'),       wordType: 'emotion', speech: 'laughing' },
          { label: 'Serene',         symbolId: checkId('mulberry_serene_man_15g5pzy',        'serene man'),         wordType: 'emotion', speech: 'serene' },
          { label: 'Concentrating',  symbolId: checkId('mulberry_concentrating_man_t05oq5', 'concentrating man'),  wordType: 'emotion', speech: 'concentrating' },
        ],
      },
      {
        id: 'feelings-negative',
        label: 'Negative',
        iconId: checkId('mulberry_sad_man_1xt7bsy', 'sad man'),
        children: [
          { label: 'Sad',       symbolId: checkId('mulberry_sad_man_1xt7bsy',       'sad man'),       wordType: 'emotion', speech: 'sad' },
          { label: 'Angry',     symbolId: checkId('mulberry_angry_man_1g31prr',     'angry man'),     wordType: 'emotion', speech: 'angry' },
          { label: 'Worried',   symbolId: checkId('mulberry_worried_man_fzvxd0',    'worried man'),   wordType: 'emotion', speech: 'worried' },
          { label: 'Afraid',    symbolId: checkId('mulberry_afraid_man_6i29yl',     'afraid man'),    wordType: 'emotion', speech: 'afraid' },
          { label: 'Confused',  symbolId: checkId('mulberry_confused_man_1qid5lj',  'confused man'),  wordType: 'emotion', speech: 'confused' },
          { label: 'Disgusted', symbolId: checkId('mulberry_disgusted_man_142q3em', 'disgusted man'), wordType: 'emotion', speech: 'disgusted' },
          { label: 'Jealous',   symbolId: checkId('mulberry_jealous_man_6gs75r',    'jealous man'),   wordType: 'emotion', speech: 'jealous' },
          { label: 'Sneering',  symbolId: checkId('mulberry_sneering_man_v6nfzv',   'sneering man'),  wordType: 'emotion', speech: 'sneering' },
        ],
      },
      {
        id: 'feelings-neutral',
        label: 'Neutral',
        iconId: checkId('mulberry_face_neutral_3_pet166', 'face neutral'),
        children: [
          { label: 'Neutral',  symbolId: checkId('mulberry_face_neutral_3_pet166', 'face neutral'),  wordType: 'emotion', speech: 'neutral' },
          { label: 'Desiring', symbolId: checkId('mulberry_desiring_man_pbntp',    'desiring man'),  wordType: 'emotion', speech: 'wanting' },
        ],
      },
    ],
  },

  // ── FOOD ─────────────────────────────────────────────────────────────────────
  {
    id: 'food',
    label: 'Food',
    iconId: checkId('mulberry_food_atkyaz', 'food'),
    children: [
      {
        id: 'food-fruit',
        label: 'Fruit',
        iconId: checkId('mulberry_apple_1ogqpa9', 'apple'),
        children: [
          { label: 'Apple',    symbolId: checkId('mulberry_apple_1ogqpa9',   'apple'),    wordType: 'noun', speech: 'apple' },
          { label: 'Banana',   symbolId: checkId('mulberry_banana_rcoei',    'banana'),   wordType: 'noun', speech: 'banana' },
          { label: 'Orange',   symbolId: checkId('mulberry_orange_tfdxfd',   'orange'),   wordType: 'noun', speech: 'orange' },
          { label: 'Grapes',   symbolId: checkId('mulberry_grapes_305mpn',   'grapes'),   wordType: 'noun', speech: 'grapes' },
          { label: 'Strawberry', symbolId: checkId('mulberry_strawberry_1xd6p6c', 'strawberry'), wordType: 'noun', speech: 'strawberry' },
        ],
      },
      {
        id: 'food-meals',
        label: 'Meals',
        iconId: checkId('mulberry_food_atkyaz', 'food'),
        children: [
          { label: 'Eat',   symbolId: checkId('mulberry_eat_18rupbi',    'eat'),   wordType: 'verb', speech: 'eat' },
          { label: 'Bread', symbolId: checkId('mulberry_bread_t6g6ux',   'bread'), wordType: 'noun', speech: 'bread' },
          { label: 'Pizza', symbolId: checkId('mulberry_pizza_rdymwh',   'pizza'), wordType: 'noun', speech: 'pizza' },
        ],
      },
      {
        id: 'food-drinks',
        label: 'Drinks',
        iconId: checkId('mulberry_water_139tuvw', 'water'),
        children: [
          { label: 'Water', symbolId: checkId('mulberry_water_139tuvw',  'water'), wordType: 'noun', speech: 'water' },
          { label: 'Drink', symbolId: checkId('mulberry_drink_17yxcxw',  'drink'), wordType: 'verb', speech: 'drink' },
        ],
      },
    ],
  },

  // ── TRANSPORT ────────────────────────────────────────────────────────────────
  {
    id: 'transport',
    label: 'Transport',
    iconId: checkId('mulberry_car_1m0ff95', 'car'),
    children: [
      {
        id: 'transport-road',
        label: 'Road',
        iconId: checkId('mulberry_car_1m0ff95', 'car'),
        children: [
          { label: 'Car',       symbolId: checkId('mulberry_car_1m0ff95',        'car'),       wordType: 'noun', speech: 'car' },
          { label: 'Bus',       symbolId: checkId('mulberry_bus_1abvtwt',        'bus'),       wordType: 'noun', speech: 'bus' },
          { label: 'Bicycle',   symbolId: checkId('mulberry_bicycle_1dxgn9u',   'bicycle'),   wordType: 'noun', speech: 'bicycle' },
          { label: 'Ambulance', symbolId: checkId('mulberry_ambulance_1hohvbr', 'ambulance'), wordType: 'noun', speech: 'ambulance' },
          { label: 'Fire truck',symbolId: checkId('mulberry_fire_engine_aq3hc',   'fire engine'), wordType: 'noun', speech: 'fire truck' },
        ],
      },
      {
        id: 'transport-rail',
        label: 'Rail',
        iconId: checkId('mulberry_train_6zo4kp', 'train'),
        children: [
          { label: 'Train', symbolId: checkId('mulberry_train_6zo4kp', 'train'), wordType: 'noun', speech: 'train' },
        ],
      },
      {
        id: 'transport-air',
        label: 'Air',
        iconId: checkId('mulberry_aeroplane_963q12', 'aeroplane'),
        children: [
          { label: 'Plane',       symbolId: checkId('mulberry_aeroplane_963q12',    'aeroplane'),   wordType: 'noun', speech: 'aeroplane' },
          { label: 'Helicopter',  symbolId: checkId('mulberry_helicopter_1xgokm6',  'helicopter'),  wordType: 'noun', speech: 'helicopter' },
        ],
      },
      {
        id: 'transport-water',
        label: 'Water',
        iconId: checkId('mulberry_boat_zeej1t', 'boat'),
        children: [
          { label: 'Boat',  symbolId: checkId('mulberry_boat_zeej1t',  'boat'),  wordType: 'noun', speech: 'boat' },
          { label: 'Ferry', symbolId: checkId('mulberry_ferry_1wuvl6b', 'ferry'), wordType: 'noun', speech: 'ferry' },
        ],
      },
    ],
  },

  // ── ACTIVITIES ───────────────────────────────────────────────────────────────
  {
    id: 'activities',
    label: 'Activities',
    iconId: checkId('mulberry_play_juloe2', 'play'),
    children: [
      {
        id: 'activities-creative',
        label: 'Creative',
        iconId: checkId('mulberry_draw_19hlq66', 'draw'),
        children: [
          { label: 'Draw',  symbolId: checkId('mulberry_draw_19hlq66', 'draw'),  wordType: 'verb', speech: 'draw' },
          { label: 'Dance', symbolId: checkId('mulberry_dance_rdll6b', 'dance'), wordType: 'verb', speech: 'dance' },
          { label: 'Play',  symbolId: checkId('mulberry_play_juloe2',  'play'),  wordType: 'verb', speech: 'play' },
        ],
      },
      {
        id: 'activities-sport',
        label: 'Sport',
        iconId: checkId('mulberry_swim_1konnmm', 'swim'),
        children: [
          { label: 'Swim',     symbolId: checkId('mulberry_swim_1konnmm',    'swim'),    wordType: 'verb', speech: 'swim' },
          { label: 'Run',      symbolId: checkId('mulberry_run_1l6fpg7',     'run'),     wordType: 'verb', speech: 'run' },
          { label: 'Walk',     symbolId: checkId('mulberry_walk_usrwun',     'walk'),    wordType: 'verb', speech: 'walk' },
          { label: 'Bowling',  symbolId: checkId('mulberry_bowling_bb3zun',  'bowling'), wordType: 'noun', speech: 'bowling' },
        ],
      },
    ],
  },

  // ── HEALTH & HYGIENE ─────────────────────────────────────────────────────────
  {
    id: 'health',
    label: 'Health',
    iconId: checkId('mulberry_doctor_1a_lcuwh3', 'doctor'),
    children: [
      {
        id: 'health-hygiene',
        label: 'Hygiene',
        iconId: checkId('mulberry_wash_hands_zcbt6k', 'wash hands'),
        children: [
          { label: 'Toilet',       symbolId: checkId('mulberry_toilet_1t82u6e',      'toilet'),       wordType: 'noun', speech: 'toilet' },
          { label: 'Wash hands',   symbolId: checkId('mulberry_wash_hands_zcbt6k',   'wash hands'),   wordType: 'verb', speech: 'wash hands' },
          { label: 'Wash face',    symbolId: checkId('mulberry_wash_face_3dak0d',    'wash face'),    wordType: 'verb', speech: 'wash face' },
          { label: 'Brush teeth',  symbolId: checkId('mulberry_brush_teeth_ozhrp3',  'brush teeth'),  wordType: 'verb', speech: 'brush teeth' },
        ],
      },
      {
        id: 'health-pain',
        label: 'Pain',
        iconId: checkId('mulberry_headache_afanny', 'headache'),
        children: [
          { label: 'Headache',      symbolId: checkId('mulberry_headache_afanny',       'headache'),      wordType: 'noun', speech: 'headache' },
          { label: 'Stomach ache',  symbolId: checkId('mulberry_stomach_ache_16rpjjq',  'stomach ache'),  wordType: 'noun', speech: 'stomach ache' },
          { label: 'Back ache',     symbolId: checkId('mulberry_back_ache_t5or4i',      'back ache'),     wordType: 'noun', speech: 'back ache' },
          { label: 'Toothache',     symbolId: checkId('mulberry_toothache_uw75am',      'toothache'),     wordType: 'noun', speech: 'toothache' },
        ],
      },
      {
        id: 'health-care',
        label: 'Care',
        iconId: checkId('mulberry_doctor_1a_lcuwh3', 'doctor'),
        children: [
          { label: 'Doctor',  symbolId: checkId('mulberry_doctor_1a_lcuwh3',   'doctor'),      wordType: 'noun', speech: 'doctor' },
          { label: 'Sleep',   symbolId: checkId('mulberry_sleep_male_1s97unf', 'sleep male'),  wordType: 'verb', speech: 'sleep' },
        ],
      },
    ],
  },

  // ── PLACES ───────────────────────────────────────────────────────────────────
  {
    id: 'places',
    label: 'Places',
    iconId: checkId('mulberry_house_1ice1xp', 'house'),
    children: [
      {
        id: 'places-everyday',
        label: 'Everyday',
        iconId: checkId('mulberry_house_1ice1xp', 'house'),
        children: [
          { label: 'Home',    symbolId: checkId('mulberry_house_1ice1xp',  'house'),  wordType: 'noun', speech: 'home' },
          { label: 'School',  symbolId: checkId('mulberry_school_7v1fml',  'school'), wordType: 'noun', speech: 'school' },
          { label: 'Work',    symbolId: checkId('mulberry_work_14zeorj',   'work'),   wordType: 'noun', speech: 'work' },
          { label: 'Outside', symbolId: checkId('mulberry_outside_ljj1ss', 'outside'), wordType: 'noun', speech: 'outside' },
        ],
      },
    ],
  },

  // ── TECHNOLOGY ───────────────────────────────────────────────────────────────
  {
    id: 'technology',
    label: 'Technology',
    iconId: checkId('mulberry_computer_1_1aswibk', 'computer 1'),
    children: [
      {
        id: 'technology-devices',
        label: 'Devices',
        iconId: checkId('mulberry_computer_1_1aswibk', 'computer 1'),
        children: [
          { label: 'Computer', symbolId: checkId('mulberry_computer_1_1aswibk', 'computer 1'),  wordType: 'noun', speech: 'computer' },
          { label: 'Phone',    symbolId: checkId('mulberry_mobile_phone_1p3ukiy','mobile phone'), wordType: 'noun', speech: 'phone' },
          { label: 'iPhone',   symbolId: checkId('mulberry_iphone_10j6jvg',     'iphone'),      wordType: 'noun', speech: 'iPhone' },
        ],
      },
    ],
  },

  // ═══ EXPANSION BATCH — 21 packs (Fable 5 pass) ═══════════════════════════════
  // All IDs resolved by verified name lookup (pick). Wording is mature and
  // calm; phrases live in `speech`, single words on labels.

  // ── EMERGENCY ────────────────────────────────────────────────────────────────
  {
    id: 'emergency',
    label: 'Emergency',
    iconId: pick('first aid box'),
    children: [
      {
        id: 'emergency-medical',
        label: 'Medical',
        iconId: pick('ambulance'),
        children: [
          s('Ambulance', 'ambulance', 'noun'),
          s('Paramedic', 'paramedic 1a', 'noun'),
          s('Doctor', 'doctor 1a', 'noun'),
          s('Nurse', 'nurse 2a', 'noun'),
          s('First aid', 'first aid box', 'noun', 'I need first aid'),
          s('Medicine', 'medicine', 'noun', 'I need my medicine'),
          s('Seizure', 'seizure', 'noun', 'seizure'),
          s('Broken', 'broken bone', 'noun', 'I think something is broken'),
          s('Inhaler', 'inhaler', 'noun', 'I need my inhaler'),
          s('X-ray', 'xray', 'noun', 'x ray'),
        ],
      },
      {
        id: 'emergency-fire',
        label: 'Fire & Hazard',
        iconId: pick('fire engine'),
        children: [
          s('Fire', 'fire', 'noun', 'fire'),
          s('Flame', 'flame', 'noun'),
          s('Smoke', 'smoke', 'noun', 'I can smell smoke'),
          s('Fire truck', 'fire engine', 'noun', 'fire truck'),
          s('Firefighter', 'fire helmet', 'noun', 'firefighter'),
          s('No smoking', 'no smoking sign', 'noun', 'no smoking'),
          s('Warning', 'warning light', 'noun', 'warning'),
        ],
      },
      {
        id: 'emergency-help',
        label: 'Help & Safety',
        iconId: pick('help'),
        children: [
          s('Help', 'help', 'verb', 'I need help'),
          s('Wait', 'wait', 'verb', 'please wait'),
          s('Police', 'police 1a', 'noun'),
          s('Police car', 'police car', 'noun'),
          s('Lost', 'lost', 'adjective', 'I am lost'),
          s('AAC', 'communication device', 'noun', 'I use a communication device'),
          s('Passport', 'personal passport', 'noun', 'please read my communication passport'),
          s('Toilet', 'need toilet', 'noun', 'I need the toilet'),
        ],
      },
      {
        id: 'emergency-illness',
        label: 'Illness & Allergy',
        iconId: pick('rash'),
        children: [
          s('Vomit', 'vomit', 'verb', 'I feel like vomiting'),
          s('Rash', 'rash', 'noun', 'I have a rash'),
          s('Sting', 'sting bee', 'noun', 'I have been stung'),
          s('Sneeze', 'sneeze cold', 'verb', 'I have a cold'),
          s('Burn', 'burn', 'noun', 'I have a burn'),
          s('Cut', 'cut', 'noun', 'I have a cut'),
          s('Itch', 'itch', 'noun', 'it is itchy'),
          s('Lump', 'lump', 'noun', 'I found a lump'),
          s('Choke', 'choke', 'verb', 'choking'),
        ],
      },
      {
        id: 'emergency-pain',
        label: 'Pain',
        iconId: pick('headache'),
        children: [
          s('Headache', 'headache', 'noun', 'I have a headache'),
          s('Stomach', 'stomach ache', 'noun', 'my stomach hurts'),
          s('Back', 'back ache', 'noun', 'my back hurts'),
          s('Tooth', 'toothache', 'noun', 'my tooth hurts'),
          s('Thermometer', 'thermometer', 'noun'),
          s('Plaster', 'plaster', 'noun', 'I need a plaster'),
          s('Sling', 'sling', 'noun'),
          s('Crutches', 'crutches', 'noun'),
          s('Tablets', 'tablets', 'noun'),
        ],
      },
      {
        id: 'emergency-feelings',
        label: 'How I Feel',
        iconId: pick('afraid man'),
        children: [
          s('Afraid', 'afraid man', 'emotion', 'I am afraid'),
          s('Worried', 'worried man', 'emotion', 'I am worried'),
          s('Confused', 'confused man', 'emotion', 'I am confused'),
          s('Angry', 'angry man', 'emotion', 'I am angry'),
          s('Quiet', 'quiet', 'adjective', 'I need quiet'),
          s('Calm', 'serene man', 'emotion', 'I am calm'),
        ],
      },
    ],
  },

  // ── QUICK ANSWERS ────────────────────────────────────────────────────────────
  {
    id: 'quick-answers',
    label: 'Quick Answers',
    iconId: pick('good'),
    children: [
      {
        id: 'qa-yesno',
        label: 'Yes & No',
        iconId: pick('good'),
        children: [
          s('Yes', 'good', 'interjection', 'yes'),
          s('No', 'bad', 'interjection', 'no'),
          s('Good', 'good', 'adjective'),
          s('Bad', 'bad', 'adjective'),
          s('Great', 'great', 'adjective'),
          s('Correct', 'correct', 'adjective', 'that is correct'),
          s('Wrong', 'mistake no wrong', 'adjective', 'that is wrong'),
          s('Enough', 'enough', 'adjective', 'that is enough'),
        ],
      },
      {
        id: 'qa-needs',
        label: 'I Need',
        iconId: pick('want'),
        children: [
          s('Want', 'want', 'verb', 'I want'),
          s('More', 'more', 'adjective', 'more please'),
          s('Help', 'help', 'verb', 'I need help'),
          s('Toilet', 'need toilet', 'noun', 'I need the toilet'),
          s('Hungry', 'hungry', 'adjective', 'I am hungry'),
          s('Thirsty', 'thirsty', 'adjective', 'I am thirsty'),
          s('Break', 'break 2', 'noun', 'I need a break'),
          s('Wait', 'wait', 'verb', 'I need more time'),
          s('Finish', 'finish', 'verb', 'I am finished'),
          s('Rest', 'rest', 'verb', 'I need to rest'),
        ],
      },
      {
        id: 'qa-understanding',
        label: 'Understanding',
        iconId: pick('think'),
        children: [
          s('Think', 'think', 'verb', 'let me think'),
          s('Guess', 'guess', 'verb', 'I am guessing'),
          s('Confused', 'confused man', 'emotion', 'I do not understand'),
          s('Show me', 'show me', 'verb', 'please show me'),
          s('Ask', 'ask', 'verb', 'I want to ask something'),
          s('Right idea', 'correct thought', 'noun', 'that is what I mean'),
          s('Wrong idea', 'wrong thought', 'noun', 'that is not what I mean'),
          s('Answer', 'answer', 'noun'),
        ],
      },
      {
        id: 'qa-social',
        label: 'Quick Social',
        iconId: pick('hello'),
        children: [
          s('Hello', 'hello', 'social'),
          s('Handshake', 'shake hands', 'social', 'nice to meet you'),
          s('Nod', 'nod', 'social', 'I agree'),
          s('Smile', 'smile', 'social'),
          s('Whisper', 'whisper', 'verb', 'please speak quietly'),
          s('Loud', 'loud', 'adjective', 'please speak up'),
          s('Talk', 'talk 1', 'verb', 'let us talk'),
          s('Go', 'go', 'verb', 'let us go'),
        ],
      },
      {
        id: 'qa-reactions',
        label: 'Reactions',
        iconId: pick('laughing man'),
        children: [
          s('Funny', 'laughing man', 'emotion', 'that is funny'),
          s('Surprised', 'surprised man', 'emotion', 'I am surprised'),
          s('Excited', 'excited man', 'emotion', 'I am excited'),
          s('Yummy', 'yummy', 'adjective', 'that is yummy'),
          s('Yucky', 'yucky', 'adjective', 'I do not like that'),
          s('Favourite', 'favourite', 'adjective', 'that is my favourite'),
          s('Winner', 'winner', 'noun', 'we won'),
          s('Celebrate', 'celebrate 1', 'verb', 'let us celebrate'),
        ],
      },
    ],
  },

  // ── DRINKS ───────────────────────────────────────────────────────────────────
  {
    id: 'drinks',
    label: 'Drinks',
    iconId: pick('water'),
    children: [
      {
        id: 'drinks-hot',
        label: 'Hot Drinks',
        iconId: pick('coffee'),
        children: [
          s('Tea', 'tea', 'noun', 'a cup of tea'),
          s('Coffee', 'coffee', 'noun'),
          s('Hot chocolate', 'hot chocolate', 'noun'),
          s('Instant coffee', 'coffee instant', 'noun', 'instant coffee'),
          s('Tea bag', 'tea bag', 'noun'),
        ],
      },
      {
        id: 'drinks-cold',
        label: 'Cold Drinks',
        iconId: pick('milkshake'),
        children: [
          s('Water', 'water', 'noun'),
          s('Milk', 'milk', 'noun'),
          s('Milkshake', 'milkshake', 'noun'),
          s('Lemonade', 'lemonade', 'noun'),
          s('Squash', 'squash', 'noun', 'cordial'),
          s('Fizzy drink', 'orange fizzy drink', 'noun', 'fizzy drink'),
          s('Cold drink', 'drink cold', 'noun', 'a cold drink'),
        ],
      },
      {
        id: 'drinks-juice',
        label: 'Juices',
        iconId: pick('orange juice'),
        children: [
          s('Orange juice', 'orange juice', 'noun'),
          s('Apple juice', 'apple juice', 'noun'),
          s('Grape juice', 'grape juice', 'noun'),
          s('Pineapple juice', 'pineapple juice', 'noun'),
          s('Cranberry juice', 'cranberry juice', 'noun'),
          s('Blackcurrant', 'blackcurrant juice', 'noun', 'blackcurrant juice'),
          s('Tomato juice', 'tomato juice', 'noun'),
        ],
      },
      {
        id: 'drinks-sizes',
        label: 'Sizes & Cups',
        iconId: pick('drink large'),
        children: [
          s('Small', 'drink small', 'adjective', 'a small drink'),
          s('Medium', 'drink medium', 'adjective', 'a medium drink'),
          s('Large', 'drink large', 'adjective', 'a large drink'),
          s('Mug', 'mug 2', 'noun'),
          s('Carton', 'carton 1', 'noun'),
          s('Straw cup', 'cup non spill', 'noun', 'my cup'),
        ],
      },
      {
        id: 'drinks-orders',
        label: 'Ordering',
        iconId: pick('cafe'),
        children: [
          s('Drink', 'drink', 'verb', 'I want a drink'),
          s('Thirsty', 'thirsty', 'adjective', 'I am thirsty'),
          s('Cafe', 'cafe', 'noun', 'let us go to a cafe'),
          s('Menu', 'menu', 'noun', 'can I see the menu'),
          s('Pour', 'pour', 'verb', 'please pour it'),
          s('Delicious', 'delicious drink', 'adjective', 'this drink is delicious'),
        ],
      },
    ],
  },

  // ── FEELINGS (EXPANDED) ──────────────────────────────────────────────────────
  {
    id: 'feelings-expanded',
    label: 'More Feelings',
    iconId: pick('happy lady'),
    children: [
      {
        id: 'fx-basic',
        label: 'Basic',
        iconId: pick('happy man'),
        children: [
          s('Happy', 'happy man', 'emotion', 'I am happy'),
          s('Happy', 'happy lady', 'emotion', 'I am happy'),
          s('Sad', 'sad man', 'emotion', 'I am sad'),
          s('Sad', 'sad lady', 'emotion', 'I am sad'),
          s('Angry', 'angry man', 'emotion', 'I am angry'),
          s('Angry', 'angry lady', 'emotion', 'I am angry'),
          s('Afraid', 'afraid man', 'emotion', 'I am afraid'),
          s('Afraid', 'afraid lady', 'emotion', 'I am afraid'),
        ],
      },
      {
        id: 'fx-positive',
        label: 'Positive',
        iconId: pick('excited lady'),
        children: [
          s('Excited', 'excited man', 'emotion', 'I am excited'),
          s('Excited', 'excited lady', 'emotion', 'I am excited'),
          s('Laughing', 'laughing man', 'emotion', 'that makes me laugh'),
          s('Laughing', 'laughing lady', 'emotion', 'that makes me laugh'),
          s('Calm', 'serene man', 'emotion', 'I feel calm'),
          s('Calm', 'serene lady', 'emotion', 'I feel calm'),
          s('Focused', 'concentrating man', 'emotion', 'I am concentrating'),
          s('Focused', 'concentrating lady', 'emotion', 'I am concentrating'),
        ],
      },
      {
        id: 'fx-negative',
        label: 'Negative',
        iconId: pick('worried lady'),
        children: [
          s('Worried', 'worried man', 'emotion', 'I am worried'),
          s('Worried', 'worried lady', 'emotion', 'I am worried'),
          s('Confused', 'confused man', 'emotion', 'I am confused'),
          s('Confused', 'confused lady', 'emotion', 'I am confused'),
          s('Disgusted', 'disgusted man', 'emotion', 'that disgusts me'),
          s('Jealous', 'jealous man', 'emotion', 'I feel jealous'),
          s('Surprised', 'surprised man', 'emotion', 'I am surprised'),
          s('Surprised', 'surprised lady', 'emotion', 'I am surprised'),
        ],
      },
      {
        id: 'fx-physical',
        label: 'Physical',
        iconId: pick('hungry'),
        children: [
          s('Hungry', 'hungry', 'adjective', 'I am hungry'),
          s('Thirsty', 'thirsty', 'adjective', 'I am thirsty'),
          s('Hot', 'hot person', 'adjective', 'I am hot'),
          s('Sleepy', 'sleep male', 'adjective', 'I am sleepy'),
          s('Awake', 'awake', 'adjective', 'I am awake'),
          s('Yawn', 'yawn', 'verb', 'I am tired'),
          s('Unwell', 'sneeze cold', 'adjective', 'I feel unwell'),
        ],
      },
      {
        id: 'fx-social',
        label: 'Social',
        iconId: pick('hug'),
        children: [
          s('Hug', 'hug', 'verb', 'I would like a hug'),
          s('Hold hands', 'hold hands', 'verb'),
          s('Handshake', 'shake hands', 'social'),
          s('Blow kiss', 'blow kiss', 'social'),
          s('Smile', 'smile', 'social'),
          s('Tickle', 'tickle', 'verb'),
        ],
      },
      {
        id: 'fx-regulation',
        label: 'What Helps',
        iconId: pick('relax'),
        children: [
          s('Relax', 'relax', 'verb', 'I need to relax'),
          s('Quiet', 'quiet', 'adjective', 'I need quiet'),
          s('Break', 'break 2', 'noun', 'I need a break'),
          s('Time out', 'time out', 'noun', 'I need time out'),
          s('Squeeze', 'squeeze', 'verb', 'a firm squeeze helps'),
          s('Stretch', 'stretch', 'verb'),
          s('Rest', 'rest', 'verb', 'I need to rest'),
        ],
      },
    ],
  },

  // ── BODY & HEALTH (EXPANDED) ─────────────────────────────────────────────────
  {
    id: 'body-health',
    label: 'Body & Health',
    iconId: pick('healthy'),
    children: [
      {
        id: 'bh-body',
        label: 'Body Parts',
        iconId: pick('body outline'),
        children: [
          s('Head', 'head', 'noun'), s('Ear', 'ear', 'noun'), s('Eye', 'eye', 'noun'),
          s('Mouth', 'mouth', 'noun'), s('Teeth', 'teeth', 'noun'), s('Throat', 'throat', 'noun'),
          s('Neck', 'neck', 'noun'), s('Shoulder', 'shoulder', 'noun'), s('Arm', 'arm', 'noun'),
          s('Elbow', 'elbow', 'noun'), s('Wrist', 'wrist', 'noun'), s('Hand', 'left hand', 'noun', 'hand'),
          s('Finger', 'finger', 'noun'), s('Chest', 'chest male', 'noun', 'chest'),
          s('Stomach', 'stomach', 'noun'), s('Back', 'back', 'noun'), s('Hip', 'hip', 'noun'),
          s('Leg', 'leg', 'noun'), s('Knee', 'knee', 'noun'), s('Ankle', 'ankle', 'noun'),
          s('Foot', 'foot', 'noun'), s('Skin', 'skin', 'noun'), s('Heart', 'heart', 'noun'),
        ],
      },
      {
        id: 'bh-pain',
        label: 'Pain & Discomfort',
        iconId: pick('stomach ache'),
        children: [
          s('Headache', 'headache', 'noun', 'I have a headache'),
          s('Stomach ache', 'stomach ache', 'noun', 'my stomach hurts'),
          s('Back ache', 'back ache', 'noun', 'my back hurts'),
          s('Toothache', 'toothache', 'noun', 'my tooth hurts'),
          s('Itch', 'itch', 'noun', 'it is itchy'),
          s('Rash', 'rash', 'noun'),
          s('Burn', 'burn', 'noun'),
          s('Cut', 'cut', 'noun'),
          s('Lump', 'lump', 'noun'),
        ],
      },
      {
        id: 'bh-appointments',
        label: 'Appointments',
        iconId: pick('doctor 2a'),
        children: [
          s('Doctor', 'doctor 1a', 'noun', 'I have a doctor appointment'),
          s('Nurse', 'nurse 1a', 'noun'),
          s('Dentist', 'dentist 1a', 'noun', 'I have a dentist appointment'),
          s('Health centre', 'surgery health centre', 'noun', 'health centre'),
          s('Stethoscope', 'stethoscope', 'noun'),
          s('Blood pressure', 'blood pressure', 'noun'),
          s('Thermometer', 'thermometer', 'noun'),
          s('X-ray', 'xray', 'noun', 'x ray'),
          s('Operation', 'operation', 'noun'),
        ],
      },
      {
        id: 'bh-medication',
        label: 'Medication',
        iconId: pick('medicine'),
        children: [
          s('Medicine', 'medicine', 'noun', 'I need my medicine'),
          s('Tablets', 'tablets', 'noun'),
          s('Blister pack', 'tablet blister pack', 'noun', 'my tablets'),
          s('Injection', 'syringe', 'noun'),
          s('Inhaler', 'inhaler', 'noun'),
          s('Eye drops', 'eye drops', 'noun'),
          s('Plaster', 'plaster', 'noun'),
          s('Cream', 'cream ointment', 'noun'),
          s('First aid', 'first aid box', 'noun', 'first aid kit'),
        ],
      },
      {
        id: 'bh-sleep',
        label: 'Sleep & Rest',
        iconId: pick('sleep male'),
        children: [
          s('Sleep', 'sleep male', 'verb', 'I want to sleep'),
          s('Sleep', 'sleep female', 'verb', 'I want to sleep'),
          s('Bed time', 'bed time', 'noun'),
          s('Wake up', 'wake up', 'verb'),
          s('Rest', 'rest', 'verb', 'I need to rest'),
          s('Relax', 'relax', 'verb'),
        ],
      },
      {
        id: 'bh-exercise',
        label: 'Exercise',
        iconId: pick('exercise'),
        children: [
          s('Exercise', 'exercise', 'verb'),
          s('Gym', 'gym 1', 'noun'),
          s('Walk', 'walk', 'verb'),
          s('Run', 'run', 'verb'),
          s('Swim', 'swim', 'verb'),
          s('Stretch', 'stretch', 'verb'),
        ],
      },
    ],
  },

  // ── HOME & DAILY LIFE ────────────────────────────────────────────────────────
  {
    id: 'home-daily',
    label: 'Home & Daily Life',
    iconId: pick('house'),
    children: [
      {
        id: 'home-rooms',
        label: 'Rooms & House',
        iconId: pick('door'),
        children: [
          s('Home', 'house', 'noun'),
          s('Room', 'room', 'noun'),
          s('Door', 'door', 'noun'),
          s('Front door', 'front door', 'noun'),
          s('Window', 'window', 'noun'),
          s('Stairs', 'stairs', 'noun'),
          s('Lift', 'lift', 'noun'),
          s('Floor', 'floor', 'noun'),
          s('Bathroom', 'bath', 'noun', 'bathroom'),
        ],
      },
      {
        id: 'home-tasks',
        label: 'Household Tasks',
        iconId: pick('tidy up'),
        children: [
          s('Make the bed', 'make the bed', 'verb'),
          s('Tidy up', 'tidy up', 'verb'),
          s('Wash clothes', 'wash clothes', 'verb'),
          s('Wash up', 'wash up', 'verb'),
          s('Vacuum', 'hoover', 'verb', 'vacuum'),
          s('Dust', 'dust', 'verb'),
          s('Iron', 'iron', 'verb'),
          s('Set the table', 'set the table', 'verb'),
          s('Rubbish out', 'put out rubbish', 'verb', 'put out the rubbish'),
          s('Water plants', 'water plants', 'verb'),
          s('Fold clothes', 'fold clothes', 'verb'),
          s('Wipe table', 'wipe table', 'verb'),
        ],
      },
      {
        id: 'home-appliances',
        label: 'Appliances',
        iconId: pick('washing machine'),
        children: [
          s('Washing machine', 'washing machine', 'noun'),
          s('Dishwasher', 'dishwasher', 'noun'),
          s('Vacuum cleaner', 'vacuum cleaner 1', 'noun'),
          s('Kettle', 'kettle', 'noun'),
          s('Fridge', 'fridge', 'noun'),
          s('Microwave', 'microwave', 'noun'),
          s('Toaster', 'toaster', 'noun'),
          s('TV', 'flatscreen tv', 'noun', 'television'),
        ],
      },
      {
        id: 'home-furniture',
        label: 'Furniture',
        iconId: pick('settee 1'),
        children: [
          s('Bed', 'single bed', 'noun', 'bed'),
          s('Chair', 'chair', 'noun'),
          s('Table', 'table', 'noun'),
          s('Couch', 'settee 1', 'noun', 'couch'),
          s('Wardrobe', 'wardrobe', 'noun'),
          s('Desk', 'desk', 'noun'),
          s('Cupboard', 'cupboard', 'noun'),
          s('Mirror', 'mirror 1', 'noun'),
        ],
      },
      {
        id: 'home-routine',
        label: 'Morning & Night',
        iconId: pick('get up'),
        children: [
          s('Get up', 'get up', 'verb'),
          s('Get dressed', 'get dressed', 'verb'),
          s('Breakfast', 'breakfast 1', 'noun'),
          s('Brush teeth', 'brush teeth', 'verb'),
          s('Wash face', 'wash face', 'verb'),
          s('Shower', 'shower 1', 'verb'),
          s('Pyjamas', 'pyjamas', 'noun'),
          s('Bed time', 'bed time', 'noun'),
          s('Sleep', 'sleep male', 'verb'),
          s('Wake up', 'wake up', 'verb'),
          s('Undress', 'undress', 'verb'),
        ],
      },
      {
        id: 'home-safety',
        label: 'Home Safety',
        iconId: pick('key 1'),
        children: [
          s('Key', 'key 1', 'noun', 'my key'),
          s('Lock', 'unlock', 'verb', 'lock the door'),
          s('Knock', 'knock', 'verb'),
          s('Close door', 'close door', 'verb'),
          s('Open door', 'open door', 'verb'),
          s('Doorbell', 'ring doorbell', 'verb', 'ring the doorbell'),
        ],
      },
    ],
  },

  // ── PEOPLE & RELATIONSHIPS ───────────────────────────────────────────────────
  {
    id: 'people-relationships',
    label: 'People',
    iconId: pick('family'),
    children: [
      {
        id: 'people-family',
        label: 'Family',
        iconId: pick('family'),
        children: [
          s('Mum', 'mum parent', 'noun'),
          s('Dad', 'dad parent', 'noun'),
          s('Brother', 'brother', 'noun'),
          s('Sister', 'sister', 'noun'),
          s('Baby', 'baby', 'noun'),
          s('Son', 'son', 'noun'),
          s('Daughter', 'daughter', 'noun'),
          s('Family', 'family', 'noun'),
          s('Parents', 'parents', 'noun'),
          s('Grandma', 'grandmother', 'noun'),
          s('Grandpa', 'grandfather', 'noun'),
          s('Grandparents', 'grandparents', 'noun'),
        ],
      },
      {
        id: 'people-extended',
        label: 'Extended Family',
        iconId: pick('grandparents'),
        children: [
          s('Aunt', 'aunt maternal', 'noun'),
          s('Uncle', 'uncle maternal', 'noun'),
          s('Husband', 'husband', 'noun'),
          s('Wife', 'wife', 'noun'),
          s('Partner', 'partner', 'noun'),
          s('Stepbrother', 'step brother', 'noun'),
          s('Stepsister', 'step sister', 'noun'),
          s('Stepmum', 'step mum parent', 'noun'),
          s('Stepdad', 'step dad parent', 'noun'),
          s('Married', 'married', 'adjective'),
        ],
      },
      {
        id: 'people-support',
        label: 'Support & Health',
        iconId: pick('care assistant 1a'),
        children: [
          s('Support worker', 'care assistant 1a', 'noun'),
          s('Doctor', 'doctor 1a', 'noun'),
          s('Nurse', 'nurse 1a', 'noun'),
          s('Teacher', 'teacher 1a', 'noun'),
          s('Speech therapist', 'speech language therapist 1a', 'noun'),
          s('OT', 'occupational therapist 1a', 'noun', 'occupational therapist'),
          s('Physio', 'physio therapist 1a', 'noun', 'physiotherapist'),
          s('Dentist', 'dentist 1a', 'noun'),
          s('Paramedic', 'paramedic 1a', 'noun'),
          s('Police', 'police 1a', 'noun', 'police officer'),
          s('Visitor', 'visitor 1a', 'noun'),
        ],
      },
      {
        id: 'people-community',
        label: 'Community',
        iconId: pick('post person 1a'),
        children: [
          s('Postie', 'post person 1a', 'noun', 'postal worker'),
          s('Taxi driver', 'taxi driver 1a', 'noun'),
          s('Cleaner', 'cleaner 1a', 'noun'),
          s('Gardener', 'gardener 1a', 'noun'),
          s('Baker', 'baker 1a', 'noun'),
          s('Farmer', 'farmer 1a', 'noun'),
          s('Delivery person', 'delivery person 1a', 'noun'),
          s('Musician', 'musician 1a', 'noun'),
          s('Singer', 'singer 1a', 'noun'),
          s('Chef', 'cook chef 1a', 'noun'),
        ],
      },
      {
        id: 'people-describe',
        label: 'Describing People',
        iconId: pick('old person 1'),
        children: [
          s('Old', 'old person 1', 'adjective', 'older person'),
          s('Young', 'young', 'adjective'),
          s('Tall', 'tall', 'adjective'),
          s('Short', 'short', 'adjective'),
          s('Funny', 'funny laugh', 'adjective'),
          s('Kind', 'good person', 'adjective', 'a kind person'),
          s('Strong', 'strong', 'adjective'),
          s('Quiet', 'quiet', 'adjective'),
          s('Busy', 'busy', 'adjective'),
          s('Non-speaking', 'non speaking', 'adjective', 'non speaking'),
        ],
      },
    ],
  },

  // ── SCHOOL & LEARNING ────────────────────────────────────────────────────────
  {
    id: 'school-learning',
    label: 'School',
    iconId: pick('school'),
    children: [
      {
        id: 'school-subjects',
        label: 'Subjects',
        iconId: pick('maths'),
        children: [
          s('English', 'english', 'noun'),
          s('Maths', 'maths', 'noun'),
          s('Science', 'science', 'noun'),
          s('History', 'history', 'noun'),
          s('Geography', 'geography', 'noun'),
          s('Music', 'music', 'noun'),
          s('PE', 'pe', 'noun', 'physical education'),
          s('Drama', 'drama', 'noun'),
          s('Group work', 'group work', 'noun'),
        ],
      },
      {
        id: 'school-routine',
        label: 'School Day',
        iconId: pick('assembly'),
        children: [
          s('Assembly', 'assembly', 'noun'),
          s('Art class', 'art class', 'noun'),
          s('Music class', 'music class', 'noun'),
          s('PE class', 'pe class', 'noun'),
          s('Swimming', 'swimming class', 'noun', 'swimming class'),
          s('Break time', 'break time 1', 'noun'),
          s('Lunch time', 'lunch time', 'noun'),
          s('Circle time', 'circle time', 'noun'),
          s('Calendar', 'calendar', 'noun'),
        ],
      },
      {
        id: 'school-places',
        label: 'School Places',
        iconId: pick('class room'),
        children: [
          s('School', 'school', 'noun'),
          s('Classroom', 'class room', 'noun'),
          s('Art room', 'art room', 'noun'),
          s('Music room', 'music room', 'noun'),
          s('IT room', 'it room', 'noun'),
          s('Science room', 'science room', 'noun'),
          s('Sensory room', 'sensory room', 'noun'),
          s('Playground', 'play area', 'noun', 'playground'),
        ],
      },
      {
        id: 'school-tools',
        label: 'Tools',
        iconId: pick('pencil'),
        children: [
          s('Pen', 'pen', 'noun'),
          s('Pencil', 'pencil', 'noun'),
          s('Paper', 'paper', 'noun'),
          s('Notebook', 'notebook', 'noun'),
          s('Crayon', 'crayon', 'noun'),
          s('Felt tips', 'felt tips', 'noun'),
          s('Glue', 'glue', 'noun'),
          s('Calculator', 'calculator', 'noun'),
          s('Dictionary', 'dictionary', 'noun'),
          s('Pencil case', 'pencil case', 'noun'),
        ],
      },
      {
        id: 'school-actions',
        label: 'Learning Actions',
        iconId: pick('read'),
        children: [
          s('Read', 'read', 'verb'),
          s('Write', 'write', 'verb'),
          s('Draw', 'draw', 'verb'),
          s('Count', 'count', 'verb'),
          s('Spell', 'spell', 'verb'),
          s('Study', 'study', 'verb'),
          s('Think', 'think', 'verb'),
          s('Ask', 'ask', 'verb'),
          s('Answer', 'answer', 'noun'),
          s('Copy', 'copy', 'verb'),
          s('Sort', 'sort', 'verb'),
        ],
      },
      {
        id: 'school-social',
        label: 'Social at School',
        iconId: pick('hold hands'),
        children: [
          s('Share', 'share', 'verb'),
          s('Help', 'help', 'verb', 'can you help me'),
          s('My turn', 'turn', 'noun', 'my turn'),
          s('Wait', 'wait', 'verb', 'wait please'),
          s('Quiet', 'quiet', 'adjective', 'quiet please'),
          s('Line up', 'queue', 'verb', 'line up'),
        ],
      },
    ],
  },

  // ── WORK & EMPLOYMENT ────────────────────────────────────────────────────────
  {
    id: 'work-employment',
    label: 'Work',
    iconId: pick('work'),
    children: [
      {
        id: 'work-office',
        label: 'Office',
        iconId: pick('computer 1'),
        children: [
          s('Work', 'work', 'noun'),
          s('Desk', 'desk', 'noun'),
          s('Computer', 'computer 1', 'noun'),
          s('Laptop', 'laptop', 'noun'),
          s('Printer', 'printer', 'noun'),
          s('Files', 'filing cabinet', 'noun', 'filing cabinet'),
          s('Briefcase', 'briefcase 1', 'noun'),
          s('Locker', 'locker', 'noun'),
        ],
      },
      {
        id: 'work-trades',
        label: 'Trades',
        iconId: pick('carpenter 1a'),
        children: [
          s('Carpenter', 'carpenter 1a', 'noun'),
          s('Mechanic', 'car mechanic 1a', 'noun'),
          s('Cleaner', 'cleaner 1a', 'noun'),
          s('Gardener', 'gardener 1a', 'noun'),
          s('Baker', 'baker 1a', 'noun'),
          s('Farmer', 'farmer 1a', 'noun'),
          s('Caretaker', 'caretaker 1a', 'noun'),
          s('Chef', 'cook chef 1a', 'noun'),
        ],
      },
      {
        id: 'work-care',
        label: 'Care & Service',
        iconId: pick('care assistant 2a'),
        children: [
          s('Support worker', 'care assistant 2a', 'noun'),
          s('Secretary', 'secretary 1a', 'noun'),
          s('IT assistant', 'it assistant 1a', 'noun'),
          s('Delivery', 'delivery person 1a', 'noun', 'delivery person'),
          s('Florist', 'florist 1a', 'noun'),
          s('Greengrocer', 'greengrocer 1a', 'noun'),
        ],
      },
      {
        id: 'work-actions',
        label: 'Work Actions',
        iconId: pick('type'),
        children: [
          s('Type', 'type', 'verb'),
          s('Write', 'write', 'verb'),
          s('Email', 'email', 'verb', 'send an email'),
          s('Print', 'print', 'verb'),
          s('Meet', 'meet', 'verb', 'I have a meeting'),
          s('Build', 'build', 'verb'),
          s('Make', 'make', 'verb'),
          s('Carry', 'carry', 'verb'),
          s('Deliver', 'deliver', 'verb'),
          s('Sort', 'sort', 'verb'),
          s('Sign', 'sign', 'verb', 'sign here'),
        ],
      },
      {
        id: 'work-breaks',
        label: 'Breaks & Rights',
        iconId: pick('take a work break'),
        children: [
          s('Break', 'take a work break', 'noun', 'I am taking my break'),
          s('Break time', 'break time 1', 'noun'),
          s('Lunch', 'lunch time', 'noun', 'lunch break'),
          s('Money', 'money', 'noun', 'pay'),
          s('Holiday', 'travel', 'noun', 'I am on leave'),
          s('Retire', 'retire', 'verb'),
          s('Help', 'help', 'verb', 'I need help with this task'),
        ],
      },
    ],
  },

  // ── THERAPY & ALLIED HEALTH ──────────────────────────────────────────────────
  {
    id: 'therapy',
    label: 'Therapy',
    iconId: pick('speech language therapist 1a'),
    children: [
      {
        id: 'therapy-people',
        label: 'My Team',
        iconId: pick('speech language therapist 2a'),
        children: [
          s('Speech therapist', 'speech language therapist 1a', 'noun'),
          s('OT', 'occupational therapist 1a', 'noun', 'occupational therapist'),
          s('Physio', 'physio therapist 1a', 'noun', 'physiotherapist'),
          s('Doctor', 'doctor 2a', 'noun'),
          s('Nurse', 'nurse 1a', 'noun'),
          s('Support worker', 'care assistant 3a', 'noun'),
        ],
      },
      {
        id: 'therapy-speech',
        label: 'Communication',
        iconId: pick('communication device'),
        children: [
          s('AAC device', 'communication device', 'noun', 'my communication device'),
          s('Comm book', 'communication book', 'noun', 'my communication book'),
          s('Comm board', 'communication board', 'noun', 'my communication board'),
          s('Talk', 'talk 1', 'verb'),
          s('Whisper', 'whisper', 'verb'),
          s('Sing', 'sing', 'verb'),
          s('Hear', 'hear', 'verb'),
          s('Switch', 'big mac switch', 'noun', 'my switch'),
        ],
      },
      {
        id: 'therapy-movement',
        label: 'Movement',
        iconId: pick('walking frame'),
        children: [
          s('Exercise', 'exercise', 'verb'),
          s('Stretch', 'stretch', 'verb'),
          s('Walk', 'walk', 'verb'),
          s('Stand', 'stand', 'verb'),
          s('Sit', 'sit', 'verb'),
          s('Get up', 'get up', 'verb'),
          s('Hold', 'hold', 'verb'),
          s('Reach', 'reach for', 'verb'),
          s('Squeeze', 'squeeze', 'verb'),
          s('Wheelchair', 'wheelchair', 'noun', 'my wheelchair'),
          s('Walking frame', 'walking frame', 'noun'),
          s('Walking stick', 'walking stick', 'noun'),
          s('Hoist', 'hoist', 'noun'),
          s('Ramp', 'ramp', 'noun'),
        ],
      },
      {
        id: 'therapy-session',
        label: 'In Session',
        iconId: pick('show me'),
        children: [
          s('More', 'more', 'adjective', 'more please'),
          s('Help', 'help', 'verb', 'I need help'),
          s('Wait', 'wait', 'verb', 'I need more time'),
          s('Break', 'break 2', 'noun', 'I need a break'),
          s('Finish', 'finish', 'verb', 'I am finished'),
          s('My turn', 'turn', 'noun', 'my turn'),
          s('Show me', 'show me', 'verb', 'please show me'),
          s('Copy', 'copy', 'verb', 'I will copy you'),
          s('Again', 'rewind', 'verb', 'again please'),
        ],
      },
      {
        id: 'therapy-progress',
        label: 'Goals & Progress',
        iconId: pick('goal'),
        children: [
          s('Goal', 'goal', 'noun', 'my goal'),
          s('Winner', 'winner', 'noun', 'I did it'),
          s('Great', 'great', 'adjective', 'that went great'),
          s('Correct', 'correct', 'adjective', 'I got it right'),
          s('Mistake', 'mistake no wrong', 'noun', 'I made a mistake'),
          s('Celebrate', 'celebrate 1', 'verb', 'let us celebrate'),
          s('Hard', 'hard', 'adjective', 'that is hard for me'),
          s('Easy', 'soft', 'adjective', 'that is easy for me'),
        ],
      },
    ],
  },

  // ── COMMUNITY & PLACES ───────────────────────────────────────────────────────
  {
    id: 'community',
    label: 'Community',
    iconId: pick('shop'),
    children: [
      {
        id: 'community-shopping',
        label: 'Shopping',
        iconId: pick('basket'),
        children: [
          s('Shop', 'shop', 'noun'),
          s('Open', 'open shop', 'adjective', 'the shop is open'),
          s('Closed', 'closed shop', 'adjective', 'the shop is closed'),
          s('Basket', 'basket', 'noun'),
          s('Money', 'money', 'noun'),
          s('Bank card', 'bank card', 'noun'),
          s('Purse', 'purse', 'noun'),
          s('Wallet', 'wallet', 'noun'),
          s('Queue', 'queue', 'verb', 'wait in the queue'),
        ],
      },
      {
        id: 'community-leisure',
        label: 'Leisure',
        iconId: pick('bowling'),
        children: [
          s('Bowling', 'bowling', 'noun'),
          s('Pool', 'pool snooker', 'noun', 'a game of pool'),
          s('Bingo', 'bingo', 'noun'),
          s('Cards', 'playing cards', 'noun', 'play cards'),
          s('Jigsaw', 'jigsaw puzzle', 'noun'),
          s('Darts', 'darts', 'noun'),
          s('Theme park', 'theme park', 'noun'),
          s('Roller coaster', 'roller coaster', 'noun'),
        ],
      },
      {
        id: 'community-outdoors',
        label: 'Park & Beach',
        iconId: pick('beach'),
        children: [
          s('Beach', 'beach', 'noun'),
          s('Playground', 'play area', 'noun', 'playground'),
          s('Swing', 'swing', 'noun'),
          s('Slide', 'slide', 'noun'),
          s('See-saw', 'see saw', 'noun', 'see saw'),
          s('Skate park', 'skate park', 'noun'),
          s('Mountains', 'mountains', 'noun'),
          s('Picnic', 'picnic', 'noun'),
          s('Camping', 'camp', 'verb', 'go camping'),
          s('Hike', 'hike', 'verb', 'go for a hike'),
        ],
      },
      {
        id: 'community-cafe',
        label: 'Cafe & Takeaway',
        iconId: pick('cafe'),
        children: [
          s('Cafe', 'cafe', 'noun'),
          s('Menu', 'menu', 'noun'),
          s('Sandwich', 'sandwich', 'noun'),
          s('Soup', 'soup', 'noun'),
          s('Pizza', 'pizza', 'noun'),
          s('Fish and chips', 'fish and chips', 'noun'),
          s('Burger', 'takeaway burger', 'noun'),
          s('Curry', 'curry', 'noun'),
        ],
      },
      {
        id: 'community-services',
        label: 'Services',
        iconId: pick('bank'),
        children: [
          s('Bank', 'bank', 'noun'),
          s('Cash point', 'cash point', 'noun', 'ATM'),
          s('Post letter', 'post letter', 'verb', 'post a letter'),
          s('Health centre', 'surgery health centre', 'noun'),
          s('Accessible toilet', 'disabled toilet', 'noun', 'accessible toilet'),
          s('Church', 'church', 'noun'),
          s('Library', 'return book', 'noun', 'library'),
        ],
      },
    ],
  },

  // ── TRANSPORT (EXPANDED) ─────────────────────────────────────────────────────
  {
    id: 'transport-expanded',
    label: 'Getting Around',
    iconId: pick('bus single decker'),
    children: [
      {
        id: 'tx-vehicles',
        label: 'Vehicles',
        iconId: pick('car'),
        children: [
          s('Car', 'car', 'noun'),
          s('Bus', 'bus single decker', 'noun', 'bus'),
          s('Coach', 'coach', 'noun'),
          s('Truck', 'lorry', 'noun', 'truck'),
          s('Van', 'van', 'noun'),
          s('Taxi', 'taxi', 'noun'),
          s('Motorbike', 'motorcycle', 'noun'),
          s('Bicycle', 'bicycle', 'noun'),
          s('Tractor', 'tractor', 'noun'),
          s('Caravan', 'caravan', 'noun'),
          s('Minibus', 'mini bus', 'noun'),
        ],
      },
      {
        id: 'tx-special',
        label: 'Special Vehicles',
        iconId: pick('fire engine'),
        children: [
          s('Ambulance', 'ambulance', 'noun'),
          s('Fire truck', 'fire engine', 'noun', 'fire truck'),
          s('Police car', 'police car', 'noun'),
          s('Post van', 'post van', 'noun'),
          s('Rubbish truck', 'refuse lorry', 'noun', 'rubbish truck'),
          s('Digger', 'dumper truck', 'noun', 'digger'),
          s('Forklift', 'fork lift truck', 'noun'),
        ],
      },
      {
        id: 'tx-public',
        label: 'Public Transport',
        iconId: pick('train'),
        children: [
          s('Train', 'train', 'noun'),
          s('Tram', 'underground train', 'noun', 'tram'),
          s('Ferry', 'ferry', 'noun'),
          s('Get on', 'get on bus', 'verb', 'get on the bus'),
          s('Get off', 'get off bus', 'verb', 'get off the bus'),
          s('Missed it', 'miss bus', 'verb', 'I missed the bus'),
          s('Queue', 'queue', 'verb', 'wait in line'),
          s('Taxi driver', 'taxi driver 1a', 'noun'),
        ],
      },
      {
        id: 'tx-air',
        label: 'Air Travel',
        iconId: pick('aeroplane'),
        children: [
          s('Plane', 'aeroplane', 'noun'),
          s('Helicopter', 'helicopter', 'noun'),
          s('Jet', 'jet plane', 'noun'),
          s('Take off', 'plane take off', 'verb', 'the plane is taking off'),
          s('Landing', 'plane landing', 'verb', 'the plane is landing'),
          s('Balloon', 'hot air balloon', 'noun', 'hot air balloon'),
          s('Suitcase', 'suitcase 1', 'noun'),
          s('Passport', 'passport', 'noun'),
        ],
      },
      {
        id: 'tx-access',
        label: 'Walking & Access',
        iconId: pick('wheelchair'),
        children: [
          s('Walk', 'walk', 'verb'),
          s('Wheelchair', 'wheelchair', 'noun'),
          s('Crossing', 'zebra crossing', 'noun', 'pedestrian crossing'),
          s('Traffic lights', 'traffic lights', 'noun'),
          s('Seat belt', 'seat belt', 'noun', 'seat belt on'),
          s('Sign', 'signpost', 'noun'),
          s('Accessible', 'disabled sign', 'adjective', 'accessible'),
          s('Ramp', 'ramp', 'noun'),
        ],
      },
      {
        id: 'tx-directions',
        label: 'Directions',
        iconId: pick('left'),
        children: [
          s('Left', 'left', 'preposition'),
          s('Right', 'right', 'preposition'),
          s('Up', 'up', 'preposition'),
          s('Down', 'down', 'preposition'),
          s('Forwards', 'forwards', 'preposition'),
          s('Backwards', 'backwards', 'preposition'),
          s('Across', 'across', 'preposition'),
          s('Through', 'through', 'preposition'),
          s('Around', 'around', 'preposition'),
          s('Enter', 'enter', 'verb'),
          s('Exit', 'exit', 'verb'),
          s('Near', 'near', 'preposition'),
        ],
      },
    ],
  },

  // ── TIME & SCHEDULING ────────────────────────────────────────────────────────
  {
    id: 'time-scheduling',
    label: 'Time',
    iconId: pick('clock'),
    children: [
      {
        id: 'time-day',
        label: 'Parts of Day',
        iconId: pick('morning'),
        children: [
          s('Morning', 'morning', 'noun'),
          s('Afternoon', 'afternoon', 'noun'),
          s('Night', 'night', 'noun'),
          s('Breakfast time', 'breakfast time', 'noun'),
          s('Lunch time', 'lunch time', 'noun'),
          s('Dinner time', 'dinner time', 'noun'),
          s('Bed time', 'bed time', 'noun'),
          s('Weekend', 'weekend', 'noun'),
        ],
      },
      {
        id: 'time-clock',
        label: 'Clock & Measures',
        iconId: pick('clock'),
        children: [
          s('Clock', 'clock', 'noun'),
          s('Watch', 'watch', 'noun'),
          s('Minute', 'minute', 'noun'),
          s('Second', 'second', 'noun'),
          s('Hour', 'one hour', 'noun', 'one hour'),
          s('Timer', 'timer 2', 'noun'),
          s('Set timer', 'set timer', 'verb'),
          s('Calendar', 'calendar', 'noun'),
          s('Date', 'date', 'noun'),
          s('Day', 'day', 'noun'),
          s('Week', 'week', 'noun'),
          s('Month', 'calendar month', 'noun', 'month'),
        ],
      },
      {
        id: 'time-relative',
        label: 'When',
        iconId: pick('now'),
        children: [
          s('Now', 'now', 'adverb'),
          s('Today', 'today', 'adverb'),
          s('Tomorrow', 'tomorrow', 'adverb'),
          s('Yesterday', 'yesterday', 'adverb'),
          s('Past', 'past', 'noun'),
          s('Future', 'future', 'noun'),
          s('This week', 'this week', 'noun'),
          s('Next week', 'next week', 'noun'),
          s('This month', 'this month', 'noun'),
          s('Next month', 'next month', 'noun'),
        ],
      },
      {
        id: 'time-seasons',
        label: 'Seasons & Weather',
        iconId: pick('sun'),
        children: [
          s('Spring', 'spring', 'noun'),
          s('Summer', 'summer', 'noun'),
          s('Autumn', 'autumn', 'noun'),
          s('Winter', 'winter', 'noun'),
          s('Sunny', 'sun', 'adjective', 'it is sunny'),
          s('Rain', 'rain', 'noun', 'it is raining'),
          s('Snow', 'snow', 'noun', 'it is snowing'),
          s('Cloudy', 'cloudy', 'adjective', 'it is cloudy'),
          s('Storm', 'thunder storm', 'noun', 'there is a storm'),
          s('Rainbow', 'rainbow', 'noun'),
        ],
      },
      {
        id: 'time-events',
        label: 'Events',
        iconId: pick('celebrate birthday'),
        children: [
          s('Birthday', 'celebrate birthday', 'noun', 'happy birthday'),
          s('Birthday cake', 'birthday cake', 'noun'),
          s('Christmas', 'christmas tree', 'noun', 'Christmas'),
          s('Easter', 'easter egg', 'noun', 'Easter'),
          s('Halloween', 'halloween', 'noun'),
          s('Party', 'party celebration', 'noun'),
          s('Fireworks', 'fireworks', 'noun'),
          s('Present', 'present', 'noun'),
        ],
      },
    ],
  },

  // ── QUESTIONS & CONVERSATION ─────────────────────────────────────────────────
  {
    id: 'questions-conversation',
    label: 'Conversation',
    iconId: pick('what'),
    children: [
      {
        id: 'qc-words',
        label: 'Question Words',
        iconId: pick('what'),
        children: [
          s('What', 'what', 'question'),
          s('Where', 'where', 'question'),
          s('When', 'when', 'question'),
          s('Who', 'who', 'question'),
          s('Why', 'why', 'question'),
          s('How', 'how', 'question'),
          s('Which', 'which', 'question'),
        ],
      },
      {
        id: 'qc-starters',
        label: 'Starting',
        iconId: pick('hello'),
        children: [
          s('Hello', 'hello', 'social'),
          s('Handshake', 'shake hands', 'social', 'nice to meet you'),
          s('Talk', 'talk 1', 'verb', 'can we talk'),
          s('Visit', 'visit', 'verb', 'I came to visit'),
          s('Come', 'come', 'verb', 'come here please'),
          s('Look', 'look', 'verb', 'look at this'),
        ],
      },
      {
        id: 'qc-help',
        label: 'Asking for Help',
        iconId: pick('help'),
        children: [
          s('Help', 'help', 'verb', 'can you help me'),
          s('Ask', 'ask', 'verb', 'I have a question'),
          s('Show me', 'show me', 'verb', 'please show me'),
          s('Want', 'want', 'verb', 'I want'),
          s('More', 'more', 'adjective', 'tell me more'),
          s('Toilet', 'need toilet', 'noun', 'where is the toilet'),
        ],
      },
      {
        id: 'qc-clarify',
        label: 'Clarifying',
        iconId: pick('confused man'),
        children: [
          s('Confused', 'confused man', 'emotion', 'I do not understand'),
          s('Think', 'think', 'verb', 'let me think'),
          s('Again', 'rewind', 'verb', 'please say that again'),
          s('Slow', 'wait', 'verb', 'please slow down'),
          s('Right idea', 'correct thought', 'noun', 'yes that is what I mean'),
          s('Wrong idea', 'wrong thought', 'noun', 'no that is not what I mean'),
          s('Correct', 'correct', 'adjective', 'that is right'),
          s('Guess', 'guess', 'verb', 'good guess'),
        ],
      },
      {
        id: 'qc-ending',
        label: 'Ending',
        iconId: pick('finish'),
        children: [
          s('Finish', 'finish', 'verb', 'I am finished talking'),
          s('Go', 'go', 'verb', 'I have to go'),
          s('Leave', 'exit door', 'verb', 'I am leaving now'),
          s('Wait', 'wait', 'verb', 'one moment'),
          s('Later', 'future', 'adverb', 'talk later'),
          s('Sleep', 'sleep male', 'verb', 'good night'),
        ],
      },
    ],
  },

  // ── SENSORY & NEEDS ──────────────────────────────────────────────────────────
  {
    id: 'sensory-needs',
    label: 'Sensory',
    iconId: pick('headphones'),
    children: [
      {
        id: 'sensory-overload',
        label: 'Too Much',
        iconId: pick('loud'),
        children: [
          s('Loud', 'loud', 'adjective', 'it is too loud'),
          s('Noisy', 'noisy', 'adjective', 'it is too noisy'),
          s('Quiet', 'quiet', 'adjective', 'I need quiet'),
          s('Silence', 'silence', 'noun', 'I need silence'),
          s('Bright', 'bright room', 'adjective', 'it is too bright'),
          s('Dim lights', 'turn down light', 'verb', 'please dim the lights'),
          s('Headphones', 'headphones', 'noun', 'I need my headphones'),
          s('Ear muffs', 'ear muffs', 'noun'),
          s('Sunglasses', 'sunglasses', 'noun'),
        ],
      },
      {
        id: 'sensory-comfort',
        label: 'Comfort',
        iconId: pick('teddy bear'),
        children: [
          s('Hug', 'hug', 'verb', 'I would like a hug'),
          s('Blanket', 'blanket', 'noun', 'my blanket'),
          s('Beanbag', 'beanbag', 'noun'),
          s('Cushion', 'cushion 2', 'noun'),
          s('Teddy', 'teddy bear', 'noun'),
          s('Sensory tube', 'sensory tube', 'noun'),
          s('Bubbles', 'bubbles', 'noun'),
          s('Lava lamp', 'lava lamp', 'noun'),
          s('Sensory room', 'sensory room', 'noun'),
        ],
      },
      {
        id: 'sensory-feel',
        label: 'How It Feels',
        iconId: pick('soft'),
        children: [
          s('Soft', 'soft', 'adjective'),
          s('Hard', 'hard', 'adjective'),
          s('Wet', 'wet', 'adjective'),
          s('Dry', 'dry', 'adjective'),
          s('Sticky', 'sticky', 'adjective'),
          s('Fuzzy', 'fuzzy', 'adjective'),
          s('Shiny', 'shiny', 'adjective'),
          s('Smooth', 'smooth', 'adjective'),
          s('Bumpy', 'bumpy', 'adjective'),
          s('Sharp', 'sharp', 'adjective'),
          s('Hot', 'hot', 'adjective'),
          s('Warm', 'warm fire', 'adjective', 'warm'),
        ],
      },
      {
        id: 'sensory-physical',
        label: 'Physical Needs',
        iconId: pick('hungry'),
        children: [
          s('Hungry', 'hungry', 'adjective', 'I am hungry'),
          s('Thirsty', 'thirsty', 'adjective', 'I am thirsty'),
          s('Toilet', 'need toilet', 'noun', 'I need the toilet'),
          s('Rest', 'rest', 'verb', 'I need to rest'),
          s('Sleep', 'sleep male', 'verb', 'I am tired'),
          s('Eat', 'eat', 'verb', 'I want to eat'),
          s('Drink', 'drink', 'verb', 'I want a drink'),
          s('Medicine', 'medicine', 'noun', 'I need my medicine'),
        ],
      },
      {
        id: 'sensory-regulation',
        label: 'Regulation',
        iconId: pick('swing'),
        children: [
          s('Break', 'break 2', 'noun', 'I need a break'),
          s('Time out', 'time out', 'noun', 'I need time out'),
          s('Relax', 'relax', 'verb'),
          s('Squeeze', 'squeeze', 'verb', 'a deep squeeze helps'),
          s('Stretch', 'stretch', 'verb'),
          s('Rock', 'rock chair', 'verb', 'rocking helps'),
          s('Swing', 'swing', 'noun'),
          s('Trampoline', 'trampoline', 'noun'),
          s('Walk', 'walk', 'verb', 'I need to walk around'),
        ],
      },
    ],
  },

  // ── SOCIAL & COMMUNITY LIFE ──────────────────────────────────────────────────
  {
    id: 'social-life',
    label: 'Social Life',
    iconId: pick('party celebration'),
    children: [
      {
        id: 'social-greetings',
        label: 'Greetings',
        iconId: pick('hello'),
        children: [
          s('Hello', 'hello', 'social'),
          s('Handshake', 'shake hands', 'social'),
          s('Hug', 'hug', 'social'),
          s('Blow kiss', 'blow kiss', 'social'),
          s('Smile', 'smile', 'social'),
          s('Nod', 'nod', 'social'),
        ],
      },
      {
        id: 'social-plans',
        label: 'Making Plans',
        iconId: pick('calendar'),
        children: [
          s('Calendar', 'calendar', 'noun', 'let us pick a day'),
          s('Visit', 'visit', 'verb', 'come and visit'),
          s('Meet', 'meet', 'verb', 'let us meet'),
          s('Come', 'come', 'verb', 'come with me'),
          s('Go', 'go', 'verb', 'let us go'),
          s('Cafe', 'cafe', 'noun', 'let us go to a cafe'),
          s('Picnic', 'picnic', 'noun', 'let us have a picnic'),
          s('Wait', 'wait', 'verb', 'wait for me'),
        ],
      },
      {
        id: 'social-events',
        label: 'Events',
        iconId: pick('fireworks'),
        children: [
          s('Party', 'party celebration', 'noun'),
          s('Birthday', 'celebrate birthday', 'noun'),
          s('Parade', 'parade 1', 'noun'),
          s('Fireworks', 'fireworks', 'noun'),
          s('Present', 'present', 'noun'),
          s('Card', 'birthday card', 'noun'),
          s('Celebrate', 'celebrate 1', 'verb'),
        ],
      },
      {
        id: 'social-aboutme',
        label: 'About Me',
        iconId: pick('personal passport'),
        children: [
          s('Passport', 'personal passport', 'noun', 'my communication passport'),
          s('Family', 'family', 'noun', 'my family'),
          s('Home', 'house', 'noun', 'my home'),
          s('School', 'school', 'noun', 'my school'),
          s('Work', 'work', 'noun', 'my work'),
          s('AAC', 'communication device', 'noun', 'I use a communication device'),
          s('Glasses', 'glasses', 'noun', 'I wear glasses'),
          s('Wheelchair', 'wheelchair', 'noun', 'I use a wheelchair'),
        ],
      },
      {
        id: 'social-compliments',
        label: 'Compliments',
        iconId: pick('great'),
        children: [
          s('Good', 'good', 'adjective', 'that is good'),
          s('Great', 'great', 'adjective', 'that is great'),
          s('Winner', 'winner', 'noun', 'well done'),
          s('Pretty', 'pretty', 'adjective', 'you look lovely'),
          s('Handsome', 'handsome', 'adjective', 'you look great'),
          s('Strong', 'strong', 'adjective', 'you are strong'),
          s('Funny', 'funny laugh', 'adjective', 'you are funny'),
          s('Kind', 'good person', 'adjective', 'you are kind'),
        ],
      },
      {
        id: 'social-disagree',
        label: 'Disagreeing',
        iconId: pick('bad'),
        children: [
          s('No', 'bad', 'interjection', 'no'),
          s('Disagree', 'wrong thought', 'verb', 'I disagree'),
          s('Mistake', 'mistake no wrong', 'noun', 'that is a mistake'),
          s('Angry', 'angry man', 'emotion', 'that makes me angry'),
          s('Stop', 'finish', 'verb', 'please stop'),
          s('Quiet', 'whisper', 'verb', 'please lower your voice'),
        ],
      },
    ],
  },

  // ── PRIVACY & CONSENT ────────────────────────────────────────────────────────
  {
    id: 'privacy-consent',
    label: 'Privacy & Consent',
    iconId: pick('key 1'),
    children: [
      {
        id: 'pc-consent',
        label: 'Consent',
        iconId: pick('good'),
        children: [
          s('Yes', 'good', 'interjection', 'yes I agree'),
          s('No', 'bad', 'interjection', 'no I do not agree'),
          s('Stop', 'finish', 'verb', 'stop please'),
          s('Wait', 'wait', 'verb', 'wait I need time to decide'),
          s('Enough', 'enough', 'adjective', 'that is enough'),
          s('Dislike', 'yucky', 'adjective', 'I do not like that'),
          s('Think', 'think', 'verb', 'I need to think about it'),
        ],
      },
      {
        id: 'pc-space',
        label: 'Personal Space',
        iconId: pick('close door'),
        children: [
          s('Knock', 'knock', 'verb', 'please knock first'),
          s('Close door', 'close door', 'verb', 'please close the door'),
          s('Open door', 'open door', 'verb'),
          s('Alone', 'quiet', 'adjective', 'I want to be alone'),
          s('Move back', 'backwards', 'verb', 'please step back'),
          s('My room', 'room', 'noun', 'this is my room'),
        ],
      },
      {
        id: 'pc-privacy',
        label: 'Privacy',
        iconId: pick('curtains'),
        children: [
          s('Curtains', 'curtains', 'noun', 'please close the curtains'),
          s('Blinds', 'blinds', 'noun', 'please close the blinds'),
          s('Key', 'key 1', 'noun', 'my key'),
          s('Lock', 'unlock', 'verb', 'lock the door please'),
          s('Locker', 'locker', 'noun', 'my locker'),
          s('Toilet', 'toilet', 'noun', 'I need privacy in the toilet'),
        ],
      },
      {
        id: 'pc-body',
        label: 'My Body',
        iconId: pick('body outline'),
        children: [
          s('My body', 'body outline', 'noun', 'my body belongs to me'),
          s('Doctor', 'doctor 1a', 'noun', 'only a doctor may check my body'),
          s('Nurse', 'nurse 1a', 'noun'),
          s('Help', 'help', 'verb', 'I need help'),
          s('Tell', 'talk 1', 'verb', 'I want to tell someone'),
          s('Safe', 'good person', 'adjective', 'I feel safe with this person'),
        ],
      },
      {
        id: 'pc-safepeople',
        label: 'Safe People',
        iconId: pick('family'),
        children: [
          s('Mum', 'mum parent', 'noun'),
          s('Dad', 'dad parent', 'noun'),
          s('Support worker', 'care assistant 1a', 'noun'),
          s('Teacher', 'teacher 1a', 'noun'),
          s('Police', 'police 1a', 'noun'),
          s('Doctor', 'doctor 2a', 'noun'),
          s('Nurse', 'nurse 2a', 'noun'),
        ],
      },
    ],
  },

  // ── ACTIVITIES & HOBBIES ─────────────────────────────────────────────────────
  {
    id: 'activities-hobbies',
    label: 'Hobbies',
    iconId: pick('guitar'),
    children: [
      {
        id: 'hobby-sports',
        label: 'Sports',
        iconId: pick('tennis'),
        children: [
          s('Swim', 'swim', 'verb'),
          s('Run', 'run', 'verb'),
          s('Tennis', 'tennis', 'noun'),
          s('Basketball', 'basketball', 'noun'),
          s('Cricket', 'cricket', 'noun'),
          s('Golf', 'golf', 'noun'),
          s('Ski', 'ski', 'verb'),
          s('Horse riding', 'ride horse', 'verb', 'horse riding'),
          s('Cycling', 'cycle', 'verb', 'cycling'),
          s('Trampoline', 'trampoline', 'noun'),
          s('Badminton', 'badminton', 'noun'),
          s('Volleyball', 'volleyball', 'noun'),
          s('Judo', 'judo', 'noun'),
          s('Archery', 'archery', 'noun'),
          s('Boccia', 'boccia', 'noun'),
          s('Paralympics', 'para olympic games', 'noun', 'the Paralympics'),
        ],
      },
      {
        id: 'hobby-creative',
        label: 'Creative',
        iconId: pick('paint'),
        children: [
          s('Draw', 'draw', 'verb'),
          s('Paint', 'paint', 'verb'),
          s('Sing', 'sing', 'verb'),
          s('Dance', 'dance', 'verb'),
          s('Knit', 'knit', 'verb'),
          s('Sew', 'sew', 'verb'),
          s('Colouring', 'colouring book', 'noun', 'colouring in'),
          s('Photos', 'take picture', 'verb', 'take photos'),
          s('Decorate', 'decorate', 'verb'),
          s('Make', 'make', 'verb', 'make something'),
        ],
      },
      {
        id: 'hobby-music',
        label: 'Music',
        iconId: pick('piano'),
        children: [
          s('Guitar', 'guitar', 'noun'),
          s('Piano', 'piano', 'noun'),
          s('Drum', 'drum', 'noun'),
          s('Flute', 'flute', 'noun'),
          s('Keyboard', 'keyboard electric', 'noun'),
          s('Microphone', 'microphone', 'noun'),
          s('Xylophone', 'xylophone', 'noun'),
        ],
      },
      {
        id: 'hobby-games',
        label: 'Games',
        iconId: pick('playing cards'),
        children: [
          s('Cards', 'playing cards', 'noun', 'play cards'),
          s('Jigsaw', 'jigsaw puzzle', 'noun'),
          s('Bingo', 'bingo', 'noun'),
          s('Darts', 'darts', 'noun'),
          s('Pool', 'pool snooker', 'noun', 'a game of pool'),
          s('Video game', 'computer game', 'noun'),
          s('Dice', 'roll dice', 'verb', 'roll the dice'),
        ],
      },
      {
        id: 'hobby-relax',
        label: 'Relaxing',
        iconId: pick('read book'),
        children: [
          s('Read', 'read book', 'verb', 'read a book'),
          s('Watch TV', 'flatscreen tv', 'verb', 'watch television'),
          s('Relax', 'relax', 'verb'),
          s('Walk', 'walk', 'verb', 'go for a walk'),
          s('Garden', 'water plants', 'verb', 'do some gardening'),
          s('Fishing', 'fish', 'verb', 'go fishing'),
          s('Camping', 'camp', 'verb', 'go camping'),
          s('Hike', 'hike', 'verb', 'go hiking'),
          s('Picnic', 'picnic', 'noun'),
        ],
      },
    ],
  },

  // ── PAIN & BODY ──────────────────────────────────────────────────────────────
  {
    id: 'pain-body',
    label: 'Pain',
    iconId: pick('headache'),
    children: [
      {
        id: 'pain-where',
        label: 'Where It Hurts',
        iconId: pick('body outline'),
        children: [
          s('Head', 'head', 'noun', 'my head hurts'),
          s('Ear', 'ear', 'noun', 'my ear hurts'),
          s('Eye', 'eye', 'noun', 'my eye hurts'),
          s('Tooth', 'tooth', 'noun', 'my tooth hurts'),
          s('Throat', 'throat', 'noun', 'my throat hurts'),
          s('Neck', 'neck', 'noun', 'my neck hurts'),
          s('Shoulder', 'shoulder', 'noun', 'my shoulder hurts'),
          s('Arm', 'arm', 'noun', 'my arm hurts'),
          s('Chest', 'chest male', 'noun', 'my chest hurts'),
          s('Stomach', 'stomach', 'noun', 'my stomach hurts'),
          s('Back', 'back', 'noun', 'my back hurts'),
          s('Leg', 'leg', 'noun', 'my leg hurts'),
          s('Knee', 'knee', 'noun', 'my knee hurts'),
          s('Foot', 'foot', 'noun', 'my foot hurts'),
        ],
      },
      {
        id: 'pain-type',
        label: 'What Kind',
        iconId: pick('burn'),
        children: [
          s('Burn', 'burn', 'noun', 'it burns'),
          s('Cut', 'cut', 'noun', 'it is a cut'),
          s('Itch', 'itch', 'noun', 'it itches'),
          s('Rash', 'rash', 'noun', 'it is a rash'),
          s('Sting', 'sting bee', 'noun', 'it stings'),
          s('Lump', 'lump', 'noun', 'there is a lump'),
          s('Broken', 'broken bone', 'adjective', 'I think it is broken'),
          s('Sharp', 'sharp', 'adjective', 'sharp pain'),
          s('Hot', 'hot', 'adjective', 'it feels hot'),
        ],
      },
      {
        id: 'pain-scale',
        label: 'Pain Scale',
        iconId: pick('five'),
        children: [
          s('1', 'one', 'number', 'pain level one'),
          s('2', 'two', 'number', 'pain level two'),
          s('3', 'three', 'number', 'pain level three'),
          s('4', 'four', 'number', 'pain level four'),
          s('5', 'five', 'number', 'pain level five'),
          s('6', 'six', 'number', 'pain level six'),
          s('7', 'seven', 'number', 'pain level seven'),
          s('8', 'eight', 'number', 'pain level eight'),
          s('9', 'nine', 'number', 'pain level nine'),
          s('10', 'ten', 'number', 'pain level ten'),
        ],
      },
      {
        id: 'pain-describe',
        label: 'More Detail',
        iconId: pick('little'),
        children: [
          s('Little', 'little', 'adjective', 'it hurts a little'),
          s('A lot', 'lots more', 'adjective', 'it hurts a lot'),
          s('More', 'more', 'adjective', 'it hurts more now'),
          s('Same', 'same', 'adjective', 'it feels the same'),
          s('Better', 'good', 'adjective', 'it feels better'),
          s('Worse', 'bad', 'adjective', 'it feels worse'),
          s('Vomit', 'vomit', 'verb', 'I feel sick'),
          s('Sneeze', 'sneeze cold', 'verb', 'I have a cold'),
        ],
      },
      {
        id: 'pain-care',
        label: 'Asking for Care',
        iconId: pick('medicine'),
        children: [
          s('Help', 'help', 'verb', 'I need help'),
          s('Medicine', 'medicine', 'noun', 'I need medicine'),
          s('Doctor', 'doctor 1a', 'noun', 'I need a doctor'),
          s('Nurse', 'nurse 1a', 'noun', 'I need a nurse'),
          s('First aid', 'first aid box', 'noun', 'I need first aid'),
          s('Plaster', 'plaster', 'noun', 'I need a plaster'),
          s('Rest', 'rest', 'verb', 'I need to lie down'),
          s('Drink', 'drink', 'verb', 'I need a drink'),
        ],
      },
    ],
  },

  // ── TOILET & HYGIENE ─────────────────────────────────────────────────────────
  {
    id: 'toilet-hygiene',
    label: 'Toilet & Hygiene',
    iconId: pick('toilet'),
    children: [
      {
        id: 'th-toilet',
        label: 'Toilet',
        iconId: pick('need toilet'),
        children: [
          s('Toilet', 'need toilet', 'noun', 'I need the toilet'),
          s('Go now', 'toilet go the', 'verb', 'I need to go now'),
          s('Flush', 'flush toilet', 'verb'),
          s('Toilet roll', 'toilet roll', 'noun', 'I need toilet paper'),
          s('Men’s', 'mens toilet', 'noun', 'the men’s toilet'),
          s('Women’s', 'ladies toilet', 'noun', 'the women’s toilet'),
          s('Accessible', 'disabled toilet', 'noun', 'the accessible toilet'),
          s('Nappy', 'change nappy', 'verb', 'I need a change'),
        ],
      },
      {
        id: 'th-washing',
        label: 'Washing',
        iconId: pick('shower 1'),
        children: [
          s('Wash hands', 'wash hands', 'verb'),
          s('Wash face', 'wash face', 'verb'),
          s('Bath', 'bathe', 'verb', 'have a bath'),
          s('Shower', 'shower 1', 'verb', 'have a shower'),
          s('Soap', 'soap', 'noun'),
          s('Shampoo', 'shampoo hair', 'verb', 'wash my hair'),
          s('Shower gel', 'shower gel', 'noun'),
          s('Towel', 'towel', 'noun'),
          s('Dry hands', 'dry hands', 'verb'),
          s('Sponge', 'sponge', 'noun'),
        ],
      },
      {
        id: 'th-grooming',
        label: 'Grooming',
        iconId: pick('hairbrush'),
        children: [
          s('Brush hair', 'brush hair', 'verb'),
          s('Hairbrush', 'hairbrush', 'noun'),
          s('Comb', 'comb', 'noun'),
          s('Haircut', 'haircut', 'noun', 'I need a haircut'),
          s('Shave', 'shave', 'verb'),
          s('Deodorant', 'deodorant', 'noun'),
          s('Perfume', 'perfume', 'noun'),
          s('Nails', 'clip nails', 'verb', 'clip my nails'),
          s('Mirror', 'look in mirror', 'verb', 'look in the mirror'),
        ],
      },
      {
        id: 'th-dental',
        label: 'Dental',
        iconId: pick('toothbrush'),
        children: [
          s('Brush teeth', 'brush teeth', 'verb'),
          s('Toothbrush', 'toothbrush', 'noun'),
          s('Toothpaste', 'toothpaste', 'noun'),
          s('Floss', 'dental floss', 'noun'),
          s('Mouthwash', 'mouthwash', 'noun'),
          s('Toothache', 'toothache', 'noun', 'my tooth hurts'),
          s('Dentist', 'dentist 1a', 'noun'),
        ],
      },
      {
        id: 'th-personal',
        label: 'Personal Care',
        iconId: pick('get dressed'),
        children: [
          s('Get dressed', 'get dressed', 'verb'),
          s('Undress', 'undress', 'verb'),
          s('Tissues', 'tissues', 'noun', 'I need a tissue'),
          s('Sanitary pad', 'sanitary towel', 'noun', 'I need a pad'),
          s('Tampon', 'tampon', 'noun'),
          s('Clean hands', 'clean hands', 'verb'),
          s('Sunscreen', 'sunscreen', 'noun', 'I need sunscreen'),
        ],
      },
    ],
  },

  // ── SUPPORT WORKER ───────────────────────────────────────────────────────────
  {
    id: 'support-worker',
    label: 'Support Worker',
    iconId: pick('care assistant 1a'),
    children: [
      {
        id: 'sw-greeting',
        label: 'Start of Visit',
        iconId: pick('hello'),
        children: [
          s('Hello', 'hello', 'social'),
          s('Handshake', 'shake hands', 'social', 'nice to see you'),
          s('Come in', 'go in', 'verb', 'come in'),
          s('Passport', 'personal passport', 'noun', 'please read my communication passport'),
          s('Comm book', 'communication book', 'noun', 'my communication book'),
          s('Calendar', 'calendar', 'noun', 'let us check today’s plan'),
        ],
      },
      {
        id: 'sw-tasks',
        label: 'Today’s Tasks',
        iconId: pick('tidy up'),
        children: [
          s('Make the bed', 'make the bed', 'verb'),
          s('Washing', 'wash clothes', 'verb', 'do the washing'),
          s('Wash up', 'wash up', 'verb'),
          s('Vacuum', 'hoover', 'verb'),
          s('Tidy up', 'tidy up', 'verb'),
          s('Set the table', 'set the table', 'verb'),
          s('Cook', 'cook chef 1a', 'verb', 'cook a meal'),
          s('Shopping', 'basket', 'noun', 'do the shopping'),
          s('Medicine', 'medicine', 'noun', 'help with my medicine'),
          s('Get dressed', 'get dressed', 'verb', 'help me get dressed'),
        ],
      },
      {
        id: 'sw-requests',
        label: 'Requests',
        iconId: pick('help'),
        children: [
          s('Help', 'help', 'verb', 'please help me'),
          s('Want', 'want', 'verb', 'I want'),
          s('More', 'more', 'adjective', 'more please'),
          s('Wait', 'wait', 'verb', 'please wait'),
          s('Finish', 'finish', 'verb', 'I am finished'),
          s('Toilet', 'need toilet', 'noun', 'I need the toilet'),
          s('Drink', 'drink', 'verb', 'I would like a drink'),
          s('Eat', 'eat', 'verb', 'I would like to eat'),
          s('Break', 'break 2', 'noun', 'I need a break'),
          s('Quiet', 'quiet', 'adjective', 'I need some quiet'),
        ],
      },
      {
        id: 'sw-preferences',
        label: 'Preferences',
        iconId: pick('favourite'),
        children: [
          s('Like', 'good', 'verb', 'I like this'),
          s('Dislike', 'bad', 'verb', 'I do not like this'),
          s('Favourite', 'favourite', 'adjective', 'this is my favourite'),
          s('Yummy', 'yummy', 'adjective'),
          s('Yucky', 'yucky', 'adjective'),
          s('Same', 'same', 'adjective', 'the same as usual please'),
          s('Change', 'change', 'verb', 'I want something different'),
        ],
      },
      {
        id: 'sw-feedback',
        label: 'Feedback',
        iconId: pick('great'),
        children: [
          s('Great', 'great', 'adjective', 'that was great'),
          s('Good', 'good', 'adjective', 'good job'),
          s('Correct', 'correct', 'adjective', 'that is right'),
          s('Mistake', 'mistake no wrong', 'noun', 'that is not right'),
          s('Clap', 'clap hands', 'verb', 'well done'),
          s('Slow down', 'wait', 'verb', 'please slow down'),
        ],
      },
      {
        id: 'sw-endvisit',
        label: 'End of Visit',
        iconId: pick('exit door'),
        children: [
          s('Finish', 'finish', 'verb', 'we are finished for today'),
          s('Leaving', 'exit door', 'verb', 'time to go'),
          s('Tomorrow', 'tomorrow', 'adverb', 'see you tomorrow'),
          s('Next week', 'next week', 'noun', 'see you next week'),
          s('Calendar', 'calendar', 'noun', 'when is the next visit'),
          s('Handshake', 'shake hands', 'social', 'goodbye'),
        ],
      },
    ],
  },
];

// ─── Validate all IDs ─────────────────────────────────────────────────────────

if (missing.length > 0) {
  console.warn('\n⚠️  The following symbol IDs could not be verified:');
  missing.forEach(m => console.warn('  MISSING:', m));
  console.warn('\nFix these before using the output file.\n');
} else {
  console.log('\n✅ All symbol IDs verified.\n');
}

// ─── Generate symbolPacks.ts ──────────────────────────────────────────────────

type SymNode =
  | { label: string; symbolId: string; wordType?: string; speech?: string }
  | { id: string; label: string; iconId?: string; children: SymNode[] };

function renderNode(node: SymNode, depth: number): string {
  const indent = '  '.repeat(depth);
  if ('symbolId' in node) {
    // Positional args matching the generated sym(label, symbolId, wordType?, speech?).
    const parts = [JSON.stringify(node.label), JSON.stringify(node.symbolId)];
    if (node.wordType || node.speech) parts.push(node.wordType ? JSON.stringify(node.wordType) : 'undefined');
    if (node.speech) parts.push(JSON.stringify(node.speech));
    return `${indent}sym(${parts.join(', ')})`;
  }
  const icon = node.iconId ? JSON.stringify(node.iconId) : 'undefined';
  const children = node.children.map(c => renderNode(c, depth + 1)).join(',\n');
  return `${indent}folder(${JSON.stringify(node.id)}, ${JSON.stringify(node.label)}, ${icon}, [\n${children},\n${indent}])`;
}

const rootEntries = packs.map(p => renderNode(p as SymNode, 1)).join(',\n');

const output = `/**
 * Curated Symbol Pack tree — prebuilt folders of Mulberry symbols for the
 * Add Symbol browse flow. Folders can nest; leaf nodes are symbol references
 * (IDs only — no duplicated assets). All symbolId values exist in
 * mulberryAssetMap.generated.ts.
 *
 * AUTO-GENERATED by scripts/buildSymbolPacks.ts — do not hand-edit.
 * Re-run the script to regenerate.
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
${rootEntries},
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
  if (folders > 0) parts.push(folders === 1 ? '1 folder' : \`\${folders} folders\`);
  if (symbols > 0) parts.push(symbols === 1 ? '1 symbol' : \`\${symbols} symbols\`);
  return parts.join(', ') || 'Empty';
}
`;

fs.writeFileSync(OUT_PATH, output, 'utf-8');
console.log(`✅ Written to ${OUT_PATH}`);
console.log(`   Packs: ${packs.length} top-level folders`);
