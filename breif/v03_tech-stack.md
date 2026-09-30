# v03 · Tech Stack Decision
## Pack & Place — Furniture Fitting & Moving Planner

> **Date:** 2026-09-30
> **Depends on:** v02 (architecture decisions)
> **Purpose:** Concrete library/tool choices per layer, with rationale

---

## TL;DR — Stack at a Glance

```
Language      TypeScript
Bundler       Vite
UI Framework  React 18
3D Engine     Babylon.js  (not Three.js — see §1)
State         Zustand
Pathfinding   Custom A* (x, y, rot) — no library fits
Graph         graphlib  (topological sort)
UI/CSS        Vanilla CSS  (custom design system, dark mode)
Export        jsPDF + html2canvas
Testing       Vitest + Babylon.js NullEngine
Hosting       Static (Vercel / Netlify / GitHub Pages)
Backend       None in MVP — all browser-side
```

---

## 1. 3D Engine: Babylon.js ✅ (not Three.js)

### Decision: **Babylon.js**

| Criterion | Babylon.js | Three.js |
|---|---|---|
| OBB / SAT built-in | ✅ `BoundingBox` + `Mesh.intersects` with OBB option | ❌ Must implement SAT from scratch |
| TypeScript first | ✅ Native TS, great autocomplete | ⚠️ TS types via `@types/three` (community) |
| Isometric camera | ✅ `ArcRotateCamera` + orthographic mode 1-liner | ✅ Same via `OrthographicCamera` |
| Drag interaction | ✅ `PointerDragBehavior` built-in | ⚠️ Need `three-mesh-bvh` / custom raycaster |
| Debug layer | ✅ Built-in inspector (toggle with Ctrl+Alt+I) | ❌ Third-party (drei, leva) |
| Community / docs | ✅ Excellent official docs, playground | ✅ Larger community |
| Bundle size (gzip) | ~250 KB tree-shaken | ~160 KB tree-shaken |

**Why it wins here:** SAT/OBB is the entire fit-check engine. Babylon having it built-in saves ~200 lines of critical math. The extra ~90 KB is worth it.

> **Note:** Do NOT use React Three Fiber (R3F). It adds abstraction overhead that makes
> fine-grained OBB + drag control harder to debug. Use Babylon.js directly inside
> a React `useEffect` canvas ref.

---

## 2. Language & Bundler

| Choice | Rationale |
|---|---|
| **TypeScript** | Complex data structures (OBB, component graph, A* nodes) — types prevent runtime logic bugs |
| **Vite** | HMR is fast; Babylon.js tree-shakes well with Vite's Rollup; `vite.config.ts` is trivial |
| **Node 20+** | LTS, matches Vite 5 requirements |

```bash
npm create vite@latest pack-and-place -- --template react-ts
cd pack-and-place
npm install @babylonjs/core @babylonjs/gui
```

---

## 3. UI Framework: React 18

**Use React for all panels except the 3D canvas.**

```
React manages:
  - Furniture table (left panel)
  - Results / verdict (right panel)
  - Step slider (bottom)
  - Modals, tooltips, form inputs

Babylon.js manages:
  - Canvas (center)
  - All 3D mesh creation, drag, collision highlight
  - Playback animation loop

Bridge: a Zustand store that both sides read/write
```

**Why not Svelte / Vue?**
React ecosystem (Zustand, react-hook-form, react-pdf) is better suited here. Not a performance-critical choice — panels are light DOM.

---

## 4. State Management: Zustand

```ts
// store shape (simplified)
interface AppStore {
  room: RoomPolygon
  furniture: FurnitureItem[]
  plan: SolverPlan | null
  playbackStep: number
  setRoom: (r: RoomPolygon) => void
  addFurniture: (f: FurnitureItem) => void
  runSolver: () => void
  setPlaybackStep: (n: number) => void
}
```

**Why Zustand over Redux / Jotai:**
- No boilerplate — `set()` mutations work like Immer
- Non-React subscribers: Babylon.js scene can subscribe to store changes directly without hooks
- Undo/redo: `zustand/middleware` `temporal` plugin (one import)

---

## 5. Pathfinding: Custom A* (critical — no library works)

### Why no library fits

| Library | Problem |
|---|---|
| `pathfinding.js` | 2D grid only, no rotation dimension |
| `astar-typescript` | Same — no rotation |
| Planning.js | Too heavy, SAT domain language |

### State space definition

```ts
type AStarNode = {
  x: number       // cm, snapped to 5 cm grid
  y: number       // cm, snapped to 5 cm grid
  rot: number     // degrees, snapped to 15° increments
}
```

A node is valid if: the furniture OBB at (x, y, rot) does not overlap walls, blocked furniture, or violate fragile face rules.

### Heuristic

```ts
// Weighted Euclidean + rotation penalty
h = sqrt((dx/5)² + (dy/5)²) + abs(dRot / 15) * 0.5
```

### Neighbors per node: 8 translations × 3 rotations = 24 per step max

Keep open set as a **min-heap** (use `@datastructures-js/priority-queue`).

---

## 6. Dependency Graph: graphlib

```bash
npm install graphlib
npm install --save-dev @types/graphlib
```

```ts
import { Graph, alg } from 'graphlib'

const g = new Graph({ directed: true })
furniture.forEach(f => g.setNode(f.id))

// after pathfinding each item:
// if item B's path is blocked by item A in its final position:
g.setEdge(a.id, b.id)  // A must enter before B

const order = alg.topsort(g)   // throws if cycle → INFEASIBLE
```

`graphlib` is ~15 KB, well-tested, exactly what's needed.

---

## 7. CSS: Vanilla CSS (Custom Design System)

No Tailwind, no component lib. Reasons:
- 3D canvas needs precise pixel control; utility classes fight with that
- The "arcade + logistics" aesthetic is custom enough that a design system built from scratch is faster than fighting Bootstrap/MUI defaults

### Design tokens
```css
:root {
  --color-bg:       #0f1117;
  --color-surface:  #1a1d27;
  --color-border:   #2a2d3a;
  --color-green:    #22c55e;
  --color-red:      #ef4444;
  --color-yellow:   #eab308;
  --color-cyan:     #06b6d4;
  --color-orange:   #f97316;
  --font-mono:      'JetBrains Mono', monospace;
  --font-ui:        'Inter', sans-serif;
  --grid:           5cm;   /* mirrored in JS as SNAP_CM = 5 */
}
```

Google Fonts: `Inter` (panels) + `JetBrains Mono` (numbers, dimensions, verdicts).

---

## 8. Export: jsPDF + html2canvas

```bash
npm install jspdf html2canvas
```

**Locked Plan output (Phase 4):**

```ts
// Render the results panel to canvas, embed in PDF
const canvas = await html2canvas(document.getElementById('results-panel'))
const pdf = new jsPDF('p', 'mm', 'a4')
pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, 190, 0)
pdf.save('pack-and-place-plan.pdf')
```

Also export raw JSON (one `JSON.stringify(store.plan)` call — free).

---

## 9. Testing

| Tool | What it tests |
|---|---|
| **Vitest** | Unit: OBB SAT math, A* correctness, topological sort, fragile rules |
| **Babylon.js NullEngine** | Render-free scene: mesh creation, collision detection, without a GPU |
| **Playwright** (Phase 2+) | E2E: drag a wardrobe, expect red verdict, step slider |

```ts
// NullEngine test example
import { NullEngine, Scene, MeshBuilder } from '@babylonjs/core'

test('two boxes collide', () => {
  const engine = new NullEngine()
  const scene = new Scene(engine)
  const a = MeshBuilder.CreateBox('a', { width: 1, height: 1, depth: 1 }, scene)
  const b = MeshBuilder.CreateBox('b', { width: 1, height: 1, depth: 1 }, scene)
  b.position.x = 0.5  // overlapping
  expect(a.intersectsMesh(b, false)).toBe(true)
})
```

---

## 10. Folder Structure

```
pack-and-place/
├── src/
│   ├── engine/            # Babylon.js scene, camera, drag, highlight
│   │   ├── scene.ts
│   │   ├── furniture-mesh.ts
│   │   └── playback.ts
│   ├── solver/            # Pure logic, no 3D deps
│   │   ├── obb-sat.ts     # SAT collision math
│   │   ├── astar.ts       # Pathfinding (x, y, rot)
│   │   ├── dependency.ts  # graphlib wrapper
│   │   └── planner.ts     # orchestrates solver → plan
│   ├── store/
│   │   └── app-store.ts   # Zustand store
│   ├── components/
│   │   ├── FurnitureTable.tsx
│   │   ├── ResultsPanel.tsx
│   │   ├── StepSlider.tsx
│   │   └── RoomDrawer.tsx
│   ├── types/
│   │   └── index.ts       # RoomPolygon, FurnitureItem, Component, Plan
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── obb-sat.test.ts
│   ├── astar.test.ts
│   └── planner.test.ts
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

**Key rule:** `solver/` must have **zero imports from `engine/`** or React. It's pure TypeScript. This means the entire logic core is testable with Vitest alone, no DOM, no canvas.

---

## 11. Dev Environment

```bash
# Start dev server (HMR)
npm run dev

# Run unit tests (watch mode)
npx vitest

# Type check only
npx tsc --noEmit

# Build
npm run build
```

No Docker, no backend, no database for MVP. It's a pure static app.

---

## 12. Phase 4 Additions (not now, but plan for them)

| Addition | Library |
|---|---|
| LLM text → furniture JSON | Gemini API / OpenAI API — thin fetch wrapper |
| 360° photo viewer | `photo-sphere-viewer` (MIT) |
| ARKit / ARCore room scan import | Magicplan API (3rd party) or native file import |
| Truck packing (3D bin packing) | Custom — use First Fit Decreasing heuristic |

---

## 13. What NOT to add

| Temptation | Why skip it |
|---|---|
| Physics engine (Cannon.js, Havok) | Overkill — static placement only, no gravity simulation needed |
| Three.js alongside Babylon.js | Never mix renderers in one project |
| Tailwind | Arcade UI needs custom tokens; Tailwind purge causes unexpected behavior with dynamic classes |
| Redux Toolkit | Zustand is sufficient; RTK adds 40 KB and boilerplate |
| WebGL2 custom shaders | Low-poly pastel boxes need zero custom shaders |
| IndexedDB / localStorage auto-save | Nice to have, Phase 2 — don't engineer it in MVP |

---

## 14. Dependency Summary (MVP)

```json
{
  "dependencies": {
    "@babylonjs/core": "^7.x",
    "@babylonjs/gui": "^7.x",
    "@datastructures-js/priority-queue": "^6.x",
    "graphlib": "^2.x",
    "jspdf": "^2.x",
    "html2canvas": "^1.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "zustand": "^4.x"
  },
  "devDependencies": {
    "@types/graphlib": "^2.x",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "typescript": "^5.x",
    "vite": "^5.x",
    "vitest": "^1.x",
    "playwright": "^1.x"
  }
}
```

**Total production bundle estimate (gzip):** ~320 KB (Babylon core ~250 + React 18 ~45 + Zustand ~3 + graphlib ~15 + rest ~10)

---

## Decision Log

| Question (from v02 §9) | Decision | Reason |
|---|---|---|
| Babylon.js or Three.js? | **Babylon.js** | Built-in OBB, PointerDragBehavior, inspector |
| State management? | **Zustand** | Non-React subscribers, temporal undo, minimal boilerplate |
| A* library or custom? | **Custom** | State space is (x, y, rot) — no library supports this |
| Room polygon format? | **Polygon array of points** (MVP: rect shorthand) | Extensible to arbitrary shapes for Phase 2 |
| Truck capacity scope? | **Phase 2** — input exists, solver uses it in ordering | Not MVP blocking |
| Export format? | **PDF + JSON** | PDF = printable day-of checklist; JSON = data portability |
| Mobile first? | **Desktop-first MVP**, touch support Phase 2 | Drag precision on small screens needs extra work |
