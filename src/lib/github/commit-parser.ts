import {
  CommitTag,
  ParsedCommit,
  COMMIT_TAG_PATTERNS,
  parseCommitTags,
  tagStatusToServiceStatus,
} from '@/types/commit-tag'
import { VibeManifest } from '@/types/vibe-manifest'
import { generateManifestSuggestion } from '@/types/commit-tag'

/**
 * Parse a GitHub commit into a structured format with extracted tags
 */
export function parseGitHubCommit(commit: {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      email: string
      date: string
    }
  }
}): ParsedCommit {
  const tags = parseCommitTags(commit.commit.message)

  const parsed: ParsedCommit = {
    sha: commit.sha,
    message: commit.commit.message,
    author: {
      name: commit.commit.author.name,
      email: commit.commit.author.email,
      date: commit.commit.author.date,
    },
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
 * Parse multiple commits and return only those with tags
 */
export function parseCommitsWithTags(commits: any[]): ParsedCommit[] {
  return commits
    .map(commit => parseGitHubCommit(commit))
    .filter(parsed => parsed.tags.length > 0)
}

/**
 * Generate manifest update suggestion from parsed commit
 */
export function createManifestSuggestion(
  currentManifest: VibeManifest,
  parsedCommit: ParsedCommit
): VibeManifest {
  const suggestion: VibeManifest = { ...currentManifest }

  // Update status if present
  if (parsedCommit.status) {
    suggestion.status = parsedCommit.status
  }

  // Add next steps if present (merge with existing, no duplicates)
  if (parsedCommit.nextSteps && parsedCommit.nextSteps.length > 0) {
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

  // Update current task if status changed to a different state
  if (parsedCommit.status && parsedCommit.status !== currentManifest.status) {
    // If we have next steps, use the first one as current task
    if (suggestion.nextSteps.length > 0) {
      suggestion.currentTask = suggestion.nextSteps[0]
    }
  }

  return suggestion
}

/**
 * Determine which manifest files might be affected by a commit
 * based on the files changed in the commit
 */
export function getAffectedManifests(
  commit: {
    added: string[]
    modified: string[]
    removed: string[]
  },
  knownManifests: Array<{ path: string; serviceName: string }>
): Array<{ path: string; serviceName: string }> {
  const changedFiles = [
    ...commit.added,
    ...commit.modified,
    ...commit.removed,
  ]

  // If a vibe.json was directly changed, return it
  const directManifestChanges = changedFiles
    .filter(file => file.endsWith('vibe.json'))
    .map(path => {
      const manifest = knownManifests.find(m => m.path === path)
      return manifest || { path, serviceName: path.split('/').slice(-2, -1)[0] || 'Unknown' }
    })

  if (directManifestChanges.length > 0) {
    return directManifestChanges
  }

  // Otherwise, try to infer which service was affected by looking at file paths
  const affectedServices = new Set<string>()

  for (const file of changedFiles) {
    // Try to match file to a service directory
    for (const manifest of knownManifests) {
      const manifestDir = manifest.path.replace('/vibe.json', '')
      if (file.startsWith(manifestDir)) {
        affectedServices.add(manifest.path)
      }
    }
  }

  return knownManifests.filter(m => affectedServices.has(m.path))
}

/**
 * Create a summary of changes from a commit
 */
export function summarizeCommit(parsedCommit: ParsedCommit): string {
  const parts: string[] = []

  if (parsedCommit.status) {
    parts.push(`Status → ${parsedCommit.status}`)
  }

  if (parsedCommit.progress !== undefined) {
    parts.push(`Progress → ${parsedCommit.progress}%`)
  }

  if (parsedCommit.nextSteps && parsedCommit.nextSteps.length > 0) {
    parts.push(`Next: ${parsedCommit.nextSteps.join(', ')}`)
  }

  if (parsedCommit.priority) {
    parts.push(`Priority: ${parsedCommit.priority}`)
  }

  return parts.join(' | ') || 'No changes detected'
}

/**
 * Validate if a commit message has valid tags
 */
export function validateCommitTags(message: string): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  const tags = parseCommitTags(message)

  // Check for valid status values
  const statusTags = tags.filter(t => t.type === 'STATUS')
  for (const tag of statusTags) {
    const status = tagStatusToServiceStatus(tag.value)
    if (!status) {
      errors.push(`Invalid status value: ${tag.value}. Must be BACKLOG, IN_PROGRESS, TESTING, or DONE`)
    }
  }

  // Check for valid progress values
  const progressTags = tags.filter(t => t.type === 'PROGRESS')
  for (const tag of progressTags) {
    const progress = parseInt(tag.value, 10)
    if (isNaN(progress) || progress < 0 || progress > 100) {
      errors.push(`Invalid progress value: ${tag.value}. Must be between 0 and 100`)
    }
  }

  // Warnings for multiple tags of same type
  if (statusTags.length > 1) {
    warnings.push(`Multiple STATUS tags found. Only the first will be used.`)
  }

  if (progressTags.length > 1) {
    warnings.push(`Multiple PROGRESS tags found. Only the first will be used.`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
