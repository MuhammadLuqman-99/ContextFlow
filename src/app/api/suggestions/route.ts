import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { getRepositoryById } from '@/lib/supabase/queries'

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
 * GET /api/suggestions?repoId=xxx
 * Get all pending suggestions for a repository
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
