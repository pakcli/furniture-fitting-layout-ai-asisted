import React from 'react'
import { useAppStore } from '@/store/app-store'
import { CATALOG_TREE } from '@/data/catalog-tree'
import type { CatalogFolder } from '@/types'

interface TreeNodeProps {
  folder: CatalogFolder
  level: number
}

function TreeNode({ folder, level }: TreeNodeProps) {
  const {
    catalogSelectedFolder,
    setCatalogSelectedFolder,
    catalogExpandedFolders,
    toggleCatalogFolderExpanded,
  } = useAppStore()

  const hasChildren = folder.children && folder.children.length > 0
  const isExpanded = catalogExpandedFolders.includes(folder.id)
  const isSelected = catalogSelectedFolder === folder.id

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleCatalogFolderExpanded(folder.id)
  }

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCatalogSelectedFolder(folder.id)
    if (hasChildren && !isExpanded) {
      toggleCatalogFolderExpanded(folder.id)
    }
  }

  return (
    <div className="folder-tree-node">
      <div
        className={`folder-tree-row${isSelected ? ' active' : ''}`}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={handleSelect}
      >
        <span
          className={`tree-chevron${hasChildren ? ' clickable' : ' empty'}`}
          onClick={hasChildren ? handleToggle : undefined}
        >
          {hasChildren ? (isExpanded ? '▼' : '▶') : '•'}
        </span>
        <span className="tree-icon">{folder.icon}</span>
        <span className="tree-label">{folder.label}</span>
      </div>

      {hasChildren && isExpanded && (
        <div className="folder-tree-children">
          {folder.children!.map((child) => (
            <TreeNode key={child.id} folder={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function FolderTree() {
  const { catalogSelectedFolder, setCatalogSelectedFolder } = useAppStore()

  return (
    <div className="catalog-folder-tree">
      {/* Root Node */}
      <div
        className={`folder-tree-row${catalogSelectedFolder === 'root' ? ' active' : ''}`}
        style={{ paddingLeft: '8px' }}
        onClick={() => setCatalogSelectedFolder('root')}
      >
        <span className="tree-chevron empty">•</span>
        <span className="tree-icon">📁</span>
        <span className="tree-label" style={{ fontWeight: 600 }}>
          Assets (Root)
        </span>
      </div>

      {CATALOG_TREE.map((rootFolder) => (
        <TreeNode key={rootFolder.id} folder={rootFolder} level={1} />
      ))}
    </div>
  )
}
