'use client'

import { Toaster } from 'sonner'

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'white',
          border: '1px solid #e2e8f0',
          padding: '16px',
          borderRadius: '12px',
        },
        className: 'shadow-lg',
      }}
      richColors
      closeButton
    />
  )
}
