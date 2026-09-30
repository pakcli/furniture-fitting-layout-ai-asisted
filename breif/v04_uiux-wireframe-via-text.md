# v04 · UI/UX Wireframe via Text
## Pack & Place — Furniture Fitting & Moving Planner

> **Date:** 2026-09-30
> **Depends on:** v02 (architecture), v03 (tech stack)
> **Purpose:** Text wireframe for all screens and interaction states

---

## App-Level Shell

```
+================================================================+
|  [☰ MENU]   Pack & Place        [🌙 Dark ▾]   [? Help]       |
+================================================================+
|  [CATALOG]  |  [3D EDITOR]  |  [HIERARCHY]  |  [SIMULATION]  |
+================================================================+
|                                                                |
|                   ← active tab content →                      |
|                                                                |
+================================================================+
|  STATUS BAR: Room: Living Room 24m²  |  Items: 6  |  FEASIBLE |
+================================================================+
```

**Top bar:**
- Left: hamburger (settings / project open/save)
- Center: app name + active project name
- Right: **Theme toggle** (see §6) + Help

**Tab row:** 4 top-level views — Catalog, 3D Editor, Hierarchy, Simulation

---

## SCREEN 1 — Catalog View

### 1.1 Mode Bar (always visible at top of catalog)

```
+------------------------------------------------------------------+
| [VIEW ONLY]  [LIVE EDITOR]  [EDITOR + APPLY]   🔍 Search...    |
| View: [☰ List/Detail]  [⊞ Card]               [⊟ Hide Sidebar] |
+------------------------------------------------------------------+
```

Three **edit modes:**

| Mode | Behaviour |
|---|---|
| **View Only** | Read-only. No inputs active. Safe for clients / presentation. |
| **Live Editor** | Every field edit instantly updates the 3D scene. No save step. |
| **Editor + Apply** | Edit freely → changes are staged (yellow dot on item) → press **[Apply to Scene]** button to push to 3D. Prevents mid-edit flicker. |

Two **view layouts** (toggle icons, top right of catalog panel):

---

### 1.2 Layout A — Detail / List View

```
+------------------------------------------------------------------+
|  + Add Item   Import CSV                                         |
+------------------------------------------------------------------+
| ▼ Wardrobe 2-door                            [●MUST] [Edit] [⋮] |
|   P 100 cm  L 55 cm  T 200 cm               Status: ✅ Feasible  |
|   Clearance front: 60 cm   Can tilt: Yes                        |
|   [▶ Components ▾]  2 components                                 |
|     ├ Body      100×53×200  fragile:no  detach:no               |
|     └ Glass door ×2  48×2×195  fragile:yes  detach:yes  ⚠️ risk  |
+------------------------------------------------------------------+
| ▶ Queen Mattress                             [●MUST] [Edit] [⋮] |
| ▶ Work Desk                               [○PREFER] [Edit] [⋮] |
| ▶ Bookshelf                                [◌FLEX] [Edit] [⋮] |
+------------------------------------------------------------------+
```

- Priority badge: `●MUST` (red) / `○PREFER` (yellow) / `◌FLEX` (gray)
- Expand `▶` to inline-edit all fields
- `[⋮]` menu: Duplicate / Delete / Lock rotation / Set color

---

### 1.3 Layout B — Card / Image View

```
+------+  +------+  +------+  +------+
|  3D  |  |  3D  |  |  3D  |  |  3D  |
| drag |  | drag |  | drag |  | drag |
|  ↕   |  |  ↕   |  |  ↕   |  |  ↕   |
+------+  +------+  +------+  +------+
|Wardr.|  |Mattre|  | Desk |  |Shelf |
|100×55|  |200×16|  |120×60|  | 80×30|
| MUST |  | MUST |  |PREFER|  | FLEX |
+------+  +------+  +------+  +------+
```

- Each card shows a **3D thumbnail** (Babylon.js NullEngine snapshot or CSS 3D box)
- The 3D model on the card is **drag-and-droppable** — drag a different model file (`.glb`, `.obj`) onto the card to **replace** the visual while keeping dimensions locked
- Drop zone highlights with dashed cyan border on hover
- Click card → opens sidebar (§1.4)

---

### 1.4 Sidebar — Full Preview & Spec (optional toggle)

Toggle button: **[⊟ Hide Sidebar]** / **[⊞ Show Sidebar]** — collapses right panel.

```
+--CATALOG LIST/CARDS--+-----SIDEBAR (optional)----------+
|                      | [×]                             |
|   (list or cards)    | +---------+                     |
|                      | |  3D     |  ← spin/zoom        |
|                      | | preview |  ← drag .glb here   |
|                      | +---------+                     |
|                      | Name:   Wardrobe 2-door          |
|                      | W: [100] D: [55]  H: [200] cm   |
|                      | Priority: [MUST ▾]              |
|                      | Can tilt: [Yes ▾]               |
|                      | Clear. front: [60] cm           |
|                      |                                  |
|                      | — Components —                   |
|                      | Body: 100×53×200  detach:no      |
|                      | Glass door ×2  fragile ⚠️        |
|                      |   max tilt: [15°]  padding:[3cm] |
|                      |                                  |
|                      | [Apply to Scene]  (EDITOR mode)  |
+----------------------+----------------------------------+
```

- Sidebar shows: spinning 3D preview + all editable spec fields
- In **View Only** mode all fields are `<span>` text — no inputs rendered
- In **Live Editor** mode the `[Apply to Scene]` button is hidden (changes are instant)
- In **Editor + Apply** mode the button is orange with a pending-changes count badge: `[Apply to Scene (3 changes)]`
- **Drag-and-drop 3D model:** drop zone is the 3D preview box — accepts `.glb` / `.obj`. Replaces the visual asset only, dimensions unchanged until user manually edits them.

---

## SCREEN 2 — 3D Editor

### 2.1 Full Layout

```
+==============================================================+
|  [CATALOG] |  [3D EDITOR ●] |  [HIERARCHY]  |  [SIMULATION] |
+==============================================================+
| LEFT PANEL (240px)   | CENTER CANVAS          | RIGHT PANEL  |
|                      |                        | (280px)      |
| — Room Controls —    |                        | — Verdict —  |
| [Draw Room]          |   ISOMETRIC            | FEASIBLE ✅  |
| [Add Door]           |   3D CANVAS            |              |
| [Add Corridor]       |                        | Issues:      |
|                      |   (Babylon.js)         |  none        |
| — Furniture —        |                        |              |
| [+ Add from Catalog] |                        | Entry order: |
| [Import from List]   |                        | 1. Wardrobe  |
|                      |   [Fit to View]        | 2. Mattress  |
| — Selection Info —   |   [Top View]           | 3. Desk      |
| (when item selected) |   [Reset Camera]       |              |
|  Name: Wardrobe      |                        | [Lock Plan]  |
|  Pos: x82  y34       |                        | [Export PDF] |
|  Rot: 0°             |                        | [Export JSON]|
|  [Rotate 90°]        |                        |              |
|  [Flip]              |                        |              |
|  [Remove]            |                        |              |
|                      |                        |              |
| — Display —          |                        |              |
| (see §5 below)       |                        |              |
+----------------------+------------------------+--------------+
| STEP SLIDER: ◀ [Step 1: Wardrobe] ──●──── [Step 3: Desk] ▶  |
+==============================================================+
```

### 2.2 Left Panel — Sections

**Room Controls:**
```
[Draw Room ▸]          — polygon editor mode
  Walls: click corners, type lengths
  [Add Door]  w:[80]cm  h:[200]cm
  [Add Window]
  [Add Corridor]  w:[85]cm  [Add Turn 90°]
  Ceiling H: [240] cm
  Walkway min: [60] cm
```

**Selection Info (appears when item is clicked in canvas):**
```
Selected: Wardrobe 2-door
  x: [82] cm   y: [34] cm
  Rotation: [0°]  [+90°] [-90°] [Flip]
  [Jump to in Catalog]
  [Remove from Scene]
  Collision: ✅ Clear
  Clearance: ⚠️ Front 12cm (need 60cm)
```

**Display Settings (§5):**
```
[▼ Display Settings]
  Bounding box:  [✓ Show]  Color: [■ #ffffff ▾]
  Material:  ( ) Matte  ( ) Texture  (●) Fallback color
  Fallback color:  [■ #d0d0d0]
```

### 2.3 Canvas Controls (floating, bottom-right of canvas)

```
  [⊞ Fit to View]
  [⬛ Top View]
  [↺ Reset Camera]
  [+ Zoom] [- Zoom]
  [↗ Fullscreen]
```

---

## SCREEN 3 — Hierarchy (Item Tree per Room)

```
+==============================================================+
|  [CATALOG] |  [3D EDITOR]  |  [HIERARCHY ●] |  [SIMULATION] |
+==============================================================+
| [+ Add Room]   [Expand All]  [Collapse All]   🔍 Filter...   |
+==============================================================+
|                                                              |
| ▼ 🏠 Living Room  24m²                        [Edit] [+Add] |
|   ├ ✅ Wardrobe 2-door   100×55×200   MUST   [●] [⋮]        |
|   │     └ 📦 Glass door ×2  fragile ⚠️                      |
|   ├ ✅ Queen Mattress    200×160×40   MUST   [●] [⋮]        |
|   ├ ⚠️ Work Desk        120×60×75   PREFER   [●] [⋮]        |
|   └ ◌  Bookshelf         80×30×180   FLEX    [●] [⋮]        |
|                                                              |
| ▶ 🛏 Bedroom 2  12m²                          [Edit] [+Add] |
|                                                              |
| ▶ 🚪 Corridor  0.85m wide                     [Edit]        |
|                                                              |
+--------------------------------------------------------------+
| LEGEND:  ✅ Feasible  ⚠️ Clearance issue  ❌ Collision  ◌ N/A|
+==============================================================+
```

**Per-item row actions `[⋮]`:**
- Move to another room
- Duplicate
- Set priority
- Go to in Catalog
- Go to in 3D Editor (camera snaps to item)
- Delete

**`[●]` visibility toggle:** hide/show item in 3D canvas (eye icon, grayed when hidden).

**Component sub-rows** (expand with `▶`):
- Show component name, dimensions, fragile flag, detach status
- Fragile components get `⚠️` icon + cyan row tint

---

## SCREEN 4 — Simulation (Scrubbable Timeline)

```
+==============================================================+
|  [CATALOG] |  [3D EDITOR]  |  [HIERARCHY]  |  [SIMULATION ●]|
+==============================================================+
|                                                              |
|              ISOMETRIC CANVAS (playback mode)               |
|              — items animate along A* paths —               |
|              — stall point = item flashes red, pauses —     |
|                                                              |
+==============================================================+
| [◀◀ Start] [◀ Prev] [▶ Play] [▶ Next] [▶▶ End]   1× [▾ 2×] |
+--------------------------------------------------------------+
| TIMELINE SCRUBBER:                                           |
|  0%────────────────────────────●───────────────100%         |
|  |        |        |           |        |        |          |
|  S1       S2       S3          S4       S5       S6         |
| Wardr.   Mattre.  Desk 🔴     Shelf   Assy1    Assy2        |
+--------------------------------------------------------------+
| STEP DETAIL (current step highlighted):                      |
|  Step 3 / 6 — Work Desk                                     |
|  Action: Enter from door → rotate 90° at corridor turn      |
|  Status: 🔴 STALL — Desk too wide at turn (need 4cm more)   |
|  Suggestion: Rotate desk 180° before entry                  |
|                                                              |
|  Transport mode: [Whole ▾]  ← toggle: Whole/Doors-off/Flat  |
|                                                              |
| [◀ Back to Editor]                    [Export Plan as PDF]  |
+==============================================================+
```

**Timeline scrubber details:**
- Each step = one furniture item (or one assembly action)
- Click any step marker to jump to that moment
- Drag scrubber handle for free scrub
- Step markers are color-coded:
  - Green dot = passed (feasible)
  - Red dot = stall / infeasible step
  - Orange dot = clearance warning
  - Gray dot = assembly action (flat-pack)
- Playback speeds: 0.5× / 1× / 2× / 4×

**Step Detail panel** (below scrubber):
- Shows current item name, action description
- If stall: red badge + specific reason + auto-suggestion
- Transport mode toggle per step (affects this step's A* result)

---

## SCREEN 5 — Display Settings (Global)

Lives in: **Left panel of 3D Editor** as a collapsible section, AND in **Settings menu** (hamburger).

```
╔══════════════════════════════╗
║  DISPLAY SETTINGS            ║
╠══════════════════════════════╣
║                              ║
║  Bounding Box                ║
║  [✓] Show bounding box       ║
║  Color: [■ ▾]  #FFFFFF       ║
║  Opacity: [━━━●━━] 80%       ║
║                              ║
║  Clearance Zone              ║
║  [✓] Show clearance zone     ║
║  Color: [■ ▾]  #FFFF00       ║
║  Style: (●) Dashed  ( ) Solid║
║                              ║
║  Material Mode               ║
║  ( ) Matte                   ║
║  ( ) Texture (if available)  ║
║  (●) Fallback color          ║
║       Color: [■ ▾] #D0D0D0   ║
║                              ║
║  Fragile Face Highlight      ║
║  [✓] Show fragile faces      ║
║  Color: [■ ▾]  #06B6D4 cyan  ║
║                              ║
║  Collision Highlight         ║
║  Color: [■ ▾]  #EF4444 red   ║
║  Fragile collision: [■]orange║
║                              ║
║  Floor Shadow / Footprint    ║
║  [✓] Show floor shadow       ║
║                              ║
╚══════════════════════════════╝
```

**Material Mode:**

| Mode | Behaviour |
|---|---|
| **Matte** | Flat diffuse color per item (auto-assigned pastel, user can override). No texture. Fastest. |
| **Texture** | Use `.glb` material if available; falls back to Fallback color if none. |
| **Fallback color** | Ignore all textures. All items render in the same user-chosen color (default `#D0D0D0` light gray). Good for neutral presentation. |

---

## SCREEN 6 — Theme Toggle

### 6.1 Toggle Widget (top-right of app shell)

```
[🌙 Dark ▾]
  ├ 🌙 Dark       ← default
  ├ ☀️  Light
  └ 🍦 Cream-Light
```

### 6.2 Three Themes Defined

| Token | Dark | Light | Cream-Light |
|---|---|---|---|
| `--bg` | `#0f1117` | `#f5f5f5` | `#fdf6e3` |
| `--surface` | `#1a1d27` | `#ffffff` | `#fef9ed` |
| `--border` | `#2a2d3a` | `#e0e0e0` | `#e8dfc4` |
| `--text-primary` | `#f0f0f0` | `#111111` | `#3a2e1e` |
| `--text-secondary` | `#8890a0` | `#555555` | `#7a6a50` |
| `--accent-green` | `#22c55e` | `#16a34a` | `#4a7c59` |
| `--accent-red` | `#ef4444` | `#dc2626` | `#b84040` |
| `--accent-yellow` | `#eab308` | `#ca8a04` | `#c49a2a` |
| `--canvas-bg` | `#141720` | `#e8e8e8` | `#f0e8d0` |

**Cream-Light** rationale: warm off-white, good for print-preview of the locked plan and for users who find pure white harsh. Soft sepia feel.

**Babylon.js canvas background** follows `--canvas-bg` — set via `scene.clearColor`.

---

## Interaction Patterns & Edge Cases

### Catalog → 3D Editor hand-off
- Dragging an item from Catalog card view into the 3D canvas places it at door-entry point
- Snap-on-drop: nearest valid non-collision position
- Item immediately shows red if it collides at drop point

### Editor + Apply staged edits
- Changed fields get yellow underline + pending dot on item card
- `[Apply to Scene]` runs: validate → update mesh → re-run solver → update verdict
- If solver result changes, right panel verdict updates with diff highlight ("was FEASIBLE, now ⚠️ COMPROMISE")

### Sidebar 3D model replace (drag & drop)
- Accepted: `.glb`, `.obj`, `.babylon`
- On drop: parse mesh, extract center bounding box, show confirmation dialog:
  ```
  ┌────────────────────────────┐
  │ Replace 3D model?          │
  │ Detected size: 98×52×198cm │
  │ Current spec:  100×55×200cm│
  │ [Keep current dims] [Use detected dims] [Cancel] │
  └────────────────────────────┘
  ```
- Dimensions in solver never change without explicit confirmation

### Hierarchy item visibility toggle
- Hidden items are excluded from collision checks (useful for "what if I remove this?")
- Hidden items still appear in entry order list but grayed out
- Toggle persists only for current session (not saved to plan)

### Simulation stall behavior
- On stall: playback auto-pauses, item mesh pulses red in canvas, camera zooms to stall point
- Step Detail shows: distance short, suggested fix
- User can switch transport mode dropdown and press **[Re-run this step]** — only re-runs A* for that item, does not rebuild full plan

---

## Component / View Dependency Map

```
AppStore (Zustand)
  │
  ├── CatalogView
  │     ├── DetailList
  │     ├── CardGrid
  │     └── Sidebar
  │           └── 3D Preview (mini Babylon scene or CSS box)
  │
  ├── EditorView
  │     ├── LeftPanel (Room controls, Selection info, Display settings)
  │     ├── Canvas3D (Babylon.js full scene)
  │     └── RightPanel (Verdict, Entry order, Lock/Export)
  │
  ├── HierarchyView
  │     └── RoomTree → ItemRow → ComponentRow
  │
  └── SimulationView
        ├── Canvas3D (same scene, playback mode)
        ├── TimelineScrubber
        └── StepDetailPanel
```

**Canvas3D** is the same Babylon.js scene instance, mounted once and shared across EditorView and SimulationView — tab switch shows/hides the same canvas DOM node (no re-init).

---

## Open UI Questions

| # | Question | Options |
|---|---|---|
| 1 | Catalog sidebar: slide-over or split panel? | Slide-over (overlay) keeps catalog list full-width; split panel shows both always |
| 2 | Card grid: how many columns at 1440px? | 3 or 4 — depends on card image quality |
| 3 | 3D model thumbnail in Card view: live Babylon render or static CSS box? | CSS 3D box is instant (no GPU); Babylon snapshot is more accurate but async |
| 4 | Display settings: per-item override or global only? | Global for MVP; per-item color override in Phase 2 |
| 5 | Theme: system auto-detect (prefers-color-scheme)? | Add as 4th option "Auto" |
| 6 | Hierarchy: multi-room support in MVP or single room only? | Affects data model; single room is safer for MVP |
| 7 | Simulation: real-time A* or pre-computed on plan lock? | Pre-compute on [Run Solver] click — real-time too slow for multiple items |
