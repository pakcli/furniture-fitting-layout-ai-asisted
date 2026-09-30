# v02 · AI-IDE Overview Take
## Pack & Place — Furniture Fitting & Moving Planner

> **Date:** 2026-09-30
> **Source:** Synthesized from v01 (AI chat draft)
> **Purpose:** Build-ready brief for the IDE coding session

---

## 0. The Real Problem (Reframe from v01 tail)

v01 started as a "fit-checker" but the owner's final words reframe it completely:

> *"I wanted to make movement so logistic — one done deal instead of multiple hourly or multiple movement instances and ambiguity about what is the desired and available layout and fitting."*

**This is not a layout checker. This is a single-trip moving plan generator.**

The product answers three ambiguities at once, before the moving day:

| Ambiguity Layer | Question | What the app resolves |
|---|---|---|
| **Desired** | What layout do I actually want? | Priority-ranked wish list (must / prefer / sacrifice) |
| **Available** | What space, route, vehicle do I have? | Room, corridor, door, truck capacity inputs |
| **Possible** | Will it work on the day? | Solver produces one feasible plan or fails fast with a fix |

**Output is one locked document**, not a "try and see" tool:
- Final layout
- Load order (truck → room, reversed)
- Transport mode per item (whole / doors off / flat-pack)
- Headcount + time estimate
- Confidence level per measurement ("±3 cm — re-measure this corridor")

---

## 1. Product Identity

| | |
|---|---|
| **Name** | Pack & Place |
| **Tagline** | *One plan. One trip. No surprises.* |
| **Core metaphor** | Parking game meets logistics solver |
| **UI feel** | Arcade (red/green flashes) + logistics checklist |
| **Out of scope** | Decoration, textures, shopping catalog, photo-realistic render |

---

## 2. Key Differentiators vs. Existing Apps

| Existing apps | What they do | Gap |
|---|---|---|
| Smart Moving, Furniture Fit Calculator | "Will this sofa fit through the door?" — single object check | No full-room multi-item ordering |
| Napkin Plan, Layoutr | Drag-and-drop layout on floor plan | No pathfinding, no entry ordering |
| Moving Out (game) | Fun reference, not a planner | Not real-size, no data output |

**What Pack & Place adds that nothing else does:**
1. **Dependency ordering** — who blocks whom → topological sort → entry sequence
2. **Fragile component rules** — separate bounding boxes per transport packet, facing constraints
3. **Assembly space reservation** — flat-pack needs floor area before room fills up
4. **Isometric playback** — animated step-by-step, stall points highlighted in red
5. **Single locked plan output** — a printable day-of checklist, not a "what-if" explorer

---

## 3. Architecture Decision Summary

### 3.1 Rendering
- **Engine:** Babylon.js (preferred) or Three.js
- **Camera:** Orthographic, ~35° elevation, 45° rotation (true isometric)
- **All logic runs in browser** — no mandatory backend for MVP
- **Visual style:** Low-poly pastel boxes, wireframe outlines, no textures

### 3.2 Collision / Fit System
- **Representation:** OBB (Oriented Bounding Box) per furniture item
- **Collision detection:** Separating Axis Theorem (SAT) — NOT `intersectsMesh`, which is inaccurate for rotated boxes
- **Clearance zones:** Invisible OBB extensions (e.g. wardrobe: +60 cm front). Clearance may overlap walkways but NOT other furniture
- **Walkway minimum:** 60 cm default (user-adjustable)
- **Snap:** to walls and other furniture within 5 cm radius; 5 cm grid

### 3.3 Pathfinding
- **Algorithm:** A\* on state space `(x, y, rotation)`
- **Grid resolution:** 5 cm, 15° rotation increments
- **Agent size:** The furniture bounding box itself (corners matter at turns)
- **Movements allowed:** translate, rotate, tilt/stand (if enabled per item)
- **Transport packets:** Each detached component = separate A\* agent

### 3.4 Ordering (Dependency Graph)
```
For each furniture item:
  run A* from door → final position
  record which other items block the path

Build directed graph:
  edge A → B means "A must enter before B"

Topological sort → entry sequence

If cycle detected:
  → layout is INFEASIBLE
  → this is the most valuable output (tell user exactly why)
```

Tie-breakers: deepest in room first, largest/heaviest first, needs assembly-space first.

### 3.5 Solver Output (the "One Plan")
```
Result is one of three:
  FULL FIT      → all priorities met
  COMPROMISE    → missing items are lowest-priority ones
  IMPOSSIBLE    → specific reason + minimum fix required
                  ("Wardrobe blocked at corridor turn, 4 cm short")
```

---

## 4. Data Model (Key Structures)

### 4.1 Room
```json
{
  "walls": [ { "x1": 0, "y1": 0, "x2": 300, "y2": 0 } ],
  "doors": [ { "position": [0, 85], "width": 80, "height": 200 } ],
  "corridors": [ { "width": 85, "turns": [ { "angle": 90, "radius": 0 } ] } ],
  "ceiling_height": 240,
  "walkway_min": 60
}
```

### 4.2 Furniture Item
```json
{
  "id": "wardrobe_01",
  "name": "Wardrobe 2-door",
  "assembled": { "w": 100, "d": 55, "h": 200 },
  "clearance": { "front": 60 },
  "can_tilt": true,
  "priority": "must",
  "components": [ "..." ]
}
```

### 4.3 Component (inside furniture)
```json
{
  "name": "Glass door",
  "qty": 2,
  "dim": [48, 2, 195],
  "weight_kg": 9,
  "fragile": true,
  "fragile_faces": ["front", "back"],
  "detachable": "yes",
  "allowed_orientations": ["upright"],
  "max_tilt_deg": 15,
  "padding_cm": 3,
  "reassembly_risk": "warranty void"
}
```

**Two bounding boxes, two states:**

| State | Used for | Bounding box |
|---|---|---|
| **Assembled** | Final layout, fit check, clearance | One whole box — never changes |
| **Transport** | Pathfinding each packet | One box per detached packet; fragile box = dim + padding all sides |

---

## 5. UI Layout (3-Panel)

```
+-----------------------------------------------------+
|  [LEFT]             [CENTER]             [RIGHT]     |
|  Furniture table    Isometric viewport   Results     |
|  - name, dims       - drag & drop        - Verdict   |
|  - priority         - red/green/yellow   - Issues    |
|  - components       - fragile cyan       - Sequence  |
|  - add / import     - clearance dashed   - Fixes     |
+-----------------------------------------------------+
|  [BOTTOM] Step slider:                               |
|  < [Step 1: Wardrobe] → [Step 2: Mattress] → ... >  |
+-----------------------------------------------------+
```

**Visual feedback rules:**
- Green = valid position
- Red = collision (label: "overlap 3 cm")
- Yellow = fits but clearance zone violated
- Cyan edge = fragile face
- Orange flashing = collision on fragile face (+ crack icon) — higher severity than red

**Playback animation:** item slides from door along A\* path, rotates at turns, freezes red at stall point.

---

## 6. Phased Build Plan

| Phase | Scope | Definition of Done |
|---|---|---|
| **MVP** | Manual room draw, box furniture, drag + OBB collision, red/green/yellow feedback | Drag feels smooth ≥60 fps with 15 items |
| **Phase 2** | Corridor/door/stair input, A\* pathfinding, feasibility verdict | Single-item pathfinding < 1 sec |
| **Phase 3** | Dependency graph, entry ordering, assembly space, playback, fragile+detachable | Every "infeasible" has a human-readable reason |
| **Phase 4** | Photo/360° tracing, LLM text→data, truck capacity, locked plan export | Printable one-page plan output |

---

## 7. LLM Role (Narrow, Phase 4)

> Most of this product is **deterministic algorithms, not AI**.

LLM is used only for:
1. **Text → data:** "3-seat sofa 210x90x85" → structured JSON row
2. **Plain-language explanation:** translate verdict into "the wardrobe won't make it around the hallway corner, it's 4 cm too wide"
3. **Layout alternatives:** suggest swap if user's wish is infeasible

**AI does NOT do pathfinding or dependency resolution.** Those are A\* and graph algorithms.

---

## 8. Success Criteria (from v01)

- [ ] Drag at ≥ 60 fps with ≥ 15 furniture items
- [ ] A\* pathfinding for one item < 1 second on typical home layout
- [ ] Every "infeasible" verdict has a specific, plain-language reason
- [ ] No plan ever puts a fragile face against a wall or object, or tilts glass beyond max angle
- [ ] If components are detached, final assembled layout is still valid and assembly space is accounted for

---

## 9. Open Questions for Builder

| # | Question | Impact |
|---|---|---|
| 1 | Babylon.js or Three.js? | Bounding box helpers differ; Babylon has built-in OBB support |
| 2 | State management? | Zustand / Jotai / vanilla store — needed for undo/redo of layout |
| 3 | A\* library or custom? | `pathfinding.js` is 2D only; may need custom 3-state (x, y, rot) |
| 4 | Room polygon format? | Simple rect for MVP vs. arbitrary polygon for Phase 2 |
| 5 | Truck capacity input scope? | Required for "one trip" guarantee — when does it enter? |
| 6 | Export format for locked plan? | PDF? JSON? Printable HTML? |
| 7 | Mobile support priority? | Touch drag + pinch zoom from day 1 or desktop-first? |

---

## 10. One-Sentence Build Brief for AI Pair Programming

> Build a **browser-based isometric furniture placement simulator** that takes a room polygon + furniture list with priorities, runs **SAT collision detection** and **A\* pathfinding** per item, computes a **topological dependency order**, and outputs a **single locked moving plan** (layout + entry sequence + transport mode + assembly slots) with red/green/yellow arcade-style feedback and an animated playback slider.
