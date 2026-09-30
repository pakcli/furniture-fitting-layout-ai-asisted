/**
 * Room & Furniture Presets:
 * Preset 1: Master Bedroom & Wide Hallway (500×380cm, 1.8m door)
 * Preset 2: Compact Studio & Narrow Doorway (380×320cm, 1.0m door — Bed requires rotation to enter!)
 * Includes pre-baked CSV sequence steps and simulation plans with trajectory nodes.
 */
import type { FurnitureItem, Room, SequenceStep, SolverPlan, Project } from '@/types'

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

// Hallway entrance point for Master Bedroom: X = 160 + 180/2 = 250, Y = -140
const MB_ENTRANCE = { x: 250, y: -140 }

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
    placementMode: 'inserting',
    startPosition: { ...MB_ENTRANCE },
    startRotation: 0,
    endPosition: { x: 30, y: 300 },
    endRotation: 0,
    localProgress: 1.0,
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
    placementMode: 'inserting',
    startPosition: { ...MB_ENTRANCE },
    startRotation: 0,
    endPosition: { x: 360, y: 310 },
    endRotation: 0,
    localProgress: 1.0,
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
    placementMode: 'inserting',
    startPosition: { ...MB_ENTRANCE },
    startRotation: 0,
    endPosition: { x: 170, y: 120 },
    endRotation: 0,
    localProgress: 1.0,
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
    placementMode: 'inserting',
    startPosition: { ...MB_ENTRANCE },
    startRotation: 0,
    endPosition: { x: 110, y: 240 },
    endRotation: 0,
    localProgress: 1.0,
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
    placementMode: 'inserting',
    startPosition: { ...MB_ENTRANCE },
    startRotation: 0,
    endPosition: { x: 345, y: 240 },
    endRotation: 0,
    localProgress: 1.0,
  },

  // 6. Work Desk – southeast corner near door
  {
    id: 'p-desk',
    name: 'Work Desk',
    type: 'furniture',
    category: 'furniture/tables',
    icon: '💻',
    assembled: { w: 110, d: 60, h: 75 },
    clearance: { front: 70 },
    canTilt: false,
    priority: 'prefer',
    color: '#f59e0b',
    components: [],
    visible: true,
    position: { x: 360, y: 20 },
    rotation: 0,
    placementMode: 'inserting',
    startPosition: { ...MB_ENTRANCE },
    startRotation: 0,
    endPosition: { x: 360, y: 20 },
    endRotation: 0,
    localProgress: 1.0,
  },
]

export const BEDROOM_SEQUENCE_ROWS: SequenceStep[] = [
  {
    step_id: 1,
    object_id: 'p-wardrobe',
    object_name: 'Wardrobe 2-door',
    start_pos_x: MB_ENTRANCE.x, start_pos_y: MB_ENTRANCE.y, start_rot: 0,
    end_pos_x: 30, end_pos_y: 300, end_rot: 0,
    duration_s: 2.0, easing: 'ease-in-out',
    notes: 'Enters 1st: Deepest north-west corner placement',
  },
  {
    step_id: 2,
    object_id: 'p-dresser',
    object_name: '6-Drawer Dresser',
    start_pos_x: MB_ENTRANCE.x, start_pos_y: MB_ENTRANCE.y, start_rot: 0,
    end_pos_x: 360, end_pos_y: 310, end_rot: 0,
    duration_s: 1.8, easing: 'ease-in-out',
    notes: 'Enters 2nd: North-east corner against back wall',
  },
  {
    step_id: 3,
    object_id: 'p-bed',
    object_name: 'Queen Bed',
    start_pos_x: MB_ENTRANCE.x, start_pos_y: MB_ENTRANCE.y, start_rot: 0,
    end_pos_x: 170, end_pos_y: 120, end_rot: 0,
    duration_s: 2.2, easing: 'ease-in-out',
    notes: 'Enters 3rd: Central master bed docking',
  },
  {
    step_id: 4,
    object_id: 'p-ns-left',
    object_name: 'Nightstand (L)',
    start_pos_x: MB_ENTRANCE.x, start_pos_y: MB_ENTRANCE.y, start_rot: 0,
    end_pos_x: 110, end_pos_y: 240, end_rot: 0,
    duration_s: 1.2, easing: 'ease-out',
    notes: 'Enters 4th: Left bedside table',
  },
  {
    step_id: 5,
    object_id: 'p-ns-right',
    object_name: 'Nightstand (R)',
    start_pos_x: MB_ENTRANCE.x, start_pos_y: MB_ENTRANCE.y, start_rot: 0,
    end_pos_x: 345, end_pos_y: 240, end_rot: 0,
    duration_s: 1.2, easing: 'ease-out',
    notes: 'Enters 5th: Right bedside table',
  },
  {
    step_id: 6,
    object_id: 'p-desk',
    object_name: 'Work Desk',
    start_pos_x: MB_ENTRANCE.x, start_pos_y: MB_ENTRANCE.y, start_rot: 0,
    end_pos_x: 360, end_pos_y: 20, end_rot: 0,
    duration_s: 1.5, easing: 'ease-in-out',
    notes: 'Enters 6th: South-east corner desk placement',
  },
]

export const BEDROOM_PLAN: SolverPlan = {
  verdict: 'full-fit',
  compromisedIds: [],
  entryOrder: ['p-wardrobe', 'p-dresser', 'p-bed', 'p-ns-left', 'p-ns-right', 'p-desk'],
  computedAt: Date.now(),
  steps: [
    {
      index: 0,
      furnitureId: 'p-wardrobe',
      furnitureName: 'Wardrobe 2-door',
      transportMode: 'whole',
      action: 'Enter hallway and glide into northwest corner',
      pathNodes: [
        { x: 250, y: -140, rot: 0 },
        { x: 250, y: -40,  rot: 0 },
        { x: 250, y: 60,   rot: 0 },
        { x: 140, y: 190,  rot: 0 },
        { x: 30,  y: 300,  rot: 0 },
      ],
    },
    {
      index: 1,
      furnitureId: 'p-dresser',
      furnitureName: '6-Drawer Dresser',
      transportMode: 'whole',
      action: 'Enter hallway and dock into northeast corner',
      pathNodes: [
        { x: 250, y: -140, rot: 0 },
        { x: 250, y: -40,  rot: 0 },
        { x: 250, y: 80,   rot: 0 },
        { x: 320, y: 210,  rot: 0 },
        { x: 360, y: 310,  rot: 0 },
      ],
    },
    {
      index: 2,
      furnitureId: 'p-bed',
      furnitureName: 'Queen Bed',
      transportMode: 'whole',
      action: 'Enter through wide 1.8m door and dock in center',
      pathNodes: [
        { x: 250, y: -140, rot: 0 },
        { x: 250, y: -40,  rot: 0 },
        { x: 250, y: 40,   rot: 0 },
        { x: 210, y: 80,   rot: 0 },
        { x: 170, y: 120,  rot: 0 },
      ],
    },
    {
      index: 3,
      furnitureId: 'p-ns-left',
      furnitureName: 'Nightstand (L)',
      transportMode: 'whole',
      action: 'Carry along west walkway to bedside',
      pathNodes: [
        { x: 250, y: -140, rot: 0 },
        { x: 250, y: 0,    rot: 0 },
        { x: 110, y: 100,  rot: 0 },
        { x: 110, y: 240,  rot: 0 },
      ],
    },
    {
      index: 4,
      furnitureId: 'p-ns-right',
      furnitureName: 'Nightstand (R)',
      transportMode: 'whole',
      action: 'Carry along east walkway to bedside',
      pathNodes: [
        { x: 250, y: -140, rot: 0 },
        { x: 250, y: 0,    rot: 0 },
        { x: 345, y: 100,  rot: 0 },
        { x: 345, y: 240,  rot: 0 },
      ],
    },
    {
      index: 5,
      furnitureId: 'p-desk',
      furnitureName: 'Work Desk',
      transportMode: 'whole',
      action: 'Place in southeast corner near entrance',
      pathNodes: [
        { x: 250, y: -140, rot: 0 },
        { x: 250, y: 0,    rot: 0 },
        { x: 360, y: 20,   rot: 0 },
      ],
    },
  ],
}

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

// Hallway entrance point for Compact Studio: X = 140 + 100/2 = 190, Y = -130
const CS_ENTRANCE = { x: 190, y: -130 }

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
    placementMode: 'inserting',
    startPosition: { ...CS_ENTRANCE },
    startRotation: 0,
    endPosition: { x: 30, y: 250 },
    endRotation: 0,
    localProgress: 1.0,
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
    placementMode: 'inserting',
    startPosition: { ...CS_ENTRANCE },
    startRotation: 90, // Enters turned sideways!
    endPosition: { x: 160, y: 210 },
    endRotation: 0,
    localProgress: 1.0,
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
    placementMode: 'inserting',
    startPosition: { ...CS_ENTRANCE },
    startRotation: 0,
    endPosition: { x: 325, y: 240 },
    endRotation: 0,
    localProgress: 1.0,
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
    placementMode: 'inserting',
    startPosition: { ...CS_ENTRANCE },
    startRotation: 0,
    endPosition: { x: 30, y: 60 },
    endRotation: 0,
    localProgress: 1.0,
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
    placementMode: 'inserting',
    startPosition: { ...CS_ENTRANCE },
    startRotation: 0,
    endPosition: { x: 280, y: 40 },
    endRotation: 0,
    localProgress: 1.0,
  },
]

export const STUDIO_SEQUENCE_ROWS: SequenceStep[] = [
  {
    step_id: 1,
    object_id: 'cs-wardrobe',
    object_name: 'Tall Wardrobe',
    start_pos_x: CS_ENTRANCE.x, start_pos_y: CS_ENTRANCE.y, start_rot: 0,
    end_pos_x: 30, end_pos_y: 250, end_rot: 0,
    duration_s: 1.8, easing: 'ease-in-out',
    notes: 'Enters 1st: Deep northwest corner wardrobe',
  },
  {
    step_id: 2,
    object_id: 'cs-bed',
    object_name: 'Studio Bed (1.5m wide)',
    start_pos_x: CS_ENTRANCE.x, start_pos_y: CS_ENTRANCE.y, start_rot: 90,
    end_pos_x: 160, end_pos_y: 210, end_rot: 0,
    duration_s: 2.8, easing: 'ease-in-out',
    notes: '⚡ Rotates 90° sideways to squeeze through 1.0m door, then aligns to 0°',
  },
  {
    step_id: 3,
    object_id: 'cs-nightstand',
    object_name: 'Bedside Table',
    start_pos_x: CS_ENTRANCE.x, start_pos_y: CS_ENTRANCE.y, start_rot: 0,
    end_pos_x: 325, end_pos_y: 240, end_rot: 0,
    duration_s: 1.2, easing: 'ease-out',
    notes: 'Enters 3rd: Compact bedside table',
  },
  {
    step_id: 4,
    object_id: 'cs-desk',
    object_name: 'Compact Study Desk',
    start_pos_x: CS_ENTRANCE.x, start_pos_y: CS_ENTRANCE.y, start_rot: 0,
    end_pos_x: 30, end_pos_y: 60, end_rot: 0,
    duration_s: 1.4, easing: 'ease-in-out',
    notes: 'Enters 4th: Study desk along west wall',
  },
  {
    step_id: 5,
    object_id: 'cs-armchair',
    object_name: 'Lounge Armchair',
    start_pos_x: CS_ENTRANCE.x, start_pos_y: CS_ENTRANCE.y, start_rot: 0,
    end_pos_x: 280, end_pos_y: 40, end_rot: 0,
    duration_s: 1.2, easing: 'ease-out',
    notes: 'Enters 5th: Lounge armchair near entrance window',
  },
]

export const STUDIO_PLAN: SolverPlan = {
  verdict: 'full-fit',
  compromisedIds: [],
  entryOrder: ['cs-wardrobe', 'cs-bed', 'cs-nightstand', 'cs-desk', 'cs-armchair'],
  computedAt: Date.now(),
  steps: [
    {
      index: 0,
      furnitureId: 'cs-wardrobe',
      furnitureName: 'Tall Wardrobe',
      transportMode: 'whole',
      action: 'Enter hallway and glide into northwest corner',
      pathNodes: [
        { x: 190, y: -130, rot: 0 },
        { x: 190, y: -30,  rot: 0 },
        { x: 190, y: 40,   rot: 0 },
        { x: 90,  y: 150,  rot: 0 },
        { x: 30,  y: 250,  rot: 0 },
      ],
    },
    {
      index: 1,
      furnitureId: 'cs-bed',
      furnitureName: 'Studio Bed (1.5m wide)',
      transportMode: 'doors-off',
      action: 'Rotate 90° sideways through 1.0m door, then rotate back to 0° inside room',
      pathNodes: [
        { x: 190, y: -130, rot: 90 }, // Enters sideways
        { x: 190, y: -30,  rot: 90 }, // Passing threshold
        { x: 190, y: 20,   rot: 90 }, // Inside doorway
        { x: 180, y: 90,   rot: 60 }, // Turning in room
        { x: 170, y: 150,  rot: 30 }, // Unwinding
        { x: 160, y: 190,  rot: 0 },  // Aligned
        { x: 160, y: 210,  rot: 0 },  // Docked
      ],
    },
    {
      index: 2,
      furnitureId: 'cs-nightstand',
      furnitureName: 'Bedside Table',
      transportMode: 'whole',
      action: 'Carry along east wall to bed',
      pathNodes: [
        { x: 190, y: -130, rot: 0 },
        { x: 190, y: 0,    rot: 0 },
        { x: 280, y: 120,  rot: 0 },
        { x: 325, y: 240,  rot: 0 },
      ],
    },
    {
      index: 3,
      furnitureId: 'cs-desk',
      furnitureName: 'Compact Study Desk',
      transportMode: 'whole',
      action: 'Place along west wall',
      pathNodes: [
        { x: 190, y: -130, rot: 0 },
        { x: 190, y: 0,    rot: 0 },
        { x: 30,  y: 60,   rot: 0 },
      ],
    },
    {
      index: 4,
      furnitureId: 'cs-armchair',
      furnitureName: 'Lounge Armchair',
      transportMode: 'whole',
      action: 'Place in southeast corner',
      pathNodes: [
        { x: 190, y: -130, rot: 0 },
        { x: 190, y: 0,    rot: 0 },
        { x: 280, y: 40,   rot: 0 },
      ],
    },
  ],
}

// ─── Room Presets Catalog ───────────────────────────────────────────────────

export interface RoomPresetOption {
  id: string
  name: string
  subtitle: string
  room: Room
  furniture: FurnitureItem[]
  sequenceRows: SequenceStep[]
  plan: SolverPlan
}

export const ROOM_PRESETS: RoomPresetOption[] = [
  {
    id: 'room-master-bedroom',
    name: 'Master Bedroom',
    subtitle: '500×380cm (1.8m Hallway & Door)',
    room: MASTER_BEDROOM_ROOM,
    furniture: BEDROOM_PRESETS,
    sequenceRows: BEDROOM_SEQUENCE_ROWS,
    plan: BEDROOM_PLAN,
  },
  {
    id: 'room-compact-studio',
    name: 'Compact Studio',
    subtitle: '380×320cm (1.0m Door — Rotate Required)',
    room: COMPACT_STUDIO_ROOM,
    furniture: COMPACT_STUDIO_PRESETS,
    sequenceRows: STUDIO_SEQUENCE_ROWS,
    plan: STUDIO_PLAN,
  },
]

// ─── Initial Factory Sample Projects (v09) ──────────────────────────────────

export function createFactorySampleProjects(): Project[] {
  return [
    {
      id: 'project-sample-bedroom',
      name: 'Master Bedroom & Hallway',
      isSample: true,
      samplePresetId: 'room-master-bedroom',
      createdAt: 1710000000000,
      updatedAt: 1710000000000,
      room: JSON.parse(JSON.stringify(MASTER_BEDROOM_ROOM)),
      furniture: JSON.parse(JSON.stringify(BEDROOM_PRESETS)),
      sequenceRows: JSON.parse(JSON.stringify(BEDROOM_SEQUENCE_ROWS)),
      plan: JSON.parse(JSON.stringify(BEDROOM_PLAN)),
    },
    {
      id: 'project-sample-studio',
      name: 'Compact Studio (Rotate Entry)',
      isSample: true,
      samplePresetId: 'room-compact-studio',
      createdAt: 1710000001000,
      updatedAt: 1710000001000,
      room: JSON.parse(JSON.stringify(COMPACT_STUDIO_ROOM)),
      furniture: JSON.parse(JSON.stringify(COMPACT_STUDIO_PRESETS)),
      sequenceRows: JSON.parse(JSON.stringify(STUDIO_SEQUENCE_ROWS)),
      plan: JSON.parse(JSON.stringify(STUDIO_PLAN)),
    },
  ]
}

export function makePresets(roomId = 'room-master-bedroom'): FurnitureItem[] {
  if (roomId === 'room-compact-studio') {
    return JSON.parse(JSON.stringify(COMPACT_STUDIO_PRESETS))
  }
  return JSON.parse(JSON.stringify(BEDROOM_PRESETS))
}
