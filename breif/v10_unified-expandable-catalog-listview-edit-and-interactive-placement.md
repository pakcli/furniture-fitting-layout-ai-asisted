# Brief v10: Unified Expandable Catalog, Table-Alike ListView-Edit Mode, and Interactive 3D Snapping & Elevation

---

## 1. Executive Summary & Concept Rating

### Concept Rating: 7.5/10 (Raw Idea) ➔ 10/10 (Refined Architecture)

| Dimension | Raw Idea (7.5/10) | Refined 10/10 Specification |
| :--- | :--- | :--- |
| **Catalog Architecture** | Two separate catalog implementations (fullscreen tab vs bottom bar) causing visual desync and duplicate code. | **Single Unified Responsive Catalog**: Seamlessly transitions between docked bottom drawer (3D Studio mode) and full-height workspace (Catalog tab mode) with zero code duplication. |
| **View Modes** | Cluttered/misaligned list layout with disconnected fields. | **Triple View Engine**: (1) Compact 3D Cards, (2) Table-Alike ListView-Edit with inline bounds & mesh dimensions + actions, and (3) Thumbnail + Detail specification view. |
| **Component Hierarchy** | Standalone "Hierarchy" tab felt disconnected from object browsing. | **Integrated Sub-Component Breakdown**: Hierarchy tab is removed from the top bar; component parts (e.g. bed frame, mattress, mirror panel) are directly inspectable and expandable in the detailed view. |
| **3D Object Interaction** | Mouse drag only; rotation and elevation were buried in inspector inputs. | **Tactile Hotkey & Scrollwheel Controls**: Click-interactive placement with `←` / `→` arrow keys for 45° snap rotation and Mouse Wheel for vertical elevation (Z-axis / height off floor for shelves, wall clocks, and mirrors). |

---

## 2. Core Functional Requirements

### A. Navigation & Unified Catalog Shell
1. **Remove Standalone Hierarchy Tab**:
   - The top tab bar contains only **📐 3D Studio & Simulation** and **📦 Catalog**.
   - Part hierarchy (sub-components) is embedded directly as expandable rows in the Catalog detailed view and Inspector.
2. **Bottom Catalog Bar ➔ Fullscreen Catalog Expansion**:
   - In **3D Studio** mode, the Project Catalog lives docked at the bottom of the viewport (height: 220px, collapsible to 40px).
   - Clicking **📦 Catalog** in the top bar or clicking the **⛶ Expand** button in the catalog header expands the catalog smoothly to 100% viewport height.
   - Switching back to **3D Studio** or clicking **🗗 Dock** collapses it back to the bottom drawer.

---

### B. Triple View Mode Engine
The catalog header provides 3 view toggles:

```
[ ⊞ Cards ]  [ ☰ Table Edit ]  [ ▤ Thumbnail + Detail ]
```

1. **Card View (`card`)**:
   - Visual grid of 3D asset cards with category badge, dimensions, and "+ Add" button.
2. **Table-Alike ListView-Edit Mode (`table-edit`)**:
   - Clean tabular layout with strict columns:
     - **Item**: Icon + Name (inline editable)
     - **Category & Priority**: Pill selectors (`Must` / `Prefer` / `Flex`)
     - **Size Bound (cm)**: Width ($W$), Depth ($D$), Height ($H$)
     - **Size Mesh (cm)**: Width ($W$), Depth ($D$), Height ($H$) with a 🔒 Link/Sync button (defaults to Bound = Mesh)
     - **Elevation (cm)**: Height off floor (0 for floor items, >0 for wall shelves, mirrors, clocks)
     - **Actions**:
       - 📋 **Duplicate**: Clones item with incremented name
       - 💾 **Save** / ✖ **Cancel**: For inline editing
       - 🗑 **Delete**: Removes item with safety confirmation
       - 🔽 **Expand Parts**: Toggles the sub-component hierarchy tree directly underneath the row!
3. **Thumbnail + Detail View (`thumbnail-detail`)**:
   - Rich list layout: Large 3D thumbnail preview on the left, full dimensional specs, clearance zones, weight, fragility tags, and parts breakdown on the right.

---

### C. Interactive 3D Manipulation: Keyboard Snap & Elevation Scroll

1. **Keyboard 45° Snap Rotation**:
   - When an object is selected or actively being dragged/placed:
   - Pressing **`ArrowLeft` (`←`)**: Rotates $-45^\circ$ (snapping to nearest $45^\circ$: $0^\circ, 45^\circ, 90^\circ, 135^\circ, 180^\circ, \dots$).
   - Pressing **`ArrowRight` (`→`)**: Rotates $+45^\circ$.
   - Floating HUD toast displays: `↺ Rotated to 90°`.
2. **Scroll Wheel Elevation (Height off Floor)**:
   - When hovering over or selecting an object:
   - **`Wheel` (or `Shift + Wheel` / `Alt + Wheel`)**: Adjusts vertical elevation `elevationCm` in increments of $5\text{cm}$ (clamped between $0$ and `ceilingHeightCm - item.h`).
   - Essential for wall shelves, wall clocks (*jam dinding*), mounted mirrors, upper kitchen cabinets, and pendant lights.
   - 3D rendering elevates the box:
     $$\text{posY} = \left(\text{elevationCm} + \frac{H}{2}\right) \times \text{SCALE}$$
   - Shows a subtle dotted drop-line from the floating object to the floor with an elevation tag.

---

## 3. Data Model Enhancements

```typescript
export interface FurnitureItem {
  id: string
  name: string
  type: 'furniture' | 'obstacle' | 'zone'
  category: string
  icon?: string
  color: string
  priority: 'must' | 'prefer' | 'flex'

  // Dimensions
  assembled: { w: number; d: number; h: number } // Bound dimensions
  meshSize?: { w: number; d: number; h: number }  // Physical mesh dimensions (defaults to assembled)

  // 3D Transforms
  position: { x: number; y: number }
  rotation: number // degrees (0, 45, 90, 180, etc.)
  elevationCm?: number // Height off floor (default: 0)

  // Sub-components hierarchy (integrated from former Hierarchy tab)
  components?: FurnitureComponent[]

  // Placement modes & sequence
  placementMode?: 'static' | 'inserting' | 'packing'
  startPosition?: { x: number; y: number }
  startRotation?: number
  startElevationCm?: number
  endPosition?: { x: number; y: number }
  endRotation?: number
  endElevationCm?: number
}
```

---

## 4. Implementation Steps & Validation

1. **Store & Types Update**: Add `catalogLayout: 'card' | 'table-edit' | 'thumbnail-detail'`, add `elevationCm` and `meshSize` to `FurnitureItem`, add action handlers (`duplicateFurnitureItem`, `updateFurnitureMeshSize`).
2. **Remove Topbar Hierarchy Tab**: Streamline `TABS` in `App.tsx` to just `3D Studio & Simulation` and `Catalog`.
3. **Unified Catalog Component**: Merge `CatalogPanel` and `CatalogView` so the catalog seamlessly expands to fullscreen when active or docks to bottom in 3D studio.
4. **Implement Table-Edit View with Inline Editing & Actions**: Full table with bound dimensions, mesh dimensions, duplicate, save, cancel, delete, and expandable component sub-rows.
5. **Interactive 3D Hotkeys & Wheel Listener in EditorView**:
   - `ArrowLeft` / `ArrowRight` listener for 45° snap rotation.
   - `wheel` listener on canvas for elevation ($Z$-axis elevation in cm).
   - Render elevation in Babylon with vertical drop shadow/line.
6. **Compile & Visual Browser Verification**: Ensure zero TypeScript errors, passing vitest suites, clean UI appearance across all 3 view modes, and responsive keyboard/wheel interaction.
