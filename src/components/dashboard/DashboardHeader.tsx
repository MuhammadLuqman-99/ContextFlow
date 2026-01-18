'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Filter, Plus, RefreshCw, Bell, X, Check, Trash2, GitCommit, ChevronDown, GitBranch } from 'lucide-react'
import { clsx } from 'clsx'
import { Repository } from '@/types/database'

interface Notification {
  id: string
  type: 'suggestion' | 'update' | 'alert'
  title: string
  message: string
  timestamp: string
  microservice_id?: string
  service_name?: string
}

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
  notifications?: Notification[]
  onApplyNotification?: (id: string) => void
  onDismissNotification?: (id: string) => void
  // Repository switcher
  repositories?: Repository[]
  selectedRepo?: Repository | null
  onSelectRepo?: (repo: Repository) => void
}

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
  notifications = [],
  onApplyNotification,
  onDismissNotification,
  repositories = [],
  selectedRepo,
  onSelectRepo,
}: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showRepoSwitcher, setShowRepoSwitcher] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const repoSwitcherRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (repoSwitcherRef.current && !repoSwitcherRef.current.contains(event.target as Node)) {
        setShowRepoSwitcher(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  // Get the active tab label for display
  const tabLabels: Record<string, string> = {
    kanban: 'Kanban Board',
    blueprint: 'Project Blueprint',
    stats: 'Statistics',
    timeline: 'Timeline',
    settings: 'Settings',
  }

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-40 transition-colors flex-shrink-0">
      {/* Single Row Header */}
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Left: Page Title */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {tabLabels[activeTab] || 'Dashboard'}
          </h1>
        </div>

        {/* Center: Search Bar */}
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

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Repository Switcher */}
          {repositories.length > 0 && (
            <div className="relative" ref={repoSwitcherRef}>
              <button
                onClick={() => setShowRepoSwitcher(!showRepoSwitcher)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm',
                  showRepoSwitcher
                    ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                )}
              >
                <GitBranch size={16} className="text-slate-500 dark:text-slate-400" />
                <span className="max-w-[150px] truncate text-slate-700 dark:text-slate-300">
                  {selectedRepo?.repo_name || 'Select Repository'}
                </span>
                <ChevronDown size={14} className={clsx(
                  'text-slate-400 transition-transform',
                  showRepoSwitcher && 'rotate-180'
                )} />
              </button>

              {/* Repository Dropdown */}
              {showRepoSwitcher && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                  <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Switch Repository
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {repositories.map((repo) => (
                      <button
                        key={repo.id}
                        onClick={() => {
                          onSelectRepo?.(repo)
                          setShowRepoSwitcher(false)
                        }}
                        className={clsx(
                          'w-full px-3 py-2.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left',
                          selectedRepo?.id === repo.id && 'bg-primary-50 dark:bg-primary-900/20'
                        )}
                      >
                        <GitBranch size={16} className={clsx(
                          selectedRepo?.id === repo.id
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-slate-400 dark:text-slate-500'
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className={clsx(
                            'text-sm font-medium truncate',
                            selectedRepo?.id === repo.id
                              ? 'text-primary-700 dark:text-primary-300'
                              : 'text-slate-700 dark:text-slate-300'
                          )}>
                            {repo.repo_name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {repo.owner}
                          </p>
                        </div>
                        {selectedRepo?.id === repo.id && (
                          <Check size={14} className="text-primary-600 dark:text-primary-400 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={clsx(
                'p-2 rounded-lg transition-colors relative',
                showNotifications
                  ? 'bg-slate-100 dark:bg-slate-700'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              )}
            >
              <Bell size={18} className="text-slate-600 dark:text-slate-400" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">Notifications</h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                  >
                    <X size={16} className="text-slate-400" />
                  </button>
                </div>

                {/* Notifications List */}
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">No notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                                <GitCommit size={16} className="text-primary-600 dark:text-primary-400" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                {notification.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  {formatRelativeTime(notification.timestamp)}
                                </span>
                                {notification.service_name && (
                                  <span className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                                    {notification.service_name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 mt-2 ml-11">
                            <button
                              onClick={() => {
                                onApplyNotification?.(notification.id)
                                setShowNotifications(false)
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                            >
                              <Check size={12} />
                              Apply
                            </button>
                            <button
                              onClick={() => onDismissNotification?.(notification.id)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                            >
                              <Trash2 size={12} />
                              Dismiss
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <button
                      onClick={() => {
                        onTabChange('settings')
                        setShowNotifications(false)
                      }}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                    >
                      View all in Settings
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap gap-4">
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
