import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getRepositoryById } from '@/lib/supabase/queries'

/**
 * GET /api/suggestions?repoId=xxx
 * Get all pending suggestions for a repository
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get repoId from query params
    const { searchParams } = new URL(request.url)
    const repoId = searchParams.get('repoId')

    if (!repoId) {
      return NextResponse.json(
        { error: 'repoId query parameter is required' },
        { status: 400 }
      )
    }

    // Verify repository ownership
    const repository = await getRepositoryById(supabase, repoId)

    if (repository.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // First, get microservice IDs for this repository
    const { data: microservices } = await supabase
      .from('microservices')
      .select('id')
      .eq('repository_id', repoId)

    const microserviceIds = microservices?.map(ms => ms.id) || []

    if (microserviceIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    // Get all pending suggestions for this repository's microservices
    const { data: suggestions, error } = await supabase
      .from('commit_suggestions')
      .select(`
        *,
        microservices (
          id,
          service_name,
          manifest_path,
          status,
          current_task,
          progress
        )
      `)
      .eq('is_applied', false)
      .in('microservice_id', microserviceIds)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: suggestions || [],
    })
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch suggestions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
