'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Repository, Microservice, GeneratedTask } from '@/types/database'
import { Board, BoardSkeleton } from '@/components/kanban/Board'
import { SuggestionList } from '@/components/suggestions/ManifestUpdateSuggestion'
import { ConnectRepoModal } from '@/components/modals/ConnectRepoModal'
import { ServiceDetailModal } from '@/components/modals/ServiceDetailModal'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProjectOverview } from '@/components/dashboard/ProjectOverview'
import { StatsView } from '@/components/dashboard/StatsView'
import { TimelineView } from '@/components/dashboard/TimelineView'
import { BlueprintView } from '@/components/dashboard/BlueprintView'
import { SettingsView } from '@/components/dashboard/SettingsView'
import { ShareModal } from '@/components/dashboard/ShareModal'
import { exportDashboardToPDF } from '@/lib/export/pdf'
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
  const [dismissedTasks, setDismissedTasks] = useState<Set<string>>(new Set())
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | undefined>(undefined)
  const [isExporting, setIsExporting] = useState(false)

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

  // Real-time subscription to microservices changes
  useEffect(() => {
    if (!selectedRepo) return

    const channel = supabase
      .channel(`microservices-${selectedRepo.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'microservices',
          filter: `repository_id=eq.${selectedRepo.id}`,
        },
        (payload) => {
          console.log('Real-time update:', payload)

          if (payload.eventType === 'INSERT') {
            setMicroservices(prev => [...prev, payload.new as any])
            toast.success(`New service added: ${(payload.new as any).service_name}`)
          } else if (payload.eventType === 'UPDATE') {
            setMicroservices(prev =>
              prev.map(ms =>
                ms.id === payload.new.id ? { ...ms, ...payload.new } : ms
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setMicroservices(prev => prev.filter(ms => ms.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedRepo])

  // Real-time subscription to suggestions changes
  useEffect(() => {
    if (!selectedRepo) return

    // Get microservice IDs for this repo
    const msIds = microservices.map(ms => ms.id)
    if (msIds.length === 0) return

    const channel = supabase
      .channel(`suggestions-${selectedRepo.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'commit_suggestions',
        },
        (payload) => {
          // Check if this suggestion is for one of our microservices
          if (msIds.includes((payload.new as any).microservice_id)) {
            loadSuggestions(selectedRepo.id)
            toast.info('New commit suggestion available!')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedRepo, microservices])

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

  const handleDisconnectRepo = async (repoId: string) => {
    try {
      const response = await authFetch(`/api/repos/${repoId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setRepositories(prev => prev.filter(r => r.id !== repoId))
        if (selectedRepo?.id === repoId) {
          setSelectedRepo(repositories.find(r => r.id !== repoId) || null)
          setMicroservices([])
          setSuggestions([])
        }
        toast.success('Repository disconnected')
      } else {
        toast.error(data.error || 'Failed to disconnect repository')
      }
    } catch (error) {
      console.error('Failed to disconnect repository:', error)
      toast.error('Failed to disconnect repository')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  // Load share URL when repo changes
  useEffect(() => {
    if (selectedRepo && accessToken) {
      loadShareUrl(selectedRepo.id)
    } else {
      setShareUrl(undefined)
    }
  }, [selectedRepo, accessToken])

  const loadShareUrl = async (repoId: string) => {
    try {
      const response = await authFetch(`/api/repos/${repoId}/share`)
      const data = await response.json()
      if (data.success && data.data.share_url) {
        setShareUrl(data.data.share_url)
      } else {
        setShareUrl(undefined)
      }
    } catch (error) {
      console.error('Failed to load share URL:', error)
      setShareUrl(undefined)
    }
  }

  const handleGenerateShareLink = async (): Promise<string> => {
    if (!selectedRepo) throw new Error('No repository selected')

    const response = await authFetch(`/api/repos/${selectedRepo.id}/share`, {
      method: 'POST',
    })

    const data = await response.json()

    if (data.success) {
      setShareUrl(data.data.share_url)
      return data.data.share_url
    } else {
      throw new Error(data.error || 'Failed to generate share link')
    }
  }

  const handleRevokeShareLink = async (): Promise<void> => {
    if (!selectedRepo) throw new Error('No repository selected')

    const response = await authFetch(`/api/repos/${selectedRepo.id}/share`, {
      method: 'DELETE',
    })

    const data = await response.json()

    if (data.success) {
      setShareUrl(undefined)
    } else {
      throw new Error(data.error || 'Failed to revoke share link')
    }
  }

  // Handle exporting dashboard to PDF
  const handleExport = async () => {
    if (!selectedRepo || microservices.length === 0) {
      toast.error('No data to export')
      return
    }

    setIsExporting(true)
    try {
      await exportDashboardToPDF({
        repository: selectedRepo,
        microservices: microservices,
        includeDetails: true,
      })
      toast.success('PDF exported successfully!')
    } catch (error) {
      console.error('Failed to export PDF:', error)
      toast.error('Failed to export PDF')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle promoting a next step to "In Progress"
  // This updates the source vibe.json to move the step from nextSteps to currentTask
  const handlePromoteTask = async (task: GeneratedTask) => {
    if (!selectedRepo) return

    try {
      // Find the source microservice
      const sourceMicroservice = microservices.find(ms => ms.id === task.source_microservice_id)
      if (!sourceMicroservice) {
        toast.error('Source service not found')
        return
      }

      // Create an API call to update the manifest
      // This will update the vibe.json on GitHub
      const response = await authFetch(`/api/manifests/${sourceMicroservice.id}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: task.title,
          stepIndex: task.step_index,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Started working on: ${task.title}`)
        await loadMicroservices(selectedRepo.id)
      } else {
        toast.error(data.error || 'Failed to promote task')
      }
    } catch (error) {
      console.error('Failed to promote task:', error)
      toast.error('Failed to promote task')
    }
  }

  // Handle dismissing a next step (hide it from the board)
  const handleDismissTask = (task: GeneratedTask) => {
    setDismissedTasks(prev => new Set([...prev, task.id]))
    toast.success('Task dismissed from backlog')
  }

  // Handle drag-and-drop status change
  const handleStatusChange = async (microserviceId: string, newStatus: string) => {
    try {
      const response = await authFetch(`/api/manifests/${microserviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        // Update local state optimistically
        setMicroservices(prev =>
          prev.map(ms =>
            ms.id === microserviceId
              ? { ...ms, status: newStatus as any, last_update: new Date().toISOString() }
              : ms
          )
        )
        toast.success(`Moved to ${newStatus}`)
      } else {
        toast.error(data.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update status')
    }
  }

  // Filter microservices based on search
  const filteredMicroservices = searchQuery
    ? microservices.filter(m =>
        m.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.current_task.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : microservices

  // Filter out dismissed next steps from microservices
  // We modify the next_steps array to exclude dismissed tasks
  const microservicesWithFilteredNextSteps = filteredMicroservices.map(ms => {
    if (ms.status === 'Done' && ms.next_steps && ms.next_steps.length > 0) {
      const filteredNextSteps = ms.next_steps.filter((_, index) => {
        const taskId = `${ms.id}-next-${index}`
        return !dismissedTasks.has(taskId)
      })
      return { ...ms, next_steps: filteredNextSteps }
    }
    return ms
  })

  if (loading && repositories.length === 0) {
    return (
      <div className="h-screen flex bg-slate-50 dark:bg-slate-900">
        <Sidebar
          user={user?.user_metadata || null}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSignOut={handleSignOut}
        />
        <div className="flex-1 p-6">
          <BoardSkeleton />
        </div>
      </div>
    )
  }

  const pendingSuggestionsCount = suggestions.length

  // Transform suggestions into notifications format
  const notifications = suggestions.map((s: any) => ({
    id: s.id,
    type: 'suggestion' as const,
    title: `Update suggested for ${s.service_name || 'service'}`,
    message: s.commit_message || 'A manifest update is available based on recent commits',
    timestamp: s.created_at || new Date().toISOString(),
    microservice_id: s.microservice_id,
    service_name: s.service_name,
  }))

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        user={user?.user_metadata || null}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Simplified Header */}
        <DashboardHeader
          user={user?.user_metadata || null}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSearch={handleSearch}
          onAddRepo={() => setShowConnectModal(true)}
          onRefresh={handleRefresh}
          onSignOut={handleSignOut}
          onShare={() => setShowShareModal(true)}
          onExport={handleExport}
          isExporting={isExporting}
          isRefreshing={loading}
          notificationCount={pendingSuggestionsCount}
          notifications={notifications}
          onApplyNotification={handleApplySuggestion}
          onDismissNotification={handleDismissSuggestion}
          repositories={repositories}
          selectedRepo={selectedRepo}
          onSelectRepo={setSelectedRepo}
        />

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto px-6 py-4">
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
            {/* Tab Content */}
            {activeTab === 'kanban' && (
              <div className="space-y-4">
                {/* Project Overview Stats */}
                <ProjectOverview
                  repositories={repositories}
                  microservices={filteredMicroservices}
                  onSelectRepo={setSelectedRepo}
                  selectedRepoId={selectedRepo?.id}
                />

                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                      {selectedRepo?.full_name}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {filteredMicroservices.length} service{filteredMicroservices.length !== 1 ? 's' : ''} tracked
                      {searchQuery && ` (filtered)`}
                    </p>
                  </div>
                </div>

                {/* Board Container */}
                <div>
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
                    <Board
                      microservices={microservicesWithFilteredNextSteps}
                      onCardClick={setSelectedService}
                      onPromoteTask={handlePromoteTask}
                      onDismissTask={handleDismissTask}
                      onStatusChange={handleStatusChange}
                    />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'blueprint' && (
              <BlueprintView
                microservices={filteredMicroservices}
                repoFullName={selectedRepo?.full_name}
                repoId={selectedRepo?.id}
              />
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
              <SettingsView
                user={user ? { id: user.id, ...user.user_metadata } : null}
                repositories={repositories}
                suggestions={suggestions}
                onDisconnectRepo={handleDisconnectRepo}
                onApplySuggestion={handleApplySuggestion}
                onDismissSuggestion={handleDismissSuggestion}
                onSignOut={handleSignOut}
              />
            )}
          </>
        )}
        </main>
      </div>

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

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        repoName={selectedRepo?.full_name || ''}
        shareUrl={shareUrl}
        onGenerateLink={handleGenerateShareLink}
        onRevokeLink={handleRevokeShareLink}
      />
    </div>
  )
}
