/**
 * Room & Furniture Presets:
 * Preset 1: Master Bedroom & Wide Hallway (500×380cm, 1.8m door)
 * Preset 2: Compact Studio & Narrow Doorway (380×320cm, 1.0m door — Bed requires rotation to enter!)
 */
import type { FurnitureItem, Room } from '@/types'

// ─── Preset 1: Master Bedroom (Spacious, 1.8m door) ──────────────────────────

export const MASTER_BEDROOM_ROOM: Room = {
  id: 'room-master-bedroom',
  name: 'Master Bedroom & Hallway (1.8m Door)',
  walls: [
    { x1: 0, y1: 0, x2: 500, y2: 0 },
    { x1: 500, y1: 0, x2: 500, y2: 380 },
    { x1: 500, y1: 380, x2: 0, y2: 380 },
    { x1: 0, y1: 380, x2: 0, y2: 0 },
  ],
  doors: [{ id: 'door-1', wallIndex: 0, offsetAlongWall: 160, widthCm: 180, heightCm: 210 }],
  corridors: [{ id: 'corridor-entry', widthCm: 180, lengthCm: 140, turns: [] }],
  ceilingHeightCm: 260,
  walkwayMinCm: 60,
}

export const BEDROOM_PRESETS: FurnitureItem[] = [
  // 1. Wardrobe – northwest corner against north wall (deepest)
  {
    id: 'p-wardrobe',
    name: 'Wardrobe 2-door',
    type: 'furniture',
    category: 'furniture/bedroom',
    icon: '🚪',
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
    type: 'furniture',
    category: 'furniture/bedroom',
    icon: '🗄',
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
    type: 'furniture',
    category: 'furniture/bedroom',
    icon: '🛏',
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
    type: 'furniture',
    category: 'furniture/tables',
    icon: '🪑',
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
    type: 'furniture',
    category: 'furniture/tables',
    icon: '🪑',
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
    type: 'furniture',
    category: 'furniture/tables',
    icon: '🖥',
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

// ─── Preset 2: Compact Studio (Tight, 1.0m door, Bed must rotate!) ──────────

export const COMPACT_STUDIO_ROOM: Room = {
  id: 'room-compact-studio',
  name: 'Compact Studio (1.0m Door — Rotate Required)',
  walls: [
    { x1: 0, y1: 0, x2: 380, y2: 0 },
    { x1: 380, y1: 0, x2: 380, y2: 320 },
    { x1: 380, y1: 320, x2: 0, y2: 320 },
    { x1: 0, y1: 320, x2: 0, y2: 0 },
  ],
  // 100cm (1.0m) narrow door at south wall: x: 140..240, center = 190
  doors: [{ id: 'door-compact', wallIndex: 0, offsetAlongWall: 140, widthCm: 100, heightCm: 210 }],
  corridors: [{ id: 'corridor-compact', widthCm: 100, lengthCm: 130, turns: [] }],
  ceilingHeightCm: 250,
  walkwayMinCm: 50,
}

export const COMPACT_STUDIO_PRESETS: FurnitureItem[] = [
  // 1. Tall Wardrobe – northwest corner against north wall (deepest, enters 1st)
  {
    id: 'cs-wardrobe',
    name: 'Tall Wardrobe',
    type: 'furniture',
    category: 'furniture/bedroom',
    icon: '🗄',
    assembled: { w: 85, d: 55, h: 195 },
    clearance: { front: 50 },
    canTilt: false,
    priority: 'must',
    color: '#6366f1',
    components: [],
    visible: true,
    position: { x: 30, y: 250 },
    rotation: 0,
  },

  // 2. Studio Bed – 150cm wide! Door is 100cm!
  // MUST ROTATE 90° (width becomes 90cm) to pass through 1m door!
  // Once inside room, rotates to 0° and docks at (160, 210).
  {
    id: 'cs-bed',
    name: 'Studio Bed (1.5m wide)',
    type: 'furniture',
    category: 'furniture/bedroom',
    icon: '🛏',
    assembled: { w: 150, d: 90, h: 55 },
    clearance: { front: 40 },
    canTilt: true,
    priority: 'must',
    color: '#3b82f6',
    components: [
      {
        id: 'cs-bed-frame', name: 'Bed Frame', qty: 1,
        dim: [150, 90, 30], weightKg: 35,
        fragile: false, fragileFaces: [],
        detachable: 'no',
        allowedOrientations: ['upright', 'on-side'], maxTiltDeg: 45, paddingCm: 0,
        reassemblyRisk: 'none',
      },
      {
        id: 'cs-bed-mattress', name: 'Foam Mattress', qty: 1,
        dim: [150, 90, 25], weightKg: 18,
        fragile: false, fragileFaces: [],
        detachable: 'yes',
        allowedOrientations: ['upright', 'on-side'], maxTiltDeg: 90, paddingCm: 0,
        reassemblyRisk: 'none',
      },
    ],
    visible: true,
    position: { x: 160, y: 210 },
    rotation: 0,
  },

  // 3. Bedside Table (east of bed)
  {
    id: 'cs-nightstand',
    name: 'Bedside Table',
    type: 'furniture',
    category: 'furniture/tables',
    icon: '🪑',
    assembled: { w: 45, d: 45, h: 50 },
    clearance: {},
    canTilt: false,
    priority: 'prefer',
    color: '#10b981',
    components: [],
    visible: true,
    position: { x: 325, y: 240 },
    rotation: 0,
  },

  // 4. Compact Study Desk – along west wall
  {
    id: 'cs-desk',
    name: 'Compact Study Desk',
    type: 'furniture',
    category: 'furniture/tables',
    icon: '💻',
    assembled: { w: 90, d: 50, h: 75 },
    clearance: { front: 50 },
    canTilt: false,
    priority: 'prefer',
    color: '#f59e0b',
    components: [],
    visible: true,
    position: { x: 30, y: 60 },
    rotation: 0,
  },

  // 5. Lounge Armchair – southeast corner
  {
    id: 'cs-armchair',
    name: 'Lounge Armchair',
    type: 'furniture',
    category: 'furniture/seating',
    icon: '🪑',
    assembled: { w: 75, d: 70, h: 80 },
    clearance: { front: 40 },
    canTilt: false,
    priority: 'prefer',
    color: '#ec4899',
    components: [],
    visible: true,
    position: { x: 280, y: 40 },
    rotation: 0,
  },
]

// ─── Room Presets Catalog ───────────────────────────────────────────────────

export interface RoomPresetOption {
  id: string
  name: string
  subtitle: string
  room: Room
  furniture: FurnitureItem[]
}

export const ROOM_PRESETS: RoomPresetOption[] = [
  {
    id: 'room-master-bedroom',
    name: 'Master Bedroom',
    subtitle: '500×380cm (1.8m Hallway & Door)',
    room: MASTER_BEDROOM_ROOM,
    furniture: BEDROOM_PRESETS,
  },
  {
    id: 'room-compact-studio',
    name: 'Compact Studio',
    subtitle: '380×320cm (1.0m Door — Rotate Required)',
    room: COMPACT_STUDIO_ROOM,
    furniture: COMPACT_STUDIO_PRESETS,
  },
]

export function makePresets(roomId = 'room-master-bedroom'): FurnitureItem[] {
  if (roomId === 'room-compact-studio') {
    return JSON.parse(JSON.stringify(COMPACT_STUDIO_PRESETS))
  }
  return JSON.parse(JSON.stringify(BEDROOM_PRESETS))
}

