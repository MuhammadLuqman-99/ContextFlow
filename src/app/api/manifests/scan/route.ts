import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { getRepositoryById, getMicroserviceByManifestPath, createMicroservice } from '@/lib/supabase/queries'
import { createOctokitClient, getLatestCommitForPath } from '@/lib/github/octokit'
import { scanRepositoryForManifests } from '@/lib/github/manifest-reader'

// Calculate health status based on last commit date
function calculateHealthStatus(lastCommitDate: string | null): 'Healthy' | 'Stale' | 'Inactive' | 'Unknown' {
  if (!lastCommitDate) return 'Unknown'

  const commitDate = new Date(lastCommitDate)
  const now = new Date()
  const daysSince = Math.floor((now.getTime() - commitDate.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSince < 7) return 'Healthy'
  if (daysSince < 30) return 'Stale'
  return 'Inactive'
}

// Helper to get user from request (supports both cookie auth and Authorization header)
async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    const { data: { user } } = await supabase.auth.getUser(token)
    return { user, supabase }
  }
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { user, supabase }
}

/**
 * POST /api/manifests/scan
 * Manually scan a repository for vibe.json manifests
 *
 * Body: {
 *   repoId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { repoId } = body

    if (!repoId) {
      return NextResponse.json(
        { error: 'repoId is required' },
        { status: 400 }
      )
    }

    // Get repository
    const repository = await getRepositoryById(supabase, repoId)

    // Verify ownership
    if (repository.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get user's access token
    const { data: userData } = await supabase
      .from('users')
      .select('access_token')
      .eq('id', user.id)
      .single()

    if (!userData?.access_token) {
      return NextResponse.json(
        { error: 'GitHub access token not found' },
        { status: 400 }
      )
    }

    // Create Octokit client
    const octokit = createOctokitClient(userData.access_token)

    // Scan repository for manifests
    const scanResult = await scanRepositoryForManifests(
      octokit,
      repository.owner,
      repository.repo_name
    )

    if (!scanResult.success) {
      return NextResponse.json(
        {
          error: 'Failed to scan repository',
          details: scanResult.errors,
        },
        { status: 500 }
      )
    }

    const created: string[] = []
    const updated: string[] = []
    const errors: Array<{ path: string; error: string }> = []

    // Process each manifest found
    if (scanResult.manifests) {
      for (const { path, manifest } of scanResult.manifests) {
        try {
          // Get last commit for this manifest path
          const lastCommit = await getLatestCommitForPath(
            octokit,
            repository.owner,
            repository.repo_name,
            path
          )

          const lastCommitDate = lastCommit?.commit?.author?.date || null
          const healthStatus = calculateHealthStatus(lastCommitDate)

          // Check if microservice already exists
          const existing = await getMicroserviceByManifestPath(
            supabase,
            repository.id,
            path
          )

          if (existing) {
            // Update existing microservice
            await supabase
              .from('microservices')
              .update({
                service_name: manifest.serviceName,
                status: manifest.status,
                current_task: manifest.currentTask,
                progress: manifest.progress,
                last_update: manifest.lastUpdate,
                next_steps: manifest.nextSteps,
                health_status: healthStatus,
                last_commit_date: lastCommitDate,
              })
              .eq('id', existing.id)

            updated.push(path)
          } else {
            // Create new microservice
            await createMicroservice(supabase, {
              repository_id: repository.id,
              service_name: manifest.serviceName,
              manifest_path: path,
              status: manifest.status,
              current_task: manifest.currentTask,
              progress: manifest.progress,
              last_update: manifest.lastUpdate,
              next_steps: manifest.nextSteps,
              health_status: healthStatus,
              last_commit_date: lastCommitDate,
            })

            created.push(path)
          }
        } catch (error) {
          console.error(`Error processing manifest ${path}:`, error)
          errors.push({
            path,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total_found: scanResult.manifests?.length || 0,
        created: created.length,
        updated: updated.length,
        created_paths: created,
        updated_paths: updated,
        errors: errors.length > 0 ? errors : undefined,
        scan_errors: scanResult.errors,
      },
    })
  } catch (error) {
    console.error('Error scanning repository:', error)
    return NextResponse.json(
      {
        error: 'Failed to scan repository',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
