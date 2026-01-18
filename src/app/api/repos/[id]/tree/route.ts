import { NextRequest, NextResponse } from 'next/server'
import { getRepositoryById } from '@/lib/supabase/queries'
import { createOctokitClient } from '@/lib/github/octokit'
import { rateLimit, getClientIdentifier, rateLimitConfigs, createRateLimitHeaders } from '@/lib/rate-limit'
import { getUserFromRequest } from '@/lib/auth/helpers'

interface TreeItem {
  path: string
  type: 'blob' | 'tree'
  sha: string
  size?: number
}

/**
 * GET /api/repos/[id]/tree
 * Fetch the file tree structure from GitHub repository
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

    // Get the default branch
    const { data: repoData } = await octokit.rest.repos.get({
      owner: repository.owner,
      repo: repository.repo_name,
    })

    // Get the full tree recursively
    const { data: treeData } = await octokit.rest.git.getTree({
      owner: repository.owner,
      repo: repository.repo_name,
      tree_sha: repoData.default_branch,
      recursive: 'true',
    })

    // Transform tree data into a cleaner format
    const tree: TreeItem[] = treeData.tree
      .filter(item => item.path && item.type && item.sha)
      .map(item => ({
        path: item.path!,
        type: item.type as 'blob' | 'tree',
        sha: item.sha!,
        size: item.size,
      }))
      // Sort: directories first, then files, alphabetically
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'tree' ? -1 : 1
        }
        return a.path.localeCompare(b.path)
      })

    return NextResponse.json({
      success: true,
      data: {
        tree,
        default_branch: repoData.default_branch,
        total_items: tree.length,
        truncated: treeData.truncated || false,
      },
    })
  } catch (error) {
    console.error('Error fetching repository tree:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch repository tree',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
