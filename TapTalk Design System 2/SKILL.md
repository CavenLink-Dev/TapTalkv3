---
name: taptalk-design
description: Use this skill to generate well-branded interfaces and assets for TapTalk, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

TapTalk is an iOS AAC (Augmentative and Alternative Communication) app — "Everyone
deserves a voice." Design for accessibility, simplicity, and warmth: WCAG AA
contrast, large tap targets (≥44px), generous rounding, a calm light-blue palette,
and the friendly mascot **Clo**. Never clinical, never cluttered.

Key files:
- `readme.md` — brand context, content fundamentals, visual foundations, iconography, manifest.
- `styles.css` — link this for all design tokens + webfonts.
- `tokens/` — colour, type, spacing, radii, motion custom properties.
- `components/core/` + `components/aac/` — React primitives (Button, TextField, Card,
  Pill, Switch, Checkbox, Badge, ProgressBar, SymbolCell, Mascot, SpeechBubble),
  exposed on `window.TapTalkDesignSystem_5cf136`.
- `ui_kits/app/` — interactive recreation of the app (Onboarding → Talk → Today → Me).
- `assets/` — logo, ~30 Clo mascot poses, AAC symbol cards, tab/board icons.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets
out and create static HTML files for the user to view. If working on production code,
copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without other guidance, ask them what they want to
build or design, ask a few questions, and act as an expert designer who outputs HTML
artifacts _or_ production code, depending on the need.

Substitution notes: SF Compact / SF Compact Rounded are iOS system fonts with no
webfont — web output substitutes Hanken Grotesk (body) + Nunito (display). No web
icon font ships; the app uses Ionicons.
