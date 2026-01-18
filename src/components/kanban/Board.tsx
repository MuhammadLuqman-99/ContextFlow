'use client'

import { Microservice, GeneratedTask, KanbanItem } from '@/types/database'
import { ServiceStatus } from '@/types/vibe-manifest'
import { Column } from './Column'
import { useMemo } from 'react'

interface BoardProps {
  microservices: Array<Microservice & { pending_suggestions?: number }>
  onCardClick?: (microservice: Microservice) => void
  onPromoteTask?: (task: GeneratedTask) => void
  onDismissTask?: (task: GeneratedTask) => void
}

/**
 * Extract next steps from Done microservices and create generated tasks
 * These will appear in the Backlog column as suggestions for next work
 */
function extractGeneratedTasks(
  microservices: Array<Microservice & { pending_suggestions?: number }>
): GeneratedTask[] {
  const generatedTasks: GeneratedTask[] = []

  // Get all Done microservices with non-empty next_steps
  const doneWithNextSteps = microservices.filter(
    (ms) => ms.status === 'Done' && ms.next_steps && ms.next_steps.length > 0
  )

  for (const ms of doneWithNextSteps) {
    ms.next_steps.forEach((step, index) => {
      generatedTasks.push({
        id: `${ms.id}-next-${index}`,
        title: step,
        source_microservice_id: ms.id,
        source_service_name: ms.service_name,
        source_manifest_path: ms.manifest_path,
        step_index: index,
        status: 'Backlog',
        is_generated: true,
        created_from_status: 'Done',
      })
    })
  }

  return generatedTasks
}

export function Board({ microservices, onCardClick, onPromoteTask, onDismissTask }: BoardProps) {
  // Generate tasks from Done services' next_steps
  const generatedTasks = useMemo(
    () => extractGeneratedTasks(microservices),
    [microservices]
  )

  // Group microservices by status
  const groupedItems = useMemo(() => {
    const groups: Record<ServiceStatus, KanbanItem[]> = {
      Backlog: [],
      'In Progress': [],
      Testing: [],
      Done: [],
    }

    // Add microservices to their respective columns
    for (const ms of microservices) {
      groups[ms.status].push(ms)
    }

    // Add generated tasks to Backlog
    groups.Backlog.push(...generatedTasks)

    return groups
  }, [microservices, generatedTasks])

  const columns: Array<{ title: string; status: ServiceStatus }> = [
    { title: 'Backlog', status: 'Backlog' },
    { title: 'In Progress', status: 'In Progress' },
    { title: 'Testing', status: 'Testing' },
    { title: 'Done', status: 'Done' },
  ]

  return (
    <div className="flex gap-4 pb-4">
      {columns.map((column) => (
        <Column
          key={column.status}
          title={column.title}
          status={column.status}
          items={groupedItems[column.status]}
          onCardClick={onCardClick}
          onPromoteTask={onPromoteTask}
          onDismissTask={onDismissTask}
        />
      ))}
    </div>
  )
}

export function BoardSkeleton() {
  return (
    <div className="flex gap-4 pb-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex-1 min-w-[250px] flex flex-col">
          <div className="animate-pulse flex-shrink-0 mb-3">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mb-2 w-32" />
            <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
          <div className="kanban-column dark:bg-slate-800/50">
            <div className="space-y-3">
              <div className="kanban-card h-32 bg-slate-100 dark:bg-slate-700" />
              <div className="kanban-card h-24 bg-slate-100 dark:bg-slate-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
