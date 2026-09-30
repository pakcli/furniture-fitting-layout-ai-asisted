import React, { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store/app-store'

export function SimulationView() {
  const {
    plan, furniture, room,
    playbackStep, setPlaybackStep,
    playbackPlaying, setPlaybackPlaying,
  } = useAppStore()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [subProgress, setSubProgress] = useState(1.0) // 0 to 1 along current path

  const steps = plan?.steps ?? []
  const total = steps.length
  const current = steps[playbackStep]

  // Playback timer
  useEffect(() => {
    let animId: number
    let lastTime = performance.now()

    if (playbackPlaying && total > 0) {
      const loop = (now: number) => {
        const dt = (now - lastTime) / 1000
        lastTime = now

        setSubProgress(prev => {
          const next = prev + dt * 0.8
          if (next >= 1.0) {
            if (playbackStep < total - 1) {
              setPlaybackStep(playbackStep + 1)
              return 0
            } else {
              setPlaybackPlaying(false)
              return 1.0
            }
          }
          return next
        })
        animId = requestAnimationFrame(loop)
      }
      animId = requestAnimationFrame(loop)
    } else {
      setSubProgress(1.0)
    }

    return () => {
      if (animId) cancelAnimationFrame(animId)
    }
  }, [playbackPlaying, playbackStep, total])

  // Draw 2D architectural simulation on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height

    // Clear background
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, w, h)

    if (!plan || steps.length === 0) return

    // Transform room coordinates (500x380cm + hallway y:-140..0) to fit canvas
    const margin = 40
    const roomW = 500
    const roomH = 380
    const hallwayL = 140
    const totalH = roomH + hallwayL // 520cm

    const scaleX = (w - margin * 2) / roomW
    const scaleY = (h - margin * 2) / totalH
    const scale = Math.min(scaleX, scaleY)

    // Center offset
    const offsetX = (w - roomW * scale) / 2
    const offsetY = margin + roomH * scale // room origin y=0 sits here

    // Coordinate conversion: cm -> canvas pixels
    // Room y goes upward in world, but down in canvas
    const toPx = (rx: number, ry: number) => ({
      x: offsetX + rx * scale,
      y: offsetY - ry * scale,
    })

    // 1. Draw Master Bedroom Floor
    const rBL = toPx(0, 0)
    const rTR = toPx(roomW, roomH)
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(rBL.x, rTR.y, roomW * scale, roomH * scale)

    // 2. Draw Hallway Floor (x: 160..340, y: -140..0)
    const hwBL = toPx(160, -hallwayL)
    ctx.fillStyle = '#182234'
    ctx.fillRect(hwBL.x, rBL.y, 180 * scale, hallwayL * scale)

    // Grid pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    for (let gx = 0; gx <= roomW; gx += 50) {
      const p1 = toPx(gx, 0)
      const p2 = toPx(gx, roomH)
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke()
    }
    for (let gy = 0; gy <= roomH; gy += 50) {
      const p1 = toPx(0, gy)
      const p2 = toPx(roomW, gy)
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke()
    }

    // 3. Walls
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'

    // Bedroom North wall
    ctx.beginPath(); ctx.moveTo(toPx(0, roomH).x, toPx(0, roomH).y); ctx.lineTo(toPx(roomW, roomH).x, toPx(roomW, roomH).y); ctx.stroke()
    // West wall
    ctx.beginPath(); ctx.moveTo(toPx(0, 0).x, toPx(0, 0).y); ctx.lineTo(toPx(0, roomH).x, toPx(0, roomH).y); ctx.stroke()
    // East wall
    ctx.beginPath(); ctx.moveTo(toPx(roomW, 0).x, toPx(roomW, 0).y); ctx.lineTo(toPx(roomW, roomH).x, toPx(roomW, roomH).y); ctx.stroke()
    // South wall left (0 to 160)
    ctx.beginPath(); ctx.moveTo(toPx(0, 0).x, toPx(0, 0).y); ctx.lineTo(toPx(160, 0).x, toPx(160, 0).y); ctx.stroke()
    // South wall right (340 to 500)
    ctx.beginPath(); ctx.moveTo(toPx(340, 0).x, toPx(340, 0).y); ctx.lineTo(toPx(roomW, 0).x, toPx(roomW, 0).y); ctx.stroke()

    // Hallway walls
    ctx.strokeStyle = '#475569'
    ctx.beginPath(); ctx.moveTo(toPx(160, 0).x, toPx(160, 0).y); ctx.lineTo(toPx(160, -hallwayL).x, toPx(160, -hallwayL).y); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(toPx(340, 0).x, toPx(340, 0).y); ctx.lineTo(toPx(340, -hallwayL).x, toPx(340, -hallwayL).y); ctx.stroke()

    // Labels
    ctx.fillStyle = '#94a3b8'
    ctx.font = '12px system-ui, sans-serif'
    ctx.fillText('MASTER BEDROOM (500 × 380 cm)', rBL.x + 12, rTR.y + 24)
    ctx.fillStyle = '#64748b'
    ctx.fillText('ENTRY HALLWAY (180 cm)', hwBL.x + 16, hwBL.y - 16)
    ctx.fillText('Door (180cm)', toPx(215, 6).x, toPx(215, 6).y)

    // 4. Draw Furniture
    // Items already in final spots (steps 0 .. playbackStep - 1)
    for (let i = 0; i < playbackStep; i++) {
      const s = steps[i]
      const f = furniture.find(item => item.id === s.furnitureId)
      if (!f || !f.position) continue

      const pos = toPx(f.position.x, f.position.y + f.assembled.d)
      ctx.fillStyle = f.color || '#3b82f6'
      ctx.globalAlpha = 0.85
      ctx.fillRect(pos.x, pos.y, f.assembled.w * scale, f.assembled.d * scale)
      ctx.globalAlpha = 1.0

      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.strokeRect(pos.x, pos.y, f.assembled.w * scale, f.assembled.d * scale)

      ctx.fillStyle = '#ffffff'
      ctx.font = '11px system-ui, sans-serif'
      ctx.fillText(f.name, pos.x + 6, pos.y + 16)
    }

    // Current item in motion (step = playbackStep)
    if (current) {
      const f = furniture.find(item => item.id === current.furnitureId)
      const pathNodes = current.pathNodes ?? []

      if (f && pathNodes.length > 0) {
        // Draw A* path trail
        ctx.strokeStyle = '#38bdf8'
        ctx.lineWidth = 3
        ctx.setLineDash([6, 4])
        ctx.beginPath()
        pathNodes.forEach((node, idx) => {
          const p = toPx(node.x + f.assembled.w / 2, node.y + f.assembled.d / 2)
          if (idx === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        })
        ctx.stroke()
        ctx.setLineDash([])

        // Determine interpolated position along path
        const floatIdx = subProgress * (pathNodes.length - 1)
        const baseIdx = Math.min(Math.floor(floatIdx), pathNodes.length - 1)
        const nextIdx = Math.min(baseIdx + 1, pathNodes.length - 1)
        const alpha = floatIdx - baseIdx

        const currNode = pathNodes[baseIdx]
        const nextNode = pathNodes[nextIdx]

        const interpX = currNode.x + (nextNode.x - currNode.x) * alpha
        const interpY = currNode.y + (nextNode.y - currNode.y) * alpha

        const pos = toPx(interpX, interpY + f.assembled.d)

        // Draw animated active box with glowing pulse
        ctx.shadowColor = '#38bdf8'
        ctx.shadowBlur = 12
        ctx.fillStyle = f.color || '#38bdf8'
        ctx.fillRect(pos.x, pos.y, f.assembled.w * scale, f.assembled.d * scale)
        ctx.shadowBlur = 0

        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2.5
        ctx.strokeRect(pos.x, pos.y, f.assembled.w * scale, f.assembled.d * scale)

        // Title tag
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 12px system-ui, sans-serif'
        ctx.fillText(`▶ ${f.name} (Step ${playbackStep + 1})`, pos.x + 4, pos.y - 8)
      } else if (f && f.position) {
        // Fallback: draw at destination
        const pos = toPx(f.position.x, f.position.y + f.assembled.d)
        ctx.fillStyle = f.color || '#38bdf8'
        ctx.fillRect(pos.x, pos.y, f.assembled.w * scale, f.assembled.d * scale)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.strokeRect(pos.x, pos.y, f.assembled.w * scale, f.assembled.d * scale)
      }
    }
  }, [plan, steps, playbackStep, subProgress, furniture])

  const pct = total > 1 ? (playbackStep / (total - 1)) * 100 : 0

  return (
    <div className="sim-shell">
      {/* 2D/3D Animated Floorplan Simulation Canvas */}
      <div className="sim-canvas" style={{ position: 'relative', overflow: 'hidden' }}>
        {!plan ? (
          <div style={{ textAlign: 'center', color: 'var(--text-2)', margin: 'auto' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>▶</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Run the Solver in the 3D Editor first</div>
            <div className="text-sm" style={{ marginTop: 4 }}>
              The entry sequence and hallway pathfinding will automatically load here.
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        )}
      </div>

      {plan && (
        <>
          {/* Step details header */}
          {current && (
            <div className="step-detail">
              <div className="flex items-center justify-between">
                <div>
                  <span className="step-detail-name" style={{ fontSize: 16, fontWeight: 700 }}>
                    Step {playbackStep + 1}: {current.furnitureName}
                  </span>
                  <div className="step-detail-action" style={{ marginTop: 2, color: 'var(--text-2)' }}>
                    {current.action}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-must" style={{ textTransform: 'uppercase' }}>
                    Transport: {current.transportMode}
                  </span>
                </div>
              </div>
              {current.issue && (
                <div className="stall-badge" style={{ marginTop: 6 }}>⚠️ STALL — {current.issue.message}</div>
              )}
            </div>
          )}

          {/* Timeline scrub track */}
          <div className="sim-timeline">
            <div
              className="timeline-track"
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect()
                const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
                setPlaybackStep(Math.round(ratio * (total - 1)))
              }}
            >
              <div className="timeline-fill" style={{ width: `${pct}%` }} />
              <div className="timeline-thumb" style={{ left: `${pct}%` }} />
            </div>

            <div className="timeline-markers">
              {steps.map((s, i) => (
                <div
                  key={s.furnitureId}
                  className={`timeline-marker${i === playbackStep ? ' active' : ''}${s.issue?.type === 'stall' ? ' stall' : ''}`}
                  onClick={() => setPlaybackStep(i)}
                  title={s.furnitureName}
                >
                  {i + 1}. {s.furnitureName}
                </div>
              ))}
            </div>
          </div>

          {/* Playback Controls */}
          <div className="sim-controls">
            <button className="btn btn-sm" onClick={() => { setPlaybackStep(0); setPlaybackPlaying(false) }} title="Start">
              ⏮ First
            </button>
            <button className="btn btn-sm" onClick={() => setPlaybackStep(Math.max(0, playbackStep - 1))} title="Previous">
              ◀ Prev
            </button>
            <button
              className={`btn btn-sm${playbackPlaying ? ' btn-primary' : ''}`}
              onClick={() => {
                if (playbackStep >= total - 1) setPlaybackStep(0)
                setPlaybackPlaying(!playbackPlaying)
              }}
              style={{ minWidth: 70, fontWeight: 600 }}
            >
              {playbackPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button className="btn btn-sm" onClick={() => setPlaybackStep(Math.min(total - 1, playbackStep + 1))} title="Next">
              Next ▶
            </button>
            <button className="btn btn-sm" onClick={() => { setPlaybackStep(total - 1); setPlaybackPlaying(false) }} title="End">
              End ⏭
            </button>
            <div style={{ flex: 1 }} />
            <span className="text-muted text-sm" style={{ alignSelf: 'center' }}>
              {playbackStep + 1} / {total} Items Placed
            </span>
          </div>
        </>
      )}
    </div>
  )
}
