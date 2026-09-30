import React from 'react'
import { useAppStore } from '@/store/app-store'
import type { Theme } from '@/types'

const THEMES: { value: Theme; label: string }[] = [
  { value: 'dark',  label: '🌙 Dark' },
  { value: 'light', label: '☀️ Light' },
  { value: 'cream', label: '🍦 Cream' },
]

export function ThemeToggle() {
  const { theme, setTheme } = useAppStore()
  return (
    <div className="theme-select">
      {THEMES.map(t => (
        <button
          key={t.value}
          className={`theme-btn${theme === t.value ? ' active' : ''}`}
          onClick={() => setTheme(t.value)}
          title={t.label}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
