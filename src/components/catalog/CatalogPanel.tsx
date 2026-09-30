import React, { useRef, useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { CatalogHeader } from './CatalogHeader'
import { FolderTree } from './FolderTree'
import { AssetGrid } from './AssetGrid'

export function CatalogPanel() {
  const {
    activeTab,
    catalogPanelVisible,
    catalogPanelHeight,
    setCatalogPanelHeight,
    catalogTreeWidth,
    setCatalogTreeWidth,
  } = useAppStore()

  const panelRef = useRef<HTMLDivElement>(null)
  const isDraggingHeight = useRef(false)
  const isDraggingTree = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(0)
  const startX = useRef(0)
  const startTreeWidth = useRef(0)

  // Height resize handle (top edge)
  const handleHeightMouseDown = (e: React.MouseEvent) => {
    isDraggingHeight.current = true
    startY.current = e.clientY
    startHeight.current = catalogPanelHeight
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingHeight.current) return
      const deltaY = startY.current - moveEvent.clientY
      const newHeight = startHeight.current + deltaY
      setCatalogPanelHeight(newHeight)
    }

    const handleMouseUp = () => {
      isDraggingHeight.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  // Column width divider resize handle
  const handleTreeDividerMouseDown = (e: React.MouseEvent) => {
    isDraggingTree.current = true
    startX.current = e.clientX
    startTreeWidth.current = catalogTreeWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingTree.current) return
      const deltaX = moveEvent.clientX - startX.current
      const containerW = panelRef.current?.clientWidth || window.innerWidth
      // Rule: minimal 300px, maximal 50% of catalog panel width
      const minW = 300
      const maxW = containerW * 0.5
      const newW = Math.max(minW, Math.min(startTreeWidth.current + deltaX, maxW))
      setCatalogTreeWidth(newW)
    }

    const handleMouseUp = () => {
      isDraggingTree.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  if (!catalogPanelVisible) return null

  const isFullScreen = activeTab === 'catalog'
  const isCollapsed = !isFullScreen && catalogPanelHeight <= 42

  return (
    <div
      ref={panelRef}
      className={`catalog-panel-root${isFullScreen ? ' is-fullscreen' : ''}${isCollapsed ? ' collapsed' : ''}`}
      style={{ height: isFullScreen ? '100%' : `${catalogPanelHeight}px` }}
    >
      {/* Top Resize Drag Handle (docked mode only) */}
      {!isFullScreen && (
        <div
          className="catalog-resize-handle-h"
          onMouseDown={handleHeightMouseDown}
          title="Drag up/down to resize Catalog Explorer panel"
        >
          <div className="resize-handle-pill" />
        </div>
      )}

      {/* Header with Breadcrumb, Search, and Options */}
      <CatalogHeader />

      {/* Body: Split View (Folder Tree | Resizer | Asset Grid) */}
      {!isCollapsed && (
        <div className="catalog-body-split">
          {/* Left: Unity-style Folder Tree */}
          <div
            className="catalog-left-tree-pane"
            style={{ width: `${catalogTreeWidth}px`, minWidth: 300 }}
          >
            <FolderTree />
          </div>

          {/* Vertical Column Divider */}
          <div
            className="catalog-col-divider"
            onMouseDown={handleTreeDividerMouseDown}
            title="Drag to resize tree panel (min 300px, max 50%)"
          />

          {/* Right: Asset Grid */}
          <div className="catalog-right-asset-pane">
            <AssetGrid />
          </div>
        </div>
      )}
    </div>
  )
}
