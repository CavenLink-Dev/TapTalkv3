# Future Implementation Plan

This plan covers the future profile, settings, and accessibility work for TapTalk. It is written from the point of view of someone who may rely on the app because speech, movement, vision, hearing, memory, attention, reading, or sensory processing is difficult. The key lesson from the audit is simple: do not add more isolated settings first. Make the existing accessibility choices real across the whole app.

## What It Does

The future profile should become a support profile, not just an account page. It should explain who the user is, how they communicate, what makes the app easier or harder for them, who can help them, and what settings are active. The settings area should become the control centre for voice, display, motor access, sensory feedback, guardian controls, privacy, data, and help. Accessibility should become an app-wide system that changes tokens, components, navigation, speech, feedback, and layout consistently.

The most important implementation is an Accessibility Profile Layer. It should read the existing `state.accessibility` values from `src/context/AppContext.tsx`, combine them with device preferences such as screen reader and Reduce Motion, and return derived theme values for every screen. The current state already stores `textSize`, `buttonSize`, `theme`, `highContrast`, `colorScheme`, `speechRate`, `speechPitch`, and `hapticsEnabled`. The gap is that these preferences are not yet applied everywhere.

## Current Good

- Registration already asks for accessibility preferences and shows a live preview.
- App state already persists accessibility settings and keeps them after sign-out.
- Several controls already use `accessibilityRole`, `accessibilityLabel`, and `accessibilityState`.
- `useReduceMotion` exists and some screens already branch animations.
- Voice settings already affect AAC speech rate and pitch.
- Haptics can already be disabled in stored settings.
- The app has strong base tokens in `src/theme/tokens.ts`.
- The design laws already require clear controls, scalable text, Reduce Motion, non-colour cues, forgiving touch areas, and predictable screens.

## Current Bad

- Text size is mostly a preview and setting, not a global typography system.
- Button size is stored but not applied across `PrimaryButton`, tiles, rows, and icon buttons.
- Theme is stored, but dark/system theme is not a real app-wide colour mode yet.
- High contrast is partially screen-specific instead of a global mode.
- Some hardcoded colours bypass the theme tokens.
- Profile and Settings overlap: Profile says "account, voice, and controls", while settings owns voice/display.
- Some settings rows are visible but not actionable, which is confusing for screen reader and cognitive users.
- Drag, long-press, swipe, and custom controls need simple tap alternatives.
- Important status changes need stronger screen reader announcements.
- Profile does not yet capture communication needs, motor access needs, sensory needs, guardian preferences, or emergency communication.

## Disabled User Walkthrough

Good moments: the app feels visually calm, uses symbols, has AAC speech, has large primary buttons, keeps a stable tab structure, and already thinks about Reduce Motion and haptics. A user can see that TapTalk is trying to be supportive, not just decorative.

Bad moments: a user may choose large text or high contrast and then find that many screens still look unchanged. A screen reader user may hear labels but not enough state or context. A motor-impaired user may struggle with small icons, drag actions, or controls that require precise tapping. A cognitively fatigued user may not know which area owns account settings, accessibility settings, premium tools, or caregiver controls. A sensory-sensitive user may not have one place to turn down motion, sound, haptics, and visual intensity.

## Most Important Decision

Build one accessibility engine before redesigning many screens. Every profile and settings feature should use the same derived values:

- `scaledTypography`: maps `typography` tokens to default, large, xlarge, and maximum sizes.
- `scaledTargets`: maps standard controls to at least 44 x 44, primary actions to 60+, and large mode to 72 where possible.
- `accessibleColors`: maps light, dark, high contrast, and CVD-safe symbol colours from the existing token palette.
- `motionPolicy`: standard, reduced, or none for decorative motion.
- `feedbackPolicy`: haptics, sound, speech, and live announcements.

The profile/settings redesign should then become mostly composition work, because `Screen`, `Card`, `PrimaryButton`, `TextField`, rows, pills, tiles, and AAC symbols will already respond correctly.

## Implementation Order

1. Foundation first: create an app-wide accessibility/theme hook that derives colours, type scale, target sizes, motion, and feedback from `state.accessibility` plus device preferences.
2. Make core components consume it: `Screen`, `PrimaryButton`, `TextField`, `Card`, `Pill`, settings rows, tab buttons, AAC symbol tiles, activity controls, and list rows.
3. Redesign Profile as "My Support Profile": communication profile, preferred name, profile photo, AAC needs, guardian contacts, emergency phrase, access needs, and active settings summary.
4. Redesign Settings into clear sections: Accessibility, Voice and Speech, Display, Motor Access, Sensory Feedback, Guardian Controls, Account, Data and Privacy, Help.
5. Replace fake or non-actionable rows with real routes, disabled explanations, or remove them until ready.
6. Add a full Accessibility Settings page instead of hiding everything under Display.
7. Add a screen reader audit pass: role, label, hint where needed, state, value, modal focus, live announcements, and escape/back behaviour.
8. Add a motor access pass: no required drag-only actions, no required long-press-only actions, forgiving hit areas, clear focus, and alternatives for reordering.
9. Add a cognitive pass: plain words, short paths, no duplicate entry, visible progress, undo, confirmation for risky actions, and consistent help.
10. Add test coverage for derived tokens, reducer persistence, core component scaling, and key settings flows.

## Profile: What It Can Do

- Show identity: display name, optional profile photo, age range if useful, role, signed-in status.
- Show communication support: AAC user type, preferred voice, speech rate, pitch, common phrases, emergency phrase, and symbol style.
- Show access needs: text size, button size, motor access preference, high contrast, colour scheme, motion, haptics, sound.
- Show trusted people: guardian, parent/support email, lock status, timeout, recovery contact.
- Show daily context: streaks and stats only if they help; do not make the user feel judged.
- Offer quick actions: edit support profile, open accessibility settings, test voice, manage caregiver lock, export/backup support profile.
- Keep dangerous actions separate: sign out, reset profile, delete data.

## Settings: How It Should Work

Settings should use rows with a title, short description, current value, icon, and chevron. Every row must be a real control or a real navigation action. For example, "Text Size" should show the current value; "High Contrast" should show on/off; "Voice and Speech" should show selected voice/rate; "Haptics" should show on/off. Screen readers should hear the row purpose and current state without needing to open it.

The first settings screen should stay simple:

- Accessibility
- Voice and Speech
- Display
- Motor Access
- Sensory Feedback
- Guardian Controls
- Account
- Data and Privacy
- Help

Advanced settings should live one level deeper. This matches the existing design law: simple first, advanced later.

## Accessibility Requirements

- Text contrast should target WCAG 2.2 AA: 4.5:1 for normal text and 3:1 for large text.
- Icons, borders, selected states, focus states, and graphical controls should target at least 3:1 against adjacent colours.
- Touch targets should be at least 44 x 44 in TapTalk even though WCAG 2.2 minimum is 24 x 24; AAC users need the more forgiving target.
- Primary AAC and safety actions should be 60+ high where layout allows.
- Text must scale without clipping, overlap, or hidden controls.
- Do not rely on colour alone; selected, locked, premium, disabled, correct, incorrect, and warning states need text/icon/shape as well.
- Motion must be purposeful and disabled or simplified when Reduce Motion is on.
- Dragging must always have a tap alternative.
- Authentication and caregiver locks should not rely only on memory-heavy steps; keep passkey/biometric paths and recovery routes.
- Avoid duplicate entry in onboarding and settings; reuse profile details already collected.

## Theme And Sizing Rules

Use `src/theme/tokens.ts` as the source of truth. Do not invent local palettes inside future profile/settings pages unless a new semantic token is added. Replace hardcoded screen colours like selected blues, greens, and premium backgrounds with semantic tokens.

Recommended mappings:

- `textSize.default`: current token sizes.
- `textSize.large`: 1.15 scale.
- `textSize.xlarge`: 1.3 scale.
- `textSize.maximum`: 1.5 scale with layout changes, not just bigger text.
- `buttonSize.standard`: minimum 54 for primary buttons, 44 for icon buttons and rows.
- `buttonSize.large`: 72 for primary buttons and AAC controls, 56+ for rows and icon buttons.
- `highContrast`: stronger text, stronger borders, visible selected states, no subtle-only dividers.
- `theme.system`: read device colour scheme instead of the current placeholder.
- `colorScheme.cvd_safe`: apply to AAC symbol category colours, not only the registration preview.

Avoid fixed heights around dynamic text. Prefer `minHeight`, `flexWrap`, `numberOfLines` only where truncation is intentional, and `adjustsFontSizeToFit` only for compact labels that must stay inside a fixed control.

## Good Future Experience

A user opens Profile and immediately understands: "This is me, this is how I communicate, these are my supports, and these settings help me use the app." They open Settings and every row either changes something understandable or leads to a focused page. If they enlarge text, every page respects it. If they enable high contrast, selected states, borders, and symbols become clearer everywhere. If they use VoiceOver or TalkBack, controls are named, states are announced, and decorative visuals stay quiet. If they have tremor or limited motor control, they can tap instead of drag and targets are forgiving. If they are overwhelmed, the app stays calm and predictable.

## What To Avoid

- Do not build more one-off settings that only affect one screen.
- Do not make Profile a marketing or stats page.
- Do not hide accessibility under "Display" only.
- Do not make premium locks sound like disabled controls without explaining why.
- Do not require gestures that some users cannot perform.
- Do not use colour as the only difference between states.
- Do not shrink text to solve layout problems unless the control has no better layout option.
- Do not add busy animations, bounce, parallax, or decorative motion to accessibility-critical flows.

## Verification Checklist

- VoiceOver and TalkBack can navigate Profile, Settings, Display, Voice, Talk Board, Activities, Calendar, and Tools.
- Every interactive element has role, label, state, and value when relevant.
- Large and maximum text do not clip on small phones.
- Button size preference changes core controls globally.
- Dark/system theme works outside previews.
- High contrast changes all major screens, not only activities.
- CVD-safe colours apply to AAC symbols.
- Haptics off means no selection haptics.
- Speech settings affect every spoken AAC output and preview.
- Reduce Motion disables decorative movement and keeps meaning clear.
- Reorder/drag features have tap alternatives.
- Destructive actions have confirmation and preferably undo.
- Profile and settings changes persist after restart and sign-out where appropriate.

## Research Anchors

- W3C WCAG 2.2 Quick Reference: contrast, resize text, focus visible, target size, dragging alternatives, redundant entry, accessible authentication.
- W3C Cognitive and Learning Disabilities guidance: clear purpose, clear operation, findable tasks, clear language, mistake prevention, focus, memory support, help, personalization.
- React Native 0.81 accessibility docs: `accessibilityLabel`, `accessibilityHint`, `accessibilityRole`, `accessibilityState`, `accessibilityValue`, live regions, modal hiding, and platform differences between VoiceOver and TalkBack.

## Final Distillation

The future implementation should not be "add an accessibility page." It should be "make TapTalk adapt to the person." Build the shared accessibility engine, wire every core component into it, then redesign Profile and Settings around support needs. That is the shortest path from hundreds of possible improvements to the few changes that will make the whole app meaningfully better for disabled users.
