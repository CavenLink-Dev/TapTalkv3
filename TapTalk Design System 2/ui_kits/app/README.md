# TapTalk — App UI Kit

An interactive, high-fidelity recreation of the TapTalk iOS app, composed from the
design-system primitives. Open `index.html`.

## Flow
1. **Onboarding** — Clo welcomes the user; enter name + display name → Continue.
2. **Talk** — the AAC word board. Tap colour-coded symbols to build a sentence in
   the message strip; 🔊 speaks it (Web Speech API), ⌫ removes the last word, 🗑
   clears. Switch category with the pills. Folders open the Food sub-board.
3. **Today** — week strip, First·Then board, and a checkable task list.
4. **Me** — profile, talk stats, caregiver toggles, and the premium upsell card.

Use the bottom tab bar to move between Talk / Today / Me. "Restart onboarding"
on the Me screen returns to step 1.

## Files
| File | Role |
|------|------|
| `index.html` | Loads React + the DS bundle, mounts the app inside an iPhone frame |
| `AppShell.jsx` | Phone frame, status bar, tab bar, screen routing |
| `OnboardingScreen.jsx` | Name-entry onboarding step |
| `TalkScreen.jsx` | AAC board, message strip, categories |
| `TodayScreen.jsx` | Calendar, First·Then, tasks |
| `MeScreen.jsx` | Profile, stats, settings, premium |

## Components used
`Button`, `TextField`, `Card`, `Pill`, `Switch`, `Checkbox`, `Badge`,
`ProgressBar`, `SymbolCell`, `Mascot`, `SpeechBubble` — all from
`window.TapTalkDesignSystem_5cf136`.

## Notes
- The board uses emoji placeholders for symbols, mirroring the current app state
  (real ARASAAC/Mulberry symbol art is a future step). Sample real symbol PNGs
  live in `assets/aac/card_*.png` and can be passed to `<SymbolCell image=… />`.
- This is a cosmetic recreation — no backend, persistence, or real TTS voices
  beyond the browser's built-in speech synthesis.
