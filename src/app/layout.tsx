import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/providers/ToastProvider'
import { ThemeProvider } from '@/context/ThemeContext'

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-50 dark:bg-slate-900 transition-colors`}>
        <ThemeProvider>
          <div className="min-h-screen">
            {children}
          </div>
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  )
}
