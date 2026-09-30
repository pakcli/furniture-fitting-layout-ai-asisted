import { create } from 'zustand'
import { temporal } from 'zundo'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  FurnitureItem, Room, SolverPlan, PlanStep,
  Theme, CatalogMode, CatalogLayout, DisplaySettings,
} from '@/types'
import { BEDROOM_PRESETS, makePresets } from '@/data/presets'

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
        room: DEFAULT_ROOM,
        setRoom: (r) => set({ room: r }),

        // Initialize with Master Bedroom preset
        furniture: makePresets(),
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
        resetToPresets: () =>
          set({
            furniture: makePresets(),
            room: DEFAULT_ROOM,
            plan: null,
            playbackStep: 0,
            playbackProgress: 1.0,
            playbackPlaying: false,
            selectedId: null,
          }),

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
