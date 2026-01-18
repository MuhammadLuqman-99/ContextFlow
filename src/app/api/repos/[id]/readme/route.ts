import { NextRequest, NextResponse } from 'next/server'
import { getRepositoryById } from '@/lib/supabase/queries'
import { createOctokitClient, getFileContent } from '@/lib/github/octokit'
import { rateLimit, getClientIdentifier, rateLimitConfigs, createRateLimitHeaders } from '@/lib/rate-limit'
import { getUserFromRequest } from '@/lib/auth/helpers'

/**
 * GET /api/repos/[id]/readme
 * Fetch README.md from the GitHub repository
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, supabase } = await getUserFromRequest(request)

    // Apply rate limiting
    const clientId = getClientIdentifier(request, user?.id)
    const rateLimitResult = rateLimit(clientId, rateLimitConfigs.github)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      )
    }

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

    // Get user's GitHub access token
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

    const octokit = createOctokitClient(userData.access_token)

    // Try to fetch README.md (try different common names)
    const readmeNames = ['README.md', 'readme.md', 'Readme.md', 'README.MD', 'README', 'readme']

    for (const readmeName of readmeNames) {
      const result = await getFileContent(
        octokit,
        repository.owner,
        repository.repo_name,
        readmeName
      )

      if (result.success && result.content) {
        return NextResponse.json({
          success: true,
          data: {
            content: result.content,
            path: result.path,
            sha: result.sha,
          },
        })
      }
    }

    // No README found
    return NextResponse.json({
      success: true,
      data: {
        content: null,
        message: 'No README.md found in repository',
      },
    })
  } catch (error) {
    console.error('Error fetching README:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch README',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
