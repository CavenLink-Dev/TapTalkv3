import React from 'react';

const TONES = {
  conjunction: 'var(--tt-sym-conjunction)',
  noun: 'var(--tt-sym-noun)',
  pronoun: 'var(--tt-sym-pronoun)',
  verb: 'var(--tt-sym-verb)',
  adjective: 'var(--tt-sym-adjective)',
  preposition: 'var(--tt-sym-preposition)',
  negation: 'var(--tt-sym-negation)',
  question: 'var(--tt-sym-question)',
  social: 'var(--tt-sym-social)',
  article: 'var(--tt-sym-article)',
  interjection: 'var(--tt-sym-interjection)',
  folder: 'var(--tt-sym-folder)',
};

/**
 * AAC symbol cell — a tappable word/folder tile from the Talk board.
 * Colour-coded by word type (Fitzgerald key). Renders an image symbol when
 * `image` is given, otherwise an emoji/character `symbol`. `kind` controls
 * layout: word, folder (label flap on top), article (big centred word), or
 * question.
 */
export function SymbolCell({
  label,
  tone = 'noun',
  symbol,
  image,
  kind = 'word',
  size = 76,
  onClick,
  style,
  ...rest
}) {
  const [pressed, setPressed] = React.useState(false);
  const bg = TONES[tone] || TONES.noun;

  const base = {
    position: 'relative',
    width: size,
    height: size,
    flex: 'none',
    padding: 0,
    background: bg,
    border: '2px solid var(--tt-symbol-outline)',
    borderRadius: 'var(--tt-radius-cell)',
    cursor: 'pointer',
    overflow: 'hidden',
    transform: pressed ? 'scale(0.88)' : 'scale(1)',
    transition: 'transform 120ms cubic-bezier(0.34,1.3,0.64,1)',
    WebkitTapHighlightColor: 'transparent',
    ...style,
  };

  const handlers = {
    onClick,
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerLeave: () => setPressed(false),
  };

  const labelStyle = {
    fontFamily: 'var(--tt-font-display)',
    fontWeight: 700,
    color: 'var(--tt-text)',
    lineHeight: 1,
  };

  if (image) {
    return (
      <button type="button" aria-label={label} style={base} {...handlers} {...rest}>
        <img src={image} alt={label}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </button>
    );
  }

  if (kind === 'folder') {
    return (
      <button type="button" aria-label={`Open ${label} folder`} style={base} {...handlers} {...rest}>
        <span style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          background: 'var(--tt-folder-flap)',
          padding: '3px 4px',
          ...labelStyle, fontSize: Math.max(11, size * 0.16), textAlign: 'left',
        }}>{label}</span>
        <span style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.42, paddingTop: size * 0.18,
        }}>{symbol}</span>
      </button>
    );
  }

  if (kind === 'article') {
    return (
      <button type="button" aria-label={label} style={base} {...handlers} {...rest}>
        <span style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          ...labelStyle, color: '#fff', fontSize: size * 0.3,
        }}>{label}</span>
      </button>
    );
  }

  // word | question
  return (
    <button type="button" aria-label={label} style={base} {...handlers} {...rest}>
      <span style={{
        position: 'absolute', top: 4, left: 5,
        ...labelStyle, fontSize: Math.max(11, size * 0.15),
      }}>{label}</span>
      <span style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: kind === 'question' ? size * 0.5 : size * 0.4,
        paddingTop: size * 0.16,
        fontWeight: kind === 'question' ? 800 : 400,
        fontFamily: kind === 'question' ? 'var(--tt-font-display)' : 'inherit',
        color: kind === 'question' ? 'var(--tt-text)' : 'inherit',
      }}>{symbol}</span>
    </button>
  );
}
