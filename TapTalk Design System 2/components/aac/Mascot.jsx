import React from 'react';

/**
 * Clo mascot image holder. Path-agnostic: pass the resolved `src` for the pose
 * PNG (the design system ships ~30 poses under assets/mascots/). Optional gentle
 * idle float. Always give a meaningful `alt` for screen readers.
 */
export function Mascot({ src, alt = 'Clo, the TapTalk mascot', size = 120, float = false, style, ...rest }) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        animation: float ? 'tt-float 2.8s ease-in-out infinite' : 'none',
        ...style,
      }}
      {...rest}
    />
  );
}
