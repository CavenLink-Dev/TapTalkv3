# Talk Board Control Bar — How It Works

> Temporary reference for the contextual bottom dock on the Talk board.
> Implementation: `app/(tabs)/talk.tsx`

---

## What it is

A **fixed control bar** below the tile grid (not inside the ScrollView). Controls look like AAC symbol buttons but use a neutral fill + primary outline so they read as **actions, not content tiles**.

---

## Sizes (pt)

| Control type | Size | Examples |
|---|---|---|
| **Standard action** | **60 × 60** | `< Back`, Home, Symbol, Folder, Delete, Done, Cancel, Save, Add + (edit mode) |
| **Toggle square** | **44 × 44** | `Add` (toggle on/off), `<` (collapse), `>` (expand) |
| **Gap between controls** | **5** | Equal spacing in every row — all controls in one row |
| **Gap above tab bar** | **16** | `DOCK_BOTTOM_GAP` |
| **Dock top padding** | **8** | `spacing.sm` |

Main board tiles remain **88 × 88**. Control bar buttons are intentionally smaller.

---

## Add toggle

**Add** is a **44 × 44 pt toggle** on home and folder boards.

| Board | Add off | Add on |
|---|---|---|
| **Home** | Single `Add` toggle (44pt, outline) | `< Back`, Symbol, Folder (60pt) + `Add` toggle (44pt, filled — tap to close) |
| **Folder expanded** | `< Back`, Home, `<`, `Add` (44pt off) | Same add row as home (replaces folder nav while open) |
| **Folder collapsed** | `>`, `Add` (44pt off) | Add row (replaces collapsed chevron row while open) |

- Tap **Add** → toggles add flow open
- Tap **Add** again (when filled/active) → closes add flow
- **`< Back`** in add flow also closes add flow
- Edit mode still uses **60pt Add +** (opens add sub-flow; not the 44pt toggle)

When Add is **on**, the toggle uses primary fill (blue) and `accessibilityState.selected`.

---

## Press feedback

Every control reacts on press:

- **Primary** (Add toggle on, Done, Save): fill shifts to `primaryPressed` (#62C1FF)
- **Neutral** (navigation, Symbol, Folder): fill shifts to soft blue; border + label darken to `primaryDark`
- **Muted** (Delete, Cancel): fill shifts to a slightly darker neutral grey

No bounce, shadow, or harsh red. Respects Reduce Motion for dock crossfade only.

---

## Label rules

| Pattern | Used for |
|---|---|
| **`< Back`** | Any “go back / close this flow” action |
| **`Home`** | Jump to home board |
| **`Symbol` / `Folder`** | Add-flow choices (shell only — coming soon) |
| **`<` / `>`** | Collapse / expand folder dock (44pt chevrons) |
| **`Add`** | 44pt toggle — open/close add sub-menu |
| **`Add +`** | Edit mode only — 60pt, opens add sub-menu |
| **`Delete` / `Done` / `Cancel` / `Save`** | Edit mode actions |

Navigation labels tell you **where you go**. Chevrons are icon-only at 44pt.

---

## States (priority order)

Highest priority wins when multiple triggers apply.

| Priority | State | Controls (left → right) |
|---|---|---|
| 1 | Edit dirty | Cancel, Save |
| 2 | Edit clean | Delete? (if tile focused), Add + (60pt), Done |
| 3 | Add flow open (home or folder) | `< Back`, Symbol, Folder, Add (44pt, active) |
| 4 | Home idle | Add (44pt toggle, off) |
| 5 | Folder expanded | `< Back`, Home, `<`, Add (44pt, off) |
| 6 | Folder collapsed | `>`, Add (44pt, off) |

---

## Folder auto-collapse

- Entering a folder → dock starts **expanded** (`< Back`, Home, `<`, Add)
- After **15 seconds** → collapses to `>` + `Add` (both 44pt)
- Tap `>` → expands nav row again + timer restarts
- Tap `<` (44pt) → collapses immediately
- **Add toggle** works in both expanded and collapsed folder states

---

## Edit mode

- **Long-press a tile** → enter edit; that tile becomes Delete target
- **Move / resize / delete** → dirty → Cancel + Save replace other controls
- **Tap outside** while dirty → no-op (never silently discards)
- **Cancel** → restores layout snapshot from edit entry
- **Save** → keeps in-memory layout, exits edit

---

## Add flow (shell)

- **Symbol** / **Folder** → calm `Alert.alert` (“coming soon”)
- **`< Back`** or **Add toggle (active)** → closes add sub-menu
- No tile creation or persistence in this pass

---

## Layout alignment

- Dock sits in `boardArea`, sibling below ScrollView
- Left padding matches the tile grid (`TILE_LEFT_PADDING` + safe area + centering offset)
- Grid height subtracts dock row (60pt row + padding) so tiles never scroll under the bar

---

## Pasteable update summary

```
Talk Board control bar update:
- 60pt standard controls; 44pt toggle squares (Add, <, >)
- Add is a 44pt toggle on home + folder boards (tap to open/close)
- Home idle: Add (44pt) | Add on: < Back, Symbol, Folder, Add (active)
- Folder: nav row includes Add toggle; collapsed: > + Add
- 5pt equal gaps; one row; press colour feedback
- See to_do/board_control_bar.md for full state matrix
```
