import { z } from 'zod'

/**
 * Status types for microservices
 */
export type ServiceStatus = 'Backlog' | 'In Progress' | 'Testing' | 'Done'

/**
 * Health status based on GitHub activity
 */
export type HealthStatus = 'Healthy' | 'Stale' | 'Inactive' | 'Unknown'

/**
 * vibe.json schema for manifest validation
 */
export const VibeManifestSchema = z.object({
  serviceName: z.string().min(1, 'Service name is required'),
  status: z.enum(['Backlog', 'In Progress', 'Testing', 'Done']),
  currentTask: z.string().min(1, 'Current task is required'),
  progress: z.number().min(0).max(100),
  lastUpdate: z.string().datetime(),
  nextSteps: z.array(z.string()),
  dependencies: z.array(z.string()).optional(),
  // Optional metadata
  priority: z.enum(['P1', 'P2', 'P3']).optional(),
  assignee: z.string().optional(),
  estimatedCompletion: z.string().datetime().optional(),
})

/**
 * TypeScript type inferred from Zod schema
 */
export type VibeManifest = z.infer<typeof VibeManifestSchema>

/**
 * Database representation of a microservice
 */
export interface Microservice {
  id: string
  repository_id: string
  service_name: string
  manifest_path: string
  status: ServiceStatus
  current_task: string
  progress: number
  last_update: string
  next_steps: string[]
  health_status: HealthStatus
  last_commit_date: string | null
  created_at: string
  updated_at: string
}

/**
 * Extended microservice with manifest data
 */
export interface MicroserviceWithManifest extends Microservice {
  manifest: VibeManifest
  repository: {
    id: string
    owner: string
    repo_name: string
    full_name: string
  }
}

/**
 * Template for creating new vibe.json files
 */
export interface VibeManifestTemplate {
  serviceName: string
  status: ServiceStatus
  currentTask: string
  progress: number
  nextSteps: string[]
  priority?: 'P1' | 'P2' | 'P3'
}

/**
 * Helper function to create a default manifest
 */
export function createDefaultManifest(serviceName: string): VibeManifest {
  return {
    serviceName,
    status: 'Backlog',
    currentTask: 'Setup initial structure',
    progress: 0,
    lastUpdate: new Date().toISOString(),
    nextSteps: ['Define requirements', 'Create initial files'],
    dependencies: [],
  }
}

/**
 * Validate and parse vibe.json content
 */
export function parseVibeManifest(content: string): {
  success: boolean
  data?: VibeManifest
  error?: string
} {
  try {
    const parsed = JSON.parse(content)
    const result = VibeManifestSchema.safeParse(parsed)

    if (result.success) {
      return { success: true, data: result.data }
    } else {
      return {
        success: false,
        error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON'
    }
  }
}

/**
 * Convert service status to Kanban column
 */
export function statusToColumn(status: ServiceStatus): string {
  const columnMap: Record<ServiceStatus, string> = {
    'Backlog': 'backlog',
    'In Progress': 'in_progress',
    'Testing': 'testing',
    'Done': 'done',
  }
  return columnMap[status]
}

/**
 * Convert column to service status
 */
export function columnToStatus(column: string): ServiceStatus {
  const statusMap: Record<string, ServiceStatus> = {
    'backlog': 'Backlog',
    'in_progress': 'In Progress',
    'testing': 'Testing',
    'done': 'Done',
  }
  return statusMap[column] || 'Backlog'
}
