import * as React from 'react';

export interface MascotProps {
  /** Resolved URL to a pose PNG (e.g. assets/mascots/happy_smile.png). */
  src: string;
  /** Accessible description of the pose/emotion. */
  alt?: string;
  /** Rendered square size in px. @default 120 */
  size?: number;
  /** Gentle idle float loop (respects reduced-motion). */
  float?: boolean;
  style?: React.CSSProperties;
}

/**
 * Clo — the baby-blue speech-bubble mascot. Use for onboarding moments,
 * encouragement, empty states, and emotional feedback. ~30 poses available.
 */
export function Mascot(props: MascotProps): JSX.Element;
