import React from 'react'
import { useAppStore } from '@/store/app-store'
import { getItemsForFolder } from '@/data/catalog-tree'
import type { FurnitureItem } from '@/types'

export function AssetGrid() {
  const {
    catalogSelectedFolder,
    catalogSearch,
    catalogSortBy,
    catalogViewMode,
    furniture,
    setDraggedCatalogItem,
    setDropGhostPos,
    placeCatalogItemAt,
    room,
  } = useAppStore()

  const items = getItemsForFolder(catalogSelectedFolder, catalogSearch, catalogSortBy)

  const handleDragStart = (e: React.DragEvent, item: FurnitureItem) => {
    // Only placeable items can be dragged
    if (item.type === 'door' || item.type === 'window' || item.type === 'wall') {
      e.preventDefault()
      return
    }

    setDraggedCatalogItem(item)
    e.dataTransfer.setData('text/plain', item.id)
    e.dataTransfer.effectAllowed = 'copy'

    // Create custom ghost drag image if supported
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

  // Double click / quick add places in center of room
  const handleQuickAdd = (item: FurnitureItem) => {
    if (item.type === 'door' || item.type === 'window' || item.type === 'wall') return
    const walls = room.walls
    const roomW = walls.length > 1 ? Math.abs(walls[1].x2 - walls[0].x1) : 400
    const roomD = walls.length > 2 ? Math.abs(walls[2].y2 - walls[0].y1) : 300
    const centerX = Math.max(20, (roomW - item.assembled.w) / 2)
    const centerY = Math.max(20, (roomD - item.assembled.d) / 2)
    placeCatalogItemAt(item, centerX, centerY)
  }

  if (items.length === 0) {
    return (
      <div className="catalog-asset-empty">
        <span style={{ fontSize: 24 }}>🔍</span>
        <span>No matching assets found in this folder</span>
      </div>
    )
  }

  return (
    <div className={`catalog-asset-container ${catalogViewMode}`}>
      {items.map((item) => {
        const isObstacle = item.type === 'door' || item.type === 'window' || item.type === 'wall'
        const placedCount = furniture.filter(f => f.name === item.name).length

        return (
          <div
            key={item.id}
            className={`catalog-item-card${isObstacle ? ' is-obstacle' : ''}`}
            draggable={!isObstacle}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onDoubleClick={() => handleQuickAdd(item)}
            title={
              isObstacle
                ? `${item.name} — Room structural obstacle (configured via Room Tab)`
                : `Drag & drop into 3D view or double-click to place. Dimensions: ${item.assembled.w}×${item.assembled.d}×${item.assembled.h}cm`
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
                {item.assembled.w}×{item.assembled.d}
              </span>
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
                  <span className={`card-badge priority-${item.priority}`}>
                    {item.priority === 'must' ? '🔴 Must' : item.priority === 'prefer' ? '🟡 Prefer' : '⚪ Flex'}
                  </span>
                )}

                {!isObstacle && (
                  <button
                    className="card-quick-add-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleQuickAdd(item)
                    }}
                    title="Quick place in room center"
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
