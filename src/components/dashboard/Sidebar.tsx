'use client'

import { clsx } from 'clsx'
import {
  LayoutGrid,
  BarChart3,
  Clock,
  Settings,
  LogOut,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  FileCode
} from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'

interface SidebarProps {
  user: {
    avatar_url?: string
    user_name?: string
  } | null
  activeTab: string
  onTabChange: (tab: string) => void
  onSignOut: () => void
}

const navItems = [
  { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
  { id: 'blueprint', label: 'Blueprint', icon: FileCode },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'settings', label: 'Settings', icon: Settings },
]

// Tooltip component for collapsed state
function Tooltip({ children, label, show }: { children: React.ReactNode; label: string; show: boolean }) {
  if (!show) return <>{children}</>

  return (
    <div className="relative group">
      {children}
      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-slate-700">
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
      </div>
    </div>
  )
}

export function Sidebar({ user, activeTab, onTabChange, onSignOut }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <aside
      className={clsx(
        'h-full bg-slate-900 dark:bg-slate-950 flex flex-col transition-all duration-300 border-r border-slate-800',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={clsx(
        'flex items-center gap-2 p-4 border-b border-slate-800',
        collapsed && 'justify-center'
      )}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center flex-shrink-0">
          <div className="w-4 h-4 bg-black rounded"></div>
        </div>
        {!collapsed && (
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            ContextFlow
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className={clsx('flex-1 p-3 space-y-1', collapsed && 'px-2')}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <Tooltip key={item.id} label={item.label} show={collapsed}>
              <button
                onClick={() => onTabChange(item.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-gradient-to-r from-neon-purple/20 to-neon-blue/20 text-white border border-neon-purple/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <Icon size={20} className={clsx(isActive && 'text-neon-purple')} />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </button>
            </Tooltip>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className={clsx('p-3 border-t border-slate-800 space-y-2', collapsed && 'px-2')}>
        {/* Theme Toggle */}
        <Tooltip label={theme === 'dark' ? 'Light Mode' : 'Dark Mode'} show={collapsed}>
          <button
            onClick={toggleTheme}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all',
              collapsed && 'justify-center px-0'
            )}
          >
            {theme === 'dark' ? (
              <Sun size={20} className="text-yellow-500" />
            ) : (
              <Moon size={20} />
            )}
            {!collapsed && <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
        </Tooltip>

        {/* Sign Out (when collapsed) */}
        {collapsed && (
          <Tooltip label="Sign Out" show={collapsed}>
            <button
              onClick={onSignOut}
              className="w-full flex items-center justify-center py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all"
            >
              <LogOut size={20} />
            </button>
          </Tooltip>
        )}

        {/* User Profile */}
        <Tooltip label={user?.user_name || 'User'} show={collapsed}>
          <div className={clsx(
            'flex items-center gap-3 p-2 rounded-lg bg-slate-800/50',
            collapsed && 'justify-center'
          )}>
            <img
              src={user?.avatar_url || '/default-avatar.png'}
              alt="Avatar"
              className="w-8 h-8 rounded-full border-2 border-slate-700 flex-shrink-0"
            />
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.user_name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">GitHub</p>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
        </Tooltip>

        {/* Collapse Toggle */}
        <Tooltip label={collapsed ? 'Expand' : 'Collapse'} show={collapsed}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={clsx(
              'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all',
              collapsed && 'px-0'
            )}
          >
            {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
            {!collapsed && <span className="text-sm">Collapse</span>}
          </button>
        </Tooltip>
      </div>
    </aside>
  )
}
