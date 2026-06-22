/**
 * TapTalk design tokens — single source of truth.
 * All values are sourced directly from `Mode 1.tokens.json` (Figma variables).
 * Variable names are preserved as comments so you can cross-reference the Figma file.
 */

// ─── Colours ──────────────────────────────────────────────────────────────────

export const colors = {
  // ── UI foundation
  /** main_background_colour — VariableID:1:1123 */
  background:         '#F1F5F9',
  /** secondary_main_background_white / content_background_for_icons_etc_pure_white */
  surface:            '#FFFFFF',
  /** light_nav_background */
  navBackground:      '#FFFFFF',

  // ── Brand / interactive
  /** button_main_and_progress_bar_filler — VariableID:1:1127 */
  primary:            '#199AEE',
  /** button_selected (active state) — VariableID:1:1126 */
  primaryDark:        '#006DD3',
  /** button_pressed (tap feedback) — VariableID:1:1139 */
  primaryPressed:     '#62C1FF',

  // ── Mascot palette
  /** mascot_main_base_colour_baby_blue — VariableID:1:1124 */
  mascot:             '#54ACFF',
  /** mascot_secondary_pure_black_outline_pupils — VariableID:1:1125 */
  mascotOutline:      '#000000',
  /** mascot_third_colour_white — VariableID:1:1161 */
  mascotWhite:        '#FEFEFE',

  // ── Text
  /** dark_main_text_colour — VariableID:1:1129 */
  text:               '#202020',
  /** dark_secondary_text — VariableID:1:1130 */
  textMuted:          '#434343',
  /** dark_third_text — VariableID:1:1132 */
  textTertiary:       '#A4A4A4',
  /** bright_main_text — VariableID:1:1131 */
  textOnDark:         '#FFFFFF',

  // ── Inputs / surfaces
  /** input_box_background — VariableID:1:1133 */
  inputBg:            '#EAEEF2',
  /** input_background_full_white — VariableID:45:257 */
  inputBgWhite:       '#FFFFFF',

  // ── Progress bar
  /** button_main_and_progress_bar_filler (reused) */
  progressFill:       '#199AEE',
  /** progress_bar_background — VariableID:1:1128 */
  progressTrack:      '#D5E1E8',

  // ── Strokes / borders
  /** outline_stroke_rarely_used — VariableID:1:1160 */
  border:             '#BBC0C7',
  /** outline_black_symbol_folder — VariableID:45:510 */
  symbolOutline:      '#434343',

  // ── Status
  /** error_colour_red — VariableID:1:1122 */
  danger:             '#F3312A',
  success:            '#30D158',
  warning:            '#FF9500',

  // ── Folder cells
  /** folder_main_colour — VariableID:45:522 */
  folderBg:           '#EDE070',
  /** folder_flap_fill_white — VariableID:45:511 (white @ 81% opacity) */
  folderFlap:         'rgba(255,255,255,0.81)',
  /** folder_flap_secondary_main — VariableID:45:523 */
  folderFlapSecondary:'#FFFED7',
} as const;

// ─── Word-type symbol colours (AAC board) ─────────────────────────────────────

export const symbolColors = {
  /** symbol_conjunction_colour — VariableID:41:158 */
  conjunction:  '#FA838E',
  /** symbol_noun_colour — VariableID:40:248 */
  noun:         '#BD73FF',
  /** symbol_pronoun_colour — VariableID:40:252 */
  pronoun:      '#E8C917',
  /** symbol_verb_colour — VariableID:41:144 */
  verb:         '#5CD65C',
  /** symbol_adjective_colour — VariableID:41:146 */
  adjective:    '#5CC9E8',
  /** symbol_preposition_colour — VariableID:41:148 */
  preposition:  '#7AA3C7',
  /** symbol_negation_colour — VariableID:41:150 */
  negation:     '#FF5C5C',
  /** symbol_question_colour — VariableID:41:152 */
  question:     '#F58625',
  /** symbol_social_colour — VariableID:41:154 */
  social:       '#4863CF',
  /** symbol_article_colour — VariableID:41:156 */
  article:      '#D22CCA',
  /** symbol_interjection_colour — VariableID:40:250 */
  interjection: '#D32626',
  /** folder_main_colour — VariableID:45:522 */
  folder:       '#EDE070',
} as const;

// ─── Radii ────────────────────────────────────────────────────────────────────

export const radii = {
  /** button_corner_radius — VariableID:1:1157 */
  button:     10,
  input:      10,
  card:       16,
  /** pill_shaped_corner_radius — VariableID:1:1158 */
  pill:       22,
  /** background_card_radius — VariableID:1:1159 */
  bgCard:     40,
  sheet:      44,
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const typography = {
  fontFamily:  'System',
  title:       30,
  heading:     24,
  subheading:  20,
  body:        17,
  callout:     15,
  caption:     12,
  tab:         10,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const shadows = {
  card: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius:  8,
    elevation:     2,
  },
} as const;
