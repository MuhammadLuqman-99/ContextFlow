'use client'

import { Microservice } from '@/types/database'
import { ServiceStatus } from '@/types/vibe-manifest'
import { Column } from './Column'
import { useState } from 'react'

interface BoardProps {
  microservices: Array<Microservice & { pending_suggestions?: number }>
  onCardClick?: (microservice: Microservice) => void
}

export function Board({ microservices, onCardClick }: BoardProps) {
  // Group microservices by status
  const groupedServices = microservices.reduce((acc, ms) => {
    if (!acc[ms.status]) {
      acc[ms.status] = []
    }
    acc[ms.status].push(ms)
    return acc
  }, {} as Record<ServiceStatus, typeof microservices>)

  const columns: Array<{ title: string; status: ServiceStatus }> = [
    { title: 'Backlog', status: 'Backlog' },
    { title: 'In Progress', status: 'In Progress' },
    { title: 'Testing', status: 'Testing' },
    { title: 'Done', status: 'Done' },
  ]

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {columns.map((column) => (
        <Column
          key={column.status}
          title={column.title}
          status={column.status}
          microservices={groupedServices[column.status] || []}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  )
}

export function BoardSkeleton() {
  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex-1 min-w-[280px]">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded mb-4 w-32" />
            <div className="kanban-column">
              <div className="kanban-card h-40 bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
