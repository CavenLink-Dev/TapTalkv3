import React from 'react';

/**
 * Clo's speech bubble — a rounded white card with a pointer tail, used to
 * present mascot dialogue in onboarding. Optional typewriter reveal.
 */
export function SpeechBubble({ children, text, tail = 'bottom', typewriter = false, speed = 38, style, ...rest }) {
  const full = text ?? (typeof children === 'string' ? children : '');
  const [shown, setShown] = React.useState(typewriter ? '' : full);

  React.useEffect(() => {
    if (!typewriter || !full) { setShown(full); return; }
    setShown('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [full, typewriter, speed]);

  const tailStyle = tail === 'bottom'
    ? { bottom: -10, left: 28, borderWidth: '11px 9px 0 9px', borderColor: 'var(--tt-surface) transparent transparent transparent' }
    : { top: -10, left: 28, borderWidth: '0 9px 11px 9px', borderColor: 'transparent transparent var(--tt-surface) transparent' };

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--tt-surface)',
        border: '1.5px solid var(--tt-border)',
        borderRadius: 'var(--tt-radius-card)',
        padding: '14px 18px',
        fontFamily: 'var(--tt-font-display)',
        fontWeight: 600,
        fontSize: 18,
        lineHeight: 1.35,
        color: 'var(--tt-text)',
        boxShadow: 'var(--tt-shadow-card)',
        ...style,
      }}
      {...rest}
    >
      {typewriter ? shown : (text ?? children)}
      <span style={{
        position: 'absolute',
        width: 0, height: 0,
        border: 'solid',
        ...tailStyle,
      }} />
    </div>
  );
}
