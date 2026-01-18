'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Repository, Microservice } from '@/types/database'
import { Board, BoardSkeleton } from '@/components/kanban/Board'
import { SuggestionList } from '@/components/suggestions/ManifestUpdateSuggestion'
import { ConnectRepoModal } from '@/components/modals/ConnectRepoModal'
import { Plus, RefreshCw, Github, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface User {
  id: string
  user_metadata: {
    avatar_url?: string
    user_name?: string
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [microservices, setMicroservices] = useState<Array<Microservice & { pending_suggestions?: number }>>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // Helper for authenticated API calls
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    })
  }

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (selectedRepo && accessToken) {
      loadMicroservices(selectedRepo.id)
      loadSuggestions(selectedRepo.id)
    }
  }, [selectedRepo, accessToken])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    setUser(session.user as User)
    setAccessToken(session.access_token)
    loadRepositories()
  }

  const loadRepositories = async () => {
    try {
      const response = await authFetch('/api/repos')
      const data = await response.json()

      if (data.success) {
        setRepositories(data.data)
        if (data.data.length > 0 && !selectedRepo) {
          setSelectedRepo(data.data[0])
        }
      } else if (response.status === 401) {
        // Session might have expired, try to refresh
        router.push('/login')
      }
    } catch (error) {
      console.error('Failed to load repositories:', error)
      toast.error('Failed to load repositories')
    } finally {
      setLoading(false)
    }
  }

  const loadMicroservices = async (repoId: string) => {
    try {
      const response = await authFetch(`/api/manifests?repoId=${repoId}`)
      const data = await response.json()

      if (data.success) {
        const servicesWithSuggestions = data.data.map((ms: any) => ({
          ...ms,
          pending_suggestions: ms.pending_suggestions?.length || 0,
        }))
        setMicroservices(servicesWithSuggestions)
      }
    } catch (error) {
      console.error('Failed to load microservices:', error)
    }
  }

  const loadSuggestions = async (repoId: string) => {
    try {
      const response = await authFetch(`/api/suggestions?repoId=${repoId}`)
      const data = await response.json()

      if (data.success) {
        setSuggestions(data.data)
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    }
  }

  const handleRefresh = async () => {
    if (!selectedRepo) return

    setLoading(true)
    try {
      const response = await fetch('/api/manifests/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId: selectedRepo.id }),
      })

      const data = await response.json()

      if (data.success) {
        await loadMicroservices(selectedRepo.id)
        toast.success(`Scan complete! Created: ${data.data.created}, Updated: ${data.data.updated}`)
      } else {
        toast.error(data.error || 'Failed to scan repository')
      }
    } catch (error) {
      console.error('Failed to scan repository:', error)
      toast.error('Failed to scan repository')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectRepo = async (owner: string, repo: string) => {
    const response = await authFetch('/api/repos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, repo }),
    })

    const data = await response.json()

    if (data.success) {
      toast.success(`Connected ${owner}/${repo}! Found ${data.data.manifests_found} services.`)
      await loadRepositories()
      if (data.data.repository) {
        setSelectedRepo(data.data.repository)
      }
    } else {
      toast.error(data.error || 'Failed to connect repository')
      throw new Error(data.error)
    }
  }

  const handleApplySuggestion = async (suggestionId: string) => {
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Suggestion applied! vibe.json updated on GitHub.')
        if (selectedRepo) {
          await loadMicroservices(selectedRepo.id)
          await loadSuggestions(selectedRepo.id)
        }
      } else {
        toast.error(`Failed to apply suggestion: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to apply suggestion:', error)
      toast.error('Failed to apply suggestion')
    }
  }

  const handleDismissSuggestion = async (suggestionId: string) => {
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuggestions(suggestions.filter(s => s.id !== suggestionId))
        toast.success('Suggestion dismissed')
      }
    } catch (error) {
      console.error('Failed to dismiss suggestion:', error)
      toast.error('Failed to dismiss suggestion')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading && repositories.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <BoardSkeleton />
      </div>
    )
  }

  const pendingSuggestionsCount = suggestions.length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                ContextFlow
              </h1>

              {/* Repository Selector */}
              {repositories.length > 0 && (
                <select
                  value={selectedRepo?.id || ''}
                  onChange={(e) => {
                    const repo = repositories.find(r => r.id === e.target.value)
                    setSelectedRepo(repo || null)
                  }}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {repositories.map((repo) => (
                    <option key={repo.id} value={repo.id}>
                      {repo.full_name}
                    </option>
                  ))}
                </select>
              )}

              {/* Add Repo Button */}
              <button
                onClick={() => setShowConnectModal(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Plus size={16} />
                Add Repo
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Suggestions Badge */}
              {pendingSuggestionsCount > 0 && (
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="relative btn-secondary flex items-center gap-2"
                >
                  <span>Suggestions</span>
                  <span className="bg-primary-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingSuggestionsCount}
                  </span>
                </button>
              )}

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={loading || !selectedRepo}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Scan Repo
              </button>

              {/* User Menu */}
              <div className="flex items-center gap-2 pl-2 border-l">
                <img
                  src={user?.user_metadata?.avatar_url || '/default-avatar.png'}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full"
                />
                <button
                  onClick={handleSignOut}
                  className="btn-secondary flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {repositories.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <Github size={64} className="mx-auto mb-4 text-slate-300" />
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">
              No repositories connected
            </h2>
            <p className="text-slate-600 mb-6">
              Connect a GitHub repository to start tracking your microservices
            </p>
            <button
              onClick={() => setShowConnectModal(true)}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <Plus size={20} />
              Connect Repository
            </button>
          </div>
        ) : showSuggestions ? (
          /* Suggestions View */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800">
                Pending Suggestions ({pendingSuggestionsCount})
              </h2>
              <button
                onClick={() => setShowSuggestions(false)}
                className="btn-secondary"
              >
                Back to Board
              </button>
            </div>

            <SuggestionList
              suggestions={suggestions}
              onApply={handleApplySuggestion}
              onDismiss={handleDismissSuggestion}
            />
          </div>
        ) : (
          /* Kanban Board */
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  {selectedRepo?.full_name}
                </h2>
                <p className="text-sm text-slate-600">
                  {microservices.length} service{microservices.length !== 1 ? 's' : ''} tracked
                </p>
              </div>
            </div>

            {microservices.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-slate-300">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  No services found
                </h3>
                <p className="text-slate-600 mb-6">
                  Add <code className="bg-slate-100 px-2 py-1 rounded">vibe.json</code> files to your repository,
                  then click "Scan Repo" to start tracking.
                </p>
                <button
                  onClick={handleRefresh}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  <RefreshCw size={16} />
                  Scan Repository
                </button>
              </div>
            ) : (
              <Board microservices={microservices} />
            )}
          </div>
        )}
      </main>

      {/* Connect Repository Modal */}
      <ConnectRepoModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnect={handleConnectRepo}
      />
    </div>
  )
}
