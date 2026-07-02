# Activity Game Implementation Rules

> Canonical rules every Activity game (current and future) must follow. Read this **before** building a new activity game or modifying an existing one. Treat these as binding — they ride on top of the general 30 rules in `RULES.md`. Where the two overlap, this file is more specific.

These rules were locked with the user during the Shape Match build. They exist because the audience (users with autism, speech impairment, motor differences, cognitive load) reacts badly to anything that feels random, infinite, or judgmental. Every rule here is a guard against one of those failure modes.

**Shape Match is the reference shell for every Activity game.** Do not copy the Shape Match gameplay unless the game is actually shape matching. Do copy its non-game structure: start overlay, Easy / Medium / Hard rows, bright page, shared progress bar, header, sound toggle, instruction placement, footer buttons, completion overlay, Reduce Motion handling, and calm feedback rules.

---

## 1. Start overlay — what it shows, what it doesn't

When the user taps an activity card, **never open the game immediately**. Always present a small centred Modal first with these elements, top to bottom, in this order:

1. **Title** — the activity name. Centered, heading weight.
2. **Subtitle** — one short sentence describing what the user will do.
3. **DIFFICULTY section** — small uppercase eyebrow, then exactly these rows when the game supports all three: `Easy`, `Medium`, `Hard`.
   - Rows show **just the difficulty name**. Do **not** include subtitles like "4 shapes · 15 levels". Simple is the rule.
   - Use radio rows (circle + label). Active row gets a soft tinted background.
   - All offered levels must actually be playable. Don't ship "Coming soon" rows in a difficulty list.
   - If a future game truly cannot support all three difficulties on day one, show only the playable rows. Never show disabled difficulty rows.
4. **Cancel + Start Game** buttons in a single row at the bottom.

### Things to NEVER include in a start overlay
- ❌ **Players section.** Until multiplayer ships, the game is 1-player. Showing "1 Player" as the only option is noise — strip it.
- ❌ Description subtitles under difficulty rows. Keep them clean.
- ❌ Settings panels, sound toggles, accessibility toggles. Those belong inside the game header or system Settings, not the start overlay.
- ❌ "Coming soon" placeholders.

---

## 2. Game screen — required structure

```
┌─────────────────────────────────────┐
│ ◀  Title              🔇  ❓       │  ← header (Back, Title, Sound, Help)
│                                     │
│              Level 3 of 15          │  ← LEVEL PILL (required)
│                                     │
│         (instruction text)          │
│                                     │
│           game body                 │
│                                     │
│   ◀ Back    ↻ Reset   Forward ▶    │  ← footer (Back, Reset, Forward)
└─────────────────────────────────────┘
```

### 2.1 Background — BRIGHT
Use **pure `#FFFFFF`** for the page. Surfaces inside the page (slots, footer buttons, recessed wells) lift slightly with `#F1F5F9` (the standard `colors.background` value) so they read as raised on the white. Do NOT use a warm grey for the page — the user explicitly asked for bright.

### 2.2 The Level Pill is mandatory
- Always visible, always shows `Level X of Y`.
- Sits prominently between the header and the body — its own line, centered.
- This is the single most important piece of session orientation. Users with cognitive load need to know where they are. Without it the game feels infinite.
- Flash it (scale 1.0 → 1.12 → 1.0) when the level advances so the change registers.

### 2.2a Activity progress bar (mandatory)

Every activity game uses the shared progress bar assets in `assets/progress_bar/`.

- **Back button:** use `assets/progress_bar/back_button.svg`. It is a circular white button with a dark arrow. Minimum touch target 44×44 pt.
- **Progress track:** use `assets/progress_bar/progress_bar_background.svg` as the pill background.
- **Fill indicator:** use `assets/progress_bar/progress_bar_fill_element.svg` for completed levels.
- **Layout:** back button sits at the left of the header. The progress bar sits beside or below the game title, centered.
- **Behaviour:** render one slot per level in the current difficulty. Fill slots up to and including the current level. Do not animate the fill unless `useReduceMotion()` is false.
- **Accessibility:** keep the text "Level X of Y" available to screen readers even when the visual bar replaces the old level pill.

The progress bar is the canonical level indicator. The old text-only pill may be removed or kept as a subtitle, but the visual bar must be present.

### 2.3 Things to REMOVE from the in-game UI
- ❌ **Difficulty chip alongside the level pill.** Once the game starts the user already knows the difficulty they picked. Showing it again is clutter.
- ❌ **Custom back buttons or back chevrons that don't use the shared `assets/progress_bar/back_button.svg`.**
- ❌ **Hint button.** Hints train users to wait for help instead of trying. If the activity benefits from a hint (e.g. memory recall), present it as a passive visual cue, not a button.
- ❌ **Check Answers button.** The game must auto-detect completion. Asking the user to declare "I'm done" is one extra cognitive step.

### 2.4 Footer — three buttons, always
The footer has exactly three controls, in this order:

| Position | Action | Behaviour |
|----------|--------|-----------|
| Left   | **Back**    | Go to previous level. Restart that level from the beginning (clear placed state, generate fresh layout). Disabled on level 1. |
| Centre | **Reset**   | Restart the current level. Confirm with `Alert.alert` only if progress has been made. |
| Right  | **Forward** | Skip to the next level. Same fresh start as Back, just the other direction. Disabled on the last level. |

Visual weight: Back = light primary tint (`#E6F4FD`, blue text). Reset = neutral recess (`#F1F5F9`). Forward = solid primary fill (`colors.primary`, white text). The right-side primary action confirms "you're heading forward".

### 2.5 Safe area
Always pull `useSafeAreaInsets()` and pad the body bottom with `insets.bottom + spacing.md`. The footer must clear the iPhone home indicator. **Always check this on a real device-sized layout** — a screenshot where the footer clips is the most common bug.

### 2.6 Instruction text must be readable
The instruction line sits directly below the level pill/pill. It must be:
- **Large enough to read at arm's length** — minimum `typography.body` (≈17 pt) and preferably `typography.callout` or larger. Never use `caption` or `footnote` for instructions.
- **Centred and high-contrast** — use `colors.text` on `#FFFFFF`.
- **One short line** — one sentence only. If the instruction needs more than one line, split it into a visual example instead of more words.
- **Visually separated** — add at least `spacing.md` (16 pt) between the level pill and the instruction text, and again before the game body.

❌ Do not make instructions tiny or faded. A user with low vision, motor delay, or cognitive load must be able to read it without squinting.

---

## 3. Voice and sound

> **Updated 2026-07-02 (user decision):** sound effects and voice/TTS are now
> **two separate controls**.
>
> - **Sound effects (MP3 cues)** default **ON**. The header sound toggle
>   (volume icon) controls them. The choice is shared across all activities
>   and persisted via `src/features/activities/sound-settings.ts`
>   (`useActivitySfx()` / `setActivitySfxEnabled()`). Every game — current and
>   future — must read this shared setting, never a local default.
> - **Voice / TTS** stays **opt-in, default OFF, per game session** (a second
>   header toggle, chatbubble icon, only in games that speak — e.g. Memory
>   Match). Nothing below about speech restrictions has changed.

- **Voice default OFF.** The voice toggle starts silent. The user must opt in. Speech is overwhelming for many in the audience and unsolicited audio kills trust.
- When ON, speech is **strictly limited to one cue per game**:
  - Shape Match → speak the shape name when its tile is tapped.
  - Memory Match → speak the symbol name when it's revealed.
  - Picture Match → speak the displayed word.
  - Count Along → speak the number when the user picks one.
- ❌ **Never speak "matched" / "correct" / "well done" / "good job"** — patronising.
- ❌ **Never speak "wrong" / "no" / "try again" / "incorrect"** — punishing.
- ❌ **Never speak instructions** like "Find the Circle." or "Try the Square outline." — the game's visual structure is the instruction; speaking it implies the user is failing to follow along.

### 3.1 Activity sound effects — canonical MP3 cues

Every activity may use the same short MP3 cue categories. Keep them subtle, low-volume, and non-judgmental. These cues are sound effects, not spoken praise or spoken correction.

| Cue | When it plays | Rule |
|-----|---------------|------|
| `select_selection` | User selects/taps a game item before answering, e.g. tapping a Shape Match shape. | Light tap/selection feedback. Safe to use often. |
| `confirm_selection` | User commits an answer/target, e.g. placing the selected shape into an outline or choosing a card/answer. | Confirms intent only; does not mean correct. |
| `correct` | The committed answer is correct. | Short, calm success sound. No voice saying "correct". |
| `incorrect` | The committed answer is incorrect. | Soft, non-punishing cue. Pair with gentle return / Try Again toast. No harsh buzz. |
| `level_complete` | All required answers for the level are complete. | Plays once before level advances or success overlay opens. |
| `denied` | Extremely rare. Only when the user is blocked from an action that truly cannot happen. | Avoid whenever possible. Never make the user feel rejected or punished. Prefer disabled UI, clear state, or no-op over this sound. |

Interaction sequence example for Shape Match:

1. User taps a shape → `select_selection`.
2. User picks/places the answer target → `confirm_selection`.
3. If correct → `correct`.
4. If incorrect → `incorrect` + gentle return + Try Again toast.
5. When the whole level is complete → `level_complete`.

Do not stack sounds on top of each other. If two cues would overlap, play the more specific outcome cue (`correct`, `incorrect`, or `level_complete`) after the commit cue with a tiny delay, or skip the less important cue.

---

## 4. Wrong answer behaviour

When the user places the wrong shape / picks the wrong card / answers wrong:

1. **Gentle return.** Animate the dragged element back to its origin with `Animated.spring` (recommended params: `friction: 8, tension: 110`).
2. **Soft amber toast.** Show a small chip near the bottom: amber background `#FFF4E0`, amber text `#A65900`, label `Try Again` (caps, friendly). Fade in 160 ms, hold 900 ms, fade out 220 ms. Auto-dismiss — never blocks the user.
3. **Sound cue:** play `incorrect` only if activity sound effects are enabled. Keep it soft and non-punishing.
4. ❌ **No `Alert.alert`** for wrong answers. Modal alerts read as scary punishment.
5. ❌ **No "You Failed" / "Game Over" / "Wrong!" copy**. Ever.
6. ❌ **No score penalty, no shake-cam, no red flash.**

The point: getting it wrong is part of learning. The interaction should make that obvious.

---

## 5. Correct answer behaviour

1. Lock the placement (the shape / card stays put).
2. Light success haptic via `expo-haptics`.
3. Play `correct` only if activity sound effects are enabled.
4. Fade-in the filled state on the slot over ~240 ms (Reduce Motion: 120 ms).
5. No celebratory voice. No "correct!" voice. No confetti per-shape (save confetti for the end-of-difficulty victory).
6. When ALL placements are correct → **auto-advance**. Do not require a tap.

---

## 6. Level progression

- Every difficulty has a fixed total number of levels (e.g. Easy 15, Medium 25, Hard 30). Show this total in the level pill.
- Each level **re-shuffles** position (and any other randomisable state) so the user can't memorise positions.
- On completion of a level: play `level_complete` if activity sound effects are enabled, short 600–700 ms delay, level pill/progress indicator flashes green, layout swaps to the next level.
- Final level completed → success overlay (see below).
- Forward/Back navigation always starts the destination level **from the beginning**. Do not preserve placed state across the jump.

---

## 7. Success overlay (end of difficulty)

When the user completes the final level of the chosen difficulty:

1. Same overlay pattern as the start overlay (centred Card on dimmed backdrop).
2. **Green check badge** (96 pt circle, success colour, white check inside).
3. Title: `Great work!`
4. Sub: `You matched every shape across N {difficulty} levels.` — adjust copy per game but keep the structure: positive verb + count + difficulty.
5. Three actions stacked, full width:
   - **Play Again** (primary blue) — restarts from level 1, same difficulty.
   - **Next Activity** (light blue secondary) — routes to the next game in `ACTIVITY_LIST` order.
   - **Back to Activity** (ghost) — routes back to the Activities tab.

---

## 8. Reduce Motion

Wire `useReduceMotion()` from `src/hooks/useReduceMotion.ts` in every activity game. When true:

- Skip pulse / loop animations (set the static end-state colour instead).
- Skip the lift-on-drag scale.
- Shorten the spring-back animation (~80 ms instead of 160).
- Replace any "bounce in" entrance with a single fade.

The functional behaviour must be identical — only the motion changes.

---

## 9. Accessibility (non-negotiable)

Every interactive node:

- `accessibilityRole` (`button`, `radio`, `header`, etc.)
- `accessibilityLabel` describing the action and current state.
- `accessibilityState` for `selected`, `disabled`, `expanded`, etc.

Slot labels should include "filled" when matched. Footer button labels should include the level number they navigate to (e.g. "Skip to level 4"). Disabled state must be announced.

---

## 10. Header

The four-element header is the same on every activity:

```
[ ◀ Back ] [ Game Title ] [ 🔇 Sound ] [ ❓ Help ]
```

- Back chevron always navigates `router.back()`. No confirm — the game state is ephemeral.
- Title is the activity name, heading weight.
- Sound toggle switches between `volume-medium-outline` and `volume-mute-outline`. Controls **sound effects only** and defaults to **on** (shared + persisted via `useActivitySfx()`). Updates `accessibilityState.selected`. Games with a voice cue add a separate chatbubble voice toggle (default off).
- Help opens an `Alert.alert` with the game's "How to play" copy. One paragraph max, "Got it" button.

---

## 11. Persistence and progress

V1 of any activity game does **not** persist progress. No scores saved, no streaks tracked, no level-unlock state. The Activities system may track completion counts later; if so, the game emits a single "completed" event when the full difficulty wraps. Until then, opening the game always starts fresh at the start overlay.

---

## 12. Code structure (recommended scaffold)

```
app/activities/<game-id>.tsx        ← single-file game route
  ├ Phase type ('select' | 'play' | 'won')
  ├ Difficulty type
  ├ Shape/Card/Item type
  ├ Level layout generator
  ├ Sound cue map (`select_selection`, `confirm_selection`, `correct`, `incorrect`, `level_complete`, `denied`)
  ├ Render: header, progress bar / level indicator, instruction, body, footer
  ├ StartOverlay component (Modal)
  ├ SuccessOverlay component (Modal)
  └ All styles inline in StyleSheet.create
```

If the game uses shared primitives (wheel pickers, disclosure rows), reuse from `src/components/native/`. Don't fork them into the activity file.

---

## 13. Existing games — known gaps to address later

The first three games — **Memory Match**, **Picture Match**, **Count Along** — were built before these rules existed. They have pre-existing typecheck errors and don't follow the rules above. When time allows, retrofit them:

- Add the level pill if they use multi-round structure.
- Strip Hint/Check buttons.
- Add Back/Reset/Forward footer.
- Adopt the bright `#FFFFFF` page.
- Strip "Players" if it appears.
- Add Reduce Motion support.

Until that retrofit lands, only **Shape Match** is the reference implementation.

---

## File created and maintained by AI assistant. Update only when the user changes a rule.
