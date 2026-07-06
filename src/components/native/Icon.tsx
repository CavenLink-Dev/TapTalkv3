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
    case 'dock-add':
    case 'add-box':
      return (
        <Svg width={size} height={size} viewBox="0 0 14.6787 14.707">
          <Path fill={strokeColor} d="M4.24415 14.6875L10.4355 14.6875C11.7734 14.6875 12.8379 14.2822 13.5508 13.5645C14.2832 12.8467 14.6787 11.7822 14.6787 10.4443L14.6787 4.24317C14.6787 2.90527 14.2832 1.84083 13.5508 1.12305C12.833 0.4004 11.7734 0 10.4355 0L4.24415 0C2.90625 0 1.83693 0.40528 1.12403 1.12305C0.39649 1.84083 0.000984 2.90527 0.000984 4.24317L0.000984 10.4443C0.000984 11.7822 0.39649 12.8467 1.12403 13.5645C1.83693 14.2822 2.90625 14.6875 4.24415 14.6875ZM4.38087 12.5684C3.58985 12.5684 3.01857 12.3926 2.65724 12.0361C2.29102 11.6699 2.12013 11.1084 2.12013 10.3076L2.12013 4.37989C2.12013 3.57911 2.29102 3.01759 2.65724 2.65137C3.01368 2.29981 3.58985 2.11915 4.38087 2.11915L10.2988 2.11915C11.085 2.11915 11.6611 2.29492 12.0225 2.65137C12.3887 3.01759 12.5596 3.57911 12.5596 4.37989L12.5596 10.3076C12.5596 11.1084 12.3887 11.6699 12.0225 12.0361C11.666 12.3877 11.085 12.5684 10.2988 12.5684Z" />
          <Path fill={strokeColor} d="M8.24805 9.98048L8.24805 4.70216C8.24805 4.17969 7.86231 3.80372 7.33497 3.80372C6.8125 3.80372 6.43165 4.17969 6.43165 4.70216L6.43165 9.98048C6.43165 10.4981 6.8125 10.874 7.33497 10.874C7.86231 10.874 8.24805 10.4981 8.24805 9.98048ZM4.70313 8.24708L9.98145 8.24708C10.499 8.24708 10.8701 7.86621 10.8701 7.34376C10.8701 6.81641 10.499 6.43067 9.98145 6.43067L4.70313 6.43067C4.18067 6.43067 3.8047 6.81641 3.8047 7.34376C3.8047 7.86621 4.18067 8.24708 4.70313 8.24708Z" />
        </Svg>
      );
    case 'folder-add':
      return (
        <Svg width={size} height={size} viewBox="0 0 27.9947 21.8105">
          <Path fill={strokeColor} d="M11.7143 3.98144L12.1049 4.28418C12.5932 4.65527 12.9594 4.79687 13.5404 4.79687L20.1859 4.79687C21.9731 4.79687 22.9545 5.76855 22.9545 7.54589L22.9545 11.2851C22.8798 11.2751 22.8032 11.2734 22.7261 11.2734C22.0603 11.2734 21.4217 11.3996 20.8354 11.6341L20.8354 7.80957C20.8354 7.19433 20.5277 6.91601 19.9516 6.91601L12.9643 6.91601C12.0805 6.91601 11.6557 6.75977 11.0551 6.2959L10.6645 5.99316C10.1713 5.61719 9.81486 5.48047 9.2338 5.48047L8.08634 5.48047C7.50529 5.48047 7.15861 5.80762 7.15861 6.38379L7.15861 15.1729C7.15861 15.7881 7.46622 16.0615 8.0424 16.0615L17.482 16.0615C17.4649 16.2178 17.4576 16.3767 17.4576 16.5371C17.4576 17.1121 17.5517 17.6671 17.7287 18.1855L7.80802 18.1855C6.02091 18.1855 5.03946 17.209 5.03946 15.4316L5.03946 6.12988C5.03946 4.34766 6.05509 3.36133 7.67131 3.36133L9.80998 3.36133C10.6938 3.36133 11.1137 3.51758 11.7143 3.98144ZM19.8734 8.72266L19.8734 9.46973L8.12052 9.46973L8.12052 8.72266C8.12052 8.26367 8.33537 8.07812 8.76506 8.07812L19.2289 8.07812C19.6635 8.07812 19.8734 8.26367 19.8734 8.72266Z" />
          <Path fill={strokeColor} d="M26.7887 16.5371C26.7887 18.7539 24.9381 20.6045 22.7261 20.6045C20.4996 20.6045 18.6588 18.7637 18.6588 16.5371C18.6588 14.3154 20.4996 12.4795 22.7261 12.4795C24.9527 12.4795 26.7887 14.3154 26.7887 16.5371ZM22.0816 14.5693L22.0816 15.8975L20.7486 15.8975C20.358 15.8975 20.1041 16.1562 20.1041 16.542C20.1041 16.9277 20.3677 17.1865 20.7486 17.1865L22.0816 17.1865L22.0816 18.5293C22.0816 18.9102 22.3355 19.1689 22.7261 19.1689C23.1119 19.1689 23.3707 18.9102 23.3707 18.5293L23.3707 17.1865L24.7086 17.1865C25.0895 17.1865 25.3433 16.9277 25.3433 16.542C25.3433 16.1562 25.0895 15.8975 24.7086 15.8975L23.3707 15.8975L23.3707 14.5693C23.3707 14.1787 23.1119 13.9248 22.7261 13.9248C22.3355 13.9248 22.0816 14.1885 22.0816 14.5693Z" />
        </Svg>
      );
    case 'symbol-add':
      return (
        <Svg width={size} height={size} viewBox="0 0 25.4547 21.8105">
          <Path fill={strokeColor} d="M20.0982 6.28613L20.0982 11.2779C19.3426 11.2869 18.6244 11.4617 17.979 11.7697L17.979 6.54492C17.979 5.92969 17.6714 5.65625 17.0953 5.65625L8.3599 5.65625C7.78372 5.65625 7.47611 5.92969 7.47611 6.54492L7.47611 15.2656C7.47611 15.876 7.78372 16.1543 8.3599 16.1543L14.9372 16.1543C14.9224 16.2799 14.9176 16.408 14.9176 16.5371C14.9176 17.1468 15.0234 17.7339 15.2229 18.2783L8.12552 18.2783C6.33841 18.2783 5.35696 17.3018 5.35696 15.5244L5.35696 6.28613C5.35696 4.50879 6.33841 3.53222 8.12552 3.53222L17.3296 3.53222C19.1216 3.53222 20.0982 4.50879 20.0982 6.28613Z" />
          <Path fill={strokeColor} d="M24.2487 16.5371C24.2487 18.7539 22.3981 20.6045 20.1862 20.6045C17.9596 20.6045 16.1188 18.7637 16.1188 16.5371C16.1188 14.3154 17.9596 12.4795 20.1862 12.4795C22.4127 12.4795 24.2487 14.3154 24.2487 16.5371ZM19.5416 14.5693L19.5416 15.8975L18.2086 15.8975C17.818 15.8975 17.5641 16.1562 17.5641 16.542C17.5641 16.9277 17.8277 17.1865 18.2086 17.1865L19.5416 17.1865L19.5416 18.5293C19.5416 18.9102 19.7955 19.1689 20.1862 19.1689C20.5719 19.1689 20.8307 18.9102 20.8307 18.5293L20.8307 17.1865L22.1686 17.1865C22.5495 17.1865 22.8033 16.9277 22.8033 16.542C22.8033 16.1562 22.5495 15.8975 22.1686 15.8975L20.8307 15.8975L20.8307 14.5693C20.8307 14.1787 20.5719 13.9248 20.1862 13.9248C19.7955 13.9248 19.5416 14.1885 19.5416 14.5693Z" />
        </Svg>
      );
    /** toggle-bar / custom-chevron-forward — right-pointing chevron.
     *  Matches the artwork in assets/symbol/toggle_bottom_control_bar.svg
     *  and assets/symbol/custom.chevron.forward.svg. */
    case 'toggle-bar':
    case 'custom-chevron-forward':
      return (
        <Svg width={size} height={size} viewBox="0 0 9.60988 13.623">
          <Path fill={strokeColor} d="M9.60988 6.80664C9.60988 6.5918 9.53176 6.39648 9.36574 6.23046L3.33058 0.23438C3.1841 0.07812 2.98878 0 2.76418 0C2.30518 0 1.95362 0.3418 1.95362 0.80078C1.95362 1.01562 2.05128 1.2207 2.188 1.37696L7.64698 6.80664L2.188 12.2363C2.05128 12.3926 1.95362 12.5879 1.95362 12.8125C1.95362 13.2715 2.30518 13.6133 2.76418 13.6133C2.98878 13.6133 3.1841 13.5352 3.33058 13.3789L9.36574 7.38282C9.53176 7.2168 9.60988 7.02148 9.60988 6.80664Z" />
        </Svg>
      );
    /** untoggle-bar / custom-chevron-backward — left-pointing chevron.
     *  Matches the artwork in assets/symbol/untoggle_bottom_control_bar.svg
     *  and assets/symbol/custom.chevron.backward.svg. */
    case 'untoggle-bar':
    case 'custom-chevron-backward':
      return (
        <Svg width={size} height={size} viewBox="0 0 9.60888 13.623">
          <Path fill={strokeColor} d="M-1.11022e-16 6.80664C-1.11022e-16 7.02148 0.087892 7.2168 0.244142 7.38282L6.2793 13.3789C6.42578 13.5352 6.63086 13.6133 6.85548 13.6133C7.31446 13.6133 7.65626 13.2715 7.65626 12.8125C7.65626 12.5879 7.56836 12.3926 7.42188 12.2363L1.97266 6.80664L7.42188 1.37696C7.56836 1.2207 7.65626 1.01562 7.65626 0.80078C7.65626 0.3418 7.31446 0 6.85548 0C6.63086 0 6.42578 0.07812 6.2793 0.23438L0.244142 6.23046C0.087892 6.39648-1.11022e-16 6.5918-1.11022e-16 6.80664Z" />
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
          <Path fill={strokeColor} d="M19.8614 5.91016L19.8614 11.2791C19.2648 11.3234 18.7547 11.6656 18.4552 12.1565L18.4552 5.97852C18.4552 5.23634 18.0548 4.86524 17.3516 4.86524L8.14266 4.86524C7.43952 4.86524 7.03914 5.23634 7.03914 5.97852L7.03914 15.1582C7.03914 15.8906 7.43952 16.2715 8.14266 16.2715L14.5072 16.2715L14.5072 16.6934C14.5072 17.06 14.6192 17.4023 14.8109 17.6875L8.12312 17.6875C6.46296 17.6875 5.63288 16.8672 5.63288 15.2266L5.63288 5.91016C5.63288 4.26954 6.46296 3.44922 8.12312 3.44922L17.3712 3.44922C19.0411 3.44922 19.8614 4.26954 19.8614 5.91016Z" />
          <Path fill={strokeColor} d="M14.3829 5.95898L13.0352 9.58204L15.5841 9.58204C15.7891 9.58204 15.9649 9.73828 15.9649 9.94336C15.9649 10.0508 15.9161 10.168 15.8282 10.2656L11.7071 15.4414C11.3555 15.8613 10.7989 15.5781 10.9942 15.0508L12.3419 11.418L9.8028 11.418C9.58796 11.418 9.42194 11.2617 9.42194 11.0566C9.42194 10.9492 9.47078 10.832 9.55866 10.7344L13.6798 5.56836C14.0216 5.13868 14.588 5.43164 14.3829 5.95898Z" />
          <Path fill={strokeColor} d="M16.3041 17.1523C16.5873 17.1523 16.7924 16.9473 16.7924 16.6934L16.7924 15.707C16.7924 15.4434 16.5873 15.2285 16.3041 15.2285C16.0502 15.2285 15.8451 15.4434 15.8451 15.707L15.8451 16.6934C15.8451 16.9473 16.0502 17.1523 16.3041 17.1523Z" />
          <Path fill={strokeColor} d="M18.1595 18.4609C18.4232 18.4609 18.6283 18.2559 18.6283 17.9727L18.6283 14.4082C18.6283 14.1445 18.4232 13.9395 18.1595 13.9395C17.8959 13.9395 17.681 14.1445 17.681 14.4082L17.681 17.9727C17.681 18.2559 17.8959 18.4609 18.1595 18.4609Z" />
          <Path fill={strokeColor} d="M19.9955 19.7891C20.2689 19.7891 20.474 19.584 20.474 19.3105L20.474 13.0898C20.474 12.8164 20.2689 12.6113 19.9955 12.6113C19.7318 12.6113 19.5267 12.8164 19.5267 13.0898L19.5267 19.3105C19.5267 19.5938 19.722 19.7891 19.9955 19.7891Z" />
          <Path fill={strokeColor} d="M21.8314 19.0469C22.1049 19.0469 22.3099 18.8418 22.3099 18.5684L22.3099 13.8125C22.3099 13.5586 22.1049 13.3535 21.8314 13.3535C21.5775 13.3535 21.3627 13.5586 21.3627 13.8125L21.3627 18.5684C21.3627 18.8418 21.5775 19.0469 21.8314 19.0469Z" />
          <Path fill={strokeColor} d="M23.6771 17.5527C23.9506 17.5527 24.1556 17.3477 24.1556 17.0742L24.1556 15.3066C24.1556 15.043 23.9506 14.8379 23.6771 14.8379C23.4134 14.8379 23.2084 15.0527 23.2084 15.3066L23.2084 17.0742C23.2084 17.3379 23.4134 17.5527 23.6771 17.5527Z" />
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
