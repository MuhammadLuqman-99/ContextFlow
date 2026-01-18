import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { getMicroserviceById, updateMicroservice } from '@/lib/supabase/queries'
import { createOctokitClient, updateFileContent, getFileContent } from '@/lib/github/octokit'

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
 * POST /api/manifests/[id]/promote
 * Promote a "next step" from a Done service to become the current task
 * This moves the service from "Done" to "In Progress"
 *
 * Body: {
 *   taskTitle: string,
 *   stepIndex: number
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: microserviceId } = await params
    const { user, supabase } = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { taskTitle, stepIndex } = body

    if (!taskTitle || stepIndex === undefined) {
      return NextResponse.json(
        { error: 'taskTitle and stepIndex are required' },
        { status: 400 }
      )
    }

    // Get the microservice
    const microservice = await getMicroserviceById(supabase, microserviceId)

    // Get the repository to verify ownership
    const { data: repository } = await supabase
      .from('repositories')
      .select('*, users!inner(access_token)')
      .eq('id', microservice.repository_id)
      .single()

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (repository.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get the user's access token
    const accessToken = (repository.users as any)?.access_token
    if (!accessToken) {
      return NextResponse.json(
        { error: 'GitHub access token not found' },
        { status: 400 }
      )
    }

    // Create Octokit client
    const octokit = createOctokitClient(accessToken)

    // Get current vibe.json content from GitHub
    const fileResult = await getFileContent(
      octokit,
      repository.owner,
      repository.repo_name,
      microservice.manifest_path
    )

    if (!fileResult.success || !fileResult.content) {
      return NextResponse.json(
        { error: 'Failed to read vibe.json from GitHub' },
        { status: 500 }
      )
    }

    // Parse the current manifest
    let manifest
    try {
      manifest = JSON.parse(fileResult.content)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse vibe.json' },
        { status: 500 }
      )
    }

    // Update the manifest:
    // 1. Set status to "In Progress"
    // 2. Set current task to the promoted task
    // 3. Remove the promoted step from nextSteps
    // 4. Reset progress to 0
    const newNextSteps = Array.isArray(manifest.nextSteps)
      ? manifest.nextSteps.filter((_: string, idx: number) => idx !== stepIndex)
      : []

    const updatedManifest = {
      ...manifest,
      status: 'In Progress',
      currentTask: taskTitle,
      progress: 0,
      lastUpdate: new Date().toISOString(),
      nextSteps: newNextSteps,
    }

    // Update the file on GitHub
    const updateResult = await updateFileContent(
      octokit,
      repository.owner,
      repository.repo_name,
      microservice.manifest_path,
      JSON.stringify(updatedManifest, null, 2) + '\n',
      `[STATUS:IN_PROGRESS] Promote next step: ${taskTitle}`,
      fileResult.sha!
    )

    if (!updateResult.success) {
      return NextResponse.json(
        { error: 'Failed to update vibe.json on GitHub' },
        { status: 500 }
      )
    }

    // Update the local database
    await updateMicroservice(supabase, microserviceId, {
      status: 'In Progress',
      current_task: taskTitle,
      progress: 0,
      last_update: updatedManifest.lastUpdate,
      next_steps: newNextSteps,
    })

    return NextResponse.json({
      success: true,
      data: {
        microservice_id: microserviceId,
        new_status: 'In Progress',
        current_task: taskTitle,
        commit_sha: updateResult.sha,
      },
    })
  } catch (error) {
    console.error('Error promoting task:', error)
    return NextResponse.json(
      {
        error: 'Failed to promote task',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
