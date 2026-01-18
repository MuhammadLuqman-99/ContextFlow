'use client'

import { Repository, Microservice } from '@/types/database'
import { GitBranch, Activity, CheckCircle, TrendingUp } from 'lucide-react'
import { clsx } from 'clsx'

interface ProjectOverviewProps {
  repositories: Repository[]
  microservices: Array<Microservice & { pending_suggestions?: number }>
  onSelectRepo: (repo: Repository) => void
  selectedRepoId?: string
}

export function ProjectOverview({
  repositories,
  microservices,
  onSelectRepo,
  selectedRepoId
}: ProjectOverviewProps) {
  // Calculate overall stats
  const totalServices = microservices.length
  const healthyCount = microservices.filter(m => m.health_status === 'Healthy').length
  const staleCount = microservices.filter(m => m.health_status === 'Stale').length
  const inactiveCount = microservices.filter(m => m.health_status === 'Inactive').length

  const doneCount = microservices.filter(m => m.status === 'Done').length
  const inProgressCount = microservices.filter(m => m.status === 'In Progress').length
  const backlogCount = microservices.filter(m => m.status === 'Backlog').length

  const avgProgress = totalServices > 0
    ? Math.round(microservices.reduce((sum, m) => sum + m.progress, 0) / totalServices)
    : 0

  return (
    <div className="mb-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<GitBranch className="text-primary-500" />}
          label="Total Services"
          value={totalServices}
          subtext={`${repositories.length} repositories`}
        />
        <StatCard
          icon={<Activity className="text-green-500" />}
          label="Healthy"
          value={healthyCount}
          subtext={`${staleCount} stale, ${inactiveCount} inactive`}
          valueColor="text-green-600 dark:text-green-400"
        />
        <StatCard
          icon={<CheckCircle className="text-blue-500" />}
          label="Completed"
          value={doneCount}
          subtext={`${inProgressCount} in progress`}
          valueColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={<TrendingUp className="text-amber-500" />}
          label="Avg Progress"
          value={`${avgProgress}%`}
          subtext={`${backlogCount} in backlog`}
          valueColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Repository Cards */}
      {repositories.length > 1 && (
        <div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Your Repositories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repositories.map(repo => {
              const repoServices = microservices.filter(m => m.repository_id === repo.id)
              const repoHealthy = repoServices.filter(m => m.health_status === 'Healthy').length
              const repoDone = repoServices.filter(m => m.status === 'Done').length
              const repoProgress = repoServices.length > 0
                ? Math.round(repoServices.reduce((sum, m) => sum + m.progress, 0) / repoServices.length)
                : 0

              return (
                <button
                  key={repo.id}
                  onClick={() => onSelectRepo(repo)}
                  className={clsx(
                    'text-left p-4 rounded-xl border-2 transition-all hover:shadow-md',
                    selectedRepoId === repo.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary-300 dark:hover:border-primary-600'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200">{repo.repo_name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{repo.owner}</p>
                    </div>
                    <span className={clsx(
                      'text-xs font-medium px-2 py-1 rounded-full',
                      repoHealthy === repoServices.length && repoServices.length > 0
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    )}>
                      {repoServices.length} services
                    </span>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span>{repoDone} done</span>
                      <span>{repoProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 transition-all"
                        style={{ width: `${repoProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Health Dots */}
                  <div className="flex items-center gap-1 mt-3">
                    {repoServices.slice(0, 5).map((service, i) => (
                      <span
                        key={i}
                        className={clsx(
                          'w-2 h-2 rounded-full',
                          service.health_status === 'Healthy' ? 'bg-green-500' :
                          service.health_status === 'Stale' ? 'bg-yellow-500' :
                          service.health_status === 'Inactive' ? 'bg-red-500' :
                          'bg-slate-300 dark:bg-slate-600'
                        )}
                        title={service.service_name}
                      />
                    ))}
                    {repoServices.length > 5 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">+{repoServices.length - 5}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  valueColor = 'text-slate-800 dark:text-slate-200'
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  subtext: string
  valueColor?: string
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition-colors">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
          {icon}
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <div className={clsx('text-2xl font-bold', valueColor)}>{value}</div>
      <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtext}</div>
    </div>
  )
}
