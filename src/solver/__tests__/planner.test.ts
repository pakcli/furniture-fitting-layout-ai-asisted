import { describe, it, expect } from 'vitest'
import { runPlanner } from '../planner'
import {
  BEDROOM_PRESETS,
  COMPACT_STUDIO_ROOM,
  COMPACT_STUDIO_PRESETS,
} from '@/data/presets'
import { satTest, furnitureToOBB } from '../obb-sat'

describe('Bedroom Solver', () => {
  it('verifies all master bedroom preset items are non-overlapping', () => {
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

  it('verifies compact studio items are non-overlapping in their final layout', () => {
    const obbs = COMPACT_STUDIO_PRESETS.map(f => ({
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

  it('solves the compact studio layout through 1.0m door with bed rotation as FEASIBLE', () => {
    const door = COMPACT_STUDIO_ROOM.doors[0]
    const corridor = COMPACT_STUDIO_ROOM.corridors[0]
    const doorCenter = door.offsetAlongWall + door.widthCm / 2 // 140 + 50 = 190
    const doorLeft = door.offsetAlongWall // 140
    const doorRight = door.offsetAlongWall + door.widthCm // 240

    const plan = runPlanner({
      furniture: COMPACT_STUDIO_PRESETS,
      roomW: 380,
      roomH: 320,
      doorX: doorCenter,
      doorY: 0,
      hallway: {
        xMin: doorLeft,
        xMax: doorRight,
        yMin: -corridor.lengthCm,
        yMax: 0,
      },
    })

    expect(plan.verdict).toBe('full-fit')
    expect(plan.entryOrder.length).toBe(COMPACT_STUDIO_PRESETS.length)
    expect(plan.steps.length).toBe(COMPACT_STUDIO_PRESETS.length)

    // Studio bed step: verify it rotated during insertion
    const bedStep = plan.steps.find(s => s.furnitureId === 'cs-bed')
    expect(bedStep).toBeDefined()
    expect(bedStep!.issue).toBeUndefined()
    expect(bedStep!.pathNodes).toBeDefined()
    expect(bedStep!.pathNodes!.length).toBeGreaterThan(0)

    // Verify bed starts rotated at 90° (to fit through the 100cm door with 90cm profile)
    expect(bedStep!.pathNodes![0].rot).toBe(90)
    // Verify bed ends at goal rotation 0° in room
    const lastNode = bedStep!.pathNodes![bedStep!.pathNodes!.length - 1]
    expect(lastNode.rot).toBe(0)

    // All steps have collision-free paths
    for (const step of plan.steps) {
      expect(step.issue).toBeUndefined()
      expect(step.pathNodes!.length).toBeGreaterThan(0)
    }
  })
})

