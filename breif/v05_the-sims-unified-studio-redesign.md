# v05: The Sims-Style Unified 3D Studio & Simulation Redesign

## 1. Vision & Executive Summary

Transform **Pack & Place** from a multi-tab tool into an all-in-one, immersive **"The Sims"-inspired Architectural Studio**. 

Instead of switching between disconnected tabs (*Editor*, *Simulation*, *Catalog*, *Hierarchy*), the entire experience is consolidated into a single unified workspace centered around the 3D viewport, featuring:
1. **Vertical Simulation Timeline**: Integrated directly into the right panel alongside the Entry Sequence results.
2. **The Sims-Style Bottom Catalog Dock**: A collapsible bottom furniture shelf featuring category tabs, isometric 3D thumbnails, and quick placement actions.
3. **In-Viewport Hierarchy Floating Popup**: Accessible directly from the floating 3D canvas toolbar, floating cleanly over the scene without taking up permanent screen real estate.
4. **Permanent Full-Screen 3D Studio**: Real-time interactive layout, rotation solver verification, and step-by-step entry simulation with zero visual clutter.

---

## 2. Layout Wireframe (ASCII Diagram)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 📦 PACK & PLACE  |  🏠 [Compact Studio (1.0m Door) ▾]  |  FEASIBLE (All Fit)  |  ☀️ Theme [Dark/Light/Cream]       │
├───────────────────┬──────────────────────────────────────────────────────────────┬───────────────────────────────┤
│ LEFT PANEL        │ CENTER 3D VIEWPORT                                           │ RIGHT PANEL                   │
│ (Room & Inspector)│                                                              │ (Solver & Vertical Timeline)  │
│                   │  ┌────────────────────────────────────────────────────────┐  │                               │
│ • Room Presets    │  │ [🧊 3D Orbit] [📐 2D Top] [↺ Reset] [👻 Ghost] [🌳 Tree]│  │ [▶ Run Entry Solver]          │
│   - Master Bedroom│  └────────────────────────────────────────────────────────┘  │ [↺ Reset Room Preset]         │
│   - Compact Studio│    │                                                         │                               │
│                   │    ▼ (When [🌳 Tree] clicked)                                │ ─── Simulation Controls ──────│
│ • Room Parameters │    ┌───────────────────────────────────────────────┐         │ [⏮] [◀] [ ▶ Play ] [▶] [⏭]   │
│   - Ceiling: 250cm│    │ 🏢 ROOM HIERARCHY OVERLAY (Glassmorphic)      │         │ Step 2 of 5: Studio Bed       │
│   - Walkway: 50cm │    │  ▼ 🏠 Compact Studio (380×320cm)              │         │ Progress: [████████░░░░] 65%  │
│                   │    │    ▶ 🚪 Tall Wardrobe (85×55×195)             │         │ Speed: [──●────] 1.0x         │
│ • Selected Item:  │    │    ▼ 🛏️ Studio Bed (150×90×55)               │         │                               │
│   "Studio Bed"    │    │      • Bed Frame (35kg, upright)              │         │ ─── Entry Sequence (5) ───────│
│   - X: 160cm      │    │      • Mattress (18kg, detachable)            │         │ ┌─ 1. Tall Wardrobe ────────┐ │
│   - Y: 210cm      │    │    ▶ 🪑 Lounge Chair (75×70×80)               │         │ │ Deepest corner | Placed   │ │
│   - Rot: 0°       │    └───────────────────────────────────────────────┘         │ └───────────────────────────┘ │
│   - [+90°] [-90°] │                                                              │               │ (vertical)    │
│                   │                                                              │ ┌─ 2. Studio Bed (Active) ──┐ │
│ • Display Config  │                                                              │ │ 🔄 Rotated 90° for 1m door│ │
│   - Outline: Cyan │                                                              │ │ Docking at (160, 210)     │ │
│   - Material: Mat │                                                              │ └───────────────────────────┘ │
│   - Shadows: ON   │                                                              │               │               │
│                   │                                                              │ ┌─ 3. Bedside Table ────────┐ │
│                   │                                                              │ │ Queued outside hallway    │ │
│                   │                                                              │ └───────────────────────────┘ │
├───────────────────┴──────────────────────────────────────────────────────────────┴───────────────────────────────┤
│ BOTTOM PANEL: THE SIMS-STYLE FURNITURE CATALOG (Collapsible ▲/▼)                                                 │
│  [🏷️ Indoor Furniture] │ [⭐ All (5)] [🛏️ Bedroom (2)] [🚪 Storage (1)] [💼 Desks (1)] [🪑 Seating (1)] │ [+ Add Item]│
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐                                        │ │
│ │  │ [ 3D ]  │   │ [ 3D ]  │   │ [ 3D ]  │   │ [ 3D ]  │   │ [ 3D ]  │   (Horizontal scrolling carousel with   │ │
│ │  │ Wardrobe│   │StudioBed│   │Nightstnd│   │StudyDesk│   │Armchair │    solid Isometric 3D models & badges)  │ │
│ │  │85×55×195│   │150×90×55│   │45×45×50 │   │90×50×75 │   │75×70×80 │                                         │ │
│ │  │ [MUST]  │   │ [MUST]  │   │[PREFER] │   │[PREFER] │   │[PREFER] │                                         │ │
│ │  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘                                        │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Component Breakdown

### Feature 1: Vertical Timeline in the Right Panel (Entry Sequence)
- **Problem**: The horizontal bottom timeline dock consumed vertical screen space, clashed with furniture inspection, and separated the playback controls from the textual entry sequence list.
- **New Architecture**:
  - Move timeline playback controls (`⏮`, `◀`, `▶ Play / ⏸ Pause`, `▶`, `⏭`, Step Counter, Scrubbable Progress Bar) directly to the **top of the Right Panel**.
  - Convert the Entry Sequence list into a **Vertical Stepper Timeline**:
    - Each step is a distinct vertical timeline card linked by an animated vertical connector line.
    - **Step Status Badges**:
      - `Done (Green)`: Furniture already moved and placed into final position.
      - `Active Moving (Cyan / Glowing)`: Currently executing trajectory with real-time motion and rotation.
      - `Queued (Muted)`: Waiting outside in the hallway staging queue.
      - `Stalled / Colliding (Red)`: Clearance issue with suggestion box.
    - **Rotational Highlight**: If an item rotates during transit (e.g. *"Rotates 90° to clear 1.0m door"*), an eye-catching rotation chip (`🔄 Rotated 90° Transit`) is displayed prominently.
    - **Interactive Scrubbing**: Clicking any vertical step card immediately navigates the simulation to that item's entrance step.

---

### Feature 2: In-Viewport Floating Hierarchy Popup
- **Location**: Floating over the top-center of the 3D Babylon viewport, docked directly underneath the canvas controls bar.
- **Toggle Button**: Added `[🌳 Hierarchy]` (or `[🌳 Tree]`) in the floating toolbar (`3D Orbit`, `2D Top Plan`, `Reset`, `Ghost`, `Hierarchy`).
- **Visual Style**: Sleek dark/frosted glassmorphic modal (`backdrop-filter: blur(12px)`), floating non-intrusively over the 3D scene.
- **Contents**:
  - Tree node for Room (dimensions, door size, ceiling height).
  - Expandable tree nodes for each furniture item with status icon (✅ Placed, ⏳ Queued).
  - Child nodes for sub-components (detachable status, fragile faces, weight).
  - Click any furniture node in the hierarchy to highlight/select it in the 3D view.
  - Close button `[✕]` or auto-closes when clicking outside.

---

### Feature 3: The Sims-Style Bottom Furniture Catalog Bar
- **Location**: Docked at the bottom of the viewport, styled like The Sims build/buy item shelf.
- **Top Header Bar**:
  - Left: `🏷️ Indoor Furniture Catalog`
  - Center: Category filter tabs:
    - `⭐ All`
    - `🛏️ Bedroom`
    - `🚪 Storage & Wardrobes`
    - `💼 Desks & Workspaces`
    - `🪑 Seating & Living`
  - Right: `[+ Add Custom Item]`, `[▼ / ▲ Collapse Toggle]`
- **Horizontal Shelf**:
  - Clean horizontal scroll with snap cards.
  - Each item card features:
    - **Solid Isometric 3D Model** (`FurnitureBox3D`) with dynamic lighting, shadows, and architectural details.
    - Item Name & Assembled Dimensions ($W \times D \times H\text{ cm}$).
    - Priority Badge (`MUST`, `PREFER`, `FLEX`).
    - Status Chip (`Placed` vs `Hidden`).
    - Click card to select & focus in 3D / open sidebar spec editor.
- **Collapsible**: One-click toggle (`▼ Hide Catalog`) slides the shelf down to give 100% full height to the 3D canvas when desired.

---

### Feature 4: Consolidated Single-Page Application (Removing Disjointed Tabs)
- Since the 3D Studio now incorporates the **Live 3D Viewport**, **Vertical Timeline & Solver**, **Bottom Sims Catalog**, and **Floating Hierarchy**, separate tabs (*Catalog*, *Hierarchy*, *Simulation*) are no longer required.
- The top navigation bar is simplified:
  - App Logo: `📦 Pack & Place`
  - Room Preset Selector (quick switch between Master Bedroom & Compact Studio)
  - Current Verdict Chip (`FEASIBLE`, `COMPROMISE`, `IMPOSSIBLE`)
  - Theme Switcher (`Dark`, `Light`, `Cream`)
  - Help / Tour button.

---

### Feature 5: AI Animation Prompt Generator & CSV Trajectory Exporter
For each assigned moving object in the Entry Sequence list, add **2 interactive utility buttons**:

```
┌─────────────────────────────────────────────────────────────┐
│ 2. Studio Bed (150×90×55cm)                      ✓ Path OK  │
│ 🔄 Rotated 90° for 1.0m door → docked at (160, 210)         │
│ ┌─────────────────────────┐  ┌───────────────────────────┐  │
│ │ 📋 Copy AI Prompt       │  │ 📊 Copy CSV Trajectory    │  │
│ └─────────────────────────┘  └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### 1. Button 1: `[📋 Copy AI Prompt]`
Generates a complete AI / 3D Animation Prompt containing **2 complementary formats (Natural Language + Embedded CSV Table — ZERO JSON)**:

- **Format 1: Animation Director Prompt (Natural Language)**:
  Clearly instructs an AI model, human 3D animator, or simulation director with all parameters: object name, ID, bounding box dimensions ($W \times D \times H$), starting location & rotation (`startLocRotate`), ending target location & rotation (`endTargetLocRotate`), and trajectory notes.
- **Format 2: Keyframe Motion CSV Table (Embedded for Clarification)**:
  Directly includes the structured CSV trajectory table right inside the prompt so any LLM, parser, or Python script can ingest the exact numerical coordinates without any JSON syntax.

**Sample Generated Prompt Output (Copied to Clipboard)**:
```text
=== 3D ANIMATION PROMPT: OBJECT INSERTION & TRAJECTORY ===
Target Object: "Studio Bed" (ID: cs-bed)
Bounding Box [W x D x H]: 150cm x 90cm x 55cm
Start Location & Rotation (startLocRotate): X=190.0cm, Y=-40.0cm, Z=0.0cm | Rotation=90.0°
End Target Location & Rotation (endTargetLocRotate): X=160.0cm, Y=210.0cm, Z=0.0cm | Rotation=0.0°
Room Environment: 380cm x 320cm compact studio, 100cm narrow doorway at South wall (Y=0).
Transit Action: Object enters through 100cm doorway rotated sideways at 90° (90cm profile fits through 100cm door). Once clearing doorway into open room space, object rotates 90° into 0° orientation and docks at target location without collision.

=== KEYFRAME TRAJECTORY CSV DATA ===
step_index,time_sec,object_id,object_name,x_cm,y_cm,rot_deg,bound_w_cm,bound_d_cm,bound_h_cm,event_phase
1,0.00,cs-bed,Studio Bed,190.0,-40.0,90.0,150,90,55,startLocRotate
1,0.35,cs-bed,Studio Bed,190.0,0.0,90.0,150,90,55,doorway_transit
1,0.70,cs-bed,Studio Bed,190.0,60.0,90.0,150,90,55,room_entry
1,1.10,cs-bed,Studio Bed,190.0,90.0,60.0,150,90,55,in_room_rotation_start
1,1.40,cs-bed,Studio Bed,185.0,130.0,30.0,150,90,55,in_room_rotation_mid
1,1.70,cs-bed,Studio Bed,175.0,170.0,0.0,150,90,55,aligned_to_goal_rotation
1,2.00,cs-bed,Studio Bed,160.0,210.0,0.0,150,90,55,endTargetLocRotate
```

#### 2. Button 2: `[📊 Copy Raw CSV]` (or `[📥 Download CSV]`)
Copies or downloads **only the raw CSV text** directly, ready to paste straight into spreadsheets (Excel, Google Sheets) or feed directly into Blender Python, Unreal Engine, or physics simulators:

```csv
step_index,time_sec,object_id,object_name,x_cm,y_cm,rot_deg,bound_w_cm,bound_d_cm,bound_h_cm,event_phase
1,0.00,cs-bed,Studio Bed,190.0,-40.0,90.0,150,90,55,startLocRotate
1,0.35,cs-bed,Studio Bed,190.0,0.0,90.0,150,90,55,doorway_transit
1,0.70,cs-bed,Studio Bed,190.0,60.0,90.0,150,90,55,room_entry
1,1.10,cs-bed,Studio Bed,190.0,90.0,60.0,150,90,55,in_room_rotation_start
1,1.40,cs-bed,Studio Bed,185.0,130.0,30.0,150,90,55,in_room_rotation_mid
1,1.70,cs-bed,Studio Bed,175.0,170.0,0.0,150,90,55,aligned_to_goal_rotation
1,2.00,cs-bed,Studio Bed,160.0,210.0,0.0,150,90,55,endTargetLocRotate
```

#### 3. Global Actions (Header of Entry Sequence)
- **`[📋 Copy All Prompts]`**: Copies prompts for all items in sequence into a master storyboard.
- **`[📥 Export Full Plan CSV]`**: Downloads a combined multi-item animation CSV for the entire room layout simulation.

---

## 4. Implementation Steps & Deliverables

1. **`src/utils/prompt-csv-generator.ts`**:
   - Helper functions: `generateStepPrompt(step, item, room)` and `generateStepCSV(step, item)`.
   - Global export helpers for full sequence.
2. **`src/components/VerticalTimelinePanel.tsx`**:
   - Create unified right panel combining solver actions, playback controls (`Play/Pause`, step navigation, progress), and vertical timeline nodes.
   - Embed the `[📋 Copy Prompt]` and `[📊 Copy CSV]` buttons on each step card.
3. **`src/components/SimsCatalogDock.tsx`**:
   - Create collapsible bottom shelf with category filtering, horizontal card carousel, and solid `FurnitureBox3D` models.
4. **`src/components/HierarchyPopup.tsx`**:
   - Create floating glassmorphic in-canvas popup for room structure and component breakdown.
5. **`src/components/EditorView.tsx`**:
   - Integrate `HierarchyPopup` into the viewport toolbar.
   - Embed `SimsCatalogDock` at the bottom.
   - Replace old horizontal dock with new layout.
6. **`src/App.tsx` & `src/index.css`**:
   - Update layout shells, remove redundant top-level tab switches, and add sleek Sims-style styling tokens.
7. **Tests & Build Verification**:
   - Run Vitest suite to ensure all solver and persistence tests pass.
   - Verify production build in `dist/`.

---

## 5. Review & Approval

Please review this specification. Once approved or revised, we will proceed to implement the changes.
