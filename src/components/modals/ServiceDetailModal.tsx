'use client'

import { X, GitCommit, Clock, ChevronRight, ExternalLink } from 'lucide-react'
import { Microservice } from '@/types/database'

interface ServiceDetailModalProps {
  isOpen: boolean
  onClose: () => void
  service: Microservice & { pending_suggestions?: number } | null
  repoFullName?: string
}

export function ServiceDetailModal({ isOpen, onClose, service, repoFullName }: ServiceDetailModalProps) {
  if (!isOpen || !service) return null

  const statusColors: Record<string, string> = {
    'Backlog': 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
    'In Progress': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    'Testing': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    'Done': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  }

  const progressColor = service.progress >= 100
    ? 'bg-green-500'
    : service.progress >= 50
      ? 'bg-blue-500'
      : 'bg-amber-500'

  const formatDate = (date: string | null) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const githubFileUrl = repoFullName
    ? `https://github.com/${repoFullName}/blob/master/${service.manifest_path}`
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden m-4">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-primary-50 dark:from-primary-900/20 to-slate-50 dark:to-slate-800">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                {service.service_name}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[service.status] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                {service.status}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">{service.current_task}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
          {/* Progress Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progress</span>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{service.progress}%</span>
            </div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${progressColor} transition-all duration-500`}
                style={{ width: `${service.progress}%` }}
              />
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <Clock size={16} />
                <span className="text-sm">Last Updated</span>
              </div>
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {formatDate(service.last_update)}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <GitCommit size={16} />
                <span className="text-sm">Last Commit</span>
              </div>
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {formatDate(service.last_commit_date)}
              </p>
            </div>
          </div>

          {/* Health Status */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Health Status</h3>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                service.health_status === 'Healthy' ? 'bg-green-500' :
                service.health_status === 'Stale' ? 'bg-yellow-500' :
                service.health_status === 'Inactive' ? 'bg-red-500' :
                'bg-slate-300 dark:bg-slate-600'
              }`} />
              <span className="text-slate-800 dark:text-slate-200">{service.health_status || 'Unknown'}</span>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Next Steps</h3>
            {service.next_steps && service.next_steps.length > 0 ? (
              <ul className="space-y-2">
                {service.next_steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <ChevronRight size={18} className="text-primary-500 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{step}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 italic">No next steps defined</p>
            )}
          </div>

          {/* Manifest Path */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Manifest Location</h3>
            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3 font-mono text-sm text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{service.manifest_path}</span>
              {githubFileUrl && (
                <a
                  href={githubFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
                >
                  <ExternalLink size={14} />
                  View on GitHub
                </a>
              )}
            </div>
          </div>

          {/* Pending Suggestions */}
          {service.pending_suggestions && service.pending_suggestions > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-amber-800 dark:text-amber-300">
                <span className="font-semibold">{service.pending_suggestions}</span> pending suggestion{service.pending_suggestions > 1 ? 's' : ''} for this service
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
