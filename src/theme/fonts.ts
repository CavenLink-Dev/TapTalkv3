/**
 * SF Compact font registration.
 *
 * Only the weights used across the app are bundled at runtime. Aliases map
 * unused design-token names to the nearest loaded face so StyleSheets stay
 * unchanged while startup loads fewer OTF files.
 */

import { useFonts } from 'expo-font';

export const fonts = {
  // ── SF Compact Text — body / UI copy ──
  body:         'SFCompactText-Regular',
  bodyMedium:   'SFCompactText-Regular',
  bodySemibold: 'SFCompactText-Heavy',
  bodyBold:     'SFCompactText-Heavy',
  bodyHeavy:    'SFCompactText-Heavy',

  // ── SF Compact Rounded — display / headings / buttons ──
  displayRegular:  'SFCompactRounded-Bold',
  displayMedium:   'SFCompactRounded-Bold',
  displaySemibold: 'SFCompactRounded-Bold',
  displayBold:     'SFCompactRounded-Bold',
  displayHeavy:    'SFCompactRounded-Heavy',
  displayBlack:    'SFCompactRounded-Black',
} as const;

const LOADED_FONTS = {
  [fonts.body]:         require('../../apple_sf_compact_fonts/SF-Compact-Text-Regular.otf'),
  [fonts.bodyHeavy]:    require('../../apple_sf_compact_fonts/SF-Compact-Text-Heavy.otf'),
  [fonts.displayBold]:  require('../../apple_sf_compact_fonts/SF-Compact-Rounded-Bold.otf'),
  [fonts.displayHeavy]: require('../../apple_sf_compact_fonts/SF-Compact-Rounded-Heavy.otf'),
  [fonts.displayBlack]: require('../../apple_sf_compact_fonts/SF-Compact-Rounded-Black.otf'),
} as const;

export function useTapTalkFonts() {
  return useFonts(LOADED_FONTS);
}
