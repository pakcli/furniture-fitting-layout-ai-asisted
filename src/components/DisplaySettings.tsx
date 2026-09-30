import React from 'react'
import { useAppStore } from '@/store/app-store'
import type { DisplaySettings as DS } from '@/types'

export function DisplaySettings() {
  const { display, setDisplay } = useAppStore()
  const upd = (patch: Partial<DS>) => setDisplay(patch)

  return (
    <div className="display-settings">
      <div className="section-title">Display</div>

      <div className="field-row">
        <label>Bounding box</label>
        <input type="checkbox" checked={display.showBoundingBox} onChange={e => upd({ showBoundingBox: e.target.checked })} />
        <input type="color" value={display.boundingBoxColor} onChange={e => upd({ boundingBoxColor: e.target.value })} />
      </div>

      <div className="field-row">
        <label>Clearance zone</label>
        <input type="checkbox" checked={display.showClearanceZone} onChange={e => upd({ showClearanceZone: e.target.checked })} />
        <input type="color" value={display.clearanceZoneColor} onChange={e => upd({ clearanceZoneColor: e.target.value })} />
      </div>

      <div className="section-title">Material</div>
      {(['matte', 'texture', 'fallback'] as const).map(mode => (
        <div className="field-row" key={mode}>
          <label>
            <input type="radio" name="material-mode" value={mode}
              checked={display.materialMode === mode}
              onChange={() => upd({ materialMode: mode })}
            />
            {' '}{mode === 'fallback' ? 'Fallback color' : mode.charAt(0).toUpperCase() + mode.slice(1)}
          </label>
          {mode === 'fallback' && (
            <input type="color" value={display.fallbackColor} onChange={e => upd({ fallbackColor: e.target.value })} />
          )}
        </div>
      ))}

      <div className="section-title">Highlights</div>
      <div className="field-row">
        <label>Fragile faces</label>
        <input type="checkbox" checked={display.showFragileFaces} onChange={e => upd({ showFragileFaces: e.target.checked })} />
        <input type="color" value={display.fragileFaceColor} onChange={e => upd({ fragileFaceColor: e.target.value })} />
      </div>
      <div className="field-row">
        <label>Collision</label>
        <input type="color" value={display.collisionColor} onChange={e => upd({ collisionColor: e.target.value })} />
      </div>
      <div className="field-row">
        <label>Floor shadow</label>
        <input type="checkbox" checked={display.showFloorShadow} onChange={e => upd({ showFloorShadow: e.target.checked })} />
      </div>
    </div>
  )
}
