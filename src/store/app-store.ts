import { create } from 'zustand'
import { temporal } from 'zundo'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  FurnitureItem, Room, SolverPlan, PlanStep,
  Theme, CatalogMode, CatalogLayout, DisplaySettings,
  SequenceStep, InspectorTab,
  PlacementMode, TransformTarget,
} from '@/types'
import {
  MASTER_BEDROOM_ROOM,
  COMPACT_STUDIO_ROOM,
  ROOM_PRESETS,
  BEDROOM_PRESETS,
  makePresets,
} from '@/data/presets'

// ─── Default values ───────────────────────────────────────────────────────────

const DEFAULT_ROOM: Room = {
  id: 'room-master-bedroom',
  name: 'Master Bedroom & Hallway',
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

const DEFAULT_DISPLAY: DisplaySettings = {
  showBoundingBox: true,
  boundingBoxColor: '#38bdf8',
  boundingBoxOpacity: 0.8,
  showClearanceZone: true,
  clearanceZoneColor: '#eab308',
  clearanceZoneStyle: 'dashed',
  materialMode: 'matte',
  fallbackColor: '#cbd5e1',
  showFragileFaces: true,
  fragileFaceColor: '#06b6d4',
  collisionColor: '#ef4444',
  fragileCollisionColor: '#f97316',
  showFloorShadow: true,
  showGhostTrail: true,
  viewMode: '3d',
}

// ─── Pastel auto-color pool ───────────────────────────────────────────────────

const PASTEL_POOL = [
  '#a8d8ea', '#aa96da', '#fcbad3', '#ffffd2', '#b5ead7',
  '#c7ceea', '#ffdac1', '#e2f0cb', '#b5b9ff', '#ffb7b2',
]
let colorIndex = 0
export const nextColor = () => PASTEL_POOL[colorIndex++ % PASTEL_POOL.length]

// ─── Store interface ──────────────────────────────────────────────────────────

interface AppStore {
  // Environment
  room: Room
  setRoom: (r: Room) => void
  selectRoomPreset: (presetId: string) => void

  // Furniture catalog
  furniture: FurnitureItem[]
  setFurniture: (f: FurnitureItem[]) => void
  addFurniture: (f: FurnitureItem) => void
  updateFurniture: (id: string, patch: Partial<FurnitureItem>) => void
  removeFurniture: (id: string) => void
  setFurnitureVisible: (id: string, visible: boolean) => void
  resetToPresets: () => void

  // Selection (3D editor)
  selectedId: string | null
  setSelectedId: (id: string | null) => void

  // Solver
  plan: SolverPlan | null
  solverRunning: boolean
  setPlan: (p: SolverPlan | null) => void
  setSolverRunning: (v: boolean) => void

  // Simulation
  playbackStep: number
  playbackPlaying: boolean
  playbackProgress: number // 0.0 to 1.0 along active step path
  setPlaybackStep: (n: number) => void
  setPlaybackPlaying: (v: boolean) => void
  setPlaybackProgress: (p: number) => void
  currentStep: () => PlanStep | null

  // UI state
  activeTab: 'catalog' | 'editor' | 'hierarchy' | 'simulation'
  setActiveTab: (t: AppStore['activeTab']) => void
  catalogMode: CatalogMode
  setCatalogMode: (m: CatalogMode) => void
  catalogLayout: CatalogLayout
  setCatalogLayout: (l: CatalogLayout) => void
  sidebarOpen: boolean
  sidebarItemId: string | null
  openSidebar: (id: string) => void
  closeSidebar: () => void

  // Display
  display: DisplaySettings
  setDisplay: (patch: Partial<DisplaySettings>) => void

  // Theme
  theme: Theme
  setTheme: (t: Theme) => void

  // N-Tab Inspector
  inspectorTab: InspectorTab
  setInspectorTab: (t: InspectorTab) => void

  // Sequence CSV Editor
  sequenceRows: SequenceStep[]
  setSequenceRows: (rows: SequenceStep[]) => void
  updateSequenceRow: (stepId: number, patch: Partial<SequenceStep>) => void
  insertSequenceRow: (afterStepId?: number) => void
  deleteSequenceRow: (stepId: number) => void
  moveSequenceRow: (stepId: number, direction: 'up' | 'down') => void
  isCSVEditorOpen: boolean
  setCSVEditorOpen: (v: boolean) => void
  liveSyncEnabled: boolean
  setLiveSyncEnabled: (v: boolean) => void
  pendingChanges: number
  saveSequenceAnimation: () => void
  exportSequenceCSV: () => void
  copySequencePrompt: () => void

  // Catalog Explorer Panel (Unity style) & Drag Placement
  catalogPanelVisible: boolean
  setCatalogPanelVisible: (v: boolean) => void
  catalogPanelHeight: number
  setCatalogPanelHeight: (h: number) => void
  catalogTreeWidth: number
  setCatalogTreeWidth: (w: number) => void
  catalogSelectedFolder: string
  setCatalogSelectedFolder: (id: string) => void
  catalogExpandedFolders: string[]
  toggleCatalogFolderExpanded: (id: string) => void
  catalogSearch: string
  setCatalogSearch: (s: string) => void
  catalogSortBy: 'name' | 'priority' | 'size'
  setCatalogSortBy: (s: 'name' | 'priority' | 'size') => void
  catalogViewMode: 'grid' | 'list'
  setCatalogViewMode: (m: 'grid' | 'list') => void
  autoFillCSVOnDrop: boolean
  setAutoFillCSVOnDrop: (v: boolean) => void
  draggedCatalogItem: FurnitureItem | null
  setDraggedCatalogItem: (item: FurnitureItem | null) => void
  dropGhostPos: { x: number; y: number } | null
  setDropGhostPos: (pos: { x: number; y: number } | null) => void
  placeCatalogItemAt: (item: FurnitureItem, x: number, y: number) => void

  // v08: Transform Triad & Placement Modes
  selectedTransformTarget: TransformTarget
  setSelectedTransformTarget: (target: TransformTarget) => void
  setFurniturePlacementMode: (id: string, mode: PlacementMode) => void
  updateFurnitureTransformTarget: (id: string, target: TransformTarget, patch: { x?: number; y?: number; rotation?: number }) => void
  snapFurnitureToEntrance: (id: string, target?: 'start' | 'end') => void
  invertFurnitureMotion: (id: string) => void
  setFurnitureLocalProgress: (id: string, progress: number) => void

  // v08: Sequence Reordering & CSV Resorting
  reorderSequenceRows: (fromIndex: number, toIndex: number) => void
  moveSequenceRowToExtreme: (stepId: number, position: 'start' | 'latest') => void
  moveSequenceRowToStep: (stepId: number, targetStep: number) => void
}

// ─── Persistent Store (localStorage) ──────────────────────────────────────────

const memoryFallback = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
}

const getBrowserStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) return (globalThis as any).localStorage
  } catch {}
  return memoryFallback
}

export const useAppStore = create<AppStore>()(
  persist(
    temporal(
      (set, get) => ({
        room: MASTER_BEDROOM_ROOM,
        setRoom: (r) => set({ room: r }),
        selectRoomPreset: (presetId) => {
          const target = ROOM_PRESETS.find(p => p.id === presetId) ?? ROOM_PRESETS[0]
          set({
            room: target.room,
            furniture: makePresets(target.id),
            plan: null,
            playbackStep: 0,
            playbackProgress: 1.0,
            playbackPlaying: false,
            selectedId: null,
          })
        },

        // Initialize with Master Bedroom preset
        furniture: makePresets('room-master-bedroom'),
        setFurniture: (items) => set({ furniture: items }),
        addFurniture: (f) => set((s) => ({ furniture: [...s.furniture, f] })),
        updateFurniture: (id, patch) =>
          set((s) => ({
            furniture: s.furniture.map((f) => (f.id === id ? { ...f, ...patch } : f)),
          })),
        removeFurniture: (id) =>
          set((s) => ({ furniture: s.furniture.filter((f) => f.id !== id) })),
        setFurnitureVisible: (id, visible) =>
          set((s) => ({
            furniture: s.furniture.map((f) => (f.id === id ? { ...f, visible } : f)),
          })),
        resetToPresets: () => {
          const currentRoomId = get().room.id
          const target = ROOM_PRESETS.find(p => p.id === currentRoomId) ?? ROOM_PRESETS[0]
          set({
            furniture: makePresets(target.id),
            room: target.room,
            plan: null,
            playbackStep: 0,
            playbackProgress: 1.0,
            playbackPlaying: false,
            selectedId: null,
          })
        },

        selectedId: null,
        setSelectedId: (id) => set({ selectedId: id }),

        plan: null,
        solverRunning: false,
        setPlan: (p) => set({ plan: p }),
        setSolverRunning: (v) => set({ solverRunning: v }),

        playbackStep: 0,
        playbackPlaying: false,
        playbackProgress: 1.0,
        setPlaybackStep: (n) => set({ playbackStep: n, playbackProgress: 1.0 }),
        setPlaybackPlaying: (v) => set({ playbackPlaying: v }),
        setPlaybackProgress: (p) => set({ playbackProgress: p }),
        currentStep: () => {
          const { plan, playbackStep } = get()
          return plan?.steps[playbackStep] ?? null
        },

        activeTab: 'editor',
        setActiveTab: (t) => set({ activeTab: t }),
        catalogMode: 'live-editor',
        setCatalogMode: (m) => set({ catalogMode: m }),
        catalogLayout: 'card',
        setCatalogLayout: (l) => set({ catalogLayout: l }),
        sidebarOpen: false,
        sidebarItemId: null,
        openSidebar: (id) => set({ sidebarOpen: true, sidebarItemId: id }),
        closeSidebar: () => set({ sidebarOpen: false, sidebarItemId: null }),

        display: DEFAULT_DISPLAY,
        setDisplay: (patch) =>
          set((s) => ({ display: { ...s.display, ...patch } })),

        theme: 'dark',
        setTheme: (t) => set({ theme: t }),

        // N-Tab Inspector
        inspectorTab: 'room',
        setInspectorTab: (t) => set({ inspectorTab: t }),

        // Sequence CSV Editor
        sequenceRows: [],
        setSequenceRows: (rows) => set({ sequenceRows: rows }),
        updateSequenceRow: (stepId, patch) =>
          set((s) => ({
            sequenceRows: s.sequenceRows.map((r) =>
              r.step_id === stepId ? { ...r, ...patch } : r
            ),
            pendingChanges: s.liveSyncEnabled ? s.pendingChanges : s.pendingChanges + 1,
          })),
        insertSequenceRow: (afterStepId) =>
          set((s) => {
            const rows = s.sequenceRows
            const newId = rows.length > 0 ? Math.max(...rows.map(r => r.step_id)) + 1 : 1
            const newRow: SequenceStep = {
              step_id: newId,
              object_id: '',
              object_name: '',
              start_pos_x: 0, start_pos_y: 0, start_rot: 0,
              end_pos_x: 0, end_pos_y: 0, end_rot: 0,
              duration_s: 1.0,
              easing: 'ease-in-out',
              notes: '',
            }
            if (afterStepId === undefined) {
              return { sequenceRows: [...rows, newRow] }
            }
            const idx = rows.findIndex(r => r.step_id === afterStepId)
            const next = [...rows]
            next.splice(idx + 1, 0, newRow)
            return { sequenceRows: next }
          }),
        deleteSequenceRow: (stepId) =>
          set((s) => ({ sequenceRows: s.sequenceRows.filter(r => r.step_id !== stepId) })),
        moveSequenceRow: (stepId, direction) =>
          set((s) => {
            const rows = [...s.sequenceRows]
            const idx = rows.findIndex(r => r.step_id === stepId)
            if (idx === -1) return {}
            const swapIdx = direction === 'up' ? idx - 1 : idx + 1
            if (swapIdx < 0 || swapIdx >= rows.length) return {}
            ;[rows[idx], rows[swapIdx]] = [rows[swapIdx], rows[idx]]
            return { sequenceRows: rows }
          }),
        isCSVEditorOpen: false,
        setCSVEditorOpen: (v) => set({ isCSVEditorOpen: v }),
        liveSyncEnabled: false,
        setLiveSyncEnabled: (v) => set({ liveSyncEnabled: v, pendingChanges: 0 }),
        pendingChanges: 0,
        saveSequenceAnimation: () => set({ pendingChanges: 0 }),
        exportSequenceCSV: () => {
          const { sequenceRows, room } = get()
          const header = 'step_id,object_id,object_name,start_pos_x,start_pos_y,start_rot,end_pos_x,end_pos_y,end_rot,duration_s,easing,notes'
          const rows = sequenceRows.map(r =>
            [r.step_id, r.object_id, r.object_name, r.start_pos_x, r.start_pos_y, r.start_rot,
             r.end_pos_x, r.end_pos_y, r.end_rot, r.duration_s, r.easing,
             `"${r.notes.replace(/"/g, '""')}"`].join(',')
          )
          const csv = [header, ...rows].join('\n')
          // Copy to clipboard
          navigator.clipboard?.writeText(csv).catch(() => {})
          // Download file
          const ts = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '').replace('T', '_')
          const filename = `sequence_${room.name.replace(/\s+/g, '_')}_${ts}.csv`
          const blob = new Blob([csv], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url; a.download = filename; a.click()
          URL.revokeObjectURL(url)
        },
        copySequencePrompt: () => {
          const { sequenceRows, room, furniture } = get()
          const header = 'step_id,object_id,object_name,start_pos_x,start_pos_y,start_rot,end_pos_x,end_pos_y,end_rot,duration_s,easing'
          const rowsNoNotes = sequenceRows.map(r =>
            [r.step_id, r.object_id, r.object_name, r.start_pos_x, r.start_pos_y, r.start_rot,
             r.end_pos_x, r.end_pos_y, r.end_rot, r.duration_s, r.easing].join(',')
          )
          const csvFull = [
            'step_id,object_id,object_name,start_pos_x,start_pos_y,start_rot,end_pos_x,end_pos_y,end_rot,duration_s,easing,notes',
            ...sequenceRows.map(r =>
              [r.step_id, r.object_id, r.object_name, r.start_pos_x, r.start_pos_y, r.start_rot,
               r.end_pos_x, r.end_pos_y, r.end_rot, r.duration_s, r.easing,
               `"${r.notes.replace(/"/g, '""')}"`].join(',')
            ),
          ].join('\n')
          const walls = room.walls
          const W = walls.length > 1 ? Math.abs(walls[1].x2 - walls[0].x1) : 0
          const D = walls.length > 2 ? Math.abs(walls[2].y2 - walls[0].y1) : 0
          const totalDur = sequenceRows.reduce((a, r) => a + r.duration_s, 0)
          const prompt = [
            '[FORMAT 1 — AI PROMPT]',
            'You are a furniture layout animation assistant.',
            'Animate the following objects in sequence for a room layout fitting:',
            '',
            `${header}`,
            ...rowsNoNotes,
            '',
            `Room: ${(W/100).toFixed(1)}m x ${(D/100).toFixed(1)}m x ${(room.ceilingHeightCm/100).toFixed(1)}m | Objects: ${furniture.length} | Total Duration: ${totalDur.toFixed(1)}s`,
            '',
            '---',
            '',
            '[FORMAT 2 — RAW CSV]',
            csvFull,
          ].join('\n')
          navigator.clipboard?.writeText(prompt).catch(() => {})
        },

        // Catalog Explorer Panel (Unity style) & Drag Placement
        catalogPanelVisible: true,
        setCatalogPanelVisible: (v) => set({ catalogPanelVisible: v }),
        catalogPanelHeight: 200,
        setCatalogPanelHeight: (h) => set({ catalogPanelHeight: Math.max(120, Math.min(h, window.innerHeight * 0.45)) }),
        catalogTreeWidth: 300,
        setCatalogTreeWidth: (w) => set({ catalogTreeWidth: Math.max(260, Math.min(w, window.innerWidth * 0.5)) }),
        catalogSelectedFolder: 'furniture/seating',
        setCatalogSelectedFolder: (id) => set({ catalogSelectedFolder: id }),
        catalogExpandedFolders: ['furniture', 'obstacles', 'decor'],
        toggleCatalogFolderExpanded: (id) =>
          set((s) => ({
            catalogExpandedFolders: s.catalogExpandedFolders.includes(id)
              ? s.catalogExpandedFolders.filter(f => f !== id)
              : [...s.catalogExpandedFolders, id],
          })),
        catalogSearch: '',
        setCatalogSearch: (s) => set({ catalogSearch: s }),
        catalogSortBy: 'name',
        setCatalogSortBy: (s) => set({ catalogSortBy: s }),
        catalogViewMode: 'grid',
        setCatalogViewMode: (m) => set({ catalogViewMode: m }),
        autoFillCSVOnDrop: true,
        setAutoFillCSVOnDrop: (v) => set({ autoFillCSVOnDrop: v }),
        draggedCatalogItem: null,
        setDraggedCatalogItem: (item) => set({ draggedCatalogItem: item }),
        dropGhostPos: null,
        setDropGhostPos: (pos) => set({ dropGhostPos: pos }),
        placeCatalogItemAt: (item, x, y) => {
          const { room } = get()
          const door = room.doors[0]
          const doorStart = door?.offsetAlongWall ?? 160
          const doorWidth = door?.widthCm ?? 180
          const corridor = room.corridors[0]
          const corridorLen = corridor?.lengthCm ?? 140
          const entranceX = Math.round(doorStart + doorWidth / 2)
          const entranceY = Math.round(-corridorLen)

          const newId = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`
          const newItem: FurnitureItem = {
            ...item,
            id: newId,
            position: { x: Math.round(x), y: Math.round(y) },
            rotation: 0,
            visible: true,
            color: item.color || nextColor(),
            components: item.components ? JSON.parse(JSON.stringify(item.components)) : [],
            placementMode: 'inserting',
            startPosition: { x: entranceX, y: entranceY },
            startRotation: 0,
            endPosition: { x: Math.round(x), y: Math.round(y) },
            endRotation: 0,
            localProgress: 1.0,
          }

          const { autoFillCSVOnDrop, sequenceRows } = get()
          let nextRows = sequenceRows
          if (autoFillCSVOnDrop) {
            const nextStepId = sequenceRows.length > 0 ? Math.max(...sequenceRows.map(r => r.step_id)) + 1 : 1
            const newSeqRow: SequenceStep = {
              step_id: nextStepId,
              object_id: newItem.id,
              object_name: newItem.name,
              start_pos_x: entranceX,
              start_pos_y: entranceY,
              start_rot: 0,
              end_pos_x: Math.round(x),
              end_pos_y: Math.round(y),
              end_rot: 0,
              duration_s: 1.5,
              easing: 'ease-in-out',
              notes: 'Mode: inserting',
            }
            nextRows = [...sequenceRows, newSeqRow]
          }

          set((s) => ({
            furniture: [...s.furniture, newItem],
            selectedId: newId,
            inspectorTab: 'object',
            sequenceRows: nextRows,
            draggedCatalogItem: null,
            dropGhostPos: null,
          }))
        },

        // v08: Transform Triad & Placement Modes
        selectedTransformTarget: 'end',
        setSelectedTransformTarget: (t) => set({ selectedTransformTarget: t }),

        setFurniturePlacementMode: (id, mode) => {
          const { room, furniture, sequenceRows } = get()
          const door = room.doors[0]
          const doorStart = door?.offsetAlongWall ?? 160
          const doorWidth = door?.widthCm ?? 180
          const corridor = room.corridors[0]
          const corridorLen = corridor?.lengthCm ?? 140
          const entranceX = Math.round(doorStart + doorWidth / 2)
          const entranceY = Math.round(-corridorLen)

          const item = furniture.find(f => f.id === id)
          if (!item) return

          const currentX = item.position?.x ?? 100
          const currentY = item.position?.y ?? 100
          const currentRot = item.rotation ?? 0

          let startPos = item.startPosition ?? { x: currentX, y: currentY }
          let startRot = item.startRotation ?? currentRot
          let endPos = item.endPosition ?? { x: currentX, y: currentY }
          let endRot = item.endRotation ?? currentRot

          if (mode === 'static') {
            startPos = { x: currentX, y: currentY }
            startRot = currentRot
            endPos = { x: currentX, y: currentY }
            endRot = currentRot
          } else if (mode === 'inserting') {
            startPos = { x: entranceX, y: entranceY }
            startRot = 0
            endPos = { x: currentX, y: currentY }
            endRot = currentRot
          } else if (mode === 'packing') {
            startPos = { x: currentX, y: currentY }
            startRot = currentRot
            endPos = { x: entranceX, y: entranceY }
            endRot = 0
          }

          // Sync matching sequenceRows
          const nextRows = sequenceRows.map(r => {
            if (r.object_id === id) {
              return {
                ...r,
                start_pos_x: startPos.x,
                start_pos_y: startPos.y,
                start_rot: startRot,
                end_pos_x: endPos.x,
                end_pos_y: endPos.y,
                end_rot: endRot,
                notes: `Mode: ${mode}`,
              }
            }
            return r
          })

          set((s) => ({
            furniture: s.furniture.map(f => f.id === id ? {
              ...f,
              placementMode: mode,
              startPosition: startPos,
              startRotation: startRot,
              endPosition: endPos,
              endRotation: endRot,
            } : f),
            sequenceRows: nextRows,
          }))
        },

        updateFurnitureTransformTarget: (id, target, patch) => {
          const { furniture, sequenceRows } = get()
          const item = furniture.find(f => f.id === id)
          if (!item) return

          const updatedFurniture = furniture.map(f => {
            if (f.id !== id) return f
            const updated = { ...f }
            if (target === 'end') {
              const newEnd = { ...(f.endPosition ?? f.position ?? { x: 0, y: 0 }) }
              if (patch.x !== undefined) newEnd.x = patch.x
              if (patch.y !== undefined) newEnd.y = patch.y
              updated.endPosition = newEnd
              if (patch.rotation !== undefined) updated.endRotation = patch.rotation
              updated.position = { ...newEnd }
              if (patch.rotation !== undefined) updated.rotation = patch.rotation
            } else if (target === 'start') {
              const newStart = { ...(f.startPosition ?? f.position ?? { x: 0, y: 0 }) }
              if (patch.x !== undefined) newStart.x = patch.x
              if (patch.y !== undefined) newStart.y = patch.y
              updated.startPosition = newStart
              if (patch.rotation !== undefined) updated.startRotation = patch.rotation
            } else if (target === 'current') {
              const newPos = { ...(f.position ?? { x: 0, y: 0 }) }
              if (patch.x !== undefined) newPos.x = patch.x
              if (patch.y !== undefined) newPos.y = patch.y
              updated.position = newPos
              if (patch.rotation !== undefined) updated.rotation = patch.rotation
              if (f.placementMode === 'static') {
                updated.startPosition = { ...newPos }
                updated.endPosition = { ...newPos }
                if (patch.rotation !== undefined) {
                  updated.startRotation = patch.rotation
                  updated.endRotation = patch.rotation
                }
              }
            }
            return updated
          })

          // Sync matching sequenceRows
          const targetItem = updatedFurniture.find(f => f.id === id)
          const nextRows = sequenceRows.map(r => {
            if (r.object_id === id && targetItem) {
              return {
                ...r,
                start_pos_x: targetItem.startPosition?.x ?? r.start_pos_x,
                start_pos_y: targetItem.startPosition?.y ?? r.start_pos_y,
                start_rot: targetItem.startRotation ?? r.start_rot,
                end_pos_x: targetItem.endPosition?.x ?? r.end_pos_x,
                end_pos_y: targetItem.endPosition?.y ?? r.end_pos_y,
                end_rot: targetItem.endRotation ?? r.end_rot,
              }
            }
            return r
          })

          set({ furniture: updatedFurniture, sequenceRows: nextRows })
        },

        snapFurnitureToEntrance: (id, target = 'start') => {
          const { room } = get()
          const door = room.doors[0]
          const doorStart = door?.offsetAlongWall ?? 160
          const doorWidth = door?.widthCm ?? 180
          const corridor = room.corridors[0]
          const corridorLen = corridor?.lengthCm ?? 140
          const entranceX = Math.round(doorStart + doorWidth / 2)
          const entranceY = Math.round(-corridorLen)

          get().updateFurnitureTransformTarget(id, target, { x: entranceX, y: entranceY, rotation: 0 })
        },

        invertFurnitureMotion: (id) => {
          const { furniture, sequenceRows } = get()
          const item = furniture.find(f => f.id === id)
          if (!item) return

          const oldStart = item.startPosition ?? item.position ?? { x: 0, y: 0 }
          const oldStartRot = item.startRotation ?? item.rotation ?? 0
          const oldEnd = item.endPosition ?? item.position ?? { x: 0, y: 0 }
          const oldEndRot = item.endRotation ?? item.rotation ?? 0
          const nextMode: PlacementMode = item.placementMode === 'inserting' ? 'packing' : 'inserting'

          set((s) => ({
            furniture: s.furniture.map(f => f.id === id ? {
              ...f,
              placementMode: nextMode,
              startPosition: { ...oldEnd },
              startRotation: oldEndRot,
              endPosition: { ...oldStart },
              endRotation: oldStartRot,
            } : f),
            sequenceRows: sequenceRows.map(r => r.object_id === id ? {
              ...r,
              start_pos_x: oldEnd.x,
              start_pos_y: oldEnd.y,
              start_rot: oldEndRot,
              end_pos_x: oldStart.x,
              end_pos_y: oldStart.y,
              end_rot: oldStartRot,
              notes: `Mode: ${nextMode}`,
            } : r),
          }))
        },

        setFurnitureLocalProgress: (id, progress) => {
          set((s) => ({
            furniture: s.furniture.map(f => {
              if (f.id !== id) return f
              const sPos = f.startPosition ?? f.position ?? { x: 0, y: 0 }
              const ePos = f.endPosition ?? f.position ?? { x: 0, y: 0 }
              const sRot = f.startRotation ?? f.rotation ?? 0
              const eRot = f.endRotation ?? f.rotation ?? 0
              const p = Math.max(0, Math.min(1, progress))

              const curX = Math.round(sPos.x + (ePos.x - sPos.x) * p)
              const curY = Math.round(sPos.y + (ePos.y - sPos.y) * p)
              const curRot = Math.round(sRot + (eRot - sRot) * p)

              return {
                ...f,
                localProgress: p,
                position: { x: curX, y: curY },
                rotation: curRot,
              }
            }),
          }))
        },

        // v08: Sequence Reordering & CSV Resorting
        reorderSequenceRows: (fromIndex, toIndex) => {
          set((s) => {
            const rows = [...s.sequenceRows]
            if (fromIndex < 0 || fromIndex >= rows.length || toIndex < 0 || toIndex >= rows.length) return {}
            const [moved] = rows.splice(fromIndex, 1)
            rows.splice(toIndex, 0, moved)
            const reindexed = rows.map((r, i) => ({ ...r, step_id: i + 1 }))
            return { sequenceRows: reindexed }
          })
        },

        moveSequenceRowToExtreme: (stepId, position) => {
          set((s) => {
            const rows = [...s.sequenceRows]
            const idx = rows.findIndex(r => r.step_id === stepId)
            if (idx === -1) return {}
            const [moved] = rows.splice(idx, 1)
            if (position === 'start') {
              rows.unshift(moved)
            } else {
              rows.push(moved)
            }
            const reindexed = rows.map((r, i) => ({ ...r, step_id: i + 1 }))
            return { sequenceRows: reindexed }
          })
        },

        moveSequenceRowToStep: (stepId, targetStep) => {
          set((s) => {
            const rows = [...s.sequenceRows]
            const idx = rows.findIndex(r => r.step_id === stepId)
            if (idx === -1) return {}
            const [moved] = rows.splice(idx, 1)
            const targetIdx = Math.max(0, Math.min(rows.length, targetStep - 1))
            rows.splice(targetIdx, 0, moved)
            const reindexed = rows.map((r, i) => ({ ...r, step_id: i + 1 }))
            return { sequenceRows: reindexed }
          })
        },
      }),
      { limit: 50 }
    ),
    {
      name: 'pack-and-place-storage-v2',
      storage: createJSONStorage(getBrowserStorage),
      // Persist all user parameters across page reloads
      partialize: (state) => ({
        room: state.room,
        furniture: state.furniture,
        selectedId: state.selectedId,
        plan: state.plan,
        catalogMode: state.catalogMode,
        catalogLayout: state.catalogLayout,
        display: state.display,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        // Fallback if rehydrated with empty furniture
        if (state && (!state.furniture || state.furniture.length === 0)) {
          state.furniture = makePresets()
        }
      },
    }
  )
)
