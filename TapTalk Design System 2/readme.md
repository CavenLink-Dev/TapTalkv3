# TapTalk Design System

> **Everyone deserves a voice.**
> Brand & UI system for **TapTalk** — an iOS AAC (Augmentative and Alternative
> Communication) app for people with speech impairment and disability. Core
> communication is free forever; optional premium tools add therapy and cognitive
> activities. Built with accessibility, simplicity, and warmth at its core.

This folder is a self-contained design system: brand assets, design tokens
(colour/type/spacing/radii/motion), reusable React UI primitives, and a
high-fidelity interactive recreation of the app. Link `styles.css` to pick up
every token and webfont.

---

## Sources

This system was reconstructed from the materials below. You may not have access —
they are recorded so you can dig deeper if you do.

- **Codebase:** `TapTalkv3/` — React Native + Expo (SDK 54) app. Ground-truth for
  components, screens, tokens, and assets. Key reads: `APP_OVERVIEW.md`,
  `FIGMA_DESIGN_TOKENS.md`, `FIGMA_ASSET_USAGE.md`, `src/theme/tokens.ts`,
  `src/components/native/*`, `app/(tabs)/talk.tsx`, `app/onboarding/*`.
- **GitHub:** https://github.com/CavenLink-Dev/TapTalkv3 — explore this repo for a
  fuller picture of the app when building TapTalk-branded designs.
- **Figma:** "Squid" file `JsMxE7g9K5ZjbiKDIhfIZo`, page *Premium Components*
  (libraries: *Masculus App (Official) WIP* + *iOS 16 UI Kit for Figma*). Token
  names preserved in `src/theme/tokens.ts` comments.
- **Uploaded:** `uploads/tokens.ts` — the canonical token export.

---

## Content fundamentals

**Voice — warm, plain, and encouraging.** TapTalk speaks like a friendly helper,
never clinical. The mascot **Clo** often narrates in the first person
("Welcome to TapTalk! I'm Clo."), addressing the user as **you**. Copy is
reassuring and low-pressure ("This can be changed in the settings later").

- **Person:** Clo = "I"; the user = "you". Caregiver-facing copy stays plain and
  direct ("Choose how long TapTalk should wait before automatically locking").
- **Casing:** Screen **titles are ALL-CAPS** in the rounded display font
  (`SET PARENTAL LOCK AND TIMEOUT`, `PICK YOUR FUNCTIONS`). Field labels are
  uppercase too (`NAME`, `DISPLAY NAME`). Body copy is sentence case.
- **Tone:** friendly, calm, never condescending. Short sentences. One idea per
  screen. Helper text softens every required action.
- **Emphasis:** key words are **bolded inline** inside the mascot's speech
  ("what would you like me to call you?").
- **Emoji:** used sparingly and functionally — as AAC symbol placeholders and the
  occasional accent. Not used as decoration in marketing-style copy. The brand
  personality comes from **Clo**, not emoji.
- **Examples:** placeholders model real input ("e.g. Alex Jones",
  "e.g. DragonSlayer20").
- **Buttons:** short, imperative, ALL-CAPS in the app (`CONTINUE`); the web
  components render them in the rounded display font, bold.

Avoid: jargon, long paragraphs, alarming language, anything that feels like a
medical form.

---

## Visual foundations

**Overall vibe:** clean, soft, and friendly. Lots of breathing room, generous
rounding, a calm light-blue palette, and one playful character. Never cluttered,
never clinical — every screen is uncluttered enough for a child or a user with
cognitive load sensitivity.

- **Colour:** a single light-blue brand hue (`#199AEE`) over a cool off-white
  background (`#F1F5F9`) and white surfaces. Darker blue (`#006DD3`) for active
  states, lighter (`#62C1FF`) for press feedback, soft blue (`#D5E1E8`) for
  tracks/disabled. Status colours (red/green/orange) are used only for meaning.
  The **AAC board** is the one colourful surface — a Fitzgerald-key palette where
  each word type has its own hue (verbs green, nouns purple, questions orange…).
- **Type:** **SF Compact** (body) + **SF Compact Rounded** (display) on iOS. The
  rounded display face carries the brand warmth and is used for all titles,
  buttons, and labels. Web substitutes (no SF webfont exists): **Hanken Grotesk**
  for body, **Nunito** for display. Titles are heavy (800–900) and ALL-CAPS.
- **Spacing:** a 4-based scale (4 / 8 / 12 / 16 / 24 / 32). Screen edges sit at
  24px; cards pad 16px. Comfortable, never tight.
- **Corner radii — the signature move.** Everything is rounded: buttons 10,
  inputs 10, cards 16, pills/progress 22, large background cards 40, bottom
  sheets 44. The bigger the surface, the rounder. Nothing has sharp corners
  except the small AAC symbol cells (5px, bordered).
- **Cards:** white fill, 16px radius, a **1.5px `#BBC0C7` hairline border** *and*
  a very subtle shadow (`0 2px 8px` black @ 6%). Soft, flat, lightly lifted —
  not glassy, not heavy.
- **Shadows:** minimal. One subtle card lift; an optional blue "pop" glow
  (`0 4px 16px` blue @ 22%) for hero/premium surfaces. No hard drop shadows.
- **Backgrounds:** flat colour only — the cool off-white app background or white
  cards. **No gradients, no textures, no patterns, no full-bleed imagery.** The
  bottom of onboarding screens is a large white card with 40px top corners rising
  from the background.
- **Borders:** hairline `#BBC0C7` at 1.5px on cards/inputs; AAC cells use a 2px
  dark outline (`#434343`). Focused inputs switch their border to primary blue;
  errored inputs to red.
- **Animation:** smooth, minimal, purposeful — *never* flashy (accessibility:
  avoid motion sensitivity). Spring eases for pops/scales
  (`cubic-bezier(0.34,1.3,0.64,1)`), standard ease for fades/slides. Page
  transitions slide 300ms with no bounce. Clo floats gently (idle bob) and
  cross-fades between emotions. **Everything respects `prefers-reduced-motion`.**
- **Hover/press:** buttons scale to ~0.97 and lighten to the pressed blue on
  press; AAC cells scale down to ~0.88 with a spring. There is no desktop hover
  vocabulary — this is a touch product; feedback is press-based.
- **Transparency/blur:** rarely. Folder flaps use ~81% white; premium overlays
  use light white tints on blue. No frosted-glass blur.
- **Imagery:** there is essentially no photography. The visual identity is the
  **Clo mascot** (flat vector, baby-blue body `#54ACFF`, bold black outline,
  white eye highlights) and the **AAC symbol cards** (flat, bordered, labelled).
  Everything is illustrative, warm, high-contrast, and friendly.
- **Layout:** single-column, portrait, thumb-reachable. Fixed top progress bar
  during onboarding; fixed bottom tab bar in the app. Primary action sits at the
  bottom of the content card.
- **Accessibility:** all text/background pairs meet WCAG AA. Tap targets ≥44px
  (buttons 50px). Large type, high contrast, no clutter.

---

## Iconography

- **Tab bar & board icons** ship as **PNG** assets (`assets/aac/board_icon.png`,
  `tools_icon.png`, `profile_icon.png`, `activities_icon.png`). The app draws
  inline UI glyphs (backspace, trash, speaker) from **Ionicons** (`@expo/vector-icons`)
  in React Native.
- **AAC symbols** are flat, labelled **PNG cards** (`assets/aac/card_*.png`) —
  e.g. `card_run.png` (green verb, runner), `card_places.png` (yellow folder).
  In the live app many cells currently fall back to **emoji** placeholders until
  the full ARASAAC/Mulberry symbol set is wired in; the `<SymbolCell>` component
  supports both an `image` PNG and an emoji `symbol`.
- **Emoji** are used functionally (AAC symbol stand-ins, small accents), not as a
  decorative system. **No icon font is bundled for the web.**
- **Web substitution:** for new web UI chrome (settings rows, nav, etc.) use
  **Ionicons** (matches the app) or any thin-stroke set like Lucide/Heroicons —
  flagged as a substitute since the RN app relies on Ionicons. Keep icons simple,
  rounded, and high-contrast. Do **not** hand-draw SVG icons; copy the PNG assets
  in `assets/aac/` or link a CDN icon set.
- **Mascot as iconography:** Clo's ~30 emotion poses (`assets/mascots/*.png`)
  double as expressive icons for empty states, feedback, and encouragement.

---

## Foundations (Design System tab)

Specimen cards live in `guidelines/` and render in the Design System tab:
**Colors** (brand, neutrals, status, AAC symbol palette), **Type** (display,
body, scale), **Spacing** (scale, radii, shadows), **Brand** (logo, Clo mascot
poses).

---

## Index / manifest

**Root**
- `styles.css` — global entry (imports all token files). Consumers link this.
- `readme.md` — this guide.
- `SKILL.md` — Agent-Skill front-matter for use in Claude Code.

**`tokens/`** — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`,
`radii.css`, `animations.css`.

**`components/`** — reusable primitives (namespace `TapTalkDesignSystem_5cf136`):
- `core/` — `Button`, `TextField`, `Card`, `Pill`, `Switch`, `Checkbox`,
  `Badge`, `ProgressBar`
- `aac/` — `SymbolCell`, `Mascot`, `SpeechBubble`

**`ui_kits/app/`** — interactive iPhone-framed recreation of the app
(Onboarding → Talk → Today → Me). See its `README.md`.

**`guidelines/`** — foundation specimen cards.

**`assets/`** — `logo/` (taptalk wordmark), `mascots/` (~30 Clo poses),
`aac/` (symbol cards, tab/board icons, action icons), `brand/` (splash reference).

---

## Caveats / substitutions

- **Fonts:** SF Compact / SF Compact Rounded are iOS-only system fonts with no
  webfont. Web specimens substitute **Hanken Grotesk** (body) and **Nunito**
  (display). The tokens list the real SF families first so Apple devices use them.
  → *Upload the SF Compact / SF Compact Rounded font files to make web output
  pixel-exact.*
- **Icons:** no web icon font ships; the app uses Ionicons. New web chrome should
  use Ionicons/Lucide as a flagged substitute.
- **AAC symbols:** emoji placeholders stand in for the not-yet-licensed symbol
  set, matching the current app.
