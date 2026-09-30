import React from 'react'
import { useAppStore } from '@/store/app-store'
import type { Priority } from '@/types'

export function CatalogSidebar() {
  const { furniture, sidebarItemId, closeSidebar, updateFurniture, catalogMode } = useAppStore()
  const item = furniture.find(f => f.id === sidebarItemId)
  if (!item) return null

  const readOnly = catalogMode === 'view-only'
  const upd = (patch: Parameters<typeof updateFurniture>[1]) => updateFurniture(item.id, patch)

  return (
    <div className="sidebar-panel">
      <div className="sidebar-header">
        <span>{item.name}</span>
        <button className="btn-icon" onClick={closeSidebar}>✕</button>
      </div>

      <div className="sidebar-body">
        {/* 3D preview */}
        <div className="thumb-3d-wrap" style={{ perspective: 500 }}>
          <div style={{
            width: 80, height: 80,
            background: item.color,
            borderRadius: 6,
            transform: 'rotateX(-20deg) rotateY(30deg)',
            transformStyle: 'preserve-3d',
            boxShadow: `4px 4px 0 rgba(0,0,0,0.3)`,
          }} />
          <div style={{ position: 'absolute', bottom: 6, fontSize: 10, color: 'var(--text-2)' }}>
            Drop .glb to replace model
          </div>
        </div>

        {/* Name */}
        <div className="section-title">Identity</div>
        <div className="field-row">
          <label>Name</label>
          {readOnly
            ? <span>{item.name}</span>
            : <input type="text" value={item.name} onChange={e => upd({ name: e.target.value })} style={{ flex: 1 }} />}
        </div>
        <div className="field-row">
          <label>Color</label>
          <input type="color" value={item.color} disabled={readOnly} onChange={e => upd({ color: e.target.value })} />
        </div>
        <div className="field-row">
          <label>Priority</label>
          {readOnly
            ? <span>{item.priority}</span>
            : <select value={item.priority} onChange={e => upd({ priority: e.target.value as Priority })}>
                <option value="must">Must</option>
                <option value="prefer">Prefer</option>
                <option value="flex">Flex</option>
              </select>}
        </div>

        {/* Dimensions */}
        <div className="section-title">Assembled Dimensions (cm)</div>
        <div className="field-row">
          <label>W</label>
          {readOnly ? <span className="font-mono">{item.assembled.w}</span>
            : <input type="number" value={item.assembled.w} onChange={e => upd({ assembled: { ...item.assembled, w: +e.target.value } })} />}
          <label>D</label>
          {readOnly ? <span className="font-mono">{item.assembled.d}</span>
            : <input type="number" value={item.assembled.d} onChange={e => upd({ assembled: { ...item.assembled, d: +e.target.value } })} />}
          <label>H</label>
          {readOnly ? <span className="font-mono">{item.assembled.h}</span>
            : <input type="number" value={item.assembled.h} onChange={e => upd({ assembled: { ...item.assembled, h: +e.target.value } })} />}
        </div>

        {/* Clearance */}
        <div className="section-title">Clearance (cm)</div>
        <div className="field-row">
          <label>Front</label>
          {readOnly ? <span className="font-mono">{item.clearance.front ?? 0}</span>
            : <input type="number" value={item.clearance.front ?? 0} onChange={e => upd({ clearance: { ...item.clearance, front: +e.target.value } })} />}
        </div>
        <div className="field-row">
          <label>Back</label>
          {readOnly ? <span className="font-mono">{item.clearance.back ?? 0}</span>
            : <input type="number" value={item.clearance.back ?? 0} onChange={e => upd({ clearance: { ...item.clearance, back: +e.target.value } })} />}
        </div>

        {/* Options */}
        <div className="section-title">Options</div>
        <div className="field-row">
          <label>Can tilt</label>
          <input type="checkbox" checked={item.canTilt} disabled={readOnly} onChange={e => upd({ canTilt: e.target.checked })} />
        </div>

        {/* Components */}
        {item.components.length > 0 && (
          <>
            <div className="section-title">Components</div>
            {item.components.map(c => (
              <div key={c.id} style={{ background: 'var(--surface2)', borderRadius: 4, padding: '5px 8px', fontSize: 11, marginBottom: 3 }}>
                <div className="flex items-center gap-1">
                  <span style={{ flex: 1 }}>{c.name} ×{c.qty}</span>
                  {c.fragile && <span className="text-cyan">⚠️ fragile</span>}
                </div>
                <div className="text-muted font-mono" style={{ fontSize: 10 }}>
                  {c.dim[0]}×{c.dim[1]}×{c.dim[2]} cm — detach: {c.detachable}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="sidebar-footer">
        <button className="btn w-full" onClick={closeSidebar}>Done</button>
      </div>
    </div>
  )
}
