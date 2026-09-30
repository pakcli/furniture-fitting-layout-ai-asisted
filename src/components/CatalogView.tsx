import React, { useState } from 'react'
import { useAppStore, nextColor } from '@/store/app-store'
import type { FurnitureItem, Priority, CatalogMode, CatalogLayout } from '@/types'
import { CatalogSidebar } from './CatalogSidebar'
import { FurnitureBox3D } from './FurnitureBox3D'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PRIORITY_LABELS: Record<Priority, string> = { must: 'MUST', prefer: 'PREFER', flex: 'FLEX' }
const PRIORITY_CLASS: Record<Priority, string> = { must: 'badge-must', prefer: 'badge-prefer', flex: 'badge-flex' }

function newItem(): FurnitureItem {
  return {
    id: `item-${Date.now()}`,
    name: 'New Item',
    assembled: { w: 100, d: 60, h: 80 },
    clearance: { front: 60 },
    canTilt: false,
    priority: 'prefer',
    color: nextColor(),
    components: [],
    visible: true,
  }
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function FurnitureCard({ item }: { item: FurnitureItem }) {
  const { openSidebar, sidebarItemId } = useAppStore()
  const selected = sidebarItemId === item.id

  return (
    <div
      className={`furniture-card${selected ? ' selected' : ''}`}
      onClick={() => openSidebar(item.id)}
    >
      <div className="card-thumb" style={{ padding: 10 }}>
        <FurnitureBox3D
          color={item.color}
          w={item.assembled.w}
          d={item.assembled.d}
          h={item.assembled.h}
          name={item.name}
          size={110}
        />
      </div>
      <div className="card-info">
        <div className="card-name" title={item.name}>{item.name}</div>
        <div className="card-dims">
          {item.assembled.w}×{item.assembled.d}×{item.assembled.h}cm
        </div>
        <div className="card-footer">
          <span className={`badge ${PRIORITY_CLASS[item.priority]}`}>
            {PRIORITY_LABELS[item.priority]}
          </span>
          {!item.visible && <span style={{ opacity: 0.4, fontSize: 11 }}>hidden</span>}
        </div>
      </div>
    </div>
  )
}

// ─── Detail row ───────────────────────────────────────────────────────────────

function DetailRow({ item }: { item: FurnitureItem }) {
  const [open, setOpen] = useState(false)
  const { updateFurniture, removeFurniture, openSidebar, catalogMode } = useAppStore()
  const readOnly = catalogMode === 'view-only'

  return (
    <div className="detail-row">
      <div className="detail-row-header" onClick={() => setOpen(v => !v)}>
        <span className="detail-expand">{open ? '▼' : '▶'}</span>
        <span className="detail-name">{item.name}</span>
        <span className={`badge ${PRIORITY_CLASS[item.priority]}`}>{PRIORITY_LABELS[item.priority]}</span>
        <button className="btn btn-sm" onClick={e => { e.stopPropagation(); openSidebar(item.id) }}>Edit</button>
      </div>
      {open && (
        <div className="detail-body">
          <div className="field-row">
            <label>Name</label>
            {readOnly
              ? <span>{item.name}</span>
              : <input type="text" value={item.name} onChange={e => updateFurniture(item.id, { name: e.target.value })} />
            }
          </div>
          <div className="field-row">
            <label>W cm</label>
            {readOnly ? <span className="font-mono">{item.assembled.w}</span>
              : <input type="number" value={item.assembled.w} onChange={e => updateFurniture(item.id, { assembled: { ...item.assembled, w: +e.target.value } })} />}
            <label>D cm</label>
            {readOnly ? <span className="font-mono">{item.assembled.d}</span>
              : <input type="number" value={item.assembled.d} onChange={e => updateFurniture(item.id, { assembled: { ...item.assembled, d: +e.target.value } })} />}
            <label>H cm</label>
            {readOnly ? <span className="font-mono">{item.assembled.h}</span>
              : <input type="number" value={item.assembled.h} onChange={e => updateFurniture(item.id, { assembled: { ...item.assembled, h: +e.target.value } })} />}
          </div>
          <div className="field-row">
            <label>Priority</label>
            {readOnly
              ? <span>{PRIORITY_LABELS[item.priority]}</span>
              : <select value={item.priority} onChange={e => updateFurniture(item.id, { priority: e.target.value as Priority })}>
                  <option value="must">Must</option>
                  <option value="prefer">Prefer</option>
                  <option value="flex">Flex</option>
                </select>
            }
          </div>
          {!readOnly && (
            <button className="btn btn-danger btn-sm" style={{ marginTop: 6 }} onClick={() => removeFurniture(item.id)}>
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Mode bar ─────────────────────────────────────────────────────────────────

const MODES: { value: CatalogMode; label: string }[] = [
  { value: 'view-only',     label: '👁 View Only' },
  { value: 'live-editor',   label: '⚡ Live Editor' },
  { value: 'editor-apply',  label: '✏️ Editor + Apply' },
]
const LAYOUTS: { value: CatalogLayout; label: string }[] = [
  { value: 'card',   label: '⊞ Cards' },
  { value: 'detail', label: '☰ Detail' },
]

// ─── Main CatalogView ─────────────────────────────────────────────────────────

export function CatalogView() {
  const {
    furniture, addFurniture,
    catalogMode, setCatalogMode,
    catalogLayout, setCatalogLayout,
    sidebarOpen, closeSidebar,
  } = useAppStore()

  return (
    <div className="catalog-shell">
      {/* Mode bar */}
      <div className="catalog-modebar">
        {MODES.map(m => (
          <button key={m.value} className={`mode-btn${catalogMode === m.value ? ' active' : ''}`} onClick={() => setCatalogMode(m.value)}>
            {m.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {LAYOUTS.map(l => (
          <button key={l.value} className={`mode-btn${catalogLayout === l.value ? ' active' : ''}`} onClick={() => setCatalogLayout(l.value)}>
            {l.label}
          </button>
        ))}
        {catalogMode !== 'view-only' && (
          <button className="btn btn-primary btn-sm" onClick={() => addFurniture(newItem())}>
            + Add Item
          </button>
        )}
      </div>

      {/* Body */}
      <div className="catalog-body">
        <div className="catalog-list">
          {furniture.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-2)' }}>
              No furniture yet. Click <strong>+ Add Item</strong> to start.
            </div>
          )}
          {catalogLayout === 'card' ? (
            <div className="card-grid">
              {furniture.map(f => <FurnitureCard key={f.id} item={f} />)}
            </div>
          ) : (
            <div className="detail-list">
              {furniture.map(f => <DetailRow key={f.id} item={f} />)}
            </div>
          )}
        </div>

        {/* Slide-over sidebar */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={closeSidebar}>
            <div onClick={e => e.stopPropagation()}>
              <CatalogSidebar />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
