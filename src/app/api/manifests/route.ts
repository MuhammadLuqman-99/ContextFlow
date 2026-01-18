import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getMicroservicesByRepositoryId, getRepositoryById } from '@/lib/supabase/queries'

/**
 * GET /api/manifests?repoId=xxx
 * Get all manifests (microservices) for a repository
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

    // Get microservices
    const microservices = await getMicroservicesByRepositoryId(supabase, repoId)

    // Get pending suggestions for each microservice
    const microservicesWithSuggestions = await Promise.all(
      microservices.map(async (ms) => {
        const { data: suggestions } = await supabase
          .from('commit_suggestions')
          .select('*')
          .eq('microservice_id', ms.id)
          .eq('is_applied', false)
          .order('created_at', { ascending: false })
          .limit(5)

        return {
          ...ms,
          pending_suggestions: suggestions || [],
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: microservicesWithSuggestions,
    })
  } catch (error) {
    console.error('Error fetching manifests:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch manifests',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
