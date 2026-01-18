'use client'

import { Microservice } from '@/types/database'
import { GitCommit, CheckCircle, Clock, Play, Pause } from 'lucide-react'
import { clsx } from 'clsx'

interface TimelineViewProps {
  microservices: Microservice[]
  onServiceClick: (service: Microservice) => void
}

export function TimelineView({ microservices, onServiceClick }: TimelineViewProps) {
  // Sort by last update
  const sortedServices = [...microservices].sort((a, b) => {
    const dateA = new Date(a.last_update || 0).getTime()
    const dateB = new Date(b.last_update || 0).getTime()
    return dateB - dateA
  })

  // Group by date
  const groupedByDate = sortedServices.reduce((acc, service) => {
    const date = service.last_update
      ? new Date(service.last_update).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'Unknown'
    if (!acc[date]) acc[date] = []
    acc[date].push(service)
    return acc
  }, {} as Record<string, Microservice[]>)

  const statusColors: Record<string, { bg: string; icon: React.ReactNode }> = {
    'Done': { bg: 'bg-green-500', icon: <CheckCircle size={16} /> },
    'In Progress': { bg: 'bg-blue-500', icon: <Play size={16} /> },
    'Testing': { bg: 'bg-amber-500', icon: <Clock size={16} /> },
    'Backlog': { bg: 'bg-slate-400 dark:bg-slate-500', icon: <Pause size={16} /> },
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xl">📅</span>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">Timeline</h3>
        </div>
        <select className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
          <option>All Types</option>
          <option>Done</option>
          <option>In Progress</option>
          <option>Testing</option>
          <option>Backlog</option>
        </select>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

        {/* Timeline Items */}
        <div className="space-y-8">
          {Object.entries(groupedByDate).map(([date, services]) => (
            <div key={date} className="relative">
              {/* Date Marker */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 border-4 border-white dark:border-slate-800 shadow flex items-center justify-center z-10">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{date.split(' ')[0]}</span>
                </div>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{date}</span>
              </div>

              {/* Services for this date */}
              <div className="ml-16 space-y-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => onServiceClick(service)}
                    className="w-full text-left p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 transition-all hover:shadow-md group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Status Icon */}
                      <div className={clsx(
                        'w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0',
                        statusColors[service.status]?.bg || 'bg-slate-400 dark:bg-slate-500'
                      )}>
                        {statusColors[service.status]?.icon || <GitCommit size={16} />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {service.service_name}
                          </h4>
                          <span className={clsx(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            service.status === 'Done' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                            service.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                            service.status === 'Testing' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                            'bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                          )}>
                            {service.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{service.current_task}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            Progress: {service.progress}%
                          </span>
                          <span className={clsx(
                            'text-xs',
                            service.health_status === 'Healthy' ? 'text-green-600 dark:text-green-400' :
                            service.health_status === 'Stale' ? 'text-amber-600 dark:text-amber-400' :
                            'text-red-600 dark:text-red-400'
                          )}>
                            {service.health_status || 'Unknown'}
                          </span>
                        </div>
                      </div>

                      {/* Progress Ring */}
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <svg className="w-12 h-12 -rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-slate-200 dark:text-slate-600"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke={service.progress >= 100 ? '#22c55e' : '#6366f1'}
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${(service.progress / 100) * 125.6} 125.6`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-700 dark:text-slate-300">
                          {service.progress}%
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {sortedServices.length > 10 && (
          <div className="ml-16 mt-6">
            <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
              Load more...
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
