# FABLE 5 / TAPTALK — BOARD + ACCESSIBILITY + PERFORMANCE FIX PASS — FINAL REPORT

Date: 6 July 2026 · Commits: `d62a321f`, `93d4377f`, `0d2efa2f`, `9ddf32ec`
Typecheck: `npx tsc --noEmit` → **PASS** (verified after every commit)
Tests: full `jest-expo` suite could not complete inside the sandbox's 45-second
execution cap (cold-start transform cost). All test-covered files were either
untouched or verified compatible by inspection (`tokens.test` asserts key
presence/colour formats and `layout.touchTarget.min === 44` — all still hold).
Run `npm test` locally to confirm.

---

## What was implemented

### 1. Board sizing system + density (`src/theme/tokens.ts` → `boardSizes`, `talk.tsx`)
One shared constants block now drives all board chrome: 50pt preferred touch
minimum (44 floor), message strip 104→96, top nav 76→64, top tabs 72×57→68×52,
control bar items 68→56, toggle glyph 39→28, action icons 22→20, labels 14→12,
tile clamp 72–132 → 64–112. Icons and text scale with their containers; no
one-off sizing values remain in the dock or top nav.

### 2. Message strip scaling (`TalkMessageStrip.tsx`)
Chip labels and sentence/placeholder text multiply by the user's in-app text
size (`t.textScale`); typography uses the SF Compact font tokens; chip symbols
yield a little room at larger scales so nothing clips; `adjustsFontSizeToFit`
guards the extremes. The nav dropdown handle stays visually compact but its
effective touch area is now 98×54 via hitSlop, and it is actually centred
(`marginLeft: -31`, was -13 — an 18pt off-centre bug).

### 3. Top nav lag + animation (`talk.tsx`)
Root cause of the lag: `RNAnimated.timing` on `height` with `useNativeDriver:
false` re-laid-out the whole board (grid, dock, scroll view) on every frame of
the 220 ms toggle. Replaced with a single native `LayoutAnimation` transition;
`TopNav`/`TopNavTab` are memoised. Tabs got press-in scale 0.94 (native
driver, springs back), a selected-state pill behind the active tab, and the
Ionicon colour is now wired into the running `activeAnim` interpolation via
`createAnimatedComponent` so icon and label tint crossfade together. Reduce
Motion: zero duration, no scale, colour switch only. No shadows/glows added.

### 4. Bottom control bar (`talk.tsx`)
All items share `DOCK_ACTION_SIZE`/icon/label constants; sub-option popovers
now match their parent control's width (min 96 for legibility), rows are ≥50pt,
and the Manage pill sits directly above Quick at Quick's width. The collapsed
bar's peeking toggle now matches the full control-bar item height.

### 5. Edit mode (`talk.tsx`)
Back appears far-left inside folders (navigates up without leaving edit mode);
Select All/Deselect All ("All"/"None") appears while the Select tool is active
with VoiceOver count announcements; hold-then-drag sweep-select toggles tiles
as the finger crosses them (hit-tested against tile footprints, haptic per
toggle, one toggle per tile per sweep, normal scroll untouched — quick swipes
still scroll); Save/Done is state-aware — Save (primary) only when there are
changes, otherwise a calm Cancel; the resize dock's "Done" with no changes is
now "Cancel".

### 6. Quick mode (`talk.tsx`)
Manage now opens with already-tagged symbols PRESELECTED (selection = desired
final Quick set); deselecting a tagged symbol shows the red removal intent;
Done saves the selection as-is. In the Quick view, symbols sort above folders.
Interpretation note (BOARD_QUICK_TAGGED_VISIBILITY): read as "untagged items
leave the Quick section immediately and no Quick chrome persists when the view
is off" — both hold via the derived (never persisted) display layout. If you
meant something stronger (e.g. hiding tagged tiles entirely when Quick is
off), say the word and it's a small change to `displayLayout`.

### 7. Places rename (`talk.tsx`)
Board mode `animals` → `places` (it held places vocabulary); Places folder
targets `places`; `back-animals` → `back-places`; persisted placements and
tile IDs migrate on hydrate so existing users keep their layouts. The
`animals` key is now free for real animal vocabulary.

### 8. Symbol pack expansion (`scripts/buildSymbolPacks.ts`, `src/data/symbolPacks.ts`)
- **Generator bug fixed:** `renderNode` emitted invalid named-argument calls
  (`sym(label: "Yes", …)`) — the script had never produced compilable output.
  Now emits positional args.
- **Name→ID resolver (`pick`)** added: every ID comes from
  `to_do/mulberry_categories.json` by exact-name lookup, so IDs are verified
  by construction; unknown names print `MISSING:` and flag the output.
- **21 new packs added** (all requested areas): Emergency, Quick Answers,
  Drinks, More Feelings, Body & Health, Home & Daily Life, People, School,
  Work, Therapy, Community, Getting Around (transport expanded), Time,
  Conversation, Sensory, Social Life, Privacy & Consent, Hobbies, Pain,
  Toilet & Hygiene, Support Worker — 31 top-level packs total, 1,114 symbol
  entries, 720 unique Mulberry IDs, **all verified present in
  `mulberryAssetMap.generated.ts`**, zero duplicated assets, no user data
  touched.
- Communication functions included throughout (verbs, questions, feelings,
  requests); phrases live in `speech` ("I need help", "please slow down");
  wording mature and calm; Australian usage where relevant (squash/cordial,
  plaster, chemist-free phrasing, accessible toilet).
- **Vocabulary gaps in the Mulberry set** (couldn't be safely sourced, so
  substitutes or omissions were used): please/thank-you/sorry/goodbye, days of
  the week, months, generic "stop"/"pain"/"sick", hospital (building),
  library/cinema/supermarket, "my turn" (used `turn`), "calm/breathe"
  (used `relax`/`serene`). Packs that fell short of 50 symbols because the
  vocabulary simply isn't there: Drinks (~31), Conversation (~33),
  Privacy & Consent (~32), Social Life (~43), Support Worker (~45).
- **Recommended next pack batch:** Animals (54 mammals + 25 birds + fish/
  reptiles/insects — the freed `animals` key), Colours & Shapes (Art Colour 22
  + Descriptive Shape 41), Clothing (70 general + accessories), Weather &
  Nature (Plants and Trees 41 + Environment), Kitchen & Cooking (kitchen
  items 82 + actions 38), Celebrations (43 items + 14 events), Position &
  Quantity core-word packs.

### 9. Dark mode tokens (`tokens.ts`, `08-accessibility.tsx`)
Dark `disabled` `#D5E1E8`→`#4A525A` and `progressTrack` →`#454D55` (calm slate,
~3:1 non-text contrast on `#111112`, no glare); dark folder tokens desaturated
(`#A89B45` / 32 % white flap / `#57532E`) — still clearly "folder", no longer
light-mode bright yellow. Registration `StaticSection` headings ("Theme",
"Symbol Colour Scheme") now use the active theme text colour.

### 10. Activities
- **Memory Match:** the five choices were two circles + two squares + one
  rounded square differing mostly by colour. Now circle / square / diamond /
  triangle / bar — every shape geometrically unique, labels updated, simple
  2D, card + screen surfaces theme-aware.
- **Colour Pop:** honours `accessibility.colorScheme === 'cvd_safe'` with an
  Okabe–Ito palette (red→vermillion, green→bluish-green — no red/green
  conflict pair; pink dropped in CVD mode as it collides with purple);
  surfaces theme-aware.
- **Shape Match:** root/header surfaces theme-aware.
- **Visual Timer:** numerals use `fonts.bodyHeavy`/`displayHeavy`; the raw
  `'Courier New'` / `'monospace'` / `'sans-serif-medium'` literals are gone;
  tabular-nums keeps the digital feel.

### 11. Settings row icon logic — **already correct, no change needed**
`SettingsRow` already implements exactly the requested iOS pattern
(navigation/toggle/expandable/static/action with correct accessories and
accessibility roles/states), Profile uses it correctly (App Version is
`static`, toggles are real switches, legal pages are `navigation`), and
`assets/symbol/toggle_off_chevron.svg` is referenced **nowhere** in code — the
described bug does not exist in the current codebase. Reported rather than
forced.

### 12. Legal / contact / version
Consent links open the in-app Terms and Privacy screens (offline-safe;
stand-in `taptalk.app/*` URLs removed). New shared `SupportEmailLink`
(mailto, `accessibilityRole="link"`, underline affordance) used across Privacy
Policy, Terms of Use, and Data Choices — this also fixes the JSX
whitespace-collapse bug that rendered "contacthello@taptalk.app" with no
space. App Version reads `Constants.expoConfig.version` with an "Unknown"
fallback.

### 13. Guardian override + roles
The `?? 'CONCEPT_HELLO'` fallback is gone — a missing concept ID shows a calm
error state with a Back button instead of silently editing Hello. The role
model fix was safe and contained (no consent logic branches on the app-level
user role): a distinct `therapist` role now exists, "Therapist" saves as
`therapist`, and `guardian` displays as "Guardian" (it previously displayed
as "Therapist"). Registration's guardian path is unchanged — it correctly
covers legal guardians/authorised decision-makers.

---

## Out of scope — found but not implemented (per instructions)
- Registration step 6 "verification" has no real SMS/email backend — future task.
- No duplicate-email server check exists — future task (needs Supabase work).
- Full TTS voice selector, Focus Mode, full-screen mode — untouched as ordered.
- Symbol packs use `speech` phrases; if the Add Symbol flow ever drops the
  `speech` field, phrase-tiles would speak their label only — worth a check
  when Free Mode lands.

## Risks / notes for review
- The sweep-select gesture uses `activateAfterLongPress(220)` — if QA finds it
  fights scrolling on older devices, bump to 280 to match tile drag.
- Quick Manage semantics changed from "pending toggles" to "desired final
  set" — Done now *replaces* the tag set with the selection. This is what the
  spec asked for, but it's a behaviour change worth a manual pass.
- Board tiles floor lowered to 64pt; on very small screens tiles are denser.
  Symbols remain ≥64pt (above the 50pt minimum).
- `.git` contains a few stale renamed `*.lock.stale.*`/tmp object files — the
  sandbox cannot delete files; remove them locally (`git gc` will also cope).

---

## FINAL REPORT FORMAT §1 — Next 10 implementation passes (in order)

1. **Animals vocabulary board + pack** — populate the freed `animals` board
   key and an Animals symbol pack (79+ verified Mulberry animal symbols),
   wire a Home folder for it.
2. **Persisted custom tiles for moved/grouped boards** — cross-board moves and
   `group_*` boards currently live in memory (`userTilesRef`/`BOARD_TILES`
   mutation) and don't fully survive relaunch; move them into the persisted
   reducer state.
3. **Quick view "filtered-only" mode** — optional toggle that shows *only*
   tagged symbols in Quick view (true filter, not dim), completing the
   BOARD_QUICK_TAGGED_VISIBILITY intent.
4. **Full activity dark-mode sweep** — the remaining light-only chips/pills in
   the three game screens (`#E6F4FD`, `#F1F5F9`, `#FFF4E0` etc.) mapped to
   tokens, plus `ActivityCompletionOverlay`.
5. **Board text-size support** — tile labels, folder labels and dock labels
   currently use fixed sizes; scale them with `t.textScale` the way the
   message strip now does.
6. **Real verification backend** — email/SMS one-time codes via Supabase (the
   registration UI stubs this today), plus duplicate-email check.
7. **TTS voice selector** — the Voice & Speech screen exposes rate/pitch only;
   surface `expo-speech` voices with per-voice preview.
8. **Sweep-select polish** — marquee visual during drag, VoiceOver "custom
   actions" alternative for sweep, and Select All across scrolled-out tiles
   confirmation.
9. **Role-aware caregiver features** — now that `therapist` exists, gate
   guardian-only flows (PIN, consent editing) vs therapist flows (progress
   export) explicitly.
10. **Board virtualisation** — large custom boards render every tile;
    windowing the grid (or FlashList) keeps 60fps as user boards grow past
    ~100 tiles.
