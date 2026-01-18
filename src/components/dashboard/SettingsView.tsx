'use client'

import { useState } from 'react'
import { Repository } from '@/types/database'
import { User, Github, Bell, Moon, Sun, Trash2, LogOut, Shield, Key } from 'lucide-react'
import { clsx } from 'clsx'
import { SuggestionList } from '@/components/suggestions/ManifestUpdateSuggestion'

interface UserProfile {
  id: string
  avatar_url?: string
  user_name?: string
  email?: string
}

interface SettingsViewProps {
  user: UserProfile | null
  repositories: Repository[]
  suggestions: any[]
  onDisconnectRepo?: (repoId: string) => void
  onApplySuggestion?: (suggestionId: string) => void
  onDismissSuggestion?: (suggestionId: string) => void
  onSignOut?: () => void
}

export function SettingsView({
  user,
  repositories,
  suggestions,
  onDisconnectRepo,
  onApplySuggestion,
  onDismissSuggestion,
  onSignOut,
}: SettingsViewProps) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return false
  })
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [disconnectingRepo, setDisconnectingRepo] = useState<string | null>(null)

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    if (newMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleDisconnect = async (repoId: string) => {
    if (!onDisconnectRepo) return
    setDisconnectingRepo(repoId)
    try {
      await onDisconnectRepo(repoId)
    } finally {
      setDisconnectingRepo(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* User Profile Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-colors">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
          <User size={20} />
          Profile
        </h2>

        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Profile"
                className="w-20 h-20 rounded-full border-4 border-slate-200 dark:border-slate-600"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                <User size={32} className="text-slate-400 dark:text-slate-500" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Username
              </label>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {user?.user_name || 'Unknown'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Email
              </label>
              <p className="text-slate-700 dark:text-slate-300">
                {user?.email || 'Not available'}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Github size={16} />
              <span>Connected via GitHub OAuth</span>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-colors">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
          {darkMode ? <Moon size={20} /> : <Sun size={20} />}
          Appearance
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200">Dark Mode</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Switch between light and dark themes
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={clsx(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              darkMode ? 'bg-primary-600' : 'bg-slate-300'
            )}
          >
            <span
              className={clsx(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                darkMode ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-colors">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
          <Bell size={20} />
          Notifications
        </h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">Email Notifications</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Receive emails when service status changes
              </p>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={clsx(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                emailNotifications ? 'bg-primary-600' : 'bg-slate-300'
              )}
            >
              <span
                className={clsx(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  emailNotifications ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Connected Repositories Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-colors">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
          <Github size={20} />
          Connected Repositories
        </h2>

        {repositories.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No repositories connected</p>
        ) : (
          <div className="space-y-3">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    {repo.full_name}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Connected on {new Date(repo.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnect(repo.id)}
                  disabled={disconnectingRepo === repo.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {disconnectingRepo === repo.id ? 'Disconnecting...' : 'Disconnect'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Suggestions Section */}
      {suggestions.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-colors">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
            <Key size={20} />
            Pending Suggestions ({suggestions.length})
          </h2>

          <SuggestionList
            suggestions={suggestions}
            onApply={onApplySuggestion || (() => {})}
            onDismiss={onDismissSuggestion || (() => {})}
          />
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-900/50 p-6 transition-colors">
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-6 flex items-center gap-2">
          <Shield size={20} />
          Account
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200">Sign Out</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sign out of your ContextFlow account
            </p>
          </div>
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
