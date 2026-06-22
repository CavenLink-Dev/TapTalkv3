/* @ds-bundle: {"format":3,"namespace":"TapTalkDesignSystem_5cf136","components":[{"name":"Mascot","sourcePath":"components/aac/Mascot.jsx"},{"name":"SpeechBubble","sourcePath":"components/aac/SpeechBubble.jsx"},{"name":"SymbolCell","sourcePath":"components/aac/SymbolCell.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Checkbox","sourcePath":"components/core/Checkbox.jsx"},{"name":"Pill","sourcePath":"components/core/Pill.jsx"},{"name":"ProgressBar","sourcePath":"components/core/ProgressBar.jsx"},{"name":"Switch","sourcePath":"components/core/Switch.jsx"},{"name":"TextField","sourcePath":"components/core/TextField.jsx"}],"sourceHashes":{"components/aac/Mascot.jsx":"7e26d8659596","components/aac/SpeechBubble.jsx":"562acb330b1e","components/aac/SymbolCell.jsx":"e5401e421ec1","components/core/Badge.jsx":"2448e42ff6d0","components/core/Button.jsx":"c4b32dc8b9ad","components/core/Card.jsx":"2935e81e6025","components/core/Checkbox.jsx":"5e9198d207d4","components/core/Pill.jsx":"602028ff727b","components/core/ProgressBar.jsx":"42f1995814d9","components/core/Switch.jsx":"d98e9c219856","components/core/TextField.jsx":"9dc8b10d8d2a","ui_kits/app/AppShell.jsx":"599741e63703","ui_kits/app/MeScreen.jsx":"07be7d860b3a","ui_kits/app/OnboardingScreen.jsx":"14ded01af453","ui_kits/app/TalkScreen.jsx":"c3294d096bb5","ui_kits/app/TodayScreen.jsx":"34ba30b5da7e"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.TapTalkDesignSystem_5cf136 = window.TapTalkDesignSystem_5cf136 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/aac/Mascot.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Clo mascot image holder. Path-agnostic: pass the resolved `src` for the pose
 * PNG (the design system ships ~30 poses under assets/mascots/). Optional gentle
 * idle float. Always give a meaningful `alt` for screen readers.
 */
function Mascot({
  src,
  alt = 'Clo, the TapTalk mascot',
  size = 120,
  float = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("img", _extends({
    src: src,
    alt: alt,
    width: size,
    height: size,
    style: {
      width: size,
      height: size,
      objectFit: 'contain',
      animation: float ? 'tt-float 2.8s ease-in-out infinite' : 'none',
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Mascot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/aac/Mascot.jsx", error: String((e && e.message) || e) }); }

// components/aac/SpeechBubble.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Clo's speech bubble — a rounded white card with a pointer tail, used to
 * present mascot dialogue in onboarding. Optional typewriter reveal.
 */
function SpeechBubble({
  children,
  text,
  tail = 'bottom',
  typewriter = false,
  speed = 38,
  style,
  ...rest
}) {
  const full = text ?? (typeof children === 'string' ? children : '');
  const [shown, setShown] = React.useState(typewriter ? '' : full);
  React.useEffect(() => {
    if (!typewriter || !full) {
      setShown(full);
      return;
    }
    setShown('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [full, typewriter, speed]);
  const tailStyle = tail === 'bottom' ? {
    bottom: -10,
    left: 28,
    borderWidth: '11px 9px 0 9px',
    borderColor: 'var(--tt-surface) transparent transparent transparent'
  } : {
    top: -10,
    left: 28,
    borderWidth: '0 9px 11px 9px',
    borderColor: 'transparent transparent var(--tt-surface) transparent'
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
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
      ...style
    }
  }, rest), typewriter ? shown : text ?? children, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      width: 0,
      height: 0,
      border: 'solid',
      ...tailStyle
    }
  }));
}
Object.assign(__ds_scope, { SpeechBubble });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/aac/SpeechBubble.jsx", error: String((e && e.message) || e) }); }

// components/aac/SymbolCell.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
  folder: 'var(--tt-sym-folder)'
};

/**
 * AAC symbol cell — a tappable word/folder tile from the Talk board.
 * Colour-coded by word type (Fitzgerald key). Renders an image symbol when
 * `image` is given, otherwise an emoji/character `symbol`. `kind` controls
 * layout: word, folder (label flap on top), article (big centred word), or
 * question.
 */
function SymbolCell({
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
    ...style
  };
  const handlers = {
    onClick,
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerLeave: () => setPressed(false)
  };
  const labelStyle = {
    fontFamily: 'var(--tt-font-display)',
    fontWeight: 700,
    color: 'var(--tt-text)',
    lineHeight: 1
  };
  if (image) {
    return /*#__PURE__*/React.createElement("button", _extends({
      type: "button",
      "aria-label": label,
      style: base
    }, handlers, rest), /*#__PURE__*/React.createElement("img", {
      src: image,
      alt: label,
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block'
      }
    }));
  }
  if (kind === 'folder') {
    return /*#__PURE__*/React.createElement("button", _extends({
      type: "button",
      "aria-label": `Open ${label} folder`,
      style: base
    }, handlers, rest), /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        background: 'var(--tt-folder-flap)',
        padding: '3px 4px',
        ...labelStyle,
        fontSize: Math.max(11, size * 0.16),
        textAlign: 'left'
      }
    }, label), /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.42,
        paddingTop: size * 0.18
      }
    }, symbol));
  }
  if (kind === 'article') {
    return /*#__PURE__*/React.createElement("button", _extends({
      type: "button",
      "aria-label": label,
      style: base
    }, handlers, rest), /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...labelStyle,
        color: '#fff',
        fontSize: size * 0.3
      }
    }, label));
  }

  // word | question
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    style: base
  }, handlers, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 4,
      left: 5,
      ...labelStyle,
      fontSize: Math.max(11, size * 0.15)
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: kind === 'question' ? size * 0.5 : size * 0.4,
      paddingTop: size * 0.16,
      fontWeight: kind === 'question' ? 800 : 400,
      fontFamily: kind === 'question' ? 'var(--tt-font-display)' : 'inherit',
      color: kind === 'question' ? 'var(--tt-text)' : 'inherit'
    }
  }, symbol));
}
Object.assign(__ds_scope, { SymbolCell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/aac/SymbolCell.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Small status badge / tag. Tones: neutral, primary, success, warning, danger.
 * Use for counts, streaks, "PREMIUM", "Free forever", status labels.
 */
function Badge({
  label,
  children,
  tone = 'neutral',
  solid = false,
  style,
  ...rest
}) {
  const tones = {
    neutral: {
      fg: 'var(--tt-text-muted)',
      bg: 'var(--tt-input-bg)',
      solidBg: 'var(--tt-text-muted)'
    },
    primary: {
      fg: 'var(--tt-primary-dark)',
      bg: 'rgba(25,154,238,0.14)',
      solidBg: 'var(--tt-primary)'
    },
    success: {
      fg: '#1B7F3B',
      bg: 'rgba(48,209,88,0.16)',
      solidBg: 'var(--tt-success)'
    },
    warning: {
      fg: '#9A5800',
      bg: 'rgba(255,149,0,0.16)',
      solidBg: 'var(--tt-warning)'
    },
    danger: {
      fg: '#B71E18',
      bg: 'rgba(243,49,42,0.14)',
      solidBg: 'var(--tt-danger)'
    }
  };
  const t = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      height: 24,
      padding: '0 10px',
      fontSize: 12,
      fontFamily: 'var(--tt-font-display)',
      fontWeight: 800,
      letterSpacing: '0.2px',
      color: solid ? '#fff' : t.fg,
      background: solid ? t.solidBg : t.bg,
      borderRadius: 'var(--tt-radius-pill)',
      ...style
    }
  }, rest), label ?? children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * TapTalk primary action button.
 * Rounded (10px), bold rounded-display label, large 50px min tap target.
 * Variants: primary (blue), secondary (soft-blue), danger (red), ghost.
 */
function Button({
  label,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  full = false,
  onClick,
  style,
  ...rest
}) {
  const [pressed, setPressed] = React.useState(false);
  const sizes = {
    sm: {
      minHeight: 40,
      fontSize: 15,
      padding: '0 16px'
    },
    md: {
      minHeight: 50,
      fontSize: 17,
      padding: '0 18px'
    },
    lg: {
      minHeight: 56,
      fontSize: 19,
      padding: '0 24px'
    }
  };
  const palettes = {
    primary: {
      bg: 'var(--tt-primary)',
      fg: 'var(--tt-text-on-dark)',
      pressBg: 'var(--tt-primary-pressed)'
    },
    secondary: {
      bg: 'var(--tt-soft-blue)',
      fg: 'var(--tt-primary-dark)',
      pressBg: '#C4D4DE'
    },
    danger: {
      bg: 'var(--tt-danger)',
      fg: 'var(--tt-text-on-dark)',
      pressBg: '#FF5A54'
    },
    ghost: {
      bg: 'transparent',
      fg: 'var(--tt-primary-dark)',
      pressBg: 'rgba(25,154,238,0.10)'
    }
  };
  const p = palettes[variant] || palettes.primary;
  const s = sizes[size] || sizes.md;
  const isDisabled = disabled || loading;
  const bg = isDisabled ? 'var(--tt-disabled)' : pressed ? p.pressBg : p.bg;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: isDisabled,
    onClick: onClick,
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerLeave: () => setPressed(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      width: full ? '100%' : 'auto',
      minHeight: s.minHeight,
      padding: s.padding,
      fontSize: s.fontSize,
      fontFamily: 'var(--tt-button-font)',
      fontWeight: 'var(--tt-button-weight)',
      letterSpacing: '-0.3px',
      color: isDisabled ? 'var(--tt-text-tertiary)' : p.fg,
      background: bg,
      border: variant === 'ghost' && !pressed ? '1.5px solid transparent' : 'none',
      borderRadius: 'var(--tt-radius-button)',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      transform: pressed && !isDisabled ? 'scale(0.97)' : 'scale(1)',
      transition: 'transform 120ms ease, background 120ms ease',
      WebkitTapHighlightColor: 'transparent',
      ...style
    }
  }, rest), loading && /*#__PURE__*/React.createElement(Spinner, {
    color: p.fg
  }), !loading && (label ?? children));
}
function Spinner({
  color
}) {
  return /*#__PURE__*/React.createElement("span", {
    "aria-label": "Loading",
    style: {
      width: 18,
      height: 18,
      borderRadius: '50%',
      border: `2.5px solid ${color === 'var(--tt-text-on-dark)' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.18)'}`,
      borderTopColor: color,
      display: 'inline-block',
      animation: 'tt-spin 0.7s linear infinite'
    }
  });
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * TapTalk content card — white surface, 16px radius, subtle lift.
 * `padding` and `radius` ('card' | 'bg' | 'sheet') are configurable.
 */
function Card({
  children,
  radius = 'card',
  padding = 16,
  border = true,
  style,
  ...rest
}) {
  const radiusMap = {
    card: 'var(--tt-radius-card)',
    bg: 'var(--tt-radius-bg-card)',
    sheet: 'var(--tt-radius-sheet)'
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--tt-surface)',
      borderRadius: radiusMap[radius] || radiusMap.card,
      border: border ? '1.5px solid var(--tt-border)' : 'none',
      padding,
      boxShadow: 'var(--tt-shadow-card)',
      boxSizing: 'border-box',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Checkbox with rounded box and animated check. Used for consent rows and
 * task completion. 28px box for an easy tap target.
 */
function Checkbox({
  checked = false,
  onChange,
  label,
  disabled = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    role: "checkbox",
    "aria-checked": checked,
    disabled: disabled,
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: 0,
      border: 'none',
      background: 'transparent',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      textAlign: 'left',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      flex: 'none',
      borderRadius: 8,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: checked ? 'var(--tt-success)' : 'var(--tt-surface)',
      border: checked ? '2px solid var(--tt-success)' : '2px solid var(--tt-border)',
      transition: 'background 150ms ease, border-color 150ms ease'
    }
  }, checked && /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 8.5L6.5 12L13 4.5",
    stroke: "#fff",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--tt-font-base)',
      fontSize: 15,
      color: 'var(--tt-text-muted)'
    }
  }, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/core/Pill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Selectable pill / chip. Used for categories, options, and segmented choices.
 * Selected = primary fill + white label; idle = surface + muted label.
 */
function Pill({
  label,
  children,
  selected = false,
  onClick,
  style,
  ...rest
}) {
  const [pressed, setPressed] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick,
    "aria-pressed": selected,
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerLeave: () => setPressed(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 34,
      padding: '0 16px',
      fontSize: 13,
      fontFamily: 'var(--tt-font-display)',
      fontWeight: 700,
      color: selected ? 'var(--tt-text-on-dark)' : 'var(--tt-text-muted)',
      background: selected ? 'var(--tt-primary)' : 'var(--tt-surface)',
      border: selected ? '1.5px solid var(--tt-primary)' : '1.5px solid var(--tt-border)',
      borderRadius: 'var(--tt-radius-pill)',
      cursor: 'pointer',
      transform: pressed ? 'scale(0.97)' : 'scale(1)',
      transition: 'transform 120ms ease, background 120ms ease',
      WebkitTapHighlightColor: 'transparent',
      ...style
    }
  }, rest), label ?? children);
}
Object.assign(__ds_scope, { Pill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Pill.jsx", error: String((e && e.message) || e) }); }

// components/core/ProgressBar.jsx
try { (() => {
/**
 * Progress bar. Single mode = one liquid pill fill (0–1 `value`).
 * Two-phase mode (`segments={2}`) mirrors the onboarding bar: parent setup
 * then child customisation, each its own pill.
 */
function ProgressBar({
  value = 0,
  segments = 1,
  height = 16,
  color = 'var(--tt-primary)',
  style
}) {
  const clamp = v => Math.max(0, Math.min(1, v));
  if (segments === 2) {
    // value is overall 0–1; phase 1 = first 75%, phase 2 = last 25% (6 + 2 steps)
    const f1 = clamp(value / 0.75);
    const f2 = clamp((value - 0.75) / 0.25);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10,
        ...style
      }
    }, /*#__PURE__*/React.createElement(Pill, {
      fraction: f1,
      height: height,
      color: color
    }), /*#__PURE__*/React.createElement(Pill, {
      fraction: f2,
      height: height,
      color: color
    }));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: style
  }, /*#__PURE__*/React.createElement(Pill, {
    fraction: clamp(value),
    height: height,
    color: color
  }));
}
function Pill({
  fraction,
  height,
  color
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height,
      borderRadius: 'var(--tt-radius-pill)',
      background: 'var(--tt-soft-blue)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${fraction * 100}%`,
      height: '100%',
      background: color,
      borderRadius: 'var(--tt-radius-pill)',
      transition: 'width 450ms cubic-bezier(0.34,1.3,0.64,1)'
    }
  }));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/core/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * iOS-style toggle switch. On = primary fill; off = soft-blue track.
 * 44px wide track meets the minimum touch target with surrounding padding.
 */
function Switch({
  checked = false,
  onChange,
  disabled = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    role: "switch",
    "aria-checked": checked,
    disabled: disabled,
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      position: 'relative',
      width: 51,
      height: 31,
      flex: 'none',
      padding: 0,
      border: 'none',
      borderRadius: 999,
      background: checked ? 'var(--tt-primary)' : 'var(--tt-soft-blue)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'background 200ms ease',
      WebkitTapHighlightColor: 'transparent',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 2,
      left: checked ? 22 : 2,
      width: 27,
      height: 27,
      borderRadius: '50%',
      background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      transition: 'left 200ms cubic-bezier(0.34,1.3,0.64,1)'
    }
  }));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Switch.jsx", error: String((e && e.message) || e) }); }

// components/core/TextField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * TapTalk text input. 48px min height, 1.5px border, soft-grey fill.
 * Supports label, helper/error text, and a shake-on-error state.
 */
function TextField({
  label,
  helper,
  error,
  value,
  onChange,
  placeholder,
  type = 'text',
  white = false,
  disabled = false,
  style,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const hasError = Boolean(error);
  const borderColor = hasError ? 'var(--tt-danger)' : focused ? 'var(--tt-primary)' : 'var(--tt-border)';
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      fontFamily: 'var(--tt-font-base)',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontFamily: 'var(--tt-font-display)',
      fontWeight: 700,
      fontSize: 13,
      letterSpacing: '0.2px',
      color: 'var(--tt-primary)',
      textTransform: 'uppercase',
      marginBottom: 6
    }
  }, label), /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      width: '100%',
      boxSizing: 'border-box',
      minHeight: 48,
      padding: '10px 14px',
      fontSize: 17,
      fontFamily: 'var(--tt-font-base)',
      color: 'var(--tt-text)',
      background: white ? 'var(--tt-input-bg-white)' : 'var(--tt-input-bg)',
      border: `1.5px solid ${borderColor}`,
      borderRadius: 'var(--tt-radius-input)',
      outline: 'none',
      opacity: disabled ? 0.55 : 1,
      animation: hasError ? 'tt-shake 0.4s ease' : 'none',
      transition: 'border-color 150ms ease'
    }
  }, rest)), (helper || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      marginTop: 5,
      fontSize: 13,
      color: hasError ? 'var(--tt-danger)' : 'var(--tt-text-tertiary)'
    }
  }, error || helper));
}
Object.assign(__ds_scope, { TextField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/TextField.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/AppShell.jsx
try { (() => {
/* global React */

// Pull primitives from the compiled design-system bundle.
const DS = window.TapTalkDesignSystem_5cf136;
const ASSET = '../../assets';

// ─── Phone frame ──────────────────────────────────────────────────────────────
function PhoneFrame({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 393,
      height: 844,
      position: 'relative',
      flex: 'none',
      background: '#000',
      borderRadius: 56,
      padding: 11,
      boxShadow: '0 30px 80px rgba(13,36,54,0.32)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      background: 'var(--tt-background)',
      borderRadius: 46,
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 9,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 126,
      height: 34,
      background: '#000',
      borderRadius: 20,
      zIndex: 50
    }
  }), children));
}

// ─── Status bar ───────────────────────────────────────────────────────────────
function StatusBar({
  dark
}) {
  const c = dark ? '#fff' : 'var(--tt-text)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 50,
      flex: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px 0 32px',
      fontFamily: 'var(--tt-font-display)',
      fontWeight: 800,
      fontSize: 15,
      color: c
    }
  }, /*#__PURE__*/React.createElement("span", null, "9:41"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u25CF\u25CF\u25CF"), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCF6"), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD0B")));
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
function TabBar({
  active,
  onChange
}) {
  const tabs = [{
    id: 'talk',
    label: 'Talk',
    icon: `${ASSET}/aac/board_icon.png`
  }, {
    id: 'today',
    label: 'Today',
    icon: `${ASSET}/aac/tools_icon.png`
  }, {
    id: 'me',
    label: 'Me',
    icon: `${ASSET}/aac/profile_icon.png`
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 'none',
      display: 'flex',
      background: 'var(--tt-nav-background)',
      borderTop: '1px solid #E3E9EF',
      paddingBottom: 22,
      paddingTop: 8
    }
  }, tabs.map(t => {
    const on = active === t.id;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      onClick: () => onChange(t.id),
      style: {
        flex: 1,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '4px 0',
        WebkitTapHighlightColor: 'transparent'
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: t.icon,
      alt: "",
      style: {
        width: 26,
        height: 26,
        objectFit: 'contain',
        opacity: on ? 1 : 0.4,
        filter: on ? 'none' : 'grayscale(0.6)'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--tt-font-display)',
        fontWeight: 800,
        fontSize: 10,
        color: on ? 'var(--tt-primary)' : 'var(--tt-text-tertiary)'
      }
    }, t.label));
  }));
}

// ─── App shell ────────────────────────────────────────────────────────────────
function App() {
  const [phase, setPhase] = React.useState('onboarding'); // 'onboarding' | 'app'
  const [tab, setTab] = React.useState('talk');
  let screen = null;
  if (phase === 'onboarding') {
    screen = /*#__PURE__*/React.createElement(window.OnboardingScreen, {
      onDone: () => setPhase('app')
    });
  } else if (tab === 'talk') {
    screen = /*#__PURE__*/React.createElement(window.TalkScreen, null);
  } else if (tab === 'today') {
    screen = /*#__PURE__*/React.createElement(window.TodayScreen, null);
  } else {
    screen = /*#__PURE__*/React.createElement(window.MeScreen, {
      onRestart: () => {
        setPhase('onboarding');
        setTab('talk');
      }
    });
  }
  return /*#__PURE__*/React.createElement(PhoneFrame, null, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, screen), phase === 'app' && /*#__PURE__*/React.createElement(TabBar, {
    active: tab,
    onChange: setTab
  }));
}
Object.assign(window, {
  App,
  ASSET,
  DS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/MeScreen.jsx
try { (() => {
/* global React */

function MeScreen({
  onRestart
}) {
  const {
    Card,
    Switch,
    Badge,
    Button,
    Mascot
  } = window.DS;
  const A = window.ASSET;
  const [lock, setLock] = React.useState(true);
  const [sound, setSound] = React.useState(true);
  const [haptics, setHaptics] = React.useState(true);
  const rows = [{
    label: 'Parental lock',
    value: lock,
    set: setLock,
    hint: 'PIN required to exit'
  }, {
    label: 'Speak on tap',
    value: sound,
    set: setSound,
    hint: 'Read words aloud'
  }, {
    label: 'Haptic feedback',
    value: haptics,
    set: setHaptics,
    hint: 'Vibrate on press'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      padding: '4px 20px 20px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--tt-font-display)',
      fontWeight: 800,
      fontSize: 30,
      color: 'var(--tt-text)',
      margin: '6px 0 16px'
    }
  }, "Me"), /*#__PURE__*/React.createElement(Card, {
    padding: 20,
    style: {
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 76,
      height: 76,
      borderRadius: 999,
      background: 'var(--tt-soft-blue)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement(Mascot, {
    src: `${A}/mascots/heart_eyes.png`,
    alt: "Clo",
    size: 62
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--tt-font-display)',
      fontWeight: 800,
      fontSize: 22,
      color: 'var(--tt-text)'
    }
  }, "DragonSlayer20"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--tt-font-base)',
      fontSize: 14,
      color: 'var(--tt-text-muted)',
      marginBottom: 8
    }
  }, "Alex Jones \xB7 age 9"), /*#__PURE__*/React.createElement(Badge, {
    tone: "success"
  }, "Free forever"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginBottom: 16
    }
  }, [['128', 'words today'], ['6', 'day streak'], ['12', 'sessions']].map(([n, l]) => /*#__PURE__*/React.createElement(Card, {
    key: l,
    padding: 14,
    style: {
      flex: 1,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--tt-font-display)',
      fontWeight: 800,
      fontSize: 26,
      color: 'var(--tt-primary)'
    }
  }, n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--tt-font-base)',
      fontSize: 12,
      color: 'var(--tt-text-muted)'
    }
  }, l)))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--tt-font-display)',
      fontWeight: 800,
      fontSize: 13,
      color: 'var(--tt-text-tertiary)',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      margin: '4px 2px 10px'
    }
  }, "Caregiver controls"), /*#__PURE__*/React.createElement(Card, {
    padding: 6,
    style: {
      marginBottom: 16
    }
  }, rows.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: r.label,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 14px',
      borderBottom: i < rows.length - 1 ? '1px solid #EEF2F6' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--tt-font-display)',
      fontWeight: 700,
      fontSize: 16,
      color: 'var(--tt-text)'
    }
  }, r.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--tt-font-base)',
      fontSize: 13,
      color: 'var(--tt-text-tertiary)'
    }
  }, r.hint)), /*#__PURE__*/React.createElement(Switch, {
    checked: r.value,
    onChange: r.set
  })))), /*#__PURE__*/React.createElement(Card, {
    padding: 20,
    radius: "bg",
    style: {
      marginBottom: 16,
      background: 'var(--tt-primary)',
      border: 'none',
      boxShadow: 'var(--tt-shadow-pop)'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "primary",
    solid: true,
    style: {
      background: 'rgba(255,255,255,0.22)'
    }
  }, "PREMIUM"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--tt-font-display)',
      fontWeight: 800,
      fontSize: 20,
      color: '#fff',
      margin: '10px 0 4px'
    }
  }, "Unlock therapy tools"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--tt-font-base)',
      fontSize: 14,
      color: 'rgba(255,255,255,0.9)',
      marginBottom: 14
    }
  }, "Cognitive activities, progress reports, and guided practice with Clo."), /*#__PURE__*/React.createElement(Button, {
    label: "See plans",
    variant: "secondary",
    full: true
  })), /*#__PURE__*/React.createElement(Button, {
    label: "Restart onboarding",
    variant: "ghost",
    full: true,
    onClick: onRestart
  }));
}
window.MeScreen = MeScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/MeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/OnboardingScreen.jsx
try { (() => {
/* global React */

function OnboardingScreen({
  onDone
}) {
  const {
    ProgressBar,
    SpeechBubble,
    Mascot,
    TextField,
    Button
  } = window.DS;
  const [name, setName] = React.useState('');
  const [display, setDisplay] = React.useState('');
  const A = window.ASSET;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 24px 0'
    }
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    value: 0.18,
    segments: 2
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 22px 0'
    }
  }, /*#__PURE__*/React.createElement(SpeechBubble, {
    tail: "bottom",
    style: {
      fontSize: 17
    }
  }, "Welcome to TapTalk! I'm ", /*#__PURE__*/React.createElement("b", null, "Clo"), ". Before we get started, ", /*#__PURE__*/React.createElement("b", null, "what would you like me to call you?"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      padding: '14px 0 18px'
    }
  }, /*#__PURE__*/React.createElement(Mascot, {
    src: `${A}/mascots/happy_smile.png`,
    alt: "Clo smiling",
    size: 150,
    float: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      background: 'var(--tt-surface)',
      borderTopLeftRadius: 40,
      borderTopRightRadius: 40,
      boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
      padding: '28px 26px 30px',
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(TextField, {
    label: "Name",
    placeholder: "e.g. Alex Jones",
    helper: "Enter your full first and last legal name",
    value: name,
    onChange: e => setName(e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(TextField, {
    label: "Display name",
    placeholder: "e.g. DragonSlayer20",
    helper: "This is the name that will be displayed on the app!",
    value: display,
    onChange: e => setDisplay(e.target.value)
  })), /*#__PURE__*/React.createElement(Button, {
    label: "Continue",
    full: true,
    onClick: onDone,
    style: {
      marginTop: 4
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      fontSize: 12,
      color: 'var(--tt-text-tertiary)',
      fontFamily: 'var(--tt-font-base)'
    }
  }, "Check out this ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--tt-primary)'
    }
  }, "LINK"), " to see how we store confidential data")));
}
window.OnboardingScreen = OnboardingScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/OnboardingScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/TalkScreen.jsx
try { (() => {
/* global React */

const BOARDS = {
  Main: [{
    id: 'hello',
    label: 'Hello',
    symbol: '👋',
    tone: 'conjunction',
    kind: 'word'
  }, {
    id: 'car',
    label: 'Car',
    symbol: '🚗',
    tone: 'noun',
    kind: 'word'
  }, {
    id: 'him',
    label: 'Him',
    symbol: '👦',
    tone: 'pronoun',
    kind: 'word'
  }, {
    id: 'run',
    label: 'Run',
    symbol: '🏃',
    tone: 'verb',
    kind: 'word'
  }, {
    id: 'big',
    label: 'Big',
    symbol: '📦',
    tone: 'adjective',
    kind: 'word'
  }, {
    id: 'where',
    label: 'Where',
    symbol: '?',
    tone: 'question',
    kind: 'question'
  }, {
    id: 'please',
    label: 'Please',
    symbol: '🙏',
    tone: 'social',
    kind: 'word'
  }, {
    id: 'the',
    label: 'The',
    symbol: '',
    tone: 'article',
    kind: 'article'
  }, {
    id: 'ouch',
    label: 'Ouch',
    symbol: '😖',
    tone: 'interjection',
    kind: 'word'
  }, {
    id: 'food',
    label: 'Food',
    symbol: '🍎',
    tone: 'folder',
    kind: 'folder'
  }, {
    id: 'sports',
    label: 'Sports',
    symbol: '⚽',
    tone: 'noun',
    kind: 'word'
  }, {
    id: 'places',
    label: 'Places',
    symbol: '📍',
    tone: 'folder',
    kind: 'folder'
  }],
  Actions: [{
    id: 'eat',
    label: 'Eat',
    symbol: '🍽️',
    tone: 'verb',
    kind: 'word'
  }, {
    id: 'drink',
    label: 'Drink',
    symbol: '🥤',
    tone: 'verb',
    kind: 'word'
  }, {
    id: 'go',
    label: 'Go',
    symbol: '🚶',
    tone: 'verb',
    kind: 'word'
  }, {
    id: 'stop',
    label: 'Stop',
    symbol: '✋',
    tone: 'interjection',
    kind: 'word'
  }, {
    id: 'help',
    label: 'Help',
    symbol: '🤝',
    tone: 'social',
    kind: 'word'
  }, {
    id: 'want',
    label: 'Want',
    symbol: '🙋',
    tone: 'verb',
    kind: 'word'
  }, {
    id: 'play',
    label: 'Play',
    symbol: '🎮',
    tone: 'noun',
    kind: 'word'
  }, {
    id: 'sleep',
    label: 'Sleep',
    symbol: '😴',
    tone: 'adjective',
    kind: 'word'
  }, {
    id: 'sit',
    label: 'Sit',
    symbol: '🪑',
    tone: 'verb',
    kind: 'word'
  }, {
    id: 'walk',
    label: 'Walk',
    symbol: '🚶',
    tone: 'verb',
    kind: 'word'
  }],
  Feelings: [{
    id: 'happy',
    label: 'Happy',
    symbol: '😊',
    tone: 'adjective',
    kind: 'word'
  }, {
    id: 'sad',
    label: 'Sad',
    symbol: '😢',
    tone: 'adjective',
    kind: 'word'
  }, {
    id: 'angry',
    label: 'Angry',
    symbol: '😠',
    tone: 'interjection',
    kind: 'word'
  }, {
    id: 'scared',
    label: 'Scared',
    symbol: '😨',
    tone: 'question',
    kind: 'word'
  }, {
    id: 'tired',
    label: 'Tired',
    symbol: '😴',
    tone: 'adjective',
    kind: 'word'
  }, {
    id: 'excited',
    label: 'Excited',
    symbol: '🤩',
    tone: 'pronoun',
    kind: 'word'
  }, {
    id: 'love',
    label: 'Love',
    symbol: '❤️',
    tone: 'conjunction',
    kind: 'word'
  }, {
    id: 'calm',
    label: 'Calm',
    symbol: '😌',
    tone: 'adjective',
    kind: 'word'
  }],
  Food: [{
    id: 'apple',
    label: 'Apple',
    symbol: '🍎',
    tone: 'noun',
    kind: 'word'
  }, {
    id: 'banana',
    label: 'Banana',
    symbol: '🍌',
    tone: 'noun',
    kind: 'word'
  }, {
    id: 'pizza',
    label: 'Pizza',
    symbol: '🍕',
    tone: 'noun',
    kind: 'word'
  }, {
    id: 'water',
    label: 'Water',
    symbol: '💧',
    tone: 'noun',
    kind: 'word'
  }, {
    id: 'milk',
    label: 'Milk',
    symbol: '🥛',
    tone: 'noun',
    kind: 'word'
  }, {
    id: 'cookie',
    label: 'Cookie',
    symbol: '🍪',
    tone: 'noun',
    kind: 'word'
  }, {
    id: 'juice',
    label: 'Juice',
    symbol: '🍊',
    tone: 'noun',
    kind: 'word'
  }, {
    id: 'bread',
    label: 'Bread',
    symbol: '🍞',
    tone: 'noun',
    kind: 'word'
  }],
  Social: [{
    id: 'yes',
    label: 'Yes',
    symbol: '✅',
    tone: 'verb',
    kind: 'word'
  }, {
    id: 'no',
    label: 'No',
    symbol: '❌',
    tone: 'interjection',
    kind: 'word'
  }, {
    id: 'thankyou',
    label: 'Thank You',
    symbol: '🙏',
    tone: 'social',
    kind: 'word'
  }, {
    id: 'sorry',
    label: 'Sorry',
    symbol: '😔',
    tone: 'conjunction',
    kind: 'word'
  }, {
    id: 'ok',
    label: 'OK',
    symbol: '👌',
    tone: 'verb',
    kind: 'word'
  }, {
    id: 'bye',
    label: 'Bye',
    symbol: '👋',
    tone: 'conjunction',
    kind: 'word'
  }]
};
const CATEGORIES = ['Main', 'Actions', 'Feelings', 'Food', 'Social'];
function mascotFor(n) {
  if (n === 0) return 'neutral_curious';
  if (n === 1) return 'happy_smile';
  if (n === 2) return 'happy_grin';
  return 'excited_tongue';
}
function TalkScreen() {
  const {
    SymbolCell,
    Mascot,
    Pill
  } = window.DS;
  const A = window.ASSET;
  const [cat, setCat] = React.useState('Main');
  const [words, setWords] = React.useState([]);
  const [speaking, setSpeaking] = React.useState(false);
  const text = words.map(w => w.label).join(' ');
  const has = words.length > 0;
  const tapSymbol = item => {
    if (item.kind === 'folder') {
      setCat('Food');
      return;
    }
    setWords(w => [...w, item]);
  };
  const speak = () => {
    if (!has) return;
    setSpeaking(true);
    if (window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(text);
      u.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    } else {
      setTimeout(() => setSpeaking(false), 800);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      padding: '6px 16px 10px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: speak,
    style: {
      flex: 1,
      textAlign: 'left',
      cursor: has ? 'pointer' : 'default',
      background: 'var(--tt-surface)',
      border: '1.5px solid var(--tt-border)',
      borderRadius: 16,
      padding: 12,
      position: 'relative',
      minHeight: 78,
      boxShadow: 'var(--tt-shadow-card)',
      WebkitTapHighlightColor: 'transparent'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Mascot, {
    src: `${A}/mascots/${mascotFor(words.length)}.png`,
    alt: "Clo",
    size: 52,
    style: {
      animation: speaking ? 'tt-float 0.6s ease-in-out infinite' : 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--tt-font-display)',
      fontWeight: 700,
      fontSize: 19,
      color: has ? 'var(--tt-text)' : 'var(--tt-text-tertiary)',
      lineHeight: 1.2
    }
  }, has ? text : 'Tap to speak....')), /*#__PURE__*/React.createElement("span", {
    onClick: e => {
      e.stopPropagation();
      setWords(w => w.slice(0, -1));
    },
    style: {
      position: 'absolute',
      right: 10,
      bottom: 10,
      fontSize: 20,
      opacity: has ? 1 : 0.3,
      cursor: 'pointer'
    }
  }, "\u232B")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setWords([]),
    disabled: !has,
    style: {
      width: 46,
      height: 35,
      borderRadius: 10,
      border: 'none',
      cursor: 'pointer',
      background: 'var(--tt-danger)',
      color: '#fff',
      fontSize: 16,
      opacity: has ? 1 : 0.4
    }
  }, "\uD83D\uDDD1"), /*#__PURE__*/React.createElement("button", {
    onClick: speak,
    disabled: !has,
    style: {
      width: 46,
      height: 35,
      borderRadius: 10,
      border: 'none',
      cursor: 'pointer',
      background: 'var(--tt-success)',
      color: '#fff',
      fontSize: 16,
      opacity: has ? 1 : 0.4
    }
  }, "\uD83D\uDD0A"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      padding: '0 16px 10px',
      overflowX: 'auto'
    }
  }, CATEGORIES.map(c => /*#__PURE__*/React.createElement(Pill, {
    key: c,
    label: c,
    selected: cat === c,
    onClick: () => setCat(c),
    style: {
      flex: 'none'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      padding: '4px 16px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 7
    }
  }, BOARDS[cat].map(item => /*#__PURE__*/React.createElement(SymbolCell, {
    key: item.id,
    label: item.label,
    tone: item.tone,
    symbol: item.symbol,
    kind: item.kind,
    size: 68,
    onClick: () => tapSymbol(item)
  })))));
}
window.TalkScreen = TalkScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/TalkScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/TodayScreen.jsx
try { (() => {
/* global React */

function TodayScreen() {
  const {
    Card,
    Checkbox,
    Badge,
    Pill
  } = window.DS;
  const A = window.ASSET;
  const [tasks, setTasks] = React.useState([{
    id: 1,
    label: 'Brush teeth',
    tag: 'Morning',
    done: true
  }, {
    id: 2,
    label: 'Speech practice with Clo',
    tag: 'Therapy',
    done: false
  }, {
    id: 3,
    label: 'Pack school bag',
    tag: 'Morning',
    done: false
  }, {
    id: 4,
    label: 'Story time',
    tag: 'Evening',
    done: false
  }]);
  const toggle = id => setTasks(t => t.map(x => x.id === id ? {
    ...x,
    done: !x.done
  } : x));
  const done = tasks.filter(t => t.done).length;
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const tagTone = {
    Morning: 'primary',
    Therapy: 'success',
    Evening: 'warning'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      padding: '4px 20px 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--tt-font-display)',
      fontWeight: 800,
      fontSize: 30,
      color: 'var(--tt-text)',
      margin: '6px 0 2px'
    }
  }, "Today"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--tt-font-base)',
      fontSize: 14,
      color: 'var(--tt-text-muted)'
    }
  }, "Tuesday, 22 June")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      margin: '14px 0 18px'
    }
  }, days.map((d, i) => {
    const today = i === 1;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        flex: 1,
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--tt-text-tertiary)',
        fontFamily: 'var(--tt-font-display)',
        marginBottom: 6
      }
    }, d), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 38,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--tt-font-display)',
        fontWeight: 800,
        fontSize: 15,
        background: today ? 'var(--tt-primary)' : 'var(--tt-surface)',
        color: today ? '#fff' : 'var(--tt-text-muted)',
        border: today ? 'none' : '1.5px solid var(--tt-border)'
      }
    }, 20 + i));
  })), /*#__PURE__*/React.createElement(Card, {
    padding: 16,
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--tt-font-display)',
      fontWeight: 800,
      fontSize: 13,
      color: 'var(--tt-text-tertiary)',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 12
    }
  }, "First \xB7 Then"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, [['First', '🦷', 'Brush teeth'], ['Then', '🎮', 'Play time']].map(([k, e, l], i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: k
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center',
      background: 'var(--tt-input-bg)',
      borderRadius: 14,
      padding: '14px 8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      color: 'var(--tt-primary)',
      fontFamily: 'var(--tt-font-display)',
      letterSpacing: 0.4
    }
  }, k.toUpperCase()), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 34,
      margin: '4px 0'
    }
  }, e), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      fontFamily: 'var(--tt-font-display)',
      color: 'var(--tt-text)'
    }
  }, l)), i === 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      color: 'var(--tt-text-tertiary)'
    }
  }, "\u2192"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      margin: '4px 2px 12px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--tt-font-display)',
      fontWeight: 800,
      fontSize: 18,
      color: 'var(--tt-text)'
    }
  }, "Tasks"), /*#__PURE__*/React.createElement(Badge, {
    tone: "primary"
  }, done, "/", tasks.length, " done")), /*#__PURE__*/React.createElement(Card, {
    padding: 6
  }, tasks.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 12px',
      borderBottom: i < tasks.length - 1 ? '1px solid #EEF2F6' : 'none'
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    checked: t.done,
    onChange: () => toggle(t.id)
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontFamily: 'var(--tt-font-base)',
      fontSize: 16,
      color: t.done ? 'var(--tt-text-tertiary)' : 'var(--tt-text)',
      textDecoration: t.done ? 'line-through' : 'none'
    }
  }, t.label), /*#__PURE__*/React.createElement(Badge, {
    tone: tagTone[t.tag] || 'neutral'
  }, t.tag)))));
}
window.TodayScreen = TodayScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/TodayScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Mascot = __ds_scope.Mascot;

__ds_ns.SpeechBubble = __ds_scope.SpeechBubble;

__ds_ns.SymbolCell = __ds_scope.SymbolCell;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Pill = __ds_scope.Pill;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.TextField = __ds_scope.TextField;

})();
