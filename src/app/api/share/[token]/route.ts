import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/share/[token]
 * Get shared dashboard data by token (public endpoint)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createServerSupabaseClient()

    // Find repository by share token
    const { data: repository, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('share_token', params.token)
      .eq('is_active', true)
      .single()

    if (repoError || !repository) {
      return NextResponse.json(
        { error: 'Shared dashboard not found or link has expired' },
        { status: 404 }
      )
    }

    // Get microservices for this repository
    const { data: microservices, error: msError } = await supabase
      .from('microservices')
      .select('*')
      .eq('repository_id', repository.id)
      .order('service_name', { ascending: true })

    if (msError) {
      throw msError
    }

    // Get owner info (public info only)
    const { data: user } = await supabase
      .from('users')
      .select('avatar_url, github_username')
      .eq('id', repository.user_id)
      .single()

    return NextResponse.json({
      success: true,
      data: {
        repository: {
          id: repository.id,
          owner: repository.owner,
          repo_name: repository.repo_name,
          full_name: repository.full_name,
          created_at: repository.created_at,
        },
        microservices: microservices || [],
        owner: {
          avatar_url: user?.avatar_url,
          user_name: user?.github_username,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching shared dashboard:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch shared dashboard',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
