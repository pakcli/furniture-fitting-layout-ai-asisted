import React, { useState, useRef, useCallback, useEffect } from 'react'
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
    reorderSequenceRows, moveSequenceRowToExtreme, moveSequenceRowToStep,
    isCSVEditorOpen, setCSVEditorOpen,
    liveSyncEnabled, setLiveSyncEnabled,
    pendingChanges, saveSequenceAnimation,
    exportSequenceCSV, copySequencePrompt,
    playbackPlaying, setPlaybackPlaying,
    playbackStep, setPlaybackStep,
    playbackProgress, setPlaybackProgress,
    plan,
  } = useAppStore()

  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; stepId: number } | null>(null)
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null)
  const [dragOverRowIndex, setDragOverRowIndex] = useState<number | null>(null)

  const steps = plan?.steps ?? []
  const total = steps.length
  const current = steps[playbackStep]
  const overallRatio = total > 0 ? (playbackStep + playbackProgress) / total : 0

  // Close context menu on outside click or escape
  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null)
    }
    window.addEventListener('click', handleGlobalClick)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('click', handleGlobalClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

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
    if (playbackStep >= total - 1 && playbackProgress >= 0.99) {
      setPlaybackStep(0)
      setPlaybackProgress(0)
    }
    setPlaybackPlaying(!playbackPlaying)
  }
  const handleStop = () => {
    setPlaybackPlaying(false)
    setPlaybackStep(0)
    setPlaybackProgress(0)
  }

  const handleContextMenuAction = (action: 'start' | 'latest' | 'step' | 'insert' | 'delete') => {
    if (!contextMenu) return
    const { stepId } = contextMenu

    if (action === 'start') {
      moveSequenceRowToExtreme(stepId, 'start')
    } else if (action === 'latest') {
      moveSequenceRowToExtreme(stepId, 'latest')
    } else if (action === 'step') {
      const target = window.prompt(`Move Step #${stepId} to which step position? (1 - ${sequenceRows.length})`, String(stepId))
      if (target) {
        const num = parseInt(target, 10)
        if (!isNaN(num)) moveSequenceRowToStep(stepId, num)
      }
    } else if (action === 'insert') {
      insertSequenceRow(stepId)
    } else if (action === 'delete') {
      deleteSequenceRow(stepId)
    }

    setContextMenu(null)
  }

  return (
    <div className="csv-editor-panel">
      {/* Toolbar */}
      <div className="csv-toolbar">
        <div className="csv-toolbar-left">
          <button className="btn btn-sm" onClick={handlePlayToggle} disabled={!plan} title={plan ? '' : 'Run solver first'}>
            {playbackPlaying ? '⏸' : '▶'} {playbackPlaying ? 'Pause' : 'Play'}
          </button>
          <button className="btn btn-sm" onClick={handleStop}>⏹</button>
          <button className="btn btn-sm" onClick={() => { setPlaybackStep(0); setPlaybackProgress(0); setPlaybackPlaying(false) }}>⏮</button>
          <span className="csv-toolbar-sep" />
          <span className="text-muted text-xs">Steps: {sequenceRows.length}</span>
          <span className="text-muted text-xs">
            · {sequenceRows.reduce((a, r) => a + r.duration_s, 0).toFixed(1)}s
          </span>
          {playbackPlaying && (
            <span style={{ fontSize: 10, color: 'var(--yellow)', fontWeight: 600, marginLeft: 4 }}>
              🔒 Locked
            </span>
          )}
        </div>
        <div className="csv-toolbar-right">
          <button className="btn btn-sm" onClick={copySequencePrompt} title="Copy AI prompt + raw CSV (2 formats)">📋 Copy Prompt</button>
          <button className="btn btn-sm" onClick={exportSequenceCSV} title="Download CSV + copy to clipboard">⬇ Export CSV</button>
          <button className="btn btn-sm btn-icon" onClick={() => setCSVEditorOpen(false)} title="Close CSV Editor">✕</button>
        </div>
      </div>

      {/* Inline Timeline Scrubber Track */}
      {total > 0 && (
        <div style={{ padding: '4px 10px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
            Step {playbackStep + 1}/{total}: {current?.furnitureName}
          </span>
          <div
            className="timeline-track"
            onClick={handleTrackClick}
            style={{ flex: 1, height: 5, cursor: 'pointer', margin: 0 }}
          >
            <div className="timeline-fill" style={{ width: `${overallRatio * 100}%` }} />
            <div className="timeline-thumb" style={{ left: `${overallRatio * 100}%`, width: 10, height: 10 }} />
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-2)', fontFamily: 'monospace' }}>
            {(playbackProgress * 100).toFixed(0)}%
          </span>
        </div>
      )}

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
        <span className="text-muted text-xs" style={{ marginLeft: 'auto', fontSize: 10 }}>
          💡 Drag rows or Right-Click to Reorder
        </span>
      </div>

      {/* Table */}
      <div className="csv-table-wrapper">
        <table className="csv-table">
          <thead>
            <tr>
              <th style={{ width: 44 }}>Move</th>
              {COLS.map(c => (
                <th key={c.key} style={{ minWidth: c.width, width: c.width }}>{c.label}</th>
              ))}
              <th style={{ width: 68 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sequenceRows.map((row, rowIdx) => {
              const isDragOver = dragOverRowIndex === rowIdx
              return (
                <tr
                  key={row.step_id}
                  className={`${selectedCell?.row === rowIdx ? 'row-selected' : ''}${isDragOver ? ' row-drag-over' : ''}`}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setContextMenu({ x: e.clientX, y: e.clientY, stepId: row.step_id })
                  }}
                  draggable={!playbackPlaying}
                  onDragStart={(e) => {
                    if (playbackPlaying) { e.preventDefault(); return }
                    setDraggedRowIndex(rowIdx)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (draggedRowIndex !== null && draggedRowIndex !== rowIdx) {
                      setDragOverRowIndex(rowIdx)
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverRowIndex === rowIdx) setDragOverRowIndex(null)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (draggedRowIndex !== null && draggedRowIndex !== rowIdx) {
                      reorderSequenceRows(draggedRowIndex, rowIdx)
                    }
                    setDraggedRowIndex(null)
                    setDragOverRowIndex(null)
                  }}
                  onDragEnd={() => {
                    setDraggedRowIndex(null)
                    setDragOverRowIndex(null)
                  }}
                >
                  {/* Drag grip + Up/Down arrows */}
                  <td className="csv-grip" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span
                      style={{ cursor: playbackPlaying ? 'not-allowed' : 'grab', color: 'var(--text-2)', fontSize: 11, userSelect: 'none', padding: '0 2px' }}
                      title="Drag to reorder sequence row"
                    >
                      ⋮⋮
                    </span>
                    <button
                      className="grip-btn"
                      onClick={() => moveSequenceRow(row.step_id, 'up')}
                      disabled={rowIdx === 0 || playbackPlaying}
                      title="Move Up"
                    >
                      ▲
                    </button>
                    <button
                      className="grip-btn"
                      onClick={() => moveSequenceRow(row.step_id, 'down')}
                      disabled={rowIdx === sequenceRows.length - 1 || playbackPlaying}
                      title="Move Down"
                    >
                      ▼
                    </button>
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
                    <button
                      className="grip-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        const rect = e.currentTarget.getBoundingClientRect()
                        setContextMenu({ x: rect.left - 130, y: rect.bottom + 4, stepId: row.step_id })
                      }}
                      title="Step Menu (Set at Start / Latest / Move to Step)"
                    >
                      ⋮
                    </button>
                    <button
                      className="grip-btn"
                      onClick={() => insertSequenceRow(row.step_id)}
                      disabled={playbackPlaying}
                      title="Insert row below"
                    >
                      +
                    </button>
                    <button
                      className="grip-btn danger"
                      onClick={() => deleteSequenceRow(row.step_id)}
                      disabled={playbackPlaying}
                      title="Delete row"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              )
            })}

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
        <button
          className="btn btn-sm"
          onClick={() => insertSequenceRow()}
          disabled={playbackPlaying}
        >
          + Add Step
        </button>
      </div>

      {/* Right-Click / Context Menu Popup */}
      {contextMenu && (
        <div
          className="csv-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-header">Step #{contextMenu.stepId} Options</div>
          <button className="context-menu-item" onClick={() => handleContextMenuAction('start')}>
            <span>⬆</span> Set as Start (Step 1)
          </button>
          <button className="context-menu-item" onClick={() => handleContextMenuAction('latest')}>
            <span>⬇</span> Set as Latest (End)
          </button>
          <button className="context-menu-item" onClick={() => handleContextMenuAction('step')}>
            <span>🔢</span> Move to Step...
          </button>
          <div className="context-menu-divider" />
          <button className="context-menu-item" onClick={() => handleContextMenuAction('insert')}>
            <span>➕</span> Insert Step Below
          </button>
          <button className="context-menu-item danger" onClick={() => handleContextMenuAction('delete')}>
            <span>🗑</span> Delete Step
          </button>
        </div>
      )}
    </div>
  )
}
