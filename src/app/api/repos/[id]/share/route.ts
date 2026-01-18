import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getRepositoryById } from '@/lib/supabase/queries'
import { randomBytes } from 'crypto'

/**
 * GET /api/repos/[id]/share
 * Get the current share link for a repository
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

    // Return current share token if exists
    const shareUrl = repository.share_token
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${repository.share_token}`
      : null

    return NextResponse.json({
      success: true,
      data: {
        share_token: repository.share_token,
        share_url: shareUrl,
      },
    })
  } catch (error) {
    console.error('Error fetching share link:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch share link',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/repos/[id]/share
 * Generate a new share link for a repository
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

    const repository = await getRepositoryById(supabase, params.id)

    // Verify ownership
    if (repository.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Generate a unique share token
    const shareToken = randomBytes(16).toString('hex')

    // Update repository with share token
    const { error: updateError } = await supabase
      .from('repositories')
      .update({ share_token: shareToken })
      .eq('id', params.id)

    if (updateError) {
      throw updateError
    }

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${shareToken}`

    return NextResponse.json({
      success: true,
      data: {
        share_token: shareToken,
        share_url: shareUrl,
      },
    })
  } catch (error) {
    console.error('Error generating share link:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate share link',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/repos/[id]/share
 * Revoke the share link for a repository
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

    const repository = await getRepositoryById(supabase, params.id)

    // Verify ownership
    if (repository.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Remove share token
    const { error: updateError } = await supabase
      .from('repositories')
      .update({ share_token: null })
      .eq('id', params.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Share link revoked',
    })
  } catch (error) {
    console.error('Error revoking share link:', error)
    return NextResponse.json(
      {
        error: 'Failed to revoke share link',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
