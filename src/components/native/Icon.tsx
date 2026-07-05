/**
 * Icon — Custom SVG icon wrapper.
 *
 * Replaces Ionicons with embedded SVG paths. Each SVG is inline so we
 * have full control over stroke, size, and color. Inherits text colour
 * from parent if no colour prop is given.
 */

import React from 'react';
import Svg, { Polyline, Line, Path } from 'react-native-svg';
import { BackOutIcon, BoardIcon, BoardSettingIcon } from '../icons/FigmaIcons';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  /** Stroke width — default 2. Dock controls use 4 (2×). */
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color, strokeWidth = 2 }: IconProps) {
  const strokeColor = color || '#000000';

  switch (name) {
    case 'chevron-right':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="9,18 15,12 9,6" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chevron-left':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="15,18 9,12 15,6" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chevron-up':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="18,15 12,9 6,15" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chevron-down':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="6,9 12,15 18,9" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chevron-back':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="15,18 9,12 15,6" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chevron-back-double':
    case 'back-out':
      return <BackOutIcon size={size} color={strokeColor} />;
    case 'sort':
      // Sort control — artwork from src/assets/icons/sort.svg.
      return (
        <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
          <Path
            fill={strokeColor}
            fillRule="evenodd"
            d="M85.333 149.333c0-23.564 19.103-42.666 42.667-42.666s42.667 19.102 42.667 42.666S151.564 192 128 192s-42.667-19.103-42.667-42.667M128 64c-47.128 0-85.333 38.205-85.333 85.333S80.872 234.667 128 234.667s85.333-38.205 85.333-85.334C213.333 102.205 175.128 64 128 64m341.333 106.667H234.667V128h234.666zM234.667 341.333h234.666V384H234.667zM128 448c47.128 0 85.333-38.206 85.333-85.333c0-47.128-38.205-85.334-85.333-85.334s-85.333 38.206-85.333 85.334S80.872 448 128 448"
          />
        </Svg>
      );
    case 'add':
    case 'plus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="12" y1="5" x2="12" y2="19" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="5" y1="12" x2="19" y2="12" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    case 'remove':
    case 'minus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="5" y1="12" x2="19" y2="12" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    case 'checkmark':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="20,6 9,17 4,12" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'close':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="18" y1="6" x2="6" y2="18" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="6" y1="6" x2="18" y2="18" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    /** Edit — calm pencil icon. Inherits stroke colour + width like the
     *  other stroked glyphs so the dock's tint applies uniformly. */
    case 'edit':
    case 'pencil':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 20h9"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    /** Select — tick inside a circle. Used by the Select mode dock action
     *  and by the per-tile selection indicator (rendered at larger size). */
    case 'select':
    case 'check-circle':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Polyline
            points="8,12.5 11,15.5 16.5,9.5"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    /** Move — four-way arrow used by the Move dock action. */
    case 'move':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="5,9 2,12 5,15" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points="9,5 12,2 15,5" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points="15,19 12,22 9,19" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points="19,9 22,12 19,15" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Line x1="2" y1="12" x2="22" y2="12" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="12" y1="2" x2="12" y2="22" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    /** Resize — bidirectional arrow between two corner brackets. */
    case 'resize':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="15,3 21,3 21,9" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points="9,21 3,21 3,15" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Line x1="21" y1="3" x2="14" y2="10" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="3" y1="21" x2="10" y2="14" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    /** Undo — curved arrow back to the left. Stroke-based so it matches
     *  the dock's shared line weight. */
    case 'undo':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="8.5,5.5 4,10 8.5,14.5" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path
            d="M4 10h10.5a5.5 5.5 0 0 1 0 11H10"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    /** Duplicate — two soft-cornered squares. */
    case 'duplicate':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 9h11v11H9z"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M5 15H4V4h11v1"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    /** Favourite — star outline (toggles filled elsewhere via colour). */
    case 'favourite':
    case 'star':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8L12 3z"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    /** Board dock gear — tinted raster, matches dock symbol colour. */
    case 'board':
      return <BoardIcon size={size} color={strokeColor} />;
    /** Settings gear — tinted raster (board settings screen, etc.). */
    case 'setting':
    case 'settings':
      return <BoardSettingIcon size={size} color={strokeColor} />;
    /** Fullscreen — artwork from assets/symbol/fullscreen.svg (SF-style
     *  fill). Rendered as fill so it matches the 'sort' glyph weight. */
    case 'fullscreen':
      return (
        <Svg width={size} height={size} viewBox="0 0 18.3162 14.7559">
          <Path
            fill={strokeColor}
            d="M2.76928 14.7559L15.5476 14.7559C17.3396 14.7559 18.3162 13.7793 18.3162 12.0019L18.3162 2.76367C18.3162 0.986328 17.3396 0.00976838 15.5476 0.00976838L2.76928 0.00976838C0.98217 0.00976838 0.000724 0.986328 0.000724 2.76367L0.000724 12.0019C0.000724 13.7793 0.98217 14.7559 2.76928 14.7559ZM3.00366 12.6318C2.42748 12.6318 2.11987 12.3535 2.11987 11.7432L2.11987 3.02246C2.11987 2.40723 2.42748 2.13379 3.00366 2.13379L15.3132 2.13379C15.8894 2.13379 16.197 2.40723 16.197 3.02246L16.197 11.7432C16.197 12.3535 15.8894 12.6318 15.3132 12.6318Z"
          />
          <Path
            fill={strokeColor}
            d="M5.16674 7.33887C5.53784 7.33887 5.81127 7.05566 5.81127 6.6748L5.81127 6.01074L5.64526 4.24805L7.37865 4.4336L8.06713 4.4336C8.45287 4.4336 8.73608 4.16016 8.73608 3.78418C8.73608 3.41309 8.45287 3.13965 8.0769 3.13965L5.38159 3.13965C4.84935 3.13965 4.51733 3.43262 4.51733 3.99414L4.51733 6.66504C4.51733 7.0459 4.79077 7.33887 5.16674 7.33887ZM8.17455 7.47559C8.57494 7.47559 8.88256 7.16797 8.88256 6.76758C8.88256 6.58203 8.79467 6.38672 8.63842 6.23535L7.48608 5.07813L6.38256 4.18946C5.69897 3.64746 5.03978 4.33105 5.5476 4.95118L6.47045 6.09376L7.60814 7.22656C7.77416 7.39746 7.96947 7.47559 8.17455 7.47559ZM13.155 7.42676C12.7791 7.42676 12.5056 7.70996 12.5056 8.09082L12.5056 8.75488L12.6716 10.5176L10.9382 10.332L10.2546 10.332C9.86401 10.332 9.5808 10.6055 9.5808 10.9814C9.5808 11.3525 9.86401 11.626 10.2449 11.626L12.9353 11.626C13.4724 11.626 13.8044 11.333 13.8044 10.7715L13.8044 8.10059C13.8044 7.71973 13.5261 7.42676 13.155 7.42676ZM10.1472 7.29004C9.74682 7.29004 9.4392 7.59277 9.4392 7.99805C9.4392 8.17871 9.52709 8.37891 9.67846 8.53028L10.8357 9.6875L11.9392 10.5762C12.6179 11.1182 13.2771 10.4346 12.7742 9.81446L11.8464 8.67188L10.7136 7.53907C10.5427 7.36816 10.3523 7.29004 10.1472 7.29004Z"
          />
        </Svg>
      );
    /** Hide — eye-with-slash from assets/symbol/hide.svg (SF-style fill). */
    case 'hide':
      return (
        <Svg width={size} height={size} viewBox="0 0 21.3532 17.1094">
          <Path
            fill={strokeColor}
            d="M5.26384 5.67455C3.62182 6.79969 2.61291 8.11716 2.61291 8.56445C2.61291 9.59473 6.12853 13.2715 10.6744 13.2715C11.3558 13.2715 12.0141 13.1887 12.6371 13.0369L14.3537 14.751C13.2395 15.1189 12.0056 15.3369 10.6744 15.3369C4.28282 15.3369 0.0006 10.1416 0.0006 8.56445C0.0006 7.68126 1.34347 5.66498 3.64903 4.06213ZM21.3532 8.56445C21.3532 9.43668 20.0748 11.4156 17.8279 13.0086L16.2378 11.4196C17.7887 10.3453 18.7359 9.09886 18.7359 8.56445C18.7359 7.7295 15.2154 3.8623 10.6744 3.8623C10.0537 3.8623 9.45226 3.93439 8.87879 4.06602L7.15365 2.34215C8.231 1.99951 9.41154 1.79687 10.6744 1.79687C17.1735 1.79687 21.3532 6.98731 21.3532 8.56445ZM11.7869 12.188C11.4373 12.296 11.0653 12.3535 10.6793 12.3535C8.57482 12.3535 6.8756 10.6348 6.8756 8.54981C6.8756 8.16561 6.93223 7.79524 7.03889 7.44699ZM14.4781 8.54981C14.4781 8.88833 14.4336 9.21719 14.3458 9.52898L9.69994 4.88657C10.0111 4.79979 10.3399 4.75585 10.6793 4.75585C12.7887 4.75585 14.4781 6.45019 14.4781 8.54981Z"
          />
          <Path
            fill={strokeColor}
            d="M16.8121 15.5664C17.0807 15.835 17.5104 15.8447 17.7789 15.5664C18.0524 15.2832 18.0475 14.8682 17.7789 14.5996L4.53185 1.36231C4.2633 1.09375 3.82384 1.09375 3.55529 1.36231C3.29649 1.6211 3.29649 2.0703 3.55529 2.32911Z"
          />
        </Svg>
      );
    /** Quick — board-with-lightning + mini bar chart, from
     *  assets/symbol/quick_bottom_control_bar.svg (SF-style fill).
     *  Rendered as fill so it matches the 'fullscreen'/'hide' weight. */
    case 'quick':
      return (
        <Svg width={size} height={size} viewBox="0 0 25.4935 21.127">
          <Path fill={strokeColor} fillOpacity={0.85} d="M19.8614 5.91016L19.8614 11.2791C19.2648 11.3234 18.7547 11.6656 18.4552 12.1565L18.4552 5.97852C18.4552 5.23634 18.0548 4.86524 17.3516 4.86524L8.14266 4.86524C7.43952 4.86524 7.03914 5.23634 7.03914 5.97852L7.03914 15.1582C7.03914 15.8906 7.43952 16.2715 8.14266 16.2715L14.5072 16.2715L14.5072 16.6934C14.5072 17.06 14.6192 17.4023 14.8109 17.6875L8.12312 17.6875C6.46296 17.6875 5.63288 16.8672 5.63288 15.2266L5.63288 5.91016C5.63288 4.26954 6.46296 3.44922 8.12312 3.44922L17.3712 3.44922C19.0411 3.44922 19.8614 4.26954 19.8614 5.91016Z" />
          <Path fill={strokeColor} fillOpacity={0.85} d="M14.3829 5.95898L13.0352 9.58204L15.5841 9.58204C15.7891 9.58204 15.9649 9.73828 15.9649 9.94336C15.9649 10.0508 15.9161 10.168 15.8282 10.2656L11.7071 15.4414C11.3555 15.8613 10.7989 15.5781 10.9942 15.0508L12.3419 11.418L9.8028 11.418C9.58796 11.418 9.42194 11.2617 9.42194 11.0566C9.42194 10.9492 9.47078 10.832 9.55866 10.7344L13.6798 5.56836C14.0216 5.13868 14.588 5.43164 14.3829 5.95898Z" />
          <Path fill={strokeColor} fillOpacity={0.85} d="M16.3041 17.1523C16.5873 17.1523 16.7924 16.9473 16.7924 16.6934L16.7924 15.707C16.7924 15.4434 16.5873 15.2285 16.3041 15.2285C16.0502 15.2285 15.8451 15.4434 15.8451 15.707L15.8451 16.6934C15.8451 16.9473 16.0502 17.1523 16.3041 17.1523Z" />
          <Path fill={strokeColor} fillOpacity={0.85} d="M18.1595 18.4609C18.4232 18.4609 18.6283 18.2559 18.6283 17.9727L18.6283 14.4082C18.6283 14.1445 18.4232 13.9395 18.1595 13.9395C17.8959 13.9395 17.681 14.1445 17.681 14.4082L17.681 17.9727C17.681 18.2559 17.8959 18.4609 18.1595 18.4609Z" />
          <Path fill={strokeColor} fillOpacity={0.85} d="M19.9955 19.7891C20.2689 19.7891 20.474 19.584 20.474 19.3105L20.474 13.0898C20.474 12.8164 20.2689 12.6113 19.9955 12.6113C19.7318 12.6113 19.5267 12.8164 19.5267 13.0898L19.5267 19.3105C19.5267 19.5938 19.722 19.7891 19.9955 19.7891Z" />
          <Path fill={strokeColor} fillOpacity={0.85} d="M21.8314 19.0469C22.1049 19.0469 22.3099 18.8418 22.3099 18.5684L22.3099 13.8125C22.3099 13.5586 22.1049 13.3535 21.8314 13.3535C21.5775 13.3535 21.3627 13.5586 21.3627 13.8125L21.3627 18.5684C21.3627 18.8418 21.5775 19.0469 21.8314 19.0469Z" />
          <Path fill={strokeColor} fillOpacity={0.85} d="M23.6771 17.5527C23.9506 17.5527 24.1556 17.3477 24.1556 17.0742L24.1556 15.3066C24.1556 15.043 23.9506 14.8379 23.6771 14.8379C23.4134 14.8379 23.2084 15.0527 23.2084 15.3066L23.2084 17.0742C23.2084 17.3379 23.4134 17.5527 23.6771 17.5527Z" />
        </Svg>
      );
    case 'refresh':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="23,4 23,10 17,10" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points="1,20 1,14 7,14" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'warning':
    case 'warning-outline':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.04h16.94a2 2 0 0 0 1.71-3.04l-8.47-14.14a2 2 0 0 0-3.42 0z" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Line x1="12" y1="9" x2="12" y2="13" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="12" y1="17" x2="12.01" y2="17" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    default:
      console.warn(`Icon "${name}" not found in library`);
      return null;
  }
}
