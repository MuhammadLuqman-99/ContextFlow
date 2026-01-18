import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getRepositoryById, deleteRepository } from '@/lib/supabase/queries'
import { createOctokitClient, deleteWebhook } from '@/lib/github/octokit'

/**
 * GET /api/repos/[id]
 * Get a specific repository by ID
 */
export async function GET(
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

    const repository = await getRepositoryById(supabase, params.id)

    // Verify ownership
    if (repository.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get microservices for this repository
    const { data: microservices } = await supabase
      .from('microservices')
      .select('*')
      .eq('repository_id', params.id)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      success: true,
      data: {
        ...repository,
        microservices: microservices || [],
      },
    })
  } catch (error) {
    console.error('Error fetching repository:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch repository',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/repos/[id]
 * Disconnect a repository and clean up webhook
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

    // Get repository
    const repository = await getRepositoryById(supabase, params.id)

    // Verify ownership
    if (repository.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Delete webhook from GitHub if it exists
    if (repository.webhook_id) {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('access_token')
          .eq('id', user.id)
          .single()

        if (userData?.access_token) {
          const octokit = createOctokitClient(userData.access_token)
          await deleteWebhook(
            octokit,
            repository.owner,
            repository.repo_name,
            repository.webhook_id
          )
        }
      } catch (error) {
        console.error('Failed to delete webhook from GitHub:', error)
        // Continue even if webhook deletion fails
      }
    }

    // Delete repository from database (cascade will delete microservices and suggestions)
    await deleteRepository(supabase, params.id)

    return NextResponse.json({
      success: true,
      message: 'Repository disconnected successfully',
    })
  } catch (error) {
    console.error('Error deleting repository:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete repository',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
