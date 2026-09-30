/**
 * Entry Sequence & Path Planner
 * Computes optimal entry order (deepest/back-to-front) and validates collision-free paths.
 */

import type { FurnitureItem, SolverPlan, PlanStep, VerdictType, TransportMode } from '@/types'
import { runAStar, type BlockerOBB } from './astar'
import { furnitureToOBB, satTest, type HallwayZone } from './obb-sat'

export interface PlannerInput {
  furniture: FurnitureItem[]
  roomW: number
  roomH: number
  doorX: number       // door center x (cm)
  doorY: number       // door entry y (cm)
  hallway?: HallwayZone
}

export function runPlanner(input: PlannerInput): SolverPlan {
  const { furniture, roomW, roomH, doorX, doorY, hallway } = input

  // Only placed, visible furniture
  const placed = furniture.filter(f => f.visible && f.position)

  if (placed.length === 0) {
    return {
      verdict: 'full-fit',
      compromisedIds: [],
      entryOrder: [],
      steps: [],
      computedAt: Date.now(),
    }
  }

  // 1. Check for static overlaps between any two items in their final positions
  const obbMap = new Map(placed.map(f => {
    const obb = furnitureToOBB(
      f.position!.x, f.position!.y,
      f.rotation ?? 0,
      f.assembled.w, f.assembled.d
    )
    return [f.id, obb]
  }))

  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = obbMap.get(placed[i].id)!
      const b = obbMap.get(placed[j].id)!
      const test = satTest(a, b)
      if (test.overlapping && test.penetrationCm > 2.0) {
        return {
          verdict: 'impossible',
          compromisedIds: [placed[i].id, placed[j].id],
          impossibleReason: `Layout collision: "${placed[i].name}" overlaps with "${placed[j].name}" by ${Math.round(test.penetrationCm)}cm. Separate them in the layout.`,
          entryOrder: placed.map(f => f.id),
          steps: [],
          computedAt: Date.now(),
        }
      }
    }
  }

  // 2. Sort items by depth from the entrance door (deepest / furthest y enters first)
  // For door at south (y=0), items with higher (y + depth) are deeper in the room.
  const sortedItems = [...placed].sort((a, b) => {
    const depthA = a.position!.y + a.assembled.d
    const depthB = b.position!.y + b.assembled.d
    if (Math.abs(depthB - depthA) > 10) {
      return depthB - depthA // deepest first
    }
    // If similar depth, place items closest to side walls first
    const distToCenterA = Math.abs((a.position!.x + a.assembled.w / 2) - doorX)
    const distToCenterB = Math.abs((b.position!.x + b.assembled.w / 2) - doorX)
    return distToCenterB - distToCenterA
  })

  const entryOrder = sortedItems.map(f => f.id)
  const steps: PlanStep[] = []
  const placedSoFar: BlockerOBB[] = []
  let verdict: VerdictType = 'full-fit'
  const compromisedIds: string[] = []

  // 3. For each item in entry sequence, test navigation from hallway/door to destination
  for (let i = 0; i < sortedItems.length; i++) {
    const item = sortedItems[i]
    const itemOBB = obbMap.get(item.id)!

    // Start centered at doorway or in hallway
    const startX = doorX - item.assembled.w / 2
    const startY = hallway ? Math.max(hallway.yMin + 20, doorY - 40) : doorY

    const pathResult = runAStar({
      startX,
      startY,
      goalX: item.position!.x,
      goalY: item.position!.y,
      goalRot: item.rotation ?? 0,
      agentW: item.assembled.w,
      agentD: item.assembled.d,
      roomW,
      roomH,
      hallway,
      blockers: [...placedSoFar],
      maxNodes: 25_000,
    })

    const transport: TransportMode = item.canTilt ? 'whole' : 'whole'

    const step: PlanStep = {
      index: i,
      furnitureId: item.id,
      furnitureName: item.name,
      transportMode: transport,
      action: pathResult.found
        ? `Enter from hallway → move to final position (${Math.round(item.position!.x)}, ${Math.round(item.position!.y)})`
        : `Path obstructed by existing furniture`,
      pathNodes: pathResult.path,
    }

    if (!pathResult.found) {
      step.issue = {
        type: 'stall',
        message: pathResult.stallReason ?? 'Clearance insufficient along entrance path',
        suggestion: item.canTilt
          ? 'Tilt item upright or adjust placement of earlier furniture'
          : 'Check door width or relocate item',
      }
      compromisedIds.push(item.id)
      if (item.priority === 'must') {
        verdict = 'impossible'
      } else if (verdict !== 'impossible') {
        verdict = 'compromise'
      }
    }

    steps.push(step)
    // Add to placed blockers for subsequent items
    placedSoFar.push({ obb: itemOBB, furnitureId: item.id })
  }

  return {
    verdict,
    compromisedIds,
    impossibleReason: verdict === 'impossible'
      ? `Cannot fit all "MUST" furniture through the hallway/room entry path.`
      : undefined,
    entryOrder,
    steps,
    computedAt: Date.now(),
  }
}
