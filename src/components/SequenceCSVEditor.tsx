import React, { useState, useRef, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import type { SequenceStep, EasingType } from '@/types'

// ─── Column definitions ───────────────────────────────────────────────────────

type ColKey = keyof SequenceStep

const COLS: { key: ColKey; label: string; width: number; type: 'number' | 'string' | 'easing' }[] = [
  { key: 'step_id',     label: '#',           width: 40,  type: 'number' },
  { key: 'object_id',   label: 'Object ID',   width: 100, type: 'string' },
  { key: 'object_name', label: 'Name',        width: 110, type: 'string' },
  { key: 'start_pos_x', label: 'S.X',         width: 60,  type: 'number' },
  { key: 'start_pos_y', label: 'S.Y',         width: 60,  type: 'number' },
  { key: 'start_rot',   label: 'S.Rot',       width: 55,  type: 'number' },
  { key: 'end_pos_x',   label: 'E.X',         width: 60,  type: 'number' },
  { key: 'end_pos_y',   label: 'E.Y',         width: 60,  type: 'number' },
  { key: 'end_rot',     label: 'E.Rot',       width: 55,  type: 'number' },
  { key: 'duration_s',  label: 'Dur(s)',       width: 60,  type: 'number' },
  { key: 'easing',      label: 'Easing',      width: 100, type: 'easing' },
  { key: 'notes',       label: 'Notes',       width: 140, type: 'string' },
]

const EASING_OPTIONS: EasingType[] = ['linear', 'ease-in', 'ease-out', 'ease-in-out']

// ─── Editable Cell ────────────────────────────────────────────────────────────

interface CellProps {
  value: string | number
  type: 'number' | 'string' | 'easing'
  rowId: number
  colKey: ColKey
  isSelected: boolean
  onSelect: () => void
  onChange: (v: string | number) => void
  onTabNext: () => void
  onTabPrev: () => void
  onEnterDown: () => void
  onEnterUp: () => void
}

function EditableCell({ value, type, isSelected, onSelect, onChange, onTabNext, onTabPrev, onEnterDown, onEnterUp }: CellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null)

  const startEdit = () => {
    setDraft(String(value))
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const commit = () => {
    setEditing(false)
    if (type === 'number') {
      const n = parseFloat(draft)
      onChange(isNaN(n) ? value : n)
    } else {
      onChange(draft)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter')    { commit(); onEnterDown() }
    if (e.key === 'Escape')   { setEditing(false) }
    if (e.key === 'Tab')      { e.preventDefault(); commit(); e.shiftKey ? onTabPrev() : onTabNext() }
  }

  if (editing && type === 'easing') {
    return (
      <td className="csv-cell editing" onBlur={commit}>
        <select ref={inputRef as React.Ref<HTMLSelectElement>} value={draft}
          onChange={e => { setDraft(e.target.value); onChange(e.target.value as EasingType) }}
          onBlur={commit} onKeyDown={handleKeyDown} style={{ width:'100%' }}>
          {EASING_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </td>
    )
  }

  if (editing) {
    return (
      <td className="csv-cell editing">
        <input ref={inputRef as React.Ref<HTMLInputElement>}
          type={type === 'number' ? 'number' : 'text'}
          value={draft} onChange={e => setDraft(e.target.value)}
          onBlur={commit} onKeyDown={handleKeyDown} style={{ width:'100%' }} />
      </td>
    )
  }

  return (
    <td
      className={`csv-cell${isSelected ? ' selected' : ''}`}
      onDoubleClick={startEdit}
      onClick={onSelect}
    >
      {String(value)}
    </td>
  )
}

// ─── Sequence CSV Editor ──────────────────────────────────────────────────────

export function SequenceCSVEditor() {
  const {
    sequenceRows, updateSequenceRow, insertSequenceRow, deleteSequenceRow, moveSequenceRow,
    isCSVEditorOpen, setCSVEditorOpen,
    liveSyncEnabled, setLiveSyncEnabled,
    pendingChanges, saveSequenceAnimation,
    exportSequenceCSV, copySequencePrompt,
    playbackPlaying, setPlaybackPlaying,
    setPlaybackStep, setPlaybackProgress,
    plan,
  } = useAppStore()

  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)

  const getTabNext = (rowIdx: number, colIdx: number) => () => {
    if (colIdx < COLS.length - 1) setSelectedCell({ row: rowIdx, col: colIdx + 1 })
    else if (rowIdx < sequenceRows.length - 1) setSelectedCell({ row: rowIdx + 1, col: 0 })
  }
  const getTabPrev = (rowIdx: number, colIdx: number) => () => {
    if (colIdx > 0) setSelectedCell({ row: rowIdx, col: colIdx - 1 })
    else if (rowIdx > 0) setSelectedCell({ row: rowIdx - 1, col: COLS.length - 1 })
  }
  const getEnterDown = (rowIdx: number) => () => {
    if (rowIdx < sequenceRows.length - 1) setSelectedCell({ row: rowIdx + 1, col: selectedCell?.col ?? 0 })
  }
  const getEnterUp = (rowIdx: number) => () => {
    if (rowIdx > 0) setSelectedCell({ row: rowIdx - 1, col: selectedCell?.col ?? 0 })
  }

  const handleChange = useCallback((stepId: number, col: ColKey, val: string | number) => {
    updateSequenceRow(stepId, { [col]: val } as Partial<SequenceStep>)
  }, [updateSequenceRow])

  const handlePlayToggle = () => {
    if (!plan) return
    setPlaybackPlaying(!playbackPlaying)
  }
  const handleStop = () => {
    setPlaybackPlaying(false)
    setPlaybackStep(0)
    setPlaybackProgress(0)
  }

  return (
    <div className="csv-editor-panel">
      {/* Toolbar */}
      <div className="csv-toolbar">
        <div className="csv-toolbar-left">
          <button className="btn btn-sm" onClick={handlePlayToggle} disabled={!plan} title={plan ? '' : 'Run solver first'}>
            {playbackPlaying ? '⏸' : '▶'} {playbackPlaying ? 'Pause' : 'Play'}
          </button>
          <button className="btn btn-sm" onClick={handleStop}>⏹ Stop</button>
          <button className="btn btn-sm" onClick={() => { setPlaybackStep(0); setPlaybackProgress(0); setPlaybackPlaying(false) }}>⏮ Reset</button>
          <span className="csv-toolbar-sep" />
          <span className="text-muted text-xs">Steps: {sequenceRows.length}</span>
          <span className="text-muted text-xs">
            · {sequenceRows.reduce((a, r) => a + r.duration_s, 0).toFixed(1)}s
          </span>
        </div>
        <div className="csv-toolbar-right">
          <button className="btn btn-sm" onClick={copySequencePrompt} title="Copy AI prompt + raw CSV (2 formats)">📋 Copy Prompt</button>
          <button className="btn btn-sm" onClick={exportSequenceCSV} title="Download CSV + copy to clipboard">⬇ Export CSV</button>
          <button className="btn btn-sm btn-icon" onClick={() => setCSVEditorOpen(false)} title="Close CSV Editor">✕</button>
        </div>
      </div>

      {/* Live Sync toolbar */}
      <div className="csv-sync-bar">
        <span className="text-muted text-xs">Live Sync:</span>
        <button
          className={`csv-sync-toggle${liveSyncEnabled ? ' on' : ''}`}
          onClick={() => setLiveSyncEnabled(!liveSyncEnabled)}
        >
          {liveSyncEnabled ? 'ON' : 'OFF'}
        </button>
        {!liveSyncEnabled && (
          <button
            className={`btn btn-sm${pendingChanges > 0 ? ' btn-primary' : ''}`}
            onClick={saveSequenceAnimation}
            disabled={pendingChanges === 0}
          >
            💾 Save Animation{pendingChanges > 0 ? ` *${pendingChanges}` : ''}
          </button>
        )}
        {liveSyncEnabled && <span className="text-muted text-xs" style={{ color:'var(--green)' }}>● Auto-sync to 3D</span>}
      </div>

      {/* Table */}
      <div className="csv-table-wrapper">
        <table className="csv-table">
          <thead>
            <tr>
              <th style={{ width: 36 }} />
              {COLS.map(c => (
                <th key={c.key} style={{ minWidth: c.width, width: c.width }}>{c.label}</th>
              ))}
              <th style={{ width: 64 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sequenceRows.map((row, rowIdx) => (
              <tr key={row.step_id} className={selectedCell?.row === rowIdx ? 'row-selected' : ''}>
                {/* Drag grip */}
                <td className="csv-grip">
                  <button className="grip-btn" onClick={() => moveSequenceRow(row.step_id, 'up')} disabled={rowIdx === 0}>▲</button>
                  <button className="grip-btn" onClick={() => moveSequenceRow(row.step_id, 'down')} disabled={rowIdx === sequenceRows.length - 1}>▼</button>
                </td>

                {COLS.map((col, colIdx) => (
                  <EditableCell
                    key={col.key}
                    value={row[col.key] as string | number}
                    type={col.type}
                    rowId={row.step_id}
                    colKey={col.key}
                    isSelected={selectedCell?.row === rowIdx && selectedCell?.col === colIdx}
                    onSelect={() => setSelectedCell({ row: rowIdx, col: colIdx })}
                    onChange={(v) => handleChange(row.step_id, col.key, v)}
                    onTabNext={getTabNext(rowIdx, colIdx)}
                    onTabPrev={getTabPrev(rowIdx, colIdx)}
                    onEnterDown={getEnterDown(rowIdx)}
                    onEnterUp={getEnterUp(rowIdx)}
                  />
                ))}

                {/* Row actions */}
                <td className="csv-row-actions">
                  <button className="grip-btn" onClick={() => insertSequenceRow(row.step_id)} title="Insert row below">+</button>
                  <button className="grip-btn danger" onClick={() => deleteSequenceRow(row.step_id)} title="Delete row">×</button>
                </td>
              </tr>
            ))}

            {sequenceRows.length === 0 && (
              <tr>
                <td colSpan={COLS.length + 2} style={{ textAlign:'center', padding:'24px', color:'var(--text-2)', fontSize:12 }}>
                  No steps yet — click + to add your first animation step.
                </td>
              </tr>
            )}
          </tbody>

          {/* Calculation footer */}
          {sequenceRows.length > 0 && (
            <tfoot>
              <tr className="csv-calc-row">
                <td />
                {COLS.map(col => {
                  if (col.type !== 'number' || col.key === 'step_id') return <td key={col.key} />
                  const vals = sequenceRows.map(r => r[col.key] as number).filter(v => !isNaN(v))
                  const sum = vals.reduce((a, v) => a + v, 0)
                  const avg = vals.length ? sum / vals.length : 0
                  return (
                    <td key={col.key} className="csv-calc-cell" title={`SUM: ${sum.toFixed(2)}\nAVG: ${avg.toFixed(2)}`}>
                      Σ {sum.toFixed(1)}
                    </td>
                  )
                })}
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Add row button */}
      <div className="csv-footer">
        <button className="btn btn-sm" onClick={() => insertSequenceRow()}>+ Add Step</button>
      </div>
    </div>
  )
}
