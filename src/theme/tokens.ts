/**
 * TapTalk design tokens — single source of truth.
 * All source values are derived from `src/theme/figma_source/Mode 1.tokens.json`.
 * Variable names are preserved as comments so you can cross-reference the Figma file.
 */

import { fonts } from './fonts';

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
  /** compatibility alias mapped from progress_bar_background */
  softBlue:           '#D5E1E8',

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
  /** dark_third_text — darkened from #A4A4A4 to pass WCAG AA (4.6:1 on white) */
  textTertiary:       '#6B7280',
  /** bright_main_text — VariableID:1:1131 */
  textOnDark:         '#FFFFFF',

  // ── Inputs / surfaces
  /** input_box_background — VariableID:1:1133 */
  inputBg:            '#EAEEF2',
  /** input_background_full_white — VariableID:45:257 */
  inputBgWhite:       '#FFFFFF',
  /** compatibility alias mapped from input_box_background */
  input:              '#EAEEF2',

  // ── Progress bar
  /** button_main_and_progress_bar_filler (reused) */
  progressFill:       '#199AEE',
  /** progress_bar_background — VariableID:1:1128 */
  progressTrack:      '#D5E1E8',

  // ── Strokes / borders
  /** outline_stroke_rarely_used — darkened from #BBC0C7 to pass WCAG non-text 3:1 */
  border:             '#A1A8B0',
  /** outline_black_symbol_folder — VariableID:45:510 */
  symbolOutline:      '#434343',
  /** compatibility alias mapped from outline_stroke_rarely_used */
  borderBlue:         '#A1A8B0',

  // ── Status
  /** error_colour_red — VariableID:1:1122 */
  danger:             '#F3312A',
  success:            '#30D158',
  warning:            '#FF9500',
  /** compatibility alias mapped from progress_bar_background */
  disabled:           '#D5E1E8',

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
// Source: TapTalk Component Library - Design Handoff (Sept 2026)
// Display/Title/Heading/Subhead use SF Compact Rounded; Body/Callout use SF Compact.

export const typography = {
  /** SF Compact Text — body / UI copy. */
  fontFamily:        fonts.body,
  /** SF Compact Rounded Heavy — default for titles/headings/buttons. */
  fontFamilyDisplay: fonts.displayHeavy,

  // sizes ──
  /** hero / splash mark — 34/800 */
  display:     34,
  /** screen titles — 28/800 */
  title:       28,
  /** section headings — 22/800 */
  heading:     22,
  /** subheads — 20/700 */
  subheading:  20,
  /** primary body copy — 17/400 */
  body:        17,
  /** secondary callout — 15/400 */
  callout:     15,
  /** captions, meta — 13/600 */
  caption:     13,
  /** eyebrow ALL-CAPS labels — 11/700 */
  eyebrow:     11,
  /** tab bar labels — 10 */
  tab:         10,

  // weights ──
  weightDisplay:  '800' as const,
  weightTitle:    '800' as const,
  weightHeading:  '800' as const,
  weightSubhead:  '700' as const,
  weightBody:     '400' as const,
  weightCaption:  '600' as const,
  weightEyebrow:  '700' as const,
  weightButton:   '700' as const,

  // letter-spacing ──
  trackDisplay:  -1.2,
  trackTitle:    -0.8,
  trackHeading:  -0.4,
  trackSubhead:  -0.2,
  trackButton:   -0.3,
  trackEyebrow:   1.5,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────
// Design system rule: flat surfaces. Shadows and glows looked cheap on small
// phones and competed with the brand color. We keep the object shape so
// consumers using `...shadows.card` don't need rewrites — they just spread a
// no-op now. Depth comes from background contrast and color, not blur.

export const shadows = {
  card: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius:  0,
    elevation:     0,
  },
  pop: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius:  0,
    elevation:     0,
  },
  cardRaise: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius:  0,
    elevation:     0,
  },
} as const;

// ─── Animation ────────────────────────────────────────────────────────────────
// Source: TapTalk Component Library Design Handoff · "Shadows & motion"
//
// Three voices:
//   • Standard ease   — fades, crossfades, page transitions.
//   • Spring ease     — pops, scales, anything physical (buttons, checks).
//   • Linear          — shimmers, breathing idle loops.
//
// All semantic motion below references these. Components MUST read durations
// from this file (not hardcode them) so Reduce Motion can override globally.

export const animation = {
  // ── Easings (cubic-bezier control points) ────────────────────────────────
  /** standard ease — page/fade transitions */
  easeStandard: [0.4, 0, 0.2, 1] as const,
  /** spring ease — pops and scales */
  easeSpring:   [0.34, 1.3, 0.64, 1] as const,
  /** linear — shimmer / float */
  easeLinear:   [0, 0, 1, 1] as const,

  // ── Durations (ms) ──────────────────────────────────────────────────────
  /** press feedback in / chip selection in */
  durFast:    120,
  /** focus border, fill cross-fade */
  durFocus:   200,
  /** release spring back, button color settle */
  durRelease: 180,
  /** fades, cross-fades, entrance translateY */
  durBase:    260,
  /** segmented progress fill, page slides */
  durSlide:   300,
  /** segment width fill, single-bar progress */
  durFill:    360,
  /** shake / error oscillation (3 cycles) */
  durShake:   400,
  /** logo arc draw-on, hero reveal */
  durDraw:    520,
  /** mascot idle float (one half-cycle), splash breathe */
  durFloat:   1400,
  /** skeleton shimmer slide */
  durShimmer: 1600,
  /** very short crossfade used as Reduce-Motion fallback */
  durReduced: 200,

  // ── Stagger steps (ms) ──────────────────────────────────────────────────
  /** segmented progress catch-up between adjacent segments */
  stagSeg:    45,
  /** card list entrance per-row */
  stagRow:    60,
  /** card list entrance per-row when Reduce Motion is on (no translate) */
  stagRowRM:  80,
  /** logo dot pop delay after arc starts drawing */
  stagDot:    180,
  /** LoadingDots dot-to-dot offset */
  stagDot1:   0,
  stagDot2:   220,
  stagDot3:   440,

  // ── Reanimated spring physics ───────────────────────────────────────────
  /** pop spring — buttons, check rings, success pulses */
  springPop:    { damping: 12, stiffness: 320, mass: 1 } as const,
  /** gentle spring — cards, sheet entrances */
  springGentle: { damping: 18, stiffness: 220, mass: 1 } as const,
  /** stiff spring — minimal-motion fallback */
  springStiff:  { damping: 24, stiffness: 600, mass: 1 } as const,

  // ── Scale anchors ───────────────────────────────────────────────────────
  /** primary button press in */
  scalePressLg:  0.97,
  /** secondary card / pill press in */
  scalePressMd:  0.96,
  /** subtle card pressable */
  scalePressSm:  0.985,
  /** completion celebration pulse high-water mark */
  scalePulse:    1.03,

  // ── One-off offsets ─────────────────────────────────────────────────────
  /** error shake horizontal amplitude */
  shakeAmp:    6,
  /** mascot float vertical amplitude */
  floatAmp:    2,
} as const;

export type Animation = typeof animation;
