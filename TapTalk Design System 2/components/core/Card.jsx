import React from 'react';

/**
 * TapTalk content card — white surface, 16px radius, subtle lift.
 * `padding` and `radius` ('card' | 'bg' | 'sheet') are configurable.
 */
export function Card({ children, radius = 'card', padding = 16, border = true, style, ...rest }) {
  const radiusMap = {
    card: 'var(--tt-radius-card)',
    bg: 'var(--tt-radius-bg-card)',
    sheet: 'var(--tt-radius-sheet)',
  };
  return (
    <div
      style={{
        background: 'var(--tt-surface)',
        borderRadius: radiusMap[radius] || radiusMap.card,
        border: border ? '1.5px solid var(--tt-border)' : 'none',
        padding,
        boxShadow: 'var(--tt-shadow-card)',
        boxSizing: 'border-box',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
