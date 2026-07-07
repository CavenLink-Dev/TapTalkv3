# TapTalk V3 — Rules & Guidelines for AI Agents

> Read this file **before** writing any code on the TapTalk app. These rules are not optional — the user has reaffirmed them in every planning round. If a proposed implementation conflicts with a rule, change the implementation, not the rule.

TapTalk V3 is an iOS AAC (Augmentative and Alternative Communication) app built with React Native and Expo. Every change must keep the app simple, accessible, safe, and easy for the next developer or AI agent to understand.

Your main priorities are:

* Find the correct place to work before editing.
* Avoid creating large, messy files.
* Keep screens, components, hooks, utilities, services, constants, and types separated by responsibility.
* Use the existing design system, utilities, and services — do not reinvent what already exists.
* Update the project map when the structure changes.
* Do not guess where files belong.

---

## Core Rule — Read Before Writing

Before planning, editing, creating, moving, deleting, or splitting files, always read these two files:

1. `docs/COMPONENT_MAP.md` — the source of truth for project structure. Use it to identify the correct page, screen, component, hook, utility, service, constant, or type file for any task.
2. This file (`AGENTS.md`) — the source of truth for UX rules (30 principles), iOS-native component requirements, design system constraints, board tile labeling, file placement, existing systems, and workflow rules.

Do not start work without reading both. Do not guess file locations. Do not guess which patterns are locked.

---

## Order of operations

1. Read `docs/COMPONENT_MAP.md` and this file end-to-end.
2. Read `NEXT.md` for current state and locked decisions (if it exists).
3. If the task is non-trivial (touches more than one screen, introduces a new feature, restructures navigation, or changes data shape): **plan first, ask clarifying questions, then implement**.
4. If the task is small polish (single-file edit, copy change, spacing, colour): implement directly, summarise at the end.

---

## The 30 rules

### 1. Simple first, advanced later
**Guideline:** Show the main controls first. Put advanced settings inside expandable areas, "More" menus, edit mode, or settings.
**Reasoning:** Disclosure patterns are used to show and hide extra content instead of displaying everything at once.

### 2. Only show what is relevant right now
**Guideline:** Do not place every option on the main screen. Show controls based on the current task.
**Reasoning:** Context-specific controls reduce clutter and keep the screen focused.

### 3. Use expandable sections for extra detail
**Guideline:** Use expandable cards or disclosure rows for optional content, advanced settings, filters, and extra information.
**Reasoning:** The user sees the label first, then chooses whether to expand the hidden content.

### 4. Use stable main navigation
**Guideline:** Use clear main sections such as TalkBoard, Routine, Calendar, Tools, and Profile. Do not move main tabs around.
**Reasoning:** Tab-based and stack-based navigation help users move between major app areas predictably.

### 5. Use deeper pages only when needed
**Guideline:** Keep the first screen clean. Push deeper details into secondary pages only when the user selects something.
**Reasoning:** Navigation stacks present views over a root view, creating a clear path from simple to detailed.

### 6. Use modal screens only for focused tasks
**Guideline:** Use sheets, alerts, popovers, or confirmation dialogs only for important, narrow tasks.
**Reasoning:** Modal presentations are designed to draw attention to a specific task, not to replace normal navigation.

### 7. Keep actions attached to clear controls
**Guideline:** A button must have one clear action. Avoid vague buttons like "Go" or "Do it" unless the context is obvious.
**Reasoning:** Buttons are action controls. The user should understand what will happen when they tap.

### 8. Use toggles only for on/off settings
**Guideline:** Use toggles for binary settings such as enabled/disabled, visible/hidden, sound on/off, or reduce animation on/off.
**Reasoning:** Toggles are bound to Boolean states, so they should represent clear on/off choices.

### 9. Use pickers for choosing one option
**Guideline:** Use pickers for controlled choices such as category, colour mode, voice type, routine type, or calendar view.
**Reasoning:** Pickers bind the interface to a selected value from a list of choices.

### 10. Use menus for secondary actions
**Guideline:** Put less common actions such as duplicate, rename, move, archive, or export inside a menu.
**Reasoning:** Menus provide access to commands without taking over the main screen.

### 11. Use context menus for item-specific actions
**Guideline:** Long-press or item menus should only show actions relevant to that exact item.
**Reasoning:** Context menus are situational and should support the current task.

### 12. Separate normal actions from risky actions
**Guideline:** Destructive actions like delete, clear all, reset, or remove must be visually separated and confirmed.
**Reasoning:** Confirmation dialogs and severity patterns exist for actions where the user needs extra care.

### 13. Give every action a clear result
**Guideline:** When the user taps, selects, completes, saves, deletes, or changes something, show visible feedback immediately.
**Reasoning:** Interaction should make state changes clear.

### 14. Use animation to explain change
**Guideline:** Animate changes when something expands, collapses, moves, appears, disappears, or changes state.
**Reasoning:** Animation helps connect the action to the result.

### 15. Keep animation purposeful
**Guideline:** Do not animate just for decoration. Use motion to show cause and effect.
**Reasoning:** Animation should support understanding, not distract from the task.

### 16. Use spring motion for natural movement
**Guideline:** Use soft spring-like motion for cards, buttons, symbol movement, and expandable areas.
**Reasoning:** Spring animation supports movement that can feel more physical and responsive.

### 17. Use linear motion only when mechanical movement is needed
**Guideline:** Use linear animation for loading indicators, progress movement, or activity-style motion.
**Reasoning:** Linear motion has consistent speed and can feel mechanical, so it fits predictable repeated motion.

### 18. Respect Reduce Motion
**Guideline:** Provide a reduced-motion version of animations. Replace floating, zooming, or bouncing with simple fades where needed.
**Reasoning:** The system provides a Reduce Motion accessibility preference. The codebase already has `src/hooks/useReduceMotion.ts` — use it.

### 19. Use haptics and audio feedback carefully
**Guideline:** Use light feedback for selection, completion, start/stop, success, warning, or delete confirmation. Do not overuse it.
**Reasoning:** Sensory feedback can provide haptic or audio response, but it should support the visual experience. Use `src/utils/haptics.ts` helpers.

### 20. Make touch areas forgiving
**Guideline:** Buttons, cards, tiles, and symbols must be easy to tap. Increase the interactive area even if the visual element looks smaller. Minimum 44 × 44 pt; primary actions ≥ 60 pt where layout allows.
**Reasoning:** Hit-testing and content shapes let the tappable area match the intended interaction shape.

### 21. Design for accessibility from the start
**Guideline:** Every important control needs readable text, clear labels, strong contrast, logical structure, and screen-reader support where relevant. Every interactive element gets `accessibilityRole` + `accessibilityLabel`, plus `accessibilityState` when applicable.
**Reasoning:** Accessibility modifiers exist for making views usable by more people.

### 22. Support scalable text
**Guideline:** Text should scale cleanly. Avoid layouts that break when text becomes larger.
**Reasoning:** Dynamic Type supports scalable content and allows users to choose larger text sizes.

### 23. Do not rely on colour alone
**Guideline:** Use labels, icons, shape, spacing, and state changes alongside colour.
**Reasoning:** Accessible appearance settings can require greater contrast or alternatives to purely visual styling.

### 24. Use helpful empty states
**Guideline:** If a page has no content yet, show a simple explanation and the next action.
**Reasoning:** Content-unavailable views exist for moments when app content is not available.

### 25. Use edit mode for power features
**Guideline:** Rearranging, hiding, deleting, customising, and bulk editing should happen inside edit mode, not always-on mode.
**Reasoning:** Edit mode separates normal use from content editing.

### 26. Support undo for important changes
**Guideline:** After deleting, clearing, moving, or editing important content, provide undo where possible.
**Reasoning:** Undo management exists for registering reversible operations.

### 27. Use lists and sections to organise content
**Guideline:** Group related settings, routines, symbols, tasks, and calendar items into clear sections.
**Reasoning:** Lists and sections provide hierarchy and make large content easier to scan.

### 28. Use search only when it improves speed
**Guideline:** Add search for large symbol libraries, routines, tools, files, or categories. Include suggestions where useful.
**Reasoning:** Search interfaces and search suggestions help users find content inside the app.

### 29. Use toolbars for nearby important actions
**Guideline:** Put high-value actions near the top or bottom of the relevant screen, not randomly inside the layout.
**Reasoning:** Toolbars hold actions connected to the current view.

### 30. Keep the final experience calm and predictable
**Guideline:** The app should feel clean, stable, low-effort, and easy to understand. Avoid surprise interactions, overloaded screens, and unnecessary visual noise.
**Reasoning:** The supported interaction patterns point toward clear structure, controlled disclosure, direct actions, accessible settings, and predictable state changes.

---

## Existing Systems — Use These, Do Not Reinvent

Before building anything new, check these existing systems. Using them is mandatory, not optional.

* **Design tokens:** `src/theme/tokens.ts` — all colors, spacing, radii, typography. Use `colors.*`, `radii.*`, `spacing.*`, `typography.*`. Do not hardcode hex values or magic numbers unless geometry demands it (circles, etc.).
* **Theme hook:** `src/theme/useTheme.ts` — `useTheme()` for current theme colors, dark mode flag, and theme switching.
* **Motion tokens:** `src/theme/motion.ts` — spring and timing presets. Use these instead of hand-rolled animation configs.
* **Fonts:** `src/theme/fonts.ts` — SF Compact Rounded font family setup.
* **Speech:** `src/hooks/useSpeech.ts` + `src/utils/speechRules.ts` — the only TTS path. Speak via `useSpeech().speak/stop`. Build utterances with `buildMessageUtterances()`. Never call `expo-speech` directly.
* **Haptics:** `src/utils/haptics.ts` — use `hapticSelection`, `hapticLight`, `hapticMedium`, `hapticSuccess`, `hapticWarning`, `hapticError`. Never call `expo-haptics` directly.
* **Reduce Motion:** `src/hooks/useReduceMotion.ts` — gate every non-essential animation on `useReduceMotion()`. Provide fade/no-motion fallbacks.
* **Sounds:** `src/utils/sounds.ts` — app-wide sound feedback helpers.
* **Mulberry symbols:** `src/components/symbols/MulberrySymbol.tsx` — the only component that draws Mulberry pictograms. Always render via `<MulberrySymbol symbolId=… />`. Never render pictogram images directly.
* **Symbol brain:** `src/features/symbol-brain/resolveSymbolForKeyword.ts` — maps keywords to guaranteed Mulberry symbols. Use this, not raw asset-map lookups, whenever a word needs a symbol.
* **Global state:** `src/context/AppContext.tsx` + `src/context/types.ts` — read via `useAppContext()`/`useAppSelector`. Mutate only by dispatching typed actions. Never mutate state directly.
* **Chrome visibility:** `src/features/board/chromeVisibility.ts` — `setTabBarHidden(bool)` / `useTabBarHidden()`. The only mechanism for hiding/showing the tab bar. Do not thread a new context or add a parallel hide flag.
* **Board layout math:** `src/features/board/layout.ts` — import layout math from here. Do not duplicate it.
* **Board tile accessibility:** `src/features/board/tileA11y.ts` — accessibility helpers for board tiles.

---

## iOS-native components — non-negotiable

User has explicitly required iOS-native patterns throughout. Reach for these first:

- **Confirmations / yes-no** → `Alert.alert` from `react-native`.
- **Date / time selection** → `@react-native-community/datetimepicker`.
- **Wheel pickers (numbers, choices)** → `@react-native-picker/picker`.
- **Action sheets (long-press menus)** → `ActionSheetIOS`.
- **Notifications / chimes** → `expo-notifications` + `expo-av`.
- **Haptics** → `expo-haptics` via `src/utils/haptics.ts` helpers.
- **Speech** → `expo-speech` via `src/hooks/useSpeech.ts`.
- **Sheets / modals** → `Modal` from `react-native`, with `presentationStyle="formSheet"` for sheet feel.
- **Keyboard handling** → `KeyboardAvoidingView` with `behavior="padding"` on iOS.

Do **not** roll a custom date picker, time picker, or alert dialog. Use the platform.

---

## Design system rules (already enforced — don't undo)

- **Flat surfaces.** `shadows.card`, `shadows.pop`, and `shadows.cardRaise` are zeroed in `src/theme/tokens.ts`. Do not introduce new shadow opacity, glow, or `elevation > 0`.
- **No decorative borders.** Outlines only appear when they communicate state (focus ring, secondary/ghost button, status feedback like error/success).
- **Inputs:** label sits **above** the input (eyebrow style, muted), placeholder is a **real example** (`e.g. Alex`, not `Display name`).
- **ScrollViews:** every main scroller sets `bounces / alwaysBounceVertical / overScrollMode="always"`.
- **Bottom nav:** 48 pt icons, 78 pt tab bar height.
- **Tokens:** use `colors.*`, `radii.*`, `spacing.*`, `typography.*` from `src/theme/tokens.ts`. Don't hardcode hex or magic numbers unless geometry demands (circles, etc.).

---

## Board tile labeling (locked)

- **Symbol tiles:** **One word** on the tile label. Two words is extremely rare — avoid unless there is no reasonable single-word alternative. Keep the board visually simple.
- **Folder tiles:** **One word** label **plus** a Mulberry symbol icon. Never text-only folders on the board.
- **Full phrases:** When the spoken phrase is longer than the label, put the full text in the tile's `speech` field (spoken and appended to the message strip on tap). Do **not** put multi-word sentences on the tile label.
- **Quick Text:** Multi-word phrases and sentences belong in **Quick Text** (saved phrases), not as board symbol labels.

---

## No God Files

Do not create or grow a "god file."

A god file is a file that does too many things at once, such as combining:

* Layout
* Styling
* State management
* Speech logic
* Gesture logic
* Modals
* Constants
* Types
* Helper functions
* Storage or API effects

Use this separation instead:

* Screen/page files compose the page.
* Component files handle UI pieces.
* Hook files handle state and behavior.
* Utility files handle pure helper logic.
* Service files handle speech, storage, sync, API, or external effects.
* Constant files store shared values.
* Type files store shared TypeScript types.

If a file is becoming hard to scan, hard to explain, or responsible for more than one clear job, split it into smaller logical files.

---

## File Size Warning Guide

These are warning ranges, not strict rules.

* Screen/page file: aim for under 300–500 lines.
* Component file: aim for under 200–350 lines.
* Hook file: aim for under 150–300 lines.
* Utility file: aim for under 150–300 lines.
* Service file: aim for under 250–400 lines.

When a file is above these ranges, do not keep adding to it without checking whether the work should be split into a smaller file.

---

## When To Split A File

Split a file when:

* It has more than one clear job.
* It is hard to scan.
* It is hard to explain in one sentence.
* It mixes UI, state, styles, types, constants, and logic.
* A new feature would make it much larger.
* Similar logic is repeated elsewhere.

Prefer small, clear files over one large file.

---

## File Placement Rules

Use `docs/COMPONENT_MAP.md` first.

When the map does not answer the placement question, use this guide:

* New page/screen route → `app/` (Expo Router file-based routing)
* Reusable screen-level component (imported by a route) → `src/screens/`
* Feature-specific UI component → `src/features/<feature>/components/`
* Shared UI component → `src/components/`
* Feature-specific hook → `src/features/<feature>/` (root of feature folder)
* Shared hook → `src/hooks/`
* Feature-specific utility → `src/features/<feature>/` (root of feature folder)
* Shared utility → `src/utils/`
* Feature-specific constants → `src/features/<feature>/constants.ts` or feature folder root
* Feature-specific types → `src/features/<feature>/types.ts` or feature folder root
* App-wide state/types → `src/context/` (existing `AppContext.tsx` / `types.ts`)
* Design tokens, theme → `src/theme/`
* Generated data → `src/data/` (do not edit `.generated.ts` files manually)

Do not create random folders. Only create a new folder when it makes the project easier to understand.

---

## Generated Files — Do Not Edit Manually

Files ending in `.generated.ts` under `src/data/` are produced by build scripts. Do not edit them by hand. If you need to change generated data, find and update the source script in `scripts/` and regenerate.

Key generated files:

* `src/data/mulberryAssetMap.generated.ts`
* `src/data/mulberrySymbols.generated.ts`
* `src/data/categoryExemplars.generated.ts`

---

## Duplicate Type/Constant Split — Board Feature

The board feature has two parallel sets of types and constants:

* Older: `src/features/board/types.ts` and `src/features/board/constants.ts`
* Newer: `src/features/board/talk/types.ts` and `src/features/board/talk/constants.ts`

New board-talk code should import from the `talk/` versions. Do not add new types/constants to the older files unless explicitly required for backward compatibility.

---

## Edit Rules

* Do not rewrite completed screens unless the task clearly requires it.
* Do not change unrelated files.
* Do not move files only for personal style preference.
* Do not refactor while implementing unless the refactor is needed to avoid a god file.
* Keep changes small, targeted, and easy to review.

---

## Testing & Verification

* Run `npx tsc --noEmit` before declaring done. Baseline error count is ~18 pre-existing — do not add more.
* If your change touches logic with existing tests, run the relevant tests: `npx jest <path-or-pattern>`.
* If you add new logic, add a test in the nearest `__tests__/` folder following existing patterns.
* Do not delete or weaken existing tests without explicit direction.

---

## Updating COMPONENT_MAP.md

When structure changes, update `docs/COMPONENT_MAP.md`.

Keep the update short and useful. For each important file, include:

* File path.
* What it does.
* What should go there.
* What should not go there.
* An `**AI guidance:**` line with implementation-critical constraints.

Use simple wording. Do not make the map broad, bloated, or hard to scan.

Note: `docs/COMPONENT_MAP.md` currently covers the board/talk feature in detail. Other feature areas (calendar, activities, profile, scanning, tools, etc.) should be added as they are worked on.

---

## Workflow rules

- **Local edits only.** Do not commit or push unless the user explicitly asks. The user pushes from their own editor.
- **Typecheck before declaring done.** Run `npx tsc --noEmit`. Baseline error count is ~18 pre-existing — do not add more.
- **Don't re-litigate locked decisions.** See `NEXT.md` "Locked decisions" — every item there was settled in a clarifying round.
- **Big changes: plan first.** New screens, new data shapes, navigation reshuffles → propose, list questions, get the green light, then implement.
- **Small polish: just do it.** Copy changes, spacing fixes, single-file polish → implement directly and summarise.
- **Cite principles when proposing.** When justifying a design choice in chat, refer to the rule number (e.g. "principle 6 — modals only for focused tasks").

---

## File maintained by the team. Update when locked decisions change.
