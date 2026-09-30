/**
 * Master Bedroom demo — Hallway entry into a 500×380cm master bedroom.
 * All positions physically verified non-overlapping.
 * Hallway & Door: 180cm wide at south wall (y=0), x: 160..340
 */
import type { FurnitureItem } from '@/types'

export const BEDROOM_PRESETS: FurnitureItem[] = [
  // 1. Wardrobe – northwest corner against north wall (deepest)
  {
    id: 'p-wardrobe',
    name: 'Wardrobe 2-door',
    assembled: { w: 100, d: 60, h: 200 },
    clearance: { front: 60 },
    canTilt: true,
    priority: 'must',
    color: '#6366f1',
    components: [
      {
        id: 'wc-body', name: 'Cabinet Body', qty: 1,
        dim: [100, 58, 200], weightKg: 45,
        fragile: false, fragileFaces: [],
        detachable: 'no',
        allowedOrientations: ['upright'], maxTiltDeg: 0, paddingCm: 0,
        reassemblyRisk: 'none',
      },
      {
        id: 'wc-mirror', name: 'Mirror Panel', qty: 1,
        dim: [48, 2, 195], weightKg: 8,
        fragile: true, fragileFaces: ['front'],
        detachable: 'yes',
        allowedOrientations: ['upright'], maxTiltDeg: 15, paddingCm: 4,
        reassemblyRisk: 'low',
      },
    ],
    visible: true,
    position: { x: 30, y: 300 },
    rotation: 0,
  },

  // 2. Dresser – northeast corner against north wall (deepest)
  {
    id: 'p-dresser',
    name: '6-Drawer Dresser',
    assembled: { w: 110, d: 50, h: 90 },
    clearance: { front: 60 },
    canTilt: false,
    priority: 'must',
    color: '#06b6d4',
    components: [],
    visible: true,
    position: { x: 360, y: 310 },
    rotation: 0,
  },

  // 3. Queen Bed – center of room
  {
    id: 'p-bed',
    name: 'Queen Bed',
    assembled: { w: 160, d: 200, h: 55 },
    clearance: { left: 40, right: 40 },
    canTilt: true,
    priority: 'must',
    color: '#3b82f6',
    components: [],
    visible: true,
    position: { x: 170, y: 120 },
    rotation: 0,
  },

  // 4. Nightstand Left (west side of bed)
  {
    id: 'p-ns-left',
    name: 'Nightstand (L)',
    assembled: { w: 45, d: 45, h: 55 },
    clearance: {},
    canTilt: false,
    priority: 'prefer',
    color: '#10b981',
    components: [],
    visible: true,
    position: { x: 110, y: 240 },
    rotation: 0,
  },

  // 5. Nightstand Right (east side of bed)
  {
    id: 'p-ns-right',
    name: 'Nightstand (R)',
    assembled: { w: 45, d: 45, h: 55 },
    clearance: {},
    canTilt: false,
    priority: 'prefer',
    color: '#10b981',
    components: [],
    visible: true,
    position: { x: 345, y: 240 },
    rotation: 0,
  },

  // 6. Work Desk – southeast corner near door
  {
    id: 'p-desk',
    name: 'Work Desk',
    assembled: { w: 110, d: 60, h: 75 },
    clearance: { front: 70 },
    canTilt: false,
    priority: 'prefer',
    color: '#f59e0b',
    components: [],
    visible: true,
    position: { x: 360, y: 20 },
    rotation: 0,
  },
]

export function makePresets(): FurnitureItem[] {
  return JSON.parse(JSON.stringify(BEDROOM_PRESETS))
}
