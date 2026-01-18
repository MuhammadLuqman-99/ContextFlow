'use client'

import { Microservice, GeneratedTask, KanbanItem } from '@/types/database'
import { ServiceStatus } from '@/types/vibe-manifest'
import { DraggableCard, EmptyCard } from './Card'
import { NextStepCard } from './NextStepCard'
import { clsx } from 'clsx'
import { useDroppable } from '@dnd-kit/core'

// Type guard to check if item is a generated task
function isGeneratedTask(item: KanbanItem): item is GeneratedTask {
  return 'is_generated' in item && item.is_generated === true
}

interface ColumnProps {
  title: string
  status: ServiceStatus
  items: KanbanItem[]
  onCardClick?: (microservice: Microservice) => void
  onPromoteTask?: (task: GeneratedTask) => void
  onDismissTask?: (task: GeneratedTask) => void
  isOver?: boolean
}

export function Column({ title, status, items, onCardClick, onPromoteTask, onDismissTask, isOver }: ColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
  })
  const statusColors = {
    Backlog: 'bg-slate-500',
    'In Progress': 'bg-primary-500',
    Testing: 'bg-status-stale',
    Done: 'bg-status-healthy',
  }

  // Separate microservices and generated tasks
  const microservices = items.filter((item): item is Microservice & { pending_suggestions?: number } => !isGeneratedTask(item))
  const generatedTasks = items.filter(isGeneratedTask)

  const totalCount = items.length
  const generatedCount = generatedTasks.length

  return (
    <div className="flex-1 min-w-[250px] flex flex-col">
      {/* Column Header - Fixed */}
      <div className="flex-shrink-0 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={clsx('w-3 h-3 rounded-full', statusColors[status])} />
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">{title}</h2>
          <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium px-2 py-0.5 rounded-full">
            {totalCount}
          </span>
          {generatedCount > 0 && (
            <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-medium px-2 py-0.5 rounded-full">
              +{generatedCount} next steps
            </span>
          )}
        </div>
        <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full">
          <div
            className={clsx('h-full rounded-full transition-all', statusColors[status])}
            style={{ width: totalCount > 0 ? '100%' : '0%' }}
          />
        </div>
      </div>

      {/* Column Content - Droppable Zone */}
      <div className="flex-1" ref={setNodeRef}>
        <div className={clsx(
          'kanban-column transition-all duration-200',
          isOver && 'ring-2 ring-primary-500 ring-offset-2 bg-primary-50 dark:bg-primary-900/20'
        )}>
          {items.length === 0 ? (
            <EmptyCard message={`No services in ${title.toLowerCase()}`} />
          ) : (
            <div className="space-y-3 pb-4">
              {/* Render microservice cards first */}
              {microservices.map((ms) => (
                <DraggableCard
                  key={ms.id}
                  microservice={ms}
                  onClick={() => onCardClick?.(ms)}
                />
              ))}

              {/* Render generated task cards (only in Backlog) */}
              {generatedTasks.length > 0 && (
                <>
                  {microservices.length > 0 && (
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-amber-300 dark:border-amber-700" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-slate-50 dark:bg-slate-900 px-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                          Next Steps
                        </span>
                      </div>
                    </div>
                  )}
                  {generatedTasks.map((task) => (
                    <NextStepCard
                      key={task.id}
                      task={task}
                      onPromote={onPromoteTask}
                      onDismiss={onDismissTask}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
