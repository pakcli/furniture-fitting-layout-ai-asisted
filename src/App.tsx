import React, { useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { ThemeToggle } from '@/components/ThemeToggle'
import { CatalogView } from '@/components/CatalogView'
import { EditorView } from '@/components/EditorView'
import { HierarchyView } from '@/components/HierarchyView'
import { SimulationView } from '@/components/SimulationView'
import { ProjectSelector } from '@/components/ProjectSelector'
import { ToastNotification } from '@/components/ToastNotification'
import '@/index.css'

type Tab = 'catalog' | 'editor' | 'hierarchy' | 'simulation'

const TABS: { id: Tab; label: string }[] = [
  { id: 'editor',     label: '📐 3D Studio & Simulation' },
  { id: 'catalog',    label: '📦 Catalog' },
  { id: 'hierarchy',  label: '🌳 Hierarchy' },
]

function StatusBar() {
  const { room, furniture, plan } = useAppStore()
  const placed = furniture.filter(f => f.position && f.visible).length

  const verdictText = !plan ? 'Not solved'
    : plan.verdict === 'full-fit'   ? 'FEASIBLE'
    : plan.verdict === 'compromise' ? 'COMPROMISE'
    : 'IMPOSSIBLE'

  const verdictColor = !plan ? 'var(--text-2)'
    : plan.verdict === 'full-fit'   ? 'var(--green)'
    : plan.verdict === 'compromise' ? 'var(--yellow)'
    : 'var(--red)'

  return (
    <div className="status-bar">
      <span>🏠 {room.name}</span>
      <span className="sep">|</span>
      <span>{furniture.length} items ({placed} placed)</span>
      <span className="sep">|</span>
      <span className="status-verdict" style={{ color: verdictColor }}>{verdictText}</span>
    </div>
  )
}

export default function App() {
  const { theme, activeTab, setActiveTab } = useAppStore()

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="app-shell">
      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-left">
          <span style={{ fontSize: 18 }}>📦</span>
          <span className="topbar-title">Pack &amp; Place</span>
          <span className="topbar-divider">|</span>
          <ProjectSelector />
        </div>
        <div className="topbar-right">
          <ThemeToggle />
          <button className="btn-icon" title="Help">?</button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'catalog'    && <CatalogView />}
        {(activeTab === 'editor' || activeTab === 'simulation') && <EditorView />}
        {activeTab === 'hierarchy'  && <HierarchyView />}
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Floating Toast Notification (v09) */}
      <ToastNotification />
    </div>
  )
}
