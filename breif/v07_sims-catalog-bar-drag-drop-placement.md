# v07 — Sims-Style Bottom Catalog Bar + Drag & Drop Placement

> **Status:** DRAFT — awaiting revision before code
> **Date:** 2026-09-30
> **Scope:** Pack & Place — Bottom Catalog Bar + Drag-to-Place + Object Type System

---

## 1. Overview / Motivation

Currently objects are added via a separate Catalog tab. There is no bottom catalog bar visible while in the 3D editor — lo harus pindah tab hanya untuk nambah item.

**Solusi (Sims-style):**
- Permanent bottom bar dengan thumbnail grid item catalog
- Drag item dari catalog bar ke dalam 3D viewport → item muncul di posisi drop
- Object langsung bisa di-edit posisi, rotasi, dan nanti sync ke Sequence CSV Editor

---

## 2. Bottom Catalog Bar — Layout

Catalog bar muncul **di bawah 3D viewport**, di atas simulation timeline dock.

```
+-------------------------------------------------------+
|                                                       |
|   3D VIEWPORT                                         |
|                                                       |
+-------------------------------------------------------+
| [Filter: All v] [Search: ___________] [< >]          |  <- filter/nav bar
+-------+-------+-------+-------+-------+-------+------+
| [IMG] | [IMG] | [IMG] | [IMG] | [IMG] | [IMG] | ...  |  <- thumbnail grid
| Sofa  | Table | Chair | Bed   | Lamp  | Plant | ...  |
| 2-seat| Coffee| Arm   | Queen |       |       |      |
+-------+-------+-------+-------+-------+-------+------+
|  Simulation Timeline Dock (existing)                  |
+-------------------------------------------------------+
```

### Catalog Bar Specs
- **Height:** ~110px fixed (thumbnail 72px + label 18px + padding)
- **Thumbnail size:** 72x72px
- **Scroll:** horizontal scroll jika items melebihi lebar
- **Filter bar:** dropdown All / Furniture / Obstacle / Door / Wall
- **Search:** text filter langsung filter thumbnails
- **Pagination:** arrow kiri/kanan untuk navigate kategori

---

## 3. Object Type System (Revised)

Saat ini scene hanya punya: walls, door entrance, furniture.

**v07 introduces proper type system:**

| Type | Label | Ikon | Behavior |
|------|-------|------|----------|
| `wall` | Wall | 🧱 | Fixed obstacle — tidak bisa dipindah, blocks pathfinding |
| `door` | Door/Entrance | 🚪 | Entry point — defines entry path for solver |
| `window` | Window | 🪟 | Decorative obstacle on wall |
| `furniture` | Furniture | 📦 | Placeable — main simulation subject |
| `fixture` | Fixture | 🔧 | Fixed furniture (built-in wardrobe, kitchen counter) — obstacle |
| `decor` | Decor | 🌿 | Optional decorative items (plant, lamp) — soft obstacle |

**Obstacle types (walls/doors/fixtures)** = tidak bisa dimasukkan ke Sequence animation  
**Furniture/Decor** = bisa masuk ke Sequence animation (drag drop → auto-fill CSV row)

---

## 4. Drag & Drop Flow

### 4.1 From Catalog Bar to 3D Scene

```
User drag thumbnail dari catalog bar
    → drag: show ghost overlay di viewport (semi-transparent mesh)
    → ghost follows mouse position projected onto floor plane
    → drop: item placed at that floor position
    → item appears in 3D viewport
    → item added to furniture[] in store
    → if Sequence CSV Editor open:
         → auto-insert new row dengan data:
              object_id: item.id
              object_name: item.name
              start_pos_x: dropX
              start_pos_y: dropY
              start_rot: 0
              (end_pos_x, end_pos_y, end_rot: same as start — user edit manually)
```

### 4.2 Ghost Preview During Drag

Saat drag di atas viewport:
- Semi-transparent box preview (alpha 0.4)
- Snap ke grid (optional toggle: 10cm grid snap)
- Warna merah jika overlap/collision, hijau jika clear
- Label nama item muncul di bawah ghost

### 4.3 Drop Constraints

- Drop hanya valid di area dalam room bounds (walls)
- Drop di luar room = cancelled (ghost turns red, item returns to catalog)
- Overlap collision = warning tapi tetap allow place (bisa override)

---

## 5. Catalog Item Card — Thumbnail Design

Setiap item di catalog bar:

```
+----------+
|          |
|  [3D or  |
|  emoji   |
|  render] |
|          |
+----------+
| Sofa 2-s |  <- nama dipotong jika panjang
| 📦 furn  |  <- type badge
+----------+
```

- **Priority badge:** must (🔴), prefer (🟡), flex (⚪)
- **Hover:** scale up 1.05 + border highlight
- **Already placed:** badge overlay "✓ In Scene"
- **Dragging:** opacity 0.5 saat sedang di-drag

---

## 6. Catalog Bar Filter & Search

```
[All ▾] [Furniture ▾] [Obstacle ▾]   [🔍 Search items...]   [← Page 1/3 →]
```

- **Type filter:** All / Furniture / Fixture / Decor / Obstacle (Wall+Door+Window)
- **Search:** real-time filter by name
- **Sort:** by priority (must first), by name, by size
- **Show placed / Hide placed:** toggle to hide items already in scene

---

## 7. CSV Editor — Drag-to-Place Auto-fill

Ketika item di-drop ke 3D scene dan CSV editor sedang open:

**Auto-insert baris baru di akhir sequence:**
```csv
step_id, object_id,  object_name,  start_pos_x, start_pos_y, start_rot, end_pos_x, end_pos_y, end_rot, duration_s, easing,       notes
7,       sofa_01,   Sofa 2-seat,  dropX,       dropY,       0,         dropX,     dropY,     0,       1.5,        ease-in-out,  Placed via drag
```

- `start_pos` = `end_pos` = drop position (item stays in place — animasi bisa diedit nanti)
- `easing` = default `ease-in-out`
- `notes` = `"Placed via drag"` (bisa diedit)

Jika CSV editor tidak open: item tetap di-place di 3D, tapi tidak auto-insert ke CSV.

**Toggle di CSV toolbar:**
```
[Auto-fill on drop: ON/OFF]
```

---

## 8. Interaction Flow Summary

```
Bottom Catalog Bar
    |
    +-- [click item]     → select item (highlight in bar)
    +-- [drag item]      → drag onto 3D viewport
    |       |
    |       +-- hover viewport → ghost preview mesh on floor
    |       +-- drop           → place item at position
    |                              → add to furniture store
    |                              → (if CSV open) auto-insert row
    |
    +-- [double-click]   → open item detail (specs, dims, etc.)

3D Viewport
    +-- click placed item  → select → Object tab inspector shows it
    +-- drag placed item   → move it (existing behavior)
    +-- right-click        → context menu: Delete / Rotate / Add to Sequence
```

---

## 9. Layout Change in EditorView

```
+-------------------------------------------------------+
|                                                       |
|   3D VIEWPORT + N-Tab Inspector (52% / 18%)           |
|   [optional: + CSV Editor 40%]                        |
|                                                       |
+-------------------------------------------------------+
|   CATALOG BAR (110px)                                 |  <- NEW
+-------------------------------------------------------+
|   SIMULATION TIMELINE DOCK (existing)                 |
+-------------------------------------------------------+
```

Catalog bar ditambahkan **antara** 3D viewport dan timeline dock.

---

## 10. State Changes

```
AppStore additions:
    catalogBarVisible: boolean      <- toggle show/hide bottom catalog bar
    catalogBarFilter: ObjectType | 'all'
    catalogBarSearch: string
    catalogBarPage: number
    autoFillCSVOnDrop: boolean      <- toggle auto-insert CSV row on drop
    draggedItemId: string | null    <- item currently being dragged from catalog
    dropGhostPos: {x:number, y:number} | null  <- ghost position on floor
```

---

## 11. Technical Notes

### Drag & Drop Implementation
- HTML5 Drag API from catalog thumbnails
- Drop target: canvas element overlay (transparent div on top of canvas)
- Mouse position → floor plane intersection via BabylonJS `scene.pick()`
- Floor plane ray pick: `pickWithRay` on the floor mesh

### Ghost Mesh
- Created on dragenter into viewport
- Updated on dragover via `scene.pick()` to get world position
- Destroyed on drop or dragleave
- Reuses BabylonJS `MeshBuilder.CreateBox` (same as furniture render)

### Thumbnail Generation
- Option A: CSS emoji/icon placeholder (fast, no asset needed) ← RECOMMENDED for now
- Option B: Pre-generated screenshot of 3D mesh (expensive, needs pipeline)
- Option C: 2D SVG top-down footprint (medium complexity)

**v07 uses Option A** — emoji + color coded by type, upgrade to B/C in later version.

---

## 12. Apa yang TIDAK Berubah di v07

- N-Tab Inspector (v06) — no change
- Sequence CSV Editor (v06) — no change (only auto-fill feature added)
- Solver algorithm — no change
- Existing furniture store structure — extend only (add `type` field)

---

## 13. Files Estimasi (DONOT CODE YET)

| File | Action | Keterangan |
|------|--------|------------|
| src/types/index.ts | Modify | Add `ObjectType`, extend `FurnitureItem` with `type` field |
| src/store/app-store.ts | Modify | Add catalogBar state, drag state, autoFillCSVOnDrop |
| src/components/CatalogBar.tsx | CREATE | Bottom thumbnail bar component |
| src/components/CatalogBar.css | CREATE | Sims-style thumbnail grid styles |
| src/components/DragGhost.tsx | CREATE | Overlay div on canvas for drop target + ghost position |
| src/components/EditorView.tsx | Modify | Add CatalogBar between viewport and timeline dock |
| src/data/presets.ts | Modify | Add `type` field to all preset items |

---

## 14. Open Questions untuk Revisi

1. **Thumbnail style** — Option A (emoji/color block) atau mau ada gambar furniture?
2. **Grid snap** — mau ada snap to grid (10cm)? Default on atau off?
3. **Context menu** — right-click on placed item: mau ada context menu atau cukup via Object tab?
4. **Catalog bar height** — 110px cukup? atau mau lebih besar/smaller?
5. **Auto-fill CSV** — default ON atau OFF saat pertama buka?
6. **Obstacle items di catalog bar** — walls/doors ikut muncul di catalog bar, atau catalog bar hanya tampilkan placeable items saja?

---

*End of v07 Brief — review & revise sebelum lanjut ke implementation.*
