# TapTalk Design Laws

These 30 rules are the source of truth for every screen, component, and interaction in TapTalk.
Apply them before shipping any feature. No exceptions.

---

### 1. Simple first, advanced later
Show the main controls first. Put advanced settings inside expandable areas, "More" menus, edit mode, or settings.
Disclosure patterns show and hide extra content instead of displaying everything at once.

### 2. Only show what is relevant right now
Do not place every option on the main screen. Show controls based on the current task.
Context-specific controls reduce clutter and keep the screen focused.

### 3. Use expandable sections for extra detail
Use expandable cards or disclosure rows for optional content, advanced settings, filters, and extra information.
The user sees the label first, then chooses whether to expand the hidden content.

### 4. Use stable main navigation
Use clear main sections such as TalkBoard, Routine, Calendar, Tools, and Profile. Do not move main tabs around.
Tab-based and stack-based navigation help users move between major app areas predictably.

### 5. Use deeper pages only when needed
Keep the first screen clean. Push deeper details into secondary pages only when the user selects something.
Navigation stacks present views over a root view, creating a clear path from simple to detailed.

### 6. Use modal screens only for focused tasks
Use sheets, alerts, popovers, or confirmation dialogs only for important, narrow tasks.
Modal presentations are designed to draw attention to a specific task, not to replace normal navigation.

### 7. Keep actions attached to clear controls
A button must have one clear action. Avoid vague buttons like "Go" or "Do it" unless the context is obvious.
Buttons are action controls — the user must understand what will happen when they tap.

### 8. Use toggles only for on/off settings
Use toggles for binary settings such as enabled/disabled, visible/hidden, sound on/off, or reduce animation on/off.
Toggles are bound to Boolean states, so they should represent clear on/off choices.

### 9. Use pickers for choosing one option
Use pickers for controlled choices such as category, colour mode, voice type, routine type, or calendar view.
Pickers bind the interface to a selected value from a list of choices.

### 10. Use menus for secondary actions
Put less common actions such as duplicate, rename, move, archive, or export inside a menu.
Menus provide access to commands without taking over the main screen.

### 11. Use context menus for item-specific actions
Long-press or item menus should only show actions relevant to that exact item.
Context menus are situational and should support the current task.

### 12. Separate normal actions from risky actions
Destructive actions like delete, clear all, reset, or remove must be visually separated and confirmed.
Confirmation dialogs and severity patterns exist for actions where the user needs extra care.

### 13. Give every action a clear result
When the user taps, selects, completes, saves, deletes, or changes something, show visible feedback immediately.
Interaction should make state changes obvious.

### 14. Use animation to explain change
Animate changes when something expands, collapses, moves, appears, disappears, or changes state.
Animation helps connect the action to the result.

### 15. Keep animation purposeful
Do not animate just for decoration. Use motion to show cause and effect.
Animation should support understanding, not distract from the task.

### 16. Use spring motion for natural movement
Use soft spring-like motion for cards, buttons, symbol movement, and expandable areas.
Spring animation supports movement that feels physical and responsive.

### 17. Use linear motion only when mechanical movement is needed
Use linear animation for loading indicators, progress movement, or activity-style motion.
Linear motion has consistent speed and feels mechanical — it fits predictable repeated motion.

### 18. Respect Reduce Motion
Provide a reduced-motion version of animations. Replace floating, zooming, or bouncing with simple fades.
Use `src/hooks/useReduceMotion.ts` — it is already wired up across the codebase.

### 19. Use haptics and audio feedback carefully
Use light feedback for selection, completion, start/stop, success, warning, or delete confirmation. Do not overuse it.
Use `src/utils/haptics.ts` helpers. Sensory feedback should support the visual experience, not replace it.

### 20. Make touch areas forgiving
Buttons, cards, tiles, and symbols must be easy to tap. Increase the interactive area even if the visual looks smaller.
Minimum 44 × 44 pt for all interactive elements. Primary actions ≥ 60 pt where layout allows.

### 21. Design for accessibility from the start
Every important control needs readable text, clear labels, strong contrast, logical structure, and screen-reader support.
Every interactive element gets `accessibilityRole` + `accessibilityLabel`, plus `accessibilityState` when applicable.

### 22. Support scalable text
Text should scale cleanly. Avoid layouts that break when text becomes larger.
Dynamic Type supports scalable content and allows users to choose larger text sizes.

### 23. Do not rely on colour alone
Use labels, icons, shape, spacing, and state changes alongside colour.
Accessible appearance settings can require greater contrast or alternatives to purely visual styling.

### 24. Use helpful empty states
If a page has no content yet, show a simple explanation and the next action.
Content-unavailable views exist for moments when app content is not available.

### 25. Use edit mode for power features
Rearranging, hiding, deleting, customising, and bulk editing should happen inside edit mode, not always-on mode.
Edit mode separates normal use from content editing.

### 26. Support undo for important changes
After deleting, clearing, moving, or editing important content, provide undo where possible.
Undo management exists for registering reversible operations.

### 27. Use lists and sections to organise content
Group related settings, routines, symbols, tasks, and calendar items into clear sections.
Lists and sections provide hierarchy and make large content easier to scan.

### 28. Use search only when it improves speed
Add search for large symbol libraries, routines, tools, files, or categories. Include suggestions where useful.
Search interfaces and search suggestions help users find content inside the app.

### 29. Use toolbars for nearby important actions
Put high-value actions near the top or bottom of the relevant screen, not randomly inside the layout.
Toolbars hold actions connected to the current view.

### 30. Keep the final experience calm and predictable
The app should feel clean, stable, low-effort, and easy to understand.
Avoid surprise interactions, overloaded screens, and unnecessary visual noise.
The goal: clear structure, controlled disclosure, direct actions, accessible settings, and predictable state changes.
