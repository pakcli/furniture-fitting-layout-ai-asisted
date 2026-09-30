import type { CatalogFolder, FurnitureItem } from '@/types'

export const CATALOG_TREE: CatalogFolder[] = [
  {
    id: 'furniture',
    label: 'Furniture',
    icon: '📦',
    children: [
      { id: 'furniture/seating', label: 'Seating', icon: '🛋', itemTypes: ['furniture'] },
      { id: 'furniture/tables', label: 'Tables & Desks', icon: '🪑', itemTypes: ['furniture'] },
      { id: 'furniture/bedroom', label: 'Bedroom', icon: '🛏', itemTypes: ['furniture'] },
      { id: 'furniture/storage', label: 'Storage', icon: '🗄', itemTypes: ['furniture', 'fixture'] },
    ],
  },
  {
    id: 'obstacles',
    label: 'Obstacles',
    icon: '🧱',
    children: [
      { id: 'obstacles/doors', label: 'Doors & Entrances', icon: '🚪', itemTypes: ['door'] },
      { id: 'obstacles/windows', label: 'Windows', icon: '🪟', itemTypes: ['window'] },
      { id: 'obstacles/walls', label: 'Walls', icon: '🧱', itemTypes: ['wall'] },
    ],
  },
  {
    id: 'decor',
    label: 'Decor & Lighting',
    icon: '🌿',
    children: [
      { id: 'decor/plants', label: 'Plants', icon: '🪴', itemTypes: ['decor'] },
      { id: 'decor/lighting', label: 'Lighting', icon: '💡', itemTypes: ['decor'] },
      { id: 'decor/art', label: 'Art & Accessories', icon: '🖼', itemTypes: ['decor'] },
    ],
  },
]

export const CATALOG_ITEMS: FurnitureItem[] = [
  // ─── Seating ─────────────────────────────────────────────────────────────
  {
    id: 'cat-sofa-2p',
    name: '2-Seat Fabric Sofa',
    type: 'furniture',
    category: 'furniture/seating',
    icon: '🛋',
    assembled: { w: 160, d: 85, h: 80 },
    clearance: { front: 60 },
    canTilt: true,
    priority: 'must',
    color: '#6366f1',
    components: [],
    visible: true,
  },
  {
    id: 'cat-armchair-lounge',
    name: 'Lounge Armchair',
    type: 'furniture',
    category: 'furniture/seating',
    icon: '🪑',
    assembled: { w: 75, d: 70, h: 80 },
    clearance: { front: 40 },
    canTilt: false,
    priority: 'prefer',
    color: '#ec4899',
    components: [],
    visible: true,
  },
  {
    id: 'cat-desk-chair',
    name: 'Ergonomic Desk Chair',
    type: 'furniture',
    category: 'furniture/seating',
    icon: '💺',
    assembled: { w: 60, d: 60, h: 95 },
    clearance: { front: 50 },
    canTilt: true,
    priority: 'prefer',
    color: '#8b5cf6',
    components: [],
    visible: true,
  },
  {
    id: 'cat-bench',
    name: 'Upholstered Bench',
    type: 'furniture',
    category: 'furniture/seating',
    icon: '🪑',
    assembled: { w: 120, d: 45, h: 45 },
    clearance: {},
    canTilt: false,
    priority: 'flex',
    color: '#14b8a6',
    components: [],
    visible: true,
  },
  {
    id: 'cat-pouf-ottoman',
    name: 'Round Ottoman Pouf',
    type: 'furniture',
    category: 'furniture/seating',
    icon: '🧶',
    assembled: { w: 50, d: 50, h: 40 },
    clearance: {},
    canTilt: true,
    priority: 'flex',
    color: '#f43f5e',
    components: [],
    visible: true,
  },

  // ─── Tables & Desks ──────────────────────────────────────────────────────
  {
    id: 'cat-work-desk',
    name: 'Executive Work Desk',
    type: 'furniture',
    category: 'furniture/tables',
    icon: '🖥',
    assembled: { w: 120, d: 65, h: 75 },
    clearance: { front: 70 },
    canTilt: false,
    priority: 'must',
    color: '#f59e0b',
    components: [],
    visible: true,
  },
  {
    id: 'cat-compact-desk',
    name: 'Compact Study Desk',
    type: 'furniture',
    category: 'furniture/tables',
    icon: '💻',
    assembled: { w: 90, d: 50, h: 75 },
    clearance: { front: 50 },
    canTilt: false,
    priority: 'prefer',
    color: '#d97706',
    components: [],
    visible: true,
  },
  {
    id: 'cat-coffee-table',
    name: 'Nordic Coffee Table',
    type: 'furniture',
    category: 'furniture/tables',
    icon: '☕',
    assembled: { w: 100, d: 55, h: 45 },
    clearance: { front: 30, back: 30 },
    canTilt: true,
    priority: 'prefer',
    color: '#10b981',
    components: [],
    visible: true,
  },
  {
    id: 'cat-nightstand',
    name: 'Modern Nightstand',
    type: 'furniture',
    category: 'furniture/tables',
    icon: '🪑',
    assembled: { w: 45, d: 45, h: 55 },
    clearance: {},
    canTilt: false,
    priority: 'prefer',
    color: '#059669',
    components: [],
    visible: true,
  },
  {
    id: 'cat-dining-table',
    name: 'Dining Table (4-seat)',
    type: 'furniture',
    category: 'furniture/tables',
    icon: '🍽',
    assembled: { w: 140, d: 80, h: 76 },
    clearance: { left: 50, right: 50, front: 50, back: 50 },
    canTilt: false,
    priority: 'prefer',
    color: '#0284c7',
    components: [],
    visible: true,
  },

  // ─── Bedroom ─────────────────────────────────────────────────────────────
  {
    id: 'cat-queen-bed',
    name: 'Queen Bed Frame + Mattress',
    type: 'furniture',
    category: 'furniture/bedroom',
    icon: '🛏',
    assembled: { w: 160, d: 200, h: 55 },
    clearance: { left: 40, right: 40 },
    canTilt: true,
    priority: 'must',
    color: '#3b82f6',
    components: [],
    visible: true,
  },
  {
    id: 'cat-single-bed',
    name: 'Studio Single Bed',
    type: 'furniture',
    category: 'furniture/bedroom',
    icon: '🛌',
    assembled: { w: 100, d: 190, h: 50 },
    clearance: { left: 30, right: 30 },
    canTilt: true,
    priority: 'must',
    color: '#2563eb',
    components: [],
    visible: true,
  },
  {
    id: 'cat-wardrobe-2d',
    name: '2-Door Wardrobe',
    type: 'furniture',
    category: 'furniture/bedroom',
    icon: '🚪',
    assembled: { w: 100, d: 60, h: 200 },
    clearance: { front: 60 },
    canTilt: true,
    priority: 'must',
    color: '#4f46e5',
    components: [],
    visible: true,
  },
  {
    id: 'cat-tall-wardrobe',
    name: 'Tall Storage Wardrobe',
    type: 'furniture',
    category: 'furniture/bedroom',
    icon: '🗄',
    assembled: { w: 85, d: 55, h: 195 },
    clearance: { front: 50 },
    canTilt: false,
    priority: 'must',
    color: '#7c3aed',
    components: [],
    visible: true,
  },
  {
    id: 'cat-dresser-6d',
    name: '6-Drawer Wide Dresser',
    type: 'furniture',
    category: 'furniture/bedroom',
    icon: '🗄',
    assembled: { w: 110, d: 50, h: 90 },
    clearance: { front: 60 },
    canTilt: false,
    priority: 'must',
    color: '#06b6d4',
    components: [],
    visible: true,
  },

  // ─── Storage ─────────────────────────────────────────────────────────────
  {
    id: 'cat-bookshelf-tall',
    name: 'Tall Bookcase 5-Shelf',
    type: 'furniture',
    category: 'furniture/storage',
    icon: '📚',
    assembled: { w: 80, d: 35, h: 180 },
    clearance: { front: 40 },
    canTilt: false,
    priority: 'prefer',
    color: '#0ea5e9',
    components: [],
    visible: true,
  },
  {
    id: 'cat-tv-console',
    name: 'Low TV Media Console',
    type: 'furniture',
    category: 'furniture/storage',
    icon: '📺',
    assembled: { w: 150, d: 40, h: 50 },
    clearance: { front: 50 },
    canTilt: false,
    priority: 'prefer',
    color: '#0284c7',
    components: [],
    visible: true,
  },
  {
    id: 'cat-shoe-rack',
    name: 'Entryway Shoe Cabinet',
    type: 'furniture',
    category: 'furniture/storage',
    icon: '👞',
    assembled: { w: 80, d: 30, h: 90 },
    clearance: { front: 45 },
    canTilt: false,
    priority: 'flex',
    color: '#64748b',
    components: [],
    visible: true,
  },

  // ─── Obstacles (Reference only in tree) ───────────────────────────────────
  {
    id: 'cat-door-standard',
    name: 'Standard Doorway (90cm)',
    type: 'door',
    category: 'obstacles/doors',
    icon: '🚪',
    assembled: { w: 90, d: 15, h: 210 },
    clearance: { front: 90 },
    canTilt: false,
    priority: 'must',
    color: '#e2e8f0',
    components: [],
    visible: true,
  },
  {
    id: 'cat-door-wide',
    name: 'Wide Double Doorway (180cm)',
    type: 'door',
    category: 'obstacles/doors',
    icon: '🚪',
    assembled: { w: 180, d: 15, h: 210 },
    clearance: { front: 90 },
    canTilt: false,
    priority: 'must',
    color: '#e2e8f0',
    components: [],
    visible: true,
  },
  {
    id: 'cat-window-standard',
    name: 'Casement Window (120cm)',
    type: 'window',
    category: 'obstacles/windows',
    icon: '🪟',
    assembled: { w: 120, d: 20, h: 140 },
    clearance: {},
    canTilt: false,
    priority: 'must',
    color: '#93c5fd',
    components: [],
    visible: true,
  },
  {
    id: 'cat-partition-wall',
    name: 'Drywall Partition Segment',
    type: 'wall',
    category: 'obstacles/walls',
    icon: '🧱',
    assembled: { w: 100, d: 15, h: 260 },
    clearance: {},
    canTilt: false,
    priority: 'must',
    color: '#94a3b8',
    components: [],
    visible: true,
  },

  // ─── Decor & Lighting ────────────────────────────────────────────────────
  {
    id: 'cat-plant-monstera',
    name: 'Potted Monstera Deliciosa',
    type: 'decor',
    category: 'decor/plants',
    icon: '🪴',
    assembled: { w: 50, d: 50, h: 80 },
    clearance: {},
    canTilt: true,
    priority: 'flex',
    color: '#22c55e',
    components: [],
    visible: true,
  },
  {
    id: 'cat-plant-fig',
    name: 'Tall Fiddle Leaf Fig',
    type: 'decor',
    category: 'decor/plants',
    icon: '🌿',
    assembled: { w: 45, d: 45, h: 140 },
    clearance: {},
    canTilt: true,
    priority: 'flex',
    color: '#16a34a',
    components: [],
    visible: true,
  },
  {
    id: 'cat-floor-lamp',
    name: 'Arch Floor Lamp',
    type: 'decor',
    category: 'decor/lighting',
    icon: '💡',
    assembled: { w: 40, d: 40, h: 165 },
    clearance: {},
    canTilt: true,
    priority: 'flex',
    color: '#eab308',
    components: [],
    visible: true,
  },
  {
    id: 'cat-table-lamp',
    name: 'Ceramic Table Lamp',
    type: 'decor',
    category: 'decor/lighting',
    icon: '🏮',
    assembled: { w: 30, d: 30, h: 45 },
    clearance: {},
    canTilt: false,
    priority: 'flex',
    color: '#facc15',
    components: [],
    visible: true,
  },
  {
    id: 'cat-wall-art',
    name: 'Framed Canvas Art',
    type: 'decor',
    category: 'decor/art',
    icon: '🖼',
    assembled: { w: 80, d: 5, h: 100 },
    clearance: {},
    canTilt: false,
    priority: 'flex',
    color: '#ec4899',
    components: [],
    visible: true,
  },
]

// ─── Helper Functions ────────────────────────────────────────────────────────

export function findFolder(folderId: string, folders: CatalogFolder[] = CATALOG_TREE): CatalogFolder | null {
  for (const folder of folders) {
    if (folder.id === folderId) return folder
    if (folder.children) {
      const match = findFolder(folderId, folder.children)
      if (match) return match
    }
  }
  return null
}

export function getFolderBreadcrumb(
  folderId: string,
  folders: CatalogFolder[] = CATALOG_TREE
): Array<{ id: string; label: string; icon: string }> {
  const parts = folderId.split('/')
  const trail: Array<{ id: string; label: string; icon: string }> = [
    { id: 'root', label: 'Root', icon: '📁' },
  ]

  let currentId = ''
  for (let i = 0; i < parts.length; i++) {
    currentId = i === 0 ? parts[0] : `${currentId}/${parts[i]}`
    const match = findFolder(currentId, folders)
    if (match) {
      trail.push({ id: match.id, label: match.label, icon: match.icon })
    }
  }

  return trail
}

export function getItemsForFolder(folderId: string, search = '', sortBy: 'name' | 'priority' | 'size' = 'name'): FurnitureItem[] {
  let items = CATALOG_ITEMS

  if (folderId !== 'root' && folderId !== '') {
    // If selected folder has children, match any child id that starts with folderId
    items = items.filter(item => item.category?.startsWith(folderId))
  }

  if (search.trim()) {
    const q = search.toLowerCase()
    items = items.filter(item => item.name.toLowerCase().includes(q))
  }

  return [...items].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'priority') {
      const pOrder = { must: 0, prefer: 1, flex: 2 }
      return (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2)
    }
    if (sortBy === 'size') {
      const volA = a.assembled.w * a.assembled.d * a.assembled.h
      const volB = b.assembled.w * b.assembled.d * b.assembled.h
      return volB - volA
    }
    return 0
  })
}
