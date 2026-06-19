# TapTalk — Figma Design Tokens
> Extracted from: **Squid** Figma file (`JsMxE7g9K5ZjbiKDIhfIZo`)  
> Page: **Premium Components**  
> Source libraries: **Masculus App (Official) \*WIP\*** + **iOS 16 UI Kit for Figma (Community)**  
> Variable collection: `Masculus_Visual_Tokens_v2`

---

## Connected Design Libraries

| Library | Role |
|---------|------|
| **Masculus App (Official) \*WIP\*** | Primary token source — all colors, spacing, typography, feedback, button states |
| **iOS 16 UI Kit for Figma (Community)** | iOS system fill/label color styles (light + dark mode) |

---

## Color Tokens

All colors live in `Masculus_Visual_Tokens_v2` collection.

### Foundation — Text Colors
| Token | Variable Path | Scope |
|-------|--------------|-------|
| `text.primary` | `foundation/text/color/primary` | TEXT_FILL |
| `text.secondary` | `foundation/text/color/secondary` | TEXT_FILL |
| `text.muted` | `foundation/text/color/muted` | TEXT_FILL |
| `text.inverse` | `foundation/text/color/inverse` | TEXT_FILL |

### Foundation — Surface Colors
| Token | Variable Path | Scope |
|-------|--------------|-------|
| `surface.base` | `foundation/surface/color/base` | FRAME_FILL, SHAPE_FILL |
| `surface.inset` | `foundation/surface/color/inset` | FRAME_FILL, SHAPE_FILL |
| `surface.scrim` | `foundation/surface/color/scrim` | FRAME_FILL, SHAPE_FILL |

### Reactive — Primary Button
| Token | Variable Path | Scope |
|-------|--------------|-------|
| `button.primary.bg.default` | `reactive/button/color/primary/bg/default` | FRAME_FILL, SHAPE_FILL |
| `button.primary.bg.hover` | `reactive/button/color/primary/bg/hover` | FRAME_FILL, SHAPE_FILL |
| `button.primary.bg.pressed` | `reactive/button/color/primary/bg/pressed` | FRAME_FILL, SHAPE_FILL |
| `button.primary.bg.focus` | `reactive/button/color/primary/bg/focus` | FRAME_FILL, SHAPE_FILL |
| `button.primary.bg.disabled` | `reactive/button/color/primary/bg/disabled` | FRAME_FILL, SHAPE_FILL |
| `button.primary.fg.default` | `reactive/button/color/primary/fg/default` | TEXT_FILL |
| `button.primary.fg.hover` | `reactive/button/color/primary/fg/hover` | TEXT_FILL |
| `button.primary.fg.pressed` | `reactive/button/color/primary/fg/pressed` | TEXT_FILL |
| `button.primary.fg.focus` | `reactive/button/color/primary/fg/focus` | TEXT_FILL |
| `button.primary.fg.disabled` | `reactive/button/color/primary/fg/disabled` | TEXT_FILL |
| `button.primary.border.default` | `reactive/button/color/primary/border/default` | STROKE |
| `button.primary.border.hover` | `reactive/button/color/primary/border/hover` | STROKE |
| `button.primary.border.pressed` | `reactive/button/color/primary/border/pressed` | STROKE |
| `button.primary.border.focus` | `reactive/button/color/primary/border/focus` | STROKE |

### Reactive — Input
| Token | Variable Path | Scope |
|-------|--------------|-------|
| `input.bg.focus` | `reactive/input/color/bg/focus` | FRAME_FILL, SHAPE_FILL |

### Reactive — Toggle
| Token | Variable Path | Scope |
|-------|--------------|-------|
| `toggle.on` | `reactive/toggle/color/on` | FRAME_FILL, SHAPE_FILL |
| `toggle.off` | `reactive/toggle/color/off` | FRAME_FILL, SHAPE_FILL |

### Reactive — Progress Bar
| Token | Variable Path | Scope |
|-------|--------------|-------|
| `progress.fill` | `reactive/progress/color/fill` | FRAME_FILL, SHAPE_FILL |
| `progress.track` | `reactive/progress/color/track` | FRAME_FILL, SHAPE_FILL |

### Reactive — Focus Ring
| Token | Variable Path | Scope |
|-------|--------------|-------|
| `focus.ring` | `reactive/focus/color/ring` | FRAME_FILL, SHAPE_FILL |

### Reactive — Feedback / Status
| Token | Variable Path | Scope |
|-------|--------------|-------|
| `feedback.success` | `reactive/feedback/color/success` | FRAME_FILL, SHAPE_FILL |
| `feedback.error` | `reactive/feedback/color/error` | FRAME_FILL, SHAPE_FILL |
| `feedback.warning` | `reactive/feedback/color/warning` | FRAME_FILL, SHAPE_FILL |
| `feedback.info` | `reactive/feedback/color/info` | FRAME_FILL, SHAPE_FILL |

---

## iOS System Color Styles (Light + Dark)

Sourced from **iOS 16 UI Kit for Figma (Community)**.

### Fill Colors
| Token | Mode |
|-------|------|
| `Fill Color/Light/Primary` | Light |
| `Fill Color/Light/Secondary` | Light |
| `Fill Color/Light/Tertiary` | Light |
| `Fill Color/Light/Quaternary` | Light |
| `Fill Color/Dark/Primary` | Dark |
| `Fill Color/Dark/Secondary` | Dark |
| `Fill Color/Dark/Tertiary` | Dark |
| `Fill Color/Dark/Quaternary` | Dark |

### Label Colors
| Token | Mode |
|-------|------|
| `Label Color/Light/Primary` | Light |
| `Label Color/Light/Secondary` | Light |
| `Label Color/Light/Tertiary` | Light |
| `Label Color/Dark/Primary` | Dark |
| `Label Color/Dark/Secondary` | Dark |
| `Label Color/Dark/Tertiary` | Dark |

---

## Typography Tokens

Sourced from `LEGACY_Collection 2` in **Masculus App (Official)**.

### Font Families
| Token | Variable Path |
|-------|--------------|
| `font.family.base` | `global/font/family/base` |
| `font.family.display` | `global/font/family/display` |
| `font.family.mono` | `global/font/family/mono` |

### Line Heights
| Token | Variable Path |
|-------|--------------|
| `font.lineHeight.tight` | `global/font/lineHeight/tight` |
| `font.lineHeight.normal` | `global/font/lineHeight/normal` |
| `font.lineHeight.relaxed` | `global/font/lineHeight/relaxed` |

### Font Scale (Prototype Variable)
| Token | Variable Path | Notes |
|-------|--------------|-------|
| `fontScale` | `prototype/number/settings/fontScale` | Used in TapTalk onboarding text-size picker (0.25x / 1.0x / 2.0x) |

---

## Spacing Tokens

Sourced from `Masculus_Visual_Tokens_v2`.

| Token | Variable Path |
|-------|--------------|
| `spacing.compact` | `responsive/scale/spacing/compact` |
| `spacing.base` | `responsive/scale/spacing/base` |
| `spacing.comfortable` | `responsive/scale/spacing/comfortable` |

> **Note:** Raw numeric values are not exposed by the API without desktop selection. The token names indicate a 3-tier scale: compact → base → comfortable.

---

## Haptic Feedback Tokens

Sourced from `Masculus_Visual_Tokens_v2` (FLOAT type — intensity values).

| Token | Variable Path |
|-------|--------------|
| `haptic.success.intensity` | `feedback/haptic/success/intensity` |
| `haptic.warning.intensity` | `feedback/haptic/warning/intensity` |
| `haptic.error.intensity` | `feedback/haptic/error/intensity` |

### Sound Toggle
| Token | Variable Path | Type |
|-------|--------------|------|
| `feedback.sound.onError` | `feedback/sound/on-error` | BOOLEAN |

---

## Behavior / Code Config Tokens

Sourced from `Masculus_Behavior_Config_v2` (BOOLEAN type).

| Token | Variable Path | Meaning |
|-------|--------------|---------|
| `textarea.supportsHaptics` | `code/component/textarea/flags/supportsHaptics` | Whether TextArea fires haptic on input |
| `errorState.hasSuccessState` | `code/component/errorState/flags/hasSuccessState` | Whether error components can transition to success |

---

## Observed UI Measurements (from Figma metadata)

These are real pixel values extracted from the "Premium Components" page layout — specifically the onboarding screens.

### Onboarding Screen Layout
| Element | Width | Height |
|---------|-------|--------|
| Screen frame | 420pt | 872pt |
| Progress bar container | 300pt | 26pt |
| Progress bar outer frame | 348–349pt | 40–41pt |
| White card (main content) | 350–391pt | 300–573pt |
| Primary button | 200pt | 44–45pt |
| Text field (input) | 200–309pt | 44pt |
| Back button | 40pt | 40pt |
| Header frame (mascot + title) | 321–333pt | 70pt |

### Corner Radius (from `rounded-rectangle` nodes)
White cards, buttons, and input fields all use `rounded-rectangle` type, confirming rounded corners throughout. Exact radius values require desktop selection to read — the shapes are named:
- `White Card` — large card radius (visually ~16–20pt based on mockup screenshots)
- `Rectangle 1571` — primary button radius (visually ~22pt, fully pill-shaped at 44pt height)
- `Fill` — progress fill pill (visually ~13pt at 26pt height = fully rounded)

### Text Field Height
- All `Text Field` instances: **44pt tall** — matches iOS HIG minimum touch target

---

## Variable Collections Summary

| Collection | Purpose |
|-----------|---------|
| `Masculus_Visual_Tokens_v2` | Colors, spacing, haptics, progress, toggle, button states |
| `LEGACY_Collection` | Prototype variables (fontScale, auth status text, composer text) |
| `LEGACY_Collection 2` | Typography (font families, line heights) |
| `Masculus_Behavior_Config_v2` | Boolean component behavior flags |

---

## What Was NOT Found

The following were **not** returned by the API and would require desktop Figma selection to retrieve exact values:

- Exact hex/RGB values for each color token (tokens are named but not resolved to raw values without edit+select access)
- Corner radius exact numbers
- Shadow/elevation definitions
- Exact font size scale (e.g. 12/14/16/18/24pt)
- Font weight values
- Letter spacing values

To get those, open the Figma file on desktop, select a node, and the `get_variable_defs` or `get_design_context` tool can read the resolved values.

---

*Generated by reading the Figma file `JsMxE7g9K5ZjbiKDIhfIZo` via the Figma MCP API. All token names are real — sourced directly from the variable paths returned by the API.*
