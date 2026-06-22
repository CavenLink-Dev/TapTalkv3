# TapTalk Figma Asset Usage Guide

## Source of truth

- `src/theme/tokens.ts`
  - This is the live runtime theme source used by the app.
  - Screens and components import colors, radii, spacing, typography, and shadows from here.

- `src/theme/figma_source/Mode 1.tokens.json`
  - This is the preserved raw Figma variable export.
  - It should be treated as the rebuild/reference source for `src/theme/tokens.ts`.
  - It is not imported directly by runtime UI code.

## AAC board asset groups

### `assets/aac/*.png`
These are app-ready AAC PNG assets with stable names.

Main runtime uses:

- `board_icon.png`
  - Used by the Board tab icon.
  - Referenced in `app/(tabs)/_layout.tsx`.

- `activities_icon.png`
  - Used by the Activities tab icon.
  - Referenced in `app/(tabs)/_layout.tsx`.

- `tools_icon.png`
  - Used by the Tools tab icon.
  - Referenced in `app/(tabs)/_layout.tsx`.

- `profile_icon.png`
  - Used by the Profile tab icon.
  - Referenced in `app/(tabs)/_layout.tsx`.

- `cat_main.png`, `cat_actions.png`, `cat_feelings.png`, `cat_food.png`, `cat_social.png`
  - These are category label/header assets for the AAC board system.
  - They are best used as board category chips, headers, or segmented navigation labels.

- `card_*.png`
  - These are finished AAC symbol card examples from Figma.
  - They are best used when replacing the board prototype cells with real visual AAC cards.
  - Examples include words such as `card_hello.png`, `card_car.png`, `card_run.png`, `card_big.png`, `card_where.png`, `card_please.png`, `card_ouch.png`, `card_places.png`, and `card_sports.png`.

- `backspace.png`, `btn_save.png`, `btn_delete.png`
  - These are board action/control icons.
  - They are best used for composer controls or board editing actions.

### `assets/aac/figma_source/AAC BOARD/...`
This folder is the preserved raw Figma AAC export.

Use it when:

- you need the original exported PNG names from design
- you want to inspect source variants before renaming assets
- you want to rebuild or expand the curated `assets/aac` set

Subfolders:

- `AAC BOARD/`
  - Raw exported board-level labels, icons, and layout fragments

- `AAC BOARD/symbol & folder example/`
  - Finished visual examples of AAC cards and folders
  - Best reference when building actual symbol cells from design rather than emoji placeholders

- `AAC BOARD/symbols & folders/`
  - Smaller/raw source pieces for folders and symbol surfaces
  - Best reference for reconstructing reusable board primitives

## Mascot assets

### `asset/*.png`
These are the live Clo mascot expressions plus the TapTalk logo.

Main runtime uses:

- mascot PNGs
  - Mapped in `src/components/MascotImage.tsx`
  - Used throughout onboarding and the talk screen
  - Example screens:
    - `app/onboarding/index.tsx`
    - `app/onboarding/adult.tsx`
    - `app/onboarding/splash.tsx`
    - `app/(tabs)/talk.tsx`

- `taptalk_logo.png`
  - Used on the onboarding splash screen
  - Referenced in `app/onboarding/splash.tsx`

When making new pages:

- use mascot PNGs for emotional guidance, encouragement, empty states, and onboarding moments
- use the logo for splash, intro, brand headers, or launch surfaces

## Splash/reference images

### `asset/follow/*.png`
These are full-screen design reference images.

Main use:

- visual reference for onboarding layout, card spacing, and control placement
- not currently imported by runtime code

Best use cases:

- recreating a screen from a static mockup
- matching spacing, hierarchy, and CTA placement
- comparing implementation against the original design composition

## Alternate mascot concept art

### `asset/newest_mascot_poses/*.png`
These are alternate mascot exports and pose candidates.

Main use:

- design reference or future runtime mascot replacements
- not currently wired into `MascotImage.tsx`

Best use cases:

- creating new emotional states
- replacing existing mascot art later
- choosing higher-quality poses for future onboarding or activity pages

## Important implementation notes

- The talk board in `app/(tabs)/talk.tsx` still uses text and emoji placeholders for many cells.
- The curated `assets/aac/card_*.png` set is the most likely next-step asset source when upgrading that screen to true visual AAC cards.
- The raw Figma exports should be preserved for reference, but app code should prefer stable asset names from `assets/aac` and stable runtime tokens from `src/theme/tokens.ts`.
