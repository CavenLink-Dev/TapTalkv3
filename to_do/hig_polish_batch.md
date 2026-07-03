# HIG polish batch — 10 implemented (Apple Human Interface Guidelines)

Grounded in Apple HIG + the project's accessibility rules (Dynamic Type, VoiceOver
traits, 44pt targets, press-state feedback). All typecheck-verified.

1. **Prediction chips meet the 44pt minimum touch target** (were 36pt) — HIG controls.
2. **Prediction chips dim on press** (opacity feedback) — HIG press state.
3. **"Suggestions" gets the VoiceOver header trait** + chips gain an "Adds to your message" hint.
4. **Prediction text honours Dynamic Type with a sane cap** (`maxFontSizeMultiplier`) — scales without breaking the row.
5. **Dock action labels cap Dynamic Type** (`maxFontSizeMultiplier`) so accessibility text sizes don't overflow the fixed 68pt controls.
6. **Add Symbol header buttons dim on press** (Cancel / Search / Add) — HIG feedback.
7. **Add Folder header buttons dim on press** (Cancel / Create) — HIG feedback.
8. **Display settings title gets the VoiceOver header trait.**
9. **Account settings title gets the VoiceOver header trait.**
10. **ColorPickerSheet Cancel / Done dim on press** — HIG feedback on the sheet controls.
