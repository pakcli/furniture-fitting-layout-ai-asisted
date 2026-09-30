import React from 'react'

export interface FurnitureBoxProps {
  color: string
  w: number
  d: number
  h: number
  name?: string
  size?: number
  showDetails?: boolean
}

/** Helper to adjust brightness of hex color */
function adjustBrightness(hex: string, percent: number): string {
  const cleanHex = hex.replace('#', '')
  const num = parseInt(cleanHex.length === 3 ? cleanHex.split('').map(c => c + c).join('') : cleanHex, 16)
  if (isNaN(num)) return hex
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, Math.min(255, (num >> 16) + amt))
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt))
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt))
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}

/**
 * Solid, mathematically-precise Isometric 3D Furniture Box
 * Perfectly connects all faces with realistic lighting, soft floor shadow, and architectural accents.
 */
export function FurnitureBox3D({
  color,
  w: rawW,
  d: rawD,
  h: rawH,
  name = '',
  size = 110,
  showDetails = true,
}: FurnitureBoxProps) {
  const S = size
  const cos30 = 0.866025
  const sin30 = 0.5

  // Scale dimensions proportionally so the 3D model fills the thumbnail cleanly
  const maxExtent = Math.max((rawW + rawD) * cos30, rawH + (rawW + rawD) * sin30) || 100
  const scale = (S * 0.62) / maxExtent

  const w = Math.max(10, rawW * scale)
  const d = Math.max(10, rawD * scale)
  const h = Math.max(10, rawH * scale)

  const projW = (w + d) * cos30
  const projH = h + (w + d) * sin30

  // Center the projected cuboid precisely inside the SVG view area
  const cx = S / 2 + ((d - w) * cos30) / 2
  const cy = S / 2 + (h - (w + d) * sin30) / 2 + 4

  // Bottom vertices (ground plane)
  const bL: [number, number] = [cx - d * cos30, cy + d * sin30]
  const bR: [number, number] = [cx + w * cos30, cy + w * sin30]
  const bF: [number, number] = [cx + (w - d) * cos30, cy + (w + d) * sin30]

  // Top vertices (ground plane shifted straight UP by height h)
  const t0: [number, number] = [cx, cy - h]
  const tL: [number, number] = [cx - d * cos30, cy + d * sin30 - h]
  const tR: [number, number] = [cx + w * cos30, cy + w * sin30 - h]
  const tF: [number, number] = [cx + (w - d) * cos30, cy + (w + d) * sin30 - h]

  const pts = (...coords: [number, number][]) =>
    coords.map(c => `${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ')

  const safeId = color.replace('#', '').toLowerCase()
  const lowerName = name.toLowerCase()
  const isBed = lowerName.includes('bed')
  const isWardrobe = lowerName.includes('wardrobe') || lowerName.includes('cabinet')
  const isDresser = lowerName.includes('dresser') || lowerName.includes('drawer')
  const isDesk = lowerName.includes('desk') || lowerName.includes('table')
  const isNightstand = lowerName.includes('nightstand')

  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      style={{ width: '100%', height: '100%', overflow: 'visible', display: 'block' }}
    >
      <defs>
        {/* Soft shadow filter */}
        <filter id={`shadow-${safeId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>

        {/* Shading gradients */}
        <linearGradient id={`top-grad-${safeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={adjustBrightness(color, 28)} />
          <stop offset="100%" stopColor={adjustBrightness(color, 12)} />
        </linearGradient>
        <linearGradient id={`left-grad-${safeId}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={adjustBrightness(color, 6)} />
          <stop offset="100%" stopColor={adjustBrightness(color, -8)} />
        </linearGradient>
        <linearGradient id={`right-grad-${safeId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={adjustBrightness(color, -16)} />
          <stop offset="100%" stopColor={adjustBrightness(color, -34)} />
        </linearGradient>
      </defs>

      {/* 1. Ground Drop Shadow */}
      <ellipse
        cx={bF[0]}
        cy={bF[1] - (d * sin30) / 2 + 2}
        rx={Math.max(14, projW * 0.46)}
        ry={Math.max(7, (w + d) * 0.16)}
        fill="rgba(0, 0, 0, 0.45)"
        filter={`url(#shadow-${safeId})`}
      />

      {/* 2. Left Face (Side depth surface) */}
      <polygon
        points={pts(tL, tF, bF, bL)}
        fill={`url(#left-grad-${safeId})`}
        stroke="rgba(0,0,0,0.2)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* 3. Right Face (Front width surface) */}
      <polygon
        points={pts(tF, tR, bR, bF)}
        fill={`url(#right-grad-${safeId})`}
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* 4. Top Face (Lit horizontal roof surface) */}
      <polygon
        points={pts(t0, tR, tF, tL)}
        fill={`url(#top-grad-${safeId})`}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />

      {/* 5. Edge Highlights */}
      <line x1={tL[0]} y1={tL[1]} x2={tF[0]} y2={tF[1]} stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <line x1={tF[0]} y1={tF[1]} x2={tR[0]} y2={tR[1]} stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <line x1={tF[0]} y1={tF[1]} x2={bF[0]} y2={bF[1]} stroke="rgba(0,0,0,0.25)" strokeWidth="1" />

      {/* 6. Architectural Furniture Details */}
      {showDetails && isBed && (
        <g>
          {/* Headboard along top-rear edge */}
          <polygon
            points={pts(
              [t0[0], t0[1] - Math.max(7, h * 0.6)],
              [tL[0], tL[1] - Math.max(7, h * 0.6)],
              tL,
              t0
            )}
            fill={adjustBrightness(color, -12)}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.8"
          />
          {/* Left pillow */}
          <ellipse
            cx={t0[0] + (tL[0] - t0[0]) * 0.45 + (tR[0] - t0[0]) * 0.28}
            cy={t0[1] + (tL[1] - t0[1]) * 0.45 + (tR[1] - t0[1]) * 0.28}
            rx={Math.max(4, w * 0.16)}
            ry={Math.max(2.5, d * 0.12)}
            fill="#ffffff"
            opacity="0.9"
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="0.6"
            transform={`rotate(-15, ${t0[0] + (tL[0] - t0[0]) * 0.45 + (tR[0] - t0[0]) * 0.28}, ${t0[1] + (tL[1] - t0[1]) * 0.45 + (tR[1] - t0[1]) * 0.28})`}
          />
          {/* Right pillow */}
          <ellipse
            cx={t0[0] + (tL[0] - t0[0]) * 0.45 + (tR[0] - t0[0]) * 0.72}
            cy={t0[1] + (tL[1] - t0[1]) * 0.45 + (tR[1] - t0[1]) * 0.72}
            rx={Math.max(4, w * 0.16)}
            ry={Math.max(2.5, d * 0.12)}
            fill="#ffffff"
            opacity="0.9"
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="0.6"
            transform={`rotate(-15, ${t0[0] + (tL[0] - t0[0]) * 0.45 + (tR[0] - t0[0]) * 0.72}, ${t0[1] + (tL[1] - t0[1]) * 0.45 + (tR[1] - t0[1]) * 0.72})`}
          />
          {/* Duvet fold line */}
          <line
            x1={tL[0] + (tF[0] - tL[0]) * 0.52}
            y1={tL[1] + (tF[1] - tL[1]) * 0.52}
            x2={tR[0] + (tF[0] - tR[0]) * 0.52}
            y2={tR[1] + (tF[1] - tR[1]) * 0.52}
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1.2"
            strokeDasharray="3 1.5"
          />
        </g>
      )}

      {showDetails && isWardrobe && (
        <g>
          {/* Double-door vertical split */}
          <line
            x1={(tF[0] + tR[0]) / 2}
            y1={(tF[1] + tR[1]) / 2}
            x2={(bF[0] + bR[0]) / 2}
            y2={(bF[1] + bR[1]) / 2}
            stroke="rgba(0,0,0,0.4)"
            strokeWidth="1"
          />
          {/* Left handle */}
          <line
            x1={(tF[0] + tR[0]) / 2 - 2.5}
            y1={(tF[1] + tR[1]) / 2 + h * 0.42}
            x2={(tF[0] + tR[0]) / 2 - 2.5}
            y2={(tF[1] + tR[1]) / 2 + h * 0.54}
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Right handle */}
          <line
            x1={(tF[0] + tR[0]) / 2 + 2.5}
            y1={(tF[1] + tR[1]) / 2 + h * 0.42}
            x2={(tF[0] + tR[0]) / 2 + 2.5}
            y2={(tF[1] + tR[1]) / 2 + h * 0.54}
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      )}

      {showDetails && (isDresser || isNightstand) && (
        <g>
          {[0.33, 0.66].map((ratio, idx) => (
            <g key={idx}>
              <line
                x1={tF[0] + (bF[0] - tF[0]) * ratio}
                y1={tF[1] + (bF[1] - tF[1]) * ratio}
                x2={tR[0] + (bR[0] - tR[0]) * ratio}
                y2={tR[1] + (bR[1] - tR[1]) * ratio}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="0.8"
              />
              <circle
                cx={(tF[0] + tR[0]) / 2 + (bF[0] - tF[0]) * (ratio - 0.16)}
                cy={(tF[1] + tR[1]) / 2 + (bF[1] - tF[1]) * (ratio - 0.16)}
                r="1.4"
                fill="#ffffff"
                stroke="rgba(0,0,0,0.2)"
                strokeWidth="0.5"
              />
            </g>
          ))}
          <circle
            cx={(tF[0] + tR[0]) / 2 + (bF[0] - tF[0]) * 0.83}
            cy={(tF[1] + tR[1]) / 2 + (bF[1] - tF[1]) * 0.83}
            r="1.4"
            fill="#ffffff"
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="0.5"
          />
        </g>
      )}

      {showDetails && isDesk && (
        <g>
          {/* Drawer divider */}
          <line
            x1={tF[0] + (tR[0] - tF[0]) * 0.68}
            y1={tF[1] + (tR[1] - tF[1]) * 0.68}
            x2={bF[0] + (bR[0] - bF[0]) * 0.68}
            y2={bF[1] + (bR[1] - bF[1]) * 0.68}
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="0.9"
          />
          {/* Knee space cutout */}
          <polygon
            points={pts(
              [tF[0] + (bF[0] - tF[0]) * 0.28, tF[1] + (bF[1] - tF[1]) * 0.28],
              [tF[0] + (tR[0] - tF[0]) * 0.68 + (bF[0] - tF[0]) * 0.28, tF[1] + (tR[1] - tF[1]) * 0.68 + (bF[1] - tF[1]) * 0.28],
              [bF[0] + (bR[0] - bF[0]) * 0.68, bF[1] + (bR[1] - bF[1]) * 0.68],
              bF
            )}
            fill="rgba(0,0,0,0.35)"
          />
        </g>
      )}
    </svg>
  )
}
