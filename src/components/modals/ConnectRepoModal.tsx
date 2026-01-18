'use client'

import { useState, useEffect } from 'react'
import { X, Github, Loader2, Search, Lock, Unlock } from 'lucide-react'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabase/client'

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  owner: string
  private: boolean
  description: string | null
  updated_at: string
}

interface ConnectRepoModalProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (owner: string, repo: string) => Promise<void>
}

export function ConnectRepoModal({ isOpen, onClose, onConnect }: ConnectRepoModalProps) {
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadAvailableRepos()
    }
  }, [isOpen])

  const loadAvailableRepos = async () => {
    setLoading(true)
    setError(null)
    try {
      // Get auth token for the request
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch('/api/repos?available=true', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      })
      const data = await response.json()

      if (data.success) {
        setRepos(data.data)
      } else {
        setError(data.error || 'Failed to load repositories')
      }
    } catch (err) {
      setError('Failed to load repositories')
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (repo: GitHubRepo) => {
    setConnecting(repo.full_name)
    try {
      await onConnect(repo.owner, repo.name)
      onClose()
    } catch (err) {
      setError('Failed to connect repository')
    } finally {
      setConnecting(null)
    }
  }

  const filteredRepos = repos.filter(repo =>
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg">
              <Github className="text-primary-600 dark:text-primary-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Connect Repository</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Select a repository to track with ContextFlow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary-500" size={32} />
              <span className="ml-3 text-slate-600 dark:text-slate-400">Loading repositories...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={loadAvailableRepos}
                className="btn-secondary"
              >
                Try Again
              </button>
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              {searchQuery
                ? 'No repositories match your search'
                : 'No repositories available to connect'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRepos.map((repo) => (
                <div
                  key={repo.id}
                  className={clsx(
                    'flex items-center justify-between p-4 rounded-lg border transition-all',
                    connecting === repo.full_name
                      ? 'border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {repo.full_name}
                      </span>
                      {repo.private ? (
                        <Lock size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      ) : (
                        <Unlock size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">
                        {repo.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleConnect(repo)}
                    disabled={connecting !== null}
                    className={clsx(
                      'ml-4 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex-shrink-0',
                      connecting === repo.full_name
                        ? 'bg-primary-500 text-white'
                        : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50'
                    )}
                  >
                    {connecting === repo.full_name ? (
                      <>
                        <Loader2 size={14} className="inline animate-spin mr-2" />
                        Connecting...
                      </>
                    ) : (
                      'Connect'
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            ContextFlow will scan for <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">vibe.json</code> files
            and set up a webhook for real-time updates.
          </p>
        </div>
      </div>
    </div>
  )
}
