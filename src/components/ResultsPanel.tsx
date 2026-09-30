import React from 'react'
import { useAppStore } from '@/store/app-store'
import { runPlanner } from '@/solver/planner'

export function ResultsPanel() {
  const {
    plan, furniture, room,
    setSolverRunning, setPlan, solverRunning,
    resetToPresets, playbackStep, setPlaybackStep,
  } = useAppStore()

  function handleRunSolver() {
    setSolverRunning(true)
    setTimeout(() => {
      const walls = room.walls
      let maxX = 0, maxY = 0
      for (const w of walls) {
        maxX = Math.max(maxX, w.x1, w.x2)
        maxY = Math.max(maxY, w.y1, w.y2)
      }

      const door = room.doors[0]
      const doorStart = door?.offsetAlongWall ?? 160
      const doorWidth = door?.widthCm ?? 180
      const doorCenterX = doorStart + doorWidth / 2

      const corridor = room.corridors[0]
      const hallwayLength = corridor?.lengthCm ?? 140

      const result = runPlanner({
        furniture,
        roomW: maxX || 500,
        roomH: maxY || 380,
        doorX: doorCenterX,
        doorY: 0,
        hallway: {
          xMin: doorStart,
          xMax: doorStart + doorWidth,
          yMin: -hallwayLength,
          yMax: 0,
        },
      })
      setPlan(result)
      setSolverRunning(false)
    }, 20)
  }

  const verdictLabel = !plan ? null
    : plan.verdict === 'full-fit'   ? { cls: 'verdict-full',        text: '✅ FEASIBLE (All Fit)' }
    : plan.verdict === 'compromise' ? { cls: 'verdict-compromise',   text: '⚠️ COMPROMISE' }
    : { cls: 'verdict-impossible', text: '❌ IMPOSSIBLE' }

  return (
    <div className="editor-right">
      <div className="panel-section">
        <div className="section-title">Solver Controls</div>
        <button
          className="btn btn-primary w-full"
          onClick={handleRunSolver}
          disabled={solverRunning}
          style={{ height: 38, fontWeight: 600, fontSize: 13 }}
        >
          {solverRunning ? '⏳ Computing Entry Sequence…' : '▶ Run Entry Solver'}
        </button>

        <button
          className="btn btn-sm w-full mt-2"
          onClick={resetToPresets}
          title="Reset to clean Bedroom preset layout"
        >
          ↺ Reset Bedroom Demo
        </button>
      </div>

      {plan && (
        <>
          <div className="panel-section">
            <div className="verdict-panel">
              <span className={`verdict-chip ${verdictLabel?.cls}`} style={{ fontSize: 12, padding: '6px 12px' }}>
                {verdictLabel?.text}
              </span>

              {plan.impossibleReason && (
                <div className="stall-badge" style={{ marginTop: 8 }}>{plan.impossibleReason}</div>
              )}

              {plan.entryOrder.length > 0 && (
                <>
                  <div className="section-title" style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Entry Sequence ({plan.entryOrder.length})</span>
                    <span className="text-muted text-sm">Deepest first</span>
                  </div>
                  <div className="entry-order-list">
                    {plan.entryOrder.map((id, i) => {
                      const f = furniture.find(f => f.id === id)
                      const step = plan.steps[i]
                      const isSelected = playbackStep === i
                      return (
                        <div
                          key={id}
                          className={`entry-order-item${isSelected ? ' selected' : ''}`}
                          onClick={() => setPlaybackStep(i)}
                          style={{
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(56, 189, 248, 0.15)' : undefined,
                            borderColor: isSelected ? 'var(--blue)' : undefined,
                          }}
                        >
                          <span className="entry-order-num">{i + 1}</span>
                          <span style={{ flex: 1, fontWeight: 500 }}>{f?.name ?? id}</span>
                          {step?.issue ? (
                            <span className="text-red text-sm" title={step.issue.message}>⚠️ Stall</span>
                          ) : (
                            <span className="text-green text-sm">✓ Path OK</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="panel-section" style={{ marginTop: 'auto' }}>
            <div className="flex flex-col gap-1">
              <button className="btn btn-sm w-full">🔒 Lock Entry Plan</button>
              <button className="btn btn-sm w-full">📄 Export Manifest (JSON)</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
