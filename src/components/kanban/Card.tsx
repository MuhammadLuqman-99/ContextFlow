'use client'

import { Microservice } from '@/types/database'
import { StatusIndicator, HealthBadge } from '@/components/health/StatusIndicator'
import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { clsx } from 'clsx'

interface CardProps {
  microservice: Microservice & {
    pending_suggestions?: number
  }
  onClick?: () => void
}

export function Card({ microservice, onClick }: CardProps) {
  const progressColor = () => {
    if (microservice.progress === 100) return 'bg-status-healthy'
    if (microservice.progress >= 50) return 'bg-primary-500'
    if (microservice.progress >= 25) return 'bg-status-stale'
    return 'bg-slate-300'
  }

  const hasSuggestions = (microservice.pending_suggestions || 0) > 0

  return (
    <div
      className={clsx(
        'kanban-card group relative',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {/* Suggestion Badge */}
      {hasSuggestions && (
        <div className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg z-10 animate-pulse">
          {microservice.pending_suggestions}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {microservice.service_name}
        </h3>
        <StatusIndicator
          status={microservice.health_status}
          showLabel={false}
          size="sm"
        />
      </div>

      {/* Current Task */}
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
        {microservice.current_task}
      </p>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">Progress</span>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {microservice.progress}%
          </span>
        </div>
        <div className="progress-bar dark:bg-slate-700">
          <div
            className={clsx('progress-fill', progressColor())}
            style={{ width: `${microservice.progress}%` }}
          />
        </div>
      </div>

      {/* Next Steps */}
      {microservice.next_steps && microservice.next_steps.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Next Steps:</div>
          <ul className="space-y-1">
            {microservice.next_steps.slice(0, 2).map((step, index) => (
              <li key={index} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <Circle size={12} className="mt-0.5 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                <span className="line-clamp-1">{step}</span>
              </li>
            ))}
          </ul>
          {microservice.next_steps.length > 2 && (
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              +{microservice.next_steps.length - 2} more
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <HealthBadge
          status={microservice.health_status}
          lastCommitDate={microservice.last_commit_date}
        />
        {hasSuggestions && (
          <div className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 font-medium">
            <Clock size={12} />
            <span>Suggestions</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function EmptyCard({ message }: { message: string }) {
  return (
    <div className="kanban-card border-dashed border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-center py-8">
      <div className="text-slate-400 dark:text-slate-500 text-sm">{message}</div>
    </div>
  )
}
