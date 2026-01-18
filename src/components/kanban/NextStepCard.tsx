'use client'

import { GeneratedTask } from '@/types/database'

interface NextStepCardProps {
  task: GeneratedTask
  onPromote?: (task: GeneratedTask) => void
  onDismiss?: (task: GeneratedTask) => void
}

export function NextStepCard({ task, onPromote, onDismiss }: NextStepCardProps) {
  return (
    <div className="kanban-card bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-l-4 border-l-amber-500">
      {/* Header with generated badge */}
      <div className="flex items-start justify-between mb-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Next Step
        </span>
      </div>

      {/* Task title */}
      <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
        {task.title}
      </h4>

      {/* Source info */}
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        From: <span className="font-medium">{task.source_service_name}</span>
      </p>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-2 border-t border-amber-200 dark:border-amber-800/50">
        {onPromote && (
          <button
            onClick={() => onPromote(task)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Start Working
          </button>
        )}
        {onDismiss && (
          <button
            onClick={() => onDismiss(task)}
            className="px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}

export function NextStepCardSkeleton() {
  return (
    <div className="kanban-card bg-amber-50/50 dark:bg-amber-900/10 animate-pulse">
      <div className="h-4 w-20 bg-amber-200 dark:bg-amber-800/50 rounded mb-2" />
      <div className="h-5 w-full bg-amber-100 dark:bg-amber-800/30 rounded mb-2" />
      <div className="h-3 w-24 bg-amber-100 dark:bg-amber-800/30 rounded" />
    </div>
  )
}
