'use client'

import { Microservice } from '@/types/database'
import { ServiceStatus } from '@/types/vibe-manifest'
import { Card, EmptyCard } from './Card'
import { clsx } from 'clsx'

interface ColumnProps {
  title: string
  status: ServiceStatus
  microservices: Array<Microservice & { pending_suggestions?: number }>
  onCardClick?: (microservice: Microservice) => void
}

export function Column({ title, status, microservices, onCardClick }: ColumnProps) {
  const statusColors = {
    Backlog: 'bg-slate-500',
    'In Progress': 'bg-primary-500',
    Testing: 'bg-status-stale',
    Done: 'bg-status-healthy',
  }

  const count = microservices.length

  return (
    <div className="flex-1 min-w-[280px]">
      {/* Column Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={clsx('w-3 h-3 rounded-full', statusColors[status])} />
          <h2 className="font-semibold text-slate-800 text-lg">{title}</h2>
          <span className="bg-slate-200 text-slate-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <div className="h-1 bg-slate-200 rounded-full">
          <div
            className={clsx('h-full rounded-full transition-all', statusColors[status])}
            style={{ width: count > 0 ? '100%' : '0%' }}
          />
        </div>
      </div>

      {/* Column Content */}
      <div className="kanban-column">
        {microservices.length === 0 ? (
          <EmptyCard message={`No services in ${title.toLowerCase()}`} />
        ) : (
          <div className="space-y-3">
            {microservices.map((ms) => (
              <Card
                key={ms.id}
                microservice={ms}
                onClick={() => onCardClick?.(ms)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
