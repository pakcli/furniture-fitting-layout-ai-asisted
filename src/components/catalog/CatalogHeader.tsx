import React from 'react'
import { useAppStore } from '@/store/app-store'
import { getFolderBreadcrumb } from '@/data/catalog-tree'

export function CatalogHeader() {
  const {
    catalogSelectedFolder,
    setCatalogSelectedFolder,
    catalogSearch,
    setCatalogSearch,
    catalogSortBy,
    setCatalogSortBy,
    catalogViewMode,
    setCatalogViewMode,
    autoFillCSVOnDrop,
    setAutoFillCSVOnDrop,
    catalogPanelHeight,
    setCatalogPanelHeight,
  } = useAppStore()

  const breadcrumbs = getFolderBreadcrumb(catalogSelectedFolder)
  const isCollapsed = catalogPanelHeight <= 42

  const toggleCollapse = () => {
    if (isCollapsed) {
      setCatalogPanelHeight(200)
    } else {
      setCatalogPanelHeight(38)
    }
  }

  return (
    <div className="catalog-header">
      {/* Left: Breadcrumbs */}
      <div className="catalog-breadcrumb-bar">
        <span className="catalog-panel-title">Project Catalog</span>
        <span className="breadcrumb-divider">|</span>
        <div className="breadcrumbs-trail">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              {idx > 0 && <span className="crumb-separator">&gt;</span>}
              <button
                className={`crumb-btn${idx === breadcrumbs.length - 1 ? ' current' : ''}`}
                onClick={() => setCatalogSelectedFolder(crumb.id)}
                title={`Navigate to ${crumb.label}`}
              >
                <span className="crumb-icon">{crumb.icon}</span>
                <span className="crumb-text">{crumb.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Center: Search */}
      <div className="catalog-search-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="catalog-search-input"
          placeholder="Search models & assets..."
          value={catalogSearch}
          onChange={(e) => setCatalogSearch(e.target.value)}
        />
        {catalogSearch && (
          <button className="search-clear-btn" onClick={() => setCatalogSearch('')}>
            ✕
          </button>
        )}
      </div>

      {/* Right: Controls & Options */}
      <div className="catalog-controls-bar">
        {/* Auto-fill CSV Toggle */}
        <button
          className={`catalog-toggle-btn${autoFillCSVOnDrop ? ' active' : ''}`}
          onClick={() => setAutoFillCSVOnDrop(!autoFillCSVOnDrop)}
          title="When ON, dropping an item into 3D automatically adds a step row to the Sequence CSV Editor"
        >
          ⚡ Auto CSV: {autoFillCSVOnDrop ? 'ON' : 'OFF'}
        </button>

        {/* Sort */}
        <div className="catalog-sort-select-wrapper">
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sort:</span>
          <select
            className="catalog-select"
            value={catalogSortBy}
            onChange={(e) => setCatalogSortBy(e.target.value as any)}
          >
            <option value="name">Name (A-Z)</option>
            <option value="priority">Priority</option>
            <option value="size">Size (Volume)</option>
          </select>
        </div>

        {/* View Mode */}
        <div className="catalog-view-toggles">
          <button
            className={`view-toggle-btn${catalogViewMode === 'grid' ? ' active' : ''}`}
            onClick={() => setCatalogViewMode('grid')}
            title="Grid View"
          >
            ⊞
          </button>
          <button
            className={`view-toggle-btn${catalogViewMode === 'list' ? ' active' : ''}`}
            onClick={() => setCatalogViewMode('list')}
            title="List View"
          >
            ☰
          </button>
        </div>

        {/* Collapse / Expand */}
        <button
          className="catalog-action-btn"
          onClick={toggleCollapse}
          title={isCollapsed ? 'Expand Catalog Panel' : 'Collapse Catalog Panel'}
        >
          {isCollapsed ? '▲' : '▼'}
        </button>
      </div>
    </div>
  )
}
