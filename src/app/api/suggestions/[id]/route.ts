import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { applySuggestion, dismissSuggestion, updateMicroservice } from '@/lib/supabase/queries'
import { createOctokitClient } from '@/lib/github/octokit'
import { updateManifestOnGitHub } from '@/lib/github/manifest-reader'
import { VibeManifest } from '@/types/vibe-manifest'

/**
 * POST /api/suggestions/[id]/apply
 * Apply a commit suggestion - updates both database and GitHub manifest
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get suggestion with microservice and repository info
    const { data: suggestion, error: suggestionError } = await supabase
      .from('commit_suggestions')
      .select(`
        *,
        microservices (
          id,
          repository_id,
          service_name,
          manifest_path,
          repositories (
            id,
            owner,
            repo_name,
            user_id
          )
        )
      `)
      .eq('id', params.id)
      .single()

    if (suggestionError || !suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (suggestion.microservices.repositories.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if already applied
    if (suggestion.is_applied) {
      return NextResponse.json(
        { error: 'Suggestion already applied' },
        { status: 400 }
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

    // Update manifest on GitHub
    const suggestedManifest = suggestion.suggested_manifest as VibeManifest
    const commitMessage = `Update ${suggestedManifest.serviceName} manifest

Applied suggestion from commit: ${suggestion.commit_sha.slice(0, 7)}
${suggestion.commit_message}

[AUTO-UPDATE by ContextFlow]`

    const updateResult = await updateManifestOnGitHub(
      octokit,
      suggestion.microservices.repositories.owner,
      suggestion.microservices.repositories.repo_name,
      suggestion.microservices.manifest_path,
      suggestedManifest,
      commitMessage
    )

    if (!updateResult.success) {
      return NextResponse.json(
        {
          error: 'Failed to update manifest on GitHub',
          details: updateResult.error,
        },
        { status: 500 }
      )
    }

    // Update microservice in database
    await updateMicroservice(supabase, suggestion.microservices.id, {
      status: suggestedManifest.status,
      current_task: suggestedManifest.currentTask,
      progress: suggestedManifest.progress,
      last_update: suggestedManifest.lastUpdate,
      next_steps: suggestedManifest.nextSteps,
    })

    // Mark suggestion as applied
    const appliedSuggestion = await applySuggestion(supabase, params.id)

    return NextResponse.json({
      success: true,
      data: appliedSuggestion,
      message: 'Suggestion applied successfully',
    })
  } catch (error) {
    console.error('Error applying suggestion:', error)
    return NextResponse.json(
      {
        error: 'Failed to apply suggestion',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/suggestions/[id]
 * Dismiss a commit suggestion
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get suggestion with microservice and repository info
    const { data: suggestion } = await supabase
      .from('commit_suggestions')
      .select(`
        *,
        microservices (
          repositories (
            user_id
          )
        )
      `)
      .eq('id', params.id)
      .single()

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (suggestion.microservices.repositories.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Dismiss suggestion
    await dismissSuggestion(supabase, params.id)

    return NextResponse.json({
      success: true,
      message: 'Suggestion dismissed',
    })
  } catch (error) {
    console.error('Error dismissing suggestion:', error)
    return NextResponse.json(
      {
        error: 'Failed to dismiss suggestion',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
