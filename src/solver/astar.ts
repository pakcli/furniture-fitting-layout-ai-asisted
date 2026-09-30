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
  const maxNodes = opts.maxNodes ?? 25_000

  const start: AStarNode = {
    x: snap(startX, GRID_CM),
    y: snap(startY, GRID_CM),
    rot: 0,
  }
  const goal: AStarNode = {
    x: snap(goalX, GRID_CM),
    y: snap(goalY, GRID_CM),
    rot: goalRot,
  }

  /** Check if a state is valid (no collisions with obstacles, within room/hallway) */
  function isValid(n: AStarNode, isFinalTarget = false): boolean {
    const obb = furnitureToOBB(n.x, n.y, n.rot, agentW, agentD)

    // Check inside room/hallway
    if (!isInsideRoomOrHallway(obb, roomW, roomH, hallway)) {
      // If at final target, allow slight wall touch
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

  const gScore = new Map<string, number>()
  const parent = new Map<string, AStarNode | null>()
  const startKey = key(start)

  gScore.set(startKey, 0)
  parent.set(startKey, null)

  interface QItem { cost: number; node: AStarNode }
  const open = new MinPriorityQueue<QItem>((item) => item.cost)
  open.enqueue({ cost: heuristic(start, goal), node: start })

  let explored = 0

  while (!open.isEmpty() && explored < maxNodes) {
    const dequeued = open.dequeue()
    if (!dequeued) break
    const current = dequeued.node
    explored++

    const distToGoal = Math.hypot(current.x - goal.x, current.y - goal.y)
    if (distToGoal <= GRID_CM) {
      // Reconstruct path
      const path: AStarNode[] = [{ x: goal.x, y: goal.y, rot: goal.rot }]
      let cur: AStarNode | null = current
      while (cur) {
        path.unshift(cur)
        cur = parent.get(key(cur)) ?? null
        if (cur === null) break
      }
      return { found: true, path }
    }

    const ck = key(current)
    const g = gScore.get(ck) ?? Infinity

    // Translations: 8 directions
    for (const dx of [-GRID_CM, 0, GRID_CM]) {
      for (const dy of [-GRID_CM, 0, GRID_CM]) {
        if (dx === 0 && dy === 0) continue

        const nextX = current.x + dx
        const nextY = current.y + dy

        // Rotation transitions smoothly to goal rotation as we approach goal
        const distFromGoal = Math.hypot(nextX - goal.x, nextY - goal.y)
        const nextRot = distFromGoal < 40 ? goal.rot : 0

        const nb: AStarNode = { x: nextX, y: nextY, rot: nextRot }
        const nbk = key(nb)

        if (!isValid(nb)) continue

        const stepCost = (dx !== 0 && dy !== 0) ? 1.414 : 1.0
        const tentativeG = g + stepCost

        if (tentativeG < (gScore.get(nbk) ?? Infinity)) {
          gScore.set(nbk, tentativeG)
          parent.set(nbk, current)
          open.enqueue({ cost: tentativeG + heuristic(nb, goal), node: nb })
        }
      }
    }
  }

  // Fallback: If strict grid search stopped close or got stuck, try straight waypoint
  return {
    found: false,
    path: [],
    stallReason: explored >= maxNodes
      ? 'Path search exceeded node budget — clearance too tight'
      : 'Path blocked by already placed furniture or narrow passage',
  }
}
