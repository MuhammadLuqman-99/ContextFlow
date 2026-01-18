import { z } from 'zod'
import { ServiceStatus } from './vibe-manifest'

/**
 * Supported commit tag types
 */
export type CommitTagType = 'STATUS' | 'NEXT' | 'PROGRESS' | 'PRIORITY'

/**
 * Parsed commit tag structure
 */
export interface CommitTag {
  type: CommitTagType
  value: string
  raw: string
}

/**
 * Parsed commit with extracted tags
 */
export interface ParsedCommit {
  sha: string
  message: string
  author: {
    name: string
    email: string
    date: string
  }
  tags: CommitTag[]
  // Extracted values
  status?: ServiceStatus
  nextSteps?: string[]
  progress?: number
  priority?: 'P1' | 'P2' | 'P3'
}

/**
 * Commit suggestion for manifest update
 */
export interface CommitSuggestion {
  id: string
  microservice_id: string
  commit_sha: string
  commit_message: string
  parsed_status: ServiceStatus | null
  parsed_next_steps: string[] | null
  suggested_manifest: Record<string, any>
  is_applied: boolean
  created_at: string
}

/**
 * Extended commit suggestion with microservice data
 */
export interface CommitSuggestionWithMicroservice extends CommitSuggestion {
  microservice: {
    id: string
    service_name: string
    manifest_path: string
    current_status: ServiceStatus
  }
}

/**
 * Regex patterns for commit tag parsing
 */
export const COMMIT_TAG_PATTERNS = {
  STATUS: /\[STATUS:(BACKLOG|IN_PROGRESS|TESTING|DONE)\]/gi,
  NEXT: /\[NEXT:([^\]]+)\]/gi,
  PROGRESS: /\[PROGRESS:(\d{1,3})\]/gi,
  PRIORITY: /\[PRIORITY:(P[123])\]/gi,
} as const

/**
 * Parse commit message to extract tags
 */
export function parseCommitTags(message: string): CommitTag[] {
  const tags: CommitTag[] = []

  // Parse STATUS tags
  const statusMatches = message.matchAll(COMMIT_TAG_PATTERNS.STATUS)
  for (const match of statusMatches) {
    tags.push({
      type: 'STATUS',
      value: match[1],
      raw: match[0],
    })
  }

  // Parse NEXT tags
  const nextMatches = message.matchAll(COMMIT_TAG_PATTERNS.NEXT)
  for (const match of nextMatches) {
    tags.push({
      type: 'NEXT',
      value: match[1].trim(),
      raw: match[0],
    })
  }

  // Parse PROGRESS tags
  const progressMatches = message.matchAll(COMMIT_TAG_PATTERNS.PROGRESS)
  for (const match of progressMatches) {
    tags.push({
      type: 'PROGRESS',
      value: match[1],
      raw: match[0],
    })
  }

  // Parse PRIORITY tags
  const priorityMatches = message.matchAll(COMMIT_TAG_PATTERNS.PRIORITY)
  for (const match of priorityMatches) {
    tags.push({
      type: 'PRIORITY',
      value: match[1],
      raw: match[0],
    })
  }

  return tags
}

/**
 * Convert commit tag status to ServiceStatus
 */
export function tagStatusToServiceStatus(tagStatus: string): ServiceStatus | undefined {
  const statusMap: Record<string, ServiceStatus> = {
    'BACKLOG': 'Backlog',
    'IN_PROGRESS': 'In Progress',
    'TESTING': 'Testing',
    'DONE': 'Done',
  }
  return statusMap[tagStatus.toUpperCase()]
}

/**
 * Extract structured data from commit message
 */
export function parseCommitMessage(
  sha: string,
  message: string,
  author: { name: string; email: string; date: string }
): ParsedCommit {
  const tags = parseCommitTags(message)

  const parsed: ParsedCommit = {
    sha,
    message,
    author,
    tags,
  }

  // Extract status
  const statusTag = tags.find(t => t.type === 'STATUS')
  if (statusTag) {
    parsed.status = tagStatusToServiceStatus(statusTag.value)
  }

  // Extract next steps
  const nextTags = tags.filter(t => t.type === 'NEXT')
  if (nextTags.length > 0) {
    parsed.nextSteps = nextTags.map(t => t.value)
  }

  // Extract progress
  const progressTag = tags.find(t => t.type === 'PROGRESS')
  if (progressTag) {
    const progress = parseInt(progressTag.value, 10)
    if (progress >= 0 && progress <= 100) {
      parsed.progress = progress
    }
  }

  // Extract priority
  const priorityTag = tags.find(t => t.type === 'PRIORITY')
  if (priorityTag) {
    parsed.priority = priorityTag.value as 'P1' | 'P2' | 'P3'
  }

  return parsed
}

/**
 * Generate suggested manifest updates from parsed commit
 */
export function generateManifestSuggestion(
  currentManifest: Record<string, any>,
  parsedCommit: ParsedCommit
): Record<string, any> {
  const suggestion = { ...currentManifest }

  // Update status if present
  if (parsedCommit.status) {
    suggestion.status = parsedCommit.status
  }

  // Add next steps if present
  if (parsedCommit.nextSteps && parsedCommit.nextSteps.length > 0) {
    // Merge with existing next steps, avoiding duplicates
    const existingSteps = new Set(suggestion.nextSteps || [])
    parsedCommit.nextSteps.forEach(step => existingSteps.add(step))
    suggestion.nextSteps = Array.from(existingSteps)
  }

  // Update progress if present
  if (parsedCommit.progress !== undefined) {
    suggestion.progress = parsedCommit.progress
  }

  // Update priority if present
  if (parsedCommit.priority) {
    suggestion.priority = parsedCommit.priority
  }

  // Update lastUpdate timestamp
  suggestion.lastUpdate = new Date().toISOString()

  return suggestion
}

/**
 * Check if commit message has any tags
 */
export function hasCommitTags(message: string): boolean {
  return parseCommitTags(message).length > 0
}

/**
 * Format commit message with tags (for examples/documentation)
 */
export function formatCommitExample(message: string, tags: {
  status?: ServiceStatus
  next?: string[]
  progress?: number
  priority?: 'P1' | 'P2' | 'P3'
}): string {
  let formatted = message

  if (tags.status) {
    const statusTag = tags.status.toUpperCase().replace(/ /g, '_')
    formatted += ` [STATUS:${statusTag}]`
  }

  if (tags.next) {
    tags.next.forEach(step => {
      formatted += ` [NEXT:${step}]`
    })
  }

  if (tags.progress !== undefined) {
    formatted += ` [PROGRESS:${tags.progress}]`
  }

  if (tags.priority) {
    formatted += ` [PRIORITY:${tags.priority}]`
  }

  return formatted
}
