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
  const { furniture, selectedId, updateFurniture, removeFurniture } = useAppStore()
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
  return (
    <div className="ntab-content">
      <div className="panel-section">
        <div className="section-title" style={{ color:'var(--blue)', fontWeight:600 }}>{selected.name}</div>
        <div className="text-muted text-xs" style={{ marginBottom:8 }}>
          {selected.assembled.w}×{selected.assembled.d}×{selected.assembled.h} cm · {selected.priority}
        </div>
        <div className="section-title" style={{ marginTop:8 }}>Transform</div>
        <div className="field-row">
          <label>X pos</label>
          <input type="number" value={Math.round(selected.position?.x ?? 0)}
            onChange={e => updateFurniture(selected.id, { position:{ x:+e.target.value, y:selected.position?.y??0 } })} />
          <span className="text-muted text-sm">cm</span>
        </div>
        <div className="field-row">
          <label>Y pos</label>
          <input type="number" value={Math.round(selected.position?.y ?? 0)}
            onChange={e => updateFurniture(selected.id, { position:{ x:selected.position?.x??0, y:+e.target.value } })} />
          <span className="text-muted text-sm">cm</span>
        </div>
        <div className="field-row">
          <label>Rotation</label>
          <input type="number" value={selected.rotation ?? 0}
            onChange={e => updateFurniture(selected.id, { rotation:+e.target.value })} />
          <span className="text-muted text-sm">deg</span>
        </div>
        <div className="flex gap-1 mt-1">
          <button className="btn btn-sm" onClick={() => updateFurniture(selected.id, { rotation:((selected.rotation??0)+90)%360 })}>+90°</button>
          <button className="btn btn-sm" onClick={() => updateFurniture(selected.id, { rotation:((selected.rotation??0)-90+360)%360 })}>-90°</button>
        </div>
        <div className="section-title" style={{ marginTop:12 }}>Bounding Box</div>
        <div className="text-muted text-xs">W:{selected.assembled.w}cm D:{selected.assembled.d}cm H:{selected.assembled.h}cm</div>
        <button className="btn btn-danger btn-sm mt-2 w-full" onClick={() => removeFurniture(selected.id)}>Remove Item</button>
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
