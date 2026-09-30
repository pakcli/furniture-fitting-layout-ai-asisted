import { describe, it, expect } from 'vitest'
import { runPlanner } from '../planner'
import { BEDROOM_PRESETS } from '@/data/presets'
import { satTest, furnitureToOBB } from '../obb-sat'

describe('Bedroom Solver', () => {
  it('verifies all bedroom preset items are non-overlapping', () => {
    const obbs = BEDROOM_PRESETS.map(f => ({
      name: f.name,
      obb: furnitureToOBB(f.position!.x, f.position!.y, f.rotation ?? 0, f.assembled.w, f.assembled.d),
    }))

    for (let i = 0; i < obbs.length; i++) {
      for (let j = i + 1; j < obbs.length; j++) {
        const res = satTest(obbs[i].obb, obbs[j].obb)
        expect(res.overlapping, `${obbs[i].name} collides with ${obbs[j].name}`).toBe(false)
      }
    }
  })

  it('solves the master bedroom layout from hallway into bedroom as FEASIBLE', () => {
    const plan = runPlanner({
      furniture: BEDROOM_PRESETS,
      roomW: 500,
      roomH: 380,
      doorX: 250,
      doorY: 0,
      hallway: {
        xMin: 160,
        xMax: 340,
        yMin: -140,
        yMax: 0,
      },
    })

    expect(plan.verdict).toBe('full-fit')
    expect(plan.entryOrder.length).toBe(BEDROOM_PRESETS.length)
    expect(plan.steps.length).toBe(BEDROOM_PRESETS.length)

    // Verify all steps found valid paths
    for (const step of plan.steps) {
      expect(step.issue).toBeUndefined()
      expect(step.pathNodes).toBeDefined()
      expect(step.pathNodes!.length).toBeGreaterThan(0)
    }
  })
})
