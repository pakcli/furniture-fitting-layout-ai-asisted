import React, { useState } from 'react'
import { useAppStore } from '@/store/app-store'

export function HierarchyView() {
  const { furniture, room, setFurnitureVisible, setActiveTab, setSelectedId } = useAppStore()
  const [expanded, setExpanded] = useState(true)

  function goToEditor(id: string) {
    setSelectedId(id)
    setActiveTab('editor')
  }

  return (
    <div className="hierarchy-shell">
      <div className="hierarchy-toolbar">
        <button className="btn btn-sm" onClick={() => setExpanded(v => !v)}>
          {expanded ? 'Collapse All' : 'Expand All'}
        </button>
        <span className="text-muted text-sm" style={{ marginLeft: 'auto' }}>
          {furniture.length} items
        </span>
      </div>

      <div className="hierarchy-body">
        <div className="room-node">
          <div className="room-node-header" onClick={() => setExpanded(v => !v)}>
            <span>{expanded ? '▼' : '▶'}</span>
            <span>🏠 {room.name}</span>
            <span className="text-muted text-sm" style={{ marginLeft: 'auto' }}>
              {room.walls.length > 0 ? 'custom polygon' : 'default 5×4m'}
            </span>
          </div>

          {expanded && furniture.map(f => (
            <React.Fragment key={f.id}>
              <div className="item-row">
                {/* Status icon */}
                <span className={!f.position ? 'status-none' : 'status-ok'}>
                  {!f.position ? '◌' : '✅'}
                </span>

                <div
                  style={{ width: 10, height: 10, borderRadius: 2, background: f.color, flexShrink: 0 }}
                />

                <span className="item-row-name">{f.name}</span>
                <span className="item-row-dims">
                  {f.assembled.w}×{f.assembled.d}×{f.assembled.h}
                </span>

                <span className={`badge ${f.priority === 'must' ? 'badge-must' : f.priority === 'prefer' ? 'badge-prefer' : 'badge-flex'}`}
                  style={{ fontSize: 9 }}>
                  {f.priority.toUpperCase()}
                </span>

                {/* Visibility toggle */}
                <button
                  className="btn-icon"
                  title={f.visible ? 'Hide' : 'Show'}
                  onClick={() => setFurnitureVisible(f.id, !f.visible)}
                  style={{ opacity: f.visible ? 1 : 0.3 }}
                >
                  👁
                </button>

                {/* Go to editor */}
                <button className="btn-icon" title="Go to in 3D Editor" onClick={() => goToEditor(f.id)}>
                  ↗
                </button>
              </div>

              {/* Component sub-rows */}
              {f.components.map(c => (
                <div key={c.id} className="component-row">
                  <span>└</span>
                  <span>📦 {c.name} ×{c.qty}</span>
                  {c.fragile && <span className="text-cyan">⚠️ fragile</span>}
                  <span className="font-mono" style={{ marginLeft: 'auto', fontSize: 10 }}>
                    {c.dim[0]}×{c.dim[1]}×{c.dim[2]}cm
                  </span>
                </div>
              ))}
            </React.Fragment>
          ))}

          {furniture.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-2)', fontSize: 12 }}>
              No furniture. Add items in the Catalog tab.
            </div>
          )}
        </div>

        {/* Corridor */}
        {room.corridors.length > 0 && room.corridors.map(c => (
          <div key={c.id} className="room-node">
            <div className="room-node-header">
              🚪 Corridor — {c.widthCm}cm wide, {c.turns.length} turn(s)
            </div>
          </div>
        ))}

        {/* Legend */}
        <div style={{ padding: '8px 10px', fontSize: 10, color: 'var(--text-2)', display: 'flex', gap: 12 }}>
          <span>✅ Placed</span>
          <span>⚠️ Clearance issue</span>
          <span>❌ Collision</span>
          <span>◌ Not placed</span>
        </div>
      </div>
    </div>
  )
}
