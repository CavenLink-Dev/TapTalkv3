# Board Keyboard — Speech Behaviour Rules

> Reference for Step 7 (Board keyboard rebuild). User-specified, locked.

The Board's TAPTALK keyboard speaks letters as the user types and shapes how the full message is read aloud. This document is the source of truth for what triggers speech and how the engine should phrase a built sentence.

---

## Per-keystroke behaviour (immediate speech)

| Key type | Example keys | Speaks on press? | What it says |
|----------|--------------|------------------|--------------|
| Letter | A–Z | **Yes** | The letter itself, in the user's chosen voice. |
| Space | space bar | No | Silent (advances cursor / inserts space). |
| Backspace | ⌫ | No | Silent (removes the previous character). |
| Period | `.` | No (silent on press) | Inserts the character; modifies sentence-speak only. |
| Comma | `,` | No | Inserts; modifies sentence-speak only. |
| Exclamation | `!` | No | Inserts; modifies sentence-speak only. |
| Question | `?` | No | Inserts; modifies sentence-speak only. |

**Why letters speak on press:** confirms to the user that the right key registered, helps with motor accuracy, and supports users who are spelling out a word with a partner.

**Why punctuation is silent on press:** punctuation glyphs don't have a useful spoken form ("dot", "comma" would be noise). They earn their keep when the full sentence is spoken aloud.

**Why space and backspace are silent:** these are mechanical keys; speaking them ("space", "delete") would clutter the audio stream during fast typing.

---

## Full-message speak behaviour

Triggered when the user **taps the message strip** (or any explicit Speak action). The whole message is sent to TTS as one utterance with the following modifications applied per punctuation token:

| Punctuation | Effect on speech |
|-------------|------------------|
| `.` (period) | Brief pause (~300–400 ms) after the preceding clause. Treats the next character as the start of a new sentence (capitalised intonation). |
| `,` (comma) | Short pause (~150–200 ms). No sentence reset. |
| `!` (exclamation) | The clause ending in `!` is rendered with **increased volume / emphasis toward the end** of that clause. Use TTS volume / pitch / rate parameters supported by `expo-speech` — likely a rate dip + volume rise on the final word. |
| `?` (question mark) | The clause ending in `?` uses **rising intonation** at the end. Achieve by raising pitch on the final word. |

When a clause is read with `!` or `?` modification, the rest of the message after that clause returns to neutral delivery — modifications apply only to the clause that contains the punctuation.

---

## Implementation notes for Step 7

- `expo-speech` exposes `rate` and `pitch` per call but **does not split clauses** for you. Tokenise the message into clauses by punctuation, fire `Speech.speak()` calls in sequence with the appropriate `rate`/`pitch` parameters, and chain them via `onDone` callbacks.
- For pauses, insert silent waits between consecutive `Speech.speak()` calls (`setTimeout`).
- Volume modulation isn't fully exposed on iOS via `expo-speech` — approximate `!` as a slight rate slow-down + pitch rise on the final word of the clause. If user reports it doesn't read as "louder", revisit and prototype with native module.
- Always cancel any in-flight `Speech.speak()` before starting a new run (`Speech.stop()` first) so re-tapping the strip never overlaps audio.
- Respect the user's voice / rate / pitch preferences stored in app state (`state.accessibility.speechRate`, `state.accessibility.speechPitch`). Modifications are applied **on top of** those defaults.

---

## What to do when something is ambiguous

- If a clause has no terminal punctuation (user typed "i am hungry"), treat as a single statement, neutral intonation, no trailing pause.
- If the message is a single word (no spaces, no punctuation), spell-and-speak: each letter as letter-name, then the word itself. Example: typing "APPLE" then tapping the message strip plays `"A"`, `"P"`, `"P"`, `"L"`, `"E"`, then `"Apple."`.
- Multi-word messages without punctuation: speak as one statement, no spell-out.
- Empty message: tapping the strip does nothing (no error sound, no haptic).

---

## File created and maintained by AI assistant. Locked rules from user; update only if user changes the rule.
