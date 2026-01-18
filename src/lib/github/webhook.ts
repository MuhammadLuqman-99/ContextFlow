import crypto from 'crypto'
import { GitHubWebhookPayload } from '@/types/database'

/**
 * Verify GitHub webhook signature
 * @see https://docs.github.com/en/developers/webhooks-and-events/webhooks/securing-your-webhooks
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature) {
    return false
  }

  // GitHub sends signature as "sha256=<signature>"
  const signatureParts = signature.split('=')
  if (signatureParts.length !== 2 || signatureParts[0] !== 'sha256') {
    return false
  }

  const expectedSignature = signatureParts[1]

  // Calculate HMAC
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const calculatedSignature = hmac.digest('hex')

  // Compare using timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(calculatedSignature, 'hex')
  )
}

/**
 * Parse and validate GitHub push event payload
 */
export function parsePushEvent(payload: any): GitHubWebhookPayload | null {
  try {
    // Validate required fields
    if (!payload.repository || !payload.commits || !Array.isArray(payload.commits)) {
      return null
    }

    return {
      ref: payload.ref,
      repository: {
        id: payload.repository.id,
        name: payload.repository.name,
        full_name: payload.repository.full_name,
        owner: {
          login: payload.repository.owner.login,
        },
      },
      commits: payload.commits.map((commit: any) => ({
        id: commit.id,
        message: commit.message,
        timestamp: commit.timestamp,
        author: {
          name: commit.author.name,
          email: commit.author.email,
        },
        added: commit.added || [],
        modified: commit.modified || [],
        removed: commit.removed || [],
      })),
      pusher: {
        name: payload.pusher.name,
        email: payload.pusher.email,
      },
    }
  } catch (error) {
    console.error('Error parsing push event:', error)
    return null
  }
}

/**
 * Check if push is to main/master branch
 */
export function isMainBranch(ref: string): boolean {
  const branch = ref.replace('refs/heads/', '')
  return branch === 'main' || branch === 'master'
}

/**
 * Extract branch name from ref
 */
export function extractBranchName(ref: string): string {
  return ref.replace('refs/heads/', '')
}

/**
 * Generate a secure webhook secret
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Check if commit affects vibe.json files
 */
export function commitAffectsManifests(commit: {
  added: string[]
  modified: string[]
  removed: string[]
}): boolean {
  const allFiles = [...commit.added, ...commit.modified, ...commit.removed]
  return allFiles.some(file => file.endsWith('vibe.json'))
}

/**
 * Extract vibe.json paths from commit
 */
export function extractManifestPaths(commit: {
  added: string[]
  modified: string[]
  removed: string[]
}): string[] {
  const allFiles = [...commit.added, ...commit.modified]
  return allFiles.filter(file => file.endsWith('vibe.json'))
}

/**
 * Webhook event types we care about
 */
export type WebhookEvent = 'push' | 'ping' | 'unknown'

/**
 * Determine webhook event type from headers
 */
export function getWebhookEventType(eventHeader: string | null): WebhookEvent {
  if (!eventHeader) {
    return 'unknown'
  }

  switch (eventHeader.toLowerCase()) {
    case 'push':
      return 'push'
    case 'ping':
      return 'ping'
    default:
      return 'unknown'
  }
}

/**
 * Create response for webhook ping event
 */
export function createPingResponse() {
  return {
    message: 'Webhook received! ContextFlow is ready to track your commits.',
    timestamp: new Date().toISOString(),
  }
}

/**
 * Webhook processing result
 */
export interface WebhookProcessingResult {
  success: boolean
  message: string
  suggestions_created?: number
  errors?: string[]
}
