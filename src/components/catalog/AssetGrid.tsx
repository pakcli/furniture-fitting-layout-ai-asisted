import React, { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { getItemsForFolder } from '@/data/catalog-tree'
import { FurnitureBox3D } from '@/components/FurnitureBox3D'
import type { FurnitureItem, Priority, Dims } from '@/types'

interface RowDraft {
  name: string
  boundW: number
  boundD: number
  boundH: number
  meshW: number
  meshD: number
  meshH: number
  isMeshLinked: boolean
  elevationCm: number
  priority: Priority
}

export function AssetGrid() {
  const {
    catalogSelectedFolder,
    catalogSearch,
    catalogSortBy,
    catalogViewMode,
    furniture,
    updateFurniture,
    removeFurniture,
    duplicateFurniture,
    addFurniture,
    setDraggedCatalogItem,
    setDropGhostPos,
    placeCatalogItemAt,
    room,
    playbackPlaying,
    showToast,
  } = useAppStore()

  // Expanded sub-component parts in Table Edit view
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set())

  // Local editing drafts for table-edit rows
  const [rowDrafts, setRowDrafts] = useState<Record<string, RowDraft>>({})

  const items = getItemsForFolder(catalogSelectedFolder, catalogSearch, catalogSortBy)

  // Toggle parts sub-table
  const toggleParts = (id: string) => {
    setExpandedParts(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Get or initialize draft for an item in table-edit mode
  const getDraft = (item: FurnitureItem): RowDraft => {
    if (rowDrafts[item.id]) return rowDrafts[item.id]
    const bound = item.assembled
    const mesh = item.meshSize || item.assembled
    return {
      name: item.name,
      boundW: bound.w,
      boundD: bound.d,
      boundH: bound.h,
      meshW: mesh.w,
      meshD: mesh.d,
      meshH: mesh.h,
      isMeshLinked: true,
      elevationCm: item.elevationCm ?? 0,
      priority: item.priority,
    }
  }

  const updateDraft = (itemId: string, patch: Partial<RowDraft>, fallbackItem: FurnitureItem) => {
    const cur = getDraft(fallbackItem)
    const updated = { ...cur, ...patch }
    // If mesh is linked and bound dimension changed, update mesh too
    if (updated.isMeshLinked) {
      if ('boundW' in patch) updated.meshW = patch.boundW!
      if ('boundD' in patch) updated.meshD = patch.boundD!
      if ('boundH' in patch) updated.meshH = patch.boundH!
    }
    setRowDrafts(prev => ({ ...prev, [itemId]: updated }))
  }

  // Save changes from Table Edit row
  const handleSaveRow = (item: FurnitureItem) => {
    const draft = getDraft(item)
    const newAssembled: Dims = { w: Number(draft.boundW) || 50, d: Number(draft.boundD) || 50, h: Number(draft.boundH) || 50 }
    const newMesh: Dims = { w: Number(draft.meshW) || newAssembled.w, d: Number(draft.meshD) || newAssembled.d, h: Number(draft.meshH) || newAssembled.h }
    const newElevation = Math.max(0, Number(draft.elevationCm) || 0)

    const patch: Partial<FurnitureItem> = {
      name: draft.name,
      assembled: newAssembled,
      meshSize: newMesh,
      elevationCm: newElevation,
      priority: draft.priority,
    }

    const inProject = furniture.some(f => f.id === item.id)
    if (inProject) {
      updateFurniture(item.id, patch)
      showToast(`💾 Saved updates for "${draft.name}"`)
    } else {
      // Place / add customized template into project
      const walls = room.walls
      const roomW = walls.length > 1 ? Math.abs(walls[1].x2 - walls[0].x1) : 400
      const roomD = walls.length > 2 ? Math.abs(walls[2].y2 - walls[0].y1) : 300
      const newItem: FurnitureItem = {
        ...item,
        ...patch,
        id: `item-${Date.now()}`,
        position: { x: Math.max(20, (roomW - newAssembled.w) / 2), y: Math.max(20, (roomD - newAssembled.d) / 2) },
      }
      addFurniture(newItem)
      showToast(`💾 Added & saved "${draft.name}" to project`)
    }
  }

  // Cancel / reset Table Edit row
  const handleCancelRow = (itemId: string) => {
    setRowDrafts(prev => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })
    showToast('✖ Changes reverted')
  }

  // Duplicate item
  const handleDuplicate = (item: FurnitureItem) => {
    const inProject = furniture.find(f => f.id === item.id)
    if (inProject) {
      duplicateFurniture(item.id)
    } else {
      // Clone catalog template directly into project furniture
      const walls = room.walls
      const roomW = walls.length > 1 ? Math.abs(walls[1].x2 - walls[0].x1) : 400
      const roomD = walls.length > 2 ? Math.abs(walls[2].y2 - walls[0].y1) : 300
      const draft = getDraft(item)
      const newItem: FurnitureItem = {
        ...item,
        id: `item-${Date.now()}`,
        name: `${draft.name} (Copy)`,
        assembled: { w: draft.boundW, d: draft.boundD, h: draft.boundH },
        meshSize: { w: draft.meshW, d: draft.meshD, h: draft.meshH },
        elevationCm: draft.elevationCm,
        priority: draft.priority,
        position: { x: Math.max(20, (roomW - draft.boundW) / 2 + 15), y: Math.max(20, (roomD - draft.boundD) / 2 + 15) },
      }
      addFurniture(newItem)
      showToast(`📋 Duplicated "${item.name}" into scene`)
    }
  }

  // Delete item
  const handleDelete = (item: FurnitureItem) => {
    const inProject = furniture.some(f => f.id === item.id)
    if (inProject) {
      removeFurniture(item.id)
      showToast(`🗑 Removed "${item.name}" from scene`)
    } else {
      showToast(`ℹ Template items cannot be permanently deleted`)
    }
  }

  // Drag handlers for Card view
  const handleDragStart = (e: React.DragEvent, item: FurnitureItem) => {
    if (playbackPlaying || item.type === 'door' || item.type === 'window' || item.type === 'wall') {
      e.preventDefault()
      return
    }

    setDraggedCatalogItem(item)
    e.dataTransfer.setData('text/plain', item.id)
    e.dataTransfer.effectAllowed = 'copy'

    const ghost = document.createElement('div')
    ghost.style.padding = '6px 12px'
    ghost.style.background = '#0284c7'
    ghost.style.color = '#ffffff'
    ghost.style.borderRadius = '6px'
    ghost.style.fontWeight = 'bold'
    ghost.style.fontSize = '12px'
    ghost.style.position = 'absolute'
    ghost.style.top = '-1000px'
    ghost.innerText = `${item.icon || '📦'} ${item.name}`
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    setTimeout(() => document.body.removeChild(ghost), 0)
  }

  const handleDragEnd = () => {
    setDraggedCatalogItem(null)
    setDropGhostPos(null)
  }

  // Double click / quick add
  const handleQuickAdd = (item: FurnitureItem) => {
    if (playbackPlaying) return
    if (item.type === 'door' || item.type === 'window' || item.type === 'wall') return
    const walls = room.walls
    const roomW = walls.length > 1 ? Math.abs(walls[1].x2 - walls[0].x1) : 400
    const roomD = walls.length > 2 ? Math.abs(walls[2].y2 - walls[0].y1) : 300
    const draft = getDraft(item)
    const targetW = draft.boundW
    const targetD = draft.boundD
    const centerX = Math.max(20, (roomW - targetW) / 2)
    const centerY = Math.max(20, (roomD - targetD) / 2)
    placeCatalogItemAt({
      ...item,
      assembled: { w: draft.boundW, d: draft.boundD, h: draft.boundH },
      meshSize: { w: draft.meshW, d: draft.meshD, h: draft.meshH },
      elevationCm: draft.elevationCm,
      priority: draft.priority,
    }, centerX, centerY)
    showToast(`✓ Added "${item.name}" to 3D Scene`)
  }

  if (items.length === 0) {
    return (
      <div className="catalog-asset-empty">
        <span style={{ fontSize: 24 }}>🔍</span>
        <span>No matching assets found in this folder</span>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW MODE 2: TABLE-EDIT (Table-Alike ListView-Edit Mode)
  // ══════════════════════════════════════════════════════════════════════════════
  if (catalogViewMode === 'table-edit') {
    return (
      <div className="catalog-table-edit-wrapper">
        <table className="catalog-table-edit">
          <thead>
            <tr>
              <th style={{ minWidth: 180 }}>Item Name</th>
              <th style={{ minWidth: 200 }}>Size Bound (W×D×H cm)</th>
              <th style={{ minWidth: 240 }}>
                Size Mesh (W×D×H cm)
                <span className="th-subnote">Default = Bound</span>
              </th>
              <th style={{ minWidth: 90 }}>Elev (Z)</th>
              <th style={{ minWidth: 100 }}>Priority</th>
              <th style={{ minWidth: 110 }}>Parts Tree</th>
              <th style={{ minWidth: 180, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const draft = getDraft(item)
              const isObstacle = item.type === 'door' || item.type === 'window' || item.type === 'wall'
              const partsOpen = expandedParts.has(item.id)
              const components = item.components || []

              return (
                <React.Fragment key={item.id}>
                  <tr className={`table-edit-row${isObstacle ? ' is-obstacle' : ''}`}>
                    {/* Column 1: Name */}
                    <td>
                      <div className="table-col-name">
                        <span className="table-item-icon">{item.icon || '📦'}</span>
                        <input
                          type="text"
                          className="table-input name-input"
                          value={draft.name}
                          onChange={(e) => updateDraft(item.id, { name: e.target.value }, item)}
                          disabled={isObstacle}
                        />
                      </div>
                    </td>

                    {/* Column 2: Size Bound (X, Y, Z) */}
                    <td>
                      <div className="table-dim-inputs">
                        <span className="dim-lbl">X:</span>
                        <input
                          type="number"
                          className="table-input dim-input"
                          value={draft.boundW}
                          onChange={(e) => updateDraft(item.id, { boundW: +e.target.value }, item)}
                          disabled={isObstacle}
                          title="Width (cm)"
                        />
                        <span className="dim-lbl">Y:</span>
                        <input
                          type="number"
                          className="table-input dim-input"
                          value={draft.boundD}
                          onChange={(e) => updateDraft(item.id, { boundD: +e.target.value }, item)}
                          disabled={isObstacle}
                          title="Depth (cm)"
                        />
                        <span className="dim-lbl">Z:</span>
                        <input
                          type="number"
                          className="table-input dim-input"
                          value={draft.boundH}
                          onChange={(e) => updateDraft(item.id, { boundH: +e.target.value }, item)}
                          disabled={isObstacle}
                          title="Height (cm)"
                        />
                      </div>
                    </td>

                    {/* Column 3: Size Mesh (X, Y, Z) + Sync Lock */}
                    <td>
                      <div className="table-dim-inputs">
                        <button
                          type="button"
                          className={`mesh-link-btn${draft.isMeshLinked ? ' linked' : ' unlinked'}`}
                          onClick={() => updateDraft(item.id, { isMeshLinked: !draft.isMeshLinked }, item)}
                          title={draft.isMeshLinked ? 'Mesh size locked to Bound (Click to unlock)' : 'Mesh size independent (Click to lock to Bound)'}
                        >
                          {draft.isMeshLinked ? '🔗' : '🔓'}
                        </button>
                        <span className="dim-lbl">X:</span>
                        <input
                          type="number"
                          className="table-input dim-input"
                          value={draft.meshW}
                          onChange={(e) => updateDraft(item.id, { meshW: +e.target.value }, item)}
                          disabled={isObstacle || draft.isMeshLinked}
                          title="Mesh Width (cm)"
                        />
                        <span className="dim-lbl">Y:</span>
                        <input
                          type="number"
                          className="table-input dim-input"
                          value={draft.meshD}
                          onChange={(e) => updateDraft(item.id, { meshD: +e.target.value }, item)}
                          disabled={isObstacle || draft.isMeshLinked}
                          title="Mesh Depth (cm)"
                        />
                        <span className="dim-lbl">Z:</span>
                        <input
                          type="number"
                          className="table-input dim-input"
                          value={draft.meshH}
                          onChange={(e) => updateDraft(item.id, { meshH: +e.target.value }, item)}
                          disabled={isObstacle || draft.isMeshLinked}
                          title="Mesh Height (cm)"
                        />
                      </div>
                    </td>

                    {/* Column 4: Elevation (cm) */}
                    <td>
                      <div className="table-elev-wrapper">
                        <input
                          type="number"
                          className="table-input elev-input"
                          value={draft.elevationCm}
                          min={0}
                          max={300}
                          onChange={(e) => updateDraft(item.id, { elevationCm: Math.max(0, +e.target.value) }, item)}
                          disabled={isObstacle}
                          title="Elevation above floor in cm (e.g. wall shelf, wall clock)"
                        />
                        <span className="elev-unit">cm</span>
                      </div>
                    </td>

                    {/* Column 5: Priority */}
                    <td>
                      {isObstacle ? (
                        <span className="badge-obstacle">Ref Only</span>
                      ) : (
                        <select
                          className={`table-select priority-${draft.priority}`}
                          value={draft.priority}
                          onChange={(e) => updateDraft(item.id, { priority: e.target.value as Priority }, item)}
                        >
                          <option value="must">🔴 Must</option>
                          <option value="prefer">🟡 Prefer</option>
                          <option value="flex">⚪ Flex</option>
                        </select>
                      )}
                    </td>

                    {/* Column 6: Hierarchy / Parts Tree Breakdown */}
                    <td>
                      <button
                        className={`parts-toggle-btn${partsOpen ? ' open' : ''}`}
                        onClick={() => toggleParts(item.id)}
                        title="View sub-component parts breakdown hierarchy"
                      >
                        {partsOpen ? '▲' : '▼'} Parts ({components.length})
                      </button>
                    </td>

                    {/* Column 7: Actions */}
                    <td>
                      <div className="table-actions-col">
                        <button
                          className="btn-action btn-duplicate"
                          onClick={() => handleDuplicate(item)}
                          title="Duplicate item"
                        >
                          📋
                        </button>
                        <button
                          className="btn-action btn-save"
                          onClick={() => handleSaveRow(item)}
                          title="Save row edits"
                        >
                          💾 Save
                        </button>
                        <button
                          className="btn-action btn-cancel"
                          onClick={() => handleCancelRow(item.id)}
                          title="Cancel / Reset edits"
                        >
                          ✖
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(item)}
                          title="Delete item"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Parts Hierarchy Sub-Table */}
                  {partsOpen && (
                    <tr className="parts-subrow">
                      <td colSpan={7}>
                        <div className="parts-hierarchy-panel">
                          <div className="parts-hierarchy-header">
                            <span className="parts-title">🌳 Component Breakdown &amp; Hierarchy ({item.name})</span>
                            <span className="parts-count">{components.length} Sub-parts defined</span>
                          </div>
                          {components.length === 0 ? (
                            <div className="parts-empty">
                              <span>📦 Single monolithic object — no disassembled sub-components.</span>
                            </div>
                          ) : (
                            <div className="parts-table-wrapper">
                              <table className="parts-mini-table">
                                <thead>
                                  <tr>
                                    <th>Part Name</th>
                                    <th>Dimensions (W×D×H cm)</th>
                                    <th>Weight (kg)</th>
                                    <th>Detachable</th>
                                    <th>Fragility</th>
                                    <th>Risk</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {components.map((c) => (
                                    <tr key={c.id}>
                                      <td style={{ fontWeight: 600 }}>{c.name} (×{c.qty})</td>
                                      <td className="font-mono">{c.dim[0]} × {c.dim[1]} × {c.dim[2]} cm</td>
                                      <td className="font-mono">{c.weightKg} kg</td>
                                      <td>
                                        <span className={`badge-detach detach-${c.detachable}`}>
                                          {c.detachable === 'yes' ? '✓ Easy' : c.detachable === 'needs-tool' ? '🔧 Needs Tool' : '🔒 Fixed'}
                                        </span>
                                      </td>
                                      <td>
                                        {c.fragile ? <span className="badge-fragile">⚠️ Fragile</span> : <span style={{ opacity: 0.5 }}>Standard</span>}
                                      </td>
                                      <td>
                                        <span className={`badge-risk risk-${c.reassemblyRisk}`}>
                                          {c.reassemblyRisk}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW MODE 3: THUMBNAIL + DETAIL VIEW
  // ══════════════════════════════════════════════════════════════════════════════
  if (catalogViewMode === 'thumbnail-detail') {
    return (
      <div className="catalog-asset-container thumbnail-detail">
        {items.map((item) => {
          const draft = getDraft(item)
          const isObstacle = item.type === 'door' || item.type === 'window' || item.type === 'wall'
          const placedCount = furniture.filter(f => f.name === item.name).length
          const components = item.components || []

          return (
            <div key={item.id} className="thumb-detail-card">
              {/* Left: 3D Preview Box */}
              <div className="thumb-detail-box">
                <FurnitureBox3D
                  color={item.color || '#38bdf8'}
                  w={draft.boundW}
                  d={draft.boundD}
                  h={draft.boundH}
                  name={item.name}
                  size={95}
                />
                <span className="thumb-dim-badge">
                  {draft.boundW}×{draft.boundD}×{draft.boundH} cm
                </span>
                {draft.elevationCm > 0 && (
                  <span className="thumb-elev-badge">
                    Elev: {draft.elevationCm}cm
                  </span>
                )}
              </div>

              {/* Center: Detailed Info & Specs */}
              <div className="thumb-detail-info">
                <div className="thumb-detail-title-row">
                  <span className="thumb-detail-icon">{item.icon || '📦'}</span>
                  <span className="thumb-detail-name">{item.name}</span>
                  {placedCount > 0 && (
                    <span className="card-placed-badge">✓ {placedCount} in room</span>
                  )}
                  {isObstacle ? (
                    <span className="card-badge obstacle">Ref Only</span>
                  ) : (
                    <span className={`card-badge priority-${draft.priority}`}>
                      {draft.priority === 'must' ? '🔴 Must' : draft.priority === 'prefer' ? '🟡 Prefer' : '⚪ Flex'}
                    </span>
                  )}
                </div>

                {/* Specs Grid */}
                <div className="thumb-detail-specs-grid">
                  <div className="spec-item">
                    <span className="spec-label">Bound Size:</span>
                    <span className="spec-val font-mono">{draft.boundW} × {draft.boundD} × {draft.boundH} cm</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Mesh Size:</span>
                    <span className="spec-val font-mono">{draft.meshW} × {draft.meshD} × {draft.meshH} cm</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Elevation (Z):</span>
                    <span className="spec-val font-mono">{draft.elevationCm > 0 ? `${draft.elevationCm} cm above floor` : 'Floor-mounted (0 cm)'}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Clearance:</span>
                    <span className="spec-val font-mono">{item.clearance.front ? `Front: ${item.clearance.front}cm` : 'None'}</span>
                  </div>
                </div>

                {/* Hierarchy / Sub-parts breakdown chips */}
                <div className="thumb-detail-parts-section">
                  <span className="parts-chips-title">Component Parts:</span>
                  {components.length === 0 ? (
                    <span className="parts-chip monolithic">Single monolithic piece</span>
                  ) : (
                    <div className="parts-chips-container">
                      {components.map(c => (
                        <span key={c.id} className="parts-chip" title={`${c.name}: ${c.dim.join('×')}cm, ${c.weightKg}kg`}>
                          🧩 {c.name} ({c.dim[0]}×{c.dim[1]}×{c.dim[2]}cm)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Quick Action Buttons */}
              <div className="thumb-detail-actions">
                {!isObstacle && (
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={playbackPlaying}
                    onClick={() => handleQuickAdd(item)}
                    title="Add into room center"
                  >
                    + Place in Room
                  </button>
                )}
                <button
                  className="btn btn-sm"
                  onClick={() => handleDuplicate(item)}
                  title="Duplicate item"
                >
                  📋 Duplicate
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(item)}
                  title="Delete item"
                >
                  🗑
                </button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW MODE 1: VISUAL CARDS (Default)
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="catalog-asset-container card">
      {items.map((item) => {
        const isObstacle = item.type === 'door' || item.type === 'window' || item.type === 'wall'
        const placedCount = furniture.filter(f => f.name === item.name).length
        const draft = getDraft(item)

        return (
          <div
            key={item.id}
            className={`catalog-item-card${isObstacle ? ' is-obstacle' : ''}${playbackPlaying ? ' is-locked' : ''}`}
            draggable={!isObstacle && !playbackPlaying}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onDoubleClick={() => handleQuickAdd(item)}
            title={
              playbackPlaying
                ? 'Simulation is actively playing — pausing required to place assets'
                : isObstacle
                ? `${item.name} — Room structural obstacle (configured via Room Tab)`
                : `Drag & drop into 3D view or double-click to place. Dimensions: ${draft.boundW}×${draft.boundD}×${draft.boundH}cm`
            }
          >
            {/* Placed badge */}
            {placedCount > 0 && (
              <span className="card-placed-badge" title={`Placed in scene: ${placedCount} instance(s)`}>
                ✓ {placedCount}
              </span>
            )}

            {/* Thumbnail */}
            <div className="card-thumbnail" style={{ borderColor: item.color || '#38bdf8' }}>
              <span className="card-emoji">{item.icon || '📦'}</span>
              <span className="card-dim-tag">
                {draft.boundW}×{draft.boundD}
              </span>
              {draft.elevationCm > 0 && (
                <span className="card-elev-tag" title={`Elevated ${draft.elevationCm}cm`}>
                  ↑{draft.elevationCm}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="card-info">
              <div className="card-name" title={item.name}>
                {item.name}
              </div>

              <div className="card-footer-row">
                {isObstacle ? (
                  <span className="card-badge obstacle">Ref Only</span>
                ) : (
                  <span className={`card-badge priority-${draft.priority}`}>
                    {draft.priority === 'must' ? '🔴 Must' : draft.priority === 'prefer' ? '🟡 Prefer' : '⚪ Flex'}
                  </span>
                )}

                {!isObstacle && (
                  <button
                    className="card-quick-add-btn"
                    disabled={playbackPlaying}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleQuickAdd(item)
                    }}
                    title={playbackPlaying ? 'Locked during playback' : 'Quick place in room center'}
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
