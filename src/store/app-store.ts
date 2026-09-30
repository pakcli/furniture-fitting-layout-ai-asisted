import { create } from 'zustand'
import { temporal } from 'zundo'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  FurnitureItem, Room, SolverPlan, PlanStep,
  Theme, CatalogMode, CatalogLayout, DisplaySettings,
  SequenceStep, InspectorTab,
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
