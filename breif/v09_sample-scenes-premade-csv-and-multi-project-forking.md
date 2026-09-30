# Brief v09 — Pre-made Sample Scenes with Sequence CSV & Multi-Project Copy-On-Write Architecture (10/10 Full Specification)

---

## 1. Executive Summary & Root-Cause Analysis

In **v08**, we successfully implemented the **Inspector Transform Triad**, **Placement Modes** (`static`, `inserting`, `packing`), **Dual 3D Ghosts** (cyan `[S]` and green `[E]`), **Sequence CSV Resorting**, and the **Playback Safety Lock**.

However, testing the 2 sample scenes (**Master Bedroom** and **Compact Studio**) revealed two critical UX gaps:

1. **Empty / Non-Functional Sample Scenes on Initial Load**:
   - The sample presets only contained raw wall geometry and placed bounding boxes.
   - None of the sample items had `placementMode: 'inserting'` or pre-assigned `startPosition` (entrance) and `endPosition` (docked room target).
   - `sequenceRows` defaulted to an empty array `[]` and `plan` was `null`.
   - Consequently, loading a sample scene resulted in a blank Sequence CSV Editor, clicking **Play (▶)** had nothing to animate, 3D trajectory ghosts were absent, and users were forced to configure everything manually.

2. **Destructive Single-State Flat Persistence**:
   - The application maintained only a single flat state in `localStorage` (`pack-and-place-storage-v2`).
   - Any modification or test experiment directly mutated the sample scene state, making it impossible to explore multiple layout ideas or revert cleanly to the original factory demonstration.

---

## 2. Core Pillars of v09

1. **2 Rich Pre-Made Sample Scenes (Out-of-the-Box Playback)**:
   - **All sample objects pre-configured in `inserting` mode**.
   - `startPosition`: Centered outside the hallway entrance (`x = doorCenter, y = -corridorLen`).
   - `endPosition`: Optimized room docking coordinates.
   - Pre-baked **Sequence CSV rows** matching realistic delivery depth order ($1..N$).
   - Pre-baked **Fitting Plans & Path Nodes** so clicking **Play (▶)** immediately animates all items with trajectory paths, rotation waypoints, and timeline scrubbing without requiring the solver to be run first.
2. **Multi-Project Management System**:
   - Full support for creating, switching, renaming, duplicating, and deleting multiple projects.
   - Clean JSON export and import for layout sharing and offline backup.
3. **Copy-On-Write (COW) Auto-Forking**:
   - Official sample scenes are marked immutable templates (`isSample: true`).
   - Any mutation (catalog drag, coordinate edit, CSV change) automatically **forks** the sample into a new user project (e.g. `Master Bedroom (Custom 1)`), preserving the original template.
4. **Auto-Save Status & Room Switching Guards (10/10 Polish)**:
   - Real-time `● Saved` / `💾 Saving...` status indicator in the topbar.
   - Guard modal when switching rooms in custom projects to prevent accidental layout destruction.
   - Rich project metadata in the selector dropdown (dimensions, item count, sequence duration, last modified timestamp).
   - Project quota management with clean JSON export/import.

---

## 3. Detailed Specification: The 2 Curated Sample Scenes

### Preset 1: Master Bedroom & Wide Hallway
- **Room Specs**: $500 \times 380$ cm, $1.8$m wide hallway entrance, ceiling height $260$ cm.
- **Doorway**: Wall $0$, offset $160$ cm, width $180$ cm, corridor length $140$ cm. Entrance center: $X = 250, Y = -140$.
- **Delivery Strategy**: Deepest items enter first to prevent aisle blocking.
- **Objects & Pre-Made CSV Steps**:
  1. **Wardrobe 2-Door** ($100 \times 60 \times 200$ cm, Must):
     - Mode: `inserting`
     - Start: $(250, -140)$, Rot: $0^\circ$ $\rightarrow$ End: $(30, 300)$, Rot: $0^\circ$ (NW corner)
     - Duration: $2.0$s, Easing: `ease-in-out`, Notes: `Deepest north-west corner placement`
  2. **6-Drawer Dresser** ($110 \times 50 \times 90$ cm, Must):
     - Mode: `inserting`
     - Start: $(250, -140)$, Rot: $0^\circ$ $\rightarrow$ End: $(360, 310)$, Rot: $0^\circ$ (NE corner)
     - Duration: $1.8$s, Easing: `ease-in-out`, Notes: `North-east corner against back wall`
  3. **Queen Bed** ($160 \times 200 \times 55$ cm, Must):
     - Mode: `inserting`
     - Start: $(250, -140)$, Rot: $0^\circ$ $\rightarrow$ End: $(170, 120)$, Rot: $0^\circ$ (Center)
     - Duration: $2.5$s, Easing: `ease-in-out`, Notes: `Central master bed docking`
  4. **Nightstand (L)** ($45 \times 45 \times 55$ cm, Prefer):
     - Mode: `inserting`
     - Start: $(250, -140)$, Rot: $0^\circ$ $\rightarrow$ End: $(110, 240)$, Rot: $0^\circ$ (West side of bed)
     - Duration: $1.2$s, Easing: `ease-out`, Notes: `Left bedside table`
  5. **Nightstand (R)** ($45 \times 45 \times 55$ cm, Prefer):
     - Mode: `inserting`
     - Start: $(250, -140)$, Rot: $0^\circ$ $\rightarrow$ End: $(345, 240)$, Rot: $0^\circ$ (East side of bed)
     - Duration: $1.2$s, Easing: `ease-out`, Notes: `Right bedside table`
  6. **Work Desk** ($110 \times 60 \times 75$ cm, Prefer):
     - Mode: `inserting`
     - Start: $(250, -140)$, Rot: $0^\circ$ $\rightarrow$ End: $(360, 20)$, Rot: $0^\circ$ (SE near door)
     - Duration: $1.5$s, Easing: `ease-in-out`, Notes: `South-east corner desk placement`
- **Total Duration**: $10.2$s. Pre-computed path waypoints connecting hallway to final coordinates.

### Preset 2: Compact Studio & Narrow Doorway (Rotation Challenge)
- **Room Specs**: $380 \times 320$ cm, narrow $1.0$m door, ceiling height $250$ cm.
- **Doorway**: Wall $0$, offset $140$ cm, width $100$ cm, corridor length $130$ cm. Entrance center: $X = 190, Y = -130$.
- **The Core Showcase**: Studio Bed is $150$ cm wide and cannot pass straight through a $100$ cm door! It must rotate $90^\circ$ during entry (reducing frontal width to $90$cm), pass the doorway threshold, and rotate back to $0^\circ$ once inside.
- **Objects & Pre-Made CSV Steps**:
  1. **Tall Wardrobe** ($85 \times 55 \times 195$ cm, Must):
     - Mode: `inserting`
     - Start: $(190, -130)$, Rot: $0^\circ$ $\rightarrow$ End: $(30, 250)$, Rot: $0^\circ$ (NW corner)
     - Duration: $1.8$s, Easing: `ease-in-out`, Notes: `Deep corner storage`
  2. **Studio Bed** ($150 \times 90 \times 55$ cm, Must):
     - Mode: `inserting`
     - Start: $(190, -130)$, Rot: $90^\circ$ $\rightarrow$ End: $(160, 210)$, Rot: $0^\circ$
     - Path Nodes include rotational transition: enters hallway at $90^\circ$, passes doorway at $Y = 0$, rotates from $90^\circ \rightarrow 0^\circ$ between $Y = 30$ and $Y = 120$, then docks at $(160, 210)$.
     - Duration: $3.0$s, Easing: `ease-in-out`, Notes: `⚡ Rotates 90° to squeeze through 1.0m door!`
  3. **Bedside Table** ($45 \times 45 \times 50$ cm, Prefer):
     - Mode: `inserting`
     - Start: $(190, -130)$, Rot: $0^\circ$ $\rightarrow$ End: $(325, 240)$, Rot: $0^\circ$
     - Duration: $1.2$s, Easing: `ease-out`, Notes: `Bedside stand`
  4. **Compact Study Desk** ($90 \times 50 \times 75$ cm, Prefer):
     - Mode: `inserting`
     - Start: $(190, -130)$, Rot: $0^\circ$ $\rightarrow$ End: $(30, 60)$, Rot: $0^\circ$
     - Duration: $1.4$s, Easing: `ease-in-out`, Notes: `Study desk along west wall`
  5. **Lounge Armchair** ($75 \times 70 \times 80$ cm, Prefer):
     - Mode: `inserting`
     - Start: $(190, -130)$, Rot: $0^\circ$ $\rightarrow$ End: $(280, 40)$, Rot: $0^\circ$
     - Duration: $1.2$s, Easing: `ease-out`, Notes: `Comfort armchair near window`
- **Total Duration**: $8.6$s. Pre-computed path waypoints with rotation interpolation.

---

## 4. Multi-Project Architecture & Data Schema

### TypeScript Interfaces (`src/types/index.ts`)
```ts
export interface Project {
  id: string
  name: string
  isSample: boolean              // true for immutable factory templates
  samplePresetId?: string        // 'room-master-bedroom' | 'room-compact-studio'
  createdAt: number              // timestamp
  updatedAt: number              // timestamp
  room: Room
  furniture: FurnitureItem[]
  sequenceRows: SequenceStep[]
  plan: FittingPlan | null
}

export interface ProjectMetadata {
  id: string
  name: string
  isSample: boolean
  updatedAt: number
  itemCount: number
  totalDurationS: number
  roomDimensions: string         // e.g. "500×380 cm"
}
```

### Store State Extensions (`src/store/app-store.ts`)
```ts
// Multi-Project State
projects: Project[]
activeProjectId: string
autoSaveStatus: 'saved' | 'saving'

// Project Management Actions
selectProject: (projectId: string) => void
createBlankProject: (name?: string) => string
duplicateProject: (projectId: string) => string
renameProject: (projectId: string, newName: string) => void
deleteProject: (projectId: string) => void
resetSampleProject: (sampleId: string) => void
exportProjectJSON: (projectId: string) => void
importProjectJSON: (jsonString: string) => string | null
clearAllCustomProjects: () => void

// Copy-On-Write (COW) Guard Helper
ensureWritableProject: () => string // returns writable activeProjectId (forks if currently a sample)
```

---

## 5. Copy-On-Write (COW) Auto-Forking Flow

```
   ┌─────────────────────────────────────────────────────────────┐
   │ USER ACTION (Catalog Drop / Transform Edit / CSV Row Edit)  │
   └──────────────────────────────┬──────────────────────────────┘
                                  ▼
                   Is active project a Sample?
                                  │
                 ┌────────────────┴────────────────┐
                 ▼ YES                             ▼ NO
  ┌───────────────────────────────┐   ┌───────────────────────────────┐
  │ 1. Clone sample data          │   │ Mutate active project in-place│
  │ 2. Name: "<Sample> (Custom 1)"│   │ Trigger debounced Auto-Save   │
  │ 3. Set isSample = false       │   │ Show '● Saved' badge          │
  │ 4. Register new Project in list│   └───────────────────────────────┘
  │ 5. Set activeProjectId = newId│
  │ 6. Show Toast Notification:   │
  │    "✨ Forked to new project" │
  │ 7. Apply the requested edit   │
  └───────────────────────────────┘
```

---

## 6. 10/10 Polish Features

### 6.1 TopBar Project Selector & Auto-Save Pill
- Positioned in `App.tsx` topbar right beside `📦 Pack & Place`.
- **Project Pill Button**:
  - Displays: `[Sample] Master Bedroom ▼` or `[Custom] My Apartment Layout ▼`.
  - Colored indicator: Cyan for `Sample`, Indigo for `Custom`.
- **Auto-Save Status Badge**:
  - Displays `● Saved` in green or `💾 Saving...` in yellow during debounced sync.
- **Dropdown List**:
  - **📁 Factory Samples** (Always pristine):
    - `Master Bedroom & Hallway (1.8m Door)`
    - `Compact Studio (1.0m Door — Rotate Required)`
    - `↺ Reset to Default` button for each sample.
  - **💾 My Projects** (User-saved projects):
    - Card rows showing: Title, Room Dimensions, Item Count, Sequence Duration, Last Modified.
    - Hover actions: Rename (`✏️`), Duplicate (`📋`), Export (`⬇`), Delete (`🗑`).
  - **Dropdown Footer**:
    - `➕ New Blank Project`
    - `📥 Import Project (.json)`
    - `⬇ Export Current (.json)`
    - `🗑 Clear All Custom Projects`

### 6.2 Room Switching Guard in Inspector (Room Tab)
- When a user changes the Room Preset in the Room Tab while inside an existing custom project:
- A confirmation dialog appears:
  - `Switch Room Shell (Keep Furniture)`: Keeps current furniture and adapts walls.
  - `Fork as New Project from Preset`: Creates a fresh project with preset room & items.
  - `Cancel`: Discards selection.

---

## 7. Implementation Checklist

- [ ] `src/types/index.ts`:
  - Add `Project` and `ProjectMetadata` interfaces.
- [ ] `src/data/presets.ts`:
  - Enhance `BEDROOM_PRESETS` and `COMPACT_STUDIO_PRESETS` with:
    - `placementMode: 'inserting'`
    - Accurate `startPosition`, `startRotation`, `endPosition`, `endRotation`
    - Pre-computed `BEDROOM_SEQUENCE_ROWS` and `STUDIO_SEQUENCE_ROWS`
    - Pre-computed `BEDROOM_PLAN` and `STUDIO_PLAN` with path waypoints & bed rotation
    - Pre-built factory `SAMPLE_PROJECTS: Project[]`
- [ ] `src/store/app-store.ts`:
  - Multi-project storage and `activeProjectId` in persistent storage.
  - Transparent `ensureWritableProject()` COW auto-forking wrapper on all mutations.
  - Project management CRUD actions + JSON import/export.
- [ ] `src/components/ProjectSelector.tsx`:
  - Modern topbar dropdown with project switching, metadata tags, and action buttons.
- [ ] `src/components/ToastNotification.tsx`:
  - Animated notification banner when projects are forked or saved.
- [ ] `src/App.tsx`:
  - Mount `ProjectSelector` and `ToastNotification`.
- [ ] `src/index.css`:
  - Styling for project dropdown, badges, metadata pills, and toast transitions.
- [ ] Build & Verification:
  - Verify both sample scenes run simulation immediately upon pressing Play (▶).
  - Verify editing creates a new user project automatically while keeping original samples pristine.
