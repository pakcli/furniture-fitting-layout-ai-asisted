# v06 — Blender N-Tab Inspector + Sequence CSV Editor

> **Status:** FINAL COMPLETE — ready for implementation
> **Date:** 2026-09-30
> **Scope:** Pack & Place — Inspector Panel Redesign + Sequence CSV Editor

---

## Revision Log

| Q | Jawaban Final |
|---|--------------|
| Q1 | **Vertical tab strip** — teks dirotate 90deg searah jarum jam (`writing-mode: vertical-lr`), bukan huruf ditumpuk. Kata "Room" dibaca dari atas ke bawah sebagai satu kata. First letter di atas. |
| Q2 | Center panel: `width: min(400px, 18vw)` |
| Q3 | Tab Sequence: tombol dulu, tidak auto-open CSV editor |
| Q4 | Toggle Live Sync ON/OFF + tombol `[Save Animation]` + badge unsaved count |
| Q5 | Export CSV = file download + clipboard sekaligus (1 klik = 2 aksi) |

---

## 1. Overview / Motivation

Inspector panel sebelumnya satu panel panjang yang scroll. Tidak scalable.

**Solusi:** Adopt pola **Blender N-Panel** — inspector jadi tab-based vertikal.
User gonta-ganti tab tanpa kehilangan konteks.

Tambahan: tab Sequence bisa buka CSV Editor full-featured → layout jadi 3-column split.

---

## 2. Inspector Panel — N-Tab Vertical Design

### 2.1 Tab Strip — Visual & CSS

Tab strip adalah kolom kiri dari inspector panel. Setiap tab adalah tombol vertikal dengan teks yang **dirotate 90 derajat searah jarum jam**.

**BUKAN** seperti ini (huruf ditumpuk vertikal):
```
R
o
o
m
```

**TAPI** seperti ini (satu kata dirotate, dibaca atas ke bawah):
```
+----+
|Room| <- kata "Room" dirotate 90deg CW, R di atas, m di bawah
+----+
```

**CSS Implementation:**
```css
.tab-label {
  writing-mode: vertical-lr;
  text-orientation: mixed;
  transform: rotate(0deg);   /* writing-mode: vertical-lr sudah cukup */
  /* hasilnya: teks horizontal dirotate jadi baca dari atas ke bawah */
}
```

**Full Tab Strip Visual:**
```
+------+----------------------------------+
| Room | [konten tab aktif di sini]       |
|      |                                  |
|  D   |  mis: jika Tab Room aktif:       |
|  i   |  Name:  [Living Room]            |
|  s   |  Width: [5.00] m                 |
|  p   |  Depth: [4.00] m                 |
|  l   |  ...                             |
|  a   |                                  |
|  y   |                                  |
+------+                                  |
|  O   |                                  |
|  b   |                                  |
|  j   |                                  |
|  e   |                                  |
|  c   |                                  |
|  t   |                                  |
+------+                                  |
|  S   |                                  |
|  e   |                                  |
|  q   |                                  |
+------+----------------------------------+
   ^                  ^
tab strip         konten panel
(~32px wide)     (sisa width)
```

> Note: "Room" tab aktif di atas, ditampilkan full label. Tab lain (Display, Object, Seq) teks dirotate vertikal dengan writing-mode.
> Tab aktif: border kiri tebal + background highlight.

### 2.2 Tab List

| # | Label               | Ikon | Konten |
|---|---------------------|------|--------|
| 1 | Room                | 🏠   | Layout specs ruangan |
| 2 | Display             | 🖥️   | Viewport, render, kamera, lighting |
| 3 | Object              | 📦   | Selected object inspector |
| 4 | Sequence            | 🎬   | Fitting Interior — CSV animation |

- Active tab: border kiri 3px accent color + bg highlight
- Inactive tab: muted color, hover effect
- Tab state persist — tidak reset saat re-render

---

## 3. Tab Content Detail

### 3.1 Tab — Room

```
+--- Room -------------------------+
| Name:        [Living Room      ] |
| Width:       [5.00  ] m          |
| Depth:       [4.00  ] m          |
| Height:      [2.80  ] m          |
|                                  |
| Door                             |
|   Position X: [0.5]             |
|   Position Y: [0.0]             |
|   Width:      [1.0] m           |
|                                  |
| Window                           |
|   Position X: [2.0]             |
|   Width:      [1.5] m           |
|                                  |
| [ Re-solve Layout ]  [ Reset ]  |
+----------------------------------+
```

---

### 3.2 Tab — Display

```
+--- Display Setting --------------+
| Background:  [████] color picker |
| Grid:        [ ON ] [ OFF ]      |
| Shadows:     [ ON ] [ OFF ]      |
| Labels:      [ ON ] [ OFF ]      |
| Wireframe:   [ ON ] [ OFF ]      |
| Camera FOV:  [ 60 ] deg          |
|                                  |
| Theme:  [ Dark ]  [ Light ]      |
+----------------------------------+
```

---

### 3.3 Tab — Object

Context-sensitive, berubah sesuai object yang dipilih di 3D:

```
+--- Object -----------------------+
| Name:    [ Sofa 2-seater       ] |
| Type:    Furniture               |
|                                  |
| Transform                        |
|   Pos X:  [ 2.50 ] m            |
|   Pos Y:  [ 1.00 ] m            |
|   Rot:    [  0   ] deg           |
|                                  |
| Bounding Box                     |
|   W: 2.00m   D: 0.90m           |
|                                  |
| Status: [OK] No collision        |
|                                  |
| [ Rotate 90 ]  [ Delete ]       |
+----------------------------------+
```

Jika tidak ada yang dipilih:
```
+--- Object -----------------------+
|                                  |
|   (No object selected)           |
|   Click an object in the         |
|   3D viewport to inspect.        |
|                                  |
+----------------------------------+
```

---

### 3.4 Tab — Sequence

Summary + tombol explicit buka CSV Editor:

```
+--- Sequence ---------------------+
| Total Steps:  6                  |
| Total Duration: 12.0s            |
|                                  |
| [ > Open CSV Editor ]           |
|                                  |
| Playback                         |
| [ Play ]  [ Stop ]  [ Reset ]   |
|                                  |
| [ Export CSV ]                  |
| [ Copy Prompt ]                 |
+----------------------------------+
```

Click **"Open CSV Editor"** → layout shift ke 3-column mode.
Click **"Export CSV"** → save file + copy clipboard sekaligus.
Click **"Copy Prompt"** → copy 2-format ke clipboard.

---

## 4. Layout Mode: Normal vs 3-Column CSV Editor

### Normal Mode (CSV Editor tertutup)

```
+---+------+-----------------+---+----------+
|   |      |                 |   |          |
|   | 3D   |                 |TAB| Inspector|
|   | View |                 |str| content  |
|   |      |                 |ip |          |
|   |      |                 |   |          |
+---+------+-----------------+---+----------+
```

### 3-Column Mode (CSV Editor terbuka)

```
+---+--------------------------+--------+----------------------+
|   |                          |        |                      |
|TAB|   3D VIEWPORT            | INSP.  |   CSV EDITOR         |
|str|   (sequence overlay)     | TABS   |   (Tablite-style)    |
|ip |                          | + body |                      |
|   |                          |        |                      |
|   |          52%             |min(400px,18vw)|    ~40%       |
+---+--------------------------+--------+----------------------+
```

- **Left 52%:** 3D Viewport tetap aktif
- **Center `min(400px, 18vw)`:** N-Tab Inspector (compact)
- **Right sisa (~40%):** Sequence CSV Editor

Transition masuk/keluar: CSS transition 200ms pada `grid-template-columns`.

Keluar: tombol `[X Close Editor]` di header CSV panel → kembali ke normal mode.

---

## 5. Sequence CSV Editor — Full Spec

### 5.1 CSV Schema

```csv
step_id,object_id,object_name,start_pos_x,start_pos_y,start_rot,end_pos_x,end_pos_y,end_rot,duration_s,easing,notes
1,sofa_01,Sofa 2-seat,0,0,0,2.5,1.0,0,2.0,ease-in-out,Enter from door
2,table_01,Coffee Table,0,-5,0,2.5,2.5,0,1.5,linear,Slide from south
3,chair_01,Armchair A,5,0,270,4.0,1.0,0,2.0,ease-out,Rotate while moving
```

### 5.2 Kolom Wajib

| Kolom       | Tipe   | Keterangan                                |
|-------------|--------|-------------------------------------------|
| step_id     | number | Urutan step, auto-increment               |
| object_id   | string | ID unik object di scene                   |
| object_name | string | Nama display                              |
| start_pos_x | number | Posisi awal X (meter)                     |
| start_pos_y | number | Posisi awal Y (meter)                     |
| start_rot   | number | Rotasi awal (derajat)                     |
| end_pos_x   | number | Target posisi X                           |
| end_pos_y   | number | Target posisi Y                           |
| end_rot     | number | Target rotasi                             |
| duration_s  | number | Durasi step (detik)                       |
| easing      | string | linear / ease-in / ease-out / ease-in-out |
| notes       | string | Catatan opsional                          |

### 5.3 CSV Editor Toolbar

```
+-------------------------------------------------------------------------------+
| [Play] [Stop] [Reset]  |  Steps: 6  Total: 12.0s  |  [Copy Prompt] [Export]  |
|                                                                                |
| Live Sync: [ OFF | ON ]   [ Save Animation  *3 changes ]                      |
+-------------------------------------------------------------------------------+
```

### 5.4 Fitur CSV Editor (port dari SQLSeal/Tablite)

- Cell editing — dbl-click to edit, Enter/Tab navigate
- Row operations — insert, delete, move (drag grip ⋮⋮)
- Column operations — resize handle, reorder drag & drop
- Multi-select — shift+click row, drag selection on cells
- Copy/Paste — Ctrl+C/V (TSV + CSV clipboard)
- Find & Replace — Ctrl+F / Ctrl+H
- Sort & Filter — per-column dropdown
- Undo/Redo — Ctrl+Z / Ctrl+Y (stack-based)
- Column type inference — number, date, string
- Calculation row — SUM, AVG, COUNT, MIN, MAX (sticky tfoot)
- Frozen columns — step_id + object_name pinned kiri
- Progressive loading — virtual scroll untuk banyak rows

### 5.5 Live Sync Toggle (Edit Cell Mode)

**Toggle ON — Autosave / Live Sync:**
- Setiap edit cell langsung update SequenceStore
- 3D viewport langsung reflect perubahan
- Preview realtime saat drag nilai position
- Badge: `[Live Sync: ON]` (hijau)

**Toggle OFF — Manual Save:**
- Edit bebas di CSV tanpa affect viewport
- Changes di-queue sebagai pending
- Badge: `[Live Sync: OFF] [Save Animation *N changes]` (abu + warning badge)
- Tombol **[Save Animation]** flush semua pending ke store + sync 3D
- Cocok untuk draft editing sebelum commit

---

## 6. Copy Prompt — 2 Format CSV

Satu klik **[Copy Prompt]** → clipboard berisi kedua format dipisah `---`:

```
[FORMAT 1 — AI PROMPT]
You are a furniture layout animation assistant.
Animate the following objects in sequence for a room layout fitting:

step_id,object_id,object_name,start_pos_x,start_pos_y,start_rot,end_pos_x,end_pos_y,end_rot,duration_s,easing
1,sofa_01,Sofa 2-seat,0,0,0,2.5,1.0,0,2.0,ease-in-out
2,table_01,Coffee Table,0,-5,0,2.5,2.5,0,1.5,linear
3,chair_01,Armchair A,5,0,270,4.0,1.0,0,2.0,ease-out

Room: 5.0m x 4.0m x 2.8m | Objects: 3 | Total Duration: 12.0s

---

[FORMAT 2 — RAW CSV]
step_id,object_id,object_name,start_pos_x,start_pos_y,start_rot,end_pos_x,end_pos_y,end_rot,duration_s,easing,notes
1,sofa_01,Sofa 2-seat,0,0,0,2.5,1.0,0,2.0,ease-in-out,Enter from door
2,table_01,Coffee Table,0,-5,0,2.5,2.5,0,1.5,linear,Slide from south
3,chair_01,Armchair A,5,0,270,4.0,1.0,0,2.0,ease-out,Rotate while moving
```

---

## 7. Export CSV — 2 Aksi 1 Klik

Satu klik **[Export CSV]**:

1. **Browser download dialog** → file: `sequence_{room_name}_{YYYYMMDD_HHmm}.csv`
2. **Auto-copy to clipboard** → raw CSV sekaligus ter-copy

User tidak perlu dua kali klik.

---

## 8. State & Data Flow

```
SequenceStore (zustand / useState)
    |
    +-- rows: SequenceStep[]
    +-- isEditorOpen: boolean           <- toggle 3-column layout
    +-- playbackState: idle/playing/paused
    +-- currentStep: number             <- highlighted saat playback
    +-- liveSyncEnabled: boolean        <- toggle autosave
    +-- pendingChanges: number          <- count unsaved (saat sync OFF)
    |
    +-- CSV Editor (2-way bind ke rows)
    |       onCellUpdate:
    |           liveSyncEnabled = true  -> update rows -> sync 3D
    |           liveSyncEnabled = false -> queue pending
    |
    +-- [Save Animation] button
    |       -> flush pendingChanges -> update rows -> sync 3D viewport
    |
    +-- 3D Viewport BabylonJS
            reads rows untuk playback animation
            highlight object pada currentStep saat playing
```

---

## 9. Visual Design Notes

### N-Tab Strip

```css
.ntab-strip {
  display: flex;
  flex-direction: column;
  width: 32px;
  border-right: 1px solid var(--border);
}

.ntab-item {
  writing-mode: vertical-lr;   /* teks dirotate, baca atas ke bawah */
  text-orientation: mixed;
  padding: 12px 6px;
  cursor: pointer;
  border-left: 3px solid transparent;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.ntab-item.active {
  border-left-color: var(--accent);
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.ntab-item:not(.active) {
  color: var(--text-muted);
}

.ntab-item:hover:not(.active) {
  background: var(--bg-hover);
  color: var(--text-secondary);
}
```

### 3-Column Layout CSS

```css
.app-layout {
  display: grid;
  transition: grid-template-columns 200ms ease;
}

/* Normal mode */
.app-layout.normal {
  grid-template-columns: 1fr min(400px, 18vw);
  /* [3D viewport]  [inspector] */
}

/* CSV Editor mode */
.app-layout.csv-editor-open {
  grid-template-columns: 52fr min(400px, 18vw) 40fr;
  /* [3D viewport] [inspector] [CSV editor] */
}
```

---

## 10. Apa yang TIDAK Berubah di v06

- Core 3D viewport / BabylonJS engine
- Solver / placement algorithm
- Hasil List / Entry Sequence sidebar
- v05 Catalog bottom panel

---

## 11. Files Estimasi (DONOT CODE YET)

| File | Action | Keterangan |
|------|--------|------------|
| src/components/InspectorPanel.tsx | Modify | Wrap jadi N-Tab container |
| src/components/NTabStrip.tsx | Create | Tab strip vertical component |
| src/components/tabs/RoomTab.tsx | Create | Tab Room |
| src/components/tabs/DisplayTab.tsx | Create | Tab Display Setting |
| src/components/tabs/ObjectTab.tsx | Create | Tab Object Inspector |
| src/components/tabs/SequenceTab.tsx | Create | Tab Sequence summary + open button |
| src/components/SequenceCSVEditor/App.tsx | Create | Main CSV editor wrapper |
| src/components/SequenceCSVEditor/Table.tsx | Create | Grid (port Tablite Table.tsx) |
| src/components/SequenceCSVEditor/Cell.tsx | Create | Cell edit (port Tablite Cell.tsx) |
| src/components/SequenceCSVEditor/Toolbar.tsx | Create | Toolbar + live sync toggle |
| src/components/SequenceCSVEditor/types.ts | Create | SequenceStep, ColumnConfig |
| src/store/sequenceStore.ts | Create | State management |
| src/App.tsx | Modify | Grid layout toggle normal/3-column |
| src/styles/ntab.css | Create | writing-mode vertical tab styling |
| src/styles/sequence-editor.css | Create | CSV editor styles |

---

## 12. Summary — Final State v06

| Feature | Spec |
|---------|------|
| Inspector | N-Tab vertical, 4 tabs |
| Tab teks | `writing-mode: vertical-lr`, dibaca atas ke bawah, kata tidak ditumpuk |
| Tab aktif | Border kiri accent + bg highlight |
| Center panel | `min(400px, 18vw)` |
| CSV Editor buka | Via tombol di tab Sequence, tidak auto |
| Layout saat CSV buka | 52% / min(400px,18vw) / ~40% |
| Live Sync | Toggle ON=autosave, OFF=manual save + badge |
| Copy Prompt | 2 format (AI prompt + raw CSV) dipisah `---` |
| Export CSV | 1 klik = file download + clipboard |

**BRIEF FINAL COMPLETE — siap gas code.**

---

*End of v06 Brief — Pack & Place — v06_blender-ntab-inspector-sequence-csv-editor.md*
