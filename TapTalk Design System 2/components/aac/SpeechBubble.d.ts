import * as React from 'react';

export interface SpeechBubbleProps {
  children?: React.ReactNode;
  /** Text content (enables typewriter when set). */
  text?: string;
  /** Pointer tail side. @default 'bottom' */
  tail?: 'bottom' | 'top';
  /** Reveal text character-by-character. */
  typewriter?: boolean;
  /** ms per character. @default 38 */
  speed?: number;
  style?: React.CSSProperties;
}

/**
 * Clo's dialogue bubble — rounded white card with a tail. Pair with <Mascot>
 * for onboarding intros and guidance, optionally with a typewriter reveal.
 */
export function SpeechBubble(props: SpeechBubbleProps): JSX.Element;
