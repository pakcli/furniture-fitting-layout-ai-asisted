/**
 * A* Pathfinding on (x, y, rotation) state space for furniture placement.
 * Connects entry hallway / doorway to final bedroom positions.
 */

import { MinPriorityQueue } from '@datastructures-js/priority-queue'
import {
  satTest, furnitureToOBB, isInsideRoomOrHallway,
  type OBB2D, type HallwayZone,
} from './obb-sat'

export interface AStarNode {
  x: number    // cm, snapped to GRID_CM
  y: number    // cm, snapped to GRID_CM
  rot: number  // degrees
}

export interface PathResult {
  found: boolean
  path: AStarNode[]
  stallReason?: string
}

const GRID_CM = 10

/** Snap value to nearest grid step */
const snap = (v: number, step: number) => Math.round(v / step) * step

/** Encode state as string key */
const key = (n: AStarNode) => `${n.x},${n.y},${n.rot}`

/** Euclidean heuristic */
function heuristic(a: AStarNode, goal: AStarNode): number {
  const dx = (a.x - goal.x) / GRID_CM
  const dy = (a.y - goal.y) / GRID_CM
  return Math.sqrt(dx * dx + dy * dy)
}

export interface BlockerOBB {
  obb: OBB2D
  furnitureId: string
}

export interface AStarOptions {
  startX: number
  startY: number
  goalX: number
  goalY: number
  goalRot: number
  agentW: number  // furniture width cm
  agentD: number  // furniture depth cm
  roomW: number
  roomH: number
  hallway?: HallwayZone
  blockers: BlockerOBB[]  // already-placed furniture in room
  maxNodes?: number
}

export function runAStar(opts: AStarOptions): PathResult {
  const {
    startX, startY, goalX, goalY, goalRot,
    agentW, agentD, roomW, roomH, hallway, blockers,
  } = opts
  const maxNodes = opts.maxNodes ?? 35_000

  const goal: AStarNode = {
    x: snap(goalX, GRID_CM),
    y: snap(goalY, GRID_CM),
    rot: ((goalRot % 360) + 360) % 360,
  }

  /** Check if a state is valid (no collisions with obstacles, within room/hallway) */
  function isValid(n: AStarNode, isFinalTarget = false): boolean {
    const obb = furnitureToOBB(n.x, n.y, n.rot, agentW, agentD)

    // Check inside room/hallway
    if (!isInsideRoomOrHallway(obb, roomW, roomH, hallway)) {
      if (!isFinalTarget) return false
    }

    // Check collision against placed blockers
    for (const b of blockers) {
      const res = satTest(obb, b.obb)
      if (res.overlapping && res.penetrationCm > 1.0) {
        return false
      }
    }
    return true
  }

  // Pre-check: if goal itself collides with an already-placed blocker
  if (!isValid(goal, true)) {
    return {
      found: false,
      path: [],
      stallReason: 'Destination collides with an already placed item',
    }
  }

  // Determine starting rotation in hallway/door:
  // If goalRot doesn't fit in hallway (e.g. bed width 150cm > door 100cm),
  // test candidate rotations [goalRot, 0, 90, 270] to find an orientation that fits.
  const candidateRotations = [goal.rot, 0, 90, 270]
  let startRot: number | null = null
  const snappedStartX = snap(startX, GRID_CM)
  const snappedStartY = snap(startY, GRID_CM)

  for (const r of candidateRotations) {
    if (isValid({ x: snappedStartX, y: snappedStartY, rot: r })) {
      startRot = r
      break
    }
  }

  if (startRot === null) {
    return {
      found: false,
      path: [],
      stallReason: `Furniture (${agentW}×${agentD}cm) exceeds entrance passage clearance at all orientations`,
    }
  }

  const start: AStarNode = {
    x: snappedStartX,
    y: snappedStartY,
    rot: startRot,
  }

  const gScore = new Map<string, number>()
  const parent = new Map<string, AStarNode | null>()
  const startKey = key(start)

  gScore.set(startKey, 0)
  parent.set(startKey, null)

  function heuristicCost(node: AStarNode): number {
    const dx = (node.x - goal.x) / GRID_CM
    const dy = (node.y - goal.y) / GRID_CM
    let dRot = Math.abs(node.rot - goal.rot) % 360
    if (dRot > 180) dRot = 360 - dRot
    return Math.hypot(dx, dy) + (dRot / 90) * 0.8
  }

  interface QItem { cost: number; node: AStarNode }
  const open = new MinPriorityQueue<QItem>((item) => item.cost)
  open.enqueue({ cost: heuristicCost(start), node: start })

  let explored = 0

  while (!open.isEmpty() && explored < maxNodes) {
    const dequeued = open.dequeue()
    if (!dequeued) break
    const current = dequeued.node
    explored++

    const distToGoal = Math.hypot(current.x - goal.x, current.y - goal.y)
    let curRotDiff = Math.abs(current.rot - goal.rot) % 360
    if (curRotDiff > 180) curRotDiff = 360 - curRotDiff

    // Goal reached if within 1 grid unit of target position and aligned in rotation
    if (distToGoal <= GRID_CM && curRotDiff < 10) {
      // Reconstruct raw path
      const rawPath: AStarNode[] = [{ x: goal.x, y: goal.y, rot: goal.rot }]
      let cur: AStarNode | null = current
      while (cur) {
        rawPath.unshift(cur)
        cur = parent.get(key(cur)) ?? null
        if (cur === null) break
      }

      // Smooth path: if there are rotational jumps, subdivide smoothly for playback
      const path: AStarNode[] = []
      for (let i = 0; i < rawPath.length; i++) {
        const curr = rawPath[i]
        if (path.length > 0) {
          const prev = path[path.length - 1]
          let rDiff = curr.rot - prev.rot
          if (rDiff > 180) rDiff -= 360
          if (rDiff < -180) rDiff += 360
          if (Math.abs(rDiff) > 35) {
            // Insert intermediate rotation step
            const midRot = ((prev.rot + rDiff / 2) % 360 + 360) % 360
            path.push({
              x: Math.round((prev.x + curr.x) / 2),
              y: Math.round((prev.y + curr.y) / 2),
              rot: midRot,
            })
          }
        }
        path.push(curr)
      }

      return { found: true, path }
    }

    const ck = key(current)
    const g = gScore.get(ck) ?? Infinity

    // Candidate neighbors
    const neighbors: { node: AStarNode; stepCost: number }[] = []

    // 1. Translations (keeping current rotation)
    for (const dx of [-GRID_CM, 0, GRID_CM]) {
      for (const dy of [-GRID_CM, 0, GRID_CM]) {
        if (dx === 0 && dy === 0) continue
        const nextX = current.x + dx
        const nextY = current.y + dy
        const stepCost = (dx !== 0 && dy !== 0) ? 1.414 : 1.0

        neighbors.push({
          node: { x: nextX, y: nextY, rot: current.rot },
          stepCost,
        })
      }
    }

    // 2. Rotations (if not yet at goal rotation, test rotating at current location)
    if (curRotDiff > 0) {
      // Step rotation towards goal
      let delta = goal.rot - current.rot
      if (delta > 180) delta -= 360
      if (delta < -180) delta += 360
      const stepDeg = Math.sign(delta) * Math.min(30, Math.abs(delta))
      const nextRot = ((current.rot + stepDeg) % 360 + 360) % 360

      neighbors.push({
        node: { x: current.x, y: current.y, rot: nextRot },
        stepCost: 0.6,
      })

      // Also try rotating directly to goal rotation if in open space
      if (Math.abs(delta) > 30) {
        neighbors.push({
          node: { x: current.x, y: current.y, rot: goal.rot },
          stepCost: 0.8,
        })
      }
    }

    // Process neighbors
    for (const { node: nb, stepCost } of neighbors) {
      if (!isValid(nb)) continue

      const nbk = key(nb)
      const tentativeG = g + stepCost

      if (tentativeG < (gScore.get(nbk) ?? Infinity)) {
        gScore.set(nbk, tentativeG)
        parent.set(nbk, current)
        open.enqueue({ cost: tentativeG + heuristicCost(nb), node: nb })
      }
    }
  }

  return {
    found: false,
    path: [],
    stallReason: explored >= maxNodes
      ? 'Path search exceeded node budget — clearance too tight'
      : 'Path blocked by already placed furniture or narrow passage',
  }
}
