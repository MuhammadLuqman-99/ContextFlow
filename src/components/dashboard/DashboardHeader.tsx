'use client'

import { useState } from 'react'
import { Search, Filter, Plus, RefreshCw, LogOut, Bell, Sun, Moon } from 'lucide-react'
import { clsx } from 'clsx'
import { useTheme } from '@/context/ThemeContext'

interface DashboardHeaderProps {
  user: {
    avatar_url?: string
    user_name?: string
  } | null
  activeTab: string
  onTabChange: (tab: string) => void
  onSearch: (query: string) => void
  onAddRepo: () => void
  onRefresh: () => void
  onSignOut: () => void
  isRefreshing?: boolean
  notificationCount?: number
}

const tabs = [
  { id: 'kanban', label: 'Kanban', icon: '📋' },
  { id: 'stats', label: 'Stats', icon: '📊' },
  { id: 'timeline', label: 'Timeline', icon: '📅' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export function DashboardHeader({
  user,
  activeTab,
  onTabChange,
  onSearch,
  onAddRepo,
  onRefresh,
  onSignOut,
  isRefreshing = false,
  notificationCount = 0,
}: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Top Row */}
        <div className="px-6 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
          {/* Logo & New Button */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              ContextFlow
            </h1>
            <span className="text-slate-400 dark:text-slate-500 text-sm hidden sm:inline">Vibe-to-Task Bridge</span>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-8 hidden md:block">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search services... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={clsx(
                  'absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors',
                  showFilters
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 dark:text-slate-500'
                )}
              >
                <Filter size={16} />
              </button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onAddRepo}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Repo</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} className={clsx('text-slate-600 dark:text-slate-400', isRefreshing && 'animate-spin')} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun size={18} className="text-yellow-500" />
              ) : (
                <Moon size={18} className="text-slate-600" />
              )}
            </button>

            {/* Notifications */}
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors relative">
              <Bell size={18} className="text-slate-600 dark:text-slate-400" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
              <img
                src={user?.avatar_url || '/default-avatar.png'}
                alt="Avatar"
                className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-600"
              />
              <button
                onClick={onSignOut}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut size={18} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              )}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-4">
            <FilterSelect label="Status" options={['All', 'Backlog', 'In Progress', 'Testing', 'Done']} />
            <FilterSelect label="Health" options={['All', 'Healthy', 'Stale', 'Inactive']} />
            <FilterSelect label="Repository" options={['All Repositories']} />
            <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

function FilterSelect({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}:</span>
      <select className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}
