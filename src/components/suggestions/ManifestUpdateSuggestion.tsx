'use client'

import { CommitSuggestion } from '@/types/database'
import { Check, X, GitCommit } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'

interface SuggestionProps {
  suggestion: CommitSuggestion & {
    microservices?: {
      service_name: string
      manifest_path: string
      status: string
    }
  }
  onApply: (suggestionId: string) => Promise<void>
  onDismiss: (suggestionId: string) => Promise<void>
}

export function ManifestUpdateSuggestion({ suggestion, onApply, onDismiss }: SuggestionProps) {
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const handleApply = async () => {
    setLoading(true)
    try {
      await onApply(suggestion.id)
    } catch (error) {
      console.error('Failed to apply suggestion:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async () => {
    setLoading(true)
    try {
      await onDismiss(suggestion.id)
      setDismissed(true)
    } catch (error) {
      console.error('Failed to dismiss suggestion:', error)
      setLoading(false)
    }
  }

  if (dismissed) {
    return null
  }

  const changes: string[] = []
  if (suggestion.parsed_status) {
    changes.push(`Status → ${suggestion.parsed_status}`)
  }
  if (suggestion.parsed_next_steps && suggestion.parsed_next_steps.length > 0) {
    changes.push(`Next Steps: ${suggestion.parsed_next_steps.join(', ')}`)
  }

  return (
    <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="bg-primary-500 rounded p-1.5">
            <GitCommit size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-slate-800 dark:text-slate-200 mb-1">
              Suggestion for {suggestion.microservices?.service_name}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {suggestion.commit_message}
            </div>
          </div>
        </div>
      </div>

      {/* Changes */}
      {changes.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 mb-3 border border-primary-100 dark:border-primary-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Detected Changes:</div>
          <ul className="space-y-1">
            {changes.map((change, index) => (
              <li key={index} className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="text-primary-500 dark:text-primary-400">→</span>
                {change}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Commit Info */}
      <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        Commit: <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">{suggestion.commit_sha.slice(0, 7)}</code>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleApply}
          disabled={loading}
          className={clsx(
            'btn-success flex items-center gap-2 flex-1',
            loading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Check size={16} />
          {loading ? 'Applying...' : 'Apply to vibe.json'}
        </button>
        <button
          onClick={handleDismiss}
          disabled={loading}
          className={clsx(
            'btn-secondary flex items-center gap-2',
            loading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <X size={16} />
          Dismiss
        </button>
      </div>
    </div>
  )
}

interface SuggestionListProps {
  suggestions: Array<CommitSuggestion & {
    microservices?: {
      service_name: string
      manifest_path: string
      status: string
    }
  }>
  onApply: (suggestionId: string) => Promise<void>
  onDismiss: (suggestionId: string) => Promise<void>
}

export function SuggestionList({ suggestions, onApply, onDismiss }: SuggestionListProps) {
  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        No pending suggestions
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion) => (
        <ManifestUpdateSuggestion
          key={suggestion.id}
          suggestion={suggestion}
          onApply={onApply}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
}
