# FABLE 5 / TAPTALK AAC BOARD + ACCESSIBILITY + PERFORMANCE FIX PASS

Act as a senior iOS product designer, React Native / Expo engineer, AAC accessibility specialist, and disability-focused UX reviewer.

Follow the existing project rules already available in the project.

Do not repeat the rules.
Do not redesign the whole app.
Do not remove tabs.
Do not remove core AAC features.
Do not implement Focus Mode yet.
Do not add backend/auth systems in this task.

Your task is to improve the current app where it is visually heavy, inconsistent, inaccessible, laggy, or using incorrect frontend logic.

Prioritise:

* AAC board usability
* visual density
* message strip readability
* bottom control bar consistency
* top navigation performance
* dark mode accessibility
* correct theme token usage
* correct settings row behaviour
* safe frontend legal/contact fixes
* activity accessibility issues that are clear and contained

If a requested item is risky, too large, or requires backend/server work, do not force it. Report it clearly.

---

# IMPLEMENTATION / BOARD_TOUCH_TARGET_AND_DENSITY_SYSTEM

Create or update a clear reusable size system.

Use these rules:

* absolute minimum touch target anywhere: 50 × 50 px
* main AAC symbols and folders: maximum 64 × 64 px where safe
* bottom control bar buttons: 50–56 px range
* top navigation buttons: 50–56 px range
* sub-options above the bottom control bar: minimum 50 px high where safe
* never go below 44 px under any circumstance
* decorative icons can be visually smaller, but their touch parent must remain accessible

Inspect the current board density:

* top navigation buttons currently around 72 × 57
* top navigation bar height currently around 76
* input bar height currently around 104
* symbol/folder tiles currently around 88 high
* bottom control bar items currently around 68 × 68

Tasks:

* reduce visual heaviness without reducing usability
* keep all important controls at least 50 × 50 px
* bring main symbols/folders closer to 64 × 64 px where safe
* make the top navigation less screen-consuming
* make the input bar shorter only if readability remains safe
* make the bottom control bar smaller and calmer
* keep all spacing predictable
* resize icons and text proportionally with their parent container
* do not shrink the container while leaving inner icons oversized
* preserve padding
* preserve consistent gaps
* use shared sizing constants where possible
* avoid random one-off sizing values

---

# IMPLEMENTATION / BOARD_MESSAGE_STRIP_TEXT_SCALING

Fix message strip text scaling.

Current issues to inspect:

* message chip labels may be hardcoded around 9pt
* sentence/message text may use raw font sizes and weights
* message strip text may not respond to the user’s selected text size
* message strip typography may not use the app’s font/token system

Tasks:

* make message chip labels scale with the user’s selected text size
* make the main message strip sentence text scale with the user’s selected text size
* use typography/font tokens instead of raw hardcoded values where possible
* keep minimum rendered text legible
* ensure placeholder text follows the same font system
* ensure no text is clipped at larger text size settings
* ensure VoiceOver still reads message strip content correctly

Acceptance checks:

* changing text size in app accessibility settings visibly changes message strip text
* chip labels remain readable
* sentence text remains readable
* placeholder text remains visually consistent
* no message strip text is clipped or overlapping

---

# IMPLEMENTATION / BOARD_NAVIGATION_HANDLE_TOUCH_TARGET

Fix the board navigation dropdown handle touch target.

Current issue:

* the visual handle may be compact, but the effective tap area may be too small

Tasks:

* keep the handle visually compact
* increase hitSlop or touch parent size so the effective touch area is at least 44 × 44 px
* prefer 50 × 50 px effective touch area if safe
* ensure it does not cover board tiles or message content
* ensure VoiceOver can focus and activate it
* keep the visual design calm and minimal

---

# IMPLEMENTATION / BOARD_TOP_NAVIGATION_LAG

The top navigation bar toggle is laggy.

Investigate:

* unnecessary re-renders
* expensive layout recalculations
* state changes causing the whole board to re-render
* heavy components remounting during toggle
* animation running on the JS thread
* layout animation conflicts with Reduce Motion
* non-memoised derived values
* symbol/folder grid re-rendering during top bar toggle

Tasks:

* fix the lag if safe
* avoid flashy animation
* respect Reduce Motion
* avoid forcing a large rewrite
* if unsafe, report the exact cause and safest next step

---

# IMPLEMENTATION / BOARD_BOTTOM_CONTROL_BAR_CONSISTENCY

The bottom control bar needs to feel like one controlled component system.

Tasks:

* make all bottom control items visually consistent
* make icon thickness appear equal
* make icon size appear equal, even if actual dimensions differ
* make label text visually consistent
* make icon-to-text gaps consistent
* make top, bottom, and side padding consistent
* make item widths feel balanced
* make colours consistent using existing tokens
* make the collapse/toggle symbol smaller and visually balanced
* reduce screen consumption without making controls harder to use
* refactor into a shared bottom control item component only if it safely reduces duplication

---

# IMPLEMENTATION / BOARD_BOTTOM_CONTROL_BAR_SUB_OPTIONS

Sub-options should appear above their selected bottom control item.

Tasks:

* show sub-options directly above the parent control
* match the sub-option width to the parent bottom control item width
* make each sub-option at least 50 px high where safe
* never go below 44 px
* if one option has three sub-options, stack three vertical squares above it
* keep the sub-option visually connected to the parent item
* avoid covering important AAC content unnecessarily
* keep the design calm and predictable

Example:

* Quick is pressed
* Manage appears directly above Quick
* Manage uses the same visual width as Quick

---

# IMPLEMENTATION / BOARD_EDIT_MODE_FOLDER_NAVIGATION

There is a navigation problem in edit mode.

Current issue:

* user enters edit mode
* user opens a folder
* user cannot go back
* controls only show Undo, Select, Move, and Save

Tasks:

* add Back on the far left when inside a folder during edit mode
* Back should return to the previous board/folder level
* Back should not unexpectedly exit edit mode
* do not break normal folder navigation outside edit mode

---

# IMPLEMENTATION / BOARD_SAVE_DONE_CANCEL_BEHAVIOUR

Some buttons say Save or Done when no changes were made.

Tasks:

* make Save/Done state-aware
* if no changes were made, show Cancel
* if changes were made, show Save or Done depending on the flow
* apply this consistently across bottom control bar flows
* do not show Save when there is nothing to save

---

# IMPLEMENTATION / BOARD_QUICK_MANAGE_SELECTED_STATE

Quick Manage currently does not show existing quick-tagged symbols as selected.

Tasks:

* when entering Quick manage/select mode, preselect symbols already tagged with Quick
* allow users to unselect symbols that are already tagged
* make it clear which symbols are already part of Quick

---

# IMPLEMENTATION / BOARD_QUICK_SORT_ORDER

When Quick is active:

* symbols must appear first
* folders must appear below symbols

---

# IMPLEMENTATION / BOARD_QUICK_TAGGED_VISIBILITY

When Quick is inactive or toggled off:

* quick-tagged symbols should not appear in the current Quick view
* quick-tagged folders should not appear in the current Quick view
* do not delete the actual items
* only remove them from the filtered Quick view

---

# IMPLEMENTATION / BOARD_COLLAPSED_CONTROL_BAR

When the bottom control bar is collapsed:

* keep the hugging/peeking toggle button
* make the peeking toggle area taller
* the peeking area should visually match the bottom control bar height
* keep it accessible and easy to tap

---

# IMPLEMENTATION / BOARD_PLACES_FOLDER_MODE_RENAME

Fix the internal board naming mismatch.

Current issue:

* the Places folder may point to a board mode named `animals`
* the board content appears to be places vocabulary
* this creates false internal semantics and blocks future animals vocabulary

Tasks:

* rename the internal board mode from `animals` to `places` if it currently contains places content
* update the Places folder target to `places`
* update the board mode type
* update all references safely
* do not create a new animals board in this task unless it already exists
* ensure TypeScript passes after the rename

Acceptance checks:

* Places points to `places`
* places vocabulary lives under `places`
* no animals key remains incorrectly holding places content
* folder navigation still works

---

# IMPLEMENTATION / BOARD_DARK_MODE_FOLDER_TOKENS

Fix folder colours in dark mode if they are too bright or copied from light mode.

Current issue to inspect:

* dark mode folder background may be the same bright yellow as light mode
* folder flap overlay may be near-white
* this can create glare and sensory load on a dark AAC board

Tasks:

* make dark mode folder background calmer and less glaring
* make dark mode folder flap/fold less bright
* keep folders visually distinct from normal symbols
* do not rely on brightness alone
* use token-based colours
* avoid random hardcoded colours

Acceptance checks:

* dark mode folder tiles are not harsh bright yellow
* folder fold is not near-white in dark mode
* folder tiles remain easy to identify
* no sensory-load regression is introduced

---

# IMPLEMENTATION / PROFILE_SETTINGS_ICON_ERROR

Current issue:

* `assets/symbol/toggle_off_Chevron` may be applied to every setting row
* this happens even when the row does not have multiple options

Tasks:

* fix the icon logic
* use the correct icon based on row type
* do not use toggle-style icons for simple page rows

---

# IMPLEMENTATION / REGISTRATION_ACCESSIBILITY_DARK_MODE_TEXT

Fix dark mode text visibility in the registration accessibility screen if static light colours are being used.

Current issue to inspect:

* some section labels may use static light-mode `colors.text`
* dark mode may render near-black text on a dark background

Tasks:

* replace static light colour usage with active theme colours
* ensure section headings are readable in dark mode
* make similar registration sections use one consistent theming approach
* do not introduce hardcoded colours

Acceptance checks:

* Theme and Symbol Colour Scheme labels are readable in dark mode
* section labels use active theme text colour
* contrast remains accessible

---

# IMPLEMENTATION / DARK_MODE_DISABLED_AND_PROGRESS_TOKENS

Fix dark mode disabled and progress track tokens if they are copied from light mode and fail contrast.

Tasks:

* inspect `disabled` and `progressTrack` dark mode tokens
* make them visually distinct against dark surfaces
* ensure Switch off tracks remain visible
* ensure progress bars remain visible
* do not make them harsh or overstimulating
* use token-based values

Acceptance checks:

* Switch off states are visible in dark mode
* activity progress bars are visible in dark mode
* dark tokens are not blindly identical to light tokens where that causes contrast failure

---

# IMPLEMENTATION / ACTIVITY_THEME_TOKEN_USAGE

Fix activity screens that import or use static light-mode colours.

Activities to inspect:

* Shape Match
* Colour Pop
* Memory Match

Tasks:

* remove static light-mode colour usage where active theme colours should be used
* migrate styles to active theme colours
* pass theme-aware colours into SVG/shape components where needed
* ensure dark mode activity screens do not show light-mode surfaces or overlays
* keep activity visuals calm and simple

Acceptance checks:

* activity screens respect dark mode
* static `colors` imports are removed where inappropriate
* theme-aware values are used consistently
* typecheck passes

---

# IMPLEMENTATION / MEMORY_MATCH_GEOMETRY_ACCESSIBILITY

Fix Memory Match if any shapes differ only by colour.

Current issue to inspect:

* duplicate circles may exist with different colours only
* duplicate squares may exist with different colours only
* colour should not be the only way to distinguish choices

Tasks:

* make every shape geometrically unique
* do not rely only on colour
* update accessibility labels to match the new geometry
* keep shapes simple and 2D
* do not add complex decoration or animation

Acceptance checks:

* no two shapes have the same visual form
* users can distinguish shapes without colour information
* accessibility labels are accurate

---

# IMPLEMENTATION / COLOUR_POP_CVD_ACCESSIBILITY

Fix Colour Pop if colour is the only mechanic with no CVD-safe alternative.

Tasks:

* respect the app’s CVD-safe colour scheme if it exists
* use CVD-safe colours when the user has selected that setting
* avoid red/green conflict pairs in CVD-safe mode
* source colours from existing palette/tokens where possible
* consider simple secondary visual differentiators only if already compatible with the app style
* do not make the game visually noisy

Acceptance checks:

* Colour Pop changes to CVD-safe colours when enabled
* colours are not hardcoded where active accessibility settings should apply
* the activity remains simple and readable

---

# IMPLEMENTATION / VISUAL_TIMER_FONT_SYSTEM

Fix Visual Timer font consistency.

Tasks:

* make countdown numerals use the app’s font system
* use existing display font tokens where appropriate
* remove raw font family string literals if present
* keep the timer visually calm and readable

Acceptance checks:

* countdown numerals match the app’s design system
* no unsupported font literals remain
* timer still renders correctly

---

# IMPLEMENTATION / LEGAL_CONSENT_LINKS

Fix registration consent links if they still point to stand-in external URLs.

Tasks:

* Terms link should open the in-app Terms screen
* Privacy link should open the in-app Privacy Policy screen
* remove stand-in external URL references from the consent flow
* avoid external browser dependency during consent
* keep the flow usable offline where possible

Acceptance checks:

* tapping Terms opens the in-app Terms screen
* tapping Privacy opens the in-app Privacy Policy screen
* no stand-in external legal URLs remain in the registration consent step

---

# IMPLEMENTATION / LEGAL_EMAIL_LINKS

Fix legal screen support email links.

Screens to inspect:

* Privacy Policy
* Terms of Use
* Data Choices

Tasks:

* make support email addresses tappable where they are presented as contact actions
* use `mailto:` handling
* add correct accessibility role and label
* keep visible tap affordance subtle and clear
* fix JSX spacing issues around email text
* make all legal screens consistent

Acceptance checks:

* tapping support email opens native mail compose
* VoiceOver announces it as a link
* sentences do not lose spacing around the email address

---

# IMPLEMENTATION / APP_VERSION_SOURCE

Fix hardcoded app version display if present.

Tasks:

* remove hardcoded app version strings
* read version from the app/build config source already used by the project
* include a graceful fallback if unavailable
* keep the Profile/About row stable

Acceptance checks:

* displayed version changes when app config version changes
* no permanent hardcoded `0.1.0` style version remains
* typecheck passes

---

# IMPLEMENTATION / GUARDIAN_SYMBOL_OVERRIDE_NO_FALLBACK

Fix unsafe guardian symbol override fallback.

Current issue to inspect:

* route may default to a hardcoded concept such as `CONCEPT_HELLO`
* missing concept ID should not silently edit the wrong symbol

Tasks:

* remove hardcoded concept fallback
* if no concept ID is provided, show a calm error/empty state
* provide a Back or dismiss action
* valid concept IDs should continue to work
* do not open the editor for the wrong concept

Acceptance checks:

* missing concept ID does not edit Hello or any default concept
* user sees a clear error state
* valid concept route still works

---

# IMPLEMENTATION / ROLE_MODEL_THERAPIST_VS_GUARDIAN

Audit the role model if Therapist is mapped to Guardian.

This is a sensitive data-model issue. Implement only if the fix is safe and contained.

Current issue to inspect:

* Therapist may be internally stored as `guardian`
* guardian and therapist are legally and practically different roles
* role-based consent logic may be affected

Tasks:

* check whether Therapist maps to `guardian`
* if safe, create a distinct `therapist` role
* update labels/options so Therapist maps to `therapist`
* keep Guardian for legal guardian/parent/authorised decision-maker
* audit role-based consent logic
* do not rewrite the registration system unnecessarily
* if the change is too wide, report exactly what needs a separate role-model migration

Acceptance checks:

* Therapist does not save as Guardian
* guardian-only flows do not apply to therapists
* TypeScript passes
* no role label becomes misleading

---

# IMPLEMENTATION / PROFILE_SETTINGS_ROW_ICON_LOGIC

Fix the Profile and Settings row icon behaviour so it follows an iOS-style settings pattern.

Current issue:

* `assets/symbol/toggle_off_Chevron` is being applied to too many setting rows.
* Some rows show a toggle-style chevron even when they are not expandable.
* Some rows only open a simple page, but visually look like they have multiple options.
* This creates visual clutter and makes the settings harder to understand.

Important iOS-style rule:

* A row that directly turns something on or off should use an actual iOS-style toggle switch.
* A row that opens another screen should use a normal navigation chevron.
* A row that expands inline to show multiple sub-options should use an expand/collapse indicator.
* A row that does not open anything, does not toggle anything, and does not expand should not show a chevron or toggle-style icon.

Do not use `toggle_off_Chevron` as the default icon for every row.

Create clear row types instead of using one icon everywhere.

Recommended row types:

* `navigation`
* `toggle`
* `expandable`
* `static`
* `action`

Row behaviour:

* `navigation`

  * use for rows that open another page
  * example: Privacy Policy, Terms of Use, Account Details
  * show a normal right chevron only
  * do not show a toggle-style icon

* `toggle`

  * use for rows that immediately turn a setting on or off
  * example: Reduce Motion, Dark Mode, Haptics, Sound Feedback
  * show the actual iOS-style switch control
  * do not show a chevron

* `expandable`

  * use only when the row reveals multiple sub-options inside the same screen
  * example: Voice and Speech if it expands to show Speech Rate, Pitch, Pronunciation, and Voice options
  * show an expand/collapse indicator
  * update accessibility state when expanded or collapsed

* `static`

  * use for read-only information
  * example: App Version
  * show no chevron
  * show no toggle
  * do not make it look interactive unless it is interactive

* `action`

  * use for one-step actions
  * example: Reset, Sign Out, Contact Support
  * show no chevron unless it opens a confirmation/details screen
  * use calm styling and avoid harsh destructive colours unless absolutely required

Tasks:

* inspect the Profile and Settings row components
* remove the logic that applies `assets/symbol/toggle_off_Chevron` to every row
* create or update a reusable settings row component with explicit row type support
* make the icon/accessory depend on the row type
* use normal navigation chevrons for page-opening rows
* use actual switch controls for true toggles
* use expand/collapse indicators only for rows that reveal multiple inline sub-options
* remove chevrons/icons from rows that do not need them
* keep spacing, padding, text size, and row height consistent
* use existing design tokens
* keep the settings visually calm and not overstimulating

Accessibility requirements:

* navigation rows need `accessibilityRole="button"`
* toggle rows need correct switch role/state
* expandable rows need `accessibilityRole="button"` and expanded/collapsed state
* static rows should not be announced as buttons
* action rows need clear labels and hints where needed
* every row should have a clear accessibility label

Acceptance checks:

* Privacy Policy opens as a normal navigation row with a standard chevron, not a toggle-style icon.
* Terms of Use opens as a normal navigation row with a standard chevron, not a toggle-style icon.
* Reduce Motion and similar true on/off settings use actual iOS-style switches.
* Voice and Speech only uses expandable styling if it reveals multiple sub-options inline.
* App Version or other read-only rows show no chevron and no toggle.
* `toggle_off_Chevron` is no longer used as the default accessory for every setting row.
* Settings are visually cleaner and easier to scan.
* Typecheck passes.

---

# OUT_OF_SCOPE / DO_NOT_IMPLEMENT_THIS_PASS

Do not implement these in this pass unless the project already has a safe existing backend/API path:

* real SMS verification system
* duplicate email server check
* new authentication backend
* production account verification system
* full TTS voice selector feature
* Focus Mode
* full-screen mode
* large navigation redesign
* new activity system
* new real symbol pack library

If these are found as problems, report them as separate future tasks.

---

# FINAL CHECKS

Before finishing:

* confirm all important controls remain accessible
* confirm icons and text resize with their containers
* confirm padding and gaps are consistent
* confirm no important control drops below minimum touch target
* confirm existing AAC speech behaviour still works
* confirm folder navigation still works
* confirm quick mode still works
* confirm edit mode still works
* confirm dark mode remains readable
* confirm activity screens still work
* confirm no legal/contact link regression

---

# FINAL REPORT FORMAT

1. Next 10 Implementation plan that should be done that makes sense after this pass

# END FABLE 5 / TAPTALK AAC BOARD + ACCESSIBILITY + PERFORMANCE FIX PASS