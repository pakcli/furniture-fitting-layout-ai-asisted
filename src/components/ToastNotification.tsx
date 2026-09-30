import React from 'react'
import { useAppStore } from '@/store/app-store'

export function ToastNotification() {
  const { toastMessage } = useAppStore()

  if (!toastMessage) return null

  return (
    <div className="toast-notification-banner">
      <span className="toast-text">{toastMessage}</span>
    </div>
  )
}
