'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Repository, Microservice } from '@/types/database'
import { Board, BoardSkeleton } from '@/components/kanban/Board'
import { SuggestionList } from '@/components/suggestions/ManifestUpdateSuggestion'
import { ConnectRepoModal } from '@/components/modals/ConnectRepoModal'
import { ServiceDetailModal } from '@/components/modals/ServiceDetailModal'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { ProjectOverview } from '@/components/dashboard/ProjectOverview'
import { StatsView } from '@/components/dashboard/StatsView'
import { TimelineView } from '@/components/dashboard/TimelineView'
import { Plus, RefreshCw, Github } from 'lucide-react'
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
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<(Microservice & { pending_suggestions?: number }) | null>(null)
  const [activeTab, setActiveTab] = useState('kanban')
  const [searchQuery, setSearchQuery] = useState('')

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
      const response = await authFetch('/api/manifests/scan', {
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

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  // Filter microservices based on search
  const filteredMicroservices = searchQuery
    ? microservices.filter(m =>
        m.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.current_task.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : microservices

  if (loading && repositories.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <BoardSkeleton />
      </div>
    )
  }

  const pendingSuggestionsCount = suggestions.length

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* New Header with Navigation */}
      <DashboardHeader
        user={user?.user_metadata || null}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSearch={handleSearch}
        onAddRepo={() => setShowConnectModal(true)}
        onRefresh={handleRefresh}
        onSignOut={handleSignOut}
        isRefreshing={loading}
        notificationCount={pendingSuggestionsCount}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {repositories.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <Github size={64} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
              No repositories connected
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
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
        ) : (
          <>
            {/* Repository Selector (for multiple repos) */}
            {repositories.length > 1 && (
              <div className="mb-6 flex items-center gap-4">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Repository:</label>
                <select
                  value={selectedRepo?.id || ''}
                  onChange={(e) => {
                    const repo = repositories.find(r => r.id === e.target.value)
                    setSelectedRepo(repo || null)
                  }}
                  className="border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {repositories.map((repo) => (
                    <option key={repo.id} value={repo.id}>
                      {repo.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tab Content */}
            {activeTab === 'kanban' && (
              <div>
                {/* Project Overview Stats */}
                <ProjectOverview
                  repositories={repositories}
                  microservices={filteredMicroservices}
                  onSelectRepo={setSelectedRepo}
                  selectedRepoId={selectedRepo?.id}
                />

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                      {selectedRepo?.full_name}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {filteredMicroservices.length} service{filteredMicroservices.length !== 1 ? 's' : ''} tracked
                      {searchQuery && ` (filtered)`}
                    </p>
                  </div>
                </div>

                {filteredMicroservices.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                      {searchQuery ? 'No services match your search' : 'No services found'}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      {searchQuery
                        ? 'Try adjusting your search query'
                        : <>Add <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">vibe.json</code> files to your repository, then click refresh to start tracking.</>
                      }
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={handleRefresh}
                        className="btn-primary flex items-center gap-2 mx-auto"
                      >
                        <RefreshCw size={16} />
                        Scan Repository
                      </button>
                    )}
                  </div>
                ) : (
                  <Board microservices={filteredMicroservices} onCardClick={setSelectedService} />
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <StatsView microservices={filteredMicroservices} />
            )}

            {activeTab === 'timeline' && (
              <TimelineView
                microservices={filteredMicroservices}
                onServiceClick={setSelectedService}
              />
            )}

            {activeTab === 'settings' && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-colors">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6">Settings</h2>

                {/* Repository Settings */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-3">Connected Repositories</h3>
                    <div className="space-y-3">
                      {repositories.map((repo) => (
                        <div key={repo.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-200">{repo.full_name}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">Connected on {new Date(repo.created_at).toLocaleDateString()}</div>
                          </div>
                          <button className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium">
                            Disconnect
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-3">Notifications</h3>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 dark:bg-slate-700" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Email me when a service status changes</span>
                    </label>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-3">Pending Suggestions ({pendingSuggestionsCount})</h3>
                    {pendingSuggestionsCount > 0 ? (
                      <SuggestionList
                        suggestions={suggestions}
                        onApply={handleApplySuggestion}
                        onDismiss={handleDismissSuggestion}
                      />
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No pending suggestions</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Connect Repository Modal */}
      <ConnectRepoModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnect={handleConnectRepo}
      />

      {/* Service Detail Modal */}
      <ServiceDetailModal
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
        service={selectedService}
        repoFullName={selectedRepo?.full_name}
      />
    </div>
  )
}
