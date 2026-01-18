import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getMicroserviceById, updateMicroservice } from '@/lib/supabase/queries'
import { ServiceStatus } from '@/types/vibe-manifest'

/**
 * PUT /api/manifests/[id]
 * Update a microservice/manifest
 *
 * Body: {
 *   status?: ServiceStatus
 *   current_task?: string
 *   progress?: number
 *   next_steps?: string[]
 * }
 */
export async function PUT(
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

    // Get microservice
    const microservice = await getMicroserviceById(supabase, params.id)

    // Verify ownership through repository
    const { data: repository } = await supabase
      .from('repositories')
      .select('user_id')
      .eq('id', microservice.repository_id)
      .single()

    if (!repository || repository.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const updates: any = {}

    if (body.status) {
      updates.status = body.status as ServiceStatus
    }

    if (body.current_task !== undefined) {
      updates.current_task = body.current_task
    }

    if (body.progress !== undefined) {
      if (typeof body.progress !== 'number' || body.progress < 0 || body.progress > 100) {
        return NextResponse.json(
          { error: 'Progress must be a number between 0 and 100' },
          { status: 400 }
        )
      }
      updates.progress = body.progress
    }

    if (body.next_steps !== undefined) {
      if (!Array.isArray(body.next_steps)) {
        return NextResponse.json(
          { error: 'next_steps must be an array' },
          { status: 400 }
        )
      }
      updates.next_steps = body.next_steps
    }

    // Always update last_update timestamp
    updates.last_update = new Date().toISOString()

    // Update microservice
    const updated = await updateMicroservice(supabase, params.id, updates)

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('Error updating manifest:', error)
    return NextResponse.json(
      {
        error: 'Failed to update manifest',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/manifests/[id]
 * Get a specific microservice by ID
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

    // Get microservice with repository info
    const { data: microservice } = await supabase
      .from('microservices')
      .select(`
        *,
        repositories (
          id,
          owner,
          repo_name,
          full_name,
          user_id
        )
      `)
      .eq('id', params.id)
      .single()

    if (!microservice) {
      return NextResponse.json(
        { error: 'Microservice not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (microservice.repositories.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get pending suggestions
    const { data: suggestions } = await supabase
      .from('commit_suggestions')
      .select('*')
      .eq('microservice_id', params.id)
      .eq('is_applied', false)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      success: true,
      data: {
        ...microservice,
        pending_suggestions: suggestions || [],
      },
    })
  } catch (error) {
    console.error('Error fetching manifest:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch manifest',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
