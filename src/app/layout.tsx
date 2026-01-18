import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/providers/ToastProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ContextFlow - Vibe-to-Task Bridge',
  description: 'AI-powered dashboard bridging code and non-technical stakeholders',
  keywords: ['task management', 'kanban', 'microservices', 'github', 'development'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-slate-50">
          {children}
        </div>
        <ToastProvider />
      </body>
    </html>
  )
}
