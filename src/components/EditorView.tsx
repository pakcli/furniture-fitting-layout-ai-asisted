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
    if (playbackPlaying) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    updatePlacementGhost(e.clientX, e.clientY)
  }

  const handleDrop = (e: React.DragEvent) => {
    if (playbackPlaying) return
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

  // Camera framing with strict aspect-ratio preservation (prevents stretching/squishing in 2D and 3D)
  // When resetView is false (e.g. during selection, moving objects, or resize), preserves user's current camera angle and zoom!
  const updateCameraFraming = (mode: '3d' | '2d', resetView = false) => {
    const camera = cameraRef
    const canvas = canvasRef.current
    if (!camera || !canvas) return

    const clientW = canvas.clientWidth || 800
    const clientH = canvas.clientHeight || 600
    const aspect = clientW / clientH

    const padding = 1.0 // meters padding around room
    const totalW = roomW + padding * 2
    const totalD = roomD + corridorLen + padding * 2
    const centerX = roomW / 2
    const centerZ = (roomD - corridorLen) / 2

    if (mode === '2d') {
      camera.mode = ArcRotateCamera.ORTHOGRAPHIC_CAMERA
      if (resetView || camera.beta !== 0.0001) {
        camera.alpha = -Math.PI / 2
        camera.beta = 0.0001 // looking directly straight down
        camera.setTarget(new Vector3(centerX, 0, centerZ))
      }

      // Keep aspect ratio strictly 1:1 with canvas pixel aspect ratio
      let halfW: number
      let halfH: number

      if (aspect >= totalW / totalD) {
        // Viewport is wider than room bounds: fit height, expand width
        halfH = totalD / 2
        halfW = halfH * aspect
      } else {
        // Viewport is taller than room bounds: fit width, expand height
        halfW = totalW / 2
        halfH = halfW / aspect
      }

      camera.orthoLeft = -halfW
      camera.orthoRight = halfW
      camera.orthoTop = halfH
      camera.orthoBottom = -halfH
    } else {
      camera.mode = ArcRotateCamera.PERSPECTIVE_CAMERA
      if (resetView) {
        camera.alpha = -Math.PI / 3
        camera.beta = Math.PI / 3.4
        camera.setTarget(new Vector3(centerX, 0.4, centerZ))

        // Calculate radius so room stays comfortably framed regardless of shrink
        const maxDim = Math.max(roomW, roomD)
        const targetRadius = aspect < 1.0
          ? (maxDim / aspect) * 1.5 + 3.0
          : maxDim * 1.4 + 3.0
        camera.radius = Math.max(7.0, Math.min(targetRadius, 15.0))
      }
    }
  }

  // Camera view switcher (explicit user action: reset view)
  const switchView = (mode: '3d' | '2d') => {
    setLocalViewMode(mode)
    setDisplay({ viewMode: mode })
    updateCameraFraming(mode, true)
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
    const canvas = canvasRef.current
    if (!canvas) return

    // If existing engine is bound to a dead/unmounted canvas, dispose it
    if (engineRef) {
      if (engineRef.getRenderingCanvas() !== canvas) {
        engineRef.dispose()
        engineRef = null
        sceneRef = null
        cameraRef = null
      }
    }

    let engine = engineRef
    let scene = sceneRef
    let camera = cameraRef

    if (!engine) {
      engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, adaptToDeviceRatio: true })
      scene = new Scene(engine)
      engineRef = engine
      sceneRef = scene

      scene.clearColor = canvasBgToColor4(BG_MAP[theme] ?? BG_MAP.dark)

      camera = new ArcRotateCamera(
        'cam',
        -Math.PI / 3,
        Math.PI / 3.4,
        11.5,
        new Vector3(roomW / 2, 0.4, roomD / 2),
        scene
      )
      camera.mode = ArcRotateCamera.PERSPECTIVE_CAMERA
      camera.lowerRadiusLimit = 3
      camera.upperRadiusLimit = 28
      camera.upperBetaLimit = Math.PI / 2.02
      camera.attachControl(canvas, true)
      cameraRef = camera

      const hemiLight = new HemisphericLight('hemi-light', new Vector3(0.5, 2, 0.5), scene)
      hemiLight.intensity = 0.85
      hemiLight.groundColor = new Color3(0.15, 0.18, 0.25)

      const dirLight = new DirectionalLight('dir-light', new Vector3(-1, -2, -1), scene)
      dirLight.position = new Vector3(8, 12, 8)
      dirLight.intensity = 0.5

      // Click on 3D meshes to select (unless sequence is playing)
      scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
          if (useAppStore.getState().playbackPlaying) return
          const pick = pointerInfo.pickInfo
          if (pick && pick.hit && pick.pickedMesh && pick.pickedMesh.name.startsWith('furn-')) {
            const id = pick.pickedMesh.name.replace('furn-', '')
            setSelectedId(id)
          } else if (pick && pick.hit && pick.pickedMesh?.name.includes('floor')) {
            setSelectedId(null)
          }
        }
      })

      engine.runRenderLoop(() => scene?.render())
    }

    // Force correct dimensions and camera framing (initial load resets to default frame)
    engine.resize()
    updateCameraFraming(display.viewMode ?? '3d', true)

    // ResizeObserver on canvas itself — preserves camera alpha, beta, and zoom on panel resizing
    const ro = new ResizeObserver(() => {
      if (engineRef && !engineRef.isDisposed) {
        engineRef.resize()
        const currentMode = useAppStore.getState().display.viewMode ?? '3d'
        updateCameraFraming(currentMode, false)
      }
    })
    ro.observe(canvas)

    const handleResize = () => {
      if (engineRef && !engineRef.isDisposed) {
        engineRef.resize()
        const currentMode = useAppStore.getState().display.viewMode ?? '3d'
        updateCameraFraming(currentMode, false)
      }
    }
    window.addEventListener('resize', handleResize)

    requestAnimationFrame(() => {
      if (engineRef && !engineRef.isDisposed) {
        engineRef.resize()
        updateCameraFraming(display.viewMode ?? '3d', false)
      }
    })

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

  // 1. Static Room Architecture (Floors & Walls) — ONLY rebuilt when room dimensions or theme change!
  useEffect(() => {
    const scene = sceneRef
    if (!scene) return

    // Clear previous architectural meshes only
    scene.meshes
      .filter(m =>
        m.name.startsWith('arch-') ||
        m.name.startsWith('room-floor') ||
        m.name.startsWith('hallway-floor')
      )
      .forEach(m => m.dispose())

    // Dynamic Room Floor
    const floor = MeshBuilder.CreateBox('room-floor', { width: roomW, height: 0.02, depth: roomD }, scene)
    const floorMat = new StandardMaterial('floor-mat', scene)
    floorMat.diffuseColor = hexToColor3(theme === 'dark' ? '#1e293b' : '#e2e8f0')
    floorMat.specularColor = new Color3(0.05, 0.05, 0.05)
    floor.material = floorMat
    floor.position.x = roomW / 2
    floor.position.z = roomD / 2
    floor.position.y = -0.01

    // Dynamic Hallway Floor
    const hwFloor = MeshBuilder.CreateBox('hallway-floor', { width: doorWidth, height: 0.02, depth: corridorLen }, scene)
    const hwMat = new StandardMaterial('hw-floor-mat', scene)
    hwMat.diffuseColor = hexToColor3(theme === 'dark' ? '#182234' : '#cbd5e1')
    hwMat.specularColor = new Color3(0.05, 0.05, 0.05)
    hwFloor.material = hwMat
    hwFloor.position.x = hallwayCenterX
    hwFloor.position.z = -corridorLen / 2
    hwFloor.position.y = -0.01

    // Dynamic Low Architectural Walls
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
  }, [room, theme])

  // 2. Dynamic Furniture Meshes, Material States, Ghosts & Overlays (No architectural disposal!)
  useEffect(() => {
    const scene = sceneRef
    if (!scene) return

    // Clear ONLY transient overlays (ghosts, clearance planes, motion vectors)
    scene.meshes
      .filter(m =>
        m.name.startsWith('clearance-') ||
        m.name.startsWith('ghost-') ||
        m.name.startsWith('pathway-') ||
        m.name.startsWith('dual-ghost-') ||
        m.name.startsWith('motion-vector-')
      )
      .forEach(m => m.dispose())

    // Clean up any deleted furniture meshes
    const activeFurnIds = new Set(furniture.map(f => f.id))
    scene.meshes
      .filter(m => m.name.startsWith('furn-') && !activeFurnIds.has(m.name.replace('furn-', '')))
      .forEach(m => m.dispose())

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

      // Main box mesh — reuse existing mesh if dimensions match to prevent any blinking/recreation!
      const dimKey = `${f.assembled.w}_${f.assembled.d}_${f.assembled.h}`
      let mesh = scene.getMeshByName(`furn-${f.id}`) as Mesh | null
      if (mesh && (mesh as any)._dimKey !== dimKey) {
        mesh.dispose()
        mesh = null
      }

      if (!mesh) {
        mesh = MeshBuilder.CreateBox(`furn-${f.id}`, {
          width: f.assembled.w * SCALE,
          height: f.assembled.h * SCALE,
          depth: f.assembled.d * SCALE,
        }, scene)
        ;(mesh as any)._dimKey = dimKey
        mesh.isPickable = true
      }

      mesh.position.x = posX
      mesh.position.z = posZ
      mesh.position.y = posY
      mesh.rotation.y = rotY

      // Material — reuse existing material to prevent shader recompilation flicker!
      let mat = scene.getMaterialByName(`mat-${f.id}`) as StandardMaterial | null
      if (!mat) {
        mat = new StandardMaterial(`mat-${f.id}`, scene)
        mesh.material = mat
      }
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
      } else {
        mat.emissiveColor = Color3.Black()
      }

      // Clean architectural edges
      if (display.showBoundingBox || isSelected || planIdx === playbackStep) {
        mesh.enableEdgesRendering(0.9)
        mesh.edgesWidth = isSelected ? 4.0 : (planIdx === playbackStep ? 3.0 : 2.0)
        const outlineHex = isSelected ? '#38bdf8' : (planIdx === playbackStep ? '#00e5ff' : display.boundingBoxColor)
        const oc = hexToColor3(outlineHex)
        mesh.edgesColor = new Color4(oc.r, oc.g, oc.b, isSelected ? 1.0 : display.boundingBoxOpacity)
      } else {
        mesh.disableEdgesRendering()
      }

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

    // 6. Dual 3D Ghosts & Motion Trajectory Vector for Selected Item (v08)
    const selectedItem = furniture.find(f => f.id === selectedId)
    if (selectedItem && selectedItem.placementMode && selectedItem.placementMode !== 'static') {
      const sPos = selectedItem.startPosition ?? selectedItem.position
      const ePos = selectedItem.endPosition ?? selectedItem.position
      const sRot = selectedItem.startRotation ?? selectedItem.rotation ?? 0
      const eRot = selectedItem.endRotation ?? selectedItem.rotation ?? 0

      if (sPos && ePos) {
        // Start Ghost: Cyan (#06b6d4, alpha 0.35)
        const startGhost = MeshBuilder.CreateBox('dual-ghost-start', {
          width: selectedItem.assembled.w * SCALE,
          height: selectedItem.assembled.h * SCALE,
          depth: selectedItem.assembled.d * SCALE,
        }, scene)
        startGhost.position.x = (sPos.x + selectedItem.assembled.w / 2) * SCALE
        startGhost.position.z = (sPos.y + selectedItem.assembled.d / 2) * SCALE
        startGhost.position.y = (selectedItem.assembled.h / 2) * SCALE
        startGhost.rotation.y = (sRot * Math.PI) / 180

        const startMat = new StandardMaterial('dual-ghost-start-mat', scene)
        startMat.diffuseColor = hexToColor3('#06b6d4')
        startMat.emissiveColor = hexToColor3('#0891b2').scale(0.35)
        startMat.alpha = 0.35
        startGhost.material = startMat
        startGhost.enableEdgesRendering(0.95)
        startGhost.edgesWidth = 2.5
        startGhost.edgesColor = new Color4(0.02, 0.85, 1.0, 0.9)

        // Floor waypoint marker [S]
        const sDisc = MeshBuilder.CreateDisc('dual-ghost-start-disc', { radius: 0.14 }, scene)
        sDisc.rotation.x = Math.PI / 2
        sDisc.position.x = startGhost.position.x
        sDisc.position.z = startGhost.position.z
        sDisc.position.y = 0.006
        const sDiscMat = new StandardMaterial('dual-ghost-sdisc-mat', scene)
        sDiscMat.diffuseColor = hexToColor3('#06b6d4')
        sDiscMat.emissiveColor = hexToColor3('#06b6d4')
        sDisc.material = sDiscMat

        // End Ghost: Green (#10b981, alpha 0.35)
        const endGhost = MeshBuilder.CreateBox('dual-ghost-end', {
          width: selectedItem.assembled.w * SCALE,
          height: selectedItem.assembled.h * SCALE,
          depth: selectedItem.assembled.d * SCALE,
        }, scene)
        endGhost.position.x = (ePos.x + selectedItem.assembled.w / 2) * SCALE
        endGhost.position.z = (ePos.y + selectedItem.assembled.d / 2) * SCALE
        endGhost.position.y = (selectedItem.assembled.h / 2) * SCALE
        endGhost.rotation.y = (eRot * Math.PI) / 180

        const endMat = new StandardMaterial('dual-ghost-end-mat', scene)
        endMat.diffuseColor = hexToColor3('#10b981')
        endMat.emissiveColor = hexToColor3('#059669').scale(0.35)
        endMat.alpha = 0.35
        endGhost.material = endMat
        endGhost.enableEdgesRendering(0.95)
        endGhost.edgesWidth = 2.5
        endGhost.edgesColor = new Color4(0.06, 0.72, 0.5, 0.9)

        // Floor waypoint marker [E]
        const eDisc = MeshBuilder.CreateDisc('dual-ghost-end-disc', { radius: 0.14 }, scene)
        eDisc.rotation.x = Math.PI / 2
        eDisc.position.x = endGhost.position.x
        eDisc.position.z = endGhost.position.z
        eDisc.position.y = 0.006
        const eDiscMat = new StandardMaterial('dual-ghost-edisc-mat', scene)
        eDiscMat.diffuseColor = hexToColor3('#10b981')
        eDiscMat.emissiveColor = hexToColor3('#10b981')
        eDisc.material = eDiscMat

        // Motion Trajectory Line
        const vectorPoints = [
          new Vector3(startGhost.position.x, 0.007, startGhost.position.z),
          new Vector3(endGhost.position.x, 0.007, endGhost.position.z),
        ]
        const trajLine = MeshBuilder.CreateLines('motion-vector-line', { points: vectorPoints }, scene)
        trajLine.color = new Color3(0.22, 0.74, 0.97)
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

      {/* Floating Playback Safety Lock HUD (v08) */}
      {playbackPlaying && (
        <div className="canvas-playback-lock-hud">
          <span className="lock-icon">🔒</span>
          <span className="lock-text">Sequence Playing — Canvas & Design Locked</span>
          <button className="lock-pause-btn" onClick={() => setPlaybackPlaying(false)}>
            ⏸ Pause to Edit
          </button>
        </div>
      )}
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
    </div>
  )
}
