/**
 * Database types for Supabase tables
 *
 * Note: Using 'any' for the Database type to avoid Supabase type conflicts.
 * In production, generate proper types from Supabase CLI:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any

export interface User {
  id: string
  github_id: string
  github_username: string
  avatar_url: string | null
  access_token: string
  created_at: string
}

export interface Repository {
  id: string
  user_id: string
  github_repo_id: number
  owner: string
  repo_name: string
  full_name: string
  webhook_id: number | null
  webhook_secret: string | null
  is_active: boolean
  created_at: string
}

export interface Microservice {
  id: string
  repository_id: string
  service_name: string
  manifest_path: string
  status: 'Backlog' | 'In Progress' | 'Testing' | 'Done'
  current_task: string
  progress: number
  last_update: string
  next_steps: string[]
  health_status: 'Healthy' | 'Stale' | 'Inactive' | 'Unknown'
  last_commit_date: string | null
  created_at: string
  updated_at: string
}

export interface CommitSuggestion {
  id: string
  microservice_id: string
  commit_sha: string
  commit_message: string
  parsed_status: string | null
  parsed_next_steps: string[] | null
  suggested_manifest: Record<string, any>
  is_applied: boolean
  created_at: string
}

/**
 * Extended types with relationships
 */

export interface RepositoryWithMicroservices extends Repository {
  microservices: Microservice[]
}

export interface MicroserviceWithRepository extends Microservice {
  repository: Repository
}

export interface CommitSuggestionWithDetails extends CommitSuggestion {
  microservice: MicroserviceWithRepository
}

/**
 * API response types
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/**
 * GitHub webhook payload types
 */

export interface GitHubWebhookPayload {
  ref: string
  repository: {
    id: number
    name: string
    full_name: string
    owner: {
      login: string
    }
  }
  commits: Array<{
    id: string
    message: string
    timestamp: string
    author: {
      name: string
      email: string
    }
    added: string[]
    modified: string[]
    removed: string[]
  }>
  pusher: {
    name: string
    email: string
  }
}

/**
 * Health check result
 */

export interface HealthCheckResult {
  microservice_id: string
  service_name: string
  previous_status: 'Healthy' | 'Stale' | 'Inactive' | 'Unknown'
  new_status: 'Healthy' | 'Stale' | 'Inactive' | 'Unknown'
  last_commit_date: string | null
  days_since_commit: number | null
  checked_at: string
}

export interface HealthCheckSummary {
  total_services: number
  healthy: number
  stale: number
  inactive: number
  unknown: number
  results: HealthCheckResult[]
}
