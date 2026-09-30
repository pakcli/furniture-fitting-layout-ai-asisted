# v07 — Unity Explorer Catalog Panel + Drag & Drop Placement

> **Status:** REVISED v2 — awaiting confirmation before code
> **Date:** 2026-09-30
> **Scope:** Pack & Place — Bottom Catalog Panel (Unity Explorer-style) + Drag-to-Place

---

## 1. Overview / Motivation

Replacing the simple thumbnail bottom bar concept with a proper **Unity Project Explorer-style panel**:
- Folder tree on the left (hierarchy navigation)
- Asset grid on the right (thumbnails of items)
- Breadcrumb header for navigation
- Drag & drop from panel to 3D viewport

---

## 2. Bottom Catalog Panel — Full Layout

```
+=========================================================+
|                                                         |
|   3D VIEWPORT (+ N-Tab Inspector)                       |
|                                                         |
+=========================================================+
| CATALOG PANEL (resizable height, default ~200px)        |
+-------------------------+---------------------------------+
| Breadcrumb: Root > Furniture > Seating                  |  <- header (full width)
+-------------------------+---------------------------------+
|                         |                               |
|  FOLDER TREE            |   ASSET GRID                  |
|  (left split)           |   (right, fills rest)         |
|                         |                               |
|  Root                   |  [item][item][item][item]     |
|  > Furniture            |  [item][item][item][item]     |
|      > Seating          |  [item][item][item][item]     |
|      > Tables           |                               |
|      > Storage          |                               |
|  > Obstacles            |                               |
|      > Walls            |                               |
|      > Doors            |                               |
|  > Decor                |                               |
|      > Plants           |                               |
|      > Lighting         |                               |
|                         |                               |
| min:300px max:50%       |   fills remaining width       |
+-------------------------+---------------------------------+
|  Simulation Timeline Dock (existing)                    |
+=========================================================+
```

---

## 3. Catalog Panel Header — Breadcrumb

```
+- Catalog -[🔍 search...]-[Sort: Name ▾]-[Grid ▾]-------[_ □ ✕]-+
| Root  >  Furniture  >  Seating                                   |
+------------------------------------------------------------------+
```

- **Left:** Panel title "Catalog" + search input
- **Center:** Breadcrumb trail — clickable each segment to navigate up
- **Right:** Sort dropdown + view mode toggle (Grid/List) + collapse button
- Breadcrumb separator: `>`
- Click segment = navigate to that folder level

---

## 4. Left Split — Folder Tree (Unity Explorer style)

```
Root
├── 📦 Furniture
│   ├── 🛋 Seating           <- currently browsing (highlighted)
│   ├── 🪑 Tables
│   ├── 🛏 Bedroom
│   └── 🗄 Storage
├── 🧱 Obstacles
│   ├── 🚪 Doors & Entrances
│   ├── 🪟 Windows
│   └── 🧱 Walls
└── 🌿 Decor
    ├── 🪴 Plants
    ├── 💡 Lighting
    └── 🖼 Art & Misc
```

**Tree behavior:**
- Click folder → expand/collapse (chevron ▶/▼)
- Click folder name → navigate (updates breadcrumb + right panel shows contents)
- Active folder = highlighted row (accent bg)
- Indent per level: 16px
- Folder icons: per category
- Leaf items (no subfolder) = no chevron

**Tree panel sizing:**
- **Min width:** 300px
- **Max width:** 50% of catalog panel width
- **Resizable:** drag handle divider between tree and grid
- **Default width:** 300px

---

## 5. Right Panel — Asset Grid

Shows items in the currently selected folder:

```
+-------+-------+-------+-------+-------+-------+
|       |       |       |       |       |       |
| emoji | emoji | emoji | emoji | emoji | emoji |
|  /img |  /img |  /img |  /img |  /img |  /img |
|       |       |       |       |       |       |
| Sofa  | Chair | Love  | Bench | Stool | Otto  |
| 2-seat| Arm   | seat  |       |       | man   |
| 🔴must| 🟡pref| ⚪flex | ⚪flex | 🟡pref| ⚪flex |
+-------+-------+-------+-------+-------+-------+
```

**Item card:**
- Thumbnail: 80x80px (emoji/color block now, image later)
- Name: truncated, 2 lines max
- Priority badge: 🔴 must / 🟡 prefer / ⚪ flex
- Type badge: small pill (furniture / obstacle / decor)
- Already placed badge: `✓` overlay
- Hover: scale 1.04 + border highlight
- Selected: accent border

**Grid sizing:**
- Card size: configurable via zoom slider (64px–120px)
- Responsive grid: CSS grid auto-fill

---

## 6. Object Type System

| Type | Label | Icon | Folder | Draggable to 3D |
|------|-------|------|--------|-----------------|
| `furniture` | Furniture | 📦 | Furniture/* | ✅ |
| `fixture` | Fixture | 🔧 | Furniture/Storage | ✅ (fixed after place) |
| `decor` | Decor | 🌿 | Decor/* | ✅ |
| `wall` | Wall | 🧱 | Obstacles/Walls | ❌ (room structure only) |
| `door` | Door | 🚪 | Obstacles/Doors | ❌ (defined in Room tab) |
| `window` | Window | 🪟 | Obstacles/Windows | ❌ (room structure only) |

Obstacles folder shown in tree but items are **not draggable** — they're displayed as reference/info only. User edits obstacles via Room tab in N-Tab Inspector.

---

## 7. Drag & Drop Flow

### 7.1 Drag from Asset Grid → 3D Viewport

```
1. User mousedown on item card in asset grid
2. Drag starts → item card shows drag ghost (semi-transparent copy)
3. When drag enters 3D canvas:
     → Ghost 3D mesh appears on floor at cursor position
     → Ghost = semi-transparent box matching item dimensions
     → Color: green = valid placement, red = collision/out of bounds
4. Dragover canvas:
     → Ghost mesh follows cursor (raypick onto floor plane)
     → Grid snap: optional 10cm snap
5. Drop on canvas:
     → Item placed at ghost position
     → Added to furniture[] store
     → Object tab inspector auto-selects new item
     → If CSV Editor open: auto-insert row (see Section 8)
6. Drag out of canvas / Escape:
     → Ghost destroyed, placement cancelled
```

### 7.2 Ghost Mesh

- BabylonJS `MeshBuilder.CreateBox` matching item's `assembled.w/d/h`
- Alpha: 0.35
- Color: item's assigned color (green tint if valid, red tint if collision)
- Edge rendering: 2px dashed outline
- Name label floating above ghost (HTML overlay or BabylonJS GUI)

---

## 8. CSV Editor Auto-fill on Drop

When item dropped into 3D scene **and** CSV Editor is open:

```
Auto-insert new row:
  step_id:     next auto-increment
  object_id:   item.id
  object_name: item.name
  start_pos_x: dropX (cm)
  start_pos_y: dropY (cm)
  start_rot:   0
  end_pos_x:   dropX  (same — user edits target)
  end_pos_y:   dropY  (same)
  end_rot:     0
  duration_s:  1.5    (default)
  easing:      ease-in-out
  notes:       "Placed via drag"
```

**Toggle in CSV toolbar:**
```
[ Auto-fill on drop: ON ] ← green when on
```

Default: **ON**

---

## 9. Catalog Panel Height

- **Default height:** 200px
- **Min height:** 150px (shows at least 1 row of items)
- **Max height:** 40% of screen height
- **Resizable:** drag handle on top edge of catalog panel
- **Collapsible:** click `▼` in header to collapse to just header bar (32px)

---

## 10. State Additions

```
AppStore additions:
  // Catalog panel
  catalogPanelVisible: boolean          // show/hide panel
  catalogPanelHeight: number            // px, default 200
  catalogTreeWidth: number              // px, default 300
  catalogSelectedFolder: string         // folder path e.g. "furniture/seating"
  catalogExpandedFolders: string[]      // which tree nodes are open
  catalogSearch: string
  catalogSortBy: 'name' | 'priority' | 'size'
  catalogViewMode: 'grid' | 'list'
  catalogZoom: number                   // thumbnail size px, default 80

  // Drag state
  draggedItemId: string | null
  dropGhostPos: { x: number; y: number } | null
  autoFillCSVOnDrop: boolean            // default true
```

---

## 11. Folder Data Structure

```ts
interface CatalogFolder {
  id: string            // e.g. "furniture/seating"
  label: string         // e.g. "Seating"
  icon: string          // emoji
  children?: CatalogFolder[]
  itemTypes?: ObjectType[]  // filter: which item types live here
}

const CATALOG_TREE: CatalogFolder[] = [
  {
    id: 'furniture', label: 'Furniture', icon: '📦',
    children: [
      { id: 'furniture/seating',  label: 'Seating',  icon: '🛋', itemTypes: ['furniture'] },
      { id: 'furniture/tables',   label: 'Tables',   icon: '🪑', itemTypes: ['furniture'] },
      { id: 'furniture/bedroom',  label: 'Bedroom',  icon: '🛏', itemTypes: ['furniture'] },
      { id: 'furniture/storage',  label: 'Storage',  icon: '🗄', itemTypes: ['furniture', 'fixture'] },
    ]
  },
  {
    id: 'obstacles', label: 'Obstacles', icon: '🧱',
    children: [
      { id: 'obstacles/doors',    label: 'Doors & Entrances', icon: '🚪', itemTypes: ['door'] },
      { id: 'obstacles/windows',  label: 'Windows',           icon: '🪟', itemTypes: ['window'] },
      { id: 'obstacles/walls',    label: 'Walls',             icon: '🧱', itemTypes: ['wall'] },
    ]
  },
  {
    id: 'decor', label: 'Decor', icon: '🌿',
    children: [
      { id: 'decor/plants',    label: 'Plants',   icon: '🪴', itemTypes: ['decor'] },
      { id: 'decor/lighting',  label: 'Lighting', icon: '💡', itemTypes: ['decor'] },
      { id: 'decor/art',       label: 'Art & Misc', icon: '🖼', itemTypes: ['decor'] },
    ]
  }
]
```

---

## 12. Visual Design (Unity Explorer reference)

### Catalog Panel
- Background: `var(--surface)` (dark panel, slightly lighter than bg)
- Border top: `1px solid var(--border)`
- Font: monospace for folder paths, sans-serif for item names

### Folder Tree
- Row height: 24px
- Hover: bg highlight subtle
- Active: bg `var(--accent-dim)`, text `var(--accent)`
- Chevron: ▶ (collapsed) / ▼ (expanded), 10px, muted color
- Indent: 16px per level
- Icons: 14px emoji

### Divider (tree / grid split)
- 4px wide drag handle
- Cursor: `col-resize`
- Hover: `var(--accent)` color

### Asset Grid
- Background: `var(--bg)` (slightly darker than tree panel)
- Item card border: `1px solid var(--border)`
- Selected card: `2px solid var(--accent)`
- Hover card: `1px solid var(--accent)` + slight elevation

---

## 13. Layout in EditorView

```
EditorView (flex column):
  ├── editor-shell (grid: 52% / 18% / 40%)   ← 3D + Inspector + optional CSV
  ├── CatalogPanel (resizable height)          ← NEW
  └── SimulationTimelineDock                   ← existing
```

---

## 14. Files Estimasi (DONOT CODE YET)

| File | Action | Keterangan |
|------|--------|------------|
| src/types/index.ts | Modify | Add `ObjectType`, `CatalogFolder`, extend `FurnitureItem.type` |
| src/data/catalog-tree.ts | CREATE | CATALOG_TREE definition + folder structure |
| src/data/presets.ts | Modify | Add `type` + `category` field to all preset items |
| src/store/app-store.ts | Modify | Add catalog panel state + drag state |
| src/components/CatalogPanel.tsx | CREATE | Main panel container (header + tree + grid) |
| src/components/catalog/CatalogHeader.tsx | CREATE | Breadcrumb + search + sort + controls |
| src/components/catalog/FolderTree.tsx | CREATE | Unity-style recursive folder tree |
| src/components/catalog/AssetGrid.tsx | CREATE | Thumbnail grid with drag source |
| src/components/catalog/DragOverlay.tsx | CREATE | Canvas drop target + ghost mesh controller |
| src/components/EditorView.tsx | Modify | Add CatalogPanel between viewport and timeline |
| src/styles/catalog-panel.css | CREATE | Explorer panel styles |

---

## 15. Open Questions (Perlu Konfirmasi)

1. **Catalog panel height** — default 200px, resizable. Cukup?
2. **Tree width default** — 300px. Oke?
3. **Auto-fill CSV** — default ON. Oke?
4. **Grid snap** — 10cm snap default ON atau OFF?
5. **Obstacle items in tree** — tampil sebagai info/reference only (tidak bisa drag). Oke?
6. **Thumbnail** — emoji placeholder dulu (v07), baru gambar/render di versi selanjutnya. Oke?

---

*End of v07 Brief Revised v2 — konfirmasi open questions sebelum code.*
