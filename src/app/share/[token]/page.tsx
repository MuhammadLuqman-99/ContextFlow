'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Board, BoardSkeleton } from '@/components/kanban/Board'
import { ProjectOverview } from '@/components/dashboard/ProjectOverview'
import { Repository, Microservice } from '@/types/database'
import { Eye, Lock, Github } from 'lucide-react'
import Link from 'next/link'

interface SharedDashboard {
  repository: Repository
  microservices: Microservice[]
  owner: {
    avatar_url?: string
    user_name?: string
  }
}

export default function SharedDashboardPage() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SharedDashboard | null>(null)

  useEffect(() => {
    if (token) {
      loadSharedDashboard()
    }
  }, [token])

  const loadSharedDashboard = async () => {
    try {
      const response = await fetch(`/api/share/${token}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to load shared dashboard')
      }
    } catch (err) {
      console.error('Error loading shared dashboard:', err)
      setError('Failed to load shared dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-xl font-bold text-primary-600 dark:text-primary-400">
                ContextFlow
              </Link>
              <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded">
                <Eye size={12} />
                Shared View
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <BoardSkeleton />
        </main>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            Dashboard Not Found
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
            {error || 'This shared link may have expired or been revoked by the owner.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Go to ContextFlow
          </Link>
        </div>
      </div>
    )
  }

  const { repository, microservices, owner } = data

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold text-primary-600 dark:text-primary-400">
              ContextFlow
            </Link>
            <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded">
              <Eye size={12} />
              Read-Only View
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Owner info */}
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>Shared by</span>
              {owner.avatar_url ? (
                <img
                  src={owner.avatar_url}
                  alt={owner.user_name || 'User'}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700" />
              )}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {owner.user_name || 'Unknown'}
              </span>
            </div>

            <Link
              href="/login"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Github size={16} />
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Project Info */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
            {repository.full_name}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {microservices.length} service{microservices.length !== 1 ? 's' : ''} tracked
          </p>
        </div>

        {/* Project Overview Stats */}
        <ProjectOverview
          repositories={[repository]}
          microservices={microservices}
          onSelectRepo={() => {}}
          selectedRepoId={repository.id}
        />

        {/* Kanban Board */}
        <div className="mt-6">
          {microservices.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                No services found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                This repository doesn't have any tracked services yet.
              </p>
            </div>
          ) : (
            <Board
              microservices={microservices}
              onCardClick={() => {}}
              onPromoteTask={() => {}}
              onDismissTask={() => {}}
              onStatusChange={() => {}}
            />
          )}
        </div>

        {/* Read-only notice */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Lock size={14} />
          <span>This is a read-only view. Sign in with GitHub to manage your own projects.</span>
        </div>
      </main>
    </div>
  )
}
