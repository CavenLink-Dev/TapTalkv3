# NEXT — Planned Work & Locked Decisions

> **Do NOT implement anything in this file until the user explicitly says so.** This is a holding area for planned work, ideas, and locked decisions. The user will say "go" or "implement X" when ready.

---

## How to use this file

- **Planned:** Work the user has agreed to but hasn't said "go" yet.
- **Ideas:** Things to consider for the future. Not approved.
- **Locked decisions:** Decisions settled in a clarifying round. Do not re-litigate these. The implementation may not have started yet — wait for the user to say go.

---

## Planned

<!-- Add planned work here. Format: -->
<!-- - [Feature name] — Brief description. Status: waiting for go. -->

---

## Ideas

<!-- Add future ideas here. Not approved for implementation. -->

- **iPad support** — Next major device target. Layouts must adapt to larger screens, `supportsTablet: true`, split-view support, board grid scaling. See `APP_OVERVIEW.md`.

---

## Locked decisions

<!-- Add settled decisions here. These cannot be re-litigated. -->

- **Talk screen architecture:** `talk.tsx` is an orchestrator only. Presentational components live in `src/features/board/components/`, state hooks in `src/features/board/talk/`. Do not re-inline.
- **Board tile labels:** One word only. Full phrases go in the `speech` field. See `AGENTS.md` "Board tile labeling (locked)".
- **Design system:** Flat surfaces (zeroed shadows), no decorative borders, tokens from `src/theme/tokens.ts`. See `AGENTS.md` "Design system rules".
- **Speech path:** `useSpeech().speak/stop` + `buildMessageUtterances()` is the only TTS path. Never call `expo-speech` directly.
- **Symbol rendering:** Always via `<MulberrySymbol symbolId=… />`. Never render pictogram images directly.
- **Tab bar hide/show:** Only via `chromeVisibility.ts` (`setTabBarHidden` / `useTabBarHidden`). No parallel mechanisms.
