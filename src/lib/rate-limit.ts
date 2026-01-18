/**
 * Simple in-memory rate limiter for API routes
 * For production, consider using Redis or Upstash for distributed rate limiting
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (per-process)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowInSeconds: number
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the client (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns RateLimitResult indicating if the request is allowed
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 100, windowInSeconds: 60 }
): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowInSeconds * 1000
  const key = identifier

  let entry = rateLimitStore.get(key)

  // If no entry exists or the window has expired, create a new one
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(key, entry)

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetTime: entry.resetTime,
    }
  }

  // Increment the count
  entry.count++
  rateLimitStore.set(key, entry)

  // Check if limit exceeded
  if (entry.count > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Get client identifier from request
 * Uses X-Forwarded-For header if behind a proxy, otherwise falls back to a default
 */
export function getClientIdentifier(request: Request, userId?: string): string {
  // Prefer user ID if authenticated
  if (userId) {
    return `user:${userId}`
  }

  // Try to get IP from headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return `ip:${forwardedFor.split(',')[0].trim()}`
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return `ip:${realIp}`
  }

  // Fallback to a hash of the user agent
  const userAgent = request.headers.get('user-agent') || 'unknown'
  return `ua:${hashString(userAgent)}`
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Rate limit configurations for different API endpoints
 */
export const rateLimitConfigs = {
  // Default: 100 requests per minute
  default: { limit: 100, windowInSeconds: 60 },

  // Auth endpoints: 10 requests per minute (stricter)
  auth: { limit: 10, windowInSeconds: 60 },

  // GitHub API calls: 30 requests per minute (to avoid GitHub rate limits)
  github: { limit: 30, windowInSeconds: 60 },

  // Webhook endpoints: 60 requests per minute
  webhook: { limit: 60, windowInSeconds: 60 },

  // Heavy operations (scan, apply suggestions): 10 requests per minute
  heavy: { limit: 10, windowInSeconds: 60 },
}

/**
 * Create rate limit headers for the response
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  }
}
