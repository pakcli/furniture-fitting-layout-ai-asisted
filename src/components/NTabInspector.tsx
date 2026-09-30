import React from 'react'
import { useAppStore } from '@/store/app-store'
import { DisplaySettings as DisplaySettingsPanel } from '@/components/DisplaySettings'
import { ROOM_PRESETS } from '@/data/presets'
import type { InspectorTab } from '@/types'

const TABS: { id: InspectorTab; label: string; icon: string }[] = [
  { id: 'room',     label: 'Room',     icon: '🏠' },
  { id: 'display',  label: 'Display',  icon: '🖥' },
  { id: 'object',   label: 'Object',   icon: '📦' },
  { id: 'sequence', label: 'Sequence', icon: '🎬' },
]

function RoomTab() {
  const { room, setRoom, selectRoomPreset } = useAppStore()
  return (
    <div className="ntab-content">
      <div className="panel-section">
        <div className="section-title">Room Preset</div>
        <select
          value={room.id}
          onChange={e => selectRoomPreset(e.target.value)}
          style={{ width:'100%', padding:'5px 8px', fontSize:12, fontWeight:600,
            borderRadius:5, background:'var(--surface2)', color:'var(--text)', border:'1px solid var(--border)' }}
        >
          {ROOM_PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="text-muted text-xs mt-1" style={{ lineHeight:1.35 }}>
          {room.id === 'room-compact-studio'
            ? '⚡ 1.0m narrow door: Studio Bed must rotate 90° to fit!'
            : '🚪 1.8m wide entrance hallway into 500×380cm bedroom.'}
        </div>
      </div>
      <div className="panel-section">
        <div className="section-title">Room Specs</div>
        <div className="field-row">
          <label>Ceiling H</label>
          <input type="number" value={room.ceilingHeightCm}
            onChange={e => setRoom({ ...room, ceilingHeightCm: +e.target.value })} />
          <span className="text-muted text-sm">cm</span>
        </div>
        <div className="field-row">
          <label>Walkway Min</label>
          <input type="number" value={room.walkwayMinCm}
            onChange={e => setRoom({ ...room, walkwayMinCm: +e.target.value })} />
          <span className="text-muted text-sm">cm</span>
        </div>
      </div>
    </div>
  )
}

function DisplayTab() {
  return (
    <div className="ntab-content">
      <DisplaySettingsPanel />
    </div>
  )
}

function ObjectTab() {
  const {
    furniture,
    selectedId,
    removeFurniture,
    selectedTransformTarget,
    setSelectedTransformTarget,
    setFurniturePlacementMode,
    updateFurnitureTransformTarget,
    snapFurnitureToEntrance,
    invertFurnitureMotion,
    setFurnitureLocalProgress,
    playbackPlaying,
    setPlaybackPlaying,
  } = useAppStore()

  const selected = furniture.find(f => f.id === selectedId)

  if (!selected) {
    return (
      <div className="ntab-content">
        <div className="panel-section" style={{ color:'var(--text-2)', fontSize:12, textAlign:'center', paddingTop:20 }}>
          <div style={{ fontSize:28, marginBottom:8 }}>📦</div>
          <div>No object selected</div>
          <div className="text-muted text-xs mt-1">Click any furniture mesh in the 3D viewport.</div>
        </div>
      </div>
    )
  }

  const currentMode = selected.placementMode ?? 'static'

  // Get active coordinate values depending on selectedTransformTarget
  let activeX = Math.round(selected.position?.x ?? 0)
  let activeY = Math.round(selected.position?.y ?? 0)
  let activeRot = selected.rotation ?? 0

  if (selectedTransformTarget === 'end') {
    activeX = Math.round(selected.endPosition?.x ?? selected.position?.x ?? 0)
    activeY = Math.round(selected.endPosition?.y ?? selected.position?.y ?? 0)
    activeRot = selected.endRotation ?? selected.rotation ?? 0
  } else if (selectedTransformTarget === 'start') {
    activeX = Math.round(selected.startPosition?.x ?? selected.position?.x ?? 0)
    activeY = Math.round(selected.startPosition?.y ?? selected.position?.y ?? 0)
    activeRot = selected.startRotation ?? selected.rotation ?? 0
  }

  const handleCoordChange = (patch: { x?: number; y?: number; rotation?: number }) => {
    updateFurnitureTransformTarget(selected.id, selectedTransformTarget, patch)
  }

  const localProg = selected.localProgress ?? 1.0

  return (
    <div className="ntab-content">
      {/* Playback Lock Notice */}
      {playbackPlaying && (
        <div className="panel-section playback-lock-banner">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--yellow)' }}>
              🔒 Simulation Playing
            </span>
            <button className="btn btn-sm" onClick={() => setPlaybackPlaying(false)} style={{ fontSize: 10, padding: '2px 6px' }}>
              ⏸ Pause
            </button>
          </div>
          <div className="text-muted text-xs mt-1">Editing locked while sequence is actively playing.</div>
        </div>
      )}

      {/* Selected Object Header */}
      <div className="panel-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="section-title" style={{ color:'var(--blue)', fontWeight:600, margin:0 }}>
            {selected.name}
          </div>
          <span className="card-badge" style={{ background: 'var(--surface2)', color: 'var(--text-2)', fontSize: 9 }}>
            {selected.priority}
          </span>
        </div>
        <div className="text-muted text-xs mt-1" style={{ marginBottom: 8 }}>
          {selected.assembled.w}×{selected.assembled.d}×{selected.assembled.h} cm
        </div>

        {/* 1. Placement Mode Selector */}
        <div className="section-title" style={{ marginTop: 10, marginBottom: 4 }}>
          Placement Mode
        </div>
        <div className="placement-mode-pills">
          <button
            disabled={playbackPlaying}
            className={`mode-pill${currentMode === 'static' ? ' active' : ''}`}
            onClick={() => setFurniturePlacementMode(selected.id, 'static')}
            title="Static: Stationary in room (Start = End = Current)"
          >
            Static
          </button>
          <button
            disabled={playbackPlaying}
            className={`mode-pill${currentMode === 'inserting' ? ' active' : ''}`}
            onClick={() => setFurniturePlacementMode(selected.id, 'inserting')}
            title="Inserting: Moves from Entrance into Room"
          >
            Inserting
          </button>
          <button
            disabled={playbackPlaying}
            className={`mode-pill${currentMode === 'packing' ? ' active' : ''}`}
            onClick={() => setFurniturePlacementMode(selected.id, 'packing')}
            title="Packing: Moves from Room out to Entrance"
          >
            Packing
          </button>
        </div>
        <div className="text-muted text-xs mt-1" style={{ lineHeight: 1.3 }}>
          {currentMode === 'static' && '📍 Stationary object. Start = End = Current.'}
          {currentMode === 'inserting' && '🚪 Start at Hallway Entrance ➔ Dropped Room Position.'}
          {currentMode === 'packing' && '📦 Starts in Room ➔ moves to Hallway Entrance.'}
        </div>

        {/* 2. Transform Triad Selection (End default) */}
        <div className="section-title" style={{ marginTop: 12, marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Active Transform</span>
          <span style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 400 }}>
            {selectedTransformTarget === 'end' ? '🟢 End' : selectedTransformTarget === 'start' ? '🔵 Start' : '⚪ Current'}
          </span>
        </div>
        <div className="transform-radio-group">
          <button
            disabled={playbackPlaying}
            className={`transform-radio-btn end${selectedTransformTarget === 'end' ? ' active' : ''}`}
            onClick={() => setSelectedTransformTarget('end')}
            title="Edit End Placement (where item ends up)"
          >
            <span className="dot dot-end" />
            <span>End (Default)</span>
          </button>
          <button
            disabled={playbackPlaying}
            className={`transform-radio-btn start${selectedTransformTarget === 'start' ? ' active' : ''}`}
            onClick={() => setSelectedTransformTarget('start')}
            title="Edit Start Placement (where item starts)"
          >
            <span className="dot dot-start" />
            <span>Start</span>
          </button>
          <button
            disabled={playbackPlaying}
            className={`transform-radio-btn current${selectedTransformTarget === 'current' ? ' active' : ''}`}
            onClick={() => setSelectedTransformTarget('current')}
            title="Edit Current Active Position"
          >
            <span className="dot dot-current" />
            <span>Current</span>
          </button>
        </div>

        {/* 3. Coordinate Inputs */}
        <fieldset disabled={playbackPlaying} style={{ border: 'none', padding: 0, margin: '8px 0 0 0' }}>
          <div className="field-row">
            <label>X pos</label>
            <input
              type="number"
              value={activeX}
              onChange={e => handleCoordChange({ x: +e.target.value })}
            />
            <span className="text-muted text-sm">cm</span>
          </div>
          <div className="field-row">
            <label>Y pos</label>
            <input
              type="number"
              value={activeY}
              onChange={e => handleCoordChange({ y: +e.target.value })}
            />
            <span className="text-muted text-sm">cm</span>
          </div>
          <div className="field-row">
            <label>Rotation</label>
            <input
              type="number"
              value={activeRot}
              onChange={e => handleCoordChange({ rotation: +e.target.value })}
            />
            <span className="text-muted text-sm">deg</span>
          </div>
          <div className="flex gap-1 mt-1">
            <button
              className="btn btn-sm"
              onClick={() => handleCoordChange({ rotation: (activeRot + 90) % 360 })}
            >
              +90°
            </button>
            <button
              className="btn btn-sm"
              onClick={() => handleCoordChange({ rotation: (activeRot - 90 + 360) % 360 })}
            >
              -90°
            </button>
          </div>
        </fieldset>

        {/* 4. 1-Click Action Shortcuts */}
        <div className="section-title" style={{ marginTop: 12, marginBottom: 4 }}>
          Transform Shortcuts
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <button
            disabled={playbackPlaying}
            className="btn btn-sm"
            onClick={() => snapFurnitureToEntrance(selected.id, selectedTransformTarget === 'start' ? 'start' : 'end')}
            title="Snap active target to hallway entrance coordinates"
          >
            🚪 Entrance
          </button>
          <button
            disabled={playbackPlaying}
            className="btn btn-sm"
            onClick={() => handleCoordChange({ x: selected.position?.x, y: selected.position?.y, rotation: selected.rotation })}
            title="Lock current 3D position into the active transform target"
          >
            📍 Lock Current
          </button>
        </div>
        {currentMode !== 'static' && (
          <button
            disabled={playbackPlaying}
            className="btn btn-sm w-full mt-1"
            onClick={() => invertFurnitureMotion(selected.id)}
            title="Swap Start and End positions (inverts motion between inserting and packing)"
          >
            ⇄ Invert Motion (Reverse)
          </button>
        )}

        {/* 5. Local Motion Scrub Slider */}
        {currentMode !== 'static' && (
          <div style={{ marginTop: 12, padding: '8px', background: 'var(--surface2)', borderRadius: 6, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Local Motion Scrub
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', fontFamily: 'monospace' }}>
                {Math.round(localProg * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(localProg * 100)}
              onChange={e => setFurnitureLocalProgress(selected.id, (+e.target.value) / 100)}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-2)', marginTop: 2 }}>
              <span>[S] Start (0%)</span>
              <span>[E] End (100%)</span>
            </div>
          </div>
        )}

        {/* 6. Bounding Box & Remove */}
        <div className="section-title" style={{ marginTop: 12 }}>Dimensions & Bounding Box</div>
        <div className="text-muted text-xs">
          W: {selected.assembled.w}cm · D: {selected.assembled.d}cm · H: {selected.assembled.h}cm
        </div>
        <button
          disabled={playbackPlaying}
          className="btn btn-danger btn-sm mt-2 w-full"
          onClick={() => removeFurniture(selected.id)}
        >
          Remove Item
        </button>
      </div>
    </div>
  )
}

function SequenceTab() {
  const {
    sequenceRows, setCSVEditorOpen,
    plan, furniture,
    playbackStep, setPlaybackStep,
    playbackPlaying, setPlaybackPlaying,
    playbackProgress, setPlaybackProgress,
    display, setDisplay,
    exportSequenceCSV, copySequencePrompt,
  } = useAppStore()

  const steps = plan?.steps ?? []
  const total = steps.length
  const current = steps[playbackStep]
  const totalRows = sequenceRows.length
  const totalDur = sequenceRows.reduce((a, r) => a + r.duration_s, 0)

  // Overall scrub ratio
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
    <div className="ntab-content">
      {/* Sequence & Plan Summary */}
      <div className="panel-section">
        <div className="section-title">Sequence Summary</div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
          <span className="text-muted text-xs">Solver Steps</span>
          <span style={{ fontWeight:600, fontSize:13 }}>{total > 0 ? `${playbackStep + 1} / ${total}` : 'No plan'}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
          <span className="text-muted text-xs">CSV Rows</span>
          <span style={{ fontWeight:600, fontSize:13 }}>{totalRows}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span className="text-muted text-xs">Total Duration</span>
          <span style={{ fontWeight:600, fontSize:13 }}>{totalDur.toFixed(1)}s</span>
        </div>
        <button className="btn btn-primary btn-sm w-full" onClick={() => setCSVEditorOpen(true)}>
          📋 Open CSV Editor →
        </button>
      </div>

      {/* Interactive Playback & Scrubber */}
      <div className="panel-section">
        <div className="section-title">Timeline & Playback</div>

        {/* Current step title and action */}
        <div style={{ marginBottom: 6, fontSize: 11 }}>
          <div style={{ fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {current ? current.furnitureName : (total > 0 ? 'Ready' : 'Run Solver to animate')}
          </div>
          {current && (
            <div style={{ color: 'var(--text-2)', fontSize: 10, marginTop: 2 }}>
              {current.action}
            </div>
          )}
        </div>

        {/* Scrub Track */}
        <div
          className="timeline-track"
          onClick={handleTrackClick}
          style={{ height: 6, margin: '8px 0', cursor: total > 0 ? 'pointer' : 'default' }}
        >
          <div className="timeline-fill" style={{ width: `${overallRatio * 100}%` }} />
          <div className="timeline-thumb" style={{ left: `${overallRatio * 100}%`, width: 12, height: 12 }} />
        </div>

        {/* Control Buttons */}
        <div className="flex gap-1" style={{ marginTop: 8 }}>
          <button
            className="btn btn-sm"
            onClick={() => { setPlaybackStep(0); setPlaybackProgress(0); setPlaybackPlaying(false) }}
            title="First Step"
            disabled={total === 0}
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
            disabled={total === 0}
          >
            ◀
          </button>
          <button
            className={`btn btn-sm flex-1${playbackPlaying ? ' btn-primary' : ''}`}
            onClick={() => {
              if (playbackStep >= total - 1 && playbackProgress >= 0.99) {
                setPlaybackStep(0)
                setPlaybackProgress(0)
              }
              setPlaybackPlaying(!playbackPlaying)
            }}
            disabled={total === 0}
            style={{ fontWeight: 600 }}
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
            disabled={total === 0}
          >
            ▶
          </button>
          <button
            className="btn btn-sm"
            onClick={() => { setPlaybackStep(Math.max(0, total - 1)); setPlaybackProgress(1.0); setPlaybackPlaying(false) }}
            title="Last Step"
            disabled={total === 0}
          >
            ⏭
          </button>
        </div>

        {/* Ghost Trail Toggle */}
        <div style={{ marginTop: 8 }}>
          <button
            className={`btn btn-sm w-full${display.showGhostTrail ? ' btn-primary' : ''}`}
            onClick={() => setDisplay({ showGhostTrail: !display.showGhostTrail })}
            style={{ fontSize: 11 }}
          >
            👻 Ghost Trail: {display.showGhostTrail ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Step Pills Quick Jump */}
        {total > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--text-2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Jump to Step:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 120, overflowY: 'auto' }}>
              {steps.map((s, i) => (
                <button
                  key={s.furnitureId}
                  className={`btn btn-sm${playbackStep === i ? ' btn-primary' : ''}`}
                  onClick={() => { setPlaybackStep(i); setPlaybackProgress(1.0) }}
                  style={{
                    justifyContent: 'flex-start',
                    fontSize: 10.5,
                    padding: '3px 6px',
                    textAlign: 'left',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ opacity: 0.7, marginRight: 4 }}>{i + 1}.</span> {s.furnitureName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Export */}
      <div className="panel-section">
        <div className="section-title">Export</div>
        <button className="btn btn-sm w-full" onClick={exportSequenceCSV} title="Save CSV file + copy to clipboard">⬇ Export CSV</button>
        <button className="btn btn-sm w-full mt-1" onClick={copySequencePrompt} title="Copy AI prompt + raw CSV (2 formats)">📋 Copy Prompt</button>
      </div>
    </div>
  )
}

export function NTabInspector() {
  const { inspectorTab, setInspectorTab } = useAppStore()
  return (
    <div className="ntab-inspector">
      <div className="ntab-strip">
        {TABS.map(t => (
          <button key={t.id} className={`ntab-item${inspectorTab===t.id?' active':''}`}
            onClick={() => setInspectorTab(t.id)} title={t.label}>
            <span className="ntab-icon">{t.icon}</span>
            <span className="ntab-label">{t.label}</span>
          </button>
        ))}
      </div>
      <div className="ntab-panel">
        {inspectorTab === 'room'     && <RoomTab />}
        {inspectorTab === 'display'  && <DisplayTab />}
        {inspectorTab === 'object'   && <ObjectTab />}
        {inspectorTab === 'sequence' && <SequenceTab />}
      </div>
    </div>
  )
}
