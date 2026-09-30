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
    playbackPlaying, setPlaybackPlaying,
    setPlaybackStep, setPlaybackProgress,
    exportSequenceCSV, copySequencePrompt,
  } = useAppStore()
  const totalSteps = sequenceRows.length
  const totalDur = sequenceRows.reduce((a, r) => a + r.duration_s, 0)
  return (
    <div className="ntab-content">
      <div className="panel-section">
        <div className="section-title">Sequence Summary</div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
          <span className="text-muted text-xs">Steps</span>
          <span style={{ fontWeight:600, fontSize:13 }}>{totalSteps}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span className="text-muted text-xs">Duration</span>
          <span style={{ fontWeight:600, fontSize:13 }}>{totalDur.toFixed(1)}s</span>
        </div>
        <button className="btn btn-primary btn-sm w-full" onClick={() => setCSVEditorOpen(true)}>
          📋 Open CSV Editor →
        </button>
      </div>
      <div className="panel-section">
        <div className="section-title">Playback</div>
        <div className="flex gap-1">
          <button className="btn btn-sm flex-1" onClick={() => { setPlaybackStep(0); setPlaybackProgress(0); setPlaybackPlaying(false) }}>⏮</button>
          <button className={`btn btn-sm flex-1${playbackPlaying?' btn-primary':''}`} onClick={() => setPlaybackPlaying(!playbackPlaying)}>
            {playbackPlaying ? '⏸' : '▶'}
          </button>
          <button className="btn btn-sm flex-1" onClick={() => setPlaybackPlaying(false)}>⏹</button>
        </div>
      </div>
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
