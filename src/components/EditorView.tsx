import React, { useEffect, useRef, useState } from 'react'
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight,
  Vector3, Color4, Color3, MeshBuilder, StandardMaterial,
  PointerEventTypes, type Mesh,
} from '@babylonjs/core'
import { useAppStore } from '@/store/app-store'
import { ResultsPanel } from '@/components/ResultsPanel'
import { NTabInspector } from '@/components/NTabInspector'
import { SequenceCSVEditor } from '@/components/SequenceCSVEditor'
import { CatalogPanel } from '@/components/catalog/CatalogPanel'
import { ROOM_PRESETS } from '@/data/presets'
import { furnitureToOBB, satTest } from '@/solver/obb-sat'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hexToColor3(hex: string): Color3 {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return new Color3(r, g, b)
}

function canvasBgToColor4(hex: string): Color4 {
  const c = hexToColor3(hex)
  return new Color4(c.r, c.g, c.b, 1)
}

let engineRef: Engine | null = null
let sceneRef: Scene | null = null
let cameraRef: ArcRotateCamera | null = null

// ─── Simulation Timeline Dock (Combined Editor + Simulation) ──────────────────

function SimulationTimelineDock() {
  const {
    plan, furniture,
    playbackStep, setPlaybackStep,
    playbackPlaying, setPlaybackPlaying,
    playbackProgress, setPlaybackProgress,
    display, setDisplay,
  } = useAppStore()

  const steps = plan?.steps ?? []
  const total = steps.length
  const current = steps[playbackStep]
  const currentFurniture = furniture.find(f => f.id === current?.furnitureId)

  // Overall scrub ratio: based on step and sub-progress
  const overallRatio = total > 0
    ? (playbackStep + playbackProgress) / total
    : 0

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (total === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(0.999, (e.clientX - rect.left) / rect.width))
    const totalUnits = ratio * total
    const newStep = Math.floor(totalUnits)
    const newProgress = totalUnits - newStep
    setPlaybackStep(newStep)
    setPlaybackProgress(newProgress)
  }

  return (
    <div className="sim-dock">
      {/* Top info row */}
      <div className="sim-dock-header">
        <div className="flex items-center gap-2">
          <span className="sim-badge">
            {total > 0 ? `Step ${playbackStep + 1} / ${total}` : 'No plan'}
          </span>
          <span className="sim-title">
            {current ? current.furnitureName : 'Run Entry Solver to enable simulation'}
          </span>
          {current && (
            <span className="text-muted text-sm">— {current.action}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Ghost trail toggle */}
          <button
            className={`btn btn-sm${display.showGhostTrail ? ' btn-primary' : ''}`}
            onClick={() => setDisplay({ showGhostTrail: !display.showGhostTrail })}
            title="Toggle Ghost Sweep Volume visualization along the entry path"
            style={{ fontSize: 11, padding: '3px 8px' }}
          >
            👻 Ghost Trail: {display.showGhostTrail ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Scrubbable progress bar */}
      <div className="timeline-track" onClick={handleTrackClick} style={{ height: 6, margin: '6px 0' }}>
        <div className="timeline-fill" style={{ width: `${overallRatio * 100}%` }} />
        <div className="timeline-thumb" style={{ left: `${overallRatio * 100}%`, width: 14, height: 14 }} />
      </div>

      {/* Playback Controls & Step Pills */}
      <div className="sim-dock-footer">
        <div className="flex items-center gap-1">
          <button
            className="btn btn-sm"
            onClick={() => { setPlaybackStep(0); setPlaybackProgress(0); setPlaybackPlaying(false) }}
            title="First Step"
          >
            ⏮
          </button>
          <button
            className="btn btn-sm"
            onClick={() => {
              if (playbackStep > 0) {
                setPlaybackStep(playbackStep - 1)
                setPlaybackProgress(1.0)
              }
            }}
            title="Previous Step"
          >
            ◀
          </button>
          <button
            className={`btn btn-sm${playbackPlaying ? ' btn-primary' : ''}`}
            onClick={() => {
              if (playbackStep >= total - 1 && playbackProgress >= 0.99) {
                setPlaybackStep(0)
                setPlaybackProgress(0)
              }
              setPlaybackPlaying(!playbackPlaying)
            }}
            style={{ minWidth: 64, fontWeight: 600 }}
          >
            {playbackPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            className="btn btn-sm"
            onClick={() => {
              if (playbackStep < total - 1) {
                setPlaybackStep(playbackStep + 1)
                setPlaybackProgress(1.0)
              }
            }}
            title="Next Step"
          >
            ▶
          </button>
          <button
            className="btn btn-sm"
            onClick={() => { setPlaybackStep(Math.max(0, total - 1)); setPlaybackProgress(1.0); setPlaybackPlaying(false) }}
            title="Last Step"
          >
            ⏭
          </button>
        </div>

        {/* Step Pills */}
        <div className="step-pill-strip">
          {steps.map((s, i) => (
            <button
              key={s.furnitureId}
              className={`step-pill${playbackStep === i ? ' active' : ''}${s.issue?.type === 'stall' ? ' stall' : ''}`}
              onClick={() => {
                setPlaybackStep(i)
                setPlaybackProgress(1.0)
              }}
              title={s.action}
            >
              {i + 1}. {s.furnitureName}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}


// ─── Babylon.js Canvas (Combined 3D & 2D Top View + Ghosts) ───────────────────

function BabylonCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const {
    furniture, room, display, setDisplay, selectedId, setSelectedId,
    theme, plan, playbackStep, setPlaybackStep,
    playbackPlaying, setPlaybackPlaying,
    playbackProgress, setPlaybackProgress,
    draggedCatalogItem, dropGhostPos, setDropGhostPos, placeCatalogItemAt,
  } = useAppStore()

  const [viewMode, setLocalViewMode] = useState<'3d' | '2d'>(display.viewMode ?? '3d')

  const BG_MAP: Record<string, string> = {
    dark:  '#0f172a',
    light: '#f1f5f9',
    cream: '#fefce8',
  }

  // Dynamic room dimensions in world units (1 cm = 0.01 units)
  const SCALE = 0.01
  const walls = room.walls
  let roomWidthCm = 0, roomHeightCm = 0
  for (const w of walls) {
    roomWidthCm = Math.max(roomWidthCm, w.x1, w.x2)
    roomHeightCm = Math.max(roomHeightCm, w.y1, w.y2)
  }
  const door = room.doors[0]
  const doorStartCm = door?.offsetAlongWall ?? 160
  const doorWidthCm = door?.widthCm ?? 180
  const corridor = room.corridors[0]
  const corridorLengthCm = corridor?.lengthCm ?? 140

  const roomW = (roomWidthCm || 500) * SCALE
  const roomD = (roomHeightCm || 380) * SCALE
  const doorLeft = doorStartCm * SCALE
  const doorWidth = doorWidthCm * SCALE
  const doorRight = doorLeft + doorWidth
  const corridorLen = corridorLengthCm * SCALE
  const hallwayCenterX = doorLeft + doorWidth / 2

  // ─── Placement Ghost & Drag-to-Place Handlers ──────────────────────────────

  const removePlacementGhost = () => {
    const scene = sceneRef
    if (scene) {
      const ghost = scene.getMeshByName('placement-ghost-box')
      if (ghost) ghost.dispose()
    }
    setDropGhostPos(null)
  }

  const updatePlacementGhost = (clientX: number, clientY: number) => {
    const scene = sceneRef
    const canvas = canvasRef.current
    const item = draggedCatalogItem
    if (!scene || !canvas || !item) return

    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    const pick = scene.pick(x, y, (mesh) => mesh.name.includes('floor'))
    if (!pick || !pick.hit || !pick.pickedPoint) return

    const rawX = pick.pickedPoint.x / SCALE
    const rawY = pick.pickedPoint.z / SCALE

    // Snap to 10cm grid
    const snapX = Math.round(rawX / 10) * 10
    const snapY = Math.round(rawY / 10) * 10

    // Align item centered on cursor
    const placeX = Math.round(snapX - item.assembled.w / 2)
    const placeY = Math.round(snapY - item.assembled.d / 2)

    setDropGhostPos({ x: placeX, y: placeY })

    // Boundary check
    const isInside = placeX >= 0 && placeX + item.assembled.w <= (roomWidthCm || 500) &&
                     placeY >= 0 && placeY + item.assembled.d <= (roomHeightCm || 380)

    // Furniture collision check
    let hasCollision = false
    for (const f of furniture) {
      if (!f.visible || !f.position) continue
      const overlap = !(
        placeX + item.assembled.w <= f.position.x ||
        placeX >= f.position.x + f.assembled.w ||
        placeY + item.assembled.d <= f.position.y ||
        placeY >= f.position.y + f.assembled.d
      )
      if (overlap) {
        hasCollision = true
        break
      }
    }

    const isValid = isInside && !hasCollision

    let ghost = scene.getMeshByName('placement-ghost-box') as Mesh | null
    if (!ghost) {
      ghost = MeshBuilder.CreateBox('placement-ghost-box', {
        width: item.assembled.w * SCALE,
        height: item.assembled.h * SCALE,
        depth: item.assembled.d * SCALE,
      }, scene)
      const mat = new StandardMaterial('placement-ghost-mat', scene)
      ghost.material = mat
      ghost.enableEdgesRendering(0.9)
      ghost.edgesWidth = 3.5
    }

    ghost.position.x = (placeX + item.assembled.w / 2) * SCALE
    ghost.position.z = (placeY + item.assembled.d / 2) * SCALE
    ghost.position.y = (item.assembled.h / 2) * SCALE

    const mat = ghost.material as StandardMaterial
    if (isValid) {
      mat.diffuseColor = hexToColor3('#10b981')
      mat.emissiveColor = hexToColor3('#059669').scale(0.35)
      mat.alpha = 0.45
      ghost.edgesColor = new Color4(0.06, 0.72, 0.5, 0.95)
    } else {
      mat.diffuseColor = hexToColor3('#ef4444')
      mat.emissiveColor = hexToColor3('#dc2626').scale(0.35)
      mat.alpha = 0.45
      ghost.edgesColor = new Color4(0.93, 0.27, 0.27, 0.95)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    updatePlacementGhost(e.clientX, e.clientY)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const item = draggedCatalogItem
    if (!item) return

    const scene = sceneRef
    const canvas = canvasRef.current
    if (!scene || !canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const pick = scene.pick(x, y, (mesh) => mesh.name.includes('floor'))
    let targetX = 50
    let targetY = 50

    if (pick && pick.hit && pick.pickedPoint) {
      const rawX = pick.pickedPoint.x / SCALE
      const rawY = pick.pickedPoint.z / SCALE
      const snapX = Math.round(rawX / 10) * 10
      const snapY = Math.round(rawY / 10) * 10
      targetX = Math.round(snapX - item.assembled.w / 2)
      targetY = Math.round(snapY - item.assembled.d / 2)
    }

    placeCatalogItemAt(item, targetX, targetY)
    removePlacementGhost()
  }

  // Camera view switcher
  const switchView = (mode: '3d' | '2d') => {
    setLocalViewMode(mode)
    setDisplay({ viewMode: mode })
    const camera = cameraRef
    if (!camera) return

    if (mode === '2d') {
      camera.mode = ArcRotateCamera.ORTHOGRAPHIC_CAMERA
      camera.alpha = -Math.PI / 2
      camera.beta = 0.001 // looking directly straight down
      camera.setTarget(new Vector3(roomW / 2, 0, roomD / 2 - 0.2))
      camera.orthoTop = roomD + 1.2
      camera.orthoBottom = -corridorLen - 1.2
      camera.orthoLeft = -1.2
      camera.orthoRight = roomW + 1.2
    } else {
      camera.mode = ArcRotateCamera.PERSPECTIVE_CAMERA
      camera.alpha = -Math.PI / 3
      camera.beta = Math.PI / 3.4
      camera.radius = roomW > 4.5 ? 11.5 : 9.5
      camera.setTarget(new Vector3(roomW / 2, 0.4, roomD / 2))
    }
  }

  // Animation loop for smooth playback (runs uninterrupted while playing)
  useEffect(() => {
    let animId: number
    let lastTime = performance.now()

    if (!playbackPlaying || !plan || plan.steps.length === 0) return

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05) // clamp dt to prevent jumps
      lastTime = now

      const stepSpeed = 0.85 // progress units per second
      const currentP = useAppStore.getState().playbackProgress
      const currentS = useAppStore.getState().playbackStep
      const totalSteps = plan.steps.length

      const nextP = currentP + dt * stepSpeed

      if (nextP >= 1.0) {
        if (currentS < totalSteps - 1) {
          useAppStore.setState({ playbackStep: currentS + 1, playbackProgress: 0.0 })
        } else {
          useAppStore.setState({ playbackProgress: 1.0, playbackPlaying: false })
          return
        }
      } else {
        useAppStore.setState({ playbackProgress: nextP })
      }

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)

    return () => {
      if (animId) cancelAnimationFrame(animId)
    }
  }, [playbackPlaying, plan])

  // Initialize Babylon Scene & Camera
  useEffect(() => {
    if (!canvasRef.current) return
    if (engineRef) return

    const engine = new Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true })
    const scene = new Scene(engine)
    engineRef = engine
    sceneRef = scene

    scene.clearColor = canvasBgToColor4(BG_MAP[theme] ?? BG_MAP.dark)

    const camera = new ArcRotateCamera(
      'cam',
      -Math.PI / 3,
      Math.PI / 3.4,
      11.5,
      new Vector3(2.5, 0.4, 1.6),
      scene
    )
    camera.mode = ArcRotateCamera.PERSPECTIVE_CAMERA
    camera.lowerRadiusLimit = 3
    camera.upperRadiusLimit = 25
    camera.upperBetaLimit = Math.PI / 2.02
    camera.attachControl(canvasRef.current, true)
    cameraRef = camera

    const hemiLight = new HemisphericLight('hemi-light', new Vector3(0.5, 2, 0.5), scene)
    hemiLight.intensity = 0.85
    hemiLight.groundColor = new Color3(0.15, 0.18, 0.25)

    const dirLight = new DirectionalLight('dir-light', new Vector3(-1, -2, -1), scene)
    dirLight.position = new Vector3(8, 12, 8)
    dirLight.intensity = 0.5

    // Click on 3D meshes to select
    scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
        const pick = pointerInfo.pickInfo
        if (pick && pick.hit && pick.pickedMesh && pick.pickedMesh.name.startsWith('furn-')) {
          const id = pick.pickedMesh.name.replace('furn-', '')
          setSelectedId(id)
        } else if (pick && pick.hit && pick.pickedMesh?.name.includes('floor')) {
          setSelectedId(null)
        }
      }
    })

    engine.runRenderLoop(() => scene.render())

    // ResizeObserver on canvas itself — catches layout-driven resizes
    // (grid column changes, CSV editor open/close) not just window resize
    const ro = new ResizeObserver(() => {
      engine.resize()
    })
    if (canvasRef.current) ro.observe(canvasRef.current)

    const handleResize = () => engine.resize()
    window.addEventListener('resize', handleResize)

    // Force correct dimensions on first mount (after CSS grid has settled)
    requestAnimationFrame(() => engine.resize())

    return () => {
      window.removeEventListener('resize', handleResize)
      ro.disconnect()
    }
  }, [])

  // Update theme background
  useEffect(() => {
    if (sceneRef) {
      sceneRef.clearColor = canvasBgToColor4(BG_MAP[theme] ?? BG_MAP.dark)
    }
  }, [theme])

  // Sync Room Architecture, Furniture Meshes, Ghosts, and Pathways
  useEffect(() => {
    const scene = sceneRef
    if (!scene) return

    // Clear previous transient meshes including floors and walls
    scene.meshes
      .filter(m =>
        m.name.startsWith('furn-') ||
        m.name.startsWith('clearance-') ||
        m.name.startsWith('arch-') ||
        m.name.startsWith('ghost-') ||
        m.name.startsWith('pathway-') ||
        m.name.startsWith('room-floor') ||
        m.name.startsWith('hallway-floor')
      )
      .forEach(m => m.dispose())

    // 1. Dynamic Room Floor
    const floor = MeshBuilder.CreateBox('room-floor', { width: roomW, height: 0.02, depth: roomD }, scene)
    const floorMat = new StandardMaterial('floor-mat', scene)
    floorMat.diffuseColor = hexToColor3(theme === 'dark' ? '#1e293b' : '#e2e8f0')
    floorMat.specularColor = new Color3(0.05, 0.05, 0.05)
    floor.material = floorMat
    floor.position.x = roomW / 2
    floor.position.z = roomD / 2
    floor.position.y = -0.01

    // 2. Dynamic Hallway Floor
    const hwFloor = MeshBuilder.CreateBox('hallway-floor', { width: doorWidth, height: 0.02, depth: corridorLen }, scene)
    const hwMat = new StandardMaterial('hw-floor-mat', scene)
    hwMat.diffuseColor = hexToColor3(theme === 'dark' ? '#182234' : '#cbd5e1')
    hwMat.specularColor = new Color3(0.05, 0.05, 0.05)
    hwFloor.material = hwMat
    hwFloor.position.x = hallwayCenterX
    hwFloor.position.z = -corridorLen / 2
    hwFloor.position.y = -0.01

    // 3. Dynamic Low Architectural Walls
    const wallH = 0.35
    const wallThick = 0.08
    const wallMat = new StandardMaterial('wall-mat', scene)
    wallMat.diffuseColor = hexToColor3(theme === 'dark' ? '#334155' : '#94a3b8')
    wallMat.specularColor = new Color3(0.1, 0.1, 0.1)

    const createWall = (name: string, w: number, d: number, px: number, pz: number) => {
      const wall = MeshBuilder.CreateBox(`arch-${name}`, {
        width: Math.max(0.01, w),
        height: wallH,
        depth: Math.max(0.01, d),
      }, scene)
      wall.position.x = px
      wall.position.z = pz
      wall.position.y = wallH / 2
      wall.material = wallMat
    }

    createWall('wall-n', roomW + wallThick * 2, wallThick, roomW / 2, roomD + wallThick / 2)
    createWall('wall-w', wallThick, roomD, -wallThick / 2, roomD / 2)
    createWall('wall-e', wallThick, roomD, roomW + wallThick / 2, roomD / 2)
    createWall('wall-s-left', doorLeft, wallThick, doorLeft / 2, -wallThick / 2)
    createWall('wall-s-right', roomW - doorRight, wallThick, doorRight + (roomW - doorRight) / 2, -wallThick / 2)
    createWall('hw-wall-w', wallThick, corridorLen, doorLeft - wallThick / 2, -corridorLen / 2)
    createWall('hw-wall-e', wallThick, corridorLen, doorRight + wallThick / 2, -corridorLen / 2)

    // 4. Ghost Sweep Volume & Pathways (The Crucial Visualization)
    const currentStep = plan?.steps[playbackStep]
    const activeFurniture = furniture.find(f => f.id === currentStep?.furnitureId)

    if (display.showGhostTrail && currentStep && activeFurniture && currentStep.pathNodes && currentStep.pathNodes.length > 0) {
      const pathNodes = currentStep.pathNodes
      const af = activeFurniture

      // Sample 5 keyframe waypoints along the trajectory for the ghost silhouettes
      const indices: number[] = []
      const count = Math.min(5, pathNodes.length)
      for (let i = 0; i < count; i++) {
        indices.push(Math.round((i / (count - 1)) * (pathNodes.length - 1)))
      }

      // Shared holographic ghost material
      const ghostMat = new StandardMaterial('ghost-mat', scene)
      ghostMat.diffuseColor = hexToColor3('#06b6d4')
      ghostMat.emissiveColor = hexToColor3('#0891b2').scale(0.35)
      ghostMat.alpha = 0.22
      ghostMat.specularColor = new Color3(0.5, 0.8, 1.0)

      indices.forEach((nodeIdx, gIdx) => {
        const node = pathNodes[nodeIdx]
        const ghost = MeshBuilder.CreateBox(`ghost-box-${gIdx}`, {
          width: af.assembled.w * SCALE,
          height: af.assembled.h * SCALE,
          depth: af.assembled.d * SCALE,
        }, scene)

        ghost.position.x = (node.x + af.assembled.w / 2) * SCALE
        ghost.position.z = (node.y + af.assembled.d / 2) * SCALE
        ghost.position.y = (af.assembled.h / 2) * SCALE
        ghost.rotation.y = (node.rot * Math.PI) / 180
        ghost.material = ghostMat

        // Glowing architectural edge outlines
        ghost.enableEdgesRendering(0.95)
        ghost.edgesWidth = 2.0
        ghost.edgesColor = new Color4(0.02, 0.85, 1.0, 0.75)

        // Floor waypoint marker
        const disc = MeshBuilder.CreateDisc(`ghost-disc-${gIdx}`, { radius: 0.12 }, scene)
        disc.rotation.x = Math.PI / 2
        disc.position.x = ghost.position.x
        disc.position.z = ghost.position.z
        disc.position.y = 0.003
        const discMat = new StandardMaterial(`ghost-disc-mat-${gIdx}`, scene)
        discMat.diffuseColor = hexToColor3('#06b6d4')
        discMat.emissiveColor = hexToColor3('#06b6d4')
        disc.material = discMat
      })

      // Ground path ribbon connecting all waypoints
      const points = pathNodes.map(n => new Vector3(
        (n.x + af.assembled.w / 2) * SCALE,
        0.004,
        (n.y + af.assembled.d / 2) * SCALE
      ))

      const pathLine = MeshBuilder.CreateLines('pathway-line', { points }, scene)
      pathLine.color = new Color3(0.02, 0.85, 1.0)
    }

    // 5. Render Furniture (with motion interpolation & staging)
    for (let i = 0; i < furniture.length; i++) {
      const f = furniture[i]
      if (!f.visible || !f.position) continue

      const isSelected = f.id === selectedId
      const planIdx = plan?.steps.findIndex(s => s.furnitureId === f.id) ?? -1

      // Determine mesh position & rotation based on playback state
      let posX = (f.position.x + f.assembled.w / 2) * SCALE
      let posZ = (f.position.y + f.assembled.d / 2) * SCALE
      let posY = (f.assembled.h / 2) * SCALE
      let rotY = ((f.rotation ?? 0) * Math.PI) / 180
      let meshAlpha = 1.0

      // If active item in simulation, place at its current trajectory position
      if (plan && planIdx === playbackStep && currentStep && currentStep.pathNodes && currentStep.pathNodes.length > 0) {
        const pNodes = currentStep.pathNodes
        const curProgress = useAppStore.getState().playbackProgress
        const floatIdx = Math.max(0, Math.min(curProgress * (pNodes.length - 1), pNodes.length - 1))
        const baseIdx = Math.min(Math.floor(floatIdx), pNodes.length - 1)
        const nextIdx = Math.min(baseIdx + 1, pNodes.length - 1)
        const alpha = floatIdx - baseIdx

        const n1 = pNodes[baseIdx]
        const n2 = pNodes[nextIdx]

        const curX = n1.x + (n2.x - n1.x) * alpha
        const curY = n1.y + (n2.y - n1.y) * alpha
        let r1 = n1.rot, r2 = n2.rot
        let dRot = r2 - r1
        if (dRot > 180) dRot -= 360
        if (dRot < -180) dRot += 360
        const curRot = r1 + dRot * alpha

        posX = (curX + f.assembled.w / 2) * SCALE
        posZ = (curY + f.assembled.d / 2) * SCALE
        rotY = (curRot * Math.PI) / 180
      } else if (plan && planIdx > playbackStep) {
        // Items not yet entered: stage outside in hallway staging queue
        const queuePos = planIdx - playbackStep
        posX = hallwayCenterX
        posZ = -corridorLen - 0.3 - queuePos * 0.75
        posY = (f.assembled.h / 2) * SCALE
        rotY = 0
        meshAlpha = 0.45
      }

      // Main box mesh
      const mesh = MeshBuilder.CreateBox(`furn-${f.id}`, {
        width: f.assembled.w * SCALE,
        height: f.assembled.h * SCALE,
        depth: f.assembled.d * SCALE,
      }, scene)

      mesh.position.x = posX
      mesh.position.z = posZ
      mesh.position.y = posY
      mesh.rotation.y = rotY

      // Material
      const mat = new StandardMaterial(`mat-${f.id}`, scene)
      const baseColor = display.materialMode === 'fallback'
        ? display.fallbackColor
        : f.color
      mat.diffuseColor = hexToColor3(baseColor)
      mat.specularColor = new Color3(0.2, 0.2, 0.2)
      mat.alpha = meshAlpha

      if (isSelected) {
        mat.emissiveColor = hexToColor3('#0284c7').scale(0.3)
      } else if (planIdx === playbackStep) {
        mat.emissiveColor = hexToColor3('#38bdf8').scale(0.25)
      }

      mesh.material = mat

      // Clean architectural edges
      if (display.showBoundingBox || isSelected || planIdx === playbackStep) {
        mesh.enableEdgesRendering(0.9)
        mesh.edgesWidth = isSelected ? 4.0 : (planIdx === playbackStep ? 3.0 : 2.0)
        const outlineHex = isSelected ? '#38bdf8' : (planIdx === playbackStep ? '#00e5ff' : display.boundingBoxColor)
        const oc = hexToColor3(outlineHex)
        mesh.edgesColor = new Color4(oc.r, oc.g, oc.b, isSelected ? 1.0 : display.boundingBoxOpacity)
      }

      mesh.isPickable = true

      // Clearance zone overlay for items in final position
      if (display.showClearanceZone && f.clearance.front && (planIdx <= playbackStep || planIdx === -1)) {
        const czDepth = f.clearance.front * SCALE
        const cz = MeshBuilder.CreatePlane(`clearance-${f.id}`, {
          width: f.assembled.w * SCALE,
          height: czDepth,
        }, scene)
        cz.rotation.x = Math.PI / 2
        cz.position.x = mesh.position.x
        cz.position.y = 0.005
        cz.position.z = mesh.position.z - (f.assembled.d / 2) * SCALE - czDepth / 2

        const czMat = new StandardMaterial(`cz-mat-${f.id}`, scene)
        czMat.diffuseColor = hexToColor3(display.clearanceZoneColor)
        czMat.alpha = 0.25
        cz.material = czMat
      }
    }
  }, [furniture, room, display, selectedId, theme, plan, playbackStep])

  // High-performance smooth transform update for active furniture item (NO mesh disposal/recreation!)
  useEffect(() => {
    const scene = sceneRef
    if (!scene || !plan) return
    const currentStep = plan.steps[playbackStep]
    if (!currentStep || !currentStep.pathNodes || currentStep.pathNodes.length === 0) return

    const activeMesh = scene.getMeshByName(`furn-${currentStep.furnitureId}`) as Mesh
    const f = furniture.find(item => item.id === currentStep.furnitureId)
    if (!activeMesh || !f) return

    const pNodes = currentStep.pathNodes
    const floatIdx = Math.max(0, Math.min(playbackProgress * (pNodes.length - 1), pNodes.length - 1))
    const baseIdx = Math.min(Math.floor(floatIdx), pNodes.length - 1)
    const nextIdx = Math.min(baseIdx + 1, pNodes.length - 1)
    const alpha = floatIdx - baseIdx

    const n1 = pNodes[baseIdx]
    const n2 = pNodes[nextIdx]

    const curX = n1.x + (n2.x - n1.x) * alpha
    const curY = n1.y + (n2.y - n1.y) * alpha
    let r1 = n1.rot, r2 = n2.rot
    let dRot = r2 - r1
    if (dRot > 180) dRot -= 360
    if (dRot < -180) dRot += 360
    const curRot = r1 + dRot * alpha

    activeMesh.position.x = (curX + f.assembled.w / 2) * SCALE
    activeMesh.position.z = (curY + f.assembled.d / 2) * SCALE
    activeMesh.position.y = (f.assembled.h / 2) * SCALE
    activeMesh.rotation.y = (curRot * Math.PI) / 180
  }, [playbackProgress, playbackStep, plan, furniture])

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%' }}
      onDragOver={handleDragOver}
      onDragLeave={removePlacementGhost}
      onDrop={handleDrop}
    >
      <canvas ref={canvasRef} id="babylon-canvas" style={{ width: '100%', height: '100%' }} />

      {/* Floating Placement Drag HUD */}
      {draggedCatalogItem && dropGhostPos && (
        <div className="canvas-drag-hud">
          <span className="drag-hud-icon">{draggedCatalogItem.icon || '📦'}</span>
          <span className="drag-hud-name">{draggedCatalogItem.name}</span>
          <span className="drag-hud-coords">
            X: {dropGhostPos.x}cm, Y: {dropGhostPos.y}cm (10cm snap)
          </span>
        </div>
      )}

      {/* Floating 2D / 3D Mode & Viewport Controls */}
      <div className="canvas-view-toolbar">
        <button
          className={`view-btn${viewMode === '3d' ? ' active' : ''}`}
          onClick={() => switchView('3d')}
          title="3D Perspective Orbit View"
        >
          🧊 3D Orbit
        </button>
        <button
          className={`view-btn${viewMode === '2d' ? ' active' : ''}`}
          onClick={() => switchView('2d')}
          title="2D Top-Down Architectural Blueprint Plan"
        >
          📐 2D Top Plan
        </button>
        <button
          className="view-btn"
          onClick={() => switchView(viewMode)}
          title="Reset Camera to Default"
        >
          ↺ Reset
        </button>
        <button
          className={`view-btn${display.showGhostTrail ? ' ghost-active' : ''}`}
          onClick={() => setDisplay({ showGhostTrail: !display.showGhostTrail })}
          title="Toggle Ghost Sweep Volume along entry path"
        >
          👻 Ghost
        </button>
      </div>
    </div>
  )
}

// ─── Main Unified EditorView (3D Studio & Simulation Combined) ────────────────

export function EditorView() {
  const { isCSVEditorOpen } = useAppStore()

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      <div
        className="editor-shell"
        style={{
          display: 'grid',
          gridTemplateColumns: isCSVEditorOpen
            ? '1fr min(400px,18vw) 40%'
            : '1fr min(400px,18vw)',
          transition: 'grid-template-columns 200ms ease',
          flex: 1,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* 3D Viewport — always 52% (flex fill) */}
        <div className="editor-canvas" style={{ position:'relative', overflow:'hidden' }}>
          <BabylonCanvas />
          <ResultsPanel />
        </div>

        {/* N-Tab Inspector — min(400px, 18vw) */}
        <NTabInspector />

        {/* Sequence CSV Editor — 40% (only when open) */}
        {isCSVEditorOpen && <SequenceCSVEditor />}
      </div>

      {/* Unity Explorer Catalog Panel (v07) */}
      <CatalogPanel />

      <SimulationTimelineDock />
    </div>
  )
}
