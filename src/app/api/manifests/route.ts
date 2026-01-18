import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { getMicroservicesByRepositoryId, getRepositoryById } from '@/lib/supabase/queries'

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
 * GET /api/manifests?repoId=xxx
 * Get all manifests (microservices) for a repository
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request)

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
