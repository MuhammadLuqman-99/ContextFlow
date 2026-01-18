'use client'

import { Microservice, GeneratedTask, KanbanItem } from '@/types/database'
import { ServiceStatus } from '@/types/vibe-manifest'
import { Column } from './Column'
import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import { Card } from './Card'

interface BoardProps {
  microservices: Array<Microservice & { pending_suggestions?: number }>
  onCardClick?: (microservice: Microservice) => void
  onPromoteTask?: (task: GeneratedTask) => void
  onDismissTask?: (task: GeneratedTask) => void
  onStatusChange?: (microserviceId: string, newStatus: ServiceStatus) => Promise<void>
}

/**
 * Extract next steps from Done microservices and create generated tasks
 * These will appear in the In Progress column as next work items
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
        status: 'In Progress',
        is_generated: true,
        created_from_status: 'Done',
      })
    })
  }

  return generatedTasks
}

// Type guard to check if item is a generated task
function isGeneratedTask(item: KanbanItem): item is GeneratedTask {
  return 'is_generated' in item && item.is_generated === true
}

export function Board({ microservices, onCardClick, onPromoteTask, onDismissTask, onStatusChange }: BoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  // Sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  )

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

    // Add generated tasks to In Progress column
    groups['In Progress'].push(...generatedTasks)

    return groups
  }, [microservices, generatedTasks])

  const columns: Array<{ title: string; status: ServiceStatus }> = [
    { title: 'Backlog', status: 'Backlog' },
    { title: 'In Progress', status: 'In Progress' },
    { title: 'Testing', status: 'Testing' },
    { title: 'Done', status: 'Done' },
  ]

  // Find the active item being dragged
  const activeItem = useMemo(() => {
    if (!activeId) return null
    const ms = microservices.find(m => m.id === activeId)
    if (ms) return ms
    return null
  }, [activeId, microservices])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    setOverId(over?.id as string || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)
    setOverId(null)

    if (!over) return

    const activeItemId = active.id as string
    const targetStatus = over.id as ServiceStatus

    // Validate it's a valid status
    const validStatuses: ServiceStatus[] = ['Backlog', 'In Progress', 'Testing', 'Done']
    if (!validStatuses.includes(targetStatus)) return

    // Find the dragged item
    const draggedItem = microservices.find(m => m.id === activeItemId)
    if (!draggedItem) return

    // Skip if same column
    if (draggedItem.status === targetStatus) return

    // Call the status change handler
    if (onStatusChange) {
      await onStatusChange(activeItemId, targetStatus)
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setOverId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
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
            isOver={overId === column.status}
          />
        ))}
      </div>

      {/* Drag Overlay - shows the card being dragged */}
      <DragOverlay>
        {activeItem && !isGeneratedTask(activeItem) ? (
          <div className="opacity-90 rotate-3 scale-105">
            <Card microservice={activeItem} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
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
