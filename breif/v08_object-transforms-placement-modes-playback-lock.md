# v08 — Inspector Transform Triad, Placement Modes, Sequence Reordering, and Playback Safety Lock (10/10 Specification)

> **Status:** APPROVED & FINALIZED  
> **Date:** 2026-09-30  
> **Scope:** Pack & Place — Object Inspector Transform Triad, Placement Modes (Static, Inserting, Packing), CSV Sequence Drag/Context Reordering, and Playback Safety Lock

---

## 1. Executive Summary & Core Objectives

This version upgrades the layout and animation pipeline into a professional 3D suite:
1. **Transform Property Triad**:
   - Inspector displays and allows editing 3 distinct transform states per furniture item:
     - `◉ End Placement (Target)` *(Default)*: Where the item docks / rests in the room.
     - `○ Start Placement (Origin)`: Where the item begins its trajectory (doorway entrance or initial location).
     - `○ Current Transform (Live/Animated)`: Real-time XYZ coordinates during simulation playback.
2. **Placement Modes (`mode`)**:
   - `static`: Start = End = Current (object is already in the room, stationary).
   - `inserting`: Start = Entrance / hallway, End = Picked/dropped location in room.
   - `packing`: Start = In room, End = Entrance / hallway (moving out / egress).
3. **Dual 3D Ghost & Motion Trajectory Vector**:
   - Viewport 3D displays a cyan ghost for Start (`[S]`) and green outline for End (`[E]`), linked by a dashed floor vector line.
4. **1-Click Smart Action Buttons**:
   - `🚪 Snap to Entrance`: Instantly aligns Start (or End) to the doorway center.
   - `📍 Set Current as Target`: Locks current placement into target.
   - `⇄ Invert Motion (Reverse)`: Flips direction in 1 click (`inserting` ↔ `packing`).
5. **Local Mini Scrub Slider**:
   - 0% → 100% slider per object to preview individual trajectory without playing the entire room.
6. **Sequence Reordering / Resorting via CSV**:
   - Reorder rows via drag & drop grab handle.
   - Move up/down with arrow buttons (▲ / ▼).
   - Context menu (Right-click / Long press on row):
     - `Set as Start (Move to Step 1)`
     - `Set as Latest (Move to End / Last Step)`
     - `Move to Step...`
   - Auto-re-indexes `step_id` (1..N) and instantly updates 3D playback order.
7. **Playback Safety Lock with `[⏸ Pause to Edit]`**:
   - Prevents design modification while animation is playing, with an instant 1-click pause button to resume editing safely.

---

## 2. Inspector Object Tab — UI Wireframe

```
+-------------------------------------------------------------+
| OBJECT: ROUND OTTOMAN POUF                                  |
| 50×50×40 cm · flex                                          |
+-------------------------------------------------------------+
| PLACEMENT MODE                                              |
| [  Static  ]   [• Inserting •]   [  Packing  ]              |
| ℹ Trajectory: Entrance Hallway ➔ Room Dock Target          |
+-------------------------------------------------------------+
| TRANSFORM TARGET                                            |
| ( ) Start (Origin)   (•) End (Target) [Default]   ( ) Current|
+-------------------------------------------------------------+
| COORDINATES & ROTATION                                      |
| X pos:    [  165  ] cm                                      |
| Y pos:    [  135  ] cm                                      |
| Rotation: [    0  ] deg                                     |
| [ +90° ]  [ -90° ]  [ ↺ Reset Rot ]                         |
+-------------------------------------------------------------+
| LOCAL MOTION PREVIEW (0% → 100%)                            |
| [S] ──────●────────────────────── [E]  (45%)                |
+-------------------------------------------------------------+
| 1-CLICK SMART SHORTCUTS                                     |
| [ 🚪 Snap to Entrance ]  [ 📍 Lock Current as Target ]      |
| [ ⇄ Invert Motion ]      [ 🎯 Jump Camera to Item ]         |
+-------------------------------------------------------------+
| BOUNDING BOX & ACTIONS                                      |
| W: 50cm  D: 50cm  H: 40cm                                   |
| [ 🗑 Remove Item ]                                          |
+-------------------------------------------------------------+
```

---

## 3. Placement Modes Specification

Every furniture item has a defined `placementMode`:

| Mode | Start Transform | End Transform | 3D Behavior | CSV Row Sync |
|---|---|---|---|---|
| **`static`** | Equal to current pos | Equal to current pos | Object already in room. Stationary throughout sequence. | Stationary / reference step |
| **`inserting`** | Hallway entrance (`hallwayCenterX`, `-corridorLen`) | Room target dock (`x`, `y`) | Object moves from hallway door into its final room spot. | `start`=door, `end`=target |
| **`packing`** | Inside room (`x`, `y`) | Hallway entrance (`hallwayCenterX`, `-corridorLen`) | Object moves from room out to the hallway. | `start`=room, `end`=door |

### Mode Transition Rules:
- **Switch to `static`**:
  - `startPosition = endPosition = currentPosition`
  - `startRotation = endRotation = currentRotation`
  - Motion vector line disappears.
- **Switch to `inserting`**:
  - `startPosition = { x: hallwayCenterX, y: -corridorLen }`, `startRotation = 0`
  - `endPosition = currentPosition`
  - Motion vector points from entrance to target.
- **Switch to `packing`**:
  - `startPosition = currentPosition`
  - `endPosition = { x: hallwayCenterX, y: -corridorLen }`, `endRotation = 0`
  - Motion vector points from room to entrance.
- **1-Click Invert Motion (`⇄ Invert Motion`)**:
  - Swaps `startPosition` ↔ `endPosition` and `startRotation` ↔ `endRotation`.
  - Automatically toggles between `inserting` and `packing`.

---

## 4. Dual 3D Ghost & Motion Trajectory Vector

When an object is selected and in `inserting` or `packing` mode:
1. **Start Ghost (`[S]`)**:
   - Holographic box rendered at `startPosition`.
   - Material: Cyan (`#06b6d4`), alpha `0.35`.
   - Small floating tag: `[S] Start`.
2. **End Ghost (`[E]`)**:
   - Outline / bounding box at `endPosition`.
   - Material: Green (`#10b981`), alpha `0.35`.
   - Small floating tag: `[E] End`.
3. **Motion Vector Path**:
   - Dashed floor line from `(startPosition.x, startPosition.y)` to `(endPosition.x, endPosition.y)`.
   - Arrowhead indicating direction of motion.

---

## 5. Sequence Reordering & Re-sorting via CSV

### 5.1 Reordering Methods:
1. **Drag & Drop Table Rows**:
   - Grip icon `⋮⋮` on the left of each row.
   - User drags row up or down.
   - Drop indicator line shows new target index.
2. **Step Arrows**:
   - `▲` Move Up: Swaps with preceding row.
   - `▼` Move Down: Swaps with succeeding row.
3. **Right-Click Context Menu / Long Press**:
   - Right-click anywhere on a row opens a sleek context menu:
     - `⬆ Set as Start (Move to Step 1)`: Jumps row to index 0.
     - `⬇ Set as Latest (Move to End)`: Jumps row to the last index.
     - `🔢 Move to Step...`: Quick prompt/selector to set specific step index.
     - `➕ Insert Step Below`
     - `🗑 Delete Step`

### 5.2 Dynamic Re-indexing & 3D Sync:
- When rows are reordered:
  - `step_id` automatically re-indexes sequentially: `1, 2, 3, ... N`.
  - The 3D animation simulation order updates immediately to execute steps in the new order.
  - The step pills in the Sequence Tab update their order re-actively.

---

## 6. Playback Safety Lock with `[⏸ Pause to Edit]`

When playback is active (`playbackPlaying === true`):

### 6.1 Locked Elements:
- **3D Canvas**: Object picking, dragging, and dropping are disabled.
- **Catalog Panel**: Asset cards cannot be dragged (`draggable={false}`, opacity 0.6).
- **Inspector Tab**: Input fields disabled with subtle lock overlay.
- **CSV Editor**: Editing inputs disabled during live playback.

### 6.2 Graceful Feedback HUD:
- Floating pill at top center of canvas:
  ```
  🔒 Sequence Playing — [⏸ Pause to Edit]
  ```
- Clicking **`[⏸ Pause to Edit]`** immediately pauses simulation at the current frame and unlocks all tools for instant editing.

---

## 7. Data Models & Store Architecture

### 7.1 `src/types/index.ts`:
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

### 7.2 `src/store/app-store.ts`:
```ts
// Store additions:
selectedTransformTarget: TransformTarget // default 'end'
setSelectedTransformTarget: (t: TransformTarget) => void
setFurniturePlacementMode: (id: string, mode: PlacementMode) => void
updateFurnitureTransformTarget: (id: string, target: TransformTarget, patch: { x?: number; y?: number; rotation?: number }) => void
snapFurnitureToEntrance: (id: string, target: 'start' | 'end') => void
invertFurnitureMotion: (id: string) => void
reorderSequenceRows: (fromIndex: number, toIndex: number) => void
moveSequenceRowToExtreme: (stepId: number, position: 'start' | 'latest') => void
```

---

## 8. Implementation Plan

| Step | Component | Action | Description |
|---|---|---|---|
| 1 | `src/types/index.ts` | Modify | Add `PlacementMode`, `TransformTarget`, extend `FurnitureItem` |
| 2 | `src/store/app-store.ts` | Modify | Add transform target, mode actions, row reordering, CSV sync |
| 3 | `src/components/NTabInspector.tsx` | Modify | Implement 3-mode tabs, radio transform selectors, 1-click shortcuts, and local scrub slider |
| 4 | `src/components/SequenceCSVEditor.tsx` | Modify | Add row drag-and-drop, right-click context menu (`Set as Start`, `Set as Latest`, `Move to Step`) |
| 5 | `src/components/EditorView.tsx` | Modify | Dual 3D ghost visualization (Start cyan, End green, dashed vector), playback lock + `[⏸ Pause to Edit]` |
| 6 | `src/components/catalog/AssetGrid.tsx` | Modify | Disable dragging/adding when `playbackPlaying` is true |
| 7 | `src/index.css` | Modify | Styling for radio pills, context menu, and floating lock HUD |

---

*End of v08 10/10 Brief.*
