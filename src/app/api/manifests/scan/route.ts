import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getRepositoryById, getMicroserviceByManifestPath, createMicroservice } from '@/lib/supabase/queries'
import { createOctokitClient } from '@/lib/github/octokit'
import { scanRepositoryForManifests } from '@/lib/github/manifest-reader'

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
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

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
              health_status: 'Unknown',
              last_commit_date: null,
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
