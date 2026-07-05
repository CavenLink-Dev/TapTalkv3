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
    const parts = [`label: ${JSON.stringify(node.label)}`, `symbolId: ${JSON.stringify(node.symbolId)}`];
    if (node.wordType) parts.push(`wordType: ${JSON.stringify(node.wordType)}`);
    if (node.speech)   parts.push(`speech: ${JSON.stringify(node.speech)}`);
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
