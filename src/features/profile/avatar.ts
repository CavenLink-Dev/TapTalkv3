/**
 * Profile avatar model — single source of truth for how a user's avatar is
 * encoded in `state.profilePhotoUri` and rendered across the app.
 *
 * `profilePhotoUri` is a string (or null) that carries one of four shapes:
 *   • null              → fall back to the display-name initial on brand blue
 *   • 'symbol:<id>'     → a bundled Mulberry symbol
 *   • 'color:<hex>'     → the initial letter on a chosen background colour
 *   • 'avatar:mascot'   → the TapTalk mascot illustration
 *   • '<file/https uri>' → a real photo the user picked (future: image picker)
 *
 * Keeping the parsing here means the Me screen and the Account page render the
 * same avatar without duplicating prefix logic.
 */

export const AVATAR_SYMBOL_PREFIX = 'symbol:';
export const AVATAR_COLOR_PREFIX = 'color:';
export const AVATAR_MASCOT_VALUE = 'avatar:mascot';

/** Bundled Mulberry symbol IDs offered as calm, non-photo avatars. */
export const AVATAR_SYMBOLS: { symbolId: string; name: string }[] = [
  { symbolId: 'mulberry_family_excv0f', name: 'Family' },
  { symbolId: 'mulberry_cat_1lz3nun', name: 'Cat' },
  { symbolId: 'mulberry_dog_1bfmoh1', name: 'Dog' },
  { symbolId: 'mulberry_bird_13ztxas', name: 'Bird' },
  { symbolId: 'mulberry_fish_1u95ovx', name: 'Fish' },
  { symbolId: 'mulberry_rabbit_sjorvr', name: 'Rabbit' },
  { symbolId: 'mulberry_horse_c0o22y', name: 'Horse' },
  { symbolId: 'mulberry_house_1ice1xp', name: 'House' },
];

/**
 * Avatar background colours. Calm, high-legibility hues that keep white
 * initials readable (all pass WCAG AA for large text on white glyphs).
 * Names are spoken by VoiceOver so users can pick without seeing the swatch.
 */
export const AVATAR_COLORS: { name: string; hex: string }[] = [
  { name: 'Blue', hex: '#199AEE' },
  { name: 'Teal', hex: '#12B5A6' },
  { name: 'Green', hex: '#34B759' },
  { name: 'Purple', hex: '#8E5CF6' },
  { name: 'Pink', hex: '#EC5C8D' },
  { name: 'Orange', hex: '#F5852B' },
  { name: 'Red', hex: '#EA4C4C' },
  { name: 'Slate', hex: '#5B6B7B' },
];

export type Avatar =
  | { kind: 'initial' }
  | { kind: 'symbol'; symbolId: string }
  | { kind: 'color'; hex: string }
  | { kind: 'mascot' }
  | { kind: 'photo'; uri: string };

/** Interpret the stored `profilePhotoUri` value into a render-ready shape. */
export function parseAvatar(value: string | null | undefined): Avatar {
  if (!value) return { kind: 'initial' };
  if (value === AVATAR_MASCOT_VALUE) return { kind: 'mascot' };
  if (value.startsWith(AVATAR_SYMBOL_PREFIX)) {
    return { kind: 'symbol', symbolId: value.slice(AVATAR_SYMBOL_PREFIX.length) };
  }
  if (value.startsWith(AVATAR_COLOR_PREFIX)) {
    return { kind: 'color', hex: value.slice(AVATAR_COLOR_PREFIX.length) };
  }
  return { kind: 'photo', uri: value };
}

/** Build the stored value for a chosen symbol / colour. */
export const encodeSymbol = (symbolId: string) => `${AVATAR_SYMBOL_PREFIX}${symbolId}`;
export const encodeColor = (hex: string) => `${AVATAR_COLOR_PREFIX}${hex}`;

/** True when the avatar is a real photo (used to offer "Remove Current Picture"). */
export function hasCustomAvatar(value: string | null | undefined): boolean {
  const a = parseAvatar(value);
  return a.kind !== 'initial';
}
