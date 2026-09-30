# v08 — Inspector Transform Triad, Placement Modes, and Playback Lock

> **Status:** PROPOSED — awaiting review before execution  
> **Date:** 2026-09-30  
> **Scope:** Pack & Place — Object Tab Transform Property Triad, Placement Modes (Static, Inserting, Packing), and Playback Safety Lock

---

## 1. Overview & Objectives

In this version, we elevate the **Object Inspector** to match professional 3D layout & animation workflows:
1. **Transform Triad**: In the Object Tab, allow viewing and editing 3 distinct transform states per furniture item:
   - **End Placement** (Default radio selection): The final docked / resting spot in the room.
   - **Start Placement**: Where the object starts its journey (e.g. entrance hallway or starting room location).
   - **Current Transform**: Real-time live coordinates (X, Y, Z, Rotation) as the object moves or is placed.
2. **Placement Modes (`mode`)**:
   - `static`: Start = End = Current (object is already in the room from the start, stationary).
   - `inserting`: Start = Entrance / hallway, End = Picked/dropped location in room.
   - `packing`: Start = In room, End = Entrance / hallway (moving out).
3. **Playback Interaction Lock**:
   - While animation playback is running (`playbackPlaying === true`), user cannot design, drag, move, or add objects to prevent state corruption.
   - Clear visual lock indicator (`🔒 Playing — Editing Locked`).

---

## 2. Inspector Object Tab — UI/UX Wireframe

```
+--------------------------------------------------+
| OBJECT INSPECTOR: ROUND OTTOMAN POUF             |
| 50×50×40 cm · flex                               |
+--------------------------------------------------+
| PLACEMENT MODE                                   |
| [  Static  ]  [• Inserting •]  [  Packing  ]     |
| ℹ Moving from entrance to room target location   |
+--------------------------------------------------+
| TRANSFORM TARGET                                 |
| ( ) Start (Origin)                               |
| (•) End (Target) [Default]                       |
| ( ) Current (Live)                               |
+--------------------------------------------------+
| COORDINATES & ROTATION                           |
| X pos:    [  165  ] cm                           |
| Y pos:    [  135  ] cm                           |
| Rotation: [    0  ] deg                          |
| [ +90° ]  [ -90° ]  [ ↺ Reset Rot ]              |
+--------------------------------------------------+
| QUICK ACTIONS                                    |
| [ ⬇ Copy End → Start ]  [ ⬆ Copy Start → End ]    |
| [ 🎯 Jump Camera to Object ]                     |
+--------------------------------------------------+
| BOUNDING BOX                                     |
| W: 50cm  D: 50cm  H: 40cm                        |
| [ 🗑 Remove Item ]                               |
+--------------------------------------------------+
```

---

## 3. Placement Modes Specification

Every placed furniture item has a `placementMode` property:

| Mode | Start Transform | End Transform | Behavior in Sequence & 3D | Default In |
|---|---|---|---|---|
| **`static`** | Equal to current pos | Equal to current pos | Object is pre-placed inside the room. Does not move during layout entry sequence. | Presets / Existing layout items |
| **`inserting`** | At Entrance Doorway (`hallwayCenterX`, `-corridorLen`) | At Room Target Position (`x`, `y`) | Object enters room from outside hallway and docks at target location. | Newly dragged items from Catalog |
| **`packing`** | Inside room (`x`, `y`) | At Entrance Doorway (`hallwayCenterX`, `-corridorLen`) | Object moves from room out to the hallway (moving-out sequence). | User switch |

### Mode Transition Logic:
- When user switches to **`static`**:
  - `startPosition = endPosition = currentPosition`
  - `startRotation = endRotation = currentRotation`
  - Auto-updates corresponding CSV row (or marks as stationary).
- When user switches to **`inserting`**:
  - `startPosition = { x: hallwayCenterX, y: -corridorLen }`, `startRotation = 0`
  - `endPosition = currentPosition`
  - Updates CSV row: `start_pos_x/y` = hallway, `end_pos_x/y` = room.
- When user switches to **`packing`**:
  - `startPosition = currentPosition`
  - `endPosition = { x: hallwayCenterX, y: -corridorLen }`, `endRotation = 0`
  - Updates CSV row: `start_pos_x/y` = room, `end_pos_x/y` = hallway.

---

## 4. Transform Property Triad (Radio Selector)

Radio selector:
- `○ Start Placement (Origin)`:
  - Edits `startPosition.x`, `startPosition.y`, and `startRotation`.
  - In 3D: shows a subtle ghost preview of the start position when active.
- `◉ End Placement (Target)` *(Default)*:
  - Edits `endPosition.x`, `endPosition.y`, and `endRotation` (also main `furniture.position`).
  - In 3D: main resting position of the furniture.
- `○ Current Transform (Live/Animated)`:
  - Displays real-time XYZ position during animation playback or dragging.
  - Read-only while playback is active; editable when idle to nudge live position.

---

## 5. Playback Safety Lock

When sequence playback is playing (`playbackPlaying === true`):

### 5.1 Disabled / Locked Controls:
1. **3D Viewport**:
   - Mesh clicking / dragging disabled.
   - Canvas drop target disabled.
   - Floating banner top-center: `🔒 Sequence Playing — Editing Locked`.
2. **Catalog Panel**:
   - Asset grid item cards: `draggable={false}`, opacity 0.6, cursor `not-allowed`.
   - `+ Add` button: disabled.
   - Breadcrumb header shows small badge: `🔒 Playback Active`.
3. **Inspector (N-Tab)**:
   - `Object` tab: inputs disabled.
   - `Room` tab: wall/door modifications disabled.
4. **CSV Editor**:
   - Cells read-only while actively playing to avoid race conditions.

### 5.2 Enabled Controls:
- Playback toolbar (Pause, Stop, Scrub, Step).
- Camera Orbit & 2D/3D mode toggling (user can freely view the animation from any angle).
- Tab navigation.

---

## 6. Type Definitions & Store Additions

### 6.1 `src/types/index.ts`:
```ts
export type PlacementMode = 'static' | 'inserting' | 'packing'
export type TransformTarget = 'current' | 'start' | 'end'

export interface FurnitureItem {
  // ... existing fields ...
  placementMode?: PlacementMode
  startPosition?: { x: number; y: number }
  startRotation?: number
  endPosition?: { x: number; y: number }
  endRotation?: number
}
```

### 6.2 `src/store/app-store.ts`:
```ts
// Store additions:
selectedTransformTarget: TransformTarget // default 'end'
setSelectedTransformTarget: (t: TransformTarget) => void
setFurniturePlacementMode: (id: string, mode: PlacementMode) => void
updateFurnitureTransformTarget: (id: string, target: TransformTarget, patch: { x?: number; y?: number; rotation?: number }) => void
```

---

## 7. Implementation Plan

| Step | File | Action | Details |
|---|---|---|---|
| 1 | `src/types/index.ts` | Modify | Add `PlacementMode`, `TransformTarget`, extend `FurnitureItem` |
| 2 | `src/store/app-store.ts` | Modify | Add transform target state, placement mode actions, sync with CSV rows |
| 3 | `src/components/NTabInspector.tsx` | Modify | Rebuild `ObjectTab` with 3-mode switcher, radio buttons, and coordinates |
| 4 | `src/components/EditorView.tsx` | Modify | Enforce playback lock on canvas drag/drop/pick; display playback lock banner |
| 5 | `src/components/catalog/AssetGrid.tsx` | Modify | Disable dragging and `+ Add` buttons when `playbackPlaying` is true |
| 6 | `src/components/catalog/CatalogHeader.tsx` | Modify | Show `🔒 Playing` indicator when playback is active |
| 7 | `src/index.css` | Modify | Add styles for radio pills, mode buttons, and playback lock overlay |

---

## 8. Open Questions & Confirmation

1. **Default Mode on Drag & Drop**:
   - Saat item baru di-drag dari Catalog ke ruangan, apakah default modenya langsung **`inserting`** (bergerak dari pintu masuk ke target) atau **`static`**? *(Rekomendasi: `inserting` jika Auto-CSV aktif, `static` jika tidak).*
2. **Visual Ghost for Start Position**:
   - Saat radio `Start Placement` dipilih di inspektor, apakah ingin ada siluet ghost 3D transparan di posisi awal (pintu/ruangan)?
3. **Lock Banner**:
   - Banner `🔒 Playback Active` cukup pill kecil mengambang di atas canvas atau overlay semi-transparan?

---

*End of v08 Brief — siap untuk konfirmasi sebelum implementasi.*
