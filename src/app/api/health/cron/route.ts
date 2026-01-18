import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabase/client'
import { getAllMicroservicesForHealthCheck, updateMicroserviceHealthStatus } from '@/lib/supabase/queries'
import { createOctokitClient, getLatestCommitForPath } from '@/lib/github/octokit'
import { HealthCheckResult, HealthCheckSummary } from '@/types/database'

/**
 * Calculate health status based on days since last commit
 */
function calculateHealthStatus(daysSince: number | null): 'Healthy' | 'Stale' | 'Inactive' | 'Unknown' {
  if (daysSince === null) {
    return 'Unknown'
  }

  if (daysSince < 7) {
    return 'Healthy'
  } else if (daysSince < 30) {
    return 'Stale'
  } else {
    return 'Inactive'
  }
}

/**
 * Calculate days since a date
 */
function daysSince(date: string): number {
  const then = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - then.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * POST /api/health/cron
 * Run health check on all microservices
 *
 * This endpoint should be called by a cron job (Vercel Cron or similar)
 * It checks the last commit date for each microservice and updates the health status
 *
 * For security, you can add a CRON_SECRET to verify the request
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get service role client (bypasses RLS)
    const supabase = getServiceRoleClient()

    // Get all microservices with repository info
    const microservices = await getAllMicroservicesForHealthCheck(supabase)

    const results: HealthCheckResult[] = []
    const errors: Array<{ microservice_id: string; error: string }> = []

    // Process each microservice
    for (const ms of microservices) {
      try {
        // Get user's access token
        const { data: userData } = await supabase
          .from('users')
          .select('access_token')
          .eq('id', ms.repositories.user_id)
          .single() as { data: { access_token: string } | null }

        if (!userData?.access_token) {
          errors.push({
            microservice_id: ms.id,
            error: 'User access token not found',
          })
          continue
        }

        // Create Octokit client
        const octokit = createOctokitClient(userData.access_token)

        // Get latest commit for this manifest path
        const latestCommit = await getLatestCommitForPath(
          octokit,
          ms.repositories.owner,
          ms.repositories.repo_name,
          ms.manifest_path
        )

        let newStatus: 'Healthy' | 'Stale' | 'Inactive' | 'Unknown' = 'Unknown'
        let daysSinceCommit: number | null = null
        let lastCommitDate: string | null = null

        if (latestCommit) {
          lastCommitDate = latestCommit.commit.author?.date || null
          if (lastCommitDate) {
            daysSinceCommit = daysSince(lastCommitDate)
            newStatus = calculateHealthStatus(daysSinceCommit)
          }
        }

        // Update microservice health status
        await updateMicroserviceHealthStatus(
          supabase,
          ms.id,
          newStatus,
          lastCommitDate || undefined
        )

        results.push({
          microservice_id: ms.id,
          service_name: ms.service_name,
          previous_status: ms.health_status,
          new_status: newStatus,
          last_commit_date: lastCommitDate,
          days_since_commit: daysSinceCommit,
          checked_at: new Date().toISOString(),
        })
      } catch (error) {
        console.error(`Error checking health for ${ms.id}:`, error)
        errors.push({
          microservice_id: ms.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Calculate summary
    const summary: HealthCheckSummary = {
      total_services: microservices.length,
      healthy: results.filter(r => r.new_status === 'Healthy').length,
      stale: results.filter(r => r.new_status === 'Stale').length,
      inactive: results.filter(r => r.new_status === 'Inactive').length,
      unknown: results.filter(r => r.new_status === 'Unknown').length,
      results,
    }

    return NextResponse.json({
      success: true,
      message: 'Health check completed',
      summary,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/health/cron
 * Get information about the health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/health/cron',
    method: 'POST',
    description: 'Run health check on all microservices',
    schedule: 'Should be called every 6 hours via cron job',
    authentication: 'Optional CRON_SECRET environment variable',
    example_curl: `curl -X POST ${process.env.NEXT_PUBLIC_APP_URL}/api/health/cron -H "Authorization: Bearer YOUR_CRON_SECRET"`,
  })
}
