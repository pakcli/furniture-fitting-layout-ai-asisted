import { describe, it, expect, beforeEach } from 'vitest'

// In-memory mock for localStorage
const storageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value.toString() },
    clear: () => { store = {} },
    removeItem: (key: string) => { delete store[key] },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true,
  configurable: true,
})

describe('Store LocalStorage Persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persists furniture, room, display, and plan in localStorage', async () => {
    const { useAppStore } = await import('../app-store')

    // Modify some parameters
    useAppStore.getState().updateFurniture('p-wardrobe', {
      position: { x: 45, y: 315 },
      rotation: 90,
    })
    useAppStore.getState().setRoom({
      ...useAppStore.getState().room,
      ceilingHeightCm: 285,
    })
    useAppStore.getState().setDisplay({
      materialMode: 'texture',
      showGhostTrail: false,
    })

    // Check localStorage key
    const raw = localStorage.getItem('pack-and-place-storage-v2')
    expect(raw).not.toBeNull()

    const parsed = JSON.parse(raw!)
    expect(parsed.state).toBeDefined()
    expect(parsed.state.room.ceilingHeightCm).toBe(285)
    expect(parsed.state.display.materialMode).toBe('texture')
    expect(parsed.state.display.showGhostTrail).toBe(false)

    const wardrobe = parsed.state.furniture.find((f: any) => f.id === 'p-wardrobe')
    expect(wardrobe.position.x).toBe(45)
    expect(wardrobe.position.y).toBe(315)
    expect(wardrobe.rotation).toBe(90)
  })
})
