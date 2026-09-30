import React, { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import type { Project } from '@/types'

export function ProjectSelector() {
  const {
    projects,
    activeProjectId,
    selectProject,
    createBlankProject,
    duplicateProject,
    renameProject,
    deleteProject,
    resetSampleProject,
    exportProjectJSON,
    importProjectJSON,
    clearAllCustomProjects,
    autoSaveStatus,
  } = useAppStore()

  const [isOpen, setIsOpen] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeProject = projects.find(p => p.id === activeProjectId) ?? projects[0]
  const sampleProjects = projects.filter(p => p.isSample)
  const customProjects = projects.filter(p => !p.isSample)

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setEditingProjectId(null)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setEditingProjectId(null)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleStartRename = (e: React.MouseEvent, proj: Project) => {
    e.stopPropagation()
    setEditingProjectId(proj.id)
    setEditingName(proj.name)
  }

  const handleCommitRename = (projId: string) => {
    if (editingName.trim()) {
      renameProject(projId, editingName.trim())
    }
    setEditingProjectId(null)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        importProjectJSON(content)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
    setIsOpen(false)
  }

  return (
    <div className="project-selector-wrapper" ref={dropdownRef}>
      {/* Topbar Trigger Pill */}
      <button
        className={`project-selector-btn${activeProject?.isSample ? ' is-sample' : ' is-custom'}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Switch project, create new, duplicate or export"
      >
        <span className="project-btn-icon">
          {activeProject?.isSample ? '📁' : '✨'}
        </span>
        <span className="project-btn-name">
          {activeProject ? activeProject.name : 'Select Project'}
        </span>
        <span className={`project-btn-badge ${activeProject?.isSample ? 'sample' : 'custom'}`}>
          {activeProject?.isSample ? 'Sample' : 'Custom'}
        </span>
        <span className="project-btn-status" title="Local browser storage auto-saved">
          ● {autoSaveStatus === 'saving' ? 'Saving...' : 'Saved'}
        </span>
        <span className="project-btn-caret">{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Hidden File Input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="project-dropdown-menu">
          {/* Header */}
          <div className="project-dropdown-header">
            <span>Project Workspace</span>
            <span className="text-muted text-xs">{projects.length} Total</span>
          </div>

          <div className="project-dropdown-scroll">
            {/* Section 1: Factory Samples */}
            <div className="project-section-title">
              <span>📁 Factory Templates (Pristine Samples)</span>
            </div>
            {sampleProjects.map((p) => {
              const walls = p.room.walls
              const w = walls.length > 1 ? Math.abs(walls[1].x2 - walls[0].x1) : 0
              const d = walls.length > 2 ? Math.abs(walls[2].y2 - walls[0].y1) : 0
              const totalDur = p.sequenceRows.reduce((a, r) => a + r.duration_s, 0)
              const isActive = p.id === activeProjectId

              return (
                <div
                  key={p.id}
                  className={`project-item${isActive ? ' active' : ''}`}
                  onClick={() => { selectProject(p.id); setIsOpen(false) }}
                >
                  <div className="project-item-left">
                    <span className="project-item-indicator">{isActive ? '✓' : '•'}</span>
                    <div className="project-item-info">
                      <div className="project-item-title">
                        {p.name}
                        <span className="project-mini-tag sample">Sample</span>
                      </div>
                      <div className="project-item-meta">
                        {w}×{d}cm · {p.furniture.length} items · {totalDur.toFixed(1)}s anim
                      </div>
                    </div>
                  </div>

                  <div className="project-item-actions" onClick={e => e.stopPropagation()}>
                    <button
                      className="project-action-btn"
                      onClick={() => resetSampleProject(p.id)}
                      title="Reset sample to factory original"
                    >
                      ↺
                    </button>
                    <button
                      className="project-action-btn"
                      onClick={() => duplicateProject(p.id)}
                      title="Duplicate as new custom project"
                    >
                      📋
                    </button>
                    <button
                      className="project-action-btn"
                      onClick={() => exportProjectJSON(p.id)}
                      title="Export project to JSON"
                    >
                      ⬇
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Section 2: Custom User Projects */}
            <div className="project-section-title" style={{ marginTop: 8 }}>
              <span>💾 My Saved Projects ({customProjects.length})</span>
            </div>

            {customProjects.length === 0 && (
              <div className="project-empty-notice">
                No custom projects yet. Any edits to sample scenes will auto-fork here!
              </div>
            )}

            {customProjects.map((p) => {
              const walls = p.room.walls
              const w = walls.length > 1 ? Math.abs(walls[1].x2 - walls[0].x1) : 0
              const d = walls.length > 2 ? Math.abs(walls[2].y2 - walls[0].y1) : 0
              const totalDur = p.sequenceRows.reduce((a, r) => a + r.duration_s, 0)
              const isActive = p.id === activeProjectId
              const isEditing = editingProjectId === p.id

              return (
                <div
                  key={p.id}
                  className={`project-item${isActive ? ' active' : ''}`}
                  onClick={() => {
                    if (!isEditing) {
                      selectProject(p.id)
                      setIsOpen(false)
                    }
                  }}
                >
                  <div className="project-item-left">
                    <span className="project-item-indicator">{isActive ? '✓' : '•'}</span>
                    <div className="project-item-info">
                      {isEditing ? (
                        <div className="project-inline-edit" onClick={e => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleCommitRename(p.id)
                              if (e.key === 'Escape') setEditingProjectId(null)
                            }}
                            autoFocus
                          />
                          <button className="btn btn-sm" onClick={() => handleCommitRename(p.id)}>
                            ✓
                          </button>
                        </div>
                      ) : (
                        <div className="project-item-title">
                          {p.name}
                          <span className="project-mini-tag custom">Custom</span>
                        </div>
                      )}
                      <div className="project-item-meta">
                        {w}×{d}cm · {p.furniture.length} items · {totalDur.toFixed(1)}s anim
                      </div>
                    </div>
                  </div>

                  <div className="project-item-actions" onClick={e => e.stopPropagation()}>
                    <button
                      className="project-action-btn"
                      onClick={(e) => handleStartRename(e, p)}
                      title="Rename project"
                    >
                      ✏️
                    </button>
                    <button
                      className="project-action-btn"
                      onClick={() => duplicateProject(p.id)}
                      title="Duplicate project"
                    >
                      📋
                    </button>
                    <button
                      className="project-action-btn"
                      onClick={() => exportProjectJSON(p.id)}
                      title="Export project to JSON"
                    >
                      ⬇
                    </button>
                    <button
                      className="project-action-btn danger"
                      onClick={() => {
                        if (window.confirm(`Delete project "${p.name}"?`)) {
                          deleteProject(p.id)
                        }
                      }}
                      title="Delete project"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer Actions */}
          <div className="project-dropdown-footer">
            <button
              className="project-footer-btn primary"
              onClick={() => {
                const name = window.prompt('Enter new project name:', 'New Bedroom Project')
                if (name) {
                  createBlankProject(name.trim())
                  setIsOpen(false)
                }
              }}
            >
              ➕ New Project
            </button>
            <button
              className="project-footer-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              📥 Import JSON
            </button>
            {customProjects.length > 0 && (
              <button
                className="project-footer-btn danger"
                onClick={() => {
                  if (window.confirm('Clear all custom projects and revert back to factory samples?')) {
                    clearAllCustomProjects()
                    setIsOpen(false)
                  }
                }}
              >
                Clear Custom
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
