import React, { useEffect, useRef } from 'react'
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight,
  Vector3, Color4, Color3, MeshBuilder, StandardMaterial,
  PointerEventTypes, type Mesh,
} from '@babylonjs/core'
import { useAppStore } from '@/store/app-store'
import { DisplaySettings as DisplaySettingsPanel } from '@/components/DisplaySettings'
import { ResultsPanel } from '@/components/ResultsPanel'
import { furnitureToOBB, satTest } from '@/solver/obb-sat'

// ─── Step slider ──────────────────────────────────────────────────────────────

function StepSlider() {
  const { plan, playbackStep, setPlaybackStep } = useAppStore()
  if (!plan || plan.steps.length === 0) return null

  return (
    <div className="step-slider-bar">
      <span className="text-muted text-sm" style={{ fontWeight: 600 }}>Entry Order:</span>
      {plan.steps.map((s, i) => (
        <button
          key={s.furnitureId}
          className={`step-pill${playbackStep === i ? ' active' : ''}${s.issue?.type === 'stall' ? ' stall' : ''}`}
          onClick={() => setPlaybackStep(i)}
        >
          {i + 1}. {s.furnitureName}
        </button>
      ))}
    </div>
  )
}

// ─── Left panel ───────────────────────────────────────────────────────────────

function LeftPanel() {
  const { furniture, selectedId, updateFurniture, removeFurniture, room, setRoom } = useAppStore()
  const selected = furniture.find(f => f.id === selectedId)

  return (
    <div className="editor-left">
      <div className="panel-section">
        <div className="section-title">Room &amp; Hallway Dimensions</div>
        <div className="field-row">
          <label>Ceiling H</label>
          <input
            type="number"
            value={room.ceilingHeightCm}
            onChange={e => setRoom({ ...room, ceilingHeightCm: +e.target.value })}
          />
          <span className="text-muted text-sm">cm</span>
        </div>
        <div className="field-row">
          <label>Walkway Min</label>
          <input
            type="number"
            value={room.walkwayMinCm}
            onChange={e => setRoom({ ...room, walkwayMinCm: +e.target.value })}
          />
          <span className="text-muted text-sm">cm</span>
        </div>
      </div>

      {selected ? (
        <div className="panel-section">
          <div className="section-title" style={{ color: 'var(--blue)', fontWeight: 600 }}>
            Selected: {selected.name}
          </div>
          <div className="field-row">
            <label>X pos</label>
            <input
              type="number"
              value={Math.round(selected.position?.x ?? 0)}
              onChange={e => updateFurniture(selected.id, {
                position: { x: +e.target.value, y: selected.position?.y ?? 0 },
              })}
            />
            <span className="text-muted text-sm">cm</span>
          </div>
          <div className="field-row">
            <label>Y pos</label>
            <input
              type="number"
              value={Math.round(selected.position?.y ?? 0)}
              onChange={e => updateFurniture(selected.id, {
                position: { x: selected.position?.x ?? 0, y: +e.target.value },
              })}
            />
            <span className="text-muted text-sm">cm</span>
          </div>
          <div className="field-row">
            <label>Rotation</label>
            <input
              type="number"
              value={selected.rotation ?? 0}
              onChange={e => updateFurniture(selected.id, { rotation: +e.target.value })}
            />
            <span className="text-muted text-sm">deg</span>
          </div>
          <div className="flex gap-1 mt-1">
            <button
              className="btn btn-sm"
              onClick={() => updateFurniture(selected.id, { rotation: ((selected.rotation ?? 0) + 90) % 360 })}
            >
              Rotate +90°
            </button>
            <button
              className="btn btn-sm"
              onClick={() => updateFurniture(selected.id, { rotation: ((selected.rotation ?? 0) - 90 + 360) % 360 })}
            >
              Rotate -90°
            </button>
          </div>
          <button
            className="btn btn-danger btn-sm mt-2 w-full"
            onClick={() => removeFurniture(selected.id)}
          >
            Remove Item
          </button>
        </div>
      ) : (
        <div className="panel-section" style={{ color: 'var(--text-2)', fontSize: 12 }}>
          💡 Click any 3D furniture item to view or adjust its position &amp; rotation.
        </div>
      )}

      <div className="panel-section" style={{ flex: 1, overflowY: 'auto' }}>
        <DisplaySettingsPanel />
      </div>
    </div>
  )
}

// ─── Babylon.js Canvas ────────────────────────────────────────────────────────

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

export function getScene() { return sceneRef }

function BabylonCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { furniture, display, selectedId, setSelectedId, theme } = useAppStore()

  const BG_MAP: Record<string, string> = {
    dark:  '#0f172a',
    light: '#f1f5f9',
    cream: '#fefce8',
  }

  // Initialize Babylon Scene & Camera
  useEffect(() => {
    if (!canvasRef.current) return
    if (engineRef) return

    const engine = new Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true })
    const scene = new Scene(engine)
    engineRef = engine
    sceneRef = scene

    scene.clearColor = canvasBgToColor4(BG_MAP[theme] ?? BG_MAP.dark)

    // Center camera on bedroom & hallway center (x: 2.5m, z: 1.6m)
    const camera = new ArcRotateCamera(
      'cam',
      -Math.PI / 3,
      Math.PI / 3.4,
      11.5,
      new Vector3(2.5, 0.4, 1.6),
      scene
    )
    camera.mode = 0 // Perspective for realistic depth
    camera.lowerRadiusLimit = 4
    camera.upperRadiusLimit = 25
    camera.upperBetaLimit = Math.PI / 2.05
    camera.attachControl(canvasRef.current, true)
    cameraRef = camera

    // Soft Ambient + Directional lighting
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
    const handleResize = () => engine.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Update theme background
  useEffect(() => {
    if (sceneRef) {
      sceneRef.clearColor = canvasBgToColor4(BG_MAP[theme] ?? BG_MAP.dark)
    }
  }, [theme])

  // Sync Room Architecture & Furniture Meshes
  useEffect(() => {
    const scene = sceneRef
    if (!scene) return

    // 1. Clear previous furniture and clearance meshes
    scene.meshes
      .filter(m => m.name.startsWith('furn-') || m.name.startsWith('clearance-') || m.name.startsWith('arch-'))
      .forEach(m => m.dispose())

    const SCALE = 0.01 // 1 cm = 0.01 Babylon units (1 meter)
    const roomW = 5.0  // 500 cm
    const roomD = 3.8  // 380 cm

    // 2. Room Floor
    let floor = scene.getMeshByName('room-floor') as Mesh
    if (!floor) {
      floor = MeshBuilder.CreateBox('room-floor', { width: roomW, height: 0.02, depth: roomD }, scene)
      const floorMat = new StandardMaterial('floor-mat', scene)
      floorMat.diffuseColor = hexToColor3(theme === 'dark' ? '#1e293b' : '#e2e8f0')
      floorMat.specularColor = new Color3(0.05, 0.05, 0.05)
      floor.material = floorMat
    }
    floor.position.x = roomW / 2
    floor.position.z = roomD / 2
    floor.position.y = -0.01

    // 3. Hallway Floor (x: 1.6m to 3.4m, z: -1.4m to 0m)
    let hwFloor = scene.getMeshByName('hallway-floor') as Mesh
    if (!hwFloor) {
      hwFloor = MeshBuilder.CreateBox('hallway-floor', { width: 1.8, height: 0.02, depth: 1.4 }, scene)
      const hwMat = new StandardMaterial('hw-floor-mat', scene)
      hwMat.diffuseColor = hexToColor3(theme === 'dark' ? '#182234' : '#cbd5e1')
      hwMat.specularColor = new Color3(0.05, 0.05, 0.05)
      hwFloor.material = hwMat
    }
    hwFloor.position.x = 2.5
    hwFloor.position.z = -0.7
    hwFloor.position.y = -0.01

    // 4. Low Architectural Perimeter Walls (height 0.35m = 35cm)
    const wallH = 0.35
    const wallThick = 0.08
    const wallMat = new StandardMaterial('wall-mat', scene)
    wallMat.diffuseColor = hexToColor3(theme === 'dark' ? '#334155' : '#94a3b8')
    wallMat.specularColor = new Color3(0.1, 0.1, 0.1)

    const createWall = (name: string, w: number, d: number, px: number, pz: number) => {
      const wall = MeshBuilder.CreateBox(`arch-${name}`, { width: w, height: wallH, depth: d }, scene)
      wall.position.x = px
      wall.position.z = pz
      wall.position.y = wallH / 2
      wall.material = wallMat
    }

    // North wall (back)
    createWall('wall-n', roomW + wallThick * 2, wallThick, roomW / 2, roomD + wallThick / 2)
    // West wall (left)
    createWall('wall-w', wallThick, roomD, -wallThick / 2, roomD / 2)
    // East wall (right)
    createWall('wall-e', wallThick, roomD, roomW + wallThick / 2, roomD / 2)
    // South wall left (from x:0 to x:1.6)
    createWall('wall-s-left', 1.6, wallThick, 0.8, -wallThick / 2)
    // South wall right (from x:3.4 to x:5.0)
    createWall('wall-s-right', 1.6, wallThick, 4.2, -wallThick / 2)
    // Hallway west wall
    createWall('hw-wall-w', wallThick, 1.4, 1.6 - wallThick / 2, -0.7)
    // Hallway east wall
    createWall('hw-wall-e', wallThick, 1.4, 3.4 + wallThick / 2, -0.7)

    // 5. Render Placed Furniture
    for (const f of furniture) {
      if (!f.visible || !f.position) continue

      // Collision detection with other visible items
      let hasCollision = false
      for (const other of furniture) {
        if (other.id === f.id || !other.visible || !other.position) continue
        const a = furnitureToOBB(f.position.x, f.position.y, f.rotation ?? 0, f.assembled.w, f.assembled.d)
        const b = furnitureToOBB(other.position.x, other.position.y, other.rotation ?? 0, other.assembled.w, other.assembled.d)
        const test = satTest(a, b)
        if (test.overlapping && test.penetrationCm > 1.5) {
          hasCollision = true
          break
        }
      }

      const isSelected = f.id === selectedId

      // Main furniture box mesh
      const mesh = MeshBuilder.CreateBox(`furn-${f.id}`, {
        width: f.assembled.w * SCALE,
        height: f.assembled.h * SCALE,
        depth: f.assembled.d * SCALE,
      }, scene)

      mesh.position.x = (f.position.x + f.assembled.w / 2) * SCALE
      mesh.position.z = (f.position.y + f.assembled.d / 2) * SCALE
      mesh.position.y = (f.assembled.h / 2) * SCALE
      mesh.rotation.y = ((f.rotation ?? 0) * Math.PI) / 180

      // Solid architectural material
      const mat = new StandardMaterial(`mat-${f.id}`, scene)
      if (hasCollision) {
        mat.diffuseColor = hexToColor3(display.collisionColor)
        mat.emissiveColor = hexToColor3(display.collisionColor).scale(0.3)
      } else {
        const baseColor = display.materialMode === 'fallback'
          ? display.fallbackColor
          : f.color
        mat.diffuseColor = hexToColor3(baseColor)
        mat.specularColor = new Color3(0.2, 0.2, 0.2)
        if (isSelected) {
          mat.emissiveColor = hexToColor3('#0284c7').scale(0.25)
        }
      }

      // DO NOT set mat.wireframe = true! Use clean edge rendering for architectural bounding outlines
      mesh.material = mat

      if (display.showBoundingBox || isSelected) {
        mesh.enableEdgesRendering(0.9)
        mesh.edgesWidth = isSelected ? 4.0 : 2.0
        const outlineHex = isSelected ? '#38bdf8' : display.boundingBoxColor
        const oc = hexToColor3(outlineHex)
        mesh.edgesColor = new Color4(oc.r, oc.g, oc.b, isSelected ? 1.0 : display.boundingBoxOpacity)
      }

      mesh.isPickable = true

      // 6. Clearance Zone overlay
      if (display.showClearanceZone && f.clearance.front) {
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
  }, [furniture, display, selectedId, theme])

  return <canvas ref={canvasRef} id="babylon-canvas" style={{ width: '100%', height: '100%' }} />
}

// ─── Camera preset actions ───────────────────────────────────────────────────

function resetCamera(view: 'iso' | 'top') {
  if (!cameraRef) return
  if (view === 'iso') {
    cameraRef.alpha = -Math.PI / 3
    cameraRef.beta = Math.PI / 3.4
    cameraRef.radius = 11.5
    cameraRef.setTarget(new Vector3(2.5, 0.4, 1.6))
  } else if (view === 'top') {
    cameraRef.alpha = -Math.PI / 2
    cameraRef.beta = 0.05
    cameraRef.radius = 10
    cameraRef.setTarget(new Vector3(2.5, 0, 1.6))
  }
}

// ─── EditorView ───────────────────────────────────────────────────────────────

export function EditorView() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="editor-shell">
        <LeftPanel />
        <div className="editor-canvas">
          <BabylonCanvas />
          <div className="canvas-controls">
            <button className="btn btn-sm" title="Isometric View" onClick={() => resetCamera('iso')}>
              ⊞ Isometric
            </button>
            <button className="btn btn-sm" title="Top-Down Plan" onClick={() => resetCamera('top')}>
              ⬛ Top Plan
            </button>
            <button className="btn btn-sm" title="Reset Camera" onClick={() => resetCamera('iso')}>
              ↺ Reset
            </button>
          </div>
        </div>
        <ResultsPanel />
      </div>
      <StepSlider />
    </div>
  )
}
