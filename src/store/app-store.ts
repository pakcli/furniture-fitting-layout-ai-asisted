import { create } from 'zustand'
import { temporal } from 'zundo'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  FurnitureItem, Room, SolverPlan, PlanStep,
  Theme, CatalogMode, CatalogLayout, DisplaySettings,
  SequenceStep, InspectorTab,
  PlacementMode, TransformTarget,
  Project, ProjectMetadata,
} from '@/types'
import {
  MASTER_BEDROOM_ROOM,
  COMPACT_STUDIO_ROOM,
  ROOM_PRESETS,
  BEDROOM_PRESETS,
  BEDROOM_SEQUENCE_ROWS,
  BEDROOM_PLAN,
  createFactorySampleProjects,
  makePresets,
} from '@/data/presets'

// ─── Default values ───────────────────────────────────────────────────────────

const DEFAULT_ROOM: Room = MASTER_BEDROOM_ROOM

const DEFAULT_DISPLAY: DisplaySettings = {
  showBoundingBox: true,
  boundingBoxColor: '#38bdf8',
  boundingBoxOpacity: 0.8,
  showClearanceZone: true,
  clearanceZoneColor: '#eab308',
  clearanceZoneStyle: 'dashed',
  materialMode: 'matte',
  fallbackColor: '#94a3b8',
  showFragileFaces: true,
  fragileFaceColor: '#ef4444',
  collisionColor: '#ef4444',
  fragileCollisionColor: '#f97316',
  showFloorShadow: true,
  showGhostTrail: true,
  viewMode: '3d',
}

const PASTEL_COLORS = [
  '#fca5a5', '#fdba74', '#fcd34d', '#86efac',
  '#6ee7b7', '#67e8f9', '#93c5fd', '#c4b5fd',
  '#f472b6', '#cbd5e1',
]
let colorIdx = 0
export const nextColor = () => PASTEL_COLORS[colorIdx++ % PASTEL_COLORS.length]

// ─── Store Interface ──────────────────────────────────────────────────────────

export interface AppStore {
  // v09: Multi-Project Management & Copy-On-Write
  projects: Project[]
  activeProjectId: string
  autoSaveStatus: 'saved' | 'saving'
  toastMessage: string | null
  showToast: (msg: string) => void
  selectProject: (projectId: string) => void
  createBlankProject: (name?: string) => string
  duplicateProject: (projectId: string) => string
  renameProject: (projectId: string, newName: string) => void
  deleteProject: (projectId: string) => void
  resetSampleProject: (sampleId: string) => void
  exportProjectJSON: (projectId: string) => void
  importProjectJSON: (jsonString: string) => string | null
  clearAllCustomProjects: () => void
  ensureWritableProject: () => string

  // Active Project Content
  room: Room
  setRoom: (r: Room) => void
  selectRoomPreset: (presetId: string) => void

  furniture: FurnitureItem[]
  setFurniture: (items: FurnitureItem[]) => void
  addFurniture: (f: FurnitureItem) => void
  updateFurniture: (id: string, patch: Partial<FurnitureItem>) => void
  removeFurniture: (id: string) => void
  setFurnitureVisible: (id: string, visible: boolean) => void
  resetToPresets: () => void

  selectedId: string | null
  setSelectedId: (id: string | null) => void

  plan: SolverPlan | null
  solverRunning: boolean
  setPlan: (p: SolverPlan | null) => void
  setSolverRunning: (v: boolean) => void

  playbackStep: number
  playbackPlaying: boolean
  playbackProgress: number // 0.0 to 1.0 within current step
  setPlaybackStep: (n: number) => void
  setPlaybackPlaying: (v: boolean) => void
  setPlaybackProgress: (p: number) => void
  currentStep: () => PlanStep | null

  activeTab: 'catalog' | 'editor' | 'hierarchy' | 'simulation'
  setActiveTab: (t: 'catalog' | 'editor' | 'hierarchy' | 'simulation') => void
  catalogMode: CatalogMode
  setCatalogMode: (m: CatalogMode) => void
  catalogLayout: CatalogLayout
  setCatalogLayout: (l: CatalogLayout) => void
  sidebarOpen: boolean
  sidebarItemId: string | null
  openSidebar: (id: string) => void
  closeSidebar: () => void

  display: DisplaySettings
  setDisplay: (patch: Partial<DisplaySettings>) => void

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

  // CSV Editor Panel State
  isCSVEditorOpen: boolean
  setCSVEditorOpen: (v: boolean) => void
  liveSyncEnabled: boolean
  setLiveSyncEnabled: (v: boolean) => void
  pendingChanges: number
  saveSequenceAnimation: () => void
  exportSequenceCSV: () => void
  copySequencePrompt: () => void

  // Catalog Explorer Panel (Unity style)
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

// ─── Helpers: Copy-on-Write (COW) Auto-Forking ───────────────────────────────

function checkAndForkSample(
  projects: Project[],
  activeProjectId: string,
  state: { room: Room; furniture: FurnitureItem[]; sequenceRows: SequenceStep[]; plan: SolverPlan | null }
): { projects: Project[]; activeProjectId: string; didFork: boolean; forkedName?: string } {
  const currentProj = projects.find(p => p.id === activeProjectId)
  if (!currentProj || !currentProj.isSample) {
    return { projects, activeProjectId, didFork: false }
  }

  const customCount = projects.filter(p => !p.isSample).length + 1
  const newId = `project-custom-${Date.now()}`
  const newName = `${currentProj.name} (Custom ${customCount})`

  const forkedProject: Project = {
    id: newId,
    name: newName,
    isSample: false,
    samplePresetId: currentProj.samplePresetId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    room: JSON.parse(JSON.stringify(state.room)),
    furniture: JSON.parse(JSON.stringify(state.furniture)),
    sequenceRows: JSON.parse(JSON.stringify(state.sequenceRows)),
    plan: state.plan ? JSON.parse(JSON.stringify(state.plan)) : null,
  }

  return {
    projects: [...projects, forkedProject],
    activeProjectId: newId,
    didFork: true,
    forkedName: newName,
  }
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

const initialProjects = createFactorySampleProjects()
const defaultActiveProject = initialProjects[0]

export const useAppStore = create<AppStore>()(
  persist(
    temporal(
      (set, get) => ({
        // Multi-Project State (v09)
        projects: initialProjects,
        activeProjectId: defaultActiveProject.id,
        autoSaveStatus: 'saved',
        toastMessage: null,

        showToast: (msg: string) => {
          set({ toastMessage: msg })
          setTimeout(() => {
            if (get().toastMessage === msg) {
              set({ toastMessage: null })
            }
          }, 3500)
        },

        ensureWritableProject: () => {
          const s = get()
          const cow = checkAndForkSample(s.projects, s.activeProjectId, s)
          if (cow.didFork) {
            set({
              projects: cow.projects,
              activeProjectId: cow.activeProjectId,
            })
            s.showToast(`✨ Forked to "${cow.forkedName}" (Original sample preserved)`)
          }
          return cow.activeProjectId
        },

        selectProject: (projectId: string) => {
          const target = get().projects.find(p => p.id === projectId)
          if (!target) return
          set({
            activeProjectId: target.id,
            room: JSON.parse(JSON.stringify(target.room)),
            furniture: JSON.parse(JSON.stringify(target.furniture)),
            sequenceRows: JSON.parse(JSON.stringify(target.sequenceRows)),
            plan: target.plan ? JSON.parse(JSON.stringify(target.plan)) : null,
            playbackStep: 0,
            playbackProgress: 1.0,
            playbackPlaying: false,
            selectedId: null,
          })
          get().showToast(`📁 Loaded project: "${target.name}"`)
        },

        createBlankProject: (name = 'New Project') => {
          const newId = `project-${Date.now()}`
          const newProj: Project = {
            id: newId,
            name,
            isSample: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            room: JSON.parse(JSON.stringify(MASTER_BEDROOM_ROOM)),
            furniture: [],
            sequenceRows: [],
            plan: null,
          }
          set((s) => ({
            projects: [...s.projects, newProj],
            activeProjectId: newId,
            room: newProj.room,
            furniture: [],
            sequenceRows: [],
            plan: null,
            playbackStep: 0,
            playbackProgress: 1.0,
            playbackPlaying: false,
            selectedId: null,
          }))
          get().showToast(`➕ Created "${name}"`)
          return newId
        },

        duplicateProject: (projectId: string) => {
          const source = get().projects.find(p => p.id === projectId)
          if (!source) return ''
          const newId = `project-${Date.now()}`
          const newName = `${source.name} (Copy)`
          const copy: Project = {
            ...JSON.parse(JSON.stringify(source)),
            id: newId,
            name: newName,
            isSample: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
          set((s) => ({
            projects: [...s.projects, copy],
            activeProjectId: newId,
            room: copy.room,
            furniture: copy.furniture,
            sequenceRows: copy.sequenceRows,
            plan: copy.plan,
            playbackStep: 0,
            playbackProgress: 1.0,
            playbackPlaying: false,
            selectedId: null,
          }))
          get().showToast(`📋 Duplicated to "${newName}"`)
          return newId
        },

        renameProject: (projectId: string, newName: string) => {
          if (!newName.trim()) return
          set((s) => ({
            projects: s.projects.map(p =>
              p.id === projectId ? { ...p, name: newName.trim(), updatedAt: Date.now() } : p
            ),
          }))
          get().showToast(`✏️ Renamed project to "${newName.trim()}"`)
        },

        deleteProject: (projectId: string) => {
          const { projects, activeProjectId } = get()
          const target = projects.find(p => p.id === projectId)
          if (!target || target.isSample) return

          const remaining = projects.filter(p => p.id !== projectId)
          let nextActive = activeProjectId
          if (activeProjectId === projectId) {
            nextActive = remaining[0]?.id ?? 'project-sample-bedroom'
          }
          const nextProj = remaining.find(p => p.id === nextActive) ?? remaining[0]

          set({
            projects: remaining,
            activeProjectId: nextProj.id,
            room: JSON.parse(JSON.stringify(nextProj.room)),
            furniture: JSON.parse(JSON.stringify(nextProj.furniture)),
            sequenceRows: JSON.parse(JSON.stringify(nextProj.sequenceRows)),
            plan: nextProj.plan ? JSON.parse(JSON.stringify(nextProj.plan)) : null,
            playbackStep: 0,
            playbackProgress: 1.0,
            playbackPlaying: false,
            selectedId: null,
          })
          get().showToast(`🗑 Deleted "${target.name}"`)
        },

        resetSampleProject: (sampleId: string) => {
          const factory = createFactorySampleProjects().find(p => p.id === sampleId)
          if (!factory) return
          set((s) => ({
            projects: s.projects.map(p => p.id === sampleId ? JSON.parse(JSON.stringify(factory)) : p),
            activeProjectId: sampleId,
            room: JSON.parse(JSON.stringify(factory.room)),
            furniture: JSON.parse(JSON.stringify(factory.furniture)),
            sequenceRows: JSON.parse(JSON.stringify(factory.sequenceRows)),
            plan: factory.plan ? JSON.parse(JSON.stringify(factory.plan)) : null,
            playbackStep: 0,
            playbackProgress: 1.0,
            playbackPlaying: false,
            selectedId: null,
          }))
          get().showToast(`↺ Reset "${factory.name}" to factory default`)
        },

        exportProjectJSON: (projectId: string) => {
          const proj = get().projects.find(p => p.id === projectId)
          if (!proj) return
          const data = {
            version: 1,
            exportedAt: new Date().toISOString(),
            project: proj,
          }
          const json = JSON.stringify(data, null, 2)
          const blob = new Blob([json], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${proj.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_project.json`
          a.click()
          URL.revokeObjectURL(url)
          get().showToast(`⬇ Exported "${proj.name}" to JSON`)
        },

        importProjectJSON: (jsonString: string) => {
          try {
            const parsed = JSON.parse(jsonString)
            const proj: Project = parsed.project ?? parsed
            if (!proj.room || !proj.furniture) {
              get().showToast('❌ Invalid project file format')
              return null
            }
            const newId = `project-imported-${Date.now()}`
            const importedProj: Project = {
              ...proj,
              id: newId,
              name: `${proj.name || 'Imported Project'} (Imported)`,
              isSample: false,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }
            set((s) => ({
              projects: [...s.projects, importedProj],
              activeProjectId: newId,
              room: JSON.parse(JSON.stringify(importedProj.room)),
              furniture: JSON.parse(JSON.stringify(importedProj.furniture)),
              sequenceRows: JSON.parse(JSON.stringify(importedProj.sequenceRows ?? [])),
              plan: importedProj.plan ? JSON.parse(JSON.stringify(importedProj.plan)) : null,
              playbackStep: 0,
              playbackProgress: 1.0,
              playbackPlaying: false,
              selectedId: null,
            }))
            get().showToast(`📥 Successfully imported "${importedProj.name}"`)
            return newId
          } catch {
            get().showToast('❌ Failed to parse JSON file')
            return null
          }
        },

        clearAllCustomProjects: () => {
          const factory = createFactorySampleProjects()
          set({
            projects: factory,
            activeProjectId: factory[0].id,
            room: JSON.parse(JSON.stringify(factory[0].room)),
            furniture: JSON.parse(JSON.stringify(factory[0].furniture)),
            sequenceRows: JSON.parse(JSON.stringify(factory[0].sequenceRows)),
            plan: factory[0].plan ? JSON.parse(JSON.stringify(factory[0].plan)) : null,
            playbackStep: 0,
            playbackProgress: 1.0,
            playbackPlaying: false,
            selectedId: null,
          })
          get().showToast('🗑 Cleared custom projects (Factory samples restored)')
        },

        // Active Project Content
        room: defaultActiveProject.room,
        setRoom: (r) => {
          const s = get()
          const cow = checkAndForkSample(s.projects, s.activeProjectId, { ...s, room: r })
          const updatedProjects = cow.projects.map(p =>
            p.id === cow.activeProjectId ? { ...p, updatedAt: Date.now(), room: r } : p
          )
          set({
            projects: updatedProjects,
            activeProjectId: cow.activeProjectId,
            room: r,
            toastMessage: cow.didFork ? `✨ Forked to "${cow.forkedName}"` : s.toastMessage,
          })
        },

        selectRoomPreset: (presetId: string) => {
          const sampleProject = get().projects.find(p => p.isSample && p.samplePresetId === presetId)
          if (sampleProject) {
            get().selectProject(sampleProject.id)
            return
          }

          const target = ROOM_PRESETS.find(p => p.id === presetId) ?? ROOM_PRESETS[0]
          const s = get()
          const cow = checkAndForkSample(s.projects, s.activeProjectId, s)
          const updatedProjects = cow.projects.map(p =>
            p.id === cow.activeProjectId ? {
              ...p,
              updatedAt: Date.now(),
              room: target.room,
              furniture: target.furniture,
              sequenceRows: target.sequenceRows,
              plan: target.plan,
            } : p
          )
          set({
            projects: updatedProjects,
            activeProjectId: cow.activeProjectId,
            room: target.room,
            furniture: target.furniture,
            sequenceRows: target.sequenceRows,
            plan: target.plan,
            playbackStep: 0,
            playbackProgress: 1.0,
            playbackPlaying: false,
            selectedId: null,
            toastMessage: cow.didFork ? `✨ Forked to "${cow.forkedName}"` : s.toastMessage,
          })
        },

        furniture: defaultActiveProject.furniture,
        setFurniture: (items) => {
          const s = get()
          const cow = checkAndForkSample(s.projects, s.activeProjectId, { ...s, furniture: items })
          const updatedProjects = cow.projects.map(p =>
            p.id === cow.activeProjectId ? { ...p, updatedAt: Date.now(), furniture: items } : p
          )
          set({
            projects: updatedProjects,
            activeProjectId: cow.activeProjectId,
            furniture: items,
            toastMessage: cow.didFork ? `✨ Forked to "${cow.forkedName}"` : s.toastMessage,
          })
        },

        addFurniture: (f) =>
          set((s) => {
            const cow = checkAndForkSample(s.projects, s.activeProjectId, s)
            const nextFurniture = [...s.furniture, f]
            const updatedProjects = cow.projects.map(p =>
              p.id === cow.activeProjectId ? { ...p, updatedAt: Date.now(), furniture: nextFurniture } : p
            )
            return {
              projects: updatedProjects,
              activeProjectId: cow.activeProjectId,
              furniture: nextFurniture,
              toastMessage: cow.didFork ? `✨ Forked to "${cow.forkedName}"` : s.toastMessage,
            }
          }),

        updateFurniture: (id, patch) =>
          set((s) => {
            const cow = checkAndForkSample(s.projects, s.activeProjectId, s)
            const nextFurniture = s.furniture.map((f) => (f.id === id ? { ...f, ...patch } : f))
            const updatedProjects = cow.projects.map(p =>
              p.id === cow.activeProjectId ? { ...p, updatedAt: Date.now(), furniture: nextFurniture } : p
            )
            return {
              projects: updatedProjects,
              activeProjectId: cow.activeProjectId,
              furniture: nextFurniture,
              toastMessage: cow.didFork ? `✨ Forked to "${cow.forkedName}"` : s.toastMessage,
            }
          }),

        removeFurniture: (id) =>
          set((s) => {
            const cow = checkAndForkSample(s.projects, s.activeProjectId, s)
            const nextFurniture = s.furniture.filter((f) => f.id !== id)
            const updatedProjects = cow.projects.map(p =>
              p.id === cow.activeProjectId ? { ...p, updatedAt: Date.now(), furniture: nextFurniture } : p
            )
            return {
              projects: updatedProjects,
              activeProjectId: cow.activeProjectId,
              furniture: nextFurniture,
              selectedId: s.selectedId === id ? null : s.selectedId,
              toastMessage: cow.didFork ? `✨ Forked to "${cow.forkedName}"` : s.toastMessage,
            }
          }),

        setFurnitureVisible: (id, visible) =>
          set((s) => {
            const cow = checkAndForkSample(s.projects, s.activeProjectId, s)
            const nextFurniture = s.furniture.map((f) => (f.id === id ? { ...f, visible } : f))
            const updatedProjects = cow.projects.map(p =>
              p.id === cow.activeProjectId ? { ...p, updatedAt: Date.now(), furniture: nextFurniture } : p
            )
            return {
              projects: updatedProjects,
              activeProjectId: cow.activeProjectId,
              furniture: nextFurniture,
              toastMessage: cow.didFork ? `✨ Forked to "${cow.forkedName}"` : s.toastMessage,
            }
          }),

        resetToPresets: () => {
          const { activeProjectId, resetSampleProject } = get()
          if (activeProjectId.startsWith('project-sample-')) {
            resetSampleProject(activeProjectId)
          } else {
            get().selectProject('project-sample-bedroom')
          }
        },

        selectedId: null,
        setSelectedId: (id) => set({ selectedId: id }),

        plan: defaultActiveProject.plan,
        solverRunning: false,
        setPlan: (p) => {
          const s = get()
          const cow = checkAndForkSample(s.projects, s.activeProjectId, { ...s, plan: p })
          const updatedProjects = cow.projects.map(proj =>
            proj.id === cow.activeProjectId ? { ...proj, updatedAt: Date.now(), plan: p } : proj
          )
          set({
            projects: updatedProjects,
            activeProjectId: cow.activeProjectId,
            plan: p,
          })
        },
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
        sequenceRows: defaultActiveProject.sequenceRows,
        setSequenceRows: (rows) => {
          const s = get()
          const cow = checkAndForkSample(s.projects, s.activeProjectId, { ...s, sequenceRows: rows })
          const updatedProjects = cow.projects.map(p =>
            p.id === cow.activeProjectId ? { ...p, updatedAt: Date.now(), sequenceRows: rows } : p
          )
          set({
            projects: updatedProjects,
            activeProjectId: cow.activeProjectId,
            sequenceRows: rows,
          })
        },

        updateSequenceRow: (stepId, patch) =>
          set((s) => {
            const cow = checkAndForkSample(s.projects, s.activeProjectId, s)
            const nextRows = s.sequenceRows.map((r) =>
              r.step_id === stepId ? { ...r, ...patch } : r
            )
            const updatedProjects = cow.projects.map(p =>
              p.id === cow.activeProjectId ? { ...p, updatedAt: Date.now(), sequenceRows: nextRows } : p
            )
            return {
              projects: updatedProjects,
              activeProjectId: cow.activeProjectId,
              sequenceRows: nextRows,
              pendingChanges: s.liveSyncEnabled ? s.pendingChanges : s.pendingChanges + 1,
              toastMessage: cow.didFork ? `✨ Forked to "${cow.forkedName}"` : s.toastMessage,
            }
          }),

        insertSequenceRow: (afterStepId) =>
          set((s) => {
            const cow = checkAndForkSample(s.projects, s.activeProjectId, s)
            const rows = s.sequenceRows
            const newId = rows.length > 0 ? Math.max(...rows.map(r => r.step_id)) + 1 : 1
            const newRow: SequenceStep = {
              step_id: newId,
              object_id: '',
              object_name: '',
              start_pos_x: 0, start_pos_y: 0, start_rot: 0,
              end_pos_x: 100, end_pos_y: 100, end_rot: 0,
              duration_s: 1.5, easing: 'ease-in-out',
              notes: 'Manual step',
            }

            let nextRows: SequenceStep[]
            if (afterStepId !== undefined) {
              const idx = rows.findIndex(r => r.step_id === afterStepId)
              nextRows = [...rows.slice(0, idx + 1), newRow, ...rows.slice(idx + 1)]
            } else {
              nextRows = [...rows, newRow]
            }

            const reindexed = nextRows.map((r, i) => ({ ...r, step_id: i + 1 }))
            const updatedProjects = cow.projects.map(p =>
              p.id === cow.activeProjectId ? { ...p, updatedAt: Date.now(), sequenceRows: reindexed } : p
            )
            return {
              projects: updatedProjects,
              activeProjectId: cow.activeProjectId,
              sequenceRows: reindexed,
              pendingChanges: s.liveSyncEnabled ? s.pendingChanges : s.pendingChanges + 1,
              toastMessage: cow.didFork ? `✨ Forked to "${cow.forkedName}"` : s.toastMessage,
            }
          }),

        deleteSequenceRow: (stepId) =>
          set((s) => {
            const cow = checkAndForkSample(s.projects, s.activeProjectId, s)
            const rows = s.sequenceRows.filter(r => r.step_id !== stepId)
            const reindexed = rows.map((r, i) => ({ ...r, step_id: i + 1 }))
            const updatedProjects = cow.projects.map(p =>
              p.id === cow.activeProjectId ? { ...p, updatedAt: Date.now(), sequenceRows: reindexed } : p
            )
            return {
              projects: updatedProjects,
              activeProjectId: cow.activeProjectId,
              sequenceRows: reindexed,
              pendingChanges: s.liveSyncEnabled ? s.pendingChanges : s.pendingChanges + 1,
              toastMessage: cow.didFork ? `✨ Forked to "${cow.forkedName}"` : s.toastMessage,
            }
          }),

        moveSequenceRow: (stepId, direction) =>
          set((s) => {
            const cow = checkAndForkSample(s.projects, s.activeProjectId, s)
            const rows = [...s.sequenceRows]
            const idx = rows.findIndex(r => r.step_id === stepId)
            if (idx === -1) return {}
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1
            if (targetIdx < 0 || targetIdx >= rows.length) return {}
            const temp = rows[idx]
            rows[idx] = rows[targetIdx]
            rows[targetIdx] = temp
            const reindexed = rows.map((r, i) => ({ ...r, step_id: i + 1 }))
            const updatedProjects = cow.projects.map(p =>
              p.id === cow.activeProjectId ? { ...p, updatedAt: Date.now(), sequenceRows: reindexed } : p
            )
            return {
              projects: updatedProjects,
              activeProjectId: cow.activeProjectId,
              sequenceRows: reindexed,
              pendingChanges: s.liveSyncEnabled ? s.pendingChanges : s.pendingChanges + 1,
              toastMessage: cow.didFork ? `✨ Forked to "${cow.forkedName}"` : s.toastMessage,
            }
          }),

        // CSV Editor Panel State
        isCSVEditorOpen: false,
        setCSVEditorOpen: (v) => set({ isCSVEditorOpen: v }),
        liveSyncEnabled: true,
        setLiveSyncEnabled: (v) => set({ liveSyncEnabled: v }),
        pendingChanges: 0,
        saveSequenceAnimation: () => {
          set({ pendingChanges: 0 })
          get().showToast('💾 Sequence saved')
        },

        exportSequenceCSV: () => {
          const { sequenceRows, room } = get()
          const header = 'step_id,object_id,object_name,start_pos_x,start_pos_y,start_rot,end_pos_x,end_pos_y,end_rot,duration_s,easing,notes'
          const rows = sequenceRows.map(r =>
            [r.step_id, r.object_id, `"${r.object_name.replace(/"/g, '""')}"`,
             r.start_pos_x, r.start_pos_y, r.start_rot,
             r.end_pos_x, r.end_pos_y, r.end_rot,
             r.duration_s, r.easing,
             `"${r.notes.replace(/"/g, '""')}"`].join(',')
          )
          const csv = [header, ...rows].join('\n')
          navigator.clipboard?.writeText(csv).catch(() => {})
          const ts = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '').replace('T', '_')
          const filename = `sequence_${room.name.replace(/\s+/g, '_')}_${ts}.csv`
          const blob = new Blob([csv], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url; a.download = filename; a.click()
          URL.revokeObjectURL(url)
          get().showToast('⬇ Exported sequence CSV')
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
          get().showToast('📋 Copied AI Prompt to clipboard')
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
          const s = get()
          const cow = checkAndForkSample(s.projects, s.activeProjectId, s)
          const room = s.room
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

          const { autoFillCSVOnDrop, sequenceRows } = s
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

          const nextFurniture = [...s.furniture, newItem]
          const updatedProjects = cow.projects.map(p =>
            p.id === cow.activeProjectId ? {
              ...p,
              updatedAt: Date.now(),
              furniture: nextFurniture,
              sequenceRows: nextRows,
            } : p
          )

          set({
            projects: updatedProjects,
            activeProjectId: cow.activeProjectId,
            furniture: nextFurniture,
            selectedId: newId,
            inspectorTab: 'object',
            sequenceRows: nextRows,
            draggedCatalogItem: null,
            dropGhostPos: null,
            toastMessage: cow.didFork ? `✨ Forked to "${cow.forkedName}"` : s.toastMessage,
          })
        },

        // v08: Transform Triad & Placement Modes
        selectedTransformTarget: 'end',
        setSelectedTransformTarget: (t) => set({ selectedTransformTarget: t }),

        setFurniturePlacementMode: (id, mode) => {
          const s = get()
          const cow = checkAndForkSample(s.projects, s.activeProjectId, s)
          const { room, furniture, sequenceRows } = s
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

          const nextFurniture = furniture.map(f => f.id === id ? {
            ...f,
            placementMode: mode,
            startPosition: startPos,
            startRotation: startRot,
            endPosition: endPos,
            endRotation: endRot,
          } : f)

          const updatedProjects = cow.projects.map(p =>
            p.id === cow.activeProjectId ? {
              ...p,
              updatedAt: Date.now(),
              furniture: nextFurniture,
              sequenceRows: nextRows,
            } : p
          )

          set({
            projects: updatedProjects,
            activeProjectId: cow.activeProjectId,
            furniture: nextFurniture,
            sequenceRows: nextRows,
            toastMessage: cow.didFork ? `✨ Forked to "${cow.forkedName}"` : s.toastMessage,
          })
        },

        updateFurnitureTransformTarget: (id, target, patch) => {
          const s = get()
          const cow = checkAndForkSample(s.projects, s.activeProjectId, s)
          const { furniture, sequenceRows } = s
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

          const updatedProjects = cow.projects.map(p =>
            p.id === cow.activeProjectId ? {
              ...p,
              updatedAt: Date.now(),
              furniture: updatedFurniture,
              sequenceRows: nextRows,
            } : p
          )

          set({
            projects: updatedProjects,
            activeProjectId: cow.activeProjectId,
            furniture: updatedFurniture,
            sequenceRows: nextRows,
            toastMessage: cow.didFork ? `✨ Forked to "${cow.forkedName}"` : s.toastMessage,
          })
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
          const s = get()
          const cow = checkAndForkSample(s.projects, s.activeProjectId, s)
          const { furniture, sequenceRows } = s
          const item = furniture.find(f => f.id === id)
          if (!item) return

          const oldStart = item.startPosition ?? item.position ?? { x: 0, y: 0 }
          const oldStartRot = item.startRotation ?? item.rotation ?? 0
          const oldEnd = item.endPosition ?? item.position ?? { x: 0, y: 0 }
          const oldEndRot = item.endRotation ?? item.rotation ?? 0
          const nextMode: PlacementMode = item.placementMode === 'inserting' ? 'packing' : 'inserting'

          const nextFurniture = furniture.map(f => f.id === id ? {
            ...f,
            placementMode: nextMode,
            startPosition: { ...oldEnd },
            startRotation: oldEndRot,
            endPosition: { ...oldStart },
            endRotation: oldStartRot,
          } : f)

          const nextRows = sequenceRows.map(r => r.object_id === id ? {
            ...r,
            start_pos_x: oldEnd.x,
            start_pos_y: oldEnd.y,
            start_rot: oldEndRot,
            end_pos_x: oldStart.x,
            end_pos_y: oldStart.y,
            end_rot: oldStartRot,
            notes: `Mode: ${nextMode}`,
          } : r)

          const updatedProjects = cow.projects.map(p =>
            p.id === cow.activeProjectId ? {
              ...p,
              updatedAt: Date.now(),
              furniture: nextFurniture,
              sequenceRows: nextRows,
            } : p
          )

          set({
            projects: updatedProjects,
            activeProjectId: cow.activeProjectId,
            furniture: nextFurniture,
            sequenceRows: nextRows,
            toastMessage: cow.didFork ? `✨ Forked to "${cow.forkedName}"` : s.toastMessage,
          })
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
          const s = get()
          const cow = checkAndForkSample(s.projects, s.activeProjectId, s)
          const rows = [...s.sequenceRows]
          if (fromIndex < 0 || fromIndex >= rows.length || toIndex < 0 || toIndex >= rows.length) return
          const [moved] = rows.splice(fromIndex, 1)
          rows.splice(toIndex, 0, moved)
          const reindexed = rows.map((r, i) => ({ ...r, step_id: i + 1 }))

          const updatedProjects = cow.projects.map(p =>
            p.id === cow.activeProjectId ? { ...p, updatedAt: Date.now(), sequenceRows: reindexed } : p
          )

          set({
            projects: updatedProjects,
            activeProjectId: cow.activeProjectId,
            sequenceRows: reindexed,
            toastMessage: cow.didFork ? `✨ Forked to "${cow.forkedName}"` : s.toastMessage,
          })
        },

        moveSequenceRowToExtreme: (stepId, position) => {
          const s = get()
          const cow = checkAndForkSample(s.projects, s.activeProjectId, s)
          const rows = [...s.sequenceRows]
          const idx = rows.findIndex(r => r.step_id === stepId)
          if (idx === -1) return
          const [moved] = rows.splice(idx, 1)
          if (position === 'start') {
            rows.unshift(moved)
          } else {
            rows.push(moved)
          }
          const reindexed = rows.map((r, i) => ({ ...r, step_id: i + 1 }))

          const updatedProjects = cow.projects.map(p =>
            p.id === cow.activeProjectId ? { ...p, updatedAt: Date.now(), sequenceRows: reindexed } : p
          )

          set({
            projects: updatedProjects,
            activeProjectId: cow.activeProjectId,
            sequenceRows: reindexed,
            toastMessage: cow.didFork ? `✨ Forked to "${cow.forkedName}"` : s.toastMessage,
          })
        },

        moveSequenceRowToStep: (stepId, targetStep) => {
          const s = get()
          const cow = checkAndForkSample(s.projects, s.activeProjectId, s)
          const rows = [...s.sequenceRows]
          const idx = rows.findIndex(r => r.step_id === stepId)
          if (idx === -1) return
          const [moved] = rows.splice(idx, 1)
          const targetIdx = Math.max(0, Math.min(rows.length, targetStep - 1))
          rows.splice(targetIdx, 0, moved)
          const reindexed = rows.map((r, i) => ({ ...r, step_id: i + 1 }))

          const updatedProjects = cow.projects.map(p =>
            p.id === cow.activeProjectId ? { ...p, updatedAt: Date.now(), sequenceRows: reindexed } : p
          )

          set({
            projects: updatedProjects,
            activeProjectId: cow.activeProjectId,
            sequenceRows: reindexed,
            toastMessage: cow.didFork ? `✨ Forked to "${cow.forkedName}"` : s.toastMessage,
          })
        },
      }),
      { limit: 50 }
    ),
    {
      name: 'pack-and-place-storage-v3',
      storage: createJSONStorage(getBrowserStorage),
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        catalogMode: state.catalogMode,
        catalogLayout: state.catalogLayout,
        display: state.display,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const factory = createFactorySampleProjects()
        if (!state.projects || state.projects.length === 0) {
          state.projects = factory
        } else {
          // Ensure factory samples are present in projects
          for (const fs of factory) {
            if (!state.projects.some(p => p.id === fs.id)) {
              state.projects.unshift(fs)
            }
          }
        }
        const active = state.projects.find(p => p.id === state.activeProjectId) ?? state.projects[0]
        if (active) {
          state.activeProjectId = active.id
          state.room = active.room
          state.furniture = active.furniture
          state.sequenceRows = active.sequenceRows ?? []
          state.plan = active.plan ?? null
        }
      },
    }
  )
)
