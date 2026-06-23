/**
 * SF Compact font registration.
 *
 * Apple ships SF Compact and SF Compact Rounded as the system text/display
 * fonts on iOS. We bundle the official OTF files (apple_sf_compact_fonts/)
 * directly so:
 *   • The exact weights we need ship with the binary (not negotiated by the
 *     OS), guaranteeing consistent metrics across iOS versions.
 *   • Android can render the same family eventually (currently iOS-only).
 *
 * Usage:
 *   • Call `useTapTalkFonts()` once from the root layout. It returns
 *     `[loaded, error]` from expo-font's `useFonts`.
 *   • Reference family names from `fonts.*` (e.g. `fonts.displayHeavy`) in
 *     StyleSheets — DO NOT also set `fontWeight`; the weight is baked into
 *     the family name to keep iOS/Android rendering identical.
 */

import { useFonts } from 'expo-font';

export const fonts = {
  // ── SF Compact Text — body / UI copy ──
  body:         'SFCompactText-Regular',
  bodyMedium:   'SFCompactText-Medium',
  bodySemibold: 'SFCompactText-Semibold',
  bodyBold:     'SFCompactText-Bold',
  bodyHeavy:    'SFCompactText-Heavy',

  // ── SF Compact Rounded — display / headings / buttons ──
  displayRegular:  'SFCompactRounded-Regular',
  displayMedium:   'SFCompactRounded-Medium',
  displaySemibold: 'SFCompactRounded-Semibold',
  displayBold:     'SFCompactRounded-Bold',
  displayHeavy:    'SFCompactRounded-Heavy',
  displayBlack:    'SFCompactRounded-Black',
} as const;

export function useTapTalkFonts() {
  return useFonts({
    [fonts.body]:         require('../../apple_sf_compact_fonts/SF-Compact-Text-Regular.otf'),
    [fonts.bodyMedium]:   require('../../apple_sf_compact_fonts/SF-Compact-Text-Medium.otf'),
    [fonts.bodySemibold]: require('../../apple_sf_compact_fonts/SF-Compact-Text-Semibold.otf'),
    [fonts.bodyBold]:     require('../../apple_sf_compact_fonts/SF-Compact-Text-Bold.otf'),
    [fonts.bodyHeavy]:    require('../../apple_sf_compact_fonts/SF-Compact-Text-Heavy.otf'),

    [fonts.displayRegular]:  require('../../apple_sf_compact_fonts/SF-Compact-Rounded-Regular.otf'),
    [fonts.displayMedium]:   require('../../apple_sf_compact_fonts/SF-Compact-Rounded-Medium.otf'),
    [fonts.displaySemibold]: require('../../apple_sf_compact_fonts/SF-Compact-Rounded-Semibold.otf'),
    [fonts.displayBold]:     require('../../apple_sf_compact_fonts/SF-Compact-Rounded-Bold.otf'),
    [fonts.displayHeavy]:    require('../../apple_sf_compact_fonts/SF-Compact-Rounded-Heavy.otf'),
    [fonts.displayBlack]:    require('../../apple_sf_compact_fonts/SF-Compact-Rounded-Black.otf'),
  });
}
