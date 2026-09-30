// ─── Core Domain Types ───────────────────────────────────────────────────────

export type Priority = 'must' | 'prefer' | 'flex'
export type DetachState = 'yes' | 'needs-tool' | 'no'
export type Orientation = 'upright' | 'flat' | 'on-side'
export type MaterialMode = 'matte' | 'texture' | 'fallback'
export type Theme = 'dark' | 'light' | 'cream'
export type CatalogMode = 'view-only' | 'live-editor' | 'editor-apply'
export type CatalogLayout = 'detail' | 'card'

export type ObjectType = 'furniture' | 'fixture' | 'decor' | 'wall' | 'door' | 'window'

export interface CatalogFolder {
  id: string
  label: string
  icon: string
  children?: CatalogFolder[]
  itemTypes?: ObjectType[]
}

export interface Dims {
  w: number // cm
  d: number // cm
  h: number // cm
}

export interface Clearance {
  front?: number
  back?: number
  left?: number
  right?: number
}

export interface FurnitureComponent {
  id: string
  name: string
  qty: number
  dim: [number, number, number] // [w, d, h] cm
  weightKg: number
  fragile: boolean
  fragileFaces: Array<'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'>
  detachable: DetachState
  allowedOrientations: Orientation[]
  maxTiltDeg: number
  paddingCm: number
  reassemblyRisk: 'none' | 'low' | 'medium' | 'high' | 'warranty-void'
}

export interface FurnitureItem {
  id: string
  name: string
  assembled: Dims
  clearance: Clearance
  canTilt: boolean
  priority: Priority
  color: string // hex, auto-assigned pastel
  modelUrl?: string // .glb path if provided
  components: FurnitureComponent[]
  type?: ObjectType
  category?: string // e.g. "furniture/seating"
  icon?: string // emoji for catalog thumbnail
  // runtime state
  position?: { x: number; y: number }
  rotation?: number // degrees
  visible: boolean
}

// ─── Room / Environment ───────────────────────────────────────────────────────

export interface WallSegment {
  x1: number; y1: number
  x2: number; y2: number
}

export interface Door {
  id: string
  wallIndex: number
  offsetAlongWall: number // cm from wall start
  widthCm: number
  heightCm: number
}

export interface CorridorTurn {
  angleDeg: number
  radiusCm: number
}

export interface Corridor {
  id: string
  widthCm: number
  lengthCm: number
  turns: CorridorTurn[]
}

export interface Room {
  id: string
  name: string
  walls: WallSegment[]
  doors: Door[]
  corridors: Corridor[]
  ceilingHeightCm: number
  walkwayMinCm: number
}

// ─── Solver Output ────────────────────────────────────────────────────────────

export type VerdictType = 'full-fit' | 'compromise' | 'impossible'
export type TransportMode = 'whole' | 'doors-off' | 'flat-pack'

export interface StepIssue {
  type: 'stall' | 'clearance' | 'fragile'
  message: string
  shortfallCm?: number
  suggestion?: string
}

export interface PlanStep {
  index: number
  furnitureId: string
  furnitureName: string
  transportMode: TransportMode
  action: string
  issue?: StepIssue
  pathNodes?: Array<{ x: number; y: number; rot: number }>
}

export interface SolverPlan {
  verdict: VerdictType
  compromisedIds: string[] // items dropped (flex/prefer only)
  impossibleReason?: string
  minFixSuggestion?: string
  entryOrder: string[] // furniture ids in entry order
  steps: PlanStep[]
  computedAt: number // timestamp
}

// ─── Sequence / Animation ─────────────────────────────────────────────────────

export type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'

export interface SequenceStep {
  step_id: number
  object_id: string
  object_name: string
  start_pos_x: number
  start_pos_y: number
  start_rot: number
  end_pos_x: number
  end_pos_y: number
  end_rot: number
  duration_s: number
  easing: EasingType
  notes: string
}

export type PlaybackState = 'idle' | 'playing' | 'paused'

export type InspectorTab = 'room' | 'display' | 'object' | 'sequence'

// ─── Display Settings ─────────────────────────────────────────────────────────

export interface DisplaySettings {
  showBoundingBox: boolean
  boundingBoxColor: string
  boundingBoxOpacity: number
  showClearanceZone: boolean
  clearanceZoneColor: string
  clearanceZoneStyle: 'dashed' | 'solid'
  materialMode: MaterialMode
  fallbackColor: string
  showFragileFaces: boolean
  fragileFaceColor: string
  collisionColor: string
  fragileCollisionColor: string
  showFloorShadow: boolean
  showGhostTrail: boolean
  viewMode: '3d' | '2d'
}
