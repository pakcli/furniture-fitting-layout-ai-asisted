/**
 * OBB / SAT Collision Detection
 * Works on 2D (x, y, rotation) — furniture is a rectangle at a given rotation.
 * Uses Separating Axis Theorem (SAT).
 */

export interface OBB2D {
  cx: number   // center x (cm)
  cy: number   // center y (cm)
  hw: number   // half-width  (cm)
  hd: number   // half-depth  (cm)
  rot: number  // rotation degrees
}

export interface HallwayZone {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Get the 4 corners of an OBB in world space */
export function obbCorners(obb: OBB2D): [number, number][] {
  const r = degToRad(obb.rot)
  const cos = Math.cos(r)
  const sin = Math.sin(r)
  const { cx, cy, hw, hd } = obb
  const corners: [number, number][] = [
    [cx + cos * hw - sin * hd, cy + sin * hw + cos * hd],
    [cx - cos * hw - sin * hd, cy - sin * hw + cos * hd],
    [cx - cos * hw + sin * hd, cy - sin * hw - cos * hd],
    [cx + cos * hw + sin * hw - cos * hd, cy + sin * hw - cos * hd], // wait, correct corner below:
  ]
  return [
    [cx + cos * hw - sin * hd, cy + sin * hw + cos * hd],
    [cx - cos * hw - sin * hd, cy - sin * hw + cos * hd],
    [cx - cos * hw + sin * hd, cy - sin * hw - cos * hd],
    [cx + cos * hw + sin * hd, cy + sin * hw - cos * hd],
  ]
}

/** Get the 2 axes to test for an OBB (the local x and y axes) */
function obbAxes(obb: OBB2D): [number, number][] {
  const r = degToRad(obb.rot)
  return [
    [Math.cos(r), Math.sin(r)],
    [-Math.sin(r), Math.cos(r)],
  ]
}

/** Project corners onto an axis, return [min, max] */
function project(corners: [number, number][], axis: [number, number]): [number, number] {
  const dots = corners.map(([x, y]) => x * axis[0] + y * axis[1])
  return [Math.min(...dots), Math.max(...dots)]
}

/** Check if two 1D intervals overlap */
function intervalsOverlap([aMin, aMax]: [number, number], [bMin, bMax]: [number, number]): boolean {
  return aMax >= bMin && bMax >= aMin
}

/** Overlap depth on this axis (positive = overlap, negative = gap) */
function overlapDepth([aMin, aMax]: [number, number], [bMin, bMax]: [number, number]): number {
  return Math.min(aMax, bMax) - Math.max(aMin, bMin)
}

export interface SATResult {
  overlapping: boolean
  penetrationCm: number  // 0 if not overlapping
}

/** Full SAT test between two OBBs */
export function satTest(a: OBB2D, b: OBB2D): SATResult {
  const cornersA = obbCorners(a)
  const cornersB = obbCorners(b)
  const axes = [...obbAxes(a), ...obbAxes(b)]

  let minPenetration = Infinity

  for (const axis of axes) {
    const projA = project(cornersA, axis)
    const projB = project(cornersB, axis)
    if (!intervalsOverlap(projA, projB)) {
      return { overlapping: false, penetrationCm: 0 }
    }
    const depth = overlapDepth(projA, projB)
    if (depth < minPenetration) minPenetration = depth
  }

  return { overlapping: true, penetrationCm: minPenetration }
}

/** Check if an OBB is fully inside a room polygon (simple rect version) */
export function isInsideRoom(obb: OBB2D, roomW: number, roomH: number): boolean {
  const corners = obbCorners(obb)
  return corners.every(([x, y]) => x >= 0 && x <= roomW && y >= 0 && y <= roomH)
}

/** Check if an OBB is inside room boundaries or the connecting hallway */
export function isInsideRoomOrHallway(
  obb: OBB2D,
  roomW: number,
  roomH: number,
  hallway?: HallwayZone
): boolean {
  const corners = obbCorners(obb)
  return corners.every(([x, y]) => {
    // Inside main room
    if (x >= -2 && x <= roomW + 2 && y >= -2 && y <= roomH + 2) {
      if (y >= 0) return true
    }
    // Inside hallway
    if (
      hallway &&
      x >= hallway.xMin - 2 &&
      x <= hallway.xMax + 2 &&
      y >= hallway.yMin - 2 &&
      y <= hallway.yMax + 2
    ) {
      return true
    }
    return false
  })
}

/** Build OBB from furniture position + dims */
export function furnitureToOBB(
  x: number, y: number, rot: number,
  w: number, d: number
): OBB2D {
  return {
    cx: x + w / 2,
    cy: y + d / 2,
    hw: w / 2,
    hd: d / 2,
    rot,
  }
}
